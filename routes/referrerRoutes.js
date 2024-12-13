const express = require('express');
const router = express.Router();
const { createReferrer, getReferrersByBusinessId, getReferrerById } = require('../controllers/referrerController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferrer', createReferrer )
router.post('/getReferrersByBusinessId', authMiddleware, getReferrersByBusinessId )
router.post('/getReferrerById', getReferrerById)

module.exports = router;