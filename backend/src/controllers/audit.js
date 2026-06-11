const db = require('../db/connection');

// GET /api/audit — lista logs con filtros
async function getAll(req, res, next) {
  try {
    const { accion, usuario_id, entidad, desde, hasta, limit = 100 } = req.query;
    const empresa_id = req.user.empresa_id;

    let query = `
      SELECT al.*, u.email AS usuario_email
      FROM audit_logs al
      LEFT JOIN usuarios u ON u.id = al.usuario_id
      WHERE al.empresa_id = $1
    `;
    const params = [empresa_id];
    let idx = 2;

    if (accion)      { query += ` AND al.accion = $${idx++}`;            params.push(accion); }
    if (usuario_id)  { query += ` AND al.usuario_id = $${idx++}`;        params.push(usuario_id); }
    if (entidad)     { query += ` AND al.entidad = $${idx++}`;           params.push(entidad); }
    if (desde)       { query += ` AND al.created_at >= $${idx++}`;       params.push(desde); }
    if (hasta)       { query += ` AND al.created_at <= $${idx++}`;       params.push(hasta); }

    query += ` ORDER BY al.created_at DESC LIMIT $${idx}`;
    params.push(Math.min(parseInt(limit), 500));

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch(err) { next(err); }
}

// GET /api/audit/resumen — conteo por acción (para el dashboard de logs)
async function resumen(req, res, next) {
  try {
    const result = await db.query(
      `SELECT accion, COUNT(*) AS total,
              MAX(created_at) AS ultima_vez
       FROM audit_logs
       WHERE empresa_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY accion
       ORDER BY total DESC`,
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch(err) { next(err); }
}

// GET /api/audit/usuarios — actividad por usuario
async function porUsuario(req, res, next) {
  try {
    const result = await db.query(
      `SELECT al.usuario_id, al.usuario_nombre, u.email,
              COUNT(*) AS acciones,
              MAX(al.created_at) AS ultima_actividad
       FROM audit_logs al
       LEFT JOIN usuarios u ON u.id = al.usuario_id
       WHERE al.empresa_id = $1
         AND al.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY al.usuario_id, al.usuario_nombre, u.email
       ORDER BY acciones DESC`,
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch(err) { next(err); }
}

module.exports = { getAll, resumen, porUsuario };
