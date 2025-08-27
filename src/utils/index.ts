import { getDMMF } from "@prisma/internals";

import * as fs from "fs";
import * as path from "path";
import { SchemaInformation } from "../interfaces";

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
    const resolvedPath = path.resolve(schemaPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Schema file not found at: ${resolvedPath}`);
    }

    const schema = fs.readFileSync(resolvedPath, "utf-8");
    const dmmf = await getDMMF({ datamodel: schema });

    return {
      models: [...dmmf.datamodel.models],
      enums: [...dmmf.datamodel.enums],
    };
  } catch (error) {
    console.error("Failed to extract schema:", error);
    throw new Error("Could not process Prisma schema.");
  }
}
