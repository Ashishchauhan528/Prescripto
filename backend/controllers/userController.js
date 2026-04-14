import validator from "validator";
import bycrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";

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

//API to get user profile data
const getProfile = async(req,res)=>{
    try{
        const userId = req.userId;
        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
  return res.json({ success: false, message: "Unauthorized" });
}
        res.json({success:true, user: userData});
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}

//API to update user profile
const updateProfile = async(req,res)=>{
    try{
        const userId = req.userId;
        const { name, phone, address, dob, gender } = req.body;
        const imageFile = req.file

        if(!name ||  !phone || !dob || !gender){
            return res.json({success:false, message:"Missing Details"});
        }
        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address: address ? JSON.parse(address) : {}   ,
            gender,
            dob,
        });

        if(imageFile){
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"});
            const imageUrl = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, {image:imageUrl});
        }
        res.json({success:true, message:"Profile Updated Successfully"});

    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}


//API to book appointment
const bookAppointment = async(req,res)=>{
    try{
        const { doctorId, slotDate, slotTime } = req.body;
        const userId = req.userId; // from auth middleware

        const docData = await doctorModel.findById(doctorId).select("-password");

        if(!docData.available){
            return res.json({success:false, message:"Doctor is not available"});
        }

        let slots_booked = docData.slots_booked;
        //checking for slots availability
        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({success:false, message:"Slot not available"});
            }else{
                slots_booked[slotDate].push(slotTime);
            }
        }else{
            slots_booked[slotDate] =[]
            slots_booked[slotDate].push(slotTime);
        }

        const userData = await userModel.findById(userId).select("-password");

        delete docData.slots_booked;

        const appointmentData = {
            userId: userId,
            docId: doctorId,
            slotDate,
            slotTime,
            userData,
            docData,
            amount: docData.fees,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        //save new slots data in docData
        await doctorModel.findByIdAndUpdate(doctorId, {slots_booked});

        res.json({success:true, message:"Appointment Booked Successfully"});
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}

//API to get user appointments for frontend my-appointments page
const listAppointment = async(req,res)=>{
    try{

        const userId = req.userId;
        const appointments = await appointmentModel.find({userId});

        res.json({success:true, appointments});
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}

//API to cancel appointment
const cancelAppointment = async(req,res)=>{
    try{
        const { appointmentId } = req.body;
        const userId = req.userId;

        const appointmentData = await appointmentModel.findById(appointmentId);

        //verify appointment user
        if(appointmentData.userId.toString() !== userId){
            return res.json({success:false, message:"Unauthorized"});
        }

        //delete appointment
        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true});
        //releasing doctor slot
        const {docId, slotDate, slotTime} = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;

        if (slots_booked[slotDate]) {
        slots_booked[slotDate] = slots_booked[slotDate].filter(
        (time) => time !== slotTime
        );

        // optional cleanup (good practice)
        if (slots_booked[slotDate].length === 0) {
        delete slots_booked[slotDate];
        }
    }
        await doctorModel.findByIdAndUpdate(docId, {slots_booked});

        res.json({success:true, message:"Appointment Cancelled Successfully"});

    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});    
    }
}

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
//API to make payment of appintment using razorpay
const paymentRazorpay = async(req,res)=>{
    try{
        const {appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if(!appointmentData || appointmentData.cancelled){
            return res.json({success:false, message:"Invalid Appointment"});
        }

        //creating options for razorpay payment
        const options = {
        amount: Math.round(Number(appointmentData.amount) * 100),
        currency: "INR",
        receipt: `receipt_${appointmentId}`,
        payment_capture: 1
        };

        console.log("AMOUNT:", appointmentData.amount);
        console.log("TYPE:", typeof appointmentData.amount);
        //creating order for payment
        const order = await razorpayInstance.orders.create(options);

        res.json({success:true, order});
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}

//API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        console.log("VERIFY HIT:", req.body);
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            appointmentId
        } = req.body;

        //basic validation~
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.json({ success: false, message: "Missing payment data" });
        }

        //create signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

            console.log("EXPECTED:", expectedSignature);
            console.log("RECEIVED:", razorpay_signature);

        //signature mismatch
        if (expectedSignature !== razorpay_signature) {
            return res.json({ success: false, message: "Invalid signature" });
        }

        console.log("Updating DB for:", appointmentId);
        //update DB safely
        const updated = await appointmentModel.findByIdAndUpdate(
        appointmentId,
        {
            payment: true,
            razorpay_order_id,
            razorpay_payment_id
        },
        { returnDocument: "after" }
        );
        if (!updated) {
            return res.json({ success: false, message: "DB update failed" });
        }

        console.log("UPDATED FULL:", updated);

        res.json({ success: true, message: "Payment Verified Successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay};