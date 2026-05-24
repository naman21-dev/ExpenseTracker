import express from "express";
import { registerUser, loginUser, getUserDetails, updateProfile, updatePassword} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";


const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Protected route
userRouter.get("/me", authMiddleware, getUserDetails);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.put("/password", authMiddleware, updatePassword);

export default userRouter;