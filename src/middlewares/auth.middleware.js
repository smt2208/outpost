import { User } from "../models/user.models.js";
import asyncHandler from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



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


export const verifyProjectRole = (allowedRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid project ID");
    }

    // Dynamically import models to avoid circular dependencies if any
    const { Project } = await import("../models/project.models.js");
    const { ProjectMember } = await import("../models/project-member.models.js");

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const projectMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id)
    });

    if (!projectMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // If allowedRoles array is provided, check if member's role is included
    if (allowedRoles.length > 0 && !allowedRoles.includes(projectMember.role)) {
      throw new ApiError(403, "You do not have the required permissions for this action");
    }

    // Attach to request object so controllers don't have to fetch again
    req.project = project;
    req.projectMember = projectMember;

    next();
  });
};