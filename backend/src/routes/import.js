const express  = require('express');
const multer   = require('multer');
const { authMiddleware: auth } = require('../middleware/auth');
const ctrl     = require('../controllers/import');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')
               || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    cb(ok ? null : new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), ok);
  },
});

const router = express.Router();
router.use(auth);
router.get('/plantilla/:tipo',           ctrl.plantilla);
router.post('/clientes',  upload.single('archivo'), ctrl.importClientes);
router.post('/productos', upload.single('archivo'), ctrl.importProductos);
module.exports = router;
