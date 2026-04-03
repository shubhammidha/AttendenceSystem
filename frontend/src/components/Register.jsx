import React, { useState } from "react";
import axios from "axios";

const Register = ({ setIsRegistered }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "student"
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async () => {
        try {
            const res = await axios.post(
                "http://localhost:5000/api/auth/register",
                form
            );

            alert("✅ Registration successful! Please login.");
            setIsRegistered(true); // Switch to login
            
        } catch (error) {
            console.log(error);
            alert("❌ Registration failed: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0f172a",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: "40px",
              borderRadius: "12px",
              width: "350px"
            }}
          >
            <h1 style={{ color: "white", textAlign: "center", marginBottom: "30px" }}>
              Create Account
            </h1>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              onChange={handleChange}
              style={inputStyle}
            />

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              onChange={handleChange}
              style={inputStyle}
            />

            <select
              name="role"
              onChange={handleChange}
              value={form.role}
              style={inputStyle}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>

            <button onClick={handleRegister} style={buttonStyle}>
              Register
            </button>

            <p style={{ 
              color: "#ccc", 
              textAlign: "center", 
              marginTop: "20px",
              fontSize: "14px"
            }}>
              Already have an account? 
              <span 
                onClick={() => setIsRegistered(true)}
                style={{ color: "#22c55e", cursor: "pointer" }}
              >
                {" "}Login here
              </span>
            </p>
          </div>
        </div>
    );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#374151",
  color: "white"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  borderRadius: "8px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontSize: "16px",
  cursor: "pointer"
};

export default Register;
