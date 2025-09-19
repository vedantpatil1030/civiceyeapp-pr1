import { Router } from "express";
import {
    generateReport,
    createIssue,
    getMyIssues,
    getAllIssues,
    upvoteIssue,
    addComment,
    getComments
} from "../controllers/issue.controller.js"
import multer from "multer";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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


// Create a new issue (personalized)
router.post("/create", verifyJWT, createIssue);

// Get all issues for the logged-in user
router.get("/my-reports", verifyJWT, getMyIssues);

// Get all issues (for map view)
router.get("/all", verifyJWT, getAllIssues);

// Upvote routes
router.post("/:issueId/upvote", verifyJWT, upvoteIssue);

// Comment routes
router.post("/:issueId/comments", verifyJWT, addComment);
router.get("/:issueId/comments", verifyJWT, getComments);

export default router;
