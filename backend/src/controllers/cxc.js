const db = require('../db/connection');

async function getAll(req, res, next) {
  try {
    const { estado } = req.query;
    let q = `
      SELECT cxc.*, c.nombre AS cliente_nombre, c.telefono AS cliente_tel
      FROM cuentas_por_cobrar cxc
      JOIN clientes c ON c.id = cxc.cliente_id
      WHERE cxc.empresa_id = $1
    `;
    const params = [req.user.empresa_id];
    if (estado) { q += ' AND cxc.estado = $2'; params.push(estado); }
    q += ' ORDER BY cxc.fecha_vence ASC';

    const result = await db.query(q, params);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { cliente_id, pedido_id, factura_id, monto, fecha_vence, notas } = req.body;
    if (!cliente_id || !monto || !fecha_vence) {
      return res.status(400).json({ error: 'cliente_id, monto y fecha_vence son requeridos' });
    }
    const result = await db.query(
      `INSERT INTO cuentas_por_cobrar (empresa_id, cliente_id, pedido_id, factura_id, monto, fecha_vence, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.empresa_id, cliente_id, pedido_id||null, factura_id||null, monto, fecha_vence, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

// Registrar pago parcial o total
async function registrarPago(req, res, next) {
  try {
    const { monto, metodo, referencia, fecha, notas } = req.body;
    if (!monto) return res.status(400).json({ error: 'monto es requerido' });

    const cxcRes = await db.query(
      'SELECT * FROM cuentas_por_cobrar WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.user.empresa_id]
    );
    const cxc = cxcRes.rows[0];
    if (!cxc) return res.status(404).json({ error: 'CxC no encontrada' });

    // Insertar pago
    await db.query(
      `INSERT INTO pagos_cxc (cxc_id, monto, metodo, referencia, fecha, notas)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [cxc.id, monto, metodo||'efectivo', referencia, fecha||new Date(), notas]
    );

    // Actualizar monto pagado
    const nuevoPagado = Number(cxc.monto_pagado) + Number(monto);
    const nuevoEstado = nuevoPagado >= Number(cxc.monto) ? 'pagada' : 'parcial';

    await db.query(
      'UPDATE cuentas_por_cobrar SET monto_pagado = $1, estado = $2 WHERE id = $3',
      [nuevoPagado, nuevoEstado, cxc.id]
    );

    res.json({ message: 'Pago registrado', estado: nuevoEstado, monto_pagado: nuevoPagado });
  } catch (err) { next(err); }
}

// Resumen de CxC para dashboard
async function resumen(req, res, next) {
  try {
    const result = await db.query(
      `SELECT
         COALESCE(SUM(monto - monto_pagado) FILTER (WHERE estado IN ('pendiente','parcial')), 0) AS por_cobrar,
         COALESCE(SUM(monto - monto_pagado) FILTER (WHERE estado = 'vencida'), 0) AS vencido,
         COUNT(*) FILTER (WHERE estado = 'vencida') AS cuentas_vencidas,
         COUNT(*) FILTER (WHERE estado IN ('pendiente','parcial')) AS cuentas_vigentes
       FROM cuentas_por_cobrar WHERE empresa_id = $1`,
      [req.user.empresa_id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, registrarPago, resumen };
