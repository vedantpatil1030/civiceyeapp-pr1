import { Issue } from "../models/issue.model.js";

// Create a new issue/report and associate with the authenticated user
export const createIssue = async (req, res) => {
	try {
		const userId = req.user && req.user._id ? req.user._id : req.user; // support both _id and id
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized: No user found in request." });
		}
		const {
			title,
			description,
			type,
			images,
			location,
			classifiedDept,
			finalDept,
			priority
		} = req.body;

		const newIssue = new Issue({
			reportedBy: userId,
			title,
			description,
			type,
			images,
			location,
			classifiedDept,
			finalDept,
			priority
		});
		await newIssue.save();
		res.status(201).json(newIssue);
	} catch (error) {
		res.status(500).json({ message: "Failed to create issue", error: error.message });
	}
};

// Get all issues for the authenticated user
export const getMyIssues = async (req, res) => {
	try {
		const userId = req.user && req.user._id ? req.user._id : req.user;
		if (!userId) {
			return res.status(401).json({ message: "Unauthorized: No user found in request." });
		}
		const issues = await Issue.find({ reportedBy: userId }).sort({ createdAt: -1 });
		res.status(200).json(issues);
	} catch (error) {
		res.status(500).json({ message: "Failed to fetch issues", error: error.message });
	}
};
