import {body} from "express-validator";
import { AvailableUserRole, AvailableTaskStatus } from "../utils/constants.js";




const UserRegisterValidator=()=>{
  return [
    body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
    body("username").trim().notEmpty().withMessage("Username is required").isLowercase().withMessage("Username must be lowercase").isLength({min:3,max:30}).withMessage("Username must be between 3 and 30 characters long"),
    body("fullName").optional().trim().isLength({min:3,max:30}).withMessage("Full Name must be between 3 and 30 characters long"),
    
  ]
}


const UserLoginValidator=()=>{
  return [
    body("password").notEmpty().withMessage("Password is required"),
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("username").optional().trim()
  ]
}


const UserChangePasswordValidator = () => {
  return [
    body("oldPassword").trim().notEmpty().withMessage("Old password is required"),
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("New password is required")
      .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
          throw new Error("New password cannot be the same as the old password");
        }
        return true;
      })
  ]
}


const UserForgotPasswordValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
  ]
}


const ProjectCreateValidator = () => {
  return [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").trim().notEmpty().withMessage("Project description is required")
  ]
}

const ProjectUpdateValidator = () => {
  return [
    body("name").optional().trim().notEmpty().withMessage("Project name cannot be empty"),
    body("description").optional().trim().notEmpty().withMessage("Project description cannot be empty")
  ]
}

const AssignMemberValidator = () => {
  return [
    body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
    body("role").optional().trim().isIn(AvailableUserRole).withMessage("Invalid member role")
  ]
}

const UpdateMemberRoleValidator = () => {
  return [
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableUserRole)
      .withMessage("Invalid member role")
  ]
}

const TaskCreateValidator = () => {
  return [
    body("title").trim().notEmpty().withMessage("Task title is required"),
    body("description").optional().trim(),
    body("status").optional().trim().isIn(AvailableTaskStatus).withMessage("Invalid task status")
  ]
}

const TaskUpdateValidator = () => {
  return [
    body("title").optional().trim().notEmpty().withMessage("Task title cannot be empty"),
    body("description").optional().trim(),
    body("status").optional().trim().isIn(AvailableTaskStatus).withMessage("Invalid task status")
  ]
}

const SubtaskCreateValidator = () => {
  return [
    body("title").trim().notEmpty().withMessage("Subtask title is required")
  ]
}

const SubtaskUpdateValidator = () => {
  return [
    body("title").optional().trim().notEmpty().withMessage("Subtask title cannot be empty"),
    body("isCompleted").optional().isBoolean().withMessage("isCompleted must be a boolean")
  ]
}

export {
  UserRegisterValidator,
  UserLoginValidator,
  UserChangePasswordValidator,
  UserForgotPasswordValidator,
  ProjectCreateValidator,
  ProjectUpdateValidator,
  AssignMemberValidator,
  UpdateMemberRoleValidator,
  TaskCreateValidator,
  TaskUpdateValidator,
  SubtaskCreateValidator,
  SubtaskUpdateValidator
}  