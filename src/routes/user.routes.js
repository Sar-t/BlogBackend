import {Router} from "express"
import { upload } from "../middlewares/multer.middlewares.js";
import { googleAuth, loginUser, registerUser, refreshAccessToken, logoutUser, userProfile, changePassword, logoutAllDevices} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'profilePicture', 
            maxCount: 1,
        }
    ]),
    registerUser
);

router.route('/login').post(loginUser);

router.route('/google').post(googleAuth);

router.route('/logout').post(
    verifyJWT,
    logoutUser
);
router.route('/refresh-token').get(
    verifyJWT,
    refreshAccessToken
);

router.route('/me').get(
    verifyJWT,
    userProfile
);

router.route('/change-password').post(
    verifyJWT,
    changePassword
);

router.route('/logout-all').post(
    verifyJWT,
    logoutAllDevices
)

export default router;