/**
 * Lecture Management Component
 * 
 * Purpose: Teacher interface for managing lecture sessions
 * 
 * Features:
 * - Start new lectures with title and duration
 * - View currently active lectures with countdown timer
 * - End lectures manually
 * - View lecture history
 * - Real-time updates
 * 
 * State Management:
 * - lectures: Array of teacher's lecture history
 * - activeLectures: Array of currently active lectures
 * - loading: Loading state for API calls
 * - formData: Form data for starting new lecture
 * 
 * API Integration:
 * - POST /api/lecture/start - Start lecture
 * - GET /api/lecture/active/:classId - Get active lectures
 * - PUT /api/lecture/end/:lectureId - End lecture
 * - GET /api/lecture/history - Get lecture history
 * 
 * Usage:
 * - Rendered only for teacher role in Dashboard
 * - Provides complete lecture lifecycle management
 * - Updates in real-time as lectures start/end
 * 
 * Styling:
 * - Professional dark theme
 * - Color-coded sections (green for active, blue for history)
 * - Responsive layout with clear visual hierarchy
 */

import React, { useState, useEffect } from "react";
import axios from "axios";

const LectureManagement = () => {
    const [lectures, setLectures] = useState([]);
    const [activeLectures, setActiveLectures] = useState([]);
    const [otherTeacherLectures, setOtherTeacherLectures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        classId: "69c188592fda59eb47432e5c"
    });

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchActiveLectures();
        fetchTeacherLectures();
        fetchAllActiveLectures();
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchActiveLectures();
            fetchAllActiveLectures();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

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

    const fetchTeacherLectures = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(
                "http://localhost:5000/api/lecture/history",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log("Teacher lectures response:", res.data);
            setLectures(res.data.lectures || []);
        } catch (error) {
            console.log("Error fetching teacher lectures:", error);
            // Set empty array to prevent undefined errors
            setLectures([]);
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

        // Check if ANY teacher is already active (including current teacher)
        if (activeLectures.length > 0) {
            const activeTeacher = activeLectures[0];
            alert(`⚠️ Cannot start lecture. ${activeTeacher.teacher.name || 'A teacher'} is already taking "${activeTeacher.title}". Please wait for the current lecture to finish.`);
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
            fetchTeacherLectures();
            
        } catch (error) {
            console.log("Start lecture error:", error);
            alert("❌ Failed to start lecture: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const endLecture = async (lectureId) => {
        console.log("Lectures automatically end after 50 minutes");
    };

    return (
        <div style={{ marginTop: "40px", textAlign: "center" }}>
            <h3>🎓 Lecture Management</h3>
            
            {/* Start New Lecture - Only show if no active lectures */}
            {activeLectures.length === 0 && (
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
                        disabled={loading || !formData.title.trim()}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: loading ? "#ccc" : "#22c55e",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        {loading ? "Starting..." : "🚀 Start Lecture (50 min)"}
                    </button>
                </div>
            )}

            {/* Other Teachers' Active Lectures */}
            {otherTeacherLectures.length > 0 && (
                <div style={{ 
                    marginBottom: "30px", 
                    padding: "20px", 
                    backgroundColor: "#dc2626", 
                    borderRadius: "8px" 
                }}>
                    <h4>⚠️ Other Teachers' Active Lectures</h4>
                    <p style={{ color: "#fca5a5", marginBottom: "15px" }}>
                        Cannot start new lecture while other teachers are conducting classes
                    </p>
                    {otherTeacherLectures.map((lecture) => (
                        <div key={lecture._id} style={{ 
                            marginTop: "10px", 
                            padding: "10px", 
                            backgroundColor: "#991b1b", 
                            borderRadius: "4px" 
                        }}>
                            <strong>👨‍🏫 {lecture.teacher.name}</strong>
                            <br />
                            📚 {lecture.title}
                            <br />
                            <small style={{ color: "#fca5a5" }}>
                                Started: {new Date(lecture.startTime).toLocaleTimeString()}
                            </small>
                        </div>
                    ))}
                </div>
            )}

            {/* Active Lectures */}
            {activeLectures.length > 0 && (
                <div style={{ 
                    marginBottom: "30px", 
                    padding: "20px", 
                    backgroundColor: "#065f46", 
                    borderRadius: "8px" 
                }}>
                    <h4>🟢 Active Lectures</h4>
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
                        </div>
                    ))}
                </div>
            )}

            {/* Lecture History */}
            {lectures && lectures.length > 0 && (
                <div style={{ 
                    padding: "20px", 
                    backgroundColor: "#1e293b", 
                    borderRadius: "8px" 
                }}>
                    <h4>📚 Recent Lectures</h4>
                    {lectures.slice(0, 5).map((lecture) => (
                        <div key={lecture._id} style={{ 
                            marginTop: "10px", 
                            padding: "10px", 
                            backgroundColor: "#334155", 
                            borderRadius: "4px",
                            textAlign: "left"
                        }}>
                            <strong>{lecture.title}</strong>
                            <br />
                            <small>
                                Class: {lecture.classId} | 
                                Started: {new Date(lecture.startTime).toLocaleString()}
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LectureManagement;
