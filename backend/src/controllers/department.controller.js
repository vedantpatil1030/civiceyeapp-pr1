import { Department } from "../models/department.model.js";
import { Staff } from "../models/staff.model.js";
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

// New: get department members by name/type/id
export const getDepartmentMembers = asyncHandler(async (req, res) => {
  const { deptName } = req.params;

  // Try resolve by id, then by name, then by type
  let dept = null;
  if (deptName?.match(/^[0-9a-fA-F]{24}$/)) {
    dept = await Department.findById(deptName);
  }
  if (!dept) {
    dept = await Department.findOne({ name: deptName }) || await Department.findOne({ type: deptName });
  }

  if (!dept) {
    return res.status(404).json(new ApiResponse(404, null, "Department not found"));
  }

  // Prefer embedded references, fallback to query Staff by department
  let members = await Staff.find({ department: dept._id }).select("name userRef department disActive");
  if (!members?.length && dept.members?.length) {
    members = await Staff.find({ _id: { $in: dept.members } }).select("name userRef department disActive");
  }

  return res.status(200).json(new ApiResponse(200, { members }, "Department members fetched"));
});