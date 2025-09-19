import { Router } from "express";

import { 
    loginUser,
    registerUser,
    refreshAccessToken,
    checkLoginUser,
    checkRegisterUser,
    logoutUser,
    updateProfile,
    updateAvatar,
    createDepartmentAdmin,
    createStaff,
    getMe
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

// Get current user profile (for persistent login)
router.route("/me").get(verifyJWT, getMe);


router.route("/register").post(
    upload.single("avatar"),
    registerUser
)

//Create Dept admin and Staff
router.route("/create-department-admin").post(verifyJWT, createDepartmentAdmin);
router.route("/create-staff").post(verifyJWT,createStaff);

router.route("/check-register").post(checkRegisterUser);
router.route("/check-login").post(checkLoginUser);

router.route("/login").post(loginUser)

//Secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/update-profile").put(verifyJWT, updateProfile)
router.route("/update-avatar").put(verifyJWT, upload.single("avatar"), updateAvatar)

export default router


