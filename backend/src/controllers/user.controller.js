import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    const { fullName, email, mobileNumber, aadharNumber, gender } = req.body;

    if (!fullName || !email || !mobileNumber || !aadharNumber || !gender) {
        throw new ApiError(400, "All fields are required");
    }

    let avatarUrl = "";
    if(req.file) {
        const uploadResponse = await uploadOnCloudinary(req.file.path);
        if(!uploadResponse) throw new ApiError(500,"Failed to upload avatar");
        avatarUrl = uploadResponse.secure_url;
    }
    const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber }, { aadharNumber }]});
    if(existingUser) throw new ApiError(409, "User already exists");

    const user = await User.create({
        fullName,
        email,
        mobileNumber,
        aadharNumber,
        gender,
        avatar: avatarUrl,
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.status(201).json(
        new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully")
    );
});

const checkRegisterUser = asyncHandler(async (req,res) => {
    const { mobileNumber, email, aadharNumber} = req.body;
    const existingUser = await User.findOne({
        $or: [{ mobileNumber}, { email }, { aadharNumber }]
    });
    if (existingUser) {
        throw new ApiError(409, "User already exists, please login");
    }
    return res.json(new ApiResponse(200,null,"You can proceed with registration"));
});

const checkLoginUser = asyncHandler(async (req,res) => {
    const { mobileNumber } = req.body;
    const user = await User.findOne({ mobileNumber });
    if (!user) throw new ApiError(404, "user not found, please register");
    return res.json(new ApiResponse(200,null,"User exists, proceed with login"));
});

const loginUser = asyncHandler(async (req,res) => {
    const { mobileNumber } = req.body;

    const user = await User.findOne({ mobileNumber });

    if (!user) throw new ApiError(404, "User not found");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.json(new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful"));
});

const logoutUser = asyncHandler(async(req,res) => {
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: "" }});

    return res.json(new ApiResponse(200,null,"Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req,res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new ApiError(401, "Refresh token expired");

    const user = await User.findOne({ refreshToken });
    if (!user) throw new ApiError(403, "Invalid refresh token");

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,async(err,decoded) => {
        if (err) throw new ApiError(403, "Expired or invalid refresh token");

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res.json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken}, "Token refreshed")
        );
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    const userId = req.user._id;

    console.log("🔄 Updating profile for user:", userId);
    console.log("📝 Update data:", { fullName, email });

    if (!fullName && !email) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) {
        // Check if email already exists for another user
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            throw new ApiError(409, "Email already exists");
        }
        updateData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    console.log("✅ Profile updated successfully:", updatedUser._id);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("📷 Updating avatar for user:", userId);

    if (!req.file) {
        throw new ApiError(400, "Avatar file is required");
    }

    const uploadResponse = await uploadOnCloudinary(req.file.path);
    if (!uploadResponse) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: uploadResponse.secure_url } },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found");
    }

    console.log("✅ Avatar updated successfully:", uploadResponse.secure_url);

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar updated successfully")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    checkLoginUser,
    checkRegisterUser,
    updateProfile,
    updateAvatar
}