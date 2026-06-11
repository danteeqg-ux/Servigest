const db = require('../db/connection');

// GET /api/onboarding/estado
async function estado(req, res, next) {
  try {
    const empresa_id = req.user.empresa_id;

    const [emp, clientes, productos, pedidos] = await Promise.all([
      db.query('SELECT rfc, regimen_fiscal FROM empresas WHERE id = $1', [empresa_id]),
      db.query('SELECT COUNT(*) FROM clientes WHERE empresa_id = $1',   [empresa_id]),
      db.query('SELECT COUNT(*) FROM productos WHERE empresa_id = $1',  [empresa_id]),
      db.query('SELECT COUNT(*) FROM pedidos WHERE empresa_id = $1',    [empresa_id]),
    ]);

    const e = emp.rows[0];
    const pasos = [
      { id: 'empresa',   titulo: 'Completa los datos de tu empresa', hecho: !!(e?.rfc && e?.regimen_fiscal), descripcion: 'RFC y régimen fiscal necesarios para facturar' },
      { id: 'cliente',   titulo: 'Agrega tu primer cliente',          hecho: parseInt(clientes.rows[0].count) > 0, descripcion: 'Importa desde Excel o agrega manualmente' },
      { id: 'producto',  titulo: 'Agrega un servicio o producto',     hecho: parseInt(productos.rows[0].count) > 0, descripcion: 'Define los servicios que ofreces' },
      { id: 'pedido',    titulo: 'Crea tu primer pedido',             hecho: parseInt(pedidos.rows[0].count) > 0, descripcion: 'Registra tu primer servicio' },
    ];

    const completados = pasos.filter(p => p.hecho).length;
    const porcentaje  = Math.round((completados / pasos.length) * 100);

    res.json({ pasos, completados, total: pasos.length, porcentaje });
  } catch (err) { next(err); }
}

// POST /api/onboarding/completar — marca el onboarding como terminado
async function completar(req, res, next) {
  try {
    await db.query(
      'UPDATE usuarios SET onboarding_ok = true WHERE id = $1',
      [req.user.id]
    );
    res.json({ message: 'Onboarding completado' });
  } catch (err) { next(err); }
}

module.exports = { estado, completar };
