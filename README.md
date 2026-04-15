# luau-lsp-defdocs-cli

CLI tool for generating [Luau LSP](https://github.com/JohnnyMorganz/luau-lsp) declaration files and documentation JSON from standard Luau source modules.

## Installation

```bash
npm install -g luau-lsp-defdocs-cli
```

Or run directly from the repo:

```bash
npm install
npm run build
```

## Usage

```
luau-defdocs generate <input> [options]
```

| Argument / Option     | Description                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<input>`             | Path to a `.luau` file or a directory of `.luau` files (searched recursively).                                                                                           |
| `-o, --out <dir>`     | Output directory. Defaults to `./out`.                                                                                                                                   |
| `--def-only`          | Only generate declaration (`.d.luau`) files.                                                                                                                             |
| `--doc-only`          | Only generate documentation (`.doc.json`) files.                                                                                                                         |
| `--merge-docs <file>` | Merge all generated documentation into a single JSON file instead of per-module files. If the file already exists, its contents are preserved and new entries are added. |

### Examples

Generate both outputs for a single file:

```bash
luau-defdocs generate src/MyModule.luau -o definitions/
```

Process an entire directory:

```bash
luau-defdocs generate src/shared/ -o definitions/
```

Only generate declaration files:

```bash
luau-defdocs generate src/shared/ -o definitions/ --def-only
```

Merge all documentation entries into one file:

```bash
luau-defdocs generate src/shared/ --merge-docs docs.json
```

## How It Works

The tool parses Luau source files that follow the standard module pattern:

```luau
local ModuleName = {}

function ModuleName.StaticFunc(param: number): string
end

function ModuleName:Method(): boolean
end

return ModuleName
```

It detects the module table name from the `return` statement, then extracts all public functions declared with `function ModuleName.Func(...)` or `function ModuleName:Method(...)`.

### Input

Given a file like:

```luau
local Example = {}

function Example.CreatePlayerID(player: Player, anotherPlayer: Player | boolean): string end

function Example:GenerateDeepPlayer(): boolean end

function Example:KillAllPlayers(exceptions: { string }): { Player } end

return Example
```

### Declaration Output (`Example.d.luau`)

A [JohnnyMorganz/luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) compatible definition file:

```lua
declare class Example
	function CreatePlayerID(self, player: Player, anotherPlayer: Player | boolean): string end
	function GenerateDeepPlayer(self): boolean end
	function KillAllPlayers(self, exceptions: { string }): { Player } end
end
```

### Documentation Output (`Example.doc.json`)

A documentation JSON file with blank placeholders ready to be filled in:

```json
{
  "@generated/globaltype/Example": {
    "documentation": "",
    "code_sample": ""
  },
  "@generated/globaltype/Example.CreatePlayerID": {
    "documentation": "",
    "params": [
      { "name": "player", "documentation": "" },
      { "name": "anotherPlayer", "documentation": "" }
    ],
    "returns": [""]
  },
  "@generated/globaltype/Example.GenerateDeepPlayer": {
    "documentation": "",
    "params": [],
    "returns": [""]
  },
  "@generated/globaltype/Example.KillAllPlayers": {
    "documentation": "",
    "params": [{ "name": "exceptions", "documentation": "" }],
    "returns": [""]
  }
}
```

## Supported Syntax

| Feature                                           | Supported |
| ------------------------------------------------- | --------- |
| `function Mod.Func()` (static)                    | Yes       |
| `function Mod:Method()` (method, `self` stripped) | Yes       |
| Typed parameters (`param: Type`)                  | Yes       |
| Return type annotations (`: ReturnType`)          | Yes       |
| Union types (`A \| B`)                            | Yes       |
| Table types (`{ Type }`)                          | Yes       |
| Generic types (`Type<A, B>`)                      | Yes       |
| Untyped parameters (defaults to `any`)            | Yes       |
| No return type (defaults to `()`)                 | Yes       |
| Recursive directory scanning                      | Yes       |
