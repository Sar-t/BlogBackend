import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //to enable searching on username
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        trim: true, //can be null in case of login via google
    },
    auth_provider:{
        type: String,
        enum: ["local","google","both"],
        default: "local",
    },
    google_id:{
        type: String,
        unique: true,
        trim: true,
        sparse: true //because not all users will have google_id and all will have null value else
    },
    fullname: {
        type: String,
        trim: true,
    },
    DP: {
        type: String
    },
},{
    timestamps: true
})
//pre() is a hook in mongoose
userSchema.pre("save", async function(next){  //arrow function does not have its this pointer
    if(!this.password || !this.isModified("password"))return next()
    this.password = await bcrypt.hash(this.password, 10) //(password, hashround)
    next()
})





export const User = mongoose.model("User",userSchema)