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

import React, { useState, useEffect } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
import FaceRegister from "./FaceRegister";
import FaceAttendance from "./FaceAttendance";

const StudentAttendance = () => {
    const [activeMethod, setActiveMethod] = useState("none");
    const [loading, setLoading] = useState(true);
    const [lectureInfo, setLectureInfo] = useState(null);

    const classId = "69c188592fda59eb47432e5c"; // Default class ID

    useEffect(() => {
        checkActiveMethod();
        // Check every 10 seconds for updates
        const interval = setInterval(checkActiveMethod, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkActiveMethod = async () => {
        try {
            console.log("Checking active method for classId:", classId);
            const res = await axios.get(
                `http://localhost:5000/api/attendance-method/active/${classId}`
            );
            
            console.log("API Response:", res.data);
            
            setActiveMethod(res.data.activeMethod || "none");
            setLectureInfo(res.data.lectureTitle ? {
                title: res.data.lectureTitle,
                id: res.data.lectureId
            } : null);
            
        } catch (error) {
            console.log("Error checking active method:", error);
            // For demo, fallback to checking if any lectures are active
            setActiveMethod("none");
        } finally {
            setLoading(false);
        }
    };

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
            <h3>📋 Attendance for: {lectureInfo.title}</h3>
            
            {/* Active Method Display */}
            <div style={{ 
                marginBottom: "30px", 
                padding: "20px", 
                backgroundColor: "#065f46", 
                borderRadius: "8px" 
            }}>
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
            </div>

            {/* Method-Specific Interface */}
            {activeMethod === "qr" && (
                <div style={{ 
                    padding: "20px", 
                    backgroundColor: "#1e293b", 
                    borderRadius: "8px" 
                }}>
                    <h4>📱 QR Scanner</h4>
                    <QRScanner />
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
                    <div style={{ marginBottom: "20px" }}>
                        <FaceRegister />
                    </div>
                    
                    {/* Show Face Attendance for marking */}
                    <div>
                        <FaceAttendance />
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
        </div>
    );
};

export default StudentAttendance;
