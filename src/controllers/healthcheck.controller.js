//Logic comeds here

import { ApiResponse } from "../utils/api-response.js";
import asyncHandler from "../utils/async-handler.js";

// const healthCheck=(req,res)=>{
//   try {
//     res.status(200).json(new ApiResponse(200, "Health check successful", {status: "ok"}));
//   } catch (error) {
//     res.status(500).json(new ApiResponse(500, "Health check failed", {error: error.message}));
//   }
// }

// const healthCheck=(req,res,next)=>{
  
//   try {
//     const user=await getUserFromDB();
//     res.status(200).json(new ApiResponse(200, "Health check successful", {status: "ok"}));
//   } catch (error) {
//     next(error); // express built in error handling middleware will handle the error and send the response to the client
//   }
// }

const healthCheck=asyncHandler(async (req,res)=>{
    res.status(200).json(new ApiResponse(200, "Health check successful", {status: "ok"}));
  }
)

export {healthCheck};