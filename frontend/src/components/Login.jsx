import React, {useState} from "react";
import axios from "axios";

const Login = ({ setIsLoggedIn }) => {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleLogin = async () => {
        try{
            const res = await axios.post(
                "http://localhost:5000/api/auth/login",
                form
            );

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("userId", res.data.user_id);

            setIsLoggedIn(true);
        } catch (error){
            console.log(error);
            alert("Login failed!");
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
        <h1 style={{ color: "white", textAlign: "center" }}>Student Login</h1>

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

        <button onClick={handleLogin} style={buttonStyle}>
          Login
        </button>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "20px",
  borderRadius: "8px",
  border: "none"
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

export default Login;