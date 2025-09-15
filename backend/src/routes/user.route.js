import { Router } from "express";
import { 
    loginUser,
    registerUser,
    refreshAccessToken,
    checkLoginUser,
    checkRegisterUser,
    logoutUser
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(
    upload.single("avatar"),
    registerUser
)

router.route("/check-register").post(checkRegisterUser);
router.route("/check-login").post(checkLoginUser);

router.route("/login").post(loginUser)

//Secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router


