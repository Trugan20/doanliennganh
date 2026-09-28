# 🦷 Mirai Dental Care – Backend API

RESTful API for the Mirai Dental Care AI System built with **Node.js + Express + MongoDB + JWT**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# 3. Seed demo data
npm run seed

# 4. Start development server
npm run dev

# 5. Start production server
npm start
```

Server runs at **http://localhost:5000**

---

## 🔐 Demo Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@gmail.com       | admin123   |
| Doctor  | doctor@gmail.com     | doctor123  |
| Patient | patient@gmail.com     | patient123 |

---

## 📁 Project Structure

```
src/
├── config/
│   ├── db.js           # MongoDB connection
│   └── multer.js       # File upload config
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── patientController.js
│   ├── doctorController.js
│   ├── appointmentController.js
│   ├── recordController.js
│   ├── serviceController.js
│   ├── imageController.js
│   ├── scoreController.js
│   ├── chatController.js
│   ├── predictionController.js
│   └── voiceController.js
├── middleware/
│   ├── auth.js         # JWT verify + RBAC authorize()
│   ├── validate.js     # Joi validation
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Patient.js
│   ├── Doctor.js
│   ├── Appointment.js
│   ├── MedicalRecord.js
│   ├── Service.js
│   ├── ImageAnalysis.js
│   ├── DentalScore.js
│   └── ChatHistory.js
├── routes/
│   ├── index.js
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── patientRoutes.js
│   ├── doctorRoutes.js
│   ├── appointmentRoutes.js
│   ├── recordRoutes.js
│   ├── serviceRoutes.js
│   ├── imageRoutes.js
│   ├── scoreRoutes.js
│   ├── chatRoutes.js
│   ├── predictionRoutes.js
│   └── voiceRoutes.js
├── services/
│   └── aiService.js    # Chatbot + prediction (OpenAI or rule-based fallback)
├── utils/
│   ├── response.js     # Standardized API responses
│   ├── jwt.js
│   ├── pagination.js
│   └── seed.js         # Database seeder
└── server.js           # Entry point
```

---

## 🛡️ RBAC Permission Matrix

| Endpoint             | Admin | Doctor | Patient |
|----------------------|:-----:|:------:|:-------:|
| GET /users           | ✅    | ❌     | ❌      |
| GET /patients        | ✅    | ✅     | ❌      |
| GET /patients/me     | ❌    | ❌     | ✅      |
| GET /doctors         | ✅    | ✅     | ✅      |
| POST /appointments   | ❌    | ❌     | ✅      |
| GET /appointments    | ✅    | ✅     | ❌      |
| GET /appointments/me | ❌    | ❌     | ✅      |
| POST /records        | ✅    | ✅     | ❌      |
| GET /records/me      | ❌    | ❌     | ✅      |
| POST /images/upload  | ✅    | ✅     | ✅      |
| GET /images          | ✅    | ✅     | ❌      |
| GET /images/me       | ❌    | ❌     | ✅      |
| GET /scores/me       | ❌    | ❌     | ✅      |
| PUT /scores/patient  | ✅    | ✅     | ❌      |
| POST /chat/public    | ✅    | ✅     | ✅      |
| POST /chat/private   | ❌    | ✅     | ✅      |
| GET /chat/history    | ✅ all| ✅ own | ✅ own  |
| POST /predict        | ✅    | ✅     | ❌      |
| POST /voice          | ❌    | ✅     | ❌      |
| GET/POST /services   | ✅    | read   | read    |

---

## 📡 API Reference

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me
PUT    /api/auth/change-password
```

### Users (Admin)
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
PUT    /api/users/:id/toggle-active
```

### Patients
```
GET    /api/patients          [admin, doctor]
GET    /api/patients/me       [patient]
GET    /api/patients/:id      [admin, doctor, patient-self]
PUT    /api/patients/me       [patient]
PUT    /api/patients/:id      [admin]
DELETE /api/patients/:id      [admin]
```

### Doctors
```
GET    /api/doctors           [all auth]
GET    /api/doctors/me        [doctor]
GET    /api/doctors/patients  [doctor]
GET    /api/doctors/:id       [all auth]
POST   /api/doctors           [admin]
PUT    /api/doctors/me        [doctor]
PUT    /api/doctors/:id       [admin]
DELETE /api/doctors/:id       [admin]
```

### Appointments
```
GET    /api/appointments       [admin, doctor]
GET    /api/appointments/me    [patient]
GET    /api/appointments/stats [admin, doctor]
GET    /api/appointments/:id   [admin, doctor, patient-self]
POST   /api/appointments       [patient]
PUT    /api/appointments/:id   [admin, doctor]
PUT    /api/appointments/:id/cancel  [all – ownership enforced]
DELETE /api/appointments/:id   [admin]
```

### Medical Records
```
GET    /api/records            [admin, doctor]
GET    /api/records/me         [patient]
GET    /api/records/:id        [admin, doctor, patient-self]
POST   /api/records            [admin, doctor]
PUT    /api/records/:id        [admin, doctor-owner]
DELETE /api/records/:id        [admin]
```

### Services
```
GET    /api/services              [public]
GET    /api/services/categories   [public]
GET    /api/services/:id          [public]
POST   /api/services              [admin]
PUT    /api/services/:id          [admin]
DELETE /api/services/:id          [admin – soft]
DELETE /api/services/:id/permanent [admin – hard]
```

### Images
```
GET    /api/images              [admin, doctor]
GET    /api/images/me           [patient]
GET    /api/images/:id          [admin, doctor, patient-self]
POST   /api/images/upload       [all auth] multipart/form-data { image, type, description, patientId? }
DELETE /api/images/:id          [admin, doctor, patient-self]
POST   /api/images/:id/analyze  [admin, doctor]
PUT    /api/images/:id/notes    [admin, doctor]
```

### Dental Scores
```
GET    /api/scores               [admin, doctor]
GET    /api/scores/me            [patient]
GET    /api/scores/patient/:id   [admin, doctor]
PUT    /api/scores/patient/:id   [admin, doctor]
```

### Chat
```
POST   /api/chat/public                  [no auth]
POST   /api/chat/private                 [patient, doctor]
GET    /api/chat/history                 [all auth]
GET    /api/chat/history/:sessionId      [owner, admin]
DELETE /api/chat/history/:sessionId      [owner, admin]
```

### Prediction
```
POST   /api/predict/:imageId             [admin, doctor]
POST   /api/predict/batch                [admin, doctor]
GET    /api/predict/results/:patientId   [admin, doctor]
```

### Voice (Doctor only)
```
POST   /api/voice/transcribe   multipart/form-data { audio }
POST   /api/voice/note
POST   /api/voice/tts
```

---

## 🤖 AI Chatbot

If `OPENAI_API_KEY` is set in `.env`, the chatbot uses GPT-3.5-turbo.  
Otherwise it falls back to a built-in rule-based dental Q&A engine.

---

## 📦 Response Format

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Paginated
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 } }

// Error
{ "success": false, "message": "..." }
```