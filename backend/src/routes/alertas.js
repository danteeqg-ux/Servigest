const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/alertas');
const router = express.Router();

router.use(authMiddleware);

router.get('/',                 ctrl.getAll);
router.get('/conteo',           ctrl.conteo);
router.patch('/leer-todas',     ctrl.leerTodas);
router.patch('/:id/leer',       ctrl.marcarLeida);
router.patch('/:id/resolver',   ctrl.resolver);

module.exports = router;
