import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req,res)=>{
    try{

        const docId = req.user.id;
        

        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, {available: !docData.available});

        res.json({success:true, message:"availability changed"});

    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

const doctorList = async (req,res)=>{
    try{
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({success:true, doctors});
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API for doctor Login
const loginDoctor = async (req,res)=>{
    try{
        const {email, password} = req.body;
        const doctor = await doctorModel.findOne({email});
        if(!doctor){
            res.json({success:false, message:"Invalid credentials"});
        }
        const isMatch = await bcrypt.compare(password, doctor.password);
        if(isMatch){
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET);
            return res.json({success:true, message:"login successful",token});
        }else{
            return res.json({success:false, message:"Invalid email or password"});
        }
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API for doctor appointments for doctor panel
const appointmentsDoctor = async (req,res)=>{
    try{
        const docId = req.user.id;
        const appointments = await appointmentModel.find({docId});
        res.json({success:true, appointments});
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }

}

//API to mark appointment completed for doctor panel 
const appointmentComplete = async(req,res)=>{
    try{
        const { appointmentId } = req.body;
        const docId = req.user.id;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if(appointmentData && appointmentData.docId.toString() === docId){
            await appointmentModel.findByIdAndUpdate(appointmentId, {isCompleted: true});
            return res.json({success:true, message:"Appointment Completed Successfully"});
        }else{
            return res.json({success:false, message:"Invalid Appointment"});
        }
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}


//API to cancel appointment for doctor panel 
const appointmentCancel = async(req,res)=>{
    try{
        const { appointmentId } = req.body;
        const docId = req.user.id;

        const appointmentData = await appointmentModel.findById(appointmentId);
        if(appointmentData && appointmentData.docId.toString() === docId){
            await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true});
            return res.json({success:true, message:"Appointment Cancelled"});
        }else{
            return res.json({success:false, message:"Cancellation Failed"});
        }
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API to get dashboard data for doctor panel
const doctorDashboard = async(req,res)=>{
    try{
        const docId = req.user.id;
        const appointments = await appointmentModel.find({docId});

        let earnings = 0;
        appointments.map((item)=>{
            if(item.isCompleted || item.payment){
                earnings += item.amount;
            }
        })

        let patients = new Set();
        appointments.forEach(item => {
        patients.add(item.userId.toString());
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients:patients.size,
            latestAppointments: appointments.slice(-5).reverse()
        }

        res.json({success:true, dashData});

    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

// API to get doctor profile for Doctor panel
const doctorProfile = async(req,res)=>{
    try{
        const docId = req.user.id;
        const profileData = await doctorModel.findById(docId).select('-password');
        res.json({success:true,profile: profileData});
    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}

//API to update doctor profile data from data panel
const updateDoctorProfile =async(req,res)=>{
    try{
        const { fees, address, available } = req.body;
        const docId = req.user.id;

        await doctorModel.findByIdAndUpdate(docId, {fees, address, available});
        res.json({success:true, message:"profile updated"});

    }catch(error){
        console.log("ERROR:", error);
        res.json({success:false, message:error.message});
    }
}


export {changeAvailability, doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard,
       doctorProfile, updateDoctorProfile};