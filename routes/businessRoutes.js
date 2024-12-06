const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness, generateQrCodes, getQrCodesByBusinessId, getBusinessById} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', authMiddleware, getAllBusiness);
router.post('/generateQrCodes', generateQrCodes)
// router.post('/getQrCodesByBusinessId', authMiddleware, getQrCodesByBusinessId);
router.post('/getBusinessById', authMiddleware, getBusinessById);

module.exports = router;