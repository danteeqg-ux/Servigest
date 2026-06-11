// models/clientes.js

const db = require('../db/connection');

const ClienteModel = {

  async findAll(empresa_id) {
    const result = await db.query(
      `SELECT c.*,
              COUNT(p.id) AS total_pedidos,
              COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'entregado'), 0) AS total_facturado
       FROM clientes c
       LEFT JOIN pedidos p ON p.cliente_id = c.id
       WHERE c.empresa_id = $1
       GROUP BY c.id
       ORDER BY c.nombre ASC`,
      [empresa_id]
    );
    return result.rows;
  },

  async findById(id, empresa_id) {
    const cliente = await db.query(
      'SELECT * FROM clientes WHERE id = $1 AND empresa_id = $2',
      [id, empresa_id]
    );
    return cliente.rows[0] || null;
  },

  async create({ nombre, telefono, email, direccion, empresa_id }) {
    const result = await db.query(
      `INSERT INTO clientes (nombre, telefono, email, direccion, empresa_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, telefono, email, direccion, empresa_id]
    );
    return result.rows[0];
  },

  async update(id, empresa_id, fields) {
    const result = await db.query(
      `UPDATE clientes
       SET nombre    = COALESCE($1, nombre),
           telefono  = COALESCE($2, telefono),
           email     = COALESCE($3, email),
           direccion = COALESCE($4, direccion)
       WHERE id = $5 AND empresa_id = $6
       RETURNING *`,
      [fields.nombre, fields.telefono, fields.email, fields.direccion, id, empresa_id]
    );
    return result.rows[0] || null;
  },

  async delete(id, empresa_id) {
    const result = await db.query(
      'DELETE FROM clientes WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresa_id]
    );
    return result.rows[0] || null;
  },
};

module.exports = ClienteModel;
