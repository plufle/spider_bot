import "./MetricsPanel.css";
import Heatmap from "../Heatmap/Heatmap";
import Logs from "../Logs/Logs";
import BestRoute from "./BestRoute";

export default function MetricsPanel({ qTable, fullQTable, grid, logs }) {
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

      {fullQTable && (
        <div className="metrics-section">
          <h3>Best Route Policy</h3>
          <BestRoute fullQTable={fullQTable} grid={grid} />
        </div>
      )}
    </aside>
  );
}
