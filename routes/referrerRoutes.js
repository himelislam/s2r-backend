const express = require('express');
const router = express.Router();
const { createReferrer, getReferrersByBusinessId } = require('../controllers/referrerController')

router.post('/createReferrer', createReferrer )
router.post('/getReferrersByBusinessId', getReferrersByBusinessId )

module.exports = router;