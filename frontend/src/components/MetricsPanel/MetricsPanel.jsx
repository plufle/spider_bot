import "./MetricsPanel.css";
import Heatmap from "../Heatmap/Heatmap";
import Logs from "../Logs/Logs";

export default function MetricsPanel() {
  return (
    <aside className="metrics">
      <div className="metrics-header">
        <h2>System Metrics</h2>
      </div>

      <div className="metrics-section">
        <h3>Q-Value Heatmap</h3>
        <Heatmap />
      </div>

      <div className="metrics-section">
        <h3>Activity Logs</h3>
        <Logs />
      </div>
    </aside>
  );
}
