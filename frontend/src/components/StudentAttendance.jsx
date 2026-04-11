/**
 * Student Attendance Component
 * 
 * Purpose: Student interface that shows attendance options based on teacher's selection
 * 
 * Features:
 * - Checks active attendance method for current class
 * - Shows QR Scanner only when QR method is active
 * - Shows Face Recognition only when Face method is active
 * - Real-time updates every 10 seconds
 * - Professional UI with method-specific instructions
 * 
 * State Management:
 * - activeMethod: Current attendance method (qr, face, manual, none)
 * - loading: Loading state for API calls
 * - lectureInfo: Active lecture details
 * 
 * API Integration:
 * - GET /api/attendance-method/active/:classId - Get active method
 * - GET /api/attendance-method/face-active/:classId - Check face status
 * 
 * Usage:
 * - Replaces static attendance components in student dashboard
 * - Conditionally shows attendance options based on teacher selection
 * - Provides clear instructions for each method
 */

import { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
import FaceRegister from "./FaceRegister";
import FaceAttendance from "./FaceAttendance";
import { useFaceRegistrationStatus } from "./FaceRegistrationStatus";

const StudentAttendance = () => {
    const [activeMethod, setActiveMethod] = useState("none");
    const [loading, setLoading] = useState(true);
    const [lectureInfo, setLectureInfo] = useState(null);
    const [studentClasses, setStudentClasses] = useState([]);
    const [alreadyMarked, setAlreadyMarked] = useState(false);
    const { isRegistered, loading: faceLoading } = useFaceRegistrationStatus();

    const userId = localStorage.getItem("userId");

    const refreshDashboardStats = () => {
        window.dispatchEvent(new CustomEvent('attendanceMarked', { 
            detail: { message: 'Attendance marked successfully' }
        }));
    };

    useEffect(() => {
        fetchStudentClasses();
        
        // Listen for immediate attendance updates from child components
        const handleAttendanceUpdate = () => {
            if (lectureInfo && lectureInfo.classId) {
                checkMarkedStatus(lectureInfo.classId);
            } else if (studentClasses.length > 0) {
                checkAllActiveMethods(studentClasses);
            }
        };
        
        window.addEventListener('attendanceMarked', handleAttendanceUpdate);
        return () => window.removeEventListener('attendanceMarked', handleAttendanceUpdate);
    }, [lectureInfo, studentClasses]);

    const fetchStudentClasses = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/class/student", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudentClasses(res.data);
            checkAllActiveMethods(res.data);
        } catch (error) {
            console.log("Error fetching student classes:", error);
            setLoading(false);
        }
    };

    const checkMarkedStatus = async (classId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/attendance/check/${userId}/${classId}`);
            setAlreadyMarked(res.data.alreadyMarked);
        } catch (error) {
            console.error("Error checking attendance status:", error);
        }
    };

    const checkAllActiveMethods = async (classes) => {
        if (!classes || classes.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Check active method for each class student is enrolled in
            for (const cls of classes) {
                const res = await axios.get(
                    `http://localhost:5000/api/attendance-method/active/${cls._id}`
                );
                
                if (res.data.activeMethod && res.data.activeMethod !== "none") {
                    setActiveMethod(res.data.activeMethod);
                    setLectureInfo({
                        title: res.data.lectureTitle,
                        id: res.data.lectureId,
                        classId: cls._id,
                        className: cls.className,
                        subject: cls.subject,
                        teacherName: res.data.teacherName
                    });
                    
                    // Check if already marked for this class/lecture
                    await checkMarkedStatus(cls._id);
                    
                    setLoading(false);
                    return; // Found an active lecture, stop searching
                }
            }
            
            // If we get here, no active lectures found
            setActiveMethod("none");
            setLectureInfo(null);
            setAlreadyMarked(false);
        } catch (error) {
            console.log("Error checking active methods:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentClasses.length > 0) {
            const interval = setInterval(() => checkAllActiveMethods(studentClasses), 10000);
            return () => clearInterval(interval);
        }
    }, [studentClasses]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <h3>🔄 Checking attendance options...</h3>
            </div>
        );
    }

    if (activeMethod === "none" || !lectureInfo) {
        return (
            <div style={{ 
                textAlign: "center", 
                padding: "40px", 
                backgroundColor: "#1e293b", 
                borderRadius: "8px" 
            }}>
                <h3>📚 No Active Attendance</h3>
                <p style={{ color: "#94a3b8" }}>
                    Wait for your teacher to start taking attendance
                </p>
                <p style={{ color: "#64748b", fontSize: "14px", marginTop: "10px" }}>
                    <strong>Note:</strong> Face registration and QR scanning will only be available 
                    when your teacher selects an attendance method.
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <div style={{ 
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#1e293b",
                borderRadius: "8px",
                border: "1px solid #334155"
            }}>
                <h3 style={{ margin: "0 0 10px 0" }}>📋 Attendance for: {lectureInfo.title}</h3>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "14px", color: "#94a3b8" }}>
                    <span>👨‍🏫 <strong>Professor:</strong> {lectureInfo.teacherName}</span>
                    <span>📚 <strong>Subject:</strong> {lectureInfo.subject}</span>
                    <span>🏫 <strong>Class:</strong> {lectureInfo.className}</span>
                </div>
            </div>
            
            {/* Active Method Display */}
            <div style={{ 
                marginBottom: "30px", 
                padding: "20px", 
                backgroundColor: alreadyMarked ? "#166534" : "#065f46", 
                borderRadius: "8px" 
            }}>
                {alreadyMarked ? (
                    <div>
                        <h4>✅ Attendance already marked</h4>
                        <p>You have successfully marked your attendance for this lecture.</p>
                    </div>
                ) : (
                    <>
                        <h4>🟢 Active Method: {activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)}</h4>
                        
                        {activeMethod === "qr" && (
                            <div>
                                <p>📱 Scan the QR code provided by your teacher</p>
                                <small>Use your phone camera to scan the QR code</small>
                            </div>
                        )}
                        
                        {activeMethod === "face" && (
                            <div>
                                <p>👤 Use face recognition to mark attendance</p>
                                <small>Make sure your face is clearly visible to the camera</small>
                            </div>
                        )}
                        
                        {activeMethod === "manual" && (
                            <div>
                                <p>✍️ Teacher is taking manual attendance</p>
                                <small>Wait for your teacher to mark your attendance</small>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Method-Specific Interface - Only show if not marked */}
            {!alreadyMarked && (
                <>
                    {activeMethod === "qr" && (
                        <div style={{ 
                            padding: "20px", 
                            backgroundColor: "#1e293b", 
                            borderRadius: "8px" 
                        }}>
                            <h4>📱 QR Scanner</h4>
                            <QRScanner classId={lectureInfo.classId} lectureId={lectureInfo.id} />
                        </div>
                    )}

                    {activeMethod === "face" && (
                        <div style={{ 
                            padding: "20px", 
                            backgroundColor: "#1e293b", 
                            borderRadius: "8px" 
                        }}>
                            <h4>👤 Face Recognition Attendance</h4>
                            
                            {/* Show Face Register if not registered */}
                            {!isRegistered && (
                                <div style={{ marginBottom: "20px" }}>
                                    <h5 style={{ color: "#fbbf24", marginBottom: "10px" }}>
                                        📸 Face Registration Required
                                    </h5>
                                    <p style={{ color: "#94a3b8", marginBottom: "15px", fontSize: "14px" }}>
                                        You need to register your face first before using face recognition attendance
                                    </p>
                                    <FaceRegister />
                                </div>
                            )}
                            
                            {/* Show Face Attendance for marking */}
                            <div>
                                {isRegistered ? (
                                    <div>
                                        <h5 style={{ color: "#22c55e", marginBottom: "10px" }}>
                                            ✅ Face Registered - Ready for Attendance
                                        </h5>
                                        <FaceAttendance classId={lectureInfo.classId} lectureId={lectureInfo.id} />
                                    </div>
                                ) : (
                                    <div style={{ 
                                        padding: "15px", 
                                        backgroundColor: "#334155", 
                                        borderRadius: "6px",
                                        textAlign: "center"
                                    }}>
                                        <p style={{ color: "#94a3b8" }}>
                                            Please register your face first to mark attendance
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeMethod === "manual" && (
                        <div style={{ 
                            padding: "20px", 
                            backgroundColor: "#1e293b", 
                            borderRadius: "8px" 
                        }}>
                            <h4>✍️ Manual Attendance</h4>
                            <p>Your teacher is taking attendance manually.</p>
                            <p style={{ color: "#94a3b8" }}>
                                Please wait to be called or marked present.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentAttendance;
