const express = require('express');
const { authMiddleware, soloAdmin, roles } = require('../middleware/auth');
const ctrl = require('../controllers/productos');
const router = express.Router();

router.use(authMiddleware);

router.get('/stock-bajo', ctrl.stockBajo);
router.get('/',           ctrl.getAll);     // operador ve productos (sin costo — filtrado en controller)
router.get('/:id',        ctrl.getById);
router.post('/',          soloAdmin, ctrl.create);   // solo admin crea
router.patch('/:id',      soloAdmin, ctrl.update);   // solo admin edita precios
router.delete('/:id',     soloAdmin, ctrl.remove);

module.exports = router;
