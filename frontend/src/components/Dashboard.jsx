import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Legend, Cell, ResponsiveContainer } from "recharts";
import LectureManagement from "./LectureManagement";
import TeacherAttendanceOptions from "./TeacherAttendanceOptions";
import StudentAttendance from "./StudentAttendance";
import LectureHistory from "./LectureHistory";
import Layout from "./Layout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });

  const [userRole, setUserRole] = useState("student");
  const [userName, setUserName] = useState("User");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchStats();

    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
    }

    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
    }

    const handleAttendanceMarked = () => {
      fetchStats();
    };

    window.addEventListener('attendanceMarked', handleAttendanceMarked);

    return () => {
      window.removeEventListener('attendanceMarked', handleAttendanceMarked);
    };
  }, []);

  const fetchStats = async () => {
    try {
      if(!userId){
        return;
      }

      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/attendance/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const data = [
    { name: "Present", value: stats.present },
    { name: "Absent", value: stats.absent }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.reload(); 
  };

  return (
    <Layout>
      <div style={{ color: "white", padding: "2rem 0" }}>
        <div style={{ 
          display: "flex", 
          flexDirection: window.innerWidth < 640 ? "column" : "row",
          justifyContent: "space-between", 
          alignItems: window.innerWidth < 640 ? "flex-start" : "center",
          marginBottom: "2rem",
          gap: "1rem"
        }}>
          <div>
            <h1 style={{ textAlign: "left", fontSize: "2rem", margin: 0 }}>
              Welcome, {userName}
            </h1>
            <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
              {userRole === "teacher" ? "👨‍🏫 Teacher" : "👨‍🎓 Student"} Portal
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            🚪 Logout
          </button>
        </div>

        {userRole === "teacher" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <LectureManagement />
            <TeacherAttendanceOptions />
            <LectureHistory />
          </div>
        )}

        {userRole === "student" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
            {[
                { title: "Total Classes", value: stats.totalClasses },
                { title: "Present", value: stats.present },
                { title: "Absent", value: stats.absent },
                { title: "Attendance %", value: `${stats.percentage}%` }
            ].map((stat, i) => (
                <div key={i} className="card" style={{ textAlign: "center" }}>
                    <h2>{stat.title}</h2>
                    <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>{stat.value}</p>
                </div>
            ))}
          </div>
        )}

        {userRole === "student" && (
          <div style={{ marginTop: "3rem", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" outerRadius={80} label>
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {userRole === "student" && (
          <div style={{ marginTop: "2.5rem" }}>
            <StudentAttendance />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;