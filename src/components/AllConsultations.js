import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import NavBarLogout from "./NavBar_Logout";
import ConsultationRecords from "../build/contracts/ConsultationRecords.json";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";

const AllConsultations = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!window.ethereum) throw new Error("Please install MetaMask");

        const web3 = new Web3(window.ethereum);
        const networkId = await web3.eth.net.getId();
        
        // Load consultation records
        const consultationNetwork = ConsultationRecords.networks[networkId];
        if (!consultationNetwork) throw new Error("Consultation contract not deployed");
        
        const consultationContract = new web3.eth.Contract(
          ConsultationRecords.abi,
          consultationNetwork.address
        );
        
        const consultationResult = await consultationContract.methods
          .getPatientConsultations(hhNumber)
          .call();
        
        setConsultations(consultationResult);
        
        // Load doctor details
        const doctorNetwork = DoctorRegistration.networks[networkId];
        if (!doctorNetwork) throw new Error("Doctor contract not deployed");
        
        const doctorContract = new web3.eth.Contract(
          DoctorRegistration.abi,
          doctorNetwork.address
        );
        
        // Get unique doctor addresses
        const uniqueAddresses = [
          ...new Set(consultationResult.map(c => c.doctorAddress))
        ];
        
        // Fetch doctor details in bulk
        const detailRequests = uniqueAddresses.map(async address => {
          try {
            const doctorNumber = await doctorContract.methods
              .getDoctorNumberByAddress(address)
              .call();
            
            if (doctorNumber) {
              const details = await doctorContract.methods
                .getDoctorDetails(doctorNumber)
                .call();
              
              // Extract doctor name from details array
              // The first element is the name according to the contract
              const doctorName = details[1];
              
              return { 
                address, 
                name: doctorName, 
                id: doctorNumber 
              };
            }
          } catch (err) {
            console.error(`Error fetching doctor ${address}:`, err);
          }
          
          return { 
            address, 
            name: "Unknown Doctor", 
            id: "N/A" 
          };
        });
        
        const doctorResults = await Promise.all(detailRequests);
        const detailsMap = doctorResults.reduce((acc, curr) => {
          acc[curr.address] = { name: curr.name, id: curr.id };
          return acc;
        }, {});
        
        setDoctorDetails(detailsMap);
      } catch (err) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hhNumber]);

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goBack = () => navigate(`/patient/${hhNumber}`);

  return (
    <div>
      <NavBarLogout />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">
                Consultation History
              </h1>
              <button 
                onClick={goBack}
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading consultation records...</p>
              </div>
            ) : error ? (
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
            ) : consultations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No consultations found</h3>
                <p className="mt-1 text-gray-500">You don't have any consultation records yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Date & Time
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Diagnosis
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Prescription
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Doctor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Record ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {consultations.map((consultation, index) => {
                      const doctorInfo = doctorDetails[consultation.doctorAddress] || {};
                      
                      return (
                        <tr key={index} className={index % 2 === 0 ? undefined : 'bg-gray-50'}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {formatDate(consultation.timestamp)}
                          </td>
                          <td className="whitespace-normal px-3 py-4 text-sm text-gray-500 max-w-xs">
                            {consultation.diagnosis}
                          </td>
                          <td className="whitespace-normal px-3 py-4 text-sm text-gray-500 max-w-xs">
                            {consultation.prescription}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">
                                  {doctorInfo.name || "Loading..."}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  ID: {doctorInfo.id || "Loading..."}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono">
                            {consultation.recordId}
                          </td>
                        </tr>
                      );
                    })}
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

export default AllConsultations;