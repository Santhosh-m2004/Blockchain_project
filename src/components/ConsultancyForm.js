//ConsultancyForm.js
import React, { useState } from "react";

const ConsultancyForm = ({ patient, doctorAddress, onCreate }) => {
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");

  const handleSubmit = () => {
    if (!diagnosis || !prescription) {
      alert("Please fill all fields");
      return;
    }

    const record = {
      patientName: patient.name,
      gender: patient.gender,
      doctorAddress,
      diagnosis,
      prescription,
    };

    onCreate(record);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-mono">
      <h1 className="text-4xl text-center mb-10">Consultancy</h1>
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-gray-300 mb-1">Record Id :</p>
          <p className="bg-gray-800 p-2 rounded">{crypto.randomUUID()}</p>
        </div>
        <div>
          <p className="text-gray-300 mb-1">Patient Name:</p>
          <input
            value={patient.name}
            readOnly
            className="w-full bg-gray-800 text-white p-2 rounded"
          />
        </div>
        <div>
          <p className="text-gray-300 mb-1">Doctor Wallet Address:</p>
          <input
            value={doctorAddress}
            readOnly
            className="w-full bg-gray-800 text-white p-2 rounded"
          />
        </div>
        <div>
          <p className="text-gray-300 mb-1">Gender:</p>
          <input
            value={patient.gender}
            readOnly
            className="w-full bg-gray-800 text-white p-2 rounded"
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <p className="mb-1">Diagnosis:</p>
          <textarea
            rows="3"
            className="w-full p-2 text-black rounded"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <p className="mb-1">Prescription:</p>
          <textarea
            rows="3"
            className="w-full p-2 text-black rounded"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-8 flex justify-center gap-6">
        <button
          onClick={handleSubmit}
          className="bg-teal-400 px-6 py-2 rounded hover:bg-teal-500"
        >
          Create Record
        </button>
        <button className="bg-cyan-500 px-6 py-2 rounded hover:bg-cyan-600">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConsultancyForm;
