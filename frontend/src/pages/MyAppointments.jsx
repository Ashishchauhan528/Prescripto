import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MyAppointments = ()=>{

    const {backendUrl, token, getDoctorsData} = useContext(AppContext)

    const [appointments, setAppointments] = useState([]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const navigate = useNavigate();

    const slotDateFormat = (slotDate)=>{
        const dateArray = slotDate.split('_')
        return dateArray[0]+" "+months[Number(dateArray[1])-1]+" "+dateArray[2];
    }

    const getUserAppointments = async()=>{
        try{
            const {data} = await axios.get(backendUrl + '/api/user/appointments', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if(data.success){
                setAppointments(data.appointments.reverse());
            }
            else{
                toast.error(data.message);
            }
        }catch(error){
            console.log(error);
            toast.error(error.message);
        }
    }

    const cancelAppointment = async(appointmentId)=>{
        try{
            const {data} = await axios.post(backendUrl + '/api/user/cancel-appointment', {appointmentId}, {headers: {
                    Authorization: `Bearer ${token}`}
            });
            if(data.success){
                toast.success(data.message);
                getUserAppointments();
                getDoctorsData();
            }
            else{
                toast.error(data.message);
            }
        }catch(error){
            console.log(error);
            toast.error(error.message);
        }
    }

    const initPay = (order, appointmentId) => {
    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Appointment Payment",
        description: "Payment for doctor appointment",
        order_id: order.id,

        // Better UX
        prefill: {
            name: "User",
            email: "user@email.com"
        },

        // success handler
        handler: async (response) => {
            try {
                console.log("RAZORPAY RESPONSE:", response);

                const { data } = await axios.post(
                    backendUrl + "/api/user/verifyRazorpay",
                    {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        appointmentId
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (data.success) {
                    toast.success("Payment Verified");
                    getUserAppointments();
                    navigate('/my-appointments');
                } else {
                    toast.error(data.message || "Verification Failed");
                }

            } catch (error) {
                console.log(error);
                toast.error("Server Error during verification");
            }
        },

        //IMPORTANT: handle failure
        modal: {
            ondismiss: function () {
                toast.error("Payment cancelled by user");
            }
        }
    };

    const rzp = new window.Razorpay(options);

    //handle payment failure
    rzp.on("payment.failed", function (response) {
        console.log("PAYMENT FAILED:", response);
        toast.error("Payment Failed ");
    });

    rzp.open();
};


const appointmentRazorpay = async (appointmentId) => {
    try {
        const { data } = await axios.post(
            backendUrl + '/api/user/payment-razorpay',
            { appointmentId },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (data.success) {
            console.log("ORDER:", data.order); // keep this for now
            initPay(data.order, appointmentId);
        } else {
            toast.error(data.message);
        }

    } catch (error) {
        console.log(error);
        toast.error(error.message);
    }
};

    useEffect(()=>{
if(token){
    if(token){
        getUserAppointments();
    }
}
    },[token])
    return(
        <div>
            <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
            <div>
                {appointments.map((item,index)=>(
                    <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
                        <div>
                            <img className='w-32 *:bg-indigo-50' src={item.docData.image} alt=""/>
                        </div>
                        <div className='flex-1 text-sm text-zinc-600'>
                            <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                            <p>{item.docData.speciality}</p>
                            <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                            <p className='text-xs'>{item.docData.address.line1}</p>
                            <p className='text-xs' >{item.docData.address.line2}</p>
                            <p className='text-sm mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time: </span>{slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                        </div>
                        <div></div>
                        <div className='flex flex-col gap-2 justify-end'>
                            {!item.cancelled && <button onClick={()=>appointmentRazorpay(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}
                            {!item.cancelled && <button onClick={()=>cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel Appointment</button>}
                            {item.cancelled && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment Cancelled</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
};

export default MyAppointments;