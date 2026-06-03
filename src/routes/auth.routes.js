import {Router} from 'express';
import {
  registerUser,
  login,
  verifyEmail,
  logout,
  getCurrentUser,
  changeCurrentPassword,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  resendEmailVerification
} from '../controllers/auth.controller.js';
import {validate} from '../middlewares/validator.middleware.js';
import {UserRegisterValidator, UserLoginValidator, UserChangePasswordValidator, UserForgotPasswordValidator} from '../validators/index.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Routes
router.route('/register').post(UserRegisterValidator(),validate,registerUser);
router.route("/login").post(UserLoginValidator(),validate,login);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(UserForgotPasswordValidator(), validate, forgotPassword);
router.route("/reset-password/:resetToken").post(resetPassword);

// Secured Routes
router.route("/logout").post(verifyJWT,logout);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, UserChangePasswordValidator(), validate, changeCurrentPassword);
router.route("/resend-email-verification").post(verifyJWT, resendEmailVerification);


export default router;