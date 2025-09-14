import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import DoctorRegistration from '../build/contracts/DoctorRegistration.json';
import AppointmentManagement from '../build/contracts/AppointmentManagement.json';
import PatientRegistration from '../build/contracts/PatientRegistration.json';

const AppointmentsDashboard = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: '',
    time: '',
    reason: ''
  });
  const [patients, setPatients] = useState([]);
  const [appointmentContract, setAppointmentContract] = useState(null);
  const [doctorContract, setDoctorContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('scheduled');

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask");
        }
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        
        const networkId = await web3Instance.eth.net.getId();
        
        // Load doctor registration contract
        const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
        if (!doctorDeployedNetwork) {
          throw new Error("DoctorRegistration contract not deployed on current network");
        }
        const doctorContractInstance = new web3Instance.eth.Contract(
          DoctorRegistration.abi,
          doctorDeployedNetwork.address
        );
        setDoctorContract(doctorContractInstance);
        
        // Load patient registration contract
        const patientDeployedNetwork = PatientRegistration.networks[networkId];
        if (!patientDeployedNetwork) {
          throw new Error("PatientRegistration contract not deployed on current network");
        }
        const patientContractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          patientDeployedNetwork.address
        );
        setPatientContract(patientContractInstance);
        
        // Load appointment management contract
        const appointmentDeployedNetwork = AppointmentManagement.networks[networkId];
        if (!appointmentDeployedNetwork) {
          throw new Error("AppointmentManagement contract not deployed on current network");
        }
        const appointmentContractInstance = new web3Instance.eth.Contract(
          AppointmentManagement.abi,
          appointmentDeployedNetwork.address
        );
        setAppointmentContract(appointmentContractInstance);
        
        // Get doctor's patient list
        const patientList = await doctorContractInstance.methods
          .getPatientList(hhNumber)
          .call();
          
        setPatients(patientList.map(p => ({
          number: p.patient_number,
          name: p.patient_name
        })));

        // Load existing appointments
        const doctorAppointments = await appointmentContractInstance.methods
          .getDoctorAppointments(hhNumber)
          .call();
        
        // Format appointments for display
        const formattedAppointments = doctorAppointments.map(appt => ({
          id: appt.id.toString(),
          patientId: appt.patientNumber,
          patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
          date: new Date(parseInt(appt.date) * 1000).toISOString().split('T')[0],
          time: `${appt.timeSlot}:00`,
          reason: appt.reason,
          status: appt.status
        }));

        setAppointments(formattedAppointments);
        setLoading(false);
        
      } catch (err) {
        setError(err.message);
        console.error("Error initializing contracts:", err);
        setLoading(false);
      }
    };

    initContracts();
  }, [hhNumber]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Validate inputs
      if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time || !newAppointment.reason) {
        setError("Please fill in all fields");
        return;
      }
      
      // Convert date to timestamp (ensure it's in UTC)
      const dateObj = new Date(newAppointment.date);
      const dateTimestamp = Math.floor(dateObj.getTime() / 1000);
      
      // Extract hour from time (handle both HH:MM and HH:MM:SS formats)
      const timeParts = newAppointment.time.split(':');
      const hour = parseInt(timeParts[0]);
      
      // Validate inputs
      if (dateTimestamp <= Math.floor(Date.now() / 1000)) {
        setError("Appointment date must be in the future");
        return;
      }
      
      if (hour < 0 || hour > 23) {
        setError("Time must be between 00:00 and 23:00");
        return;
      }
      
      // Check if patient exists
      const isPatientRegistered = await patientContract.methods
        .isRegisteredPatient(newAppointment.patientId)
        .call();
        
      if (!isPatientRegistered) {
        setError("Patient is not registered in the system");
        return;
      }
      
      // Check if doctor has permission for this patient
      const hasPermission = await doctorContract.methods
        .isPermissionGranted(newAppointment.patientId, hhNumber)
        .call();
        
      if (!hasPermission) {
        setError("You don't have permission to schedule appointments for this patient");
        return;
      }
      
      // Check for scheduling conflicts
      try {
        const hasConflict = await appointmentContract.methods
          .hasDoctorTimeConflict(hhNumber, dateTimestamp, hour)
          .call();
          
        if (hasConflict) {
          setError("You already have an appointment scheduled at this time");
          return;
        }
      } catch (conflictError) {
        console.warn("Could not check for scheduling conflicts:", conflictError);
        // Continue anyway - this might be due to a contract issue
      }
      
      // Try to estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await appointmentContract.methods
          .createAppointment(
            newAppointment.patientId,
            hhNumber,
            dateTimestamp,
            hour,
            newAppointment.reason
          )
          .estimateGas({ from: account });
          
        console.log("Gas estimate:", gasEstimate);
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        setError(`Transaction will fail: ${estimateError.message}`);
        return;
      }
      
      // Create appointment using the new contract
      const receipt = await appointmentContract.methods
        .createAppointment(
          newAppointment.patientId,
          hhNumber,
          dateTimestamp,
          hour,
          newAppointment.reason
        )
        .send({ 
          from: account,
          gas: Math.floor(gasEstimate * 1.5) // Add 50% buffer
        });
      
      console.log("Appointment created successfully:", receipt);
      
      // Refresh appointments
      const updatedAppointments = await appointmentContract.methods
        .getDoctorAppointments(hhNumber)
        .call();
      
      // Get patient list again to ensure we have names
      const patientList = await doctorContract.methods
        .getPatientList(hhNumber)
        .call();
      
      // Format appointments for display
      const formattedAppointments = updatedAppointments.map(appt => ({
        id: appt.id.toString(),
        patientId: appt.patientNumber,
        patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
        date: new Date(parseInt(appt.date) * 1000).toISOString().split('T')[0],
        time: `${appt.timeSlot}:00`,
        reason: appt.reason,
        status: appt.status
      }));
      
      setAppointments(formattedAppointments);
      
      // Reset form
      setNewAppointment({
        patientId: '',
        date: '',
        time: '',
        reason: ''
      });
      
    } catch (error) {
      console.error("Error creating appointment:", error);
      
      // Extract error message if available
      let errorMsg = "Appointment creation failed";
      
      if (error.code) {
        errorMsg += ` (Code: ${error.code})`;
      }
      
      if (error.message) {
        // Check for specific revert reasons
        if (error.message.includes("Patient not registered")) {
          errorMsg = "Patient is not registered in the system";
        } else if (error.message.includes("Doctor not registered")) {
          errorMsg = "Doctor is not registered in the system";
        } else if (error.message.includes("No permission for this patient")) {
          errorMsg = "You don't have permission to schedule appointments for this patient";
        } else if (error.message.includes("Appointment date must be in the future")) {
          errorMsg = "Appointment date must be in the future";
        } else if (error.message.includes("Invalid time slot")) {
          errorMsg = "Time must be between 00:00 and 23:00";
        } else if (error.message.includes("Doctor has a scheduling conflict")) {
          errorMsg = "You already have an appointment scheduled at this time";
        } else if (error.message.includes("revert")) {
          // Try to extract the revert reason
          const revertMatch = error.message.match(/revert (.*)/);
          if (revertMatch && revertMatch[1]) {
            errorMsg = `Transaction reverted: ${revertMatch[1]}`;
          } else {
            errorMsg += `: ${error.message}`;
          }
        } else {
          errorMsg += `: ${error.message}`;
        }
      } else if (error.data && error.data.message) {
        errorMsg += `: ${error.data.message}`;
      }
      
      setError(errorMsg);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({ ...prev, [name]: value }));
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      setError(null);
      
      await appointmentContract.methods
        .cancelAppointment(appointmentId)
        .send({ from: account, gas: 300000 });
      
      // Refresh appointments
      const updatedAppointments = await appointmentContract.methods
        .getDoctorAppointments(hhNumber)
        .call();
      
      // Get patient list again to ensure we have names
      const patientList = await doctorContract.methods
        .getPatientList(hhNumber)
        .call();
      
      // Format appointments for display
      const formattedAppointments = updatedAppointments.map(appt => ({
        id: appt.id.toString(),
        patientId: appt.patientNumber,
        patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
        date: new Date(parseInt(appt.date) * 1000).toISOString().split('T')[0],
        time: `${appt.timeSlot}:00`,
        reason: appt.reason,
        status: appt.status
      }));
      
      setAppointments(formattedAppointments);
      
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      setError(`Cancellation failed: ${error.message}`);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setError(null);
      
      await appointmentContract.methods
        .updateAppointmentStatus(appointmentId, newStatus)
        .send({ from: account, gas: 300000 });
      
      // Refresh appointments
      const updatedAppointments = await appointmentContract.methods
        .getDoctorAppointments(hhNumber)
        .call();
      
      // Get patient list again to ensure we have names
      const patientList = await doctorContract.methods
        .getPatientList(hhNumber)
        .call();
      
      // Format appointments for display
      const formattedAppointments = updatedAppointments.map(appt => ({
        id: appt.id.toString(),
        patientId: appt.patientNumber,
        patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
        date: new Date(parseInt(appt.date) * 1000).toISOString().split('T')[0],
        time: `${appt.timeSlot}:00`,
        reason: appt.reason,
        status: appt.status
      }));
      
      setAppointments(formattedAppointments);
      
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setError(`Status update failed: ${error.message}`);
    }
  };

  // Filter appointments by status
  const scheduledAppointments = appointments.filter(appt => appt.status === 'Scheduled');
  const completedAppointments = appointments.filter(appt => appt.status === 'Completed');
  const cancelledAppointments = appointments.filter(appt => appt.status === 'Cancelled');

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Medical Portal</h1>
          <p className="text-sm text-gray-600 mt-1">Appointment Management</p>
        </div>
        
        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <button 
                onClick={() => navigate(`/doctor/${hhNumber}`)}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
                Dashboard
              </button>
            </li>
            <li className="mb-2">
              <button 
                className="w-full flex items-center p-3 rounded-lg bg-blue-50 text-blue-600"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Appointments
              </button>
            </li>
            <li className="mb-2">
              <button 
                onClick={() => navigate(`/doctor/${hhNumber}/patientlist`)}
                className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Patients
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Appointment Management</h1>
              <p className="text-gray-600 mt-1">Schedule and manage patient appointments</p>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </button>
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Scheduled Appointments</h3>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{scheduledAppointments.length}</p>
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
                    {completedAppointments.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Cancelled Appointments</h3>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{cancelledAppointments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Creation Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Schedule New Appointment</h2>
            <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>
                <select
                  name="patientId"
                  value={newAppointment.patientId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map(patient => (
                    <option key={patient.number} value={patient.number}>
                      {patient.name} (HH: {patient.number})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={newAppointment.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={newAppointment.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  name="reason"
                  value={newAppointment.reason}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Brief reason for appointment..."
                  required
                ></textarea>
              </div>
              
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-300"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
          
          {/* Appointments List with Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('scheduled')}
                  className={`mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                    activeTab === 'scheduled'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Scheduled ({scheduledAppointments.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`mr-8 py-4 px-1 text-sm font-medium border-b-2 ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Completed ({completedAppointments.length})
                </button>
                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`py-4 px-1 text-sm font-medium border-b-2 ${
                    activeTab === 'cancelled'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Cancelled ({cancelledAppointments.length})
                </button>
              </nav>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    {activeTab === 'scheduled' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTab === 'scheduled' && scheduledAppointments.length > 0 ? (
                    scheduledAppointments.map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                              <div className="text-sm text-gray-500">HH: {appointment.patientId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.date}</div>
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => cancelAppointment(appointment.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
                              className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200"
                            >
                              Complete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : activeTab === 'completed' && completedAppointments.length > 0 ? (
                    completedAppointments.map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                              <div className="text-sm text-gray-500">HH: {appointment.patientId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.date}</div>
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason}</td>
                      </tr>
                    ))
                  ) : activeTab === 'cancelled' && cancelledAppointments.length > 0 ? (
                    cancelledAppointments.map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                              <div className="text-sm text-gray-500">HH: {appointment.patientId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.date}</div>
                          <div className="text-sm text-gray-500">{appointment.time}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{appointment.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p className="mt-4">No {activeTab} appointments found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsDashboard;