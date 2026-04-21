import validator from 'validator';
import bcrypt from 'bcrypt';
import { cloudinary } from '../config/cloudinary.js';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';


// Api for admin doctor
const addDoctor = async (req, res) => {
    try {
        const {name, email, password, speciality, degree, experience, about, fees, address,available}= req.body;
        const imageFile = req.file;

        // checking for all data to add doctor
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile || !available){
            return res.json({success:false, message:"All fields are required"});
        }

        // validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false, message:"Invalid email format"});
        }

            // validating password strength
        if(password.length<8){
            return res.json({success:false, message:"Password should be at least 8 characters long"});
        }

        // hashing doctor password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            resource_type:'image'
        });
        const imageUrl = imageUpload.secure_url;


        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            speciality,
            degree,
            experience,
            about,
            fees,
            available:true,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({success:true, message:"Doctor added successfully"});
       
    } catch (error) {
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

// API for admin Login
const loginAdmin = async(req, res) => {
    try{
        const {email, password} = req.body;
        
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET);
            res.json({success:true, message:"login successful",token});
        }else{
            res.json({success:false, message:"Invalid email or password"});
        }
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API to get all doctors list for admin panel
const allDoctors = async(req,res)=>{
    try{
        
        const doctors = await doctorModel.find({}).select('-password');
        res.json({success:true, doctors});
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API to get all appointments list
const appointmentAdmin = async(req,res)=>{
    try{
        const appointments = await appointmentModel.find({});
        res.json({success:true, appointments});
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API for appointment cancellation by admin

const appointmentCancel = async(req,res)=>{
    try{
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

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


//API to get dashboard data for admin panel
const adminDashbaord = async(req,res)=>{
    try{
        const doctors = await doctorModel.find({});
        const users = await userModel.find({});
        const appointments = await appointmentModel.find({});

        const dashData = {
            doctors: doctors.length,
            paitents: users.length,
            appointments: appointments.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

        res.json({success:true, ...dashData});
        
    }catch(error){
        console.log(error);
        res.json({success:false, message:error.message});    
    }
}


export { addDoctor, loginAdmin, allDoctors, appointmentAdmin, appointmentCancel, adminDashbaord};