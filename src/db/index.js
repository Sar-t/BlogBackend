import mongoose from "mongoose"
import { db_name } from "../constants.js"

const connectToDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODBURI}/${db_name}`)
        console.log(`Connected to mongodb db_host: ${connectionInstance}`)
    } catch (error) {
        console.log("error:",error)
        throw error
    }
}
export default connectToDB
