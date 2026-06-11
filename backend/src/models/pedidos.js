// models/pedidos.js
// Encapsula las consultas SQL de pedidos para mantener los controllers limpios

const db = require('../db/connection');

const PedidoModel = {

  async findAll({ empresa_id, estado, desde, hasta }) {
    let query = `
      SELECT p.id, p.numero, p.descripcion, p.monto, p.estado,
             p.fecha_servicio, p.created_at,
             c.nombre   AS cliente_nombre,
             c.telefono AS cliente_telefono,
             s.nombre   AS servicio_nombre,
             s.categoria
      FROM pedidos p
      JOIN clientes c ON c.id = p.cliente_id
      LEFT JOIN servicios_catalogo s ON s.id = p.servicio_id
      WHERE p.empresa_id = $1
    `;
    const params = [empresa_id];
    let idx = 2;

    if (estado)  { query += ` AND p.estado = $${idx++}`;        params.push(estado); }
    if (desde)   { query += ` AND p.created_at >= $${idx++}`;   params.push(desde); }
    if (hasta)   { query += ` AND p.created_at <= $${idx++}`;   params.push(hasta); }

    query += ' ORDER BY p.created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  },

  async findById(id, empresa_id) {
    const result = await db.query(
      `SELECT p.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
              s.nombre AS servicio_nombre, s.categoria
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       LEFT JOIN servicios_catalogo s ON s.id = p.servicio_id
       WHERE p.id = $1 AND p.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async create({ cliente_id, servicio_id, descripcion, monto, fecha_servicio, empresa_id }) {
    const result = await db.query(
      `INSERT INTO pedidos (cliente_id, servicio_id, descripcion, monto, fecha_servicio, empresa_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [cliente_id, servicio_id || null, descripcion, monto, fecha_servicio || null, empresa_id]
    );
    return result.rows[0];
  },

  async update(id, empresa_id, fields) {
    const result = await db.query(
      `UPDATE pedidos
       SET descripcion    = COALESCE($1, descripcion),
           monto          = COALESCE($2, monto),
           estado         = COALESCE($3, estado),
           fecha_servicio = COALESCE($4, fecha_servicio),
           servicio_id    = COALESCE($5, servicio_id)
       WHERE id = $6 AND empresa_id = $7
       RETURNING *`,
      [fields.descripcion, fields.monto, fields.estado, fields.fecha_servicio, fields.servicio_id, id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async delete(id, empresa_id) {
    const result = await db.query(
      'DELETE FROM pedidos WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async summary(empresa_id) {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
         COUNT(*) FILTER (WHERE estado = 'en_camino') AS en_camino,
         COUNT(*) FILTER (WHERE estado = 'entregado') AS entregados,
         COUNT(*) FILTER (WHERE estado = 'cancelado') AS cancelados,
         COALESCE(SUM(monto) FILTER (
           WHERE estado = 'entregado' AND created_at >= date_trunc('day', NOW())
         ), 0) AS cobrado_hoy,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW())) AS pedidos_hoy
       FROM pedidos WHERE empresa_id = $1`,
      [empresa_id]
    );
    return result.rows[0];
  },
};

module.exports = PedidoModel;
