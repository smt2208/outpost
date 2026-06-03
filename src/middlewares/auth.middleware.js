import { User } from "../models/user.models.js";
import asyncHandler from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";



export const verifyJWT=asyncHandler(async(req, res, next)=>{
  try {
    const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")||req.header("authorization")?.replace("Bearer ","");
    
    if(!token){
      throw new ApiError(401,"Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailverificationToken -emailverificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
    );
    if(!user){
      throw new ApiError(401,"Unauthorized request");
    }
    req.user=user;
    next();
  } catch (error) {
    if(error.name === "TokenExpiredError"){
      throw new ApiError(401,"Token Expired");
    }
    throw new ApiError(401,"Invalid access token");
  }
})