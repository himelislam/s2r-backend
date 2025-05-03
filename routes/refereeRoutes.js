const express = require('express');
const router = express.Router();
const { createReferee, getRefereeByBusinessId, getRefereeByReferrerId, getRefereeList, updateRefereeStatus, getRefereeWithCampaignDetails, sendRewardEmailToRefereer } = require('../controllers/refereeController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferee', createReferee)
router.post('/getRefereeList', getRefereeList )
router.post('/getRefereeByReferrerId', authMiddleware, getRefereeByReferrerId)
router.post('/getRefereeByBusinessId', authMiddleware, getRefereeByBusinessId);
router.post('/updateRefereeStatus', authMiddleware, updateRefereeStatus);
router.post('/getRefereeWithCampaignDetails', authMiddleware, getRefereeWithCampaignDetails);
router.post('/sendRewardEmailToRefereer', sendRewardEmailToRefereer)

module.exports = router;