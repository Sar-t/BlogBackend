import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import crypto from "crypto";
import { RefreshToken } from "../models/refreshToken.models.js";
import { OAuth2Client } from "google-auth-library";
import { cookieOptions } from "../config/cookiesOptions.js";
import ms from "ms";
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(404, "User not found while generating access and refresh token");
        }
        console.log(user);  
        console.log('reached');
        const refreshToken = user.generateRefreshToken();
        console.log('reached');
        const accessToken = user.generateAccessToken();
        console.log('reached');
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const saveTokensInDB = async (userId, refreshToken, req) => {
    const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

    console.log('reached');
    const deviceInfo = {
        browser: req.useragent?.browser || "unknown",
        os: req.useragent?.os || "unknown",
        device: req.useragent?.isMobile ? "mobile" : "desktop"
    };
    const result = await RefreshToken.create({
        user_id: userId,
        hashed_token: hashedRefreshToken,
        device_info: deviceInfo,
        expiry_date: new Date(
            Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRY)
        )
    });
    if(!result){
        throw new ApiError(500, "Something went wrong while saving refresh token in db");
    }
    return result;
}
const registerUser = asyncHandler(async(req,res)=>{
    const {username,password,email,fullname} = req.body;

    if(
        [fullname, email, username, password].some((field) => field?.trim() == "")
    ){
        throw new ApiError(400, "All fields are required!");
    }
    const doesUserExist = await User.findOne({
        $or: [{ username },{ email }]
    })
    // console.log("does user exist",doesUserExist);
    if(doesUserExist){
        throw new ApiError(409, "Username or email already exists");
    }
    let profilePictureLocalPath = "";
    if(req.files && Array.isArray(req.files.profilePicture) && req.files.profilePicture.length > 0){
        profilePictureLocalPath = req.files.profilePicture[0].path;
    }
    
    // console.log("avatar checking path");
    
    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

    const user = await User.create({
        fullname,
        email,
        profilePicture: {
            url: profilePicture?.url || "",
            imageId: profilePicture?.public_id || ""
        },
        password,
        username: username,
    })

    const userCreated = await User.findById(user._id).select(
        "username email fullname"
    )

    if(!userCreated){
        throw new ApiError(400,"Something went wrong while registering the user!")
    }
    console.log("user created");
    return res.status(201).json(
        new ApiResponse(200, userCreated, "User registered successfully!")
    )
});

