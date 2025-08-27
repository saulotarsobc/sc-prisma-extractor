# SC Prisma Extractor

A simple CLI tool to extract your Prisma schema into usable TypeScript interfaces and a detailed metadata JSON file.

## Features

- Generates clean TypeScript `interface` and `enum` definitions from your `schema.prisma` file.
- Creates a `metadata.json` file with the full, detailed DMMF structure for advanced use cases.
- Easy-to-use command-line interface.

## Installation

*This package is not yet published to NPM. The following are instructions for once it is published.*

For use in a project, install it as a development dependency:

```bash
npm install sc-prisma-extractor --save-dev
```

Or, to use it as a global tool across your system:

```bash
npm install -g sc-prisma-extractor
```

## Usage

After installation, you can run the extractor using `npx` or by calling the command directly if installed globally.

Provide the path to your Prisma schema and the desired output path for the TypeScript file.

```bash
npx sc-prisma-extractor <path-to-schema.prisma> <path-to-output.ts>
```

### Example

```bash
npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/schema-types.ts
```

## Output

The command will generate two files in the same directory as your specified output path:

1.  **`schema-types.ts`** (your specified file): Contains the generated TypeScript `enum`s and `interface`s.
2.  **`metadata.json`**: Contains the complete Prisma DMMF metadata for advanced scripting.

## Development Workflow

To test and develop this tool locally on your machine:

1.  **Clone the repository.**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Link the package:** This makes the `sc-prisma-extractor` command available globally on your system, pointing to your local source code. You only need to do this once.
    ```bash
    npm link
    ```

4.  **Develop:** Make your changes to the source code in the `src/` directory.

5.  **Compile:** After making changes, you must recompile the TypeScript code.
    ```bash
    npm run build
    ```

6.  **Test:** The `sc-prisma-extractor` command is now running your latest compiled code. You can test it from any directory.