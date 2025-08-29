# SC Prisma Extractor

A simple CLI tool to extract your Prisma schema into usable TypeScript interfaces and a detailed metadata JSON file. It helps you bridge the gap between your database schema and your application code, ensuring type safety.

## Features

- Generates clean TypeScript `interface` and `enum` definitions from your `schema.prisma` file.
- Creates a `metadata.json` file with the full, detailed DMMF structure for advanced use cases.
- Easy-to-use command-line interface.

## Installation

For use in a project, install it as a development dependency:

```bash
npm install sc-prisma-extractor --save-dev
```

Or, to use it as a global tool across your system:

```bash
npm install -g sc-prisma-extractor
```

## Usage

The extractor requires two arguments: the path to your Prisma schema and the desired output path for the generated TypeScript file.

```bash
npx sc-prisma-extractor <path-to-schema.prisma> <path-to-output.ts>
```

### Command Line Options

- `--init`: Generate a default configuration file (`prisma-extractor.json`) in the current directory
- `--config <path>`: Specify a custom path for the configuration file (default: `./prisma-extractor.json`)

### Example

If you have a schema at `./prisma/schema.prisma` and you want to generate types into `src/generated/types.ts`, you would run:

```bash
npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts
```

To generate a configuration file first:

```bash
npx sc-prisma-extractor --init
npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts
```

### Recommended Workflow

For a more robust workflow, add the command to your `package.json` scripts. This ensures consistency and makes it easy to re-generate types whenever your schema changes.

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

The configuration file (`prisma-extractor.json`) contains a `mapTypes` object that maps Prisma types to TypeScript types:

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
  }
}
```

### Customizing Type Mappings

You can modify the `mapTypes` object to customize how Prisma types are converted to TypeScript types. For example, if you prefer to use `string` for JSON fields instead of the default `string`, or if you want to use a custom type for certain fields:

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
  }
}
```

### Using a Custom Configuration File

By default, the tool looks for `prisma-extractor.json` in the current working directory. You can specify a different path using the `--config` option:

```bash
npx sc-prisma-extractor --config ./config/my-custom-config.json ./prisma/schema.prisma ./src/generated/types.ts
```

You can also combine `--init` with `--config` to generate the configuration file at a custom location:

```bash
npx sc-prisma-extractor --init --config ./config/my-custom-config.json
```

### Configuration Priority

1. If a configuration file is found, its mappings are merged with the defaults
2. Custom mappings in the config file override the defaults
3. If no configuration file is found, the tool uses the built-in default mappings
4. Unknown Prisma types fall back to using the Prisma type name as-is

The command will generate two files in the same directory as your specified output path. For the example `npx sc-prisma-extractor ./prisma/schema.prisma ./src/generated/types.ts`, the output will be:

1.  `./src/generated/types.ts`
2.  `./src/generated/metadata.json`

### TypeScript Interfaces (`types.ts`)

This file contains the TypeScript `enum`s and `interface`s generated from your schema.

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

**After (in `src/generated/types.ts`):**

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

### Metadata (`metadata.json`)

This file contains the complete Prisma DMMF (Data Model Meta Format) metadata. This is useful for advanced scripting or for tools that need a machine-readable version of your schema. You can use it to build your own custom generators, validation libraries, or any other tool that needs deep introspection of your data model.

## Development Workflow

To test and develop this tool locally on your machine:

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Link the package:** This makes the `sc-prisma-extractor` command available globally, pointing to your local source code.
    ```bash
    npm link
    ```
4.  **Develop:** Make your changes in the `src/` directory.
5.  **Compile:** After making changes, you must recompile the TypeScript code.
    ```bash
    npm run build
    ```
6.  **Test:** The `sc-prisma-extractor` command now runs your latest compiled code. You can test it from any directory.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](./CONTRIBUTING.md) file for guidelines.

## Future Features

See [features.md](./features.md) for a list of planned enhancements.
