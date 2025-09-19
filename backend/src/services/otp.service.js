import axios from "axios";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler  } from "../utils/asyncHandler.js";

const sendOtp = asyncHandler(async (req, res) => {
    const { mobileNumber } = req.body;

    if (!mobileNumber) throw new ApiError(400, "Mobile Number required!");

    const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${process.env.CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`;

    try {
        const response = await axios.post(url, {}, {
            headers: {
                authToken: process.env.MESSAGECENTRAL_AUTH
            }
        });
        return res.json(response.data);
    } catch (error) {
        console.error('OTP send error:', error?.response?.data || error.message || error);
        // Forward the error message from the external API if available
        if (error.response && error.response.data) {
            return res.status(400).json({
                success: false,
                message: error.response.data.message || 'Failed to send OTP',
                details: error.response.data
            });
        }
        throw new ApiError(400, error.message || 'Failed to send OTP');
    }
});

const verifyOtp = asyncHandler(async (req,res) => {
    const { mobileNumber, verificationId, code } = req.body;

    if (!mobileNumber || !verificationId || !code) throw new ApiError(400, "All fields are required");

    const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${process.env.CUSTOMER_ID}&code=${code}`;

    const response = await axios.get(url, {
        headers: {
            authToken: process.env.MESSAGECENTRAL_AUTH
        }
    });

    return res.json(response.data);
});

export { sendOtp, verifyOtp };