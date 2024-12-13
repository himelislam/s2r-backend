const express = require('express');
const router = express.Router();
const { createReferee } = require('../controllers/refereeController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/createReferee', createReferee )

module.exports = router;