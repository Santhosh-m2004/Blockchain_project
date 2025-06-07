//ConsultationRecords.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PatientRegistration.sol";
import "./DoctorRegistration.sol";

contract ConsultationRecords {
    struct Consultation {
        string recordId;
        string patientId;
        string patientName;
        string gender;
        address doctorAddress;
        string diagnosis;
        string prescription;
        uint256 timestamp;
    }

    address public admin;
    PatientRegistration public patientContract;
    DoctorRegistration public doctorContract;
    
    mapping(string => Consultation) public consultations;
    mapping(string => string[]) public patientConsultations;

    event ConsultationCreated(
        string indexed patientId,
        string indexed recordId,
        address indexed doctorAddress
    );

    constructor(address _patientContract, address _doctorContract) {
        admin = msg.sender;
        patientContract = PatientRegistration(_patientContract);
        doctorContract = DoctorRegistration(_doctorContract);
    }
    Consultation[] public allConsultations;

    function createConsultationRecord(
        string memory _patientNumber,
        string memory _recordId,
        string memory _diagnosis,
        string memory _prescription
    ) external {
        // Validate patient exists
        require(patientContract.isRegisteredPatient(_patientNumber), "Patient not registered");
        
        // Get patient details
        (, string memory name,,, string memory gender,,,) = 
            patientContract.getPatientDetails(_patientNumber);
        
        // Validate doctor permissions
        string memory doctorNumber = doctorContract.getDoctorNumberByAddress(msg.sender);
        require(bytes(doctorNumber).length > 0, "Doctor not registered");
        require(
            doctorContract.doctorPermissions(_patientNumber, doctorNumber),
            "No permission for this patient"
        );

        // Create and store consultation
        Consultation memory newConsultation = Consultation({
            recordId: _recordId,
            patientId: _patientNumber,
            patientName: name,
            gender: gender,
            doctorAddress: msg.sender,
            diagnosis: _diagnosis,
            prescription: _prescription,
            timestamp: block.timestamp
        });
        
        consultations[_recordId] = newConsultation;
        patientConsultations[_patientNumber].push(_recordId);
        
        emit ConsultationCreated(_patientNumber, _recordId, msg.sender);
        allConsultations.push(newConsultation);
    }
    function getAllConsultations() external view returns (Consultation[] memory) {
    return allConsultations;
}

    function getPatientConsultations(string memory _patientNumber) 
        external view returns (Consultation[] memory) 
    {
        string[] memory ids = patientConsultations[_patientNumber];
        Consultation[] memory result = new Consultation[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = consultations[ids[i]];
        }
        return result;
    }
}