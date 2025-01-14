const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, forgetPassword, resetPassword, changePassword } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forget-password', forgetPassword)
router.post('/reset-password', resetPassword)
router.post('/changePassword', authMiddleware, changePassword)

module.exports = router;