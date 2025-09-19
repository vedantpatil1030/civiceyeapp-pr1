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
        issue.status = "ASSIGNED_STAFF";
        issue.statusHistory.push({ status: "ASSIGNED_STAFF", changedBy: adminUser });
    } else {
        issue.status = "ASSIGNED_DEPT";
        issue.statusHistory.push({ status: "ASSIGNED_DEPT", changedBy: adminUser });
    }

    issue.assignedBy = adminUser;
    issue.assignedAt = new Date();
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

    let fileToUpload = compressedInfo.path || file.path;
    try {
      if (compressedInfo.buffer) {
        const tmpFile = path.join("public","temp",`proof-${Date.now()}-${file.originalname}`);
        await fs.writeFile(tmpFile, Buffer.from(compressedInfo.buffer, "base64"));
        fileToUpload = tmpFile;
    }
    } catch(error) {
      console.error("Compression failed:",error)
    }
      
    const cloudResp = await uploadOnCloudinary(fileToUpload, "proofs");

    const issue = await Issue.findById(issueId);
    issue.proofOfWork.push({ 
      uploadedBy: staffUser, 
      imageUrl: cloudResp.secure_url });
    
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
        issue.upvoteCount++;
    } else {
        issue.upvotes.slice(idx,1);
        issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
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
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  }).limit(200);

  return res.json({ data: issues });
});

//TO get all issues 
//GET
const getAllIssues = asyncHandler(async (req,res) => {
  const { status, dept, priority } = req.query;

  const query = {};
  if (status) query.status = status;
  if (dept) query.finalDept = dept;
  if (priority) query.priority = priority;

  const issues = await Issue.find(query)
      .populate("reportedBy","name email")
      .populate("assignedToStaff", "name email")
      .sort({ createdAt: -1 });

    return res.json({ data: issues });
})

/**
 * GET /issues/:issueId
 * Fetch single issue with details
 */ 

const getIssueById = asyncHandler(async (req,res) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId)
      .populate("reportedBy","name email")
      .populate("assignedBy","name email")
      .populate("assignedToStaff","name email")
      .populate("comments.user", "name email");

  if (!issue) return res.status(404).json({ message: "Issue not found" });

  return res.json({ data: issue });
});

/**
 * PATCH /issues/:issueId/reassign-dept
 * Reassign issue to another department
 */
const reassignDept = asyncHandler(async (req,res) => {
  const { issueId } = req.params;
  const { newDept } = req.body;
  const adminUser = req.user._id;

  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  issue.finalDept = newDept;
  issue.statusHistory.push({ status: "REASSIGNED_DEPT", changedBy: adminUser });
  await issue.save();

  return res.json({ message: "Department reassigned", data: issue });
});

/**
 * GET /issues/:issueId/progress
 * Track department + staff actions
 */

const getIssueProgress = asyncHandler(async (req,res) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId)
      .populate("assignedToStaff","name email")
      .populate("proofOfWork.uploadedBy", "name email");

  if (!issue) return res.status(404).json({ message: "Issue not found" });

  return res.json({
    data: {
      finalDept: issue.finalDept,
      assignedDept: issue.assignedDept,
      assignedToStaff: issue.assignedToStaff,
      status: issue.status,
      proofOfWork: issue.proofOfWork,
      statusHistory: issue.statusHistory
    }
  });
});

/**
 * GET /departments/:deptName/issues
 * Get all issues assigned to a particular department
 */
const getDeptIssues = asyncHandler(async (req,res) => {
  const { deptName } = req.params;

  const issues = await Issue.find({ finalDept: deptName })
    .populate("reportedBy", "name email")
    .populate("assignedToStaff", "name email")
    .sort({ createdAt: -1 });

  return res.json({ data: issues });
});

/**
 * GET /issues/:issueId/staff
 * Get staff assignment info for issue
 */
const getIssueStaff = asyncHandler(async (req,res) => {
  const { issueId } = req.params;

  const issue = await Issue.findById(issueId).populate("assignedToStaff", "name email role");
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  return res.json({
    data: {
      staff: issue.assignedToStaff,
      staffAssignedAt: issue.staffAssignedAt,
      deadline: issue.deadline
    }
  });
});

/**
 * POST /issues/:issueId/assign-staff
 * Department assigns issue to staff
 */
const assignStaff = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { staffId, deadline } = req.body;
  const deptUser = req.user._id;

  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  issue.assignedToStaff = staffId;
  issue.staffAssignedAt = new Date();
  if (deadline) issue.deadline = deadline;
  issue.status = "ASSIGNED_STAFF";
  issue.statusHistory.push({ status: "ASSIGNED_STAFF", changedBy: deptUser });

  await issue.save();
  return res.json({ message: "Staff assigned", data: issue });
});


/**
 * POST /issues/:issueId/verify
 * Municipal Super Admin verifies issue
 */
const verifyIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const superAdmin = req.user._id;

  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  issue.status = "VERIFIED";
  issue.statusHistory.push({ status: "VERIFIED", changedBy: superAdmin });
  await issue.save();

  return res.json({ message: "Issue verified", data: issue });
});

/**
 * POST /departments/:deptId/complaint
 * Raise complaint against department for delay
 */

const raiseDeptComplaint = asyncHandler(async (req, res) => {
  const { deptId } = req.params;
  const { issueId, reason } = req.body;
  const superAdmin = req.user._id;

  // You can create a separate Complaint model if needed, here just log
  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  issue.statusHistory.push({
    status: "DEPT_COMPLAINT",
    changedBy: superAdmin,
    note: `Complaint against dept ${deptId}: ${reason}`
  });

  await issue.save();
  return res.json({ message: "Complaint raised", data: issue });
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
    getAllIssues,
    getIssueById,
    reassignDept,
    getIssueProgress,
    getDeptIssues,
    getIssueStaff,
    assignStaff,
    verifyIssue,
    raiseDeptComplaint
};