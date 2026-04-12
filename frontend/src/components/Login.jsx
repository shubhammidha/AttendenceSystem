import {useState} from "react";
import axios from "axios";
import Layout from "./Layout";

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

              let displayName = res.data.user.name || "User";
              if (displayName.toLowerCase().includes("user") || displayName.toLowerCase().includes("teacher")) {
                displayName = res.data.user.email.split("@")[0];
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              }

              localStorage.setItem("userName", displayName);
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
    <Layout centered={true}>
      <div className="card" style={{ maxWidth: "350px" }}>
        <h1 style={{ color: "white", textAlign: "center", fontSize: "2rem" }}>Login</h1>

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

        <button onClick={handleLogin} className="btn-primary">
          Login
        </button>

        <p 
          style={{ 
            color: "#94a3b8", 
            textAlign: "center", 
            marginTop: "1.5rem", 
            cursor: "pointer" 
          }}
          onClick={() => setIsRegistered(false)}
        >
          Don't have an account? Register
        </p>
      </div>
    </Layout>
  );
};

export default Login;