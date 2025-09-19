import mongoose, { Schema } from "mongoose";

const ComplaintSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // super admin or citizen
  againstDept: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  reason: String,
  status: { 
    type: String, 
    enum: ['OPEN','INVESTIGATING','ACTION_TAKEN','CLOSED'], default: 'OPEN' },
  createdAt: { type: Date, default: Date.now },
  actions: [{ 
    text: String, 
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    at: Date }]
}, { timestamps: true });

export const Complaint = mongoose.model("Complaint", ComplaintSchema);