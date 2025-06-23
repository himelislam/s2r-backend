const express = require('express');
const { initializePlans } = require('../controllers/initializePlanController');
const router = express.Router();

router.get('/plans', initializePlans)

module.exports = router;