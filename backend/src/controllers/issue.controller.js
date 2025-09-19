import { Issue } from "../models/issue.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { compressImage } from "../services/compress.service.js";
import { classifyImage } from "../services/ml.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import path from "path";    
import fs from "fs/promises";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateIssueReport } from "../services/report.service.js";


const createIssue = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, description, type, address, latitude, longitude } = req.body;

  // Validate required fields
  if (!title || !description || !type || !latitude || !longitude || !address) {
    throw new ApiError(400, "Missing required fields");
  }

  // Gather uploaded files (multer)
  const files = [
    ...(req.files?.images || []),
    ...(req.files?.file || []),
    ...(req.file ? [req.file] : []) // fallback if single file
  ];

  if (files.length === 0) {
    throw new ApiError(400, "At least one image is required");
  }

  const uploadedUrls = [];
  let classifiedDept = null;

  // ------------------- PROCESS FILES -------------------
  for (const file of files) {
    const localPath = file.path;

    // Step 1: ML classification (on ORIGINAL file)
    try {
      const mlResp = await classifyImage(localPath);
      classifiedDept = mlResp?.predicted_department || classifiedDept;
    } catch (err) {
      console.error("ML classify failed:", err.response?.data || err.message);
    }

    // Step 2: Compress the file
    let compressedInfo;
    try {
      compressedInfo = await compressImage(localPath);
    } catch (err) {
      console.error("compress failed:", err.message);
      compressedInfo = { path: localPath }; // fallback to original
    }

    let fileToUpload = compressedInfo?.path || localPath;

    // If compress service returned base64 buffer, write temp file
    if (compressedInfo?.buffer) {
      const tempFile = path.join(
        "public",
        "temp",
        `compressed-${Date.now()}-${file.originalname}`
      );
      await fs.writeFile(tempFile, Buffer.from(compressedInfo.buffer, "base64"));
      fileToUpload = tempFile;
    }

    // Step 3: Upload to Cloudinary
    const cloudResp = await uploadOnCloudinary(fileToUpload, "issues");
    uploadedUrls.push(cloudResp.secure_url);
  }

  // ------------------- SAVE TO DB -------------------
  const issue = await Issue.create({
    reportedBy: userId,
    title,
    description,
    type,
    images: uploadedUrls,
    location: {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
      address
    },
    classifiedDept,
    status: "REPORTED",
    statusHistory: [{ status: "REPORTED", changedBy: userId }]
  });

  return res
    .status(201)
    .json(new ApiResponse(201, issue, "Issue created successfully!"));
});


const generateReport = asyncHandler(async (req,res) => {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId).populate("reportedBy", "name email");
    if (!issue) {
        throw new ApiError(404, "Issue not found");
    }

    try {
        const pdfUrl = await generateIssueReport(issue);
        issue.reportUrl = pdfUrl;
        await issue.save();
        
        return res
            .status(200)
            .json(new ApiResponse(200, { pdfUrl }, "Report generated successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to generate report", [error.message]);
    }
});

const adminAssign = asyncHandler(async (req,res) => {
    const { issueId } = req.params;
    const { finalDept, staffId, priority } = req.body;
    const adminUser = req.user._id;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found "});

    if (finalDept ) issue.finalDept = finalDept;
    if (priority) issue.priority = priority;
    if (staffId) {
        issue.assignedToStaff = staffId;
        issue.status = "ASSIGNED";
        issue.statusHistory.push({ status: "ASSIGNED", changedBy: adminUser });
    }

    await issue.save();
    return res.json({ message: "Assigned", data: issue });
});

const staffUploadProof = asyncHandler(async (req,res) => {
    const staffUser = req.user._id;
    const { issueId } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded "});

    let compressedInfo;
    try {
        compressedInfo = await compressImage(file.path);
    } catch (err) {
        compressedInfo = { path: file.path };
    }

    // let fileToUpload = compressedInfo.path || file.path;
    // let (compressedInfo.buffer) {
    //     const tmpFile = path.join("public","temp",`proof-${Date.now()}-${file.originalname}`);
    //     await fs.writeFile(tmpFile, Buffer.from(compressedInfo.buffer, "base64"));
    //     fileToUpload = tmpFile;
    // }

    const cloudResp = await uploadToCloudinary(fileToUpload, "proofs");

    const issue = await Issue.findById(issueId);
    issue.proofOfWork.push({ uploadedBy: staffUser, imageUrl: cloudResp.secure_url });
    issue.status = "COMPLETED";
    issue.statusHistory.push({ status: "COMPLETED", changedBy: staffUser });
    await issue.save();

    return res.json({ message: "Proof uploaded", data: issue});
});

const changeStatus = asyncHandler(async (req,res) => {
    const { issueId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    issue.status = status;
    issue.statusHistory.push({ status, changedBy: userId });
    await issue.save();
    return res.json({ message: "Status updated", data: issue });
})

const upvote = asyncHandler(async(req,res) => {
    const { issueId } = req.params;
    const userId = req.user._id;
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    const idx = issue.upvotes.findIndex(u => u.toString() === userId.toString());
    if (idx === -1) {
        issue.upvotes.push(userId);
    } else {
        issue.upvotes.slice(idx,1);
    }
    await issue.save();
    return res.json({ message: "Upvote toggled", data: issue });
});

const addComment = asyncHandler(async (req,res) => {
    const { issueId } = req.params;
    const { text } = req.body;
    if(!text) return res.status(400).json({ message: "Text required" });
    const userId = req.user._id;
    const issue = await Issue.findById(issueId);
    issue.comments.push({ user: userId, text });
    await issue.save();
    return res.json({ message: "Comment added", data: issue });
});

const nearbyIssues = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: "lat,lng required" });

  const issues = await Issue.find({
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius)
      }
    }
  }).limit(200);

  return res.json({ data: issues });
});
// Get all issues for map view
const getAllIssues = asyncHandler(async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('reportedBy', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json(
            new ApiResponse(200, {
                issues,
                count: issues.length
            }, "Issues fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching issues: " + error.message);
    }
});

// Get all issues reported by the logged-in user
const getMyIssues = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const issues = await Issue.find({ reportedBy: userId })
        .sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, {
            issues,
            count: issues.length
        }, "User issues fetched successfully")
    );
});

export {
    createIssue,
    adminAssign,
    staffUploadProof,
    changeStatus,
    upvote,
    addComment,
    nearbyIssues,
    generateReport,
    getMyIssues,
    getAllIssues
}