const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness, generateQrCodes, getBusinessById} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', getAllBusiness);
router.post('/generateQrCodes', generateQrCodes)
router.post('/getBusinessById', getBusinessById);

module.exports = router;