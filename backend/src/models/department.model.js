import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema({
    type: { type: String, required: true, unique: true }, //e.g. POTHOLE< SANITATION
    departmentName: { type: String, required: true },
}, { timestamps: true});

export const Department = mongoose.model("Department",departmentSchema);