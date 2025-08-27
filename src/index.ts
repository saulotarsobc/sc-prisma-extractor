#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { extractSchema, generateTsInterfaces } from "./utils/index";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "💎 Usage: sc-prisma-extractor <path-to-schema.prisma> <path-to-output.ts>\n"
    );
    process.exit(1);
  }

  const schemaPath = args[0];
  const tsOutputPath = args[1];
  const outputDir = path.dirname(tsOutputPath);
  const metadataOutputPath = path.join(outputDir, "metadata.json");

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 1. Extract schema metadata
    const { models, enums } = await extractSchema(schemaPath);

    // 2. Write metadata.json
    fs.writeFileSync(
      metadataOutputPath,
      JSON.stringify({ models, enums }, null, 2),
      "utf-8"
    );
    console.log(
      `✅ Metadata successfully extracted to ${metadataOutputPath}\n`
    );

    // 3. Generate and write TypeScript interfaces
    const tsContent = generateTsInterfaces(models, enums);
    fs.writeFileSync(tsOutputPath, tsContent, "utf-8");
    console.log(
      `✅ TypeScript interfaces successfully generated at ${tsOutputPath}\n`
    );
  } catch (error) {
    console.error("🟥 An error occurred:\n", error);
    process.exit(1);
  }
}

main();
