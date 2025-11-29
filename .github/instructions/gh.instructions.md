---
applyTo: '**'
---

# Project structure and instructions for Screeps Play

## Goal
Create a skeleton for a Screeps game project.

## Requested folder layout
- `src/`
  - `lib/` — Higher-level framework & utilities to help implement Screeps features (the reusable library)
  - `play/` — Your game code that uses the framework in `lib` to actually run the Screeps logic

Current state: only directories have been created with a `.gitkeep` placeholder file so that the folders are tracked by git.

## TypeScript configuration
- This project will use TypeScript in **strict** mode.

## Notes and next steps
1. Add a `tsconfig.json` configured for `strict` mode.
2. Add a TypeScript build pipeline (e.g., `tsc` or `esbuild`) and scripts in `package.json`.
3. Implement the `lib` framework code to expose higher-level abstractions to interact with Screeps objects.
4. Implement the `play` code to use the `lib` abstractions and implement the actual game logic.
5. Consider adding a README, CONTRIBUTING, and tests when adding code.

## Developer rules (must follow)

1. Code location rule: Whenever you (the user) ask to write code, unless you explicitly state otherwise in that request, create or modify files only inside `src/lib/` (the `lib` folder). The `src/play/` folder is reserved for a runtime entrypoint and game logic that uses `lib`—do not add framework, utility, or helper code there unless the user explicitly requests it.

2. Documentation rule: All "public" functions inside `src/lib/` (i.e., functions exported from modules intended to be used by `play` or other modules) MUST include a JSDoc comment immediately above the function declaration or export. The JSDoc must include:
   - A short description of what the function does.
   - `@param` tags with a description for each parameter and the expected type.
   - An `@returns` tag that explains the return value and its type (or `void`/`Promise<void>` for no return).

   Example:
   ```ts
   /**
    * Computes the path to a target POS using A* and the provided options.
    *
    * @param start - The starting RoomPosition
    * @param end - The destination RoomPosition
    * @param opts - Optional pathfinding options
    * @returns An array of RoomPositions representing the path
    */
   export function findPath(start: RoomPosition, end: RoomPosition, opts?: PathOpts): RoomPosition[] {
     // implementation
   }
   ```

These rules are intentional to keep the project's structure consistent and to make exported APIs predictable and well-documented for both contributors and the runtime `play` code.

## Build pipeline (current)

The project now includes a two-stage build pipeline designed for Screeps where folder hierarchies are not supported.

- Stage 1: TypeScript compile
  - Command: `pnpm run build:ts`
  - Action: Compiles TypeScript into `temp-dist` (this directory is intentionally temporary)

- Stage 2: Flatten and rewrite
  - Command: `pnpm run build:flatten`
  - Action: Reads files from `temp-dist`, flattens the directory layout so each output file name represents the original path using dots (for example `lib/somefolder/file.js` -> `lib.somefolder.file.js`) and rewrites `require(...)` and `import` specifiers that resolve to other local modules to use the flattened names.

- Full build: `pnpm run build` which runs `build:ts` and then `build:flatten`.

- Continuous watch + flatten on changes: `pnpm start` runs a watch that compiles TypeScript to `temp-dist` (via `tsc --watch`) and then flattens into `dist` whenever files change.

Special-case:
- `src/play/main.ts` (and the compiled `temp-dist/play/main.js`) is treated specially and will become `dist/main.js` (no `play.` prefix). This is the Screeps runtime instance file and should be loaded as `main.js` at the top-level.

## Development & watch workflow

1. Install dependencies (only once):

```bash
pnpm install
```

2. Clean previous builds (optional):

```bash
pnpm run clean
```

3. Build once:

```bash
pnpm run build
```

4. Continuous watch + flatten during development:

```bash
pnpm start
```

The `start` command runs `tsc --watch` to keep `temp-dist` up to date and watches `temp-dist` to re-run the flattening when files are updated.

Notes on rewriting rules:
- The script only rewrites local module paths (relative imports and imports beginning with `lib/`, `play/`, or `src/`).
- NPM packages and Node core modules are left untouched.
- The script resolves import paths (including `../` relative imports) by looking at the `temp-dist` compiled tree and only rewrites if the target module exists there.

If you want to adjust or extend how imports are rewritten or how flattened names are generated, edit `tools/flatten-dist.js`.

## Constraints

---
