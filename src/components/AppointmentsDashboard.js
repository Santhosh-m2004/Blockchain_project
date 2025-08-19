// src/components/AppointmentsDashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import DoctorRegistration from '../build/contracts/DoctorRegistration.json';
import AppointmentManagement from '../build/contracts/AppointmentManagement.json';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize contracts
  useEffect(() => {
    const initContracts = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask");
        }
        
        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        
        // Load doctor registration contract
        const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
        if (!doctorDeployedNetwork) {
          throw new Error("DoctorRegistration contract not deployed on current network");
        }
        const doctorContract = new web3.eth.Contract(
          DoctorRegistration.abi,
          doctorDeployedNetwork.address
        );
        
        // Load appointment management contract
        const appointmentDeployedNetwork = AppointmentManagement.networks[networkId];
        if (!appointmentDeployedNetwork) {
          throw new Error("AppointmentManagement contract not deployed on current network");
        }
        const appointmentContractInstance = new web3.eth.Contract(
          AppointmentManagement.abi,
          appointmentDeployedNetwork.address
        );
        
        // Get doctor's patient list
        const patientList = await doctorContract.methods
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
          date: new Date(appt.date * 1000).toISOString().split('T')[0],
          time: `${appt.timeSlot}:00`, // Convert time slot to HH:00 format
          reason: appt.reason,
          status: appt.status
        }));

        setAppointments(formattedAppointments);
        setAppointmentContract(appointmentContractInstance);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        console.error("Error initializing contracts:", err);
        setLoading(false);
      }
    };

    initContracts();
  }, [hhNumber]);

// In your handleCreateAppointment function
    const handleCreateAppointment = async (e) => {
      e.preventDefault();
      
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        
        // Convert date to timestamp (ensure it's in UTC)
        const dateObj = new Date(newAppointment.date);
        const dateTimestamp = Math.floor(dateObj.getTime() / 1000);
        
        // Extract hour from time (handle both HH:MM and HH:MM:SS formats)
        const timeParts = newAppointment.time.split(':');
        const hour = parseInt(timeParts[0]);
        
        // Create appointment using the new contract
        await appointmentContract.methods
          .createAppointment(
            newAppointment.patientId,
            hhNumber, // doctor number from URL params
            dateTimestamp,
            hour,
            newAppointment.reason
          )
          .send({ 
            from: accounts[0],
            gas: 500000 // Increase gas limit if needed
          });
        
        // Refresh appointments
        const updatedAppointments = await appointmentContract.methods
          .getDoctorAppointments(hhNumber)
          .call();
        
        // Get patient list again to ensure we have names
        const networkId = await web3.eth.net.getId();
        const doctorDeployedNetwork = DoctorRegistration.networks[networkId];
        const doctorContract = new web3.eth.Contract(
          DoctorRegistration.abi,
          doctorDeployedNetwork.address
        );
        
        const patientList = await doctorContract.methods
          .getPatientList(hhNumber)
          .call();
        
        // Format appointments for display
        const formattedAppointments = updatedAppointments.map(appt => ({
          id: appt.id.toString(),
          patientId: appt.patientNumber,
          patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
          date: new Date(appt.date * 1000).toISOString().split('T')[0],
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
        if (error.message) {
          errorMsg += `: ${error.message}`;
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
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      
      await appointmentContract.methods
        .cancelAppointment(appointmentId)
        .send({ from: accounts[0] });
      
      // Refresh appointments
      const updatedAppointments = await appointmentContract.methods
        .getDoctorAppointments(hhNumber)
        .call();
      
      // Get patient list again to ensure we have names
      const doctorContract = new web3.eth.Contract(
        DoctorRegistration.abi,
        DoctorRegistration.networks[await web3.eth.net.getId()].address
      );
      const patientList = await doctorContract.methods
        .getPatientList(hhNumber)
        .call();
      
      // Format appointments for display
      const formattedAppointments = updatedAppointments.map(appt => ({
        id: appt.id.toString(),
        patientId: appt.patientNumber,
        patientName: patientList.find(p => p.patient_number === appt.patientNumber)?.patient_name || 'Unknown',
        date: new Date(appt.date * 1000).toISOString().split('T')[0],
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
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg">All</button>
              <button className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Today</button>
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