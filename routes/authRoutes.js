const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, forgetPassword, resetPassword, changePassword, uploadProfileImage, referrerSetupPass } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const {upload} = require('../middlewares/multerMiddleware')

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forget-password', forgetPassword)
router.post('/reset-password', resetPassword)
router.post('/changePassword', authMiddleware, changePassword)
router.post('/upload', upload.single('image'), uploadProfileImage )
router.post('/referrer-setup-pass', referrerSetupPass)


module.exports = router;