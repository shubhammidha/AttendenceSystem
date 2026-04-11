/**
 * Lecture Management Component
 * 
 * Purpose: Teacher interface for managing lecture sessions
 * 
 * Features:
 * - Start new lectures with title and duration
 * - View currently active lectures with countdown timer
 * - End lectures manually
 * - Real-time updates
 */

import { useState, useEffect } from "react";
import axios from "axios";

const LectureManagement = () => {
    const [activeLectures, setActiveLectures] = useState([]);
    const [teacherActiveLectures, setTeacherActiveLectures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [otherTeacherLectures, setOtherTeacherLectures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        classId: ""
    });

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchTeacherClasses();
        fetchTeacherActiveLectures();
        fetchAllActiveLectures();
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchAllActiveLectures();
            fetchTeacherActiveLectures();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchTeacherClasses = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/class/teacher", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, classId: res.data[0]._id }));
            }
        } catch (error) {
            console.log("Error fetching teacher classes:", error);
        }
    };

    // Use a separate effect to fetch active lectures when classId changes
    useEffect(() => {
        if (formData.classId) {
            fetchActiveLectures();
        }
    }, [formData.classId]);

    const fetchActiveLectures = async () => {
        try {
            const res = await axios.get(
                `http://localhost:5000/api/lecture/active/${formData.classId}`
            );
            setActiveLectures(res.data.activeLectures);
        } catch (error) {
            console.log("Error fetching active lectures:", error);
        }
    };

    const fetchTeacherActiveLectures = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                "http://localhost:5000/api/lecture/teacher-active",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setTeacherActiveLectures(res.data.activeLectures || []);
        } catch (error) {
            console.error("Error fetching teacher active lectures:", error);
            setTeacherActiveLectures([]);
        }
    };

    const fetchAllActiveLectures = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                "http://localhost:5000/api/lecture/active-all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Filter out current teacher's lectures
            const otherLectures = res.data.activeLectures.filter(
                lecture => lecture.teacher._id !== userId
            );
            setOtherTeacherLectures(otherLectures);
        } catch (error) {
            console.log("Error fetching all active lectures:", error);
            setOtherTeacherLectures([]);
        }
    };

    const startLecture = async () => {
        if (!formData.title) {
            alert("Please enter lecture title");
            return;
        }

        // Validation: Prevent starting if already has an active lecture
        if (teacherActiveLectures.length > 0) {
            alert(`⚠️ You already have an active lecture: "${teacherActiveLectures[0].title}".\nPlease end it before starting a new one.`);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5000/api/lecture/start",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("✅ " + res.data.message);
            setFormData({ ...formData, title: "" });
            fetchActiveLectures();
            fetchTeacherActiveLectures();
            
            // Trigger update in TeacherAttendanceOptions
            window.dispatchEvent(new CustomEvent('lectureStarted', { 
                detail: { classId: formData.classId } 
            }));
            
        } catch (error) {
            console.log("Start lecture error:", error);
            alert("❌ Failed to start lecture: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const endLecture = async (lectureId) => {
        if (!lectureId) {
            alert("Please provide lecture ID");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(
                `http://localhost:5000/api/lecture/end/${lectureId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("✅ " + res.data.message);
            fetchTeacherActiveLectures();
            
            // Also refresh the TeacherAttendanceOptions component
            window.dispatchEvent(new CustomEvent('lectureEnded', { 
                detail: { lectureId: lectureId } 
            }));
            
            // Immediate refresh for this component
            fetchActiveLectures();
            
        } catch (error) {
            console.log("End lecture error:", error);
            alert("❌ Failed to end lecture: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h3>🎓 Lecture Management</h3>
            
            {/* Class Selection */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                <span>Select Class:</span>
                <select 
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    style={{
                        padding: "8px",
                        borderRadius: "4px",
                        backgroundColor: "#1e293b",
                        color: "white",
                        border: "1px solid #475569"
                    }}
                >
                    {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.className} - {c.subject}</option>
                    ))}
                    {classes.length === 0 && <option value="">No classes found</option>}
                </select>
            </div>
            
            {/* Start New Lecture - Form is always visible, validation happens on click */}
            <div style={{ 
                marginBottom: "30px", 
                padding: "20px", 
                backgroundColor: "#1e293b", 
                borderRadius: "8px" 
            }}>
                <h3>Start New Lecture</h3>
                <div style={{ marginBottom: "15px" }}>
                    <input
                        type="text"
                        placeholder="Lecture Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "4px",
                            border: "1px solid #475569",
                            backgroundColor: "#0f172a",
                            color: "white",
                            fontSize: "16px"
                        }}
                    />
                </div>
                <button
                    onClick={startLecture}
                    disabled={loading || !formData.title.trim() || !formData.classId}
                    style={{
                        padding: "12px 24px",
                        backgroundColor: (loading || !formData.classId) ? "#ccc" : "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (loading || !formData.classId) ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "Starting..." : "🚀 Start Lecture (50 min)"}
                </button>
            </div>

            {/* Active Lectures for Selected Class */}
            {activeLectures.length > 0 && (
                <div style={{ 
                    marginBottom: "30px", 
                    padding: "20px", 
                    backgroundColor: "#065f46", 
                    borderRadius: "8px" 
                }}>
                    <h4>🟢 Active Lecture for {classes.find(c => c._id === formData.classId)?.className}</h4>
                    {activeLectures.map((lecture) => (
                        <div key={lecture.id} style={{ 
                            marginTop: "10px", 
                            padding: "10px", 
                            backgroundColor: "#064e3b", 
                            borderRadius: "4px" 
                        }}>
                            <strong>{lecture.title}</strong> by {lecture.teacher}
                            <br />
                            <small>Time remaining: {lecture.timeRemaining} minutes</small>
                            <br />
                            <button
                                onClick={() => endLecture(lecture.id)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#dc2626",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    marginTop: "10px"
                                }}
                            >
                                🛑 End Lecture
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LectureManagement;
