#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import ora from "ora";
import * as path from "path";
import { version } from "../package.json";
import {
  extractSchema,
  generateConfigFile,
  generateTsInterfaces,
} from "./utils/index";

const program = new Command();

program
  .name("sc-prisma-extractor")
  .description(
    "A CLI tool to extract your Prisma schema into usable TypeScript interfaces and a detailed metadata JSON file."
  )
  .version(version)
  .argument(
    "[schema-path]",
    "Path to the Prisma schema file (e.g., ./prisma/schema.prisma)"
  )
  .argument(
    "[ts-output-path]",
    "Path to the output TypeScript file (e.g., ./dev/extracted.ts)"
  )
  .option(
    "--init",
    "Generate a default configuration file (prisma-extractor.json) in the current directory"
  )
  .option(
    "--config <path>",
    "Path to the configuration file (default: ./prisma-extractor.json)"
  )
  .showHelpAfterError()
  .action(async (schemaPath, tsOutputPath, options) => {
    // Handle --init flag
    if (options.init) {
      console.log(`>>> SC Prisma Extractor - Version: ${version} <<<\n`);
      const spinner = ora("Generating configuration file...").start();

      try {
        generateConfigFile(options.config);
        spinner.succeed("Configuration file generated successfully!");
        return;
      } catch (error) {
        spinner.fail("Failed to generate configuration file");
        console.error(error);
        process.exit(1);
      }
    }

    // Check if required arguments are provided
    if (!schemaPath || !tsOutputPath) {
      console.error(
        "🟥 Error: Both schema-path and ts-output-path are required when not using --init"
      );
      program.help();
      process.exit(1);
    }

    console.log(`>>> SC Prisma Extractor - Version: ${version} <<<\n`);

    const spinner = ora("Starting schema extraction...").start();
    const outputDir = path.dirname(tsOutputPath);
    const metadataOutputPath = path.join(outputDir, "metadata.json");

    try {
      spinner.text = "Ensuring output directory exists...";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      spinner.text = "Extracting schema metadata...";
      const { models, enums } = await extractSchema(schemaPath);
      spinner.succeed("Schema metadata extracted.");

      spinner.start("Writing metadata.json...");
      fs.writeFileSync(
        metadataOutputPath,
        JSON.stringify({ models, enums }, null, 2),
        "utf-8"
      );
      spinner.succeed(
        `Metadata successfully extracted to ${metadataOutputPath}`
      );

      spinner.start("Generating TypeScript interfaces...");
      const tsContent = generateTsInterfaces(models, enums, options.config);
      fs.writeFileSync(tsOutputPath, tsContent, "utf-8");
      spinner.succeed(
        `TypeScript interfaces successfully generated at ${tsOutputPath}`
      );
    } catch (error) {
      spinner.fail("An error occurred");
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
