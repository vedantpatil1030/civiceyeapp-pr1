import express from 'express';
import cors from 'cors';
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';

const app = express();
dotenv.config({
    path: './.env'
})
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.route.js";
import otpRouter from "./routes/otp.route.js";
import departmentRouter from "./routes/department.route.js";
import issueRouter from "./routes/issue.routes.js";
import statsRouter from "./routes/stats.routes.js";

//routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/stats", statsRouter);

export { app }