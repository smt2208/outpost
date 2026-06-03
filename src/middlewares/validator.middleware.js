// Designing the middleware to validate the data coming from the client
import { validationResult } from "express-validator";
import {ApiError} from "../utils/api-error.js";

//this is the middleware that will be used to validate the data coming from the client
export const validate=(req,res,next)=>{
  const errors = validationResult(req);//this will give the errors coming from the client
  if(errors.isEmpty()){
    return next();
  }
  const extractedErrors=[];
  errors.array().forEach((error)=>extractedErrors.push(
    {
      [error.path]:error.msg
    }));
  throw new ApiError(400,"Received data is not valid",extractedErrors);
};