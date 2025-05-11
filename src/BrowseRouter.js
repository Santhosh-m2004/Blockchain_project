import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Web3 from "web3";

import PatientRegistry from "./components/PatientRegistration";
import LoginPage from "./components/LoginPage";
import PatientDashBoard from "./components/PatientDashBoard";
import DoctorDashBoard from "./components/DoctorDashBoard";
import DiagnosticDashBoard from "./components/DiagnosticDashBoard";
import RegisterPage from "./components/RegisterPage";
import DoctorLogin from "./components/DoctorLogin";
import DiagnosticLogin from "./components/DiagnosticLogin";
import PatientLogin from "./components/PatientLogin";
import DiagnosticForm from "./components/DiagnosticForm";
import DoctorRegistry from "./components/DoctorRegistration";
import DiagnosticRegistry from "./components/DiagnosticsRegistration";
import Footer from "./components/Footer";
import LandingPage_1 from "./components/LandingPage_1";
import ViewPatientRecords from "./components/ViewPatientRecords";
import ViewProfile from "./components/ViewProfile";
import ViewDoctorProfile from "./components/ViewDoctorProfile";
import ViewDiagnosticProfile from "./components/ViewDiagnosticProfile";
import AboutUs from "./components/AboutPage";
import Services from "./components/Services";

import GrantPermission from "./components/GrantPermission";
import UploadRecords from "./components/UploadRecords";

import PatientList from "./components/PatientList";
import PatientProfile from "./components/PatientProfile";
import ConsultancyForm from "./components/ConsultancyForm";

const BrowseRouter = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          setWeb3(web3Instance);

          const fetchedAccounts = await web3Instance.eth.getAccounts();
          setAccounts(fetchedAccounts);
        } catch (error) {
          console.error("User denied access to accounts.");
        }
      } else {
        console.log("Please install MetaMask extension");
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
        <Route path="/AboutPage" element={<AboutUs />} />
        <Route path="/Services" element={<Services />} />
        <Route path="/patient_registration" element={<PatientRegistry />} />
        <Route path="/doctor_registration" element={<DoctorRegistry />} />
        <Route path="/diagnostic_registration" element={<DiagnosticRegistry />} />
        <Route path="/patient_login" element={<PatientLogin />} />
        <Route path="/doctor_login" element={<DoctorLogin />} />
        <Route path="/diagnostic_login" element={<DiagnosticLogin />} />
        <Route path="/patient/:hhNumber" element={<PatientDashBoard />} />
        <Route path="/doctor/:hhNumber" element={<DoctorDashBoard />} />
        <Route path="/diagnostic/:hhNumber" element={<DiagnosticDashBoard />} />
        <Route path="/patient/:hhNumber/viewprofile" element={<ViewProfile />} />
        <Route path="/doctor/:hhNumber/viewdoctorprofile" element={<ViewDoctorProfile />} />
        <Route path="/diagnostic/:hhNumber/viewdiagnosticprofile" element={<ViewDiagnosticProfile />} />
        <Route path="/patient/:hhNumber/viewrecords" element={<ViewPatientRecords />} />
        <Route path="/diagnostic/:hhNumber/diagnosticform" element={<DiagnosticForm />} />
        <Route path="/patient/:hhNumber/grantpermission" element={<GrantPermission />} />
        <Route path="/patient/:hhNumber/uploadrecords" element={<UploadRecords />} />
        <Route path="/doctor/:hhNumber/patientlist" element={<PatientList />} />
        <Route path="/doctor/view-profile/:hhNumber" element={<PatientProfile />} />
        <Route path="/doctor/consultancy/:hhNumber" element={<ConsultancyForm />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default BrowseRouter;
