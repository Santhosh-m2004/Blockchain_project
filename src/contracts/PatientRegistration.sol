// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDoctorRegistration {
    function externalGrantFromPatient(string memory _patientNumber, string memory _doctorNumber, string memory _patientName) external;
}

contract PatientRegistration {
    struct Patient {
        address walletAddress;
        string name;
        string dateOfBirth;
        string gender;
        string bloodGroup;
        string homeAddress;
        string email;
        string hhNumber;
        string password;
    }

    struct PatientList {
        string patient_number;
        string patient_name;
    }

    mapping(string => bool) public isPatientRegistered;
    mapping(string => Patient) public patients;
    mapping(string => PatientList[]) private Dpermission;
    mapping(string => mapping(string => bool)) public doctorPermissions;

    address public doctorContractAddress;

    event PatientRegistered(string hhNumber, string name, address walletAddress);

    function setDoctorContractAddress(address _addr) external {
        doctorContractAddress = _addr;
    }

    function registerPatient(
        address _walletAddress,
        string memory _name,
        string memory _dateOfBirth,
        string memory _gender,
        string memory _bloodGroup,
        string memory _homeAddress,
        string memory _email,
        string memory _hhNumber,
        string memory _password
    ) external {
        require(!isPatientRegistered[_hhNumber], "Patient already registered");

        Patient memory newPatient = Patient({
            walletAddress: _walletAddress,
            name: _name,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            bloodGroup: _bloodGroup,
            homeAddress: _homeAddress,
            email: _email,
            hhNumber: _hhNumber,
            password: _password
        });

        patients[_hhNumber] = newPatient;
        isPatientRegistered[_hhNumber] = true;
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    function isRegisteredPatient(string memory _hhNumber) external view returns (bool) {
        return isPatientRegistered[_hhNumber];
    }

    function validatePassword(string memory _hhNumber, string memory _password) external view returns (bool) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return keccak256(abi.encodePacked(_password)) == keccak256(abi.encodePacked(patients[_hhNumber].password));
    }

    function getPatientDetails(string memory _hhNumber) external view returns (
        address walletAddress,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory bloodGroup,
        string memory homeAddress,
        string memory email
    ) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        Patient memory patient = patients[_hhNumber];
        return (patient.walletAddress, patient.name, patient.dateOfBirth, patient.gender, patient.bloodGroup, patient.homeAddress, patient.email);
    }

    function grantPermission(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external {
        require(!doctorPermissions[_patientNumber][_doctorNumber], "View Access already given to the Doctor!");

        bool exists = false;
        for (uint i = 0; i < Dpermission[_doctorNumber].length; i++) {
            if (keccak256(abi.encodePacked(Dpermission[_doctorNumber][i].patient_number)) == keccak256(abi.encodePacked(_patientNumber))) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            Dpermission[_doctorNumber].push(PatientList(_patientNumber, _patientName));
        }

        doctorPermissions[_patientNumber][_doctorNumber] = true;

        // Notify doctor contract
        IDoctorRegistration(doctorContractAddress).externalGrantFromPatient(_patientNumber, _doctorNumber, _patientName);
    }

    function isPermissionGranted(string memory _patientNumber, string memory _doctorNumber) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function getPatientList(string memory _doctorNumber) public view returns (PatientList[] memory) {
        return Dpermission[_doctorNumber];
    }
}
