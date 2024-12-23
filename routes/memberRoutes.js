const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getMembersByBusinessId } = require('../controllers/memberController');

router.post('/getMembersByBusinessId', authMiddleware, getMembersByBusinessId)

module.exports = router;