import { useState, useEffect } from "react";
import axios from "axios";

const LectureManagement = () => {
    const [activeLectures, setActiveLectures] = useState([]);
    const [teacherActiveLectures, setTeacherActiveLectures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        classId: ""
    });

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchTeacherClasses();
        fetchTeacherActiveLectures();
        const interval = setInterval(() => {
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

    useEffect(() => {
        if (formData.classId) {
            fetchActiveLectures();
        }
    }, [formData.classId]);

    const fetchActiveLectures = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/lecture/active/${formData.classId}`);
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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeacherActiveLectures(res.data.activeLectures || []);
        } catch (error) {
            console.error("Error fetching teacher active lectures:", error);
            setTeacherActiveLectures([]);
        }
    };

    const startLecture = async () => {
        if (!formData.title) {
            alert("Please enter lecture title");
            return;
        }

        if (teacherActiveLectures.length > 0) {
            alert(`⚠️ Already active: "${teacherActiveLectures[0].title}".`);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                "http://localhost:5000/api/lecture/start",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("✅ " + res.data.message);
            setFormData({ ...formData, title: "" });
            fetchActiveLectures();
            fetchTeacherActiveLectures();
            window.dispatchEvent(new CustomEvent('lectureStarted'));
        } catch (error) {
            alert("❌ Failed: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const endLecture = async (lectureId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5000/api/lecture/end/${lectureId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Ended");
            fetchTeacherActiveLectures();
            window.dispatchEvent(new CustomEvent('lectureEnded'));
            fetchActiveLectures();
        } catch (error) {
            alert("❌ Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>🎓 Lecture Management</h3>
            
            <div style={{ marginBottom: "1rem" }}>
                <select 
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="form-input"
                    style={{ background: "#0f172a", color: "white" }}
                >
                    {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.className} - {c.subject}</option>
                    ))}
                </select>
            </div>
            
            <div className="card" style={{ border: "1px solid #334155" }}>
                <h3>Start New Lecture</h3>
                <input
                    type="text"
                    placeholder="Lecture Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                    style={{ background: "#0f172a", color: "white" }}
                />
                <button
                    onClick={startLecture}
                    disabled={loading || !formData.title.trim() || !formData.classId}
                    className="btn-primary"
                >
                    {loading ? "Starting..." : "🚀 Start Lecture"}
                </button>
            </div>

            {activeLectures.length > 0 && (
                <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#065f46", borderRadius: "8px" }}>
                    <h4>🟢 Active Lecture</h4>
                    {activeLectures.map((lecture) => (
                        <div key={lecture.id} style={{ marginTop: "0.5rem" }}>
                            <strong>{lecture.title}</strong>
                            <button
                                onClick={() => endLecture(lecture.id)}
                                className="btn-primary"
                                style={{ backgroundColor: "#dc2626", marginTop: "0.5rem" }}
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
