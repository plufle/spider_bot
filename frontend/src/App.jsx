import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import GridBoard from "./components/GridBoard/GridBoard";
import MetricsPanel from "./components/MetricsPanel/MetricsPanel";
import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/status`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status));
  }, []);

  console.log("Server Status: ", status);
  return (
    <div className="app-layout">
      <Sidebar />
      <GridBoard />
      <MetricsPanel />
    </div>
  );
}
