const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { saveZapierURL, testZapierURL } = require('../controllers/integrationController');

router.post('/saveZapierURL', authMiddleware, saveZapierURL)
router.post('/testZapierURL', authMiddleware, testZapierURL)

module.exports = router;