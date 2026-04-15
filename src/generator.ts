import { ModuleInfo, FunctionInfo } from './parser';

/**
 * Generate a Luau declaration file string from parsed module info.
 */
export function generateDeclaration(module: ModuleInfo): string {
  const lines: string[] = [];
  lines.push(`declare class ${module.name}`);

  for (const func of module.functions) {
    let paramStr = func.params.map((p) => `${p.name}: ${p.type}`).join(', ');
    if (paramStr.length > 0) {
      paramStr = 'self, ' + paramStr;
    } else {
      paramStr = 'self';
    }
    lines.push(`\tfunction ${func.name}(${paramStr}): ${func.returnType}`);
  }

  lines.push('end');
  return lines.join('\n') + '\n';
}

export interface DocEntry {
  documentation: string;
  code_sample?: string;
  params?: { name: string; documentation: string }[];
  returns?: string[];
}

/**
 * Generate the documentation JSON object from parsed module info.
 */
export function generateDocumentation(
  module: ModuleInfo,
  prefixName: string = 'generated',
): Record<string, DocEntry> {
  const docs: Record<string, DocEntry> = {};
  const prefix = `@${prefixName}/globaltype/${module.name}`;

  // Module-level entry
  docs[prefix] = {
    documentation: '',
    code_sample: '',
  };

  // Function-level entries
  for (const func of module.functions) {
    docs[`${prefix}.${func.name}`] = {
      documentation: '',
      params: func.params.map((p) => ({
        name: p.name,
        documentation: '',
      })),
      returns: [''],
    };
  }

  return docs;
}
