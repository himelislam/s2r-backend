const express = require('express');
const router = express.Router();
const { createCampaign, getCampaignsByBusinessId, updateCampaignActiveStatus, uploadCampaignImage } = require('../controllers/campaignController')
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multerMiddleware');

router.post('/createCampaign', authMiddleware, createCampaign);
router.post('/getCampaignsByBusinessId', authMiddleware, getCampaignsByBusinessId);
router.post('/updateCampaignActiveStatus', authMiddleware, updateCampaignActiveStatus);
router.post('/upload', upload.single('image'), uploadCampaignImage)


module.exports = router;