import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCHEMA_URL } from "../constants";

/**
 * Configuration interface for type mappings
 */
export interface PrismaExtractorConfig {
  $schema: string;
  outputType: "type" | "interface";
  enumOutputType: "enum" | "type";
  outputFile: string;
  prismaSchema: string;
  generateMetadata: boolean;
  /**
   * When true, relation fields (kind: "object") will be marked as optional in the generated types.
   * This helps when using the types to type request bodies for create/update operations,
   * so you are not forced to send nested relation objects/arrays.
   */
  relationFieldsOptional?: boolean;
  mapTypes: Record<string, string>;
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

  // Validate enumOutputType
  const validEnumOutputTypes = ["enum", "type"];
  if (!config.enumOutputType || typeof config.enumOutputType !== "string") {
    errors.push("enumOutputType must be a string.");
  } else if (!validEnumOutputTypes.includes(config.enumOutputType)) {
    errors.push(
      `enumOutputType must be one of the following: ${validEnumOutputTypes.join(
        ", "
      )}.`
    );
  }

  // Check for unexpected properties
  const allowedKeys = [
    "mapTypes",
    "outputType",
    "enumOutputType",
    "outputFile",
    "prismaSchema",
    "generateMetadata",
    "$schema",
    "relationFieldsOptional",
  ];
  for (const key in config) {
    if (!allowedKeys.includes(key)) {
      errors.push(`Unexpected property: ${key}.`);
    }
  }

  // Validate relationFieldsOptional when present
  if (
    Object.prototype.hasOwnProperty.call(config, "relationFieldsOptional") &&
    typeof config.relationFieldsOptional !== "boolean"
  ) {
    errors.push("relationFieldsOptional must be a boolean if provided.");
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
  BigInt: "bigint",
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
        $schema: SCHEMA_URL,
        outputType: userConfig.outputType || "interface",
        enumOutputType: userConfig.enumOutputType || "enum",
        outputFile: userConfig.outputFile || "./src/interfaces/database.ts",
        prismaSchema: userConfig.prismaSchema || "./prisma/schema.prisma",
        generateMetadata: userConfig.generateMetadata ?? false,
  relationFieldsOptional: userConfig.relationFieldsOptional ?? true,
        mapTypes: {
          ...DEFAULT_TYPE_MAPPINGS,
          ...userConfig.mapTypes,
        },
      };
    } catch (error) {
      console.error("🟥 Failed to load or validate config file:", error);
      throw new Error(
        "Could not load configuration file. Please check the file format and content."
      );
    }
  }

  return {
    $schema: SCHEMA_URL,
    outputType: "interface",
    enumOutputType: "enum",
    outputFile: "./src/interfaces/database.ts",
    prismaSchema: "./prisma/schema.prisma",
    generateMetadata: false,
  relationFieldsOptional: true,
    mapTypes: DEFAULT_TYPE_MAPPINGS,
  };
}

/**
 * Generates a default configuration file
 */
export function generateConfigFile(configPath?: string): void {
  const configFilePath =
    configPath || resolve(process.cwd(), "prisma-extractor.json");
  const defaultConfig: PrismaExtractorConfig = {
    $schema: SCHEMA_URL,
    outputType: "interface",
    enumOutputType: "enum",
    outputFile: "./src/interfaces/database.ts",
    prismaSchema: "./prisma/schema.prisma",
    generateMetadata: false,
  relationFieldsOptional: true,
    mapTypes: DEFAULT_TYPE_MAPPINGS,
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
