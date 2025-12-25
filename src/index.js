import mongoose from "mongoose"
import { db_name } from "./constants.js";
import express from "express"
import connectToDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path: './env'
})
const app = express()

// ;(async () =>{
//     try {
//         await mongoose.connect(`${process.env.MONGODBURI}/${db_name}`)
//         app.on("errror",(error)=>{
//             console.log("error",error)
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log("App is listening on port ",process.env.PORT)
//         })
//     } catch (error) {
//         console.log("Error",error)
//         throw error
//     }
// })()

connectToDB()


app.listen(process.env.PORT,()=>{
    console.log("App is listening on port ",process.env.PORT)
})
