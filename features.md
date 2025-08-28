# Ideas for Future Features

This file contains a list of ideas for new features and improvements for the `sc-prisma-extractor` tool.

## Core Functionality

- [ ] **Export InputTypes:** Generate TypeScript types for Prisma's `InputTypes` (e.g., `UserCreateInput`, `UserUpdateInput`). This would be extremely useful for typing API payloads for creating and updating data.
- [ ] **Customizable Output:** Allow users to select what to export via command-line flags.
  - `--models-only`: Export only model interfaces.
  - `--enums-only`: Export only enums.
  - `--include <models>`: Export only a specific list of models (e.g., `--include User,Post`).
  - `--exclude <models>`: Exclude a specific list of models.
- [ ] **JSON Schema Generation:** In addition to TypeScript interfaces, provide an option to generate JSON Schema for each model. This would be useful for validation and for tools that consume JSON Schema.
- [ ] **Generate Zod Schemas:** Automatically generate [Zod](https://zod.dev/) schemas from the Prisma models for robust runtime validation.

## Developer Experience

- [ ] **Configuration File:** Allow users to define their preferences in a configuration file (e.g., `.extractorrc.json` or `extractor.config.js`) to avoid long command-line arguments.
- [ ] **Watch Mode:** Implement a `--watch` mode that automatically regenerates the output files whenever the `schema.prisma` file is modified.
- [ ] **Interactive Mode:** An interactive CLI mode (`sc-prisma-extractor --init`) that guides the user through setting up the configuration.
- [✅] **Improved Documentation:**
  - Enhance the `README.md` with more detailed usage examples.
  - Add API documentation for the generated interfaces and metadata.
  - Create a `CONTRIBUTING.md` file to encourage community contributions.

## Extensibility

- [ ] **Plugin System:** Design a plugin system that allows other developers to create and share their own generators. For example, a plugin could generate:
  - Validation classes for frameworks like `class-validator`.
  - GraphQL resolvers.
  - Admin UI components.
- [ ] **Programmatic API:** Expose a programmatic API so that the extractor can be used as a library in other Node.js scripts.

## Compatibility

- [ ] **Prisma Version Compatibility:** Test and ensure compatibility with a wider range of Prisma versions. Add a peer dependency on `@prisma/client` to ensure version alignment.
