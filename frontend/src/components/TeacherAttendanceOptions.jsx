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
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

const TeacherAttendanceOptions = () => {
    const [activeLectures, setActiveLectures] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState("");
    const [qrData, setQrData] = useState("");
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({}); // {studentId: status}

    const fetchActiveLectures = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                "http://localhost:5000/api/lecture/teacher-active",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            const lectures = res.data.activeLectures || [];
            setActiveLectures(lectures);
            
            if (lectures.length > 0) {
                // For simplicity, we track method for the first lecture
                const activeLecture = lectures[0];
                const method = activeLecture.attendanceMethod || "";
                setSelectedMethod(method);
                
                if (method === "manual") {
                    fetchManualAttendanceData(activeLecture._id || activeLecture.id, activeLecture.classId);
                }
            } else {
                setSelectedMethod("");
                setStudents([]);
                setAttendanceMap({});
            }
        } catch (error) {
            console.log("Error fetching active lectures:", error);
        }
    };

    const fetchManualAttendanceData = async (lectureId, classId) => {
        try {
            const token = localStorage.getItem("token");
            const studentsRes = await axios.get(`http://localhost:5000/api/class/${classId}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(studentsRes.data);

            const attendanceRes = await axios.get(`http://localhost:5000/api/attendance/lecture/${lectureId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const map = {};
            attendanceRes.data.forEach(rec => {
                map[rec.student._id] = rec.status;
            });
            setAttendanceMap(map);
        } catch (error) {
            console.log("Error fetching manual attendance data:", error);
        }
    };

    const toggleAttendance = async (studentId, currentStatus, lectureId, classId) => {
        const newStatus = currentStatus === "present" ? "absent" : "present";

        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/attendance/mark", {
                studentId,
                classId,
                lectureId,
                status: newStatus,
                method: "manual"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setAttendanceMap(prev => ({ ...prev, [studentId]: newStatus }));
        } catch (error) {
            alert("Failed to update attendance");
        }
    };

    useEffect(() => {
        fetchActiveLectures();
        const interval = setInterval(fetchActiveLectures, 10000);
        
        const handleLectureUpdate = () => {
            fetchActiveLectures();
        };
        
        window.addEventListener('lectureStarted', handleLectureUpdate);
        window.addEventListener('lectureEnded', handleLectureUpdate);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('lectureStarted', handleLectureUpdate);
            window.removeEventListener('lectureEnded', handleLectureUpdate);
        };
    }, []);

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

    const selectAttendanceMethod = async (lectureId, method) => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5000/api/attendance-method/set",
                {
                    lectureId: lectureId,
                    method: method
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("✅ " + res.data.message);
            setSelectedMethod(method);
            
            if (method === "qr") {
                await generateQRForLecture(lectureId);
            }
            
            setTimeout(() => {
                fetchActiveLectures();
            }, 500);
            
        } catch (error) {
            console.log("Error setting attendance method:", error);
            alert("❌ Failed to set attendance method: " + (error.response?.data?.message || error.message));
        }
    };

    const AttendanceMethodCard = ({ method, icon, title, onClick, disabled, isSelected }) => (
        <div 
            style={{
                padding: "20px",
                backgroundColor: isSelected ? "#065f46" : "#1e293b",
                borderRadius: "8px",
                textAlign: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                border: isSelected ? "2px solid #22c55e" : "none",
                transition: "all 0.3s ease"
            }}
            onClick={disabled ? null : onClick}
        >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>{icon}</div>
            <h3 style={{ margin: "0 0 10px 0" }}>{title}</h3>
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
        <div style={{ padding: "20px", backgroundColor: "#1e293b", borderRadius: "8px" }}>
            <h3>📋 Attendance Options</h3>
            
            {activeLectures.map((lecture) => {
                const lectureId = lecture._id || lecture.id;
                const currentMethod = lecture.attendanceMethod || "none";
                
                return (
                    <div key={lectureId} style={{ 
                        marginBottom: "40px", 
                        padding: "20px", 
                        backgroundColor: "#1e293b", 
                        borderRadius: "12px",
                        border: "1px solid #334155"
                    }}>
                        <div style={{ 
                            marginBottom: "20px", 
                            padding: "15px", 
                            backgroundColor: "#065f46", 
                            borderRadius: "8px" 
                        }}>
                            <h4>🟢 Active Lecture: {lecture.title}</h4>
                            <p>Class: {lecture.classId}</p>
                            <p>📱 Attendance method: {currentMethod === "none" ? "Not selected" : currentMethod.toUpperCase()}</p>
                        </div>

                        {/* Method Selection for this specific lecture */}
                        {(currentMethod === "" || currentMethod === "none") && (
                            <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                                gap: "15px", 
                                marginBottom: "20px" 
                            }}>
                                <AttendanceMethodCard
                                    method="manual"
                                    icon="✍️"
                                    title="Manual"
                                    onClick={() => selectAttendanceMethod(lectureId, "manual")}
                                />
                                <AttendanceMethodCard
                                    method="qr"
                                    icon="📱"
                                    title="QR Code"
                                    onClick={() => selectAttendanceMethod(lectureId, "qr")}
                                    disabled={loading}
                                />
                                <AttendanceMethodCard
                                    method="face"
                                    icon="👤"
                                    title="Face"
                                    onClick={() => selectAttendanceMethod(lectureId, "face")}
                                />
                            </div>
                        )}

                        {/* Interface for selected method */}
                        {currentMethod === "manual" && (
                            <div style={{ marginTop: "20px" }}>
                                <h5>✍️ Manual Attendance Marking</h5>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#334155" }}>
                                            <th style={{ padding: "8px", textAlign: "left" }}>Student</th>
                                            <th style={{ padding: "8px", textAlign: "center" }}>Status</th>
                                            <th style={{ padding: "8px", textAlign: "center" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student._id} style={{ borderBottom: "1px solid #334155" }}>
                                                <td style={{ padding: "8px" }}>{student.name}</td>
                                                <td style={{ padding: "8px", textAlign: "center" }}>
                                                    <span style={{ 
                                                        padding: "2px 6px", 
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        backgroundColor: attendanceMap[student._id] === "present" ? "#166534" : "#991b1b"
                                                    }}>
                                                        {attendanceMap[student._id] || "absent"}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "8px", textAlign: "center" }}>
                                                    <button 
                                                        onClick={() => toggleAttendance(student._id, attendanceMap[student._id] || "absent", lectureId, lecture.classId)}
                                                        style={{ padding: "4px 8px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                                                    >Toggle</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {currentMethod === "qr" && qrData && (
                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <h5>📱 Scan QR Code</h5>
                                <img src={qrData} alt="QR Code" style={{ maxWidth: "150px", margin: "10px auto", border: "4px solid white", borderRadius: "8px" }} />
                            </div>
                        )}

                        {currentMethod === "face" && (
                            <div style={{ textAlign: "center", marginTop: "20px", padding: "15px", backgroundColor: "#0f172a", borderRadius: "8px" }}>
                                <h5>👤 Face Recognition Active</h5>
                                <p style={{ color: "#94a3b8" }}>Students can now mark attendance using their registered face.</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TeacherAttendanceOptions;