const loginUser = asyncHandler(async (req,res) => {
    //console.log(req.body);
    //req.body -> data
    const {username,password} = req.body;

    if(!username){
        throw new ApiError(400, "username is required!");
    }

    //check for exisisting user
    const existingUser = await User.findOne({
        username: username
    })
    //console.log(existingUser);
    if(!existingUser){
        throw new ApiError(401, "user doesn't exist!");
    }

    //validate password
    //the methods declared in user model can only be accessed by the user(object having all its details); User(model)
    const isPasswordValid = await existingUser.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(403,"username or password does not match!");
    }
    //generate refresh and access token and update them in database
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(existingUser._id);

    await saveTokensInDB(existingUser._id, refreshToken, req);
    
    console.log('tokens generated');
    //console.log(user);
    //send cookies
    const loggedInUser = await User.findById(existingUser._id).select("username email fullname profilePicture");
    console.log('User logged in');
    res
    .status(200)
    .cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
  })
    .cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY)
    })
    .json(
        new ApiResponse(
            200,
            {
                user: {loggedInUser, refreshToken,
                accessToken}
            },
            "logged in successfully!"
        )
    )
    
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "Google token is required");
    }

    //Verify Google token
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new ApiError(401, "Invalid Google token");
    }

    const {
        sub: googleId, //alias for sub
        email,
        name,
        picture
    } = payload;

    if (!email) {
        throw new ApiError(400, "Google account email not available");
    }

    //Find user by email
    let user = await User.findOne({ email });

    const username = await (async () => {
        const baseUsername = name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");

        let finalUsername;

        while (true) {
            finalUsername = `${baseUsername}_${Math.floor(Math.random() * 9000 + 1000)}`;
            const exists = await User.exists({ username: finalUsername });
            if (!exists) break;
        }

        return finalUsername;
    })();


    // 3️⃣ Create user if not exists
    if (!user) {
        user = await User.create({
        username,
        email,
        google_id: googleId,
        fullname: name || null,
        profilePicture: picture || null,
        auth_provider: "google"
        });
    }
    //Link Google account if user exists but not linked
    else if (!user.google_id) {
        user.google_id = googleId;
        user.auth_provider = "both";
        await user.save();
    }

    // Generate tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    //Store refresh token (new session)
    const result = await saveTokensInDB(user._id, refreshToken, req);
    if (!result) {
        throw new ApiError(500, "Failed to save refresh token");
    }
    //Send cookies
    res
    .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    })
    .cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
  })
    .status(200)
    .json(
    new ApiResponse(200, {
        user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname
        }
    }, "Google authentication successful")
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token missing");
    }

    //Verify JWT refresh token (signature + expiry)
    let payload;
    try {
        payload = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
        );
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
    console.log(payload);
    //Hash incoming refresh token
    const incomingHashedToken = crypto
    .createHash("sha256")
    .update(incomingRefreshToken)
    .digest("hex");

    //Find refresh token in DB
    const storedToken = await RefreshToken.findOne({
        user_id: payload._id,
        hashed_token: incomingHashedToken,
    });

    //Reuse detection
    if (!storedToken) {
        // Token reuse attempt → revoke all sessions
        await RefreshToken.deleteMany({ user_id: payload._id });
        throw new ApiError(401, "Refresh token reuse detected. Logged out.");
    }

    // 4️⃣ Fetch user
    const user = await User.findById(payload._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // 5️⃣ Generate new access token
    const newAccessToken = user.generateAccessToken();

    // 6️⃣ ROTATE refresh token
    const newRefreshToken = user.generateRefreshToken();

    const newHashedRefreshToken = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

    // 7️⃣ Replace old refresh token in DB
    storedToken.hashed_token = newHashedRefreshToken;
    await storedToken.save();

    // 8️⃣ Send cookies
    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {
    ...cookieOptions,
    maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
  })
        .cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
  })
        .json(
        new ApiResponse(200, null, "Access token refreshed successfully")
        );
});

const logoutUser = asyncHandler(async (req,res)=>{
    //receive refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;
    if(!refreshToken){
        return res.status(200).json(
            new ApiResponse(200, null, "Already logged out!")
        )
    }
    
    //hash the incoming refresh token
    const hashedToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

    //find the refreshToken in db and delete it
    await RefreshToken.findOneAndDelete({
        user_id: req.user._id,
        hashed_token: hashedToken
    });

    //clear cookies
    res
    .clearCookie("accessToken",cookieOptions)
    .clearCookie("refreshToken",cookieOptions)
    .json(
        new ApiResponse(204,"user logged out!")
    )
});

const userProfile = asyncHandler(async (req,res)=>{
    const {id} = req.user;
    const userEntry = await User.findOne({
        _id: id
    }).select("-password");
    if(!userEntry){
        throw new ApiError(404, "User not found");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, { user: userEntry }, "User profile fetched successfully")
    );
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required");
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(403, "Current password is incorrect");
    }
    user.password = newPassword;
    await user.save();
    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Password changed successfully")
    );
});

const logoutAllDevices = asyncHandler(async (req, res) => {
    await RefreshToken.deleteMany({ user_id: req.user._id });
    return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(200, null, "Logged out from all devices successfully")
    );
});

export {registerUser, loginUser, googleAuth, refreshAccessToken, logoutUser, userProfile, changePassword, logoutAllDevices};