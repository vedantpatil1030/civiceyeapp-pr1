import { classifyImage } from "./ml.service.js";
import { Department } from "../models/department.model.js";

export async function autoAssignDepartment(imageUrl, issueType) {
    try {
        const ml = await classifyImage(imageUrl);
        if(ml?.department && ml.confidence >= 0.6) {
            return { department: ml.department, confidence: ml.confidence, source: "ML"};
        }
    } catch (err) {
        console.warn("ML failed", err.message);
    }

    const typeMap = {
        pothole: "POTHOLE_DEPT",
        garbage: "SANITATION_DEPT",
        streetlight: "ELECTRICITY_DEPT",
        tree: "URBAN_FORESTRY",
        water: "WATER_DEPT",
    };

    const dept = typeMap[issueType?.toLowerCase() || "GENERAL_WORKS"];
    return { department: dept, confidence: 0, source: "RULES" };
}