import { Department } from "../models/department.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createDepartment = async (req,res) => {
    const { type,name, email, phone } = req.body;

    if (req.user.role !== "MUNICIPAL_ADMIN") {
        return res.status(403).json({ message: "Only Municipal Admin can create departments"});
    }

    const department = await Department.create({ type, name, email, phone });
    return res.json(201).json(new ApiResponse(201, department, "Department created"));
}

const getAllDepartments = asyncHandler(async (req,res) => {
    const departments = await Department.find({}, "_id departmentName type");
    return res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"));
});

export {
    createDepartment,
    getAllDepartments
}