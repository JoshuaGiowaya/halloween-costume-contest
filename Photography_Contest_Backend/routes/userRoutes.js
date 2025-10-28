const express = require('express');
const {
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  validateToken,
  getRegistrationMode,
  getUsernameOnlyMode
} = require('../apis/userApi');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateUpdateProfile } = require('../middleware/validators');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');

const router = express.Router();

router.use(apiKeyMiddleware); 

router.get('/registration-mode', getRegistrationMode);
router.get('/username-only-mode', getUsernameOnlyMode);
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, authUser);
router.post('/logout', protect, logoutUser);
router.get('/validateToken', validateToken); 
router.route('/profile').get(protect, getUserProfile).put(protect, validateUpdateProfile, updateUserProfile);
router.post('/forgotpassword', validateForgotPassword, forgotPassword);
router.put('/resetpassword', validateResetPassword, resetPassword);

module.exports = router;
