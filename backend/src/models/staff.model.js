const staffSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true },
    designation: { type: string },
});

export const Staff = mongoose.model("Staff", staffSchema);