import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        console.log('Request Headers:', req.headers); // Debug all headers
        
        // Get token from various places
        const authHeader = req.headers.authorization || req.header("Authorization");
        const cookieToken = req.cookies?.accessToken;
        const token = authHeader ? authHeader.replace("Bearer ", "") : cookieToken;
        
        console.log('Auth Header:', authHeader);
        console.log('Cookie Token:', cookieToken);
        console.log('Final Token:', token);
        
        if (!token) {
            throw new ApiError(401, "No authentication token found")
        }
    
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            console.log('Decoded Token:', decodedToken);
            
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
            
            if (!user) {
                throw new ApiError(401, "User not found")
            }
            
            req.user = user;
            next()
        } catch (jwtError) {
            console.error('JWT Verification Error:', jwtError);
            throw new ApiError(401, "Invalid token")
        }
    } catch (error) {
        console.error('Auth Error:', error);
        throw new ApiError(401, error?.message || "Authentication failed")
    }
})

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access Denied" });
        }
        next();
    };
};