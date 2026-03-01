import "./MetricsPanel.css";
import Heatmap from "../Heatmap/Heatmap";
import Logs from "../Logs/Logs";
import { useState, useEffect } from "react";

export default function MetricsPanel() {
  const [qTable, setQTable] = useState(Array(25).fill(0));
  const [logs, setLogs] = useState(["[00:00:00] Waiting for data..."]);

  useEffect(() => {
    const fetchMetrics = () => {
      fetch(`${import.meta.env.VITE_API_URL}/metrics`)
        .then((res) => res.json())
        .then((data) => {
          if (data.q_table) setQTable(data.q_table);
          if (data.logs) setLogs(data.logs);
        })
        .catch((err) => console.log("Error fetching metrics:", err));
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="metrics">
      <div className="metrics-header">
        <h2>System Metrics</h2>
      </div>

      <div className="metrics-section">
        <h3>Q-Value Heatmap</h3>
        <Heatmap values={qTable} />
      </div>

      <div className="metrics-section">
        <h3>Activity Logs</h3>
        <Logs logs={logs} />
      </div>
    </aside>
  );
}
