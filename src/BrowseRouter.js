import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Web3 from "web3";
import PatientRegistry from "./components/PatientRegistration";
import LoginPage from "./components/LoginPage";
import PatientDashBoard from "./components/PatientDashBoard";
import DoctorDashBoard from "./components/DoctorDashBoard";
import AdminDashboardPage from "./components/AdminDashBoardPage";
import RegisterPage from "./components/RegisterPage";
import DiagnosticForm from "./components/DiagnosticForm";
import DoctorRegistry from "./components/DoctorRegistration";
import Footer from "./components/Footer";
import LandingPage_1 from "./components/LandingPage_1";
import ViewPatientRecords from "./components/ViewPatientRecords";
import ViewProfile from "./components/ViewProfile";
import ViewDoctorProfile from "./components/ViewDoctorProfile";
import AboutUs from "./components/AboutPage";
import Services from "./components/Services";
import GrantPermission from "./components/GrantPermission";
import UploadRecords from "./components/UploadRecords";
import PatientList from "./components/PatientList";
import PatientProfile from "./components/PatientProfile";
import ConsultancyForm from "./components/DoctorConsultationForm";
import AllConsultations from "./components/AllConsultations";
import DoctorPatientConsultations from "./components/DoctorPatientConsultations";


const BrowseRouter = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          setWeb3(web3Instance);
          const fetchedAccounts = await web3Instance.eth.getAccounts();
          setAccounts(fetchedAccounts);
        } catch (error) {
          console.error("User denied account access");
        }
      } else {
        console.log("Please install MetaMask");
      }
    };
    init();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage_1 />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/AboutPage" element={<AboutUs />} />
        <Route path="/Services" element={<Services />} />
        
        {/* Registration Routes */}
        <Route path="/patient_registration" element={<PatientRegistry />} />
        <Route path="/doctor_registration" element={<DoctorRegistry />} />
        
        {/* Dashboard Routes */}
        <Route path="/patient/:hhNumber" element={<PatientDashBoard />} />
        <Route path="/doctor/:hhNumber" element={<DoctorDashBoard />} />
        
        {/* Profile & Records Routes */}
        <Route path="/patient/:hhNumber/viewprofile" element={<ViewProfile />} />
        <Route path="/doctor/:hhNumber/viewdoctorprofile" element={<ViewDoctorProfile />} />
        <Route path="/patient/:hhNumber/viewrecords" element={<ViewPatientRecords />} />
        <Route path="/doctor/view-record/:hhNumber" element={<ViewPatientRecords />} />       
        
        {/* Permission & Records Management */}
        <Route path="/patient/:hhNumber/grantpermission" element={<GrantPermission />} />
        <Route path="/patient/:hhNumber/uploadrecords" element={<UploadRecords />} />
        <Route path="/doctor/:hhNumber/patientlist" element={<PatientList />} />
        
        {/* Consultation & Patient Viewing */}
        <Route path="/doctor/view-profile/:hhNumber" element={<PatientProfile />} />
        <Route path="/doctor/consultancy/:hhNumber" element={<ConsultancyForm />} />
        <Route path="/patient/:hhNumber/prescriptions" element={<AllConsultations />} />
        <Route path="/doctor/past-consultations/:patientHhNumber/:doctorHhNumber" element={<DoctorPatientConsultations />} 
/>
        
        {/* Diagnostic Routes (keep if needed) */}
        <Route path="/diagnostic/:hhNumber" element={<DiagnosticForm />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default BrowseRouter;