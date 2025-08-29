import type { DMMF } from "@prisma/generator-helper";
import { getDMMF } from "@prisma/internals";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SchemaInformation } from "../interfaces";

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
