import Database from 'better-sqlite3';
const db = new Database('imas.db');
const users = db.prepare('SELECT id, full_name, email, role FROM users').all();
console.log('Current users:', JSON.stringify(users, null, 2));

if (users.length > 0) {
  console.log('Promoting first user to Administrador...');
  db.prepare("UPDATE users SET role = 'Administrador' WHERE id = ?").run(users[0].id);
  console.log('Done.');
}
