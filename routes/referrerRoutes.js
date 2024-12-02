const express = require('express');
const router = express.Router();
const { createReferrer, getReferrersByBusinessId } = require('../controllers/referrerController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferrer', createReferrer )
router.post('/getReferrersByBusinessId', authMiddleware, getReferrersByBusinessId )

module.exports = router;