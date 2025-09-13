import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import AppointmentManagement from "../build/contracts/AppointmentManagement.json";

const PatientAppointments = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

        setAppointments(appointmentResult);
        setFilteredAppointments(appointmentResult);
      } catch (err) {
        setError("Error retrieving appointments: " + err.message);
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
      
      setAppointments(updatedAppointments);
      applyFilter(filter, updatedAppointments);
      
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError("Failed to cancel appointment: " + error.message);
    }
  };

  const applyFilter = (filterType, appointmentsList = appointments) => {
    const currentTime = Math.floor(Date.now() / 1000);
    
    switch (filterType) {
      case "upcoming":
        setFilteredAppointments(
          appointmentsList.filter(
            appt => appt.date >= currentTime && appt.status === "Scheduled"
          )
        );
        break;
      case "past":
        setFilteredAppointments(
          appointmentsList.filter(
            appt => appt.date < currentTime || appt.status !== "Scheduled"
          )
        );
        break;
      case "cancelled":
        setFilteredAppointments(
          appointmentsList.filter(appt => appt.status === "Cancelled")
        );
        break;
      case "completed":
        setFilteredAppointments(
          appointmentsList.filter(appt => appt.status === "Completed")
        );
        break;
      default:
        setFilteredAppointments(appointmentsList);
    }
    setFilter(filterType);
  };

  // Format timestamp to readable date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  // Format time slot to readable time
  const formatTime = (timeSlot) => {
    return `${timeSlot}:00`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "No-Show":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">My Appointments</h2>
              <button 
                onClick={() => navigate(`/patient/${hhNumber}`)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
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

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-6">
              <button 
                onClick={() => applyFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "all" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                All Appointments
              </button>
              <button 
                onClick={() => applyFilter("upcoming")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "upcoming" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => applyFilter("past")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "past" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Past
              </button>
              <button 
                onClick={() => applyFilter("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "completed" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Completed
              </button>
              <button 
                onClick={() => applyFilter("cancelled")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === "cancelled" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                Cancelled
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No appointments found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="p-3 font-medium">Doctor ID</th>
                      <th className="p-3 font-medium">Date & Time</th>
                      <th className="p-3 font-medium">Reason</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appt, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">Dr. {appt.doctorNumber}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{formatDateTime(appt.date)}</div>
                          <div className="text-sm text-gray-500">Time: {formatTime(appt.timeSlot)}</div>
                        </td>
                        <td className="p-3">{appt.reason}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {appt.status === "Scheduled" && (
                            <button 
                              onClick={() => cancelAppointment(appt.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200"
                            >
                              Cancel
                            </button>
                          )}
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

export default PatientAppointments;