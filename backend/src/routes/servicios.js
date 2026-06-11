const express = require('express');
const { authMiddleware: auth } = require('../middleware/auth');
const ctrl    = require('../controllers/servicios');

const router = express.Router();

router.use(auth);

router.get('/',      ctrl.getAll);
router.post('/',     ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id',ctrl.remove);

module.exports = router;
