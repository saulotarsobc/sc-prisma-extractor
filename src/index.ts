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
  loadConfig,
} from "./utils";

/**
 * Main function to run the extraction and generation process.
 */
async function runExtractor(options: {
  schemaPath?: string;
  tsOutputPath?: string;
  configPath?: string;
}) {
  const spinner = ora("Starting...").start();
  try {
    // 1. Load Config
    spinner.text = "Loading configuration";
    const config = loadConfig(options.configPath);
    const finalSchemaPath = options.schemaPath || config.prismaSchema;
    const finalTsOutputPath = options.tsOutputPath || config.outputFile;

    if (!finalSchemaPath || !finalTsOutputPath) {
      spinner.fail("Configuration validation failed");
      throw new Error(
        "Schema path and output path must be provided either as arguments or in the config file."
      );
    }
    spinner.succeed("Configuration loaded.");

    // 2. Ensure output directory exists
    spinner.start("Preparing output directory...");
    const outputDir = path.dirname(finalTsOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    spinner.succeed("Output directory is ready.");

    // 3. Extract Schema
    spinner.start("Processing Prisma schema...");
    const { models, enums } = await extractSchema(finalSchemaPath);
    spinner.succeed("Prisma schema processed.");

    // 4. Write Metadata (if enabled)
    if (config.generateMetadata) {
      spinner.start("Writing metadata.json...");
      const metadataOutputPath = path.join(outputDir, "metadata.json");
      fs.writeFileSync(
        metadataOutputPath,
        JSON.stringify({ models, enums }, null, 2),
        "utf-8"
      );
      spinner.succeed(`Metadata successfully written to ${metadataOutputPath}`);
    }

    // 5. Generate TS Content
    spinner.start("Generating TypeScript interfaces...");
    const tsContent = generateTsInterfaces(models, enums, config);
    fs.writeFileSync(finalTsOutputPath, tsContent, "utf-8");
    spinner.succeed(
      `TypeScript interfaces successfully generated at ${finalTsOutputPath}`
    );
  } catch (error) {
    spinner.fail("An error occurred");
    console.error(error instanceof Error ? `🟥 ${error.message}` : error);
    process.exit(1);
  }
}

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
    if (!options.init) {
      console.log(`>>> SC Prisma Extractor - Version: ${version} <<<
`);
    }

    // Handle --init flag
    if (options.init) {
      const spinner = ora("Generating configuration file...").start();
      try {
        generateConfigFile(options.config);
        spinner.succeed("Configuration file generated successfully!");
      } catch (error) {
        spinner.fail("Failed to generate configuration file");
        console.error(error);
        process.exit(1);
      }
      return;
    }

    // Run the main logic
    await runExtractor({
      schemaPath,
      tsOutputPath,
      configPath: options.config,
    });
  });

program.parse(process.argv);
