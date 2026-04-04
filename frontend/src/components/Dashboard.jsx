import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Legend, Cell } from "recharts";
import QRGenerator from "./QRGenerator";
import QRScanner from "./QRScanner";
import FaceRegister from "./FaceRegister";
import FaceAttendance from "./FaceAttendance";
import LectureManagement from "./LectureManagement";
import TeacherAttendanceOptions from "./TeacherAttendanceOptions";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });

  const [userRole, setUserRole] = useState("student"); // Get user role
  const [userName, setUserName] = useState(""); // Get user name
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchStats();
    // Get role from localStorage (saved during login)
    const savedRole = localStorage.getItem("userRole");
    if (savedRole) {
      setUserRole(savedRole);
      console.log("User role from localStorage:", savedRole);
    } else {
      console.log("No role found, defaulting to student");
    }
  }, []);

  const fetchStats = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if(!userId){
        console.log("No userId found in localStorage");
        return;
      }

      const res = await axios.get(
        `http://localhost:5000/api/attendance/stats/${userId}`
      );
      setStats(res.data);
    } catch (error) {
      console.log(error);
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
    window.location.reload(); // Force reload to clear state
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px"
      }}
    >
      {/* Header with Logout */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <div>
          <h1 style={{ textAlign: "left", fontSize: "40px", margin: 0 }}>
            {userRole === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
          </h1>
          <p style={{ color: "#94a3b8", margin: "5px 0 0 0" }}>
            {userRole === "teacher" ? "👨‍🏫" : "👨‍🎓"} {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Teacher-specific features */}
      {userRole === "teacher" && (
        <>
          <LectureManagement />
          <TeacherAttendanceOptions />
        </>
      )}

      {/* Stats Cards - Only for students */}
      {userRole === "student" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "30px",
            flexWrap: "wrap"
          }}
        >
          <div style={cardStyle}>
            <h2>Total Classes</h2>
            <p>{stats.totalClasses}</p>
          </div>

          <div style={cardStyle}>
            <h2>Present</h2>
            <p>{stats.present}</p>
          </div>

          <div style={cardStyle}>
            <h2>Absent</h2>
            <p>{stats.absent}</p>
          </div>

          <div style={cardStyle}>
            <h2>Attendance %</h2>
            <p>{stats.percentage}%</p>
          </div>
        </div>
      )}

      {/* Pie Chart - Only for students */}
      {userRole === "student" && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "50px"
          }}
        >
          <PieChart width={450} height={400}>
            <Pie data={data} dataKey="value" outerRadius={130} label>
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}

      {/* Student-only features */}
      {userRole === "student" && (
        <>
          {/* QR SCANNER ONLY */}
          <div style={{ marginTop: "60px", textAlign: "center" }}>
            <h2>QR Attendance</h2>
            <QRScanner />
          </div>

          {/* FACE RECOGNITION SECTION */}
          <div style={{ marginTop: "60px", textAlign: "center" }}>
            <h2>Face Recognition</h2>
            <FaceRegister />
          </div>
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <FaceAttendance />
          </div>
        </>
      )}

      {/* Teacher-only features would go here */}
    </div>
  );
};

const cardStyle = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "12px",
  width: "220px",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
};


export default Dashboard;