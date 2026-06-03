const asyncHandler=(requesthandler)=>{
    return async (req,res,next)=>{
      Promise.resolve(requesthandler(req,res,next)).catch((error)=>next(error));
    }   
}

export default asyncHandler;