import { useState, useEffect } from "react";
import axios from "axios";

const LectureHistory = () => {
    const [lectures, setLectures] = useState([]);

    useEffect(() => {
        fetchTeacherLectures();
        // Refresh when a lecture ends (optional, can use events)
        window.addEventListener('lectureEnded', fetchTeacherLectures);
        return () => window.removeEventListener('lectureEnded', fetchTeacherLectures);
    }, []);

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
            setLectures(res.data.lectures || []);
        } catch (error) {
            console.error("Error fetching teacher lectures:", error);
            setLectures([]);
        }
    };

    if (!lectures || lectures.length === 0) return null;

    return (
        <div style={{ 
            marginTop: "30px",
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
    );
};

export default LectureHistory;
