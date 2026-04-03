import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );
  const [showLogin, setShowLogin] = useState(false); // false = show register, true = show login

  return isLoggedIn ? (
    <Dashboard />
  ) : showLogin ? (
    <Login setIsLoggedIn={setIsLoggedIn} setShowLogin={setShowLogin} />
  ) : (
    <Register setShowLogin={setShowLogin} />
  );
}

export default App;