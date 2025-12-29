class ApiError extends Error {
    constructor(
        statusCode, 
        message = "Something went wrong!!",
        errors = [],
        stack = "" //property is a string describing the point in the code at which the Error was instantiated.
    ){
        super(message) //message property of Error class
        this.statusCode = statusCode
        this.data = null; //this property is used to add some custom error message
        this.message = message;
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack = stack;
            Error.captureStackTrace(this, this.constructor)
        }
    
    }
}

export {ApiError}