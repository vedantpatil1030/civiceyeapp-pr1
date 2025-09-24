import express from 'express';
import cors from 'cors';
import dotenv from "dotenv"
import cookieParser from 'cookie-parser';

const app = express();
dotenv.config({
    path: './.env'
})
app.use(cors({
    origin: ['http://localhost:8081', 'http://10.0.2.2:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

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

// Error handling middleware
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.path
    });
});

export { app }