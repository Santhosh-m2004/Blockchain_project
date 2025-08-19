// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DoctorRegistration.sol";
import "./PatientRegistration.sol";

contract AppointmentManagement {
    struct Appointment {
        uint256 id;
        string patientNumber;
        string doctorNumber;
        uint256 date; // Unix timestamp
        uint256 timeSlot; // 0-23 for hours
        string reason;
        string status; // "Scheduled", "Completed", "Cancelled", "No-Show"
        uint256 createdAt;
        uint256 updatedAt;
    }

    address public admin;
    DoctorRegistration public doctorContract;
    PatientRegistration public patientContract;
    
    uint256 private nextAppointmentId;
    mapping(uint256 => Appointment) public appointments;
    mapping(string => uint256[]) public patientAppointments; // patientNumber -> appointmentIds
    mapping(string => uint256[]) public doctorAppointments; // doctorNumber -> appointmentIds
    
    // Events
    event AppointmentCreated(
        uint256 indexed id,
        string indexed patientNumber,
        string indexed doctorNumber,
        uint256 date,
        uint256 timeSlot,
        string reason
    );
    
    event AppointmentStatusUpdated(
        uint256 indexed id,
        string newStatus,
        string oldStatus
    );
    
    event AppointmentCancelled(uint256 indexed id, string cancelledBy);
    event AppointmentRescheduled(uint256 indexed id, uint256 newDate, uint256 newTimeSlot);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyDoctor(string memory _doctorNumber) {
        // Get the doctor number for the sender
        string memory senderDoctorNumber = doctorContract.getDoctorNumberByAddress(msg.sender);
        // Compare using keccak256 hash
        require(
            keccak256(abi.encodePacked(senderDoctorNumber)) == 
            keccak256(abi.encodePacked(_doctorNumber)),
            "Unauthorized: Not the doctor"
        );
        _;
    }

    modifier onlyPatientOrDoctor(uint256 _appointmentId) {
        Appointment memory appointment = appointments[_appointmentId];
        string memory patientNumber = appointment.patientNumber;
        string memory doctorNumber = appointment.doctorNumber;
        
        // Get patient wallet address
        (address patientWallet, , , , , , ,) = patientContract.getPatientDetails(patientNumber);
        bool isPatient = patientContract.isRegisteredPatient(patientNumber) && 
            patientWallet == msg.sender;
            
        // Get doctor number for sender and compare
        string memory senderDoctorNumber = doctorContract.getDoctorNumberByAddress(msg.sender);
        bool isDoctor = keccak256(abi.encodePacked(senderDoctorNumber)) == 
            keccak256(abi.encodePacked(doctorNumber));
            
        require(isPatient || isDoctor, "Unauthorized: Not patient or doctor");
        _;
    }

    modifier validAppointment(uint256 _appointmentId) {
        require(appointments[_appointmentId].id != 0, "Appointment does not exist");
        _;
    }

    constructor(address _doctorContract, address _patientContract) {
        admin = msg.sender;
        doctorContract = DoctorRegistration(_doctorContract);
        patientContract = PatientRegistration(_patientContract);
        nextAppointmentId = 1;
    }

    function createAppointment(
        string memory _patientNumber,
        string memory _doctorNumber,
        uint256 _date,
        uint256 _timeSlot,
        string memory _reason
    ) external returns (uint256) {
        // Validate patient exists
        require(patientContract.isRegisteredPatient(_patientNumber), "Patient not registered");
        
        // Validate doctor exists
        (address doctorAddress, , , , , , , , ,) = doctorContract.getDoctorDetails(_doctorNumber);
        require(doctorAddress != address(0), "Doctor not registered");
        
        // Get patient wallet address
        (address patientWallet, , , , , , ,) = patientContract.getPatientDetails(_patientNumber);
        
        // Validate the caller is either the patient or the doctor
        bool isPatient = patientWallet == msg.sender;
        bool isDoctor = doctorAddress == msg.sender;
        
        require(isPatient || isDoctor, "Unauthorized: Not patient or doctor");
        
        // Check if patient has granted permission to doctor
        require(
            doctorContract.isPermissionGranted(_patientNumber, _doctorNumber),
            "Doctor doesn't have permission to access patient records"
        );
        
        // Validate date is in the future
        require(_date > block.timestamp, "Appointment date must be in the future");
        
        // Validate time slot (0-23 for hours)
        require(_timeSlot < 24, "Invalid time slot");
        
        // Check for scheduling conflicts for doctor
        require(!hasDoctorTimeConflict(_doctorNumber, _date, _timeSlot), 
            "Doctor has a scheduling conflict at this time");
        
        // Create appointment
        uint256 appointmentId = nextAppointmentId;
        appointments[appointmentId] = Appointment({
            id: appointmentId,
            patientNumber: _patientNumber,
            doctorNumber: _doctorNumber,
            date: _date,
            timeSlot: _timeSlot,
            reason: _reason,
            status: "Scheduled",
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        // Update mappings
        patientAppointments[_patientNumber].push(appointmentId);
        doctorAppointments[_doctorNumber].push(appointmentId);
        
        nextAppointmentId++;
        
        emit AppointmentCreated(
            appointmentId,
            _patientNumber,
            _doctorNumber,
            _date,
            _timeSlot,
            _reason
        );
        
        return appointmentId;
    }

    function cancelAppointment(uint256 _appointmentId) 
        external 
        validAppointment(_appointmentId)
        onlyPatientOrDoctor(_appointmentId)
    {
        Appointment storage appointment = appointments[_appointmentId];
        string memory oldStatus = appointment.status;
        
        require(
            keccak256(abi.encodePacked(appointment.status)) == keccak256(abi.encodePacked("Scheduled")),
            "Only scheduled appointments can be cancelled"
        );
        
        appointment.status = "Cancelled";
        appointment.updatedAt = block.timestamp;
        
        emit AppointmentStatusUpdated(_appointmentId, "Cancelled", oldStatus);
        
        // Determine who cancelled the appointment
        (address patientWallet, , , , , , ,) = patientContract.getPatientDetails(appointment.patientNumber);
        string memory cancelledBy = msg.sender == patientWallet ? "Patient" : "Doctor";
        emit AppointmentCancelled(_appointmentId, cancelledBy);
    }

    function updateAppointmentStatus(uint256 _appointmentId, string memory _newStatus) 
        external 
        validAppointment(_appointmentId)
        onlyDoctor(appointments[_appointmentId].doctorNumber)
    {
        Appointment storage appointment = appointments[_appointmentId];
        string memory oldStatus = appointment.status;
        
        // Validate status transition
        require(
            (keccak256(abi.encodePacked(oldStatus)) == keccak256(abi.encodePacked("Scheduled")) && 
             keccak256(abi.encodePacked(_newStatus)) == keccak256(abi.encodePacked("Completed"))) ||
            (keccak256(abi.encodePacked(oldStatus)) == keccak256(abi.encodePacked("Scheduled")) && 
             keccak256(abi.encodePacked(_newStatus)) == keccak256(abi.encodePacked("No-Show"))),
            "Invalid status transition"
        );
        
        appointment.status = _newStatus;
        appointment.updatedAt = block.timestamp;
        
        emit AppointmentStatusUpdated(_appointmentId, _newStatus, oldStatus);
    }

    function rescheduleAppointment(
        uint256 _appointmentId,
        uint256 _newDate,
        uint256 _newTimeSlot
    ) 
        external 
        validAppointment(_appointmentId)
        onlyPatientOrDoctor(_appointmentId)
    {
        Appointment storage appointment = appointments[_appointmentId];
        
        require(
            keccak256(abi.encodePacked(appointment.status)) == keccak256(abi.encodePacked("Scheduled")),
            "Only scheduled appointments can be rescheduled"
        );
        
        // Validate new date is in the future
        require(_newDate > block.timestamp, "New appointment date must be in the future");
        
        // Validate time slot
        require(_newTimeSlot < 24, "Invalid time slot");
        
        // Check for scheduling conflicts for doctor
        require(!hasDoctorTimeConflict(appointment.doctorNumber, _newDate, _newTimeSlot), 
            "Doctor has a scheduling conflict at this time");
        
        uint256 oldDate = appointment.date;
        uint256 oldTimeSlot = appointment.timeSlot;
        
        appointment.date = _newDate;
        appointment.timeSlot = _newTimeSlot;
        appointment.updatedAt = block.timestamp;
        
        emit AppointmentRescheduled(_appointmentId, _newDate, _newTimeSlot);
    }

    function getAppointment(uint256 _appointmentId) 
        external 
        view 
        validAppointment(_appointmentId)
        returns (Appointment memory)
    {
        return appointments[_appointmentId];
    }

    function getPatientAppointments(string memory _patientNumber) 
        external 
        view 
        returns (Appointment[] memory)
    {
        uint256[] memory appointmentIds = patientAppointments[_patientNumber];
        Appointment[] memory result = new Appointment[](appointmentIds.length);
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            result[i] = appointments[appointmentIds[i]];
        }
        
        return result;
    }

    function getDoctorAppointments(string memory _doctorNumber) 
        external 
        view 
        returns (Appointment[] memory)
    {
        uint256[] memory appointmentIds = doctorAppointments[_doctorNumber];
        Appointment[] memory result = new Appointment[](appointmentIds.length);
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            result[i] = appointments[appointmentIds[i]];
        }
        
        return result;
    }

    function getUpcomingDoctorAppointments(string memory _doctorNumber) 
        external 
        view 
        returns (Appointment[] memory)
    {
        uint256[] memory appointmentIds = doctorAppointments[_doctorNumber];
        uint256 count = 0;
        
        // First, count how many appointments are upcoming
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            if (appointments[appointmentIds[i]].date >= block.timestamp && 
                keccak256(abi.encodePacked(appointments[appointmentIds[i]].status)) == keccak256(abi.encodePacked("Scheduled"))) {
                count++;
            }
        }
        
        // Then, create the array with the correct size
        Appointment[] memory result = new Appointment[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            if (appointments[appointmentIds[i]].date >= block.timestamp && 
                keccak256(abi.encodePacked(appointments[appointmentIds[i]].status)) == keccak256(abi.encodePacked("Scheduled"))) {
                result[index] = appointments[appointmentIds[i]];
                index++;
            }
        }
        
        return result;
    }

    function hasDoctorTimeConflict(
        string memory _doctorNumber, 
        uint256 _date, 
        uint256 _timeSlot
    ) 
        public 
        view 
        returns (bool) 
    {
        uint256[] memory appointmentIds = doctorAppointments[_doctorNumber];
        
        for (uint256 i = 0; i < appointmentIds.length; i++) {
            Appointment memory appointment = appointments[appointmentIds[i]];
            
            // Check if there's an appointment at the same date and time slot that's still scheduled
            if (appointment.date == _date && 
                appointment.timeSlot == _timeSlot && 
                keccak256(abi.encodePacked(appointment.status)) == keccak256(abi.encodePacked("Scheduled"))) {
                return true;
            }
        }
        
        return false;
    }

    function getAppointmentCount() external view returns (uint256) {
        return nextAppointmentId - 1;
    }
}