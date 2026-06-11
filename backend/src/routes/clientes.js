const express = require('express');
const { authMiddleware, soloAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/clientes');
const router = express.Router();

router.use(authMiddleware);

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);
router.post('/',      ctrl.create);
router.patch('/:id',  ctrl.update);
router.delete('/:id', soloAdmin, ctrl.remove);  // solo admin elimina

module.exports = router;
