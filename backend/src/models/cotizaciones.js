// models/cotizaciones.js

const db = require('../db/connection');

const CotizacionModel = {

  async findAll(empresa_id) {
    const result = await db.query(
      `SELECT co.id, co.items, co.total, co.estado, co.created_at,
              c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
       FROM cotizaciones co
       JOIN clientes c ON c.id = co.cliente_id
       WHERE co.empresa_id = $1
       ORDER BY co.created_at DESC`,
      [empresa_id]
    );
    return result.rows;
  },

  async findById(id, empresa_id) {
    const result = await db.query(
      `SELECT co.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
              c.email AS cliente_email, c.direccion AS cliente_direccion,
              u.empresa AS empresa_nombre, u.nombre AS empresa_contacto
       FROM cotizaciones co
       JOIN clientes c ON c.id = co.cliente_id
       JOIN usuarios u ON u.id = co.empresa_id
       WHERE co.id = $1 AND co.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async create({ cliente_id, items, total, empresa_id }) {
    const result = await db.query(
      `INSERT INTO cotizaciones (cliente_id, items, total, empresa_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cliente_id, JSON.stringify(items), total, empresa_id]
    );
    return result.rows[0];
  },

  async updateEstado(id, empresa_id, estado) {
    const result = await db.query(
      `UPDATE cotizaciones SET estado = $1
       WHERE id = $2 AND empresa_id = $3 RETURNING *`,
      [estado, id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async delete(id, empresa_id) {
    const result = await db.query(
      'DELETE FROM cotizaciones WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresa_id]
    );
    return result.rows[0] || null;
  },
};

module.exports = CotizacionModel;
