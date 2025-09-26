import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        fullName: { type: String, required: true, trim: true, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        mobileNumber: { type: String, required: true, unique: true },
        aadharNumber: { type: String, required: true, unique: true },
        gender: { type: String, enum: ["male", "female", "other"] },

        avatar: { type: String },
        refreshToken: { type: String },

        role: { 
          type: String, 
          enum: ["CITIZEN","MUNICIPAL_ADMIN","DEPARTMENT_ADMIN","STAFF"],
          default: "CITIZEN" 
        },

        department: { type: Schema.Types.ObjectId, ref: "Department" },
    },
    {timestamps: true}   
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Add pre-save middleware to format phone number
userSchema.pre('save', function(next) {
  if (this.mobileNumber) {
    // Remove any non-digit characters and ensure it's a string
    this.mobileNumber = this.mobileNumber.toString().replace(/\D/g, '');
  }
  next();
});

// Add a custom query helper
userSchema.query.byPhone = function(phone) {
  return this.where({ mobileNumber: phone.toString().replace(/\D/g, '') });
};

export const User = mongoose.model("User", userSchema);