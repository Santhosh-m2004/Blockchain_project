import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import NavBarLogout from './NavBar_Logout';
import DoctorRegistration from '../build/contracts/DoctorRegistration.json';
import AppointmentManagement from '../build/contracts/AppointmentManagement.json';
import ConsultationRecords from '../build/contracts/ConsultationRecords.json';

const DoctorNotifications = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const initContracts = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Please install MetaMask");
        }
        
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
        const doctorContract = new web3Instance.eth.Contract(
          DoctorRegistration.abi,
          doctorDeployedNetwork.address
        );
        
        // Load appointment management contract
        const appointmentDeployedNetwork = AppointmentManagement.networks[networkId];
        if (!appointmentDeployedNetwork) {
          throw new Error("AppointmentManagement contract not deployed on current network");
        }
        const appointmentContract = new web3Instance.eth.Contract(
          AppointmentManagement.abi,
          appointmentDeployedNetwork.address
        );
        
        // Load consultation records contract
        const consultationDeployedNetwork = ConsultationRecords.networks[networkId];
        if (!consultationDeployedNetwork) {
          throw new Error("ConsultationRecords contract not deployed on current network");
        }
        const consultationContract = new web3Instance.eth.Contract(
          ConsultationRecords.abi,
          consultationDeployedNetwork.address
        );

        // Get doctor's appointments
        const appointments = await appointmentContract.methods
          .getDoctorAppointments(hhNumber)
          .call();
        
        // Get upcoming appointments (next 7 days)
        const currentTime = Math.floor(Date.now() / 1000);
        const sevenDaysFromNow = currentTime + (7 * 24 * 60 * 60);
        
        const upcomingAppointments = appointments.filter(
          appt => appt.status === "Scheduled" && 
                  parseInt(appt.date) > currentTime && 
                  parseInt(appt.date) <= sevenDaysFromNow
        );
        
        // Get recent cancellations (last 7 days)
        const recentCancellations = appointments.filter(
          appt => appt.status === "Cancelled" && 
                  parseInt(appt.updatedAt) > currentTime - (7 * 24 * 60 * 60)
        );
        
        // Get patient list for names
        const patientList = await doctorContract.methods
          .getPatientList(hhNumber)
          .call();
        
        // Get all consultations to check for new records
        const allConsultations = await consultationContract.methods
          .getAllConsultations()
          .call();
        
        // Filter consultations for this doctor's patients in the last 7 days
        const recentConsultations = allConsultations.filter(
          consult => {
            const consultTime = parseInt(consult.timestamp);
            return consultTime > currentTime - (7 * 24 * 60 * 60) &&
                   patientList.some(p => p.patient_number === consult.patientId);
          }
        );
        
        // Build notifications array
        const notificationList = [];
        
        // Add upcoming appointments as notifications
        upcomingAppointments.forEach(appt => {
          const patient = patientList.find(p => p.patient_number === appt.patientNumber);
          notificationList.push({
            id: `upcoming-${appt.id}`,
            type: 'upcoming',
            title: 'Upcoming Appointment',
            message: `You have an appointment with ${patient ? patient.patient_name : 'Patient'} on ${new Date(parseInt(appt.date) * 1000).toLocaleDateString()} at ${appt.timeSlot}:00`,
            timestamp: parseInt(appt.date),
            read: false,
            action: () => navigate(`/doctor/${hhNumber}/appointments`)
          });
        });
        
        // Add cancellations as notifications
        recentCancellations.forEach(appt => {
          const patient = patientList.find(p => p.patient_number === appt.patientNumber);
          notificationList.push({
            id: `cancelled-${appt.id}`,
            type: 'cancelled',
            title: 'Appointment Cancelled',
            message: `Appointment with ${patient ? patient.patient_name : 'Patient'} on ${new Date(parseInt(appt.date) * 1000).toLocaleDateString()} has been cancelled`,
            timestamp: parseInt(appt.updatedAt),
            read: false,
            action: () => navigate(`/doctor/${hhNumber}/appointments`)
          });
        });
        
        // Add new consultations as notifications
        recentConsultations.forEach(consult => {
          const patient = patientList.find(p => p.patient_number === consult.patientId);
          notificationList.push({
            id: `consultation-${consult.recordId}`,
            type: 'consultation',
            title: 'New Consultation Record',
            message: `New consultation record added for ${patient ? patient.patient_name : 'Patient'}`,
            timestamp: parseInt(consult.timestamp),
            read: false,
            action: () => navigate(`/doctor/${hhNumber}/consultations`)
          });
        });
        
        // Sort notifications by timestamp (newest first)
        notificationList.sort((a, b) => b.timestamp - a.timestamp);
        
        // Load read status from localStorage
        const readNotifications = JSON.parse(localStorage.getItem(`doctor-${hhNumber}-read-notifications`) || '[]');
        notificationList.forEach(notification => {
          if (readNotifications.includes(notification.id)) {
            notification.read = true;
          }
        });
        
        setNotifications(notificationList);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        console.error("Error loading notifications:", err);
        setLoading(false);
      }
    };

    initContracts();
  }, [hhNumber, navigate]);

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    
    // Save to localStorage
    const readNotifications = JSON.parse(localStorage.getItem(`doctor-${hhNumber}-read-notifications`) || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem(`doctor-${hhNumber}-read-notifications`, JSON.stringify(readNotifications));
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    
    // Save all notification IDs to localStorage
    const allNotificationIds = notifications.map(n => n.id);
    localStorage.setItem(`doctor-${hhNumber}-read-notifications`, JSON.stringify(allNotificationIds));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'upcoming':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'consultation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/doctor/${hhNumber}`)}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Dashboard
                </button>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
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

            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-gray-500">You're all caught up! Check back later for new notifications.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${notification.read ? 'bg-gray-50' : 'bg-white border-indigo-200'}`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.action) notification.action();
                    }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0 ml-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            New
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorNotifications;