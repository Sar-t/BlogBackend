import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Blog } from "../models/blog.models.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createComment = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError("Invalid post id", 400);
    }

    if (!content || content.trim() === "") {
        throw new ApiError("Comment content is required", 400);
    }

    const postExists = await Blog.findById(postId);
    if (!postExists) {
        throw new ApiError("Post not found", 404);
    }

    const comment = await Comment.create({
        blogId: postId,
        content,
        commentedBy: userId
    });

    if (!comment) {
        throw new ApiError("Failed to create comment", 500);
    }

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
});

export const getCommentsByPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
        throw new ApiError("Invalid post id", 400);
    }

    const comments = await Comment.find({ blogId: postId })
        .populate("commentedBy", "fullname profilePicture")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    );
});

export const editComment = asyncHandler(async (req, res) => {
    const id  = req.params.commentId;
    const { content } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError("Invalid comment id", 400);
    }

    if (!content || content.trim() === "") {
        throw new ApiError("Comment content is required", 400);
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        throw new ApiError("Comment not found", 404);
    }

    if (comment.commentedBy.toString() !== userId.toString()) {
        throw new ApiError("You are not authorized to edit this comment", 403);
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

export const deleteComment = asyncHandler(async (req, res) => {
    const  id  = req.params.commentId;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError("Invalid comment id", 400);
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        throw new ApiError("Comment not found", 404);
    }

    if (comment.commentedBy.toString() !== userId.toString()) {
        throw new ApiError("You are not authorized to delete this comment", 403);
    }

    await Comment.deleteOne({ _id: id });

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});
