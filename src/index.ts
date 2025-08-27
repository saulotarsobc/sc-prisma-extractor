import * as path from "path";
import { extractSchema } from "./utils/index";

async function main() {
  try {
    const schemaPath = path.join(__dirname, "prism", "schema.prisma");
    const { models, enums } = await extractSchema(schemaPath);

    console.log("--- Models ---");
    models.forEach((model) => {
      console.log(`Model: ${model.name}`);
      model.fields.forEach((field) => {
        console.log(
          `  - ${field.name}: ${field.type}${field.isList ? "[]" : ""}${
            !field.isRequired ? "?" : ""
          }`
        );
      });
    });

    console.log("\n--- Enums ---");
    enums.forEach((enumDef) => {
      console.log(`Enum: ${enumDef.name}`);
      enumDef.values.forEach((value) => {
        console.log(`  - ${value.name}`);
      });
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
