const jwt = require('jsonwebtoken');

// ── Autenticación base ────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = {
      id:         payload.id,
      empresa_id: payload.empresa_id,
      rol:        payload.rol || 'admin',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// ── Fábrica de middleware por rol ─────────────────────────────────────────────
// Uso: router.delete('/:id', auth, roles('admin'), ctrl.remove)
function roles(...permitidos) {
  return (req, res, next) => {
    if (!permitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${permitidos.join(' o ')}`,
      });
    }
    next();
  };
}

// ── Atajos semánticos ─────────────────────────────────────────────────────────
const soloAdmin      = roles('admin', 'superadmin');
const adminOContador = roles('admin', 'superadmin', 'contador');
const noOperador     = roles('admin', 'superadmin', 'contador');

module.exports = { authMiddleware, roles, soloAdmin, adminOContador, noOperador };
