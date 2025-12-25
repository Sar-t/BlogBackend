import mongoose, {Schema} from "mongoose"

const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    content:{
        type: String,
        required: true,
    },
    status:{
        type: String,
        enum: ["private","public"],
        default: "public",
    },
    images:[{
        url:{
            type: String,
            required: true,
        },
        imageId:{
            type:String,
            required:true
        }
    }],
    author_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{
    timestamps: true
})

export const Blog = mongoose.model("Blog",blogSchema)