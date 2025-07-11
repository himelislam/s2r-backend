const express = require('express');
const router = express.Router();
const { createBusiness , addReferrer, getAllBusiness, generateQrCodes, getBusinessById, inviteReferrer, updateProfile, updateBusinessProfile, uploadProfileImage, createOnboardingData} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const {upload} = require('../middlewares/multerMiddleware');

router.post('/createBusiness', createBusiness);
router.post('/addReferrer', addReferrer);
router.get('/getAllBusiness', getAllBusiness);
router.post('/generateQrCodes', generateQrCodes)
router.post('/getBusinessById', getBusinessById);
router.post('/inviteReferrer', inviteReferrer);
router.post('/updateProfile', authMiddleware, updateProfile);
router.post('/updateBusinessProfile', authMiddleware, updateBusinessProfile )
router.post('/upload', upload.single('image'), uploadProfileImage )

router.post('/onboarding', createOnboardingData);

module.exports = router;