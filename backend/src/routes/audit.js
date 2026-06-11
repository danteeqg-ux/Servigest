const express = require('express');
const { authMiddleware, soloAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/audit');
const router = express.Router();

router.use(authMiddleware);
router.use(soloAdmin);  // solo admin ve los logs

router.get('/',          ctrl.getAll);
router.get('/resumen',   ctrl.resumen);
router.get('/usuarios',  ctrl.porUsuario);

module.exports = router;
