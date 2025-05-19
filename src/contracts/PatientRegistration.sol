//PatientRegistration.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IDoctorRegistration {
    function externalGrantFromPatient(
        string memory _patientNumber, 
        string memory _doctorNumber, 
        string memory _patientName
    ) external;
}

contract PatientRegistration {
    struct Patient {
        string[] ipfsHashes;
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
        string patientNumber;
        string patientName;
    }
    
    address public admin;
    string[] private patientList;
    
    mapping(string => bool) public isPatientRegistered;
    mapping(string => Patient) public patients;
    mapping(string => PatientList[]) private doctorToPatients;
    mapping(string => mapping(string => bool)) public doctorPermissions;
    mapping(string => mapping(string => bool)) public patientRecords;
    mapping(address => string) private addressToHhNumber;

    address public doctorContractAddress;

    event PatientRegistered(string indexed hhNumber, string name, address walletAddress);
    event RecordUploaded(string indexed hhNumber, string ipfsHash, address uploadedBy);
    event PermissionGranted(string indexed patientNumber, string doctorNumber);
    event PermissionRevoked(string indexed patientNumber, string doctorNumber);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyRegisteredPatient(string memory _hhNumber) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        require(msg.sender == patients[_hhNumber].walletAddress, "Unauthorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setDoctorContractAddress(address _addr) external onlyAdmin {
        doctorContractAddress = _addr;
    }

    function transferAdmin(address _newAdmin) external onlyAdmin {
        admin = _newAdmin;
    }

    function getAllPatients() external view onlyAdmin returns (string[] memory) {
        return patientList;
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
        require(bytes(_hhNumber).length > 0, "HH Number cannot be empty");
        require(_walletAddress != address(0), "Invalid wallet address");

        Patient memory newPatient = Patient({
            walletAddress: _walletAddress,
            name: _name,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            bloodGroup: _bloodGroup,
            homeAddress: _homeAddress,
            email: _email,
            hhNumber: _hhNumber,
            password: _password,
            ipfsHashes: new string[](0)
        });
        
        patientList.push(_hhNumber);
        patients[_hhNumber] = newPatient;
        isPatientRegistered[_hhNumber] = true;
        addressToHhNumber[_walletAddress] = _hhNumber;
        
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    function uploadPatientRecord(
        string memory _hhNumber, 
        string memory _ipfsHash
    ) external onlyRegisteredPatient(_hhNumber) {
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        require(!patientRecords[_hhNumber][_ipfsHash], "Record already exists");
        
        patients[_hhNumber].ipfsHashes.push(_ipfsHash);
        patientRecords[_hhNumber][_ipfsHash] = true;
        
        emit RecordUploaded(_hhNumber, _ipfsHash, msg.sender);
    }

    function grantPermission(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external onlyRegisteredPatient(_patientNumber) {
        require(!doctorPermissions[_patientNumber][_doctorNumber], "Permission already granted");
        
        bool exists = false;
        for (uint i = 0; i < doctorToPatients[_doctorNumber].length; i++) {
            if (keccak256(bytes(doctorToPatients[_doctorNumber][i].patientNumber)) == 
                keccak256(bytes(_patientNumber))) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            doctorToPatients[_doctorNumber].push(PatientList(_patientNumber, _patientName));
        }

        doctorPermissions[_patientNumber][_doctorNumber] = true;
        IDoctorRegistration(doctorContractAddress).externalGrantFromPatient(
            _patientNumber, 
            _doctorNumber, 
            _patientName
        );
        
        emit PermissionGranted(_patientNumber, _doctorNumber);
    }

    function revokePermission(string memory _doctorNumber) external {
        string memory _patientNumber = addressToHhNumber[msg.sender];
        require(doctorPermissions[_patientNumber][_doctorNumber], "Permission not granted");
        
        doctorPermissions[_patientNumber][_doctorNumber] = false;
        
        PatientList[] storage patientsList = doctorToPatients[_doctorNumber];
        for (uint i = 0; i < patientsList.length; i++) {
            if (keccak256(bytes(patientsList[i].patientNumber)) == keccak256(bytes(_patientNumber))) {
                if (i < patientsList.length - 1) {
                    patientsList[i] = patientsList[patientsList.length - 1];
                }
                patientsList.pop();
                break;
            }
        }
        
        emit PermissionRevoked(_patientNumber, _doctorNumber);
    }

    function getPatientRecords(string memory _hhNumber) external view returns (string[] memory) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return patients[_hhNumber].ipfsHashes;
    }

    function getPatientDetails(string memory _hhNumber) external view returns (
        address walletAddress,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory bloodGroup,
        string memory homeAddress,
        string memory email,
        string[] memory records
    ) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        Patient memory patient = patients[_hhNumber];
        return (
            patient.walletAddress,
            patient.name,
            patient.dateOfBirth,
            patient.gender,
            patient.bloodGroup,
            patient.homeAddress,
            patient.email,
            patient.ipfsHashes
        );
    }

    function getPatientList(string memory _doctorNumber) public view returns (PatientList[] memory) {
        return doctorToPatients[_doctorNumber];
    }

    function isPermissionGranted(
        string memory _patientNumber, 
        string memory _doctorNumber
    ) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function isRegisteredPatient(string memory _hhNumber) external view returns (bool) {
        return isPatientRegistered[_hhNumber];
    }

    function validatePassword(
        string memory _hhNumber, 
        string memory _password
    ) external view returns (bool) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return keccak256(abi.encodePacked(_password)) == 
               keccak256(abi.encodePacked(patients[_hhNumber].password));
    }
}