import type { DMMF } from "@prisma/generator-helper";
import { getDMMF } from "@prisma/internals";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEMA_URL } from "../constants";
import type { SchemaInformation } from "../interfaces";

/**
 * Configuration interface for type mappings
 */
export interface PrismaExtractorConfig {
  $schema: string;
  mapTypes: Record<string, string>;
  outputType: "type" | "interface";
  outputFile: string;
  prismaSchema: string;
}

/**
 * Validates the configuration object structure and values
 */
export function validateConfig(
  config: any
): asserts config is PrismaExtractorConfig {
  const errors: string[] = [];

  // Validate mapTypes
  if (!config.mapTypes || typeof config.mapTypes !== "object") {
    errors.push("mapTypes need to be an object.");
  } else {
    for (const [key, value] of Object.entries(config.mapTypes)) {
      if (typeof value !== "string") {
        errors.push(`mapTypes.${key} must be a string.`);
      }
    }
  }

  // Validate outputType
  const validOutputTypes = ["interface", "type"];
  if (!config.outputType || typeof config.outputType !== "string") {
    errors.push("outputType must be a string.");
  } else if (!validOutputTypes.includes(config.outputType)) {
    errors.push(
      `outputType must be one of the following: ${validOutputTypes.join(", ")}.`
    );
  }

  // Check for unexpected properties
  const allowedKeys = [
    "mapTypes",
    "outputType",
    "outputFile",
    "prismaSchema",
    "$schema",
  ];
  for (const key in config) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Propriedade inesperada: ${key}.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join("; ")}`);
  }
}

/**
 * Default type mappings from Prisma to TypeScript
 */
const DEFAULT_TYPE_MAPPINGS: Record<string, string> = {
  String: "string",
  Int: "number",
  Float: "number",
  BigInt: "BigInt",
  Boolean: "boolean",
  DateTime: "Date",
  Json: "string",
  Decimal: "number",
  Bytes: "Buffer",
  Unsupported: "unknown",
};

/**
 * Loads the configuration file if it exists, otherwise returns defaults
 */
export function loadConfig(configPath?: string): PrismaExtractorConfig {
  const configFilePath =
    configPath || resolve(process.cwd(), "prisma-extractor.json");

  if (existsSync(configFilePath)) {
    try {
      const configContent = readFileSync(configFilePath, "utf-8");
      const userConfig = JSON.parse(
        configContent
      ) as Partial<PrismaExtractorConfig>;

      // Validate the loaded config
      validateConfig(userConfig);

      return {
        mapTypes: {
          ...DEFAULT_TYPE_MAPPINGS,
          ...userConfig.mapTypes,
        },
        outputType: userConfig.outputType || "interface",
        outputFile: userConfig.outputFile || "./src/interfaces/database.ts",
        prismaSchema: userConfig.prismaSchema || "./prisma/schema.prisma",
        $schema: SCHEMA_URL,
      };
    } catch (error) {
      console.error("🟥 Failed to load or validate config file:", error);
      throw new Error(
        "Could not load configuration file. Please check the file format and content."
      );
    }
  }

  return {
    mapTypes: DEFAULT_TYPE_MAPPINGS,
    outputType: "interface",
    outputFile: "./src/interfaces/database.ts",
    prismaSchema: "./prisma/schema.prisma",
    $schema: SCHEMA_URL,
  };
}

/**
 * Generates a default configuration file
 */
export function generateConfigFile(configPath?: string): void {
  const configFilePath =
    configPath || resolve(process.cwd(), "prisma-extractor.json");
  const defaultConfig: PrismaExtractorConfig = {
    mapTypes: DEFAULT_TYPE_MAPPINGS,
    outputType: "interface",
    outputFile: "./src/interfaces/database.ts",
    prismaSchema: "./prisma/schema.prisma",
    $schema: SCHEMA_URL,
  };

  try {
    writeFileSync(
      configFilePath,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8"
    );
    console.log(`✅ Configuration file created at: ${configFilePath}`);
    console.log("You can now edit this file to customize type mappings.");
  } catch (error) {
    console.error("🟥 Failed to create config file:", error);
    throw new Error("Could not create configuration file.");
  }
}

/**
 * Extracts models and enums from a Prisma schema file.
 *
 * @param schemaPath - The absolute or relative path to the schema.prisma file.
 * @returns A promise that resolves to an object containing the extracted models and enums.
 * @throws An error if the schema file cannot be read or parsed.
 */
export async function extractSchema(
  schemaPath: string
): Promise<SchemaInformation> {
  try {
    const resolvedPath = resolve(schemaPath);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Schema file not found at: ${resolvedPath}`);
    }

    const schema = readFileSync(resolvedPath, "utf-8");
    const dmmf = await getDMMF({ datamodel: schema });

    return {
      models: [...dmmf.datamodel.models],
      enums: [...dmmf.datamodel.enums],
    };
  } catch (error) {
    console.error("🟥 Failed to extract schema:\n", error);
    throw new Error("Could not process Prisma schema.");
  }
}

function mapPrismaTypeToTsType(
  prismaType: string,
  config: PrismaExtractorConfig
): string {
  return config.mapTypes[prismaType] || prismaType;
}

export function generateTsInterfaces(
  models: DMMF.Model[],
  enums: DMMF.DatamodelEnum[],
  configPath?: string
): string {
  const config = loadConfig(configPath);
  let content = `// This file is auto-generated by sc-prisma-extractor.\n// Do not edit this file directly.\n\n`;

  // Generate Enums
  enums.forEach((enumDef: DMMF.DatamodelEnum) => {
    content += `export enum ${enumDef.name} {
`;
    enumDef.values.forEach((value: DMMF.EnumValue) => {
      content += `  ${value.name} = "${value.name}",
`;
    });
    content += `}

`;
  });

  // Generate Interfaces or Types
  models.forEach((model: DMMF.Model) => {
    const keyword = config.outputType === "type" ? "type" : "interface";
    const separator = config.outputType === "type" ? " =" : "";
    content += `export ${keyword} ${model.name}${separator} {
`;
    model.fields.forEach((field: DMMF.Field) => {
      const tsType = mapPrismaTypeToTsType(field.type, config);
      const isOptional = !field.isRequired;
      const isList = field.isList;
      content += `  ${field.name}${isOptional ? "?" : ""}: ${tsType}${
        isList ? "[]" : ""
      };
`;
    });
    content += `}

`;
  });

  return content;
}
