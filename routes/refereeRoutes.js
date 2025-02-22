const express = require('express');
const router = express.Router();
const { createReferee, getRefereeByBusinessId, getRefereeByReferrerId, getRefereeList } = require('../controllers/refereeController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferee', createReferee)
router.post('/getRefereeList', getRefereeList )
router.post('/getRefereeByReferrerId', authMiddleware, getRefereeByReferrerId)
router.post('/getRefereeByBusinessId', authMiddleware, getRefereeByBusinessId);

module.exports = router;