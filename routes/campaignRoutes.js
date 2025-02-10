const express = require('express');
const router = express.Router();
const { createCampaign, getCampaignsByBusinessId, updateCampaignActiveStatus, uploadCampaignImage, updateCampaignState, getCampaignState, getCampaignById } = require('../controllers/campaignController')
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multerMiddleware');

router.post('/createCampaign', authMiddleware, createCampaign);
router.post('/getCampaignsByBusinessId', authMiddleware, getCampaignsByBusinessId);
router.post('/updateCampaignActiveStatus', authMiddleware, updateCampaignActiveStatus);
router.post('/upload', upload.single('image'), uploadCampaignImage)
router.post('/updateCampaignState', authMiddleware, updateCampaignState )
router.post('/getCampaignState', authMiddleware, getCampaignState )
router.post('/getCampaignById', authMiddleware, getCampaignById)


module.exports = router;