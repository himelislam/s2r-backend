const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness, generateQrCodes} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', authMiddleware, getAllBusiness);
router.post('/generateQrCodes', generateQrCodes)

module.exports = router;