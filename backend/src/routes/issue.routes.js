import { Router } from "express";
import {
    generateReport,
    createIssue
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


export default router;import { Router } from "express";
import { createIssue, getMyIssues } from "../controllers/issue.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create a new issue (personalized)
router.post("/create", verifyJWT, createIssue);

// Get all issues for the logged-in user
router.get("/my-reports", verifyJWT, getMyIssues);

export default router;
