import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema({
    type: String,
    name: { type: String, required: true, unique: true }, //e.g. POTHOLE< SANITATION
    email: String,
    phone: String,
    autoAssign: { type: Boolean, default: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
    priorities: [{ type: String, enum: ["LOW","MEDIUM","HIGH"] }],
}, { timestamps: true});

export const Department = mongoose.model("Department",departmentSchema);