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
    if (!schemaPath && !tsOutputPath) {
      // Try to load config to see if we have defaults
      try {
        const config = loadConfig(options.config);
        if (!config.prismaSchema || !config.outputFile) {
          throw new Error("Missing required paths in config");
        }
        // If we have config values, we can proceed without arguments
      } catch (error) {
        console.error(
          "🟥 Error: Both schema-path and ts-output-path are required, or configure them in prisma-extractor.json"
        );
        program.help();
        process.exit(1);
      }
    }

    console.log(`>>> SC Prisma Extractor - Version: ${version} <<<\n`);

    const spinner = ora("Starting schema extraction...").start();

    // Load config to get default paths
    const config = loadConfig(options.config);
    const finalSchemaPath = schemaPath || config.prismaSchema;
    const finalTsOutputPath = tsOutputPath || config.outputFile;

    const outputDir = path.dirname(finalTsOutputPath);
    const metadataOutputPath = path.join(outputDir, "metadata.json");

    try {
      spinner.text = "Ensuring output directory exists...";
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      spinner.text = "Extracting schema metadata...";
      const { models, enums } = await extractSchema(finalSchemaPath);
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
      fs.writeFileSync(finalTsOutputPath, tsContent, "utf-8");
      spinner.succeed(
        `TypeScript interfaces successfully generated at ${finalTsOutputPath}`
      );
    } catch (error) {
      spinner.fail("An error occurred");
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no arguments provided, try to run with config values
if (process.argv.length === 2) {
  (async () => {
    try {
      const config = loadConfig();
      if (config.prismaSchema && config.outputFile) {
        // We have config values, run the extraction automatically
        console.log(`>>> SC Prisma Extractor - Version: ${version} <<<\n`);

        const spinner = ora("Starting schema extraction...").start();
        const outputDir = path.dirname(config.outputFile);
        const metadataOutputPath = path.join(outputDir, "metadata.json");

        spinner.text = "Ensuring output directory exists...";
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        spinner.text = "Extracting schema metadata...";
        const { models, enums } = await extractSchema(config.prismaSchema);
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
        const tsContent = generateTsInterfaces(models, enums);
        fs.writeFileSync(config.outputFile, tsContent, "utf-8");
        spinner.succeed(
          `TypeScript interfaces successfully generated at ${config.outputFile}`
        );

        process.exit(0); // Exit successfully
      }
    } catch (error) {
      console.error(
        "🟥 Could not run with config:",
        error instanceof Error ? error.message : String(error)
      );
    }

    // If we can't run with config, show help
    program.help();
  })();
}
