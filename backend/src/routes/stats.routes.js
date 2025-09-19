import express from "express";
import {
    getTotalIssues,
    getTotalUsers,
    getCriticalIssues,
    getResolvedIssues,
    getRecentIssues,
    getAllUsers,
    updateUser,
    deleteUser
} from "../controllers/stats.controller.js";

const router = express.Router();

router.route("/users/total").get(getTotalUsers);
router.route("/issues/total").get(getTotalIssues);
router.route("/issues/resolved").get(getResolvedIssues);
router.route("/issues/critical").get(getCriticalIssues);
router.route("/issues/recent").get(getRecentIssues);
router.route("/getAllUsers").get(getAllUsers);
router.route("/update/:id").put(updateUser);
router.route("/delete/:id").delete(deleteUser);

export default router;