import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const DoctorDashBoardPage = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [doctorContract, setDoctorContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [error, setError] = useState(null);
  const [patientCount, setPatientCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const viewPatientList = () => navigate(`/doctor/${hhNumber}/patientlist`);
  const viewDoctorProfile = () => navigate(`/doctor/${hhNumber}/viewdoctorprofile`);
  const viewCalendar = () => navigate(`/doctor/${hhNumber}/schedule`);
  const viewNotifications = () => navigate(`/doctor/${hhNumber}/notifications`);

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setError("Please install MetaMask extension");
        setIsLoading(false);
        return;
      }

      try {
        const web3Instance = new Web3(window.ethereum);
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

        // Fetch doctor details
        const details = await doctorContractInstance.methods
          .getDoctorDetails(hhNumber)
          .call();

        // Fetch patient statistics
        const patients = await doctorContractInstance.methods
          .getPatientList(hhNumber)
          .call();

        setDoctorContract(doctorContractInstance);
        setPatientContract(patientContractInstance);
        setDoctorDetails({
          name: details[1],
          hospital: details[2],
          specialization: details[6],
          designation: details[8]
        });
        setPatientCount(patients.length);
        setRecentPatients(patients.slice(-3).reverse());
        
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to load dashboard data");
      }
      setIsLoading(false);
    };

    init();
  }, [hhNumber]);

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
                <h3 className="text-sm font-medium text-green-600">Recent Activity</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {recentPatients.length} New
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Appointments</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">0 Upcoming</p>
              </div>
            </div>

            {/* Recent Patients */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Recent Patients
              </h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient, index) => (
                    <div key={index} className="border-b last:border-0 px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{patient.patientName}</p>
                          <p className="text-sm text-gray-600">{patient.patientNumber}</p>
                        </div>
                        <button 
                          className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                          onClick={() => navigate(`/doctor/view-record/${patient.patientNumber}`)}
                        >
                          View Records
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 px-6 py-4">No recent patients found</p>
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
                onClick={viewCalendar}
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