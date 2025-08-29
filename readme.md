# SC Prisma Extractor

A simple CLI tool to extract your Prisma schema into usable TypeScript interfaces and a detailed JSON metadata file. Helps bridge the gap between your database schema and application code, ensuring type safety.

## Features

- Generates clean TypeScript `interface` or `type` definitions from your `schema.prisma` file.
- Creates a `metadata.json` file with the complete DMMF (Data Model Meta Format) structure for advanced use cases.
- Easy-to-use command-line interface with configurable output types.

## Installation

For use in a project, install as a development dependency:

```bash
npm install sc-prisma-extractor --save-dev
```

Or, to use as a global system-wide tool:

```bash
npm install -g sc-prisma-extractor
```

## Usage

The extractor requires two arguments: the path to the Prisma schema and the desired output path for the generated TypeScript file.

```bash
npx sc-prisma-extractor <path-to-schema.prisma> <output-path.ts>
```

### Command Line Options

- `--init`: Generates a default configuration file (`prisma-extractor.json`) in the current directory
- `--config <path>`: Specifies a custom path for the configuration file (default: `./prisma-extractor.json`)

### Example

If you have a schema in `./prisma/schema.prisma` and want to generate types in `src/generated/types.ts`, run:

```bash
npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts
```

To generate a configuration file first:

```bash
npx sc-prisma-extractor --init
npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts
```

### Recommended Workflow

For a more robust workflow, add the command to your `package.json` scripts. This ensures consistency and makes it easy to regenerate types whenever your schema changes.

```json
"scripts": {
  "prisma:generate-types": "sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts"
}
```

## Configuration

SC Prisma Extractor supports customizable type mappings through a configuration file. This allows you to override the default Prisma-to-TypeScript type conversions according to your project's needs.

### Generating a Configuration File

To create a default configuration file, use the `--init` flag:

```bash
npx sc-prisma-extractor --init
```

This will generate a `prisma-extractor.json` file in your current directory with the default type mappings.

### Configuration File Structure

The configuration file (`prisma-extractor.json`) contains two main options:

- `mapTypes`: Maps Prisma types to TypeScript types
- `outputType`: Chooses between generating TypeScript `interface` or `type` definitions (default: `"interface"`)

```json
{
  "mapTypes": {
    "String": "string",
    "Int": "number",
    "Float": "number",
    "BigInt": "bigint",
    "Boolean": "boolean",
    "DateTime": "Date",
    "Json": "string",
    "Decimal": "number",
    "Bytes": "Buffer"
  },
  "outputType": "interface"
}
```

### Customizing Type Mappings and Output

You can modify both the `mapTypes` object and the `outputType` option:

```json
{
  "mapTypes": {
    "String": "string",
    "Int": "number",
    "Float": "number",
    "BigInt": "bigint",
    "Boolean": "boolean",
    "DateTime": "Date",
    "Json": "any",
    "Decimal": "number",
    "Bytes": "Uint8Array"
  },
  "outputType": "type"
}
```

The `outputType` option accepts:

- `"interface"` (default): Generates `export interface ModelName { ... }`
- `"type"`: Generates `export type ModelName = { ... }`

### Using a Custom Configuration File

By default, the tool looks for `prisma-extractor.json` in the current working directory. You can specify a different path using the `--config` option:

```bash
npx sc-prisma-extractor --config ./config/my-custom-config.json ./prisma/schema.prisma ./src/generated/types.ts
```

You can also combine `--init` with `--config` to generate the configuration file in a custom location:

```bash
npx sc-prisma-extractor --init --config ./config/my-custom-config.json
```

### Configuration Priority

1. If a configuration file is found, its mappings are merged with the defaults
2. Custom mappings in the configuration file override the defaults
3. If no configuration file is found, the tool uses the built-in default mappings
4. Unknown Prisma types fall back to using the Prisma type name as-is

## Configuration Validation

SC Prisma Extractor includes built-in validation for the configuration file to help developers detect errors early.

### Automatic Validation

The tool automatically validates the configuration file when loading it. If the file is invalid, the extraction will fail with a clear error message.

### Manual Validation

You can validate your configuration file independently using:

```bash
npm run validate-config
```

This will check the `prisma-extractor.json` file and report any validation errors.

### Validation Rules

The validator checks:

- **mapTypes**: Must be an object with string values
- **outputType**: Must be `"interface"` or `"type"`
- **Structure**: No unexpected properties allowed
- **JSON**: Valid JSON syntax

### Example Error Messages

```
🟥 Invalid configuration: outputType must be one of the following: interface, type; Unexpected property: invalidProperty.
```

### Example Configuration

See `prisma-extractor.example.json` for a complete example of a valid configuration.

### JSON Schema for Validation

For automatic validation in editors that support JSON Schema (like VS Code), use the included `prisma-extractor.schema.json` file. You can reference it at the top of your `prisma-extractor.json`:

```json
{
  "$schema": "./prisma-extractor.schema.json",
  "mapTypes": {
    "String": "string",
    "Int": "number",
    "Float": "number",
    "BigInt": "bigint",
    "Boolean": "boolean",
    "DateTime": "Date",
    "Json": "string",
    "Decimal": "number",
    "Bytes": "Buffer",
    "Unsupported": "unknown"
  },
  "outputType": "interface"
}
```

This will provide autocomplete, real-time validation, and inline documentation in your editor.

The command will generate two files in the same directory as the specified output path. For the example `npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts`, the output will be:

1. `./src/generated/types.ts`
2. `./src/generated/metadata.json`

### TypeScript Interfaces (`types.ts`)

This file contains the generated TypeScript `enum`s and `interface`s from your schema.

**Before (in `schema.prisma`):**

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
}
```

**After (in `src/generated/types.ts` with `outputType: "interface"`):**

```typescript
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  posts: Post[];
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  author: User;
  authorId: string;
  createdAt: Date;
}
```

**Or with `outputType: "type"`:**

```typescript
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  posts: Post[];
  createdAt: Date;
};

export type Post = {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  author: User;
  authorId: string;
  createdAt: Date;
};
```

### Metadata (`metadata.json`)

This file contains the complete Prisma DMMF (Data Model Meta Format) metadata. This is useful for advanced scripts or tools that need a machine-readable version of your schema. You can use it to build your own generators, validation libraries, or any other tool that needs deep introspection of your data model.

## Development Workflow

To test and develop this tool locally on your machine:

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Link the package:** This makes the `sc-prisma-extractor` command available globally, pointing to your local source code.
   ```bash
   npm link
   ```
4. **Develop:** Make your changes in the `src/` directory.
5. **Compile:** After making changes, you should recompile the TypeScript code.
   ```bash
   npm run build
   ```
6. **Test:** The `sc-prisma-extractor` command now runs your latest compiled code. You can test it from any directory.

## Contribution

Contributions are welcome! Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines.
