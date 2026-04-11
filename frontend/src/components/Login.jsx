import {useState} from "react";
import axios from "axios";

const Login = ({ setIsLoggedIn, setIsRegistered }) => {
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

            if (res.data.user && res.data.user._id) {
              localStorage.setItem("userId", res.data.user._id);
              localStorage.setItem("userRole", res.data.user.role || "student"); 
              setIsLoggedIn(true); 
            } else {
              alert("Login failed: Invalid user data");
            }
        } catch (error){
            console.error(error);
            alert("Login failed: " + (error.response?.data?.message || error.message));
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
        <h1 style={{ color: "white", textAlign: "center" }}>Login</h1>

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

        <p 
          style={{ 
            color: "#94a3b8", 
            textAlign: "center", 
            marginTop: "20px", 
            cursor: "pointer" 
          }}
          onClick={() => setIsRegistered(false)}
        >
          Don't have an account? Register
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