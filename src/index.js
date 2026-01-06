import mongoose from "mongoose"
import { db_name } from "./constants.js";
import express from "express"
import connectToDB from "./db/index.js";
import dotenv from "dotenv"
import app from "./app.js";
dotenv.config({
    path: './env'
})

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
