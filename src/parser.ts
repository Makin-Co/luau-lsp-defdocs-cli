export interface ParamInfo {
  name: string;
  type: string;
}

export interface FunctionInfo {
  name: string;
  params: ParamInfo[];
  returnType: string;
  isMethod: boolean; // : vs .
}

export interface ModuleInfo {
  name: string;
  functions: FunctionInfo[];
}

/**
 * Parse a Luau source file and extract the module table name and its public functions.
 */
export function parseLuauSource(source: string): ModuleInfo {
  const moduleName = detectModuleName(source);
  if (!moduleName) {
    throw new Error(
      'Could not detect a module table. Expected a line like: local ModuleName = {}',
    );
  }

  const functions = extractFunctions(source, moduleName);
  return { name: moduleName, functions };
}

/**
 * Detect the module table name from `local X = {}`.
 * Takes the last `return X` statement and matches it to a `local X = {}` declaration.
 */
function detectModuleName(source: string): string | null {
  // Find `return <Identifier>` at the end of the file
  const returnMatch = source.match(/return\s+([A-Za-z_]\w*)\s*$/m);
  if (!returnMatch || !returnMatch[1]) return null;

  const candidate = returnMatch[1];

  return candidate;
}

/**
 * Extract all `function ModuleName.Func(...)` and `function ModuleName:Method(...)` declarations.
 */
function extractFunctions(source: string, moduleName: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const escaped = escapeRegex(moduleName);

  // Match: function ModuleName.FuncName(...) or function ModuleName:MethodName(...)
  // Captures: separator (. or :), function name, full params string, optional return type
  const funcPattern = new RegExp(
    `function\\s+${escaped}([.:])([A-Za-z_]\\w*)\\s*\\(([^)]*)\\)\\s*(?::\\s*(.+?))?\\s*(?:end)?\\s*$`,
    'gm',
  );

  let match: RegExpExecArray | null;
  while ((match = funcPattern.exec(source)) !== null) {
    const separator = match[1];
    const funcName = match[2]!;
    const rawParams = (match[3] ?? '').trim();
    const returnType = match[4]?.trim() || '()';

    const isMethod = separator === ':';
    const params = parseParams(rawParams, isMethod);

    functions.push({
      name: funcName,
      params,
      returnType,
      isMethod,
    });
  }

  return functions;
}

/**
 * Parse a parameter list string like `param: number, other: string` into ParamInfo[].
 * For methods (`:` syntax), skips the implicit `self` parameter.
 */
function parseParams(raw: string, isMethod: boolean): ParamInfo[] {
  if (!raw) return [];

  const params: ParamInfo[] = [];
  // Split by comma, respecting nested generics/parentheses
  const parts = splitParams(raw);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed === 'self' || trimmed.startsWith('self:')) continue;

    // Match: name: Type  or  name (no type)
    const paramMatch = trimmed.match(/^([A-Za-z_]\w*)\s*(?::\s*(.+))?$/);
    if (paramMatch && paramMatch[1]) {
      params.push({
        name: paramMatch[1],
        type: paramMatch[2]?.trim() || 'any',
      });
    }
  }

  return params;
}

/**
 * Split parameter string by top-level commas (respects angle brackets and parentheses).
 */
function splitParams(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of raw) {
    if (ch === '<' || ch === '(' || ch === '{') {
      depth++;
      current += ch;
    } else if (ch === '>' || ch === ')' || ch === '}') {
      depth--;
      current += ch;
    } else if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
