import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import GridBoard from "./components/GridBoard/GridBoard";
import MetricsPanel from "./components/MetricsPanel/MetricsPanel";
import DQNVisualizer from "./components/DQNVisualizer/DQNVisualizer";
import { useState, useEffect } from "react";

export default function App() {
  const [locked, setLocked] = useState(false);
  const [grid, setGrid] = useState(Array(5 * 5).fill(0));
  const [robot, setRobot] = useState(Array(5 * 5).fill(0));
  const [btStatus, setBtStatus] = useState("offline");
  
  const [qTable, setQTable] = useState(Array(25).fill(0));
  const [fullQTable, setFullQTable] = useState(Array(25).fill([0, 0, 0, 0]));
  const [logs, setLogs] = useState(["[00:00:00] Waiting for data..."]);
  const [trainingMetrics, setTrainingMetrics] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/getgrid`)
      .then((res) => res.json())
      .then((data) => setGrid(data.grid))
      .catch((error) => console.log("Error: ", error));
  }, []);

  const fetchMetrics = () => {
    fetch(`${import.meta.env.VITE_API_URL}/metrics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.q_table) setQTable(data.q_table);
        if (data.full_q_table) setFullQTable(data.full_q_table);
        if (data.logs) setLogs(data.logs);
        if (data.metrics) setTrainingMetrics(data.metrics);
      })
      .catch((err) => console.log("Error fetching metrics:", err));
  };
  
  useEffect(() => {
    fetchMetrics();
    
    // Poll robot state every 500ms
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/robot_state`)
        .then((res) => res.json())
        .then((data) => {
          if (data.robot) setRobot(data.robot);
          if (data.bt_status) setBtStatus(data.bt_status);
          
          // Lock UI if exploration is active
          // Only change lock state if needed to prevent constant re-renders
          if (data.is_exploring !== undefined) {
             setLocked(data.is_exploring);
          }
        })
        .catch((err) => console.log("State polling error:", err));
        
       // Also periodically update logs during exploration
       fetchMetrics(); 
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar setLocked={setLocked} grid={grid} robot={robot} setRobot={setRobot} fetchMetrics={fetchMetrics} btStatus={btStatus} setBtStatus={setBtStatus} />
      <div className="main-content-area">
        <GridBoard locked={locked} grid={grid} setGrid={setGrid} robot={robot} setRobot={setRobot} btStatus={btStatus} />
        <DQNVisualizer metrics={trainingMetrics} />
      </div>
      <MetricsPanel qTable={qTable} fullQTable={fullQTable} grid={grid} logs={logs} />
    </div>
  );
}
