const express = require('express');
const router = express.Router();
const { createReferrer } = require('../controllers/referrerController')

router.post('/createReferrer', createReferrer )

module.exports = router;