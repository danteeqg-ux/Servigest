const db = require('../db/connection');

async function getAll(req, res, next) {
  try {
    const result = await db.query(
      `SELECT * FROM servicios_catalogo
       WHERE empresa_id = $1
       ORDER BY categoria, nombre ASC`,
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { nombre, categoria, precio_base } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const result = await db.query(
      `INSERT INTO servicios_catalogo (nombre, categoria, precio_base, empresa_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, categoria || null, precio_base || 0, req.user.empresa_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { nombre, categoria, precio_base } = req.body;
    const result = await db.query(
      `UPDATE servicios_catalogo
       SET nombre      = COALESCE($1, nombre),
           categoria   = COALESCE($2, categoria),
           precio_base = COALESCE($3, precio_base)
       WHERE id = $4 AND empresa_id = $5
       RETURNING *`,
      [nombre, categoria, precio_base, req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const result = await db.query(
      'DELETE FROM servicios_catalogo WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, create, update, remove };
