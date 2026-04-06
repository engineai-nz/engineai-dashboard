
import { refactorBlueprint, createBlueprintPlaceholder, TransformationRule } from './ast-engine';
import fs from 'fs';
import path from 'path';

async function testAstEngine() {
  const testFile = path.join(__dirname, 'test-blueprint.tsx');
  
  console.log('--- Testing AST Engine ---');

  // 1. Create a dummy blueprint
  await createBlueprintPlaceholder(testFile);
  console.log('✅ Blueprint created');

  // 2. Define transformation rules
  const rules: TransformationRule[] = [
    { type: 'variable', target: 'ORG_NAME', value: 'EngineAI NZ', comment: 'Optimising client organisation' },
    { type: 'variable', target: 'CLIENT_ID', value: 'EAI-888', comment: 'Initialising unique identifier' },
    { type: 'rename', target: 'APP_ENV', value: 'ENVIRONMENT' },
    { type: 'import', target: 'lucide-react', value: '{ Rocket }' },
    { type: 'substitution', target: 'Header', value: '() => <div>EngineAI Dashboard</div>' }
  ];

  try {
    // 3. Perform refactor
    console.log('Running refactorBlueprint...');
    const result = await refactorBlueprint(testFile, rules);
    console.log('✅ Refactor result:', result);

    // 4. Verify content
    const content = fs.readFileSync(testFile, 'utf-8');
    console.log('File Content:\n', content);

    const assertions = [
      { check: content.includes('EngineAI NZ'), label: 'Variable value update' },
      { check: content.includes('EAI-888'), label: 'Variable value update 2' },
      { check: content.includes('Optimising client organisation'), label: 'JSDoc injection' },
      { check: content.includes('export const ENVIRONMENT = "development"'), label: 'Variable renaming' },
      { check: content.includes('import { Rocket } from "lucide-react"'), label: 'Import injection' },
      { check: content.includes('export const Header = () => <div>EngineAI Dashboard</div>'), label: 'Component substitution' }
    ];

    let allPassed = true;
    assertions.forEach(a => {
      if (a.check) {
        console.log(`✅ ${a.label} passed`);
      } else {
        console.error(`❌ ${a.label} failed`);
        allPassed = false;
      }
    });

    if (!allPassed) process.exit(1);

    console.log('\n✅ ALL TESTS PASSED');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  }
}

testAstEngine();
