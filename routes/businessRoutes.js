const express = require('express');
const router = express.Router();
const { createBusiness , getAllBusiness} = require('../controllers/businessController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createBusiness', createBusiness);
router.get('/getAllBusiness', authMiddleware, getAllBusiness);

module.exports = router;