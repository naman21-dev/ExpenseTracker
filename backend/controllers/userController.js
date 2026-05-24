import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret_key"; // In production, use environment variables
const TOKEN_EXPIRes = "24h"; // Token expiration time

const createToken = (userId) => 
    jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRes });


//REGISTER A USER
export async function registerUser(req, res) {
    const { name, email, password } = req.body;
    if(!name || !email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Please fill all the fields" 
        });
    }
    if(!validator.isEmail(email)) {
        return res.status(400).json({ 
            success: false,
            message: "Please enter a valid email" 
        });
    }
    if(password.length < 8) {
        return res.status(400).json({ 
            success: false,
            message: "Password must be at least 8 characters long" 
        });
    }

    try {
        if(await User.findOne({ email })) {
            return res.status(409).json({ 
                success: false,
                message: "User already exists" 
            });
        }

            const hashed = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, password: hashed });
            const token = createToken(user._id);
            res.status(201).json({ 
                success: true,
                token,
                user: {
                    id: user._id, name: user.name, email: user.email
                }
            });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

//LOGIN A USER
export async function loginUser(req, res) {
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Please fill all the fields" 
        });
    }

    try {
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid credentials" 
            });
        }

        const token = createToken(user._id);
        res.status(200).json({ 
            success: true,
            token,
            user: {
                id: user._id, name: user.name, email: user.email
            }
        });
    } 
    
    catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

//GET USER DETAILS
export async function getUserDetails(req, res) {
    try {
        const user = await User.findById(req.user.id).select("name email");
        if(!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        res.json({ success: true, user});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

//to update user profile
export async function updateProfile(req, res) {
    const { name, email, password } = req.body;
    if(!name || !email || !validator.isEmail(email)) {
        return res.status(400).json({ 
            success: false,
            message: "Please fill all the fields correctly" 
        });
    }

    try {
        const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
        if(exists) {
            return res.status(409).json({ 
                success: false,
                message: "Email already in use" 
            });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {name,email},
            {new: true, runValidators: true, select: "name email"}
        );
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

//to change user password
export async function updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if(!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ 
            success: false,
            message: "Password invalid or too short" 
        });
    }
    try {
        const user = await User.findById(req.user.id).select("password");
        if(!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid current password" 
            });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}
