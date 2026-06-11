const db = require('../db/connection');

async function getAll(req, res, next) {
  try {
    const result = await db.query(
      'SELECT * FROM compras WHERE empresa_id = $1 ORDER BY created_at DESC',
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { proveedor, descripcion, items, fecha_entrega } = req.body;
    if (!proveedor || !items?.length) {
      return res.status(400).json({ error: 'proveedor e items son requeridos' });
    }
    const total = items.reduce((s, i) => s + (Number(i.cantidad) * Number(i.precio_unit)), 0);
    const result = await db.query(
      `INSERT INTO compras (empresa_id, proveedor, descripcion, items, total, fecha_entrega)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.empresa_id, proveedor, descripcion, JSON.stringify(items), total, fecha_entrega||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function updateEstado(req, res, next) {
  try {
    const { estado } = req.body;
    const validos = ['pendiente','recibida','cancelada'];
    if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const result = await db.query(
      'UPDATE compras SET estado = $1 WHERE id = $2 AND empresa_id = $3 RETURNING *',
      [estado, req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Compra no encontrada' });

    // Si se recibió, actualizar stock de productos relacionados
    if (estado === 'recibida') {
      const compra = result.rows[0];
      for (const item of compra.items) {
        if (item.producto_id) {
          await db.query(
            'UPDATE productos SET stock = stock + $1 WHERE id = $2 AND empresa_id = $3',
            [item.cantidad, item.producto_id, req.user.empresa_id]
          );
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, updateEstado };
