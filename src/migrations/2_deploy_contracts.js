// 2_deploy_contracts.js
const DoctorRegistration = artifacts.require("DoctorRegistration");
const PatientRegistration = artifacts.require("PatientRegistration");
const ConsultationRecords = artifacts.require("ConsultationRecords");
const AppointmentManagement = artifacts.require("AppointmentManagement");

module.exports = async (deployer, network, accounts) => {
  // Deploy core contracts
  await deployer.deploy(DoctorRegistration);
  await deployer.deploy(PatientRegistration);
  
  const doctor = await DoctorRegistration.deployed();
  const patient = await PatientRegistration.deployed();

  // Deploy ConsultationRecords with dependencies
  await deployer.deploy(ConsultationRecords, patient.address, doctor.address);
  const consultation = await ConsultationRecords.deployed();

  // Deploy AppointmentManagement with dependencies
  await deployer.deploy(AppointmentManagement, doctor.address, patient.address);
  const appointment = await AppointmentManagement.deployed();

  // Link contracts
  await patient.setDoctorContractAddress(doctor.address);
  await doctor.setPatientContract(patient.address);

  // Simple verification checks
  console.log("\n=== Deployment Verification ===");
  console.log("Doctor Contract:", doctor.address);
  console.log("Patient Contract:", patient.address);
  console.log("Consultation Records:", consultation.address);
  console.log("Appointment Management:", appointment.address);
  console.log("Doctor-Patient Link Status:", 
    (await patient.doctorContractAddress()) === doctor.address ? "✅ Success" : "❌ Failed"
  );
  console.log("Appointment-Doctor Link Status:", 
    (await appointment.doctorContract()) === doctor.address ? "✅ Success" : "❌ Failed"
  );
  console.log("Appointment-Patient Link Status:", 
    (await appointment.patientContract()) === patient.address ? "✅ Success" : "❌ Failed"
  );
};