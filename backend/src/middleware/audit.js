// audit.js — middleware y helper para registrar acciones en audit_logs
// Uso en controller: await log(req, 'crear_pedido', 'pedido', result.id, { monto: 1500 })

const db = require('../db/connection');

// ── Helper directo (se llama desde controllers) ───────────────────────────────
async function log(req, accion, entidad, entidad_id = null, detalle = {}) {
  try {
    await db.query(
      `INSERT INTO audit_logs
         (empresa_id, usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user.empresa_id,
        req.user.id,
        req.user.nombre || null,
        accion,
        entidad,
        entidad_id || null,
        JSON.stringify(detalle),
        req.ip || req.headers['x-forwarded-for'] || null,
      ]
    );
  } catch (err) {
    // Los logs nunca deben romper el flujo principal
    console.error('[audit] Error al registrar log:', err.message);
  }
}

// ── Middleware automático para acciones comunes ────────────────────────────────
// Registra automáticamente POST/PATCH/DELETE sin tocar los controllers
// Solo para rutas que ya tienen req.user (después de authMiddleware)
function autoAudit(entidad) {
  return async (req, res, next) => {
    // Guardar el json original para interceptar la respuesta
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Solo loggear si la respuesta fue exitosa
      if (res.statusCode < 400 && req.user) {
        const accionMap = {
          POST:   `crear_${entidad}`,
          PATCH:  `editar_${entidad}`,
          DELETE: `eliminar_${entidad}`,
        };
        const accion = accionMap[req.method];
        if (accion) {
          const id = body?.id || req.params?.id || null;
          log(req, accion, entidad, id, {
            metodo: req.method,
            path:   req.path,
            body:   sanitize(req.body),
          });
        }
      }
      return originalJson(body);
    };

    next();
  };
}

// Elimina campos sensibles antes de guardar en el log
function sanitize(body = {}) {
  const omitir = ['password', 'password_hash', 'facturapi_key', 'token'];
  const limpio = { ...body };
  omitir.forEach(k => { if (limpio[k]) limpio[k] = '***'; });
  return limpio;
}

module.exports = { log, autoAudit };
