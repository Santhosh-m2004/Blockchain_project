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
  const [debugInfo, setDebugInfo] = useState('');

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
        
        // Debug info
        setDebugInfo(`
          Network ID: ${networkId}
          Account: ${accounts[0]}
          Doctor Contract: ${doctorDeployedNetwork.address}
          Patient Contract: ${patientDeployedNetwork.address}
          Appointment Contract: ${appointmentDeployedNetwork.address}
          Patients: ${patientList.length}
          Appointments: ${doctorAppointments.length}
        `);
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
      
      // Debug: Log all parameters
      console.log("Appointment parameters:", {
        patientId: newAppointment.patientId,
        doctorNumber: hhNumber,
        date: dateTimestamp,
        timeSlot: hour,
        reason: newAppointment.reason
      });
      
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

  

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Appointment Management</h1>
          <button 
            onClick={() => navigate(-1)}
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

        {/* Appointment Creation Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Schedule New Appointment</h2>
          <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient
              </label>
              <select
                name="patientId"
                value={newAppointment.patientId}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Brief reason for appointment..."
                required
              ></textarea>
            </div>
            
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
              >
                Schedule Appointment
              </button>
            </div>
          </form>
        </div>
        
        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-700">Upcoming Appointments</h2>
            <div className="text-sm text-gray-500">
              {appointments.filter(a => a.status === 'Scheduled').length} scheduled appointments
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Date & Time</th>
                  <th className="p-3 font-medium">Reason</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map(appointment => (
                    <tr key={appointment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-3" />
                          <div>
                            <div className="font-medium">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">HH: {appointment.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{appointment.date}</div>
                        <div className="text-sm text-gray-500">{appointment.time}</div>
                      </td>
                      <td className="p-3">{appointment.reason}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'Scheduled' 
                            ? 'bg-blue-100 text-blue-800' 
                            : appointment.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => cancelAppointment(appointment.id)}
                            disabled={appointment.status !== 'Scheduled'}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              appointment.status !== 'Scheduled'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            Cancel
                          </button>
                          {appointment.status === 'Scheduled' && (
                            <button 
                              onClick={() => updateAppointmentStatus(appointment.id, 'Completed')}
                              className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-500">
                      No appointments scheduled yet. Schedule your first appointment above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
            <div className="text-3xl font-bold mb-2">{appointments.length}</div>
            <div className="text-lg font-medium">Total Appointments</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {appointments.filter(a => a.status === 'Scheduled').length}
            </div>
            <div className="text-lg font-medium">Upcoming Appointments</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="text-3xl font-bold mb-2">{patients.length}</div>
            <div className="text-lg font-medium">Registered Patients</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsDashboard;