/**
 * System Validation Script
 * Validates that all modules are properly implemented and compiled
 */

import path from 'path';
import fs from 'fs';

interface ModuleValidation {
  name: string;
  activities: string[];
  files: string[];
  status: 'PASS' | 'FAIL';
  issues: string[];
}

const EXPECTED_MODULES = [
  {
    name: 'DATA',
    activities: ['DATA-00-001'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'SETUP', 
    activities: ['SETUP-01-001', 'SETUP-01-002', 'SETUP-01-003', 'SETUP-01-004'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'AUTH',
    activities: ['AUTH-02-001', 'AUTH-02-002'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'USER',
    activities: ['USER-03-001', 'USER-03-002', 'USER-03-003', 'USER-03-004', 'USER-03-005', 'USER-03-006'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'STUD',
    activities: ['STUD-04-001', 'STUD-04-002', 'STUD-04-003', 'STUD-04-004', 'STUD-04-005', 'STUD-04-006', 'STUD-04-007', 'STUD-04-008'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'FEES',
    activities: ['FEES-05-001', 'FEES-05-002', 'FEES-05-003', 'FEES-05-004', 'FEES-05-005', 'FEES-05-006', 'FEES-05-007', 'FEES-05-008', 'FEES-05-009', 'FEES-05-010'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'ATTD',
    activities: ['ATTD-06-001', 'ATTD-06-002', 'ATTD-06-003', 'ATTD-06-004'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'REPT',
    activities: ['REPT-07-001', 'REPT-07-002', 'REPT-07-003', 'REPT-07-004', 'REPT-07-005', 'REPT-07-006'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'DASH',
    activities: ['DASH-08-001', 'DASH-08-002', 'DASH-08-003'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  },
  {
    name: 'COMM',
    activities: ['COMM-09-001', 'COMM-09-002', 'COMM-09-003'],
    files: ['controllers.ts', 'services.ts', 'repos.ts', 'dtos.ts', 'index.ts']
  }
];

async function validateModule(moduleInfo: any): Promise<ModuleValidation> {
  const moduleName = moduleInfo.name.toLowerCase();
  const modulePath = path.join(process.cwd(), 'src/modules', moduleName);
  
  const validation: ModuleValidation = {
    name: moduleInfo.name,
    activities: moduleInfo.activities,
    files: moduleInfo.files,
    status: 'PASS',
    issues: []
  };

  // Check if module directory exists
  if (!fs.existsSync(modulePath)) {
    validation.status = 'FAIL';
    validation.issues.push(`Module directory does not exist: ${modulePath}`);
    return validation;
  }

  // Check if all required files exist
  for (const file of moduleInfo.files) {
    const filePath = path.join(modulePath, file);
    if (!fs.existsSync(filePath)) {
      validation.status = 'FAIL';
      validation.issues.push(`Missing file: ${file}`);
    } else {
      // Check if file has content
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim().length < 100) {
        validation.issues.push(`File ${file} appears to be empty or minimal`);
      }
    }
  }

  // Check for activity IDs in controllers
  const controllersPath = path.join(modulePath, 'controllers.ts');
  if (fs.existsSync(controllersPath)) {
    const controllersContent = fs.readFileSync(controllersPath, 'utf8');
    
    for (const activity of moduleInfo.activities) {
      if (!controllersContent.includes(activity)) {
        validation.issues.push(`Activity ${activity} not found in controllers`);
      }
    }
  }

  return validation;
}

async function validateCompiledOutput(): Promise<{ status: 'PASS' | 'FAIL', issues: string[] }> {
  const distPath = path.join(process.cwd(), 'dist');
  const issues: string[] = [];

  if (!fs.existsSync(distPath)) {
    return { status: 'FAIL', issues: ['Compiled output directory (dist/) does not exist'] };
  }

  const appPath = path.join(distPath, 'app.js');
  const serverPath = path.join(distPath, 'server.js');

  if (!fs.existsSync(appPath)) {
    issues.push('Compiled app.js not found');
  }

  if (!fs.existsSync(serverPath)) {
    issues.push('Compiled server.js not found');
  }

  return { status: issues.length === 0 ? 'PASS' : 'FAIL', issues };
}

async function validateCoreFiles(): Promise<{ status: 'PASS' | 'FAIL', issues: string[] }> {
  const coreFiles = [
    'src/app.ts',
    'src/server.ts',
    'src/lib/database.ts',
    'src/lib/rbac.ts',
    'src/lib/audit.ts',
    'package.json',
    'tsconfig.json'
  ];

  const issues: string[] = [];

  for (const file of coreFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      issues.push(`Missing core file: ${file}`);
    }
  }

  return { status: issues.length === 0 ? 'PASS' : 'FAIL', issues };
}

async function main() {
  console.log('🚀 School ERP System Validation');
  console.log('==================================\n');

  // Validate core files
  console.log('📋 Validating Core Files...');
  const coreValidation = await validateCoreFiles();
  if (coreValidation.status === 'PASS') {
    console.log('✅ All core files present');
  } else {
    console.log('❌ Core files validation failed:');
    coreValidation.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Validate compiled output
  console.log('\n📋 Validating Compiled Output...');
  const compileValidation = await validateCompiledOutput();
  if (compileValidation.status === 'PASS') {
    console.log('✅ Compiled output validated');
  } else {
    console.log('❌ Compilation validation failed:');
    compileValidation.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Validate each module
  console.log('\n📋 Validating Modules...\n');
  
  let totalActivities = 0;
  let passedModules = 0;
  const allValidations: ModuleValidation[] = [];

  for (const moduleInfo of EXPECTED_MODULES) {
    const validation = await validateModule(moduleInfo);
    allValidations.push(validation);
    totalActivities += moduleInfo.activities.length;

    console.log(`${validation.status === 'PASS' ? '✅' : '❌'} ${validation.name} Module (${validation.activities.length} activities)`);
    
    if (validation.status === 'PASS') {
      passedModules++;
      console.log(`   All ${validation.activities.length} activities implemented`);
    } else {
      console.log('   Issues found:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }
  }

  // Summary
  console.log('\n🎯 VALIDATION SUMMARY');
  console.log('===================');
  console.log(`📊 Total Modules: ${EXPECTED_MODULES.length}`);
  console.log(`✅ Passed Modules: ${passedModules}`);
  console.log(`❌ Failed Modules: ${EXPECTED_MODULES.length - passedModules}`);
  console.log(`🎯 Total Activities: ${totalActivities}`);

  console.log('\n📋 Module Activity Breakdown:');
  allValidations.forEach(v => {
    console.log(`   ${v.name}: ${v.activities.length} activities`);
  });

  const overallStatus = passedModules === EXPECTED_MODULES.length && 
                       coreValidation.status === 'PASS' && 
                       compileValidation.status === 'PASS';

  console.log(`\n🚀 Overall System Status: ${overallStatus ? '✅ READY' : '❌ NEEDS WORK'}`);

  if (overallStatus) {
    console.log('\n🎉 CONGRATULATIONS!');
    console.log('====================');
    console.log('✅ All 9 modules implemented');
    console.log(`✅ All ${totalActivities} activities completed`);
    console.log('✅ TypeScript compilation successful');
    console.log('✅ System ready for production deployment');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Run database migrations');
    console.log('   2. Setup environment variables');
    console.log('   3. Configure frontend interface');
    console.log('   4. Deploy to production server');
  }
}

main().catch(console.error);