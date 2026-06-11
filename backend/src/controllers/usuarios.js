const { log } = require('../middleware/audit');
const bcrypt = require('bcryptjs');
const db     = require('../db/connection');

// GET /api/usuarios — lista usuarios de la empresa
async function getAll(req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, nombre, email, rol, onboarding_ok, created_at
       FROM usuarios WHERE empresa_id = $1 ORDER BY created_at ASC`,
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch(err) { next(err); }
}

// POST /api/usuarios — admin crea un usuario nuevo en su empresa
async function create(req, res, next) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son requeridos' });
    }

    const rolesValidos = ['admin', 'operador', 'contador'];
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido. Usa: admin, operador o contador' });
    }

    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO usuarios (empresa_id, nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol, created_at`,
      [req.user.empresa_id, nombre, email, hash, rol || 'operador']
    );

    await log(req, 'crear_usuario', 'usuario', result.rows[0].id, { email, rol: rol||'operador' });
    res.status(201).json(result.rows[0]);
  } catch(err) { next(err); }
}

// PATCH /api/usuarios/:id — cambiar rol o nombre
async function update(req, res, next) {
  try {
    const { nombre, rol } = req.body;

    // No puede editarse a sí mismo el rol (para no bloquearse)
    if (req.params.id === req.user.id && rol && rol !== req.user.rol) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const rolesValidos = ['admin', 'operador', 'contador'];
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const result = await db.query(
      `UPDATE usuarios
       SET nombre = COALESCE($1, nombre),
           rol    = COALESCE($2, rol)
       WHERE id = $3 AND empresa_id = $4
       RETURNING id, nombre, email, rol`,
      [nombre, rol, req.params.id, req.user.empresa_id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch(err) { next(err); }
}

// PATCH /api/usuarios/:id/password — resetear contraseña
async function resetPassword(req, res, next) {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2 AND empresa_id = $3 RETURNING id',
      [hash, req.params.id, req.user.empresa_id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Contraseña actualizada' });
  } catch(err) { next(err); }
}

// DELETE /api/usuarios/:id — desactivar usuario
async function remove(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const result = await db.query(
      'DELETE FROM usuarios WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [req.params.id, req.user.empresa_id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    await log(req, 'eliminar_usuario', 'usuario', req.params.id, {});
    res.json({ message: 'Usuario eliminado' });
  } catch(err) { next(err); }
}

module.exports = { getAll, create, update, resetPassword, remove };
