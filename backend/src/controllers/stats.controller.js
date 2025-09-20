import { Issue } from "../models/issue.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Total Users
const getTotalUsers = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  return res
    .status(200)
    .json(new ApiResponse(200, { totalUsers }, "Total users fetched"));
});

// 2. Total Issues
const getTotalIssues = asyncHandler(async (req, res) => {
  const totalIssues = await Issue.countDocuments();
  return res
    .status(200)
    .json(new ApiResponse(200, { totalIssues }, "Total issues fetched"));
});

// 3. Resolved Issues
const getResolvedIssues = asyncHandler(async (req, res) => {
  const resolvedIssues = await Issue.countDocuments({ status: "RESOLVED" });
  return res
    .status(200)
    .json(new ApiResponse(200, { resolvedIssues }, "Resolved issues fetched"));
});

// 4. Critical Issues
const getCriticalIssues = asyncHandler(async (req, res) => {
  const criticalIssues = await Issue.countDocuments({ priority: "HIGH" });
  return res
    .status(200)
    .json(new ApiResponse(200, { criticalIssues }, "Critical issues fetched"));
});

const getRecentIssues = asyncHandler(async (req,res) => {
    const limit = parseInt(req.query.limit) || 5;
    const recentIssues = await Issue.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("reportedBy", "fullname email")
        .lean();

        return res
            .status(200)
            .json(new ApiResponse(200, { recentIssues }, "Recent issues fetched"));
});

const getAllUsers = asyncHandler(async (req,res) => {
    const users = await User.find({},
        "fullName email mobileNumber aadharNumber gender role createdAt"
    ).lean();

    return res
        .status(200)
        .json(new ApiResponse(200, { users } , "Users fetched successfully"));
});

const updateUser = asyncHandler(async (req,res) => {
    const { id } = req.params;
    const { fullName, email, mobileNumber, aadharNumber, gender, role } = req.body;

    const updateUser = await User.findByIdAndUpdate(
        id,
        { fullName, email, mobileNumber, aadharNumber, gender, role },
        { new : true, runValidators: true, fields: "fullName email mobileNumber aadharNumber gender role createdAt"}
    );

    if (!updateUser) {
        throw new ApiError(404, "User not found");
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, updateUser, "User updated successfully"));
});

const deleteUser = asyncHandler(async (req,res) => {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deleteUser) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200 ,null ,"User deleted successfully"));
});

export {
    getTotalIssues,
    getTotalUsers,
    getResolvedIssues,
    getCriticalIssues,
    getRecentIssues,
    getAllUsers,
    updateUser,
    deleteUser
}
