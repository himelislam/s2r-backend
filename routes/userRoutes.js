const express = require('express');
const router = express.Router();
const { createBusiness } = require('../controllers/businessController')
const { createReferrer } = require('../controllers/referrerController')

router.post('/createBusiness', createBusiness);
router.post('/createReferrer', createReferrer )

module.exports = router;