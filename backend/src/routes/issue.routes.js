import { Router } from "express";
import { createIssue, getMyIssues } from "../controllers/issue.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create a new issue (personalized)
router.post("/create", verifyJWT, createIssue);

// Get all issues for the logged-in user
router.get("/my-reports", verifyJWT, getMyIssues);

export default router;
