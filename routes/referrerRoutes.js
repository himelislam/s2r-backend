const express = require('express');
const router = express.Router();
const { createReferrer, getReferrersByBusinessId, getReferrerById, getQrCodeByReferrerId, updateReferrerProfile, addReferrer } = require('../controllers/referrerController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferrer', createReferrer)
router.post('/getReferrersByBusinessId', authMiddleware, getReferrersByBusinessId)
router.post('/getReferrerById', getReferrerById)
router.post('/getQrCodeByReferrerId', getQrCodeByReferrerId)
router.post('/updateReferrerProfile', authMiddleware ,updateReferrerProfile)

module.exports = router;