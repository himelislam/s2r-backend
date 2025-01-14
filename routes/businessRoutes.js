const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness, generateQrCodes, getBusinessById, inviteReferrer, updateProfile, updateBusinessProfile} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', getAllBusiness);
router.post('/generateQrCodes', generateQrCodes)
router.post('/getBusinessById', getBusinessById);
router.post('/inviteReferrer', inviteReferrer);
router.post('/updateProfile', authMiddleware, updateProfile);
router.post('/updateBusinessProfile', authMiddleware, updateBusinessProfile )

module.exports = router;