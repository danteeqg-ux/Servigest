const db = require('../db/connection');

async function getAll(req, res, next) {
  try {
    const { search } = req.query;
    const esOperador = req.user.rol === 'operador';

    // Operador no ve precio de costo ni margen — información sensible del negocio
    const campos = esOperador
      ? 'id, empresa_id, nombre, descripcion, sku, unidad, clave_sat, precio, stock, stock_minimo, activo, created_at'
      : '*';

    let query = `SELECT ${campos} FROM productos WHERE empresa_id = $1 AND activo = true`;
    const params = [req.user.empresa_id];

    if (search) {
      query += ` AND (nombre ILIKE $2 OR sku ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY nombre ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const result = await db.query(
      'SELECT * FROM productos WHERE id = $1 AND empresa_id = $2',
      [req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { nombre, descripcion, sku, unidad, clave_sat, precio, costo, stock, stock_minimo } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const result = await db.query(
      `INSERT INTO productos (empresa_id, nombre, descripcion, sku, unidad, clave_sat, precio, costo, stock, stock_minimo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.empresa_id, nombre, descripcion, sku, unidad||'servicio', clave_sat||'84111500',
       precio||0, costo||0, stock||0, stock_minimo||0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { nombre, descripcion, sku, unidad, clave_sat, precio, costo, stock, stock_minimo } = req.body;
    const result = await db.query(
      `UPDATE productos SET
         nombre       = COALESCE($1,  nombre),
         descripcion  = COALESCE($2,  descripcion),
         sku          = COALESCE($3,  sku),
         unidad       = COALESCE($4,  unidad),
         clave_sat    = COALESCE($5,  clave_sat),
         precio       = COALESCE($6,  precio),
         costo        = COALESCE($7,  costo),
         stock        = COALESCE($8,  stock),
         stock_minimo = COALESCE($9,  stock_minimo)
       WHERE id = $10 AND empresa_id = $11 RETURNING *`,
      [nombre, descripcion, sku, unidad, clave_sat, precio, costo, stock, stock_minimo,
       req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    // Soft delete — no borrar si tiene pedidos
    const result = await db.query(
      'UPDATE productos SET activo = false WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [req.params.id, req.user.empresa_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) { next(err); }
}

// Alerta de stock bajo
async function stockBajo(req, res, next) {
  try {
    const result = await db.query(
      `SELECT * FROM productos
       WHERE empresa_id = $1 AND activo = true AND stock <= stock_minimo AND stock_minimo > 0
       ORDER BY stock ASC`,
      [req.user.empresa_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove, stockBajo };
