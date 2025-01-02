const express = require('express');
const router = express.Router();
const { createCampaign, getCampaignsByBusinessId, updateCampaignActiveStatus } = require('../controllers/campaignController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createCampaign', authMiddleware, createCampaign);
router.post('/getCampaignsByBusinessId', authMiddleware, getCampaignsByBusinessId);
router.post('/updateCampaignActiveStatus', authMiddleware, updateCampaignActiveStatus);


module.exports = router;