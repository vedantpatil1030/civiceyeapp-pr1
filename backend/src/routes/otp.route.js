import e, { Router } from "express";
import { 
    sendOtp, 
    verifyOtp 
} from "../services/otp.service.js";

const router = Router();

router.post("/send", sendOtp);
router.post("/verify", verifyOtp);

export default router;