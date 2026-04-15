#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parseLuauSource } from './parser';
import { generateDeclaration, generateDocumentation } from './generator';

const program = new Command();

program
  .name('luau-defdocs')
  .description(
    'Generate Luau declaration files and documentation JSON from Luau source modules',
  )
  .version('1.0.0');

program
  .command('generate')
  .description('Generate definition and documentation files from Luau source')
  .argument(
    '<input>',
    'Path to a .luau source file or directory of .luau files',
  )
  .option('-o, --out <dir>', 'Output directory', './out')
  .option('--def-only', 'Only generate declaration files')
  .option('--doc-only', 'Only generate documentation JSON files')
  .option(
    '--merge-docs <file>',
    'Merge generated docs into an existing JSON file',
  )
  .option(
    '-p, --prefix <name>',
    'Replace the default "@generated" prefix in doc keys with "@<name>"',
    'generated',
  )
  .action((input: string, opts) => {
    const outDir = path.resolve(opts.out);
    fs.mkdirSync(outDir, { recursive: true });

    const files = collectLuauFiles(path.resolve(input));
    if (files.length === 0) {
      console.error(`No .luau files found at: ${input}`);
      process.exit(1);
    }

    let mergedDocs: Record<string, unknown> = {};
    if (opts.mergeDocs) {
      const mergePath = path.resolve(opts.mergeDocs);
      if (fs.existsSync(mergePath)) {
        mergedDocs = JSON.parse(fs.readFileSync(mergePath, 'utf-8'));
      }
    }

    for (const file of files) {
      console.log(`Processing: ${file}`);
      const source = fs.readFileSync(file, 'utf-8');

      let module;
      try {
        module = parseLuauSource(source);
      } catch (err: any) {
        console.warn(`  Skipping ${file}: ${err.message}`);
        continue;
      }

      console.log(
        `  Found module "${module.name}" with ${module.functions.length} function(s)`,
      );

      if (!opts.docOnly) {
        const declContent = generateDeclaration(module);
        const declPath = path.join(outDir, `${module.name}.d.luau`);
        fs.writeFileSync(declPath, declContent, 'utf-8');
        console.log(`  Wrote declaration: ${declPath}`);
      }

      if (!opts.defOnly) {
        const docs = generateDocumentation(module, opts.prefix);

        if (opts.mergeDocs) {
          Object.assign(mergedDocs, docs);
        } else {
          const docPath = path.join(outDir, `${module.name}.doc.json`);
          fs.writeFileSync(
            docPath,
            JSON.stringify(docs, null, 4) + '\n',
            'utf-8',
          );
          console.log(`  Wrote documentation: ${docPath}`);
        }
      }
    }

    if (opts.mergeDocs && !opts.defOnly) {
      const mergePath = path.resolve(opts.mergeDocs);
      fs.writeFileSync(
        mergePath,
        JSON.stringify(mergedDocs, null, 4) + '\n',
        'utf-8',
      );
      console.log(`Wrote merged docs: ${mergePath}`);
    }

    console.log('Done.');
  });

program.parse();

function collectLuauFiles(inputPath: string): string[] {
  if (!fs.existsSync(inputPath)) {
    return [];
  }

  const stat = fs.statSync(inputPath);
  if (stat.isFile()) {
    return inputPath.endsWith('.luau') ? [inputPath] : [];
  }

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(inputPath, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(inputPath, entry.name);
      if (entry.isFile() && entry.name.endsWith('.luau')) {
        files.push(fullPath);
      } else if (entry.isDirectory()) {
        files.push(...collectLuauFiles(fullPath));
      }
    }
    return files;
  }

  return [];
}
