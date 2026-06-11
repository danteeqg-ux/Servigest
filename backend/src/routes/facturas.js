const express = require('express');
const { authMiddleware, soloAdmin, roles } = require('../middleware/auth');
const ctrl = require('../controllers/facturas');
const router = express.Router();

router.use(authMiddleware);

router.get('/',              ctrl.getAll);
router.get('/:id',           ctrl.getById);
router.post('/',             ctrl.create);                    // operador puede crear borrador
router.post('/:id/timbrar',  roles('admin','superadmin','contador'), ctrl.timbrar);   // no operador
router.post('/:id/cancelar', soloAdmin, ctrl.cancelar);       // solo admin cancela

module.exports = router;
