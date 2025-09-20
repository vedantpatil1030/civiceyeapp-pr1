import mongoose, { Schema } from "mongoose";
const staffSchema = new Schema({
    name: String,
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    disActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Staff = mongoose.model("Staff", staffSchema);