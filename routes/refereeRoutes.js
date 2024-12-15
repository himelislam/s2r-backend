const express = require('express');
const router = express.Router();
const { createReferee, getRefereeByBusinessId, getRefereeByReferrerId } = require('../controllers/refereeController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferee', createReferee)
router.post('/getRefereeByReferrerId', authMiddleware, getRefereeByReferrerId)
router.post('/getRefereeByBusinessId', authMiddleware, getRefereeByBusinessId);

module.exports = router;