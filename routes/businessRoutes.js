const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness, createQrCodes} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', authMiddleware, getAllBusiness);
router.post('/createQrCodes', createQrCodes)

module.exports = router;