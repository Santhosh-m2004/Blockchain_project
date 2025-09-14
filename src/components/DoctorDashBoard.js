import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { Link } from 'react-router-dom';
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import AppointmentManagement from "../build/contracts/AppointmentManagement.json";

const DoctorDashBoardPage = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [doctorContract, setDoctorContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [appointmentContract, setAppointmentContract] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [error, setError] = useState(null);
  const [patientCount, setPatientCount] = useState(0);
  const [recentCompletedAppointments, setRecentCompletedAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingAppointmentCount, setUpcomingAppointmentCount] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");

  const viewPatientList = () => navigate(`/doctor/${hhNumber}/patientlist`);
  const viewDoctorProfile = () => navigate(`/doctor/${hhNumber}/viewdoctorprofile`);
  const viewAppointments = () => navigate(`/doctor/${hhNumber}/appointments`);
  const viewNotifications = () => navigate(`/doctor/${hhNumber}/notifications`);

  // Function to load doctor data
  const loadDoctorData = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask extension");
      setIsLoading(false);
      return;
    }

    try {
      const web3Instance = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const networkId = await web3Instance.eth.net.getId();

      // Initialize contracts
      const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
      const doctorContractInstance = new web3Instance.eth.Contract(
        DoctorRegistration.abi,
        doctorDeployedNetwork.address
      );

      const patientDeployedNetwork = PatientRegistration.networks[networkId];
      const patientContractInstance = new web3Instance.eth.Contract(
        PatientRegistration.abi,
        patientDeployedNetwork.address
      );

      const appointmentDeployedNetwork = AppointmentManagement.networks[networkId];
      const appointmentContractInstance = new web3Instance.eth.Contract(
        AppointmentManagement.abi,
        appointmentDeployedNetwork.address
      );

      // Fetch doctor details
      const details = await doctorContractInstance.methods
        .getDoctorDetails(hhNumber)
        .call();

      // Fetch patient statistics
      const patients = await doctorContractInstance.methods
        .getPatientList(hhNumber)
        .call();

      // Fetch appointments
      const appointments = await appointmentContractInstance.methods
        .getDoctorAppointments(hhNumber)
        .call();

      // Get current time for filtering upcoming appointments
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Filter upcoming appointments
      const upcomingAppointments = appointments.filter(
        appt => appt.status === "Scheduled" && parseInt(appt.date) >= currentTime
      );

      // Filter completed appointments and get the two most recent ones
      const completedAppointments = appointments.filter(
        appt => appt.status === "Completed"
      );
      
      // Sort by date (most recent first)
      const sortedCompletedAppointments = [...completedAppointments].sort((a, b) => 
        parseInt(b.date) - parseInt(a.date)
      );
      
      // Get the two most recent completed appointments
      const recentCompletedAppointmentsData = sortedCompletedAppointments.slice(0, 2);
      
      // Get patient details for recent completed appointments
      const recentCompletedAppointmentsWithDetails = await Promise.all(
        recentCompletedAppointmentsData.map(async (appt) => {
          try {
            const patientDetails = await patientContractInstance.methods
              .getPatientDetails(appt.patientNumber)
              .call();
            
            return {
              patientName: patientDetails.name,
              patientNumber: appt.patientNumber,
              appointmentDate: new Date(parseInt(appt.date) * 1000).toLocaleDateString(),
              appointmentTime: `${appt.timeSlot}:00`,
              status: appt.status,
              updatedAt: new Date(parseInt(appt.updatedAt) * 1000).toLocaleDateString()
            };
          } catch (error) {
            console.error("Error fetching patient details:", error);
            return {
              patientName: "Unknown",
              patientNumber: appt.patientNumber,
              appointmentDate: new Date(parseInt(appt.date) * 1000).toLocaleDateString(),
              appointmentTime: `${appt.timeSlot}:00`,
              status: appt.status,
              updatedAt: new Date(parseInt(appt.updatedAt) * 1000).toLocaleDateString()
            };
          }
        })
      );

      setDoctorContract(doctorContractInstance);
      setPatientContract(patientContractInstance);
      setAppointmentContract(appointmentContractInstance);
      setDoctorDetails({
        name: details[1],
        hospital: details[2],
        specialization: details[6],
        designation: details[8]
      });
      setPatientCount(patients.length);
      setRecentCompletedAppointments(recentCompletedAppointmentsWithDetails);
      setUpcomingAppointmentCount(upcomingAppointments.length);
      
    } catch (error) {
      console.error("Initialization error:", error);
      setError("Failed to load dashboard data");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDoctorData();
  }, [hhNumber]);

  // Set up an interval to refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadDoctorData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [appointmentContract, patientContract, hhNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Medical Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Doctor Dashboard</p>
        </div>
        
        {doctorDetails && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-800">{doctorDetails.name}</p>
                <p className="text-sm text-gray-600">{doctorDetails.specialization}</p>
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
                onClick={viewDoctorProfile}
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
                onClick={viewPatientList}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Patients
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
                onClick={viewNotifications}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
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
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              Doctor Dashboard
            </h1>
            {doctorDetails && (
              <p className="text-gray-600">
                Welcome back, {doctorDetails.name} - {doctorDetails.designation} at {doctorDetails.hospital}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Patients</h3>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{patientCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Completed Appointments</h3>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">
                    {recentCompletedAppointments.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Upcoming Appointments</h3>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{upcomingAppointmentCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Completed Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Recently Completed Appointments
              </h2>
              <button 
                onClick={viewAppointments}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            
            <div className="overflow-hidden">
              {recentCompletedAppointments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentCompletedAppointments.map((appointment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                              <div className="text-sm text-gray-500">HH: {appointment.patientNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Completed on: {appointment.updatedAt}</div>
                          <div className="text-sm text-gray-500">Scheduled for: {appointment.appointmentDate} at {appointment.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by scheduling new appointments.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={viewDoctorProfile}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
              >
                <div className="bg-blue-100 p-3 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Profile</span>
                <span className="text-xs text-gray-500 mt-1">Manage your details</span>
              </button>

              <button
                onClick={viewPatientList}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
              >
                <div className="bg-blue-100 p-3 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Patients</span>
                <span className="text-xs text-gray-500 mt-1">View patient list</span>
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
                <span className="text-sm font-medium text-gray-800">Schedule</span>
                <span className="text-xs text-gray-500 mt-1">Manage appointments</span>
              </button>

              <button
                onClick={viewNotifications}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center"
              >
                <div className="bg-blue-100 p-3 rounded-lg mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Alerts</span>
                <span className="text-xs text-gray-500 mt-1">View notifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashBoardPage;