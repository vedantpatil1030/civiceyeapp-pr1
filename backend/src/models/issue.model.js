import mongoose, { Schema } from "mongoose";

const issueSchema = new Schema({
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true},
    description: { type: String, required: true },
    type: { type : String, required: true },
    images: [{ type: String}], //URL's

    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String }
    },

    classifiedDept : { type: String },
    finalDept: { type: String },

    //Actual WorkFlow
    assignedDept: { type: String },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User"},
    assignedAt: { type: Date },

    assignedToStaff: { type: Schema.Types.ObjectId, ref: "Staff"},
    staffAssignedAt: { type: Date },

    status: {
        type: String,
        enum: ["REPORTED","ASSIGNED_DEPT","ASSIGNED_STAFF","IN_PROGRESS","COMPLETED","VERIFIED","RESOLVED"],
        default: "REPORTED"
    },

    priority: { type: String, enum: ["LOW","MEDIUM","HIGH"], default: "LOW"},

    //Proof of work uploaed by staff
    proofOfWork: [{
        uploadedBy: { type: Schema.Types.ObjectId, ref: "Staff" },
        imageUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],

    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],

    comments: [{
        user: { type: Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],

    statusHistory: [{
        status: String,
        changedBy: { type: Schema.Types.ObjectId, ref: "User"},
        timestamp: { type: Date, default: Date.now }
    }]
},{ timestamps: true });

issueSchema.index({ "Location": "2dsphere"});
export const Issue = mongoose.model("Issue", issueSchema);