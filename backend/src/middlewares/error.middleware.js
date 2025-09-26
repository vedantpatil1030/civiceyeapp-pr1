import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    console.error("Error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    // Handle network errors
    if (!err.statusCode) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }

    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
};

export { errorHandler };