const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { saveZapierURL, testZapierURL, savePabblyURL, testPabblyURL } = require('../controllers/integrationController');

router.post('/saveZapierURL', authMiddleware, saveZapierURL)
router.post('/testZapierURL', authMiddleware, testZapierURL)
router.post('/savePabblyURL', authMiddleware, savePabblyURL)
router.post('/testPabblyURL', authMiddleware, testPabblyURL)

module.exports = router;