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
import Layout from "./Layout";

const StudentAttendance = () => {
    const [activeMethod, setActiveMethod] = useState("none");
    const [loading, setLoading] = useState(true);
    const [lectureInfo, setLectureInfo] = useState(null);
    const [studentClasses, setStudentClasses] = useState([]);
    const [alreadyMarked, setAlreadyMarked] = useState(false);
    const { isRegistered, loading: faceLoading } = useFaceRegistrationStatus();

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchStudentClasses();
        
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
            for (const cls of classes) {
                try {
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
                        
                        await checkMarkedStatus(cls._id);
                        
                        setLoading(false);
                        return; 
                    }
                } catch (innerError) {
                    console.error(`Error checking method for class ${cls._id}:`, innerError.message);
                }
            }
            
            setActiveMethod("none");
            setLectureInfo(null);
            setAlreadyMarked(false);
        } catch (error) {
            console.error("Critical error in checkAllActiveMethods:", error);
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
            <div className="card" style={{ textAlign: "center" }}>
                <h3>🔄 Checking attendance options...</h3>
            </div>
        );
    }

    if (activeMethod === "none" || !lectureInfo) {
        return (
            <div className="card" style={{ textAlign: "center" }}>
                <h3>📚 No Active Attendance</h3>
                <p style={{ color: "#94a3b8" }}>
                    Wait for your teacher to start taking attendance
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "2rem" }}>
            <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>📋 {lectureInfo.title}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", fontSize: "0.875rem", color: "#94a3b8" }}>
                    <span>👨‍🏫 Professor: {lectureInfo.teacherName}</span>
                    <span>📚 Subject: {lectureInfo.subject}</span>
                    <span>🏫 Class: {lectureInfo.className}</span>
                </div>
            </div>
            
            <div className="card" style={{ 
                marginBottom: "2rem", 
                backgroundColor: alreadyMarked ? "#166534" : "#065f46"
            }}>
                {alreadyMarked ? (
                    <div>
                        <h4>✅ Attendance marked</h4>
                    </div>
                ) : (
                    <>
                        <h4>🟢 Method: {activeMethod.toUpperCase()}</h4>
                    </>
                )}
            </div>

            {!alreadyMarked && (
                <div className="card">
                    {activeMethod === "qr" && <QRScanner classId={lectureInfo.classId} lectureId={lectureInfo.id} />}
                    {activeMethod === "face" && (
                        <div>
                            {!isRegistered && <FaceRegister />}
                            {isRegistered && <FaceAttendance classId={lectureInfo.classId} lectureId={lectureInfo.id} />}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;
