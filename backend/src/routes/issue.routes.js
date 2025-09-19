import { Router } from "express";
import {
    generateReport,
    createIssue,
    adminAssign,
    changeStatus,
    upvote,
    addComment,
    nearbyIssues,
    staffUploadProof,
    getAllIssues,
    getIssueById,
    reassignDept,
    getIssueProgress,
    getDeptIssues,
    getIssueStaff,
    assignStaff,
    verifyIssue,
    raiseDeptComplaint,
    getMyIssues
} from "../controllers/issue.controller.js"
import multer from "multer";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
// import { verify } from "jsonwebtoken";

const upload = multer({ dest: "uploads/"});

const router = Router();

//Create Issue
router.route("/report").post(
    verifyJWT,
    upload.fields([
        { name: "images", maxCount: 5 },
        { name: "file", maxCount: 5 }
    ]),
    createIssue
);

//For the generation of report
router.route("/:issueId/report").get(generateReport);

// Admin assigns issue
router.route("/:issueId/assign").post(verifyJWT,
    authorizeRoles("MUNICIPAL_ADMIN"),
    adminAssign
);
    
//Staff Upload Proof
router.route("/:issueId/proof").post(verifyJWT,
    authorizeRoles("STAFF"),
    upload.single("file"),
    staffUploadProof
)

//Change Status
router.route("/:issueId/status").post(
    verifyJWT, 
    authorizeRoles("SUPER_ADMIN","ADMIN","DEPT_ADMIN","STAFF"),
    changeStatus
);

//Upvote 
router.route("/:issueId/upvote").post(
    verifyJWT, 
    authorizeRoles("CITIZEN"), 
    upvote
);

//Add Comment
router.route("/:issueId/comment").post(
    verifyJWT,
    addComment
);

//To get the nearby issues
router.route("/nearby").post(
    verifyJWT,
    nearbyIssues
);



// Create a new issue (personalized)
router.post("/create", verifyJWT, createIssue);

// Get all issues for the logged-in user
router.get("/my-reports", verifyJWT, getMyIssues);

// Get all issues (for map view)
router.get("/all", verifyJWT, getAllIssues);

export default router;
