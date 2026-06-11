const express = require('express');
const { authMiddleware, soloAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/usuarios');
const router = express.Router();

router.use(authMiddleware);
router.use(soloAdmin);  // solo admin gestiona usuarios

router.get('/',                  ctrl.getAll);
router.post('/',                 ctrl.create);
router.patch('/:id',             ctrl.update);
router.patch('/:id/password',    ctrl.resetPassword);
router.delete('/:id',            ctrl.remove);

module.exports = router;
