# Prescripto – Doctor Appointment Booking Platform

A full-stack web application that enables patients to browse verified doctor profiles, check real-time availability, and securely book appointments online. Built with a focus on production-ready backend architecture, secure authentication, and integrated payment processing.

## ✨ Features

### Patient Side
- Browse and search doctors by speciality
- View doctor profiles with fees, experience, and availability
- Book, reschedule, or cancel appointments
- Secure login and signup with JWT authentication
- Pay appointment fees online via Razorpay

### Doctor Dashboard
- Manage appointment requests (accept / cancel)
- View earnings and patient history
- Update profile and availability

### Admin Panel
- Add and manage doctors on the platform
- View all appointments across the system
- Dashboard with platform-level analytics

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| Payments | Razorpay Payment Gateway |
| File Uploads | Cloudinary (Doctor profile images) |
| Config Management | dotenv |

## 🏗️ Architecture

The project follows a **3-tier monorepo structure**:

```
Prescripto/
├── backend/         # Node.js + Express REST API
│   ├── controllers/ # Route handler logic
│   ├── models/      # Mongoose schemas (User, Doctor, Appointment)
│   ├── routes/      # API route definitions
│   ├── middlewares/ # Auth middleware, error handlers
│   └── server.js    # Entry point
│
├── frontend/        # React.js patient-facing app
│
└── admin/           # React.js admin & doctor dashboard
```
## 🔌 API Endpoints (Backend)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/register` | Register a new patient |
| POST | `/api/user/login` | Patient login |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/doctor/login` | Doctor login |

### Doctors
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctor/list` | Get all available doctors |
| GET | `/api/doctor/:id` | Get doctor profile by ID |
| POST | `/api/admin/add-doctor` | Add a new doctor (Admin only) |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/book-appointment` | Book an appointment |
| GET | `/api/user/appointments` | Get patient's appointments |
| POST | `/api/user/cancel-appointment` | Cancel an appointment |
| GET | `/api/doctor/appointments` | Get doctor's appointments |
| POST | `/api/doctor/complete-appointment` | Mark appointment as complete |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/payment-razorpay` | Initiate Razorpay payment |
| POST | `/api/user/verify-razorpay` | Verify payment and confirm booking |

## 🔐 Security

- Passwords hashed using **bcryptjs** before storage
- Route protection via **JWT middleware** on all authenticated endpoints
- Environment variables used for all secrets — no hardcoded credentials
- Razorpay payment signature verified server-side before confirming bookings


## 📦 Key Dependencies

```json
{
  "express": "^4.x",
  "mongoose": "^8.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "razorpay": "^2.x",
  "cloudinary": "^2.x",
  "dotenv": "^16.x",
  "cors": "^2.x",
  "multer": "^1.x"
}
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Ashish Chauhan**
- GitHub: [@Ashishchauhan528](https://github.com/Ashishchauhan528)
- LinkedIn: https://www.linkedin.com/in/ashishchauhan132/
- Email: chauhanashish0831@gmail.com
