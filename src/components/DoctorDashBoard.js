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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Header Section */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Doctor Dashboard
              </h1>
              {doctorDetails && (
                <p className="text-lg text-gray-600">
                  {doctorDetails.designation} - {doctorDetails.specialization}
                  <span className="block text-sm text-gray-500 mt-1">
                    {doctorDetails.hospital}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-600">Total Patients</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{patientCount}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Completed Appointments</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {recentCompletedAppointments.length}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Upcoming Appointments</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">{upcomingAppointmentCount}</p>
              </div>
            </div>

            {/* Recent Completed Appointments */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Recently Completed Appointments
              </h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {recentCompletedAppointments.length > 0 ? (
                  recentCompletedAppointments.map((appointment, index) => (
                    <div key={index} className="border-b last:border-0 px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{appointment.patientName}</p>
                          <p className="text-sm text-gray-600">HH: {appointment.patientNumber}</p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-sm text-gray-600">Completed on: {appointment.updatedAt}</p>
                          <p className="text-sm text-gray-600">Originally scheduled for: {appointment.appointmentDate} at {appointment.appointmentTime}</p>
                        </div>
                        <div className="ml-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 px-6 py-4">No recently completed appointments</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={viewDoctorProfile}
                className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex flex-col items-center"
              >
                <span className="text-lg font-medium">Profile</span>
                <span className="text-sm">Manage your details</span>
              </button>

              <button
                onClick={viewPatientList}
                className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center"
              >
                <span className="text-lg font-medium">Patients</span>
                <span className="text-sm">View patient list</span>
              </button>

              <button
                onClick={viewAppointments}
                className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center"
              >
                <span className="text-lg font-medium">Schedule</span>
                <span className="text-sm">Manage appointments</span>
              </button>

              <button
                onClick={viewNotifications}
                className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex flex-col items-center"
              >
                <span className="text-lg font-medium">Alerts</span>
                <span className="text-sm">View notifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashBoardPage;