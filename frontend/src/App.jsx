import React, { useState } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  return isLoggedIn ? (
    <Dashboard />
  ) : (
    <Login setIsLoggedIn={setIsLoggedIn} />
  );
}

export default App;