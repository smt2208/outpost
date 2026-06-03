class ApiError extends Error{
  constructor(statusCode, message="Something went wrong",errors=[],stack=""){
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.stack = stack;
    this.data=null;
    this.message = message;

    if(stack){
      this.stack = stack;
    }
    else{
      Error.captureStackTrace(this, this.constructor); // generate the stack trace for the error automatically if we dot have the stack trace
    }
  }
}

export {ApiError};