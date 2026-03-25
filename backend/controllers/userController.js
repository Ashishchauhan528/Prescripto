import validator from "validator";
import bycrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";


//API to register user
const registerUser = async (req,res)=>{
    try{
        const {name,email,password} = req.body;
        
        if(!name || !email || !password){
            return res.json({success:false, message:"Missing Details"});
        }

        //validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false, message:"Invalid Email"});
        }

        //validating strong password
        if(password.length < 8){
            return res.json({success:false, message:"Password must be at least 8 characters"});
        }

        // hashing user password
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        //save user data to database
        const newUser = new userModel(userData);
        const User = await newUser.save();

        const token = jwt.sign({id:User._id}, process.env.JWT_SECRET);

        res.json({success:true, message:"User registered successfully", token});
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}


//API to login user
const loginUser = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const user =await userModel.findOne({email});

        if(!user){
            return res.json({success:false, message:"User not found"});
        }

        const isMatch = await bycrypt.compare(password, user.password);
        if(isMatch){
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
            res.json({success:true, token});
        }else{
            res.json({success:false, message:"Invalid Credentials"});
        }
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}


export {registerUser, loginUser};