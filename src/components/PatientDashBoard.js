import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import ConsultationRecords from "../build/contracts/ConsultationRecords.json";
import AppointmentManagement from "../build/contracts/AppointmentManagement.json";

const PatientDashBoard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();

  const viewRecord = () => navigate(`/patient/${hhNumber}/viewrecords`);
  const viewProfile = () => navigate(`/patient/${hhNumber}/viewprofile`);
  const uploadRecords = () => navigate(`/patient/${hhNumber}/uploadrecords`);
  const grantPermission = () => navigate(`/patient/${hhNumber}/grantpermission`);
  const viewPrescriptions = () => navigate(`/patient/${hhNumber}/prescriptions`);
  const viewAppointments = () => navigate(`/patient/${hhNumber}/appointments`);

  const [patientDetails, setPatientDetails] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setError("Please install MetaMask extension");
          return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        
        // Load patient details
        const patientNetwork = PatientRegistration.networks[networkId];
        if (!patientNetwork) {
          setError("Patient contract not deployed");
          return;
        }
        
        const patientContract = new web3.eth.Contract(
          PatientRegistration.abi,
          patientNetwork.address
        );
        
        const patientResult = await patientContract.methods
          .getPatientDetails(hhNumber)
          .call();
        setPatientDetails(patientResult);
        
        // Load consultation records
        const consultationNetwork = ConsultationRecords.networks[networkId];
        if (!consultationNetwork) {
          setError("Consultation contract not deployed");
          return;
        }
        
        const consultationContract = new web3.eth.Contract(
          ConsultationRecords.abi,
          consultationNetwork.address
        );
        
        const consultationResult = await consultationContract.methods
          .getPatientConsultations(hhNumber)
          .call();
        
        setConsultations(consultationResult);

        // Load appointment records
        const appointmentNetwork = AppointmentManagement.networks[networkId];
        if (!appointmentNetwork) {
          setError("Appointment contract not deployed");
          return;
        }

        const appointmentContract = new web3.eth.Contract(
          AppointmentManagement.abi,
          appointmentNetwork.address
        );

        const appointmentResult = await appointmentContract.methods
          .getPatientAppointments(hhNumber)
          .call();

        // Filter only upcoming appointments
        const currentTime = Math.floor(Date.now() / 1000);
        const upcomingAppointments = appointmentResult.filter(
          appt => appt.date >= currentTime && appt.status === "Scheduled"
        );

        setAppointments(upcomingAppointments);
      } catch (err) {
        setError("Error retrieving data: " + err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [hhNumber]);

  const cancelAppointment = async (appointmentId) => {
    try {
      setError(null);
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      
      const appointmentNetwork = AppointmentManagement.networks[networkId];
      const appointmentContract = new web3.eth.Contract(
        AppointmentManagement.abi,
        appointmentNetwork.address
      );
      
      await appointmentContract.methods
        .cancelAppointment(appointmentId)
        .send({ from: accounts[0], gas: 300000 });
      
      // Refresh appointments
      const updatedAppointments = await appointmentContract.methods
        .getPatientAppointments(hhNumber)
        .call();
      
      const currentTime = Math.floor(Date.now() / 1000);
      const upcomingAppointments = updatedAppointments.filter(
        appt => appt.date >= currentTime && appt.status === "Scheduled"
      );
      
      setAppointments(upcomingAppointments);
      
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError("Failed to cancel appointment: " + error.message);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Format time slot to readable time
  const formatTime = (timeSlot) => {
    return `${timeSlot}:00`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Medical Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Patient Dashboard</p>
        </div>
        
        {patientDetails && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-800">{patientDetails.name}</p>
                <p className="text-sm text-gray-600">HH: {hhNumber}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center p-3 rounded-lg ${activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
                Dashboard
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={viewProfile}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Profile
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={viewRecord}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Medical Records
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={uploadRecords}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                Upload Records
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={grantPermission}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Grant Permission
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={viewAppointments}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Appointments
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={viewPrescriptions}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Prescriptions
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <NavBarLogout />
        
        <div className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">Patient Dashboard</h1>
            {patientDetails && (
              <p className="text-gray-600 mt-1">
                Welcome back, <span className="font-medium text-blue-600">{patientDetails.name}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={viewProfile}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
            >
              <div className="bg-blue-100 p-3 rounded-lg mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800">Profile</span>
              <span className="text-xs text-gray-500 mt-1">View your details</span>
            </button>
            
            <button 
              onClick={viewRecord}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
            >
              <div className="bg-blue-100 p-3 rounded-lg mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800">Medical Records</span>
              <span className="text-xs text-gray-500 mt-1">View your records</span>
            </button>
            
            <button 
              onClick={viewAppointments}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
            >
              <div className="bg-blue-100 p-3 rounded-lg mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-800">Appointments</span>
              <span className="text-xs text-gray-500 mt-1">Manage appointments</span>
            </button>
          </div>

          {/* Upcoming Appointments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
              <button 
                onClick={viewAppointments}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            
            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className="mt-4 text-gray-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appt, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Dr. {appt.doctorNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(appt.date)}</div>
                          <div className="text-sm text-gray-500">{formatTime(appt.timeSlot)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appt.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button 
                            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                            onClick={() => cancelAppointment(appt.id)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Consultations Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Recent Consultations</h2>
              <button 
                onClick={viewPrescriptions}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
            
            {consultations.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="mt-4 text-gray-500">No consultation records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consultations.slice(0, 3).map((consult, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{consult.diagnosis}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(consult.timestamp)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {consult.prescription.substring(0, 100)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {consult.doctorAddress.slice(0, 8)}...{consult.doctorAddress.slice(-6)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;