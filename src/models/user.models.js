import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
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
    profilePicture: {
        url:{
            type: String,
            default: "",
        },
        imageId:{
            type: String,
            default: ""
        }
    },
},
{
    timestamps: true
})
//pre() is a hook in mongoose
userSchema.pre("save", async function () {
    if (!this.password || !this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}



export const User = mongoose.model("User",userSchema)