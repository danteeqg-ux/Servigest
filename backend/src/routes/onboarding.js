const express = require('express');
const { authMiddleware: auth } = require('../middleware/auth');
const ctrl    = require('../controllers/onboarding');
const router  = express.Router();
router.use(auth);
router.get('/',          ctrl.estado);
router.post('/completar',ctrl.completar);
module.exports = router;
