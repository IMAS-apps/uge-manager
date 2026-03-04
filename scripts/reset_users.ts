import Database from 'better-sqlite3';
const db = new Database('imas.db');
console.log('Resetting users table...');
db.prepare('DELETE FROM users').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
console.log('Done.');
