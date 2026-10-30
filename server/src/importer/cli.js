#!/usr/bin/env node
import { runImport, DEFAULT_IMPORT_SCOPE } from './oneuf-importer.js';

// Parse CLI arguments: --all --terms=2268,2261 --prefixes=COP,CDA --category=CWSP
const args = process.argv.slice(2);
const scope = { ...DEFAULT_IMPORT_SCOPE };

for (const arg of args) {
  if (arg === '--all') {
    scope.allCourses = true;
    scope.coursePrefixes = [];
  } else if (arg.startsWith('--terms=')) {
    scope.termCodes = arg.replace('--terms=', '').split(',').map(s => s.trim()).filter(Boolean);
  } else if (arg.startsWith('--prefixes=')) {
    scope.coursePrefixes = arg.replace('--prefixes=', '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    scope.allCourses = false;
  } else if (arg.startsWith('--category=')) {
    scope.category = arg.replace('--category=', '').trim();
  }
}

console.log('📌 Executing ONE.UF Importer with scope:', {
  category: scope.category,
  termCodes: scope.termCodes,
  mode: scope.allCourses ? 'ALL UNIVERSITY COURSES' : `Scoped Prefixes [${scope.coursePrefixes.join(', ')}]`
});

runImport(scope)
  .then((res) => {
    console.log('✨ Import finished successfully in', (res.durationMs / 1000).toFixed(1), 'seconds.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Importer encountered fatal error:', err);
    process.exit(1);
  });
