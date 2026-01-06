import mongoose from "mongoose";
import { Reaction } from "../models/reaction.models.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addOrUpdateReaction = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError("Invalid post id", 400);
    }

    if (!["like", "dislike"].includes(type)) {
        throw new ApiError("Invalid reaction type", 400);
    }

    const existingReaction = await Reaction.findOne({
        blogId: postId,
        reactedBy: userId
    });

    if (existingReaction && existingReaction.ReactionType === type) {
        await Reaction.deleteOne({ _id: existingReaction._id });

        return res.status(200).json(
            new ApiResponse(200, null, "Reaction removed")
        );
    }

    if (existingReaction) {
        existingReaction.ReactionType = type;
        await existingReaction.save();

        return res.status(200).json(
            new ApiResponse(200, type, "Reaction updated")
        );
    }

    const reaction = await Reaction.create({
        blogId: postId,
        reactedBy: userId,
        ReactionType: type
    });

    if (!reaction) {
        throw new ApiError("Failed to add reaction", 500);
    }

    return res.status(201).json(
        new ApiResponse(201, type, "Reaction added")
    );
});

export const getReactionsForPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user?._id || null;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError("Invalid post id", 400);
    }

    const reactions = await Reaction.find({ blogId: postId });

    let likes = 0;
    let dislikes = 0;
    let myReaction = null;

    for (const reaction of reactions) {
        if (reaction.ReactionType === "like") likes++;
        if (reaction.ReactionType === "dislike") dislikes++;

        if (
            userId &&
            reaction.reactedBy.toString() === userId.toString()
        ) {
            myReaction = reaction.ReactionType;
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { likes, dislikes, myReaction }, "Reactions fetched successfully")
    );
});
