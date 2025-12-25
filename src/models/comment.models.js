import mongoose, {Schema} from "mongoose";

const commentSchema = new Schema({
    blogId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
    },
    content:{
        type: String,
        required: true,
    },
    commentedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
},{
    timestamps: true
})

export const Comment = mongoose.model("Comment",commentSchema);