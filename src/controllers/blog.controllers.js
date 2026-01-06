import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { Blog } from "../models/blog.models.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.js";

const createPost = asyncHandler(async (req, res) => {
    const { title, content, status } = req.body;
    const userId = req.user._id; // Assuming user ID is set in req.user by verifyJWT middleware
    console.log('reached');
    console.log(req.body)
    console.log(userId)
    // Handle image upload
    let imageLocalPath = "";
    if (req.files && Array.isArray(req.files["images"]) && req.files["images"].length > 0) {
        imageLocalPath = req.files["images"][0].path;
    }
    console.log(imageLocalPath);
    if(imageLocalPath === ""){
        throw new ApiError(400,"At least one image is required");
    }
    //save file on cloudinary
    const uploadedImage = await uploadOnCloudinary(imageLocalPath);
    console.log(uploadedImage);
    // Create new blog post
    const newPost = await Blog.create({
        title,
        content,
        status,
        images: [{
            url: uploadedImage.url,
            imageId: uploadedImage.public_id
        }],
        author_id: userId
    });
    console.log(newPost);
    if(!newPost){
        throw new ApiError(500,"Failed to create blog post");
    }
    console.log('reached');
    return res.status(201).json(
        new ApiResponse(201,newPost, "Blog post created successfully")
    );
});

const editPost = asyncHandler(async (req,res)=>{
    const {id} = req.params;
    const {title,content,status} = req.body;

    // Handle image upload
    let imageLocalPath = "";
    if(req.files && Array.isArray(req.files["images"]) && req.files["images"].length > 0){
        imageLocalPath = req.files["images"][0].path;
    }
    const blog = await Blog.findById(id)

    if(!blog){
        throw new ApiError(404,"Blog not found");
    }

    if(blog.author_id.toString() !== req.user.id){
        throw new ApiError(403,"You are not authorized to edit this blog");
    }
    if(imageLocalPath !== ""){
        //delete old image from cloudinary
        await deleteFromCloudinary(blog.images[0].imageId);
        //upload new image to cloudinary
        const uploadedImage = await uploadOnCloudinary(imageLocalPath);
        blog.images = [{
            url: uploadedImage.url,
            imageId: uploadedImage.public_id
        }]
    }

    if(title) blog.title = title;
    if(content) blog.content = content;
    if(status) blog.status = status;
    await blog.save();

    return res.status(200).json(
        new ApiResponse(200,blog,"Blog post updated successfully")
    );
});

const getPostById = asyncHandler(async (req,res)=>{
    const {id} = req.params; 

    const blog = await Blog.findById(id).populate('author_id', 'fullname email username');

    if(!blog){
        throw new ApiError(404,"Blog not found");
    }
    return res.status(200).json(
        new ApiResponse(200,blog,"Blog post fetched successfully")
    );
});

const getMyPosts = asyncHandler(async (req,res)=>{
    const userId = req.user.id;
    const blogs = await Blog.find({author_id: userId}).populate('author_id', 'fullname email username');;
    const formattedBlogs = blogs.map((blog) => ({
        _id: blog._id,
        title: blog.title,
        content: blog.content,
        images: blog.images,
        status: blog.status,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        author: {
            id: blog.author_id?._id,
            fullname: blog.author_id?.fullname,
            username: blog.author_id?.username
        }
    }));
    return res.status(200).json(
        new ApiResponse(200,formattedBlogs,"User's blog posts fetched successfully")
    );
});

const getAllPosts = asyncHandler(async (req,res)=>{
    const blogs = await Blog.find({status: "public"}).populate('author_id', 'fullname email username');
    const formattedBlogs = blogs.map((blog) => ({
        _id: blog._id,
        title: blog.title,
        content: blog.content,
        images: blog.images,
        status: blog.status,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        author: {
            id: blog.author_id?._id,
            fullname: blog.author_id?.fullname,
            username: blog.author_id?.username
        }
    }));
    return res.status(200).json(
        new ApiResponse(200,formattedBlogs,"All public blog posts fetched successfully")
    );
});

const deletePost = asyncHandler(async (req,res)=>{
    const blogId = req.params.id; 
    const blog = await Blog.findById(blogId);

    if(!blog){
        throw new ApiError(404,"Blog not found");
    }
    if(blog.author_id.toString() !== req.user.id){
        throw new ApiError(403,"You are not authorized to delete this blog");
    }
    await deleteFromCloudinary(blog.images[0].imageId);
    await blog.deleteOne();

    return res.status(200).json(
        new ApiResponse(200,null,"Blog post deleted successfully")
    );
});

export { createPost, editPost, getPostById, getMyPosts, getAllPosts, deletePost };




