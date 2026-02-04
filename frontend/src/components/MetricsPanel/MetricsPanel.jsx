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
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Position</span>
            <span className="stat-value">(2,2)</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Reward</span>
            <span className="stat-value positive">+15.5</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Episode</span>
            <span className="stat-value">42</span>
          </div>
        </div>
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
