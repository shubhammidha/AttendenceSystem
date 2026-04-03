import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );
  const [isRegistered, setIsRegistered] = useState(true);

  return isLoggedIn ? (
    <Dashboard />
  ) : isRegistered ? (
    <Login setIsLoggedIn={setIsLoggedIn} setIsRegistered={setIsRegistered} />
  ) : (
    <Register setIsRegistered={setIsRegistered} />
  );
}

export default App;