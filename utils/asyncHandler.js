const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((error) => next(error)) // error is passed to next middleware
    }
}
export {asyncHandler}
























// const asyncHandler = (fn) => async (req,res,next) => { 
//     try {
//         await fn(req,res,next) 
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message,
//         })
//     }
// }
 
//asyncHandler is a higher-order function 
//it takes function as parameter and returns a function

