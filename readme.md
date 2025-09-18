# Securing Data Management in Healthcare System with Blockchain Technology  

## 📌 Summary  
This project leverages **Ethereum blockchain**, **Metamask**, and **Ganache** to build a secure and decentralized healthcare data management system.  

- **Patients** can securely upload medical data, view their records, manage doctor access, and track their data history.  
- **Doctors** can manage patient lists, access medical records, generate consultancy reports, and revoke access granted by patients.  

By integrating blockchain with decentralized storage, this approach ensures **data security, transparency, interoperability, and patient-centric control** over health information. Ultimately, it enhances healthcare delivery and empowers patients with ownership of their records.  

---

## 🛠️ Technology Used
- Blockchain Technology: Ethereum  
- Blockchain Development Tools: Metamask, Ganache  
- Decentralized File Storage: IPFS (InterPlanetary File System)  
- Smart Contract Development: Solidity  
- Frontend Development: ReactJS  
- Testing Frameworks: Truffle (for testing Solidity contracts)  
- Version Control: Git  
- Development Environment: Node.js  

---

## 📸 Screenshots  

### 🔹 Home Page  
![Home](./photos/home.png)  
![About](./photos/about.png)  
![Patient Registration](./photos/Patient/patientRegistration.png)  
![Doctor Registration](./photos/Doctor/doctorRegistration.png)  
![Login](./photos/login.png)  

---

### 🔹 Patient Side  
![Patient Dashboard](./photos/Patient/patientDashBoard.png)  
![Profile](./photos/Patient/Profile.png)  
![Grant Permission](./photos/Patient/grantPermission.png)  
![Upload Records](./photos/Patient/uploadRecords.png) 
![View Records](./photos/Patient/ViewRecords.png)  
![View Appointments](./photos/Patient/ViewAppointments.png)  
![ConsultationHistory](./photos/Patient/viewPrescription.png)  

---

### 🔹 Doctor Side  
![Doctor Dashboard](./photos/Doctor/doctorDashBoard.png)  
![Profile](./photos/Doctor/profile.png)  
![Patient List](./photos/Doctor/patientList.png)  
![Patient Profile](./photos/Doctor/patientProfile.png)  
![Patient Records](./photos/Doctor/patientRecords.png)  
![Appointments](./photos/Doctor/Appointments.png)  
![Consultancy](./photos/Doctor/consultancy.png)  
![Past Consultations](./photos/Doctor/pastConsultations.png)  
![Notifications](./photos/Doctor/notifications.png)  

---

### 🔹 Admin Side  
![Admin Dashboard](./photos/Admin/adminDashBoard.png)  

---


## ⚡ Requirements & Setup

1. Install Node.js  
2. Install Ganache  
3. Download IPFS (Kubo)  
4. Add Metamask Extension in Browser  
5. Open CMD/Terminal in the project directory and run `npm install`  
6. Install Truffle globally using `npm install -g truffle`  
7. Start Ganache → Create New Workspace → Add Project → Select `truffle-config.js` → Save Workspace  
8. Compile & migrate contracts with `truffle compile` and `truffle migrate`  
9. Run the project with `npm start`  

✅ Now your project will be running successfully!
