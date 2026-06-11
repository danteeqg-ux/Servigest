const db = require('../db/connection');

// GET /api/alertas — alertas del rol actual
async function getAll(req, res, next) {
  try {
    const { solo_no_leidas = false } = req.query;
    const rol = req.user.rol;

    // Admin ve todo, operador solo las suyas
    let query = `
      SELECT a.*, ot.numero AS ot_numero, ot.equipo AS ot_equipo,
             c.nombre AS cliente_nombre
      FROM alertas a
      LEFT JOIN ordenes_trabajo ot ON ot.id = a.ot_id
      LEFT JOIN clientes c ON c.id = ot.cliente_id
      WHERE a.empresa_id = $1
        AND (a.para_rol = $2 OR $2 = 'admin')
    `;
    const params = [req.user.empresa_id, rol];

    if (solo_no_leidas === 'true') {
      query += ' AND a.leida = false';
    }

    query += ' ORDER BY a.created_at DESC LIMIT 100';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch(err) { next(err); }
}

// GET /api/alertas/conteo — badge del navbar
async function conteo(req, res, next) {
  try {
    const result = await db.query(
      `SELECT COUNT(*) AS total
       FROM alertas
       WHERE empresa_id = $1
         AND (para_rol = $2 OR $2 = 'admin')
         AND leida = false AND resuelta = false`,
      [req.user.empresa_id, req.user.rol]
    );
    res.json({ total: Number(result.rows[0].total) });
  } catch(err) { next(err); }
}

// PATCH /api/alertas/:id/leer
async function marcarLeida(req, res, next) {
  try {
    await db.query(
      'UPDATE alertas SET leida = true WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Marcada como leída' });
  } catch(err) { next(err); }
}

// PATCH /api/alertas/leer-todas
async function leerTodas(req, res, next) {
  try {
    await db.query(
      'UPDATE alertas SET leida = true WHERE empresa_id = $1 AND para_rol = $2',
      [req.user.empresa_id, req.user.rol]
    );
    res.json({ message: 'Todas marcadas como leídas' });
  } catch(err) { next(err); }
}

// PATCH /api/alertas/:id/resolver
async function resolver(req, res, next) {
  try {
    await db.query(
      'UPDATE alertas SET leida = true, resuelta = true WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.user.empresa_id]
    );
    res.json({ message: 'Alerta resuelta' });
  } catch(err) { next(err); }
}

module.exports = { getAll, conteo, marcarLeida, leerTodas, resolver };
