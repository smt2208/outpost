import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/project-member.models.js";
import { ProjectNote } from "../models/note.models.js";
import { Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import mongoose from "mongoose";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";


//See the PRD we are definining the functionality




//creating a new project controller
const createProject = asyncHandler(async(req,res)=>{
  const{name, description}=req.body;

  const project=await Project.create({
    name,
    description,
    createdBy:new mongoose.Types.ObjectId(req.user._id)
  });
  const memberRelation = await ProjectMember.create(
    {
      user:new mongoose.Types.ObjectId(req.user._id),
      project: new mongoose.Types.ObjectId(project._id),
      role: UserRolesEnum.ADMIN,
    }
  );

  const responseData = {
    project: {
      _id: project._id,
      name: project.name,
      description: project.description,
      members: 1,
      createdAt: project.createdAt,
      createdBy: project.createdBy
    },
    role: memberRelation.role,
    assignedAt: memberRelation.createdAt
  };

  return res.status(201)
  .json(
    new ApiResponse(201, "Project created successfully", responseData)
  )
})


const updateProject = asyncHandler(async(req,res)=>{
  const {name,description}=req.body;
  const projectId = req.project._id;

  const project=await Project.findByIdAndUpdate(
    projectId,
    {
      $set:{
        name,
        description
      }
    },
    {new:true,runValidators:true}
  )

  // Count current project members for consistent response format
  const memberCount = await ProjectMember.countDocuments({
    project: projectId
  });

  const responseData = {
    project: {
      _id: project._id,
      name: project.name,
      description: project.description,
      members: memberCount,
      createdAt: project.createdAt,
      createdBy: project.createdBy
    },
    role: req.projectMember.role,
    assignedAt: req.projectMember.createdAt
  };

  return res.status(200).json(new ApiResponse(200,"Project updated successfully", responseData));
})


//delete project
const deleteProject = asyncHandler(async(req,res)=>{
  const projectId = req.project._id;

  await Project.findByIdAndDelete(projectId);

  // Cascade delete all related data when a project is deleted
  await ProjectMember.deleteMany({ project: projectId });
  await Task.deleteMany({ project: projectId });

  return res.status(200).json(new ApiResponse(200,"Project deleted successfully",{ _id: projectId }));
})



//get project controller
const getProjects = asyncHandler(async(req,res)=>{
  const projects = await ProjectMember.aggregate([
    // Stage 1: Match only the membership records belonging to the logged-in user
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    // Stage 2: Join the projects collection to get full project details
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
        // Stage 2a: (nested pipeline) For each project, also look up its members
        pipeline: [
          {
            $lookup: {
              from: "projectmembers",
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },
        ],
      },
    },
    // Stage 3: Flatten the project array
    {
      $unwind: "$project",
    },
    // Stage 4: Compute the total members count and reshape the output
    {
      $addFields: {
        "project.members": {
          $size: "$project.projectmembers",
        },
      },
    },
    // Stage 5: Project the fields to match the exact schema and structure
    {
      $project: {
        project: {
          _id: 1,
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1
        },
        role: 1,
        assignedAt: "$createdAt",
        _id: 0
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Projects fetched successfully", projects)
  );
})




const getProjectById = asyncHandler(async(req,res)=>{
  const projectId = req.project._id;

  // Count current project members
  const memberCount = await ProjectMember.countDocuments({
    project: projectId
  });

  const responseData = {
    project: {
      _id: req.project._id,
      name: req.project.name,
      description: req.project.description,
      members: memberCount,
      createdAt: req.project.createdAt,
      createdBy: req.project.createdBy
    },
    role: req.projectMember.role,
    assignedAt: req.projectMember.createdAt
  };

  return res.status(200).json(
    new ApiResponse(200, "Project fetched successfully", responseData)
  );
})




const assignMemberToProject = asyncHandler(async(req,res)=>{
  const projectId = req.project._id;
  const { email, role = UserRolesEnum.MEMBER } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find the user to assign
  const userToAssign = await User.findOne({ email });
  if (!userToAssign) {
    throw new ApiError(404, "User not found with this email");
  }

  // Check if user is already a member
  const existingMember = await ProjectMember.findOne({
    project: projectId,
    user: userToAssign._id
  });

  if (existingMember) {
    throw new ApiError(400, "User is already a member of this project");
  }

  if (!AvailableUserRole.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  // Assign member
  const newMember = await ProjectMember.create({
    project: projectId,
    user: userToAssign._id,
    role
  });

  return res.status(201).json(
    new ApiResponse(201, "Member assigned successfully", newMember)
  );
})



//remove memeber from the project
const removeMemberFromProject = asyncHandler(async(req,res)=>{
  const { userId } = req.params;
  const projectId = req.project._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Check if member to remove exists in the project
  const memberToRemove = await ProjectMember.findOne({
    project: projectId,
    user: userId
  });

  if (!memberToRemove) {
    throw new ApiError(404, "Member not found in this project");
  }

  // Check if trying to remove the only admin (can't leave project admin-less)
  if (memberToRemove.role === UserRolesEnum.ADMIN) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: UserRolesEnum.ADMIN
    });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot remove the only administrator of the project");
    }
  }

  await ProjectMember.findByIdAndDelete(memberToRemove._id);

  return res.status(200).json(
    new ApiResponse(200, "Member removed successfully", memberToRemove)
  );
})






const updateMemberRole = asyncHandler(async(req,res)=>{
  const { userId } = req.params;
  const { role } = req.body;
  const projectId = req.project._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (!role || !AvailableUserRole.includes(role)) {
    throw new ApiError(400, "Valid role is required");
  }

  // Check if member to update exists in the project
  const memberToUpdate = await ProjectMember.findOne({
    project: projectId,
    user: userId
  });

  if (!memberToUpdate) {
    throw new ApiError(404, "Member not found in this project");
  }

  // Check if changing the role of the only admin (can't leave project admin-less)
  if (memberToUpdate.role === UserRolesEnum.ADMIN && role !== UserRolesEnum.ADMIN) {
    const adminCount = await ProjectMember.countDocuments({
      project: projectId,
      role: UserRolesEnum.ADMIN
    });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot demote the only administrator of the project");
    }
  }

  memberToUpdate.role = role;
  await memberToUpdate.save();

  return res.status(200).json(
    new ApiResponse(200, "Member role updated successfully", memberToUpdate)
  );
})







const getProjectMembers = asyncHandler(async(req,res)=>{
  const projectId = req.project._id;

  // Fetch all members of this project and populate their user details
  const members = await ProjectMember.find({
    project: projectId
  }).populate("user", "username email fullName role isEmailVerified");

  return res.status(200).json(
    new ApiResponse(200, "Project members fetched successfully", members)
  );
})


export{
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignMemberToProject,
  removeMemberFromProject,
  updateMemberRole,
  getProjectMembers
} 