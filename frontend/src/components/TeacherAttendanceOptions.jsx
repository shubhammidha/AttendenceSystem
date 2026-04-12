import { useState, useEffect } from "react";
import axios from "axios";

const TeacherAttendanceOptions = () => {
    const [activeLectures, setActiveLectures] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState("");
    const [qrData, setQrData] = useState("");
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});

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
            console.error("Error fetching active lectures:", error);
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
            className="card"
            style={{
                backgroundColor: isSelected ? "#065f46" : "#1e293b",
                textAlign: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                border: isSelected ? "2px solid #22c55e" : "1px solid #334155"
            }}
            onClick={disabled ? null : onClick}
        >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
            <h3 style={{ margin: "0" }}>{title}</h3>
        </div>
    );

    if (activeLectures.length === 0) {
        return (
            <div className="card" style={{ textAlign: "center" }}>
                <h3>📚 No Active Lectures</h3>
                <p style={{ color: "#94a3b8" }}>
                    Start a lecture to enable attendance options
                </p>
            </div>
        );
    }

    return (
        <div className="card">
            <h3>📋 Attendance Options</h3>
            
            {activeLectures.map((lecture) => {
                const lectureId = lecture._id || lecture.id;
                const currentMethod = lecture.attendanceMethod || "none";
                
                return (
                    <div key={lectureId} style={{ marginTop: "1.5rem" }}>
                        <div style={{ 
                            marginBottom: "1rem", 
                            padding: "1rem", 
                            backgroundColor: "#065f46", 
                            borderRadius: "8px" 
                        }}>
                            <h4>🟢 Active: {lecture.title}</h4>
                            <p style={{ fontSize: "0.875rem" }}>Attendance method: {currentMethod.toUpperCase()}</p>
                        </div>

                        {(currentMethod === "" || currentMethod === "none") && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                                <AttendanceMethodCard method="manual" icon="✍️" title="Manual" onClick={() => selectAttendanceMethod(lectureId, "manual")} />
                                <AttendanceMethodCard method="qr" icon="📱" title="QR Code" onClick={() => selectAttendanceMethod(lectureId, "qr")} disabled={loading} />
                                <AttendanceMethodCard method="face" icon="👤" title="Face" onClick={() => selectAttendanceMethod(lectureId, "face")} />
                            </div>
                        )}

                        {currentMethod === "manual" && (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#334155" }}>
                                            <th style={{ padding: "0.5rem", textAlign: "left" }}>Student</th>
                                            <th style={{ padding: "0.5rem", textAlign: "center" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student._id} style={{ borderBottom: "1px solid #334155" }}>
                                                <td style={{ padding: "0.5rem" }}>{student.name}</td>
                                                <td style={{ padding: "0.5rem", textAlign: "center" }}>
                                                    <button onClick={() => toggleAttendance(student._id, attendanceMap[student._id] || "absent", lectureId, lecture.classId)}>Toggle</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {currentMethod === "qr" && qrData && (
                            <div style={{ textAlign: "center", marginTop: "1rem" }}>
                                <h5>📱 Scan QR Code</h5>
                                <img src={qrData} alt="QR Code" style={{ maxWidth: "100%", height: "auto", border: "4px solid white", borderRadius: "8px" }} />
                                <br />
                                <button className="btn-primary" onClick={async () => {
                                    try {
                                        const token = localStorage.getItem("token");
                                        await axios.put(`http://localhost:5000/api/lecture/end/${lectureId}`, {}, {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        alert("Lecture ended");
                                        fetchActiveLectures();
                                        window.dispatchEvent(new CustomEvent('lectureEnded'));
                                    } catch (error) {
                                        alert("Failed: " + error.message);
                                    }
                                }}>🛑 End Lecture</button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TeacherAttendanceOptions;
