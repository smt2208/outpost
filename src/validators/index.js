import {body} from "express-validator";



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


export {
  UserRegisterValidator,
  UserLoginValidator,
  UserChangePasswordValidator,
  UserForgotPasswordValidator
}  