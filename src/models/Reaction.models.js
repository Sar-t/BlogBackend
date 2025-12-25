import mongoose, { Schema } from 'mongoose';

const reactionSchema = new Schema({
    blogId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
    },
    reactedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    ReactionType:{
        type: String,
        required: true,
        enum: ["like","dislike"]
    }
},{
    timestamps: true
})
reactionSchema.index({ blogId: 1, userId: 1 }, { unique: true });

export const Reaction = mongoose.model("Reaction", reactionSchema);