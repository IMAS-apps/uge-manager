import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'imas.db');
const db = new Database(dbPath);

const importFilePath = path.join(process.cwd(), 'import.sql');

if (!fs.existsSync(importFilePath)) {
  console.error('Error: import.sql not found. Please create it in the root directory and paste your SQL content there.');
  process.exit(1);
}

let sqlContent = fs.readFileSync(importFilePath, 'utf-8');

// Remove existing BEGIN/COMMIT to avoid nested transaction issues
sqlContent = sqlContent.replace(/BEGIN\s*;/gi, '').replace(/COMMIT\s*;/gi, '');

// Replace table name if necessary
let modifiedSql = sqlContent.replace(/INSERT INTO peticions/g, 'INSERT INTO records');

// Fix NULL created_by values (replace last NULL with 1)
// The pattern matches ", NULL);" at the end of the INSERT statement
modifiedSql = modifiedSql.replace(/, NULL\);/g, ', 1);');

console.log('Starting import...');

const runTransaction = db.transaction((sql) => {
  db.exec(sql);
});

try {
  runTransaction(modifiedSql);
  console.log('Import successful!');
} catch (error) {
  console.error('Import failed:', error);
  process.exit(1);
}
