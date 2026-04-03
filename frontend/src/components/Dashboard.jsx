import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Tooltip, Legend, Cell } from "recharts";
import QRGenerator from "./QRGenerator";
import QRScanner from "./QRScanner";
import FaceRegister from "./FaceRegister";
import FaceAttendance from "./FaceAttendance";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });

  useEffect(() => {
    fetchStats();
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

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      padding: "30px"
    }}
  >
    <h1 style={{ textAlign: "center", fontSize: "50px" }}>
      Attendance Dashboard
    </h1>

    {/* Stats Cards */}
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

    {/* Pie Chart */}
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

    {/* QR SECTION */}
    <div style={{ marginTop: "60px", textAlign: "center" }}>
      <h2>QR Attendance</h2>
      <QRGenerator />
    </div>
    <div style={{ marginTop: "40px", textAlign: "center" }}>
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