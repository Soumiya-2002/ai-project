import React, { useEffect } from "react";
import AppRoutes from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initializeSampleData } from "./utils/sampleData";

function App() {
  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
  }, []);

  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  );
}

export default App;
