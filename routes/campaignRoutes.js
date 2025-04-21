const express = require('express');
const router = express.Router();
const { createCampaign,
    getCampaignsByBusinessId,
    updateCampaignActiveStatus,
    uploadCampaignImage,
    updateCampaignState,
    getCampaignState,
    getCampaignById,
    updateCampaignReward,
    updateCampaignSettings,
    updateCampaignEmailState,
    deleteCampaignById
} = require('../controllers/campaignController')
const { authMiddleware } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multerMiddleware');

router.post('/createCampaign', authMiddleware, createCampaign);
router.post('/getCampaignsByBusinessId', authMiddleware, getCampaignsByBusinessId);
router.post('/updateCampaignActiveStatus', authMiddleware, updateCampaignActiveStatus);
router.post('/upload', upload.single('image'), uploadCampaignImage)
router.post('/updateCampaignState', authMiddleware, updateCampaignState)
router.post('/updateCampaignEmailState', authMiddleware, updateCampaignEmailState)
router.post('/getCampaignState', authMiddleware, getCampaignState)
router.post('/getCampaignById', getCampaignById)
router.post('/updateCampaignReward', authMiddleware, updateCampaignReward)
router.post('/updateCampaignSettings', authMiddleware, updateCampaignSettings)
router.post('/deleteCampaignById', authMiddleware, deleteCampaignById)


module.exports = router;