import { Router } from "express";
import {
    createDepartment,
    getAllDepartments,
    getDepartmentMembers
} from "../controllers/department.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//Secured Routes
router.route("/create-department").post(verifyJWT, createDepartment);


router.route("/get-all-departments").get(getAllDepartments);

// New members endpoint by dept id/name/type (public for now)
router.get("/:deptName/members", getDepartmentMembers);

export default router;
