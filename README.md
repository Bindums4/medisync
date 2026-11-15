# MediSync – Smart Healthcare Platform (MERN + React Native)

MediSync connects patients and doctors end to end: find a doctor, book a slot, chat during the
consultation, receive a digital prescription, track vitals, get medicine reminders and check symptoms
with an AI assistant. Admins verify doctors and monitor the platform.
One Node/Express API powers a React web app and a React Native (Expo) mobile app.

## Three roles
| Role | What they can do |
|------|------------------|
| **Patient** | Search and filter doctors, book real time slots, cancel, live consult chat, view prescriptions, review doctors, log vitals with charts, medicine reminders with daily checklist, AI symptom checker, notifications |
| **Doctor** | Register (needs admin approval), set weekly availability and slot length, confirm or decline requests, chat with patients, complete consultations with notes and prescriptions, earnings and trends dashboard |
| **Admin** | Approve or suspend doctors, platform analytics (appointments, demand by specialty, revenue), manage users and view all appointments |

## Highlights
- **Double-booking is impossible:** a partial unique index on (doctor, date, time) for live appointments, plus server-side slot validation
- **Realtime (Socket.io):** appointment status, notifications and consult chat update instantly on web and mobile
- **AI symptom checker:** uses Claude when `ANTHROPIC_API_KEY` is set, with a built-in rule-based fallback and emergency detection
- **Digital prescriptions** with print support, doctor ratings computed from verified post-visit reviews
- **Beautiful UI:** custom design system, responsive layout, animated landing page, charts (Recharts)
- Role-based access control on every route, input validation, JWT auth

## Run it
```bash
# 1. API
cd server && cp .env.example .env          # set MONGO_URI and JWT_SECRET
npm install && npm run seed && npm run dev          # http://localhost:5000

# 2. Web
cd web && npm install && npm run dev                # http://localhost:5173

# 3. Mobile
cd mobile && npm install
# edit src/config.js: API_URL = http://<your PC LAN IP>:5000
npx expo start                                      # scan QR with Expo Go
```
Seeded demo accounts:
- Patient: patient@medisync.dev / Patient@123
- Doctor: ananya@medisync.dev / Doctor@123 (also karan, sneha, rahul, priya, arjun, meera)
- Pending doctor (to demo approvals): vikram@medisync.dev / Doctor@123
- Admin: admin@medisync.dev / Admin@123

The mobile app supports patients and doctors. Admin tools are on the web.

## API overview
| Area | Endpoints |
|------|-----------|
| Auth | POST /api/auth/register, /login · GET/PUT /api/auth/me |
| Doctors | GET /api/doctors (q, specialty, city, sort) · /specialties · /:id · /:id/slots?date= · GET /me/stats · PUT /me/profile · PUT /me/availability |
| Appointments | POST / · GET /mine · GET /:id · PUT /:id/status · PUT /:id/complete · POST /:id/review |
| Chat | GET /api/messages/:appointmentId · socket events `appt:join`, `chat:send`, `chat:message` |
| Health | /api/vitals (GET, POST, DELETE) · /api/reminders (GET, POST, PUT /:id/take, DELETE) |
| AI | POST /api/ai/symptoms |
| Notifications | GET /api/notifications · PUT /read-all · socket `notification` |
| Admin | GET /api/admin/stats, /doctors, /users, /appointments · PUT /doctors/:id/approve |

## 5-minute demo script
1. **Landing page:** show the design, search "Cardiology".
2. **Patient (web):** open Dr. Ananya Rao, pick a date and slot, book. Show the dashboard charts and medicine checklist.
3. **Doctor (second browser):** log in as ananya, see the instant notification, confirm the request.
4. **Chat:** send messages between both browsers, then show the same on the phone.
5. **Complete the consultation:** doctor adds notes and a prescription, patient sees it instantly and leaves a review.
6. **Symptom checker:** type "chest pain and sweating" and show the urgent warning plus recommended doctors.
7. **Admin:** approve the pending doctor (Dr. Vikram Shah) and show the analytics dashboard.

## Next steps to go beyond a prototype
- Payments (Stripe or Razorpay) before confirmation, video calls (WebRTC or Daily.co), push notifications (Expo Notifications)
- Deploy: MongoDB Atlas, API on Render or Railway, web on Vercel, mobile via `eas build`
