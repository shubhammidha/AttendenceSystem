/**
 * Teacher Attendance Options Component
 * 
 * Purpose: Teacher interface for choosing attendance methods after starting lecture
 * 
 * Features:
 * - Display active lecture information
 * - Three attendance methods: Manual, QR, Face Recognition
 * - Generate QR codes for active lectures
 * - View attendance list for current lecture
 * - Real-time attendance tracking
 * 
 * State Management:
 * - activeLectures: Currently active lectures for this teacher
 * - selectedMethod: Chosen attendance method
 * - qrData: Generated QR code data
 * - attendanceList: Students who marked attendance
 * 
 * API Integration:
 * - GET /api/lecture/active/:classId - Get active lectures
 * - POST /api/qr/generate - Generate QR for lecture
 * - GET /api/attendance/lecture/:lectureId - Get attendance list
 * 
 * Usage:
 * - Shown after teacher starts a lecture
 * - Provides attendance method selection
 * - Integrates with existing attendance systems
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

const TeacherAttendanceOptions = () => {
    const [activeLectures, setActiveLectures] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState("");
    const [qrData, setQrData] = useState("");
    const [loading, setLoading] = useState(false);

    const classId = "69c188592fda59eb47432e5c"; // Default class ID

    useEffect(() => {
        fetchActiveLectures();
        // Refresh attendance list every 10 seconds
        const interval = setInterval(fetchActiveLectures, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchActiveLectures = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/lecture/active/${classId}`
            );
            setActiveLectures(res.data.activeLectures);
        } catch (error) {
            console.log("Error fetching active lectures:", error);
        }
    };

    const generateQRForLecture = async (lectureId) => {
        setLoading(true);
        try {
            const res = await axios.post(
                "http://localhost:5000/api/qr/generate",
                {
                    classId: lectureId,
                    lectureId: lectureId
                }
            );
            
            setQrData(res.data.qrImage);
            setSelectedMethod("qr");
            
        } catch (error) {
            console.log("Error generating QR:", error);
            alert("Failed to generate QR code");
        } finally {
            setLoading(false);
        }
    };

    const selectAttendanceMethod = async (method) => {
        if (activeLectures.length === 0) {
            alert("Please start a lecture first!");
            return;
        }

        try {
            console.log("Setting attendance method:", method, "for lecture:", activeLectures[0].id);
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5000/api/attendance-method/set",
                {
                    lectureId: activeLectures[0].id,
                    method: method
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Set method response:", res.data);
            alert("✅ " + res.data.message);
            setSelectedMethod(method);
            
            // If QR method, also generate QR
            if (method === "qr") {
                await generateQRForLecture(activeLectures[0].id);
            }
            
            // Refresh active lectures to get updated method
            fetchActiveLectures();
            
        } catch (error) {
            console.log("Error setting attendance method:", error);
            alert("❌ Failed to set attendance method: " + (error.response?.data?.message || error.message));
        }
    };

    const AttendanceMethodCard = ({ method, icon, title, description, onClick, disabled }) => (
        <div 
            style={{
                padding: "20px",
                backgroundColor: selectedMethod === method ? "#065f46" : "#1e293b",
                borderRadius: "8px",
                textAlign: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                border: selectedMethod === method ? "2px solid #22c55e" : "none",
                transition: "all 0.3s ease"
            }}
            onClick={disabled ? null : onClick}
        >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>{icon}</div>
            <h3 style={{ margin: "0 0 10px 0" }}>{title}</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>
                {description}
            </p>
        </div>
    );

    if (activeLectures.length === 0) {
        return (
            <div style={{ 
                textAlign: "center", 
                padding: "40px", 
                backgroundColor: "#1e293b", 
                borderRadius: "8px" 
            }}>
                <h3>📚 No Active Lectures</h3>
                <p style={{ color: "#94a3b8" }}>
                    Start a lecture to enable attendance options
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h3>📋 Attendance Options</h3>
            
            {/* Active Lecture Info */}
            {activeLectures.map((lecture) => (
                <div key={lecture.id} style={{ 
                    marginBottom: "30px", 
                    padding: "20px", 
                    backgroundColor: "#065f46", 
                    borderRadius: "8px" 
                }}>
                    <h4>🟢 Active Lecture: {lecture.title}</h4>
                    <p>Time remaining: {lecture.timeRemaining} minutes</p>
                    <p>📱 Attendance method: {selectedMethod || "Not selected"}</p>
                </div>
            ))}

            {/* Attendance Method Selection */}
            <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: "20px", 
                marginBottom: "30px" 
            }}>
                <AttendanceMethodCard
                    method="manual"
                    icon="✍️"
                    title="Manual Attendance"
                    description="Mark attendance manually for each student"
                    onClick={() => selectAttendanceMethod("manual")}
                />

                <AttendanceMethodCard
                    method="qr"
                    icon="📱"
                    title="QR Code Attendance"
                    description="Generate QR code for students to scan"
                    onClick={() => selectAttendanceMethod("qr")}
                    disabled={loading}
                />

                <AttendanceMethodCard
                    method="face"
                    icon="👤"
                    title="Face Recognition"
                    description="Students use face recognition to mark attendance"
                    onClick={() => selectAttendanceMethod("face")}
                />
            </div>

            {/* Selected Method Display */}
            {selectedMethod && (
                <div style={{ 
                    padding: "20px", 
                    backgroundColor: "#1e293b", 
                    borderRadius: "8px",
                    textAlign: "left"
                }}>
                    <h4>Selected Method: {selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}</h4>
                    
                    {selectedMethod === "manual" && (
                        <div>
                            <p>Manual attendance interface would go here.</p>
                            <p>Teachers can mark students as present/absent manually.</p>
                        </div>
                    )}

                    {selectedMethod === "qr" && qrData && (
                        <div style={{ textAlign: "center" }}>
                            <p>QR Code generated! Students can scan this to mark attendance:</p>
                            <img src={qrData} alt="QR Code" style={{ 
                                maxWidth: "200px", 
                                margin: "20px auto",
                                border: "4px solid white",
                                borderRadius: "8px"
                            }} />
                        </div>
                    )}

                    {selectedMethod === "face" && (
                        <div>
                            <p>Face recognition attendance is ready!</p>
                            <p>Students can use the Face Recognition feature to mark attendance.</p>
                        </div>
                    )}
                </div>
            )}

            </div>
    );
};

export default TeacherAttendanceOptions;
