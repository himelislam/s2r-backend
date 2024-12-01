const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, forgetPassword, resetPassword } = require('../controllers/authController')

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forget-password', forgetPassword)
router.post('/reset-password/:token', resetPassword)

module.exports = router;