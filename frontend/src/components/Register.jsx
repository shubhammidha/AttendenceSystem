import { useState } from "react";
import axios from "axios";
import Layout from "./Layout";

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

            alert("Registration successful! Please login.");
            setIsRegistered(true);
        } catch (error) {
            alert("Registration failed: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <Layout centered={true}>
          <div className="card" style={{ maxWidth: "350px" }}>
            <h1 style={{ color: "white", textAlign: "center", marginBottom: "1.5rem", fontSize: "2rem" }}>
              Create Account
            </h1>

            <input
              type="text"
              name="name"
              placeholder="Enter name"
              onChange={handleChange}
              className="form-input"
            />

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              onChange={handleChange}
              className="form-input"
            />

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              onChange={handleChange}
              className="form-input"
            />

            <select
              name="role"
              onChange={handleChange}
              value={form.role}
              className="form-input"
              style={{ background: "#334155", color: "white" }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>

            <button onClick={handleRegister} className="btn-primary">
              Register
            </button>

            <p 
              style={{ 
                color: "#94a3b8", 
                textAlign: "center", 
                marginTop: "1.5rem", 
                cursor: "pointer" 
              }}
              onClick={() => setIsRegistered(true)}
            >
              Already have an account? Login
            </p>
          </div>
        </Layout>
    );
};

export default Register;
