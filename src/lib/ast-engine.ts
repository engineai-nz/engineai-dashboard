import { Project, VariableDeclarationKind, SyntaxKind, ts } from 'ts-morph';
import fs from 'fs';
import path from 'path';

/**
 * AST Engine Utility
 * Industrial-grade code refactoring using ts-morph.
 */

export type RuleType = 'variable' | 'import' | 'rename' | 'substitution';

export interface TransformationRule {
  type: RuleType;
  target: string;
  value: string;
  comment?: string;
}

/**
 * Refactors a source file using AST transformations.
 * Supports variable updates, automated imports, renaming, and component substitution.
 */
export async function refactorBlueprint(filePath: string, rules: TransformationRule[]) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CRITICAL: Source file not found at ${filePath}`);
  }

  const project = new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      allowJs: true
    }
  });
  const sourceFile = project.addSourceFileAtPath(filePath);

  console.log(`AST: Initialising refactor for ${filePath}`);

  rules.forEach(rule => {
    switch (rule.type) {
      case 'variable':
        updateVariable(sourceFile, rule);
        break;
      case 'import':
        addOrUpdateImport(sourceFile, rule);
        break;
      case 'rename':
        renameVariable(sourceFile, rule);
        break;
      case 'substitution':
        substituteComponent(sourceFile, rule);
        break;
      default:
        console.warn(`AST: Unknown rule type ${rule.type} for ${rule.target}`);
    }
  });

  const diagnostics = sourceFile.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    const firstError = diagnostics[0];
    const message = typeof firstError.getMessageText() === 'string' 
      ? firstError.getMessageText() 
      : (firstError.getMessageText() as any).getMessageText();
    throw new Error(`AST FAILURE: Syntax errors detected. ${message}`);
  }

  await sourceFile.save();
  
  return {
    file: filePath,
    status: "Synchronised",
    timestamp: new Date().toISOString()
  };
}

function updateVariable(sourceFile: any, rule: TransformationRule) {
  const variable = sourceFile.getVariableDeclaration(rule.target);
  if (variable) {
    console.log(`AST: Updating variable ${rule.target} to ${rule.value}`);
    variable.setInitializer(JSON.stringify(rule.value));
    
    if (rule.comment) {
      const statement = variable.getVariableStatement();
      if (statement) {
        // NZ English log entry
        console.log(`AST: Adding JSDoc comment: "${rule.comment}"`);
        statement.addJsDoc(rule.comment);
      }
    }
  } else {
    throw new Error(`AST FAILURE: Variable ${rule.target} missing from blueprint.`);
  }
}

function addOrUpdateImport(sourceFile: any, rule: TransformationRule) {
  console.log(`AST: Adding import ${rule.value} from ${rule.target}`);
  const existingImport = sourceFile.getImportDeclaration(rule.target);
  
  if (existingImport) {
    // If it's a named import like { Rocket }, we might want to add to it
    if (rule.value.startsWith('{') && rule.value.endsWith('}')) {
      const namedImport = rule.value.slice(1, -1).trim();
      if (!existingImport.getNamedImports().some((i: any) => i.getName() === namedImport)) {
        existingImport.addNamedImport(namedImport);
      }
    } else {
      // Default import or full replacement
      existingImport.setModuleSpecifier(rule.target);
    }
  } else {
    if (rule.value.startsWith('{') && rule.value.endsWith('}')) {
      const namedImport = rule.value.slice(1, -1).trim();
      sourceFile.addImportDeclaration({
        moduleSpecifier: rule.target,
        namedImports: [namedImport]
      });
    } else {
      sourceFile.addImportDeclaration({
        moduleSpecifier: rule.target,
        defaultImport: rule.value
      });
    }
  }
}

function renameVariable(sourceFile: any, rule: TransformationRule) {
  const variable = sourceFile.getVariableDeclaration(rule.target);
  if (variable) {
    console.log(`AST: Renaming ${rule.target} to ${rule.value}`);
    variable.rename(rule.value);
  } else {
    throw new Error(`AST FAILURE: Cannot rename ${rule.target}; variable not found.`);
  }
}

function substituteComponent(sourceFile: any, rule: TransformationRule) {
  // Simple implementation: find variable and replace its initialiser with a component JSX string
  // For complex substitutions, we'd use more advanced AST traversal
  const variable = sourceFile.getVariableDeclaration(rule.target);
  if (variable) {
    console.log(`AST: Substituting component ${rule.target} with ${rule.value}`);
    variable.setInitializer(rule.value);
  }
}

export async function createBlueprintPlaceholder(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const project = new Project({
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      allowJs: true
    }
  });
  const sourceFile = project.createSourceFile(filePath, `
    export const ORG_NAME = 'BLUEPRINT_ORG';
    export const CLIENT_ID = 'BLUEPRINT_ID';
    export const APP_ENV = 'development';
    
    export const Header = () => null;
  `, { overwrite: true });

  await sourceFile.save();
}
