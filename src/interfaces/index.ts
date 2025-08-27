import type { DMMF } from "@prisma/generator-helper";

/**
 * Represents the structured data extracted from the Prisma schema.
 */
export interface SchemaInformation {
  models: DMMF.Model[];
  enums: DMMF.DatamodelEnum[];
}
