import { Router } from "express";
import {
    createDepartment,
    getAllDepartments
} from "../controllers/department.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//Secured Routes
router.route("/create-department").post(verifyJWT, createDepartment);


router.route("/get-all-departments").get(getAllDepartments);

export default router;
