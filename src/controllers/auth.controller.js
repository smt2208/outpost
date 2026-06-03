import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import {ApiResponse} from "../utils/api-response.js";
import {ApiError} from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import { senderEmail as sendEmail, EmailVerificationMailGenerator, forgotPasswordEmail } from "../utils/mail.js";


const generateAccessAndRefreshTokens=async(userID)=>{
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});
    return {accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
  }
}


//expecting data to come from the body of the request
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, role } = req.body;
  //check if the user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });//either usrname or email should be unique
  if (existingUser) {
    throw new ApiError(400, "User with this email or username already exists");
  } 
  const user = await User.create({ username, email, password , isEmailVerified: false});
  const {unHashedToken, hashedToken, tokenExpiry} = user.generatetemporaryToken();
  user.emailverificationToken=hashedToken;
  user.emailverificationExpiry=tokenExpiry;
  await user.save({validateBeforeSave:false});
  await sendEmail(
    {
      email:user.email,
      subject:"Email Verification",
      mailgenContent:EmailVerificationMailGenerator(user.username,`${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`),  
    }
  );
  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken -emailverificationToken -emailverificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );
  if(!createdUser){
    throw new ApiError(500, "Something went wrong while creating user");
  }
  return res.status(201).json(
    new ApiResponse(200,"User created successfully",createdUser)
  );
});


const login=asyncHandler(async(req,res)=>{
  const {email,password,username}=req.body;

  if(!username || !email){
    throw new ApiError(400,"Please provide username or email");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordMatch(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  // if(!user.isEmailVerified){
  //   throw new ApiError(400,"Please verify your email before logging in");
  // }
  const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);

  const loggedInUser=await User.findById(user._id).select(
    "-password -refreshToken -emailverificationToken -emailverificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );
  if(!loggedInUser){
    throw new ApiError(500, "Something went wrong while creating user");
  }

  const options={
    httpOnly:true,
    secure:true,
  }


  return res.status(201)
          .cookie("accessToken",accessToken,options)
          .cookie("refreshToken",refreshToken,options)
          .json(
            new ApiResponse(200,"User logged in successfully",{loggedInUser})
          );
});


const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is missing");
  }

  // Hash the incoming unhashed token to compare with the one in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with the matching hashed token and make sure it has not expired
  const user = await User.findOne({
    emailverificationToken: hashedToken,
    emailverificationExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  // Update user verification status
  user.isEmailVerified = true;
  user.emailverificationToken = undefined;
  user.emailverificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, "Email verified successfully", {})
  );
});


const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: ""
      }
    },
    { validateBeforeSave: false, new: true }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Current user fetched successfully", req.user)
  );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordMatch(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(
    new ApiResponse(200, "Password changed successfully", {})
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true
    };

    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, "Access token refreshed successfully", {
          accessToken,
          refreshToken: newRefreshToken
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body; //equivalent to const email = req.body.email;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = user.generatetemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`;

  await sendEmail({
    email: user.email,
    subject: "Password Reset Request",
    mailgenContent: forgotPasswordEmail(user.username, resetUrl)
  });

  return res.status(200).json(
    new ApiResponse(200, "Password reset email sent successfully", {})
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const isSamePassword = await user.isPasswordMatch(newPassword);
  if (isSamePassword) {
    throw new ApiError(400, "New password cannot be the same as your old password");
  }

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(
    new ApiResponse(200, "Password reset successfully", {})
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(400,"User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = user.generatetemporaryToken();

  user.emailverificationToken = hashedToken;
  user.emailverificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject: "Email Verification Request",
    mailgenContent: EmailVerificationMailGenerator(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`
    )
  });

  return res.status(200).json(
    new ApiResponse(200, "Verification email resent successfully", {})
  );
});

export {
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
};