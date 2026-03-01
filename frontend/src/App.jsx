import "./App.css";
import Sidebar from "./components/Sidebar/Sidebar";
import GridBoard from "./components/GridBoard/GridBoard";
import MetricsPanel from "./components/MetricsPanel/MetricsPanel";
import { useState, useEffect } from "react";

export default function App() {
  const [locked, setLocked] = useState(false);
  const [grid, setGrid] = useState(Array(5 * 5).fill(0));
  const [robot, setRobot] = useState(Array(5 * 5).fill(0));
  
  const [qTable, setQTable] = useState(Array(25).fill(0));
  const [fullQTable, setFullQTable] = useState(Array(25).fill([0, 0, 0, 0]));
  const [logs, setLogs] = useState(["[00:00:00] Waiting for data..."]);

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
      })
      .catch((err) => console.log("Error fetching metrics:", err));
  };
  
  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar setLocked={setLocked} grid={grid} robot={robot} setRobot={setRobot} fetchMetrics={fetchMetrics} />
      <GridBoard locked={locked} grid={grid} setGrid={setGrid} robot={robot} setRobot={setRobot} />
      <MetricsPanel qTable={qTable} fullQTable={fullQTable} grid={grid} logs={logs} />
    </div>
  );
}
