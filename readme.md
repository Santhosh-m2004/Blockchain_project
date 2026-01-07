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

### 🔧 Requirements

- **Node.js**  
  Required to run the React frontend and install project dependencies.

- **Ganache**  
  Provides a local Ethereum blockchain for deploying and testing smart contracts.

- **IPFS (Kubo)**  
  Used to store and retrieve files in a decentralized way.

- **MetaMask**  
  Browser wallet used to connect the application to Ethereum.

- **Truffle**  
  Framework for compiling, deploying, and managing smart contracts.

---

### 🚀 Setup (Step-by-Step)

1. **Install Node.js**  
   Download and install Node.js (v16 or above).  
   Verify installation:
   node -v
   npm -v

2. **Install Ganache**  
   Open Ganache and create a new workspace.

3. **Download IPFS (Kubo)**  
   Install IPFS and initialize it using:
   ipfs init  
   ipfs daemon

4. **Add MetaMask Extension**  
   Install MetaMask in your browser and create a wallet.

5. **Open Project Folder**  
   Open CMD / Terminal inside the project directory.

6. **Install Project Dependencies**
   npm install

7. **Install Truffle Globally**
   npm install -g truffle

8. **Configure Ganache with Truffle**
   - Open Ganache  
   - Create New Workspace  
   - Add Project  
   - Select `truffle-config.js`  
   - Save Workspace

9. **Compile Smart Contracts**
   truffle compile

10. **Deploy Smart Contracts**
    truffle migrate

11. **Connect MetaMask to Ganache**
    - Add a custom network  
    - RPC URL: http://127.0.0.1:7545  
    - Chain ID: 1337  
    - Import an account using Ganache private key

12. **Start the Application**
    npm start

✅ The application will now run successfully on localhost.

