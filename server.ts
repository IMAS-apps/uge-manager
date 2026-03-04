/**
 * TECHNOLOGY STACK & ARCHITECTURE DECISIONS
 * 
 * Frontend: React 19 + Tailwind CSS + Lucide React
 * - React provides a robust component-based architecture for managing complex state (like the multi-section form and dashboard filters).
 * - Tailwind CSS allows for rapid, responsive UI development with a consistent design system (deep institutional blue & amber accents).
 * - Single Page Application (SPA) approach ensures smooth transitions between Auth, Form, and Dashboard views without full page reloads.
 * 
 * Backend: Express.js + Node.js
 * - Express is lightweight and perfect for building the RESTful API required for this application.
 * - Vite middleware is integrated directly into Express for a seamless development experience and single-server deployment.
 * 
 * Database: SQLite (better-sqlite3)
 * - SQLite is chosen for persistent data storage as it requires zero configuration, is highly reliable, and perfectly suits the scale of an internal administrative tool.
 * 
 * File Uploads: Multer
 * - Multer handles multipart/form-data efficiently, allowing us to securely process and store the required 1-3 PDF files per record.
 * 
 * Authentication: JSON Web Tokens (JWT) + bcryptjs
 * - JWT provides stateless, secure session management.
 * - bcryptjs ensures passwords are securely hashed before storage.
 * 
 * Email Notifications: Nodemailer
 * - Nodemailer is the standard for Node.js email delivery. It's configured with a placeholder SMTP transport that can be easily swapped for a real service (e.g., SendGrid, AWS SES, or an internal IMAS SMTP server).
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'imas-super-secret-key-2026';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database Setup
const db = new Database('imas.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Lectura' CHECK (role IN ('Lectura', 'Peticions', 'Gestió', 'Administrador')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hora TEXT NOT NULL,
    email TEXT NOT NULL,
    nom TEXT NOT NULL,
    responsable_contracte TEXT NOT NULL,
    organ_contractacio TEXT NOT NULL,
    justificacio TEXT NOT NULL,
    objecte_contracte TEXT NOT NULL,
    caracteristiques_tecniques TEXT NOT NULL,
    tipus_contracte TEXT NOT NULL,
    tipus_despesa TEXT NOT NULL,
    termini_execucio INTEGER NOT NULL,
    codi_cpv TEXT NOT NULL,
    partida_organica TEXT NOT NULL,
    partida_programa TEXT NOT NULL,
    partida_economica TEXT NOT NULL,
    base_imposable REAL NOT NULL,
    quota_iva REAL NOT NULL,
    fitxers_pressupost TEXT NOT NULL,
    detalls_addicionals TEXT,
    sistema_tramitacio TEXT DEFAULT '',
    segex TEXT DEFAULT '',
    reg_factura TEXT DEFAULT '',
    relacio_q TEXT DEFAULT '',
    relacio_o TEXT DEFAULT '',
    finalitzat INTEGER DEFAULT 0,
    publicat INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMPTZ DEFAULT (datetime('now')),
    type TEXT NOT NULL,
    recipient_user_id INTEGER,
    triggered_by_user_id INTEGER NOT NULL,
    triggered_by_name TEXT NOT NULL,
    peticio_id INTEGER NOT NULL,
    peticio_objecte TEXT NOT NULL,
    changed_fields TEXT,
    read_by TEXT NOT NULL DEFAULT '[]'
  );
`);

// Motivacio migration
try {
  const tableInfo = db.pragma('table_info(records)') as any[];
  const hasMotivacioColumn = tableInfo.some(col => col.name === 'motivacio_no_contractacio');
  if (!hasMotivacioColumn) {
    db.exec(`ALTER TABLE records ADD COLUMN motivacio_no_contractacio TEXT`);
  }
} catch (e) {
  console.error("Migration error (motivacio_no_contractacio):", e);
}

// Role migration
try {
  const tableInfo = db.pragma('table_info(users)') as any[];
  const hasRoleColumn = tableInfo.some(col => col.name === 'role');
  if (!hasRoleColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Lectura'`);
  }

  const adminExists = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE role = 'Administrador'"
  ).get() as { count: number };

  if (adminExists.count === 0) {
    db.prepare(
      "UPDATE users SET role = 'Administrador' WHERE id = (SELECT MIN(id) FROM users)"
    ).run();
  }
} catch (e) {
  console.error("Migration error:", e);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer Setup for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error("Només s'accepten fitxers PDF."));
    }
  },
  limits: { files: 3, fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tens permisos per realitzar aquesta acció.' });
    }
    next();
  };
};

// --- API ROUTES ---

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Dades invàlides. La contrasenya ha de tenir almenys 8 caràcters.' });
  }

  try {
    // Check if this is the first user
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const role = userCount.count === 0 ? 'Administrador' : 'Lectura';

    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(full_name, email, hash, role);
    const newUserId = info.lastInsertRowid;

    const token = jwt.sign({ id: newUserId, email, full_name, role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'Usuari registrat correctament.', token, user: { id: newUserId, email, full_name, role } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Aquest correu electrònic ja està registrat.' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Error intern del servidor.' });
    }
  }
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = stmt.get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Correu electrònic o contrasenya incorrectes.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, full_name: user.full_name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

// Auth: Me
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// Records: Create
app.post('/api/peticions', authenticateToken, requireRole('Peticions', 'Gestió', 'Administrador'), upload.array('fitxers_pressupost', 3), (req: any, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0 || files.length > 3) {
      return res.status(400).json({ error: "S'han d'adjuntar entre 1 i 3 fitxers PDF." });
    }

    const fileData = files.map(f => ({
      name: f.originalname,
      path: `/uploads/${f.filename}`,
      size: f.size
    }));

    const data = req.body;
    const now = new Date();
    const hora = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO records (
        hora, email, nom, responsable_contracte, organ_contractacio, justificacio,
        objecte_contracte, caracteristiques_tecniques, tipus_contracte, tipus_despesa,
        termini_execucio, codi_cpv, partida_organica, partida_programa, partida_economica,
        base_imposable, quota_iva, fitxers_pressupost, detalls_addicionals, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      hora, req.user.email, req.user.full_name, data.responsable_contracte, data.organ_contractacio,
      data.justificacio, data.objecte_contracte, data.caracteristiques_tecniques, data.tipus_contracte,
      data.tipus_despesa, parseInt(data.termini_execucio), data.codi_cpv, data.partida_organica,
      data.partida_programa, data.partida_economica, parseFloat(data.base_imposable), parseFloat(data.quota_iva),
      JSON.stringify(fileData), data.detalls_addicionals || '', req.user.id
    );

    // Notification: New Request
    const notifStmt = db.prepare(`
      INSERT INTO notifications (
        type, recipient_user_id, triggered_by_user_id, triggered_by_name, 
        peticio_id, peticio_objecte, changed_fields, read_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    notifStmt.run(
      'new_request', null, req.user.id, req.user.full_name,
      info.lastInsertRowid, data.objecte_contracte, null, '[]'
    );

    res.status(201).json({ message: 'Petició creada correctament.', id: info.lastInsertRowid });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en desar la petició.' });
  }
});

// Records: Get All
app.get('/api/peticions', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT * FROM records ORDER BY id DESC');
  const records = stmt.all();
  res.json(records);
});

// Records: Update (Internal Management)
app.patch('/api/peticions/:id', authenticateToken, requireRole('Gestió', 'Administrador'), async (req: any, res) => {
  const { id } = req.params;
  const { sistema_tramitacio, segex, reg_factura, relacio_q, relacio_o, finalitzat, publicat, motivacio_no_contractacio } = req.body;

  try {
    const getStmt = db.prepare('SELECT * FROM records WHERE id = ?');
    const oldRecord = getStmt.get(id) as any;

    if (!oldRecord) {
      return res.status(404).json({ error: 'Petició no trobada.' });
    }

    const updateStmt = db.prepare(`
      UPDATE records SET
        sistema_tramitacio = ?, segex = ?, reg_factura = ?, relacio_q = ?, relacio_o = ?,
        finalitzat = ?, publicat = ?, motivacio_no_contractacio = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      sistema_tramitacio !== undefined ? sistema_tramitacio : oldRecord.sistema_tramitacio,
      segex !== undefined ? segex : oldRecord.segex,
      reg_factura !== undefined ? reg_factura : oldRecord.reg_factura,
      relacio_q !== undefined ? relacio_q : oldRecord.relacio_q,
      relacio_o !== undefined ? relacio_o : oldRecord.relacio_o,
      finalitzat !== undefined ? (finalitzat ? 1 : 0) : oldRecord.finalitzat,
      publicat !== undefined ? (publicat ? 1 : 0) : oldRecord.publicat,
      motivacio_no_contractacio !== undefined ? motivacio_no_contractacio : (oldRecord.motivacio_no_contractacio || ''),
      id
    );

    // Notification: Record Updated
    // Detect changed fields
    const changedFields = [];
    if (sistema_tramitacio !== undefined && sistema_tramitacio !== oldRecord.sistema_tramitacio) changedFields.push('Sistema de tramitació');
    if (segex !== undefined && segex !== oldRecord.segex) changedFields.push('SEGEX');
    if (reg_factura !== undefined && reg_factura !== oldRecord.reg_factura) changedFields.push('Reg. Factura');
    if (relacio_q !== undefined && relacio_q !== oldRecord.relacio_q) changedFields.push('Relació Q');
    if (relacio_o !== undefined && relacio_o !== oldRecord.relacio_o) changedFields.push('Relació O');
    if (finalitzat !== undefined && (finalitzat ? 1 : 0) !== oldRecord.finalitzat) changedFields.push('Finalitzat');
    if (publicat !== undefined && (publicat ? 1 : 0) !== oldRecord.publicat) changedFields.push('Publicat');
    if (motivacio_no_contractacio !== undefined && motivacio_no_contractacio !== (oldRecord.motivacio_no_contractacio || '')) changedFields.push('Motivació de no contractació');

    // Only notify if fields changed and user is not editing their own record
    if (changedFields.length > 0 && req.user.id !== oldRecord.created_by) {
      const notifStmt = db.prepare(`
        INSERT INTO notifications (
          type, recipient_user_id, triggered_by_user_id, triggered_by_name, 
          peticio_id, peticio_objecte, changed_fields, read_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      notifStmt.run(
        'record_updated', oldRecord.created_by, req.user.id, req.user.full_name,
        id, oldRecord.objecte_contracte, JSON.stringify(changedFields), '[]'
      );
    }

    res.json({ message: 'Petició actualitzada correctament.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error en actualitzar la petició.' });
  }
});

// Records: Delete
app.delete('/api/peticions/:id', authenticateToken, requireRole('Gestió', 'Administrador'), async (req: any, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID invàlid.' });
  }

  try {
    const getStmt = db.prepare('SELECT * FROM records WHERE id = ?');
    const record = getStmt.get(id) as any;

    if (!record) {
      return res.status(404).json({ error: "No s'ha trobat la petició sol·licitada." });
    }

    if (record.fitxers_pressupost) {
      try {
        const files = JSON.parse(record.fitxers_pressupost);
        for (const file of files) {
          if (file.path) {
            const fullPath = path.join(process.cwd(), file.path);
            try {
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
              }
            } catch (err) {
              console.error(`Error deleting file ${fullPath}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Error parsing fitxers_pressupost:', err);
      }
    }

    const deleteStmt = db.prepare('DELETE FROM records WHERE id = ?');
    deleteStmt.run(id);

    res.status(200).json({ message: 'Petició eliminada correctament.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Error intern del servidor.' });
  }
});

// Notifications: Get All
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  if (req.user.role === 'Lectura') return res.status(403).json({ error: 'Accés denegat.' });

  try {
    let stmt;
    if (req.user.role === 'Peticions') {
      stmt = db.prepare(`
        SELECT * FROM notifications 
        WHERE type = 'record_updated' AND recipient_user_id = ?
        ORDER BY created_at DESC
      `);
      const notifications = stmt.all(req.user.id) as any[];
      const result = notifications.map(n => ({
        ...n,
        changed_fields: JSON.parse(n.changed_fields || '[]'),
        read_by: JSON.parse(n.read_by || '[]'),
        is_read: JSON.parse(n.read_by || '[]').includes(req.user.id)
      }));
      return res.json(result);
    } else if (req.user.role === 'Gestió') {
      stmt = db.prepare(`
        SELECT * FROM notifications 
        WHERE type = 'new_request'
        ORDER BY created_at DESC
      `);
      const notifications = stmt.all() as any[];
      const result = notifications.map(n => ({
        ...n,
        changed_fields: JSON.parse(n.changed_fields || '[]'),
        read_by: JSON.parse(n.read_by || '[]'),
        is_read: JSON.parse(n.read_by || '[]').includes(req.user.id)
      }));
      return res.json(result);
    } else if (req.user.role === 'Administrador') {
      stmt = db.prepare(`
        SELECT * FROM notifications 
        ORDER BY created_at DESC
      `);
      const notifications = stmt.all() as any[];
      const result = notifications.map(n => ({
        ...n,
        changed_fields: JSON.parse(n.changed_fields || '[]'),
        read_by: JSON.parse(n.read_by || '[]'),
        is_read: JSON.parse(n.read_by || '[]').includes(req.user.id)
      }));
      return res.json(result);
    } else {
      return res.json([]);
    }
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error en carregar les notificacions.' });
  }
});

// Notifications: Mark Read
app.post('/api/notifications/mark-read', authenticateToken, (req: any, res) => {
  if (req.user.role === 'Lectura') return res.status(403).json({ error: 'Accés denegat.' });

  const { notification_ids } = req.body;
  if (!Array.isArray(notification_ids)) return res.status(400).json({ error: 'Format invàlid.' });

  try {
    let count = 0;
    const getStmt = db.prepare('SELECT read_by FROM notifications WHERE id = ?');
    const updateStmt = db.prepare('UPDATE notifications SET read_by = ? WHERE id = ?');

    const transaction = db.transaction((ids) => {
      for (const id of ids) {
        const row = getStmt.get(id) as any;
        if (row) {
          const readBy = JSON.parse(row.read_by || '[]');
          if (!readBy.includes(req.user.id)) {
            readBy.push(req.user.id);
            updateStmt.run(JSON.stringify(readBy), id);
            count++;
          }
        }
      }
    });

    transaction(notification_ids);
    res.json({ success: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en marcar com a llegides.' });
  }
});

// Notifications: Unread Count
app.get('/api/notifications/unread-count', authenticateToken, (req: any, res) => {
  if (req.user.role === 'Lectura') return res.status(403).json({ error: 'Accés denegat.' });

  try {
    let stmt;
    let notifications = [];

    if (req.user.role === 'Peticions') {
      stmt = db.prepare(`
        SELECT read_by FROM notifications 
        WHERE type = 'record_updated' AND recipient_user_id = ?
      `);
      notifications = stmt.all(req.user.id) as any[];
    } else if (req.user.role === 'Gestió') {
      stmt = db.prepare(`
        SELECT read_by FROM notifications 
        WHERE type = 'new_request'
      `);
      notifications = stmt.all() as any[];
    } else if (req.user.role === 'Administrador') {
      stmt = db.prepare(`
        SELECT read_by FROM notifications
      `);
      notifications = stmt.all() as any[];
    }

    const unreadCount = notifications.filter(n => {
      const readBy = JSON.parse(n.read_by || '[]');
      return !readBy.includes(req.user.id);
    }).length;

    res.json({ count: unreadCount });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Error en carregar el recompte de notificacions.' });
  }
});

// Vite Integration
// Users: Get All
app.get('/api/users', authenticateToken, requireRole('Administrador'), (req: any, res) => {
  const stmt = db.prepare('SELECT id, full_name, email, role FROM users ORDER BY id ASC');
  const users = stmt.all();
  res.json(users);
});

// Users: Update Role
app.patch('/api/users/:id/role', authenticateToken, requireRole('Administrador'), (req: any, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['Lectura', 'Peticions', 'Gestió', 'Administrador'].includes(role)) {
    return res.status(400).json({ error: 'Rol invàlid.' });
  }

  try {
    const updateStmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    const info = updateStmt.run(role, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Usuari no trobat.' });
    }

    const getStmt = db.prepare('SELECT id, full_name, email, role FROM users WHERE id = ?');
    const updatedUser = getStmt.get(id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error en actualitzar el rol.' });
  }
});

async function startServer() {
  // API 404 Handler - Must be before Vite middleware
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
