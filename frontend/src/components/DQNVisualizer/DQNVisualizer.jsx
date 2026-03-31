import "./DQNVisualizer.css";

export default function DQNVisualizer({ metrics }) {
  if (!metrics) {
    return (
      <div className="dqn-visualizer">
        <div className="dqn-header">
          <h2>Deep Q-Network Internals</h2>
        </div>
        <p className="dqn-placeholder">Waiting for training data...</p>
      </div>
    );
  }

  const { architecture, loss_history, memory_size, recent_memory } = metrics;
  
  // Calculate a simplified loss curve if there's history
  const recentLosses = loss_history ? loss_history.slice(-20) : [];
  const maxLoss = recentLosses.length > 0 ? Math.max(...recentLosses) : 1;

  return (
    <div className="dqn-visualizer">
      <div className="dqn-header">
        <h2>Deep Q-Network Internals</h2>
      </div>
      
      <div className="dqn-panels">
        {/* Network Architecture Panel */}
        <div className="dqn-panel network-panel">
          <h3>Neural Network</h3>
          <div className="network-flow">
            <div className="nn-layer input-layer">
              <span className="layer-name">Input Layer</span>
              <span className="layer-size">Map (25) + Pos (25)</span>
            </div>
            <div className="nn-arrow">➡</div>
            <div className="nn-layer hidden-layer">
              <span className="layer-name">Hidden 1</span>
              <span className="layer-size">64 Neurons (ReLU)</span>
            </div>
            <div className="nn-arrow">➡</div>
            <div className="nn-layer hidden-layer">
              <span className="layer-name">Hidden 2</span>
              <span className="layer-size">64 Neurons (ReLU)</span>
            </div>
            <div className="nn-arrow">➡</div>
            <div className="nn-layer output-layer">
              <span className="layer-name">Output Layer</span>
              <span className="layer-size">4 Q-Values (Actions)</span>
            </div>
          </div>
          <p className="architecture-text">Architecture: {architecture}</p>
        </div>

        {/* Experience Replay Memory Panel */}
        <div className="dqn-panel memory-panel">
          <h3>Replay Memory Map</h3>
          <div className="memory-stats">
            <div className="stat-box">
              <span className="stat-label">Buffer Size</span>
              <span className="stat-value">{memory_size} / 2000</span>
            </div>
          </div>
          
          <div className="memory-list-container">
            <h4>Experience Log</h4>
            {recent_memory && recent_memory.length > 0 ? (
              <ul className="memory-list">
                {recent_memory.slice().reverse().map((exp, idx) => (
                  <li key={idx} className="memory-item">
                    <span className="exp-badge coord">{exp.coord}</span>
                    <span className="exp-badge action">{exp.action}</span>
                    <span className={`exp-badge reward ${exp.reward > 0 ? 'positive' : 'negative'}`}>Reward: {exp.reward}</span>
                    <span className={`exp-badge done ${exp.done ? 'is-done' : ''}`}>{exp.done ? "Terminal" : "Step"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-data">No experiences gathered yet.</p>
            )}
          </div>
        </div>

        {/* Loss Graph Panel */}
        <div className="dqn-panel loss-panel">
          <h3>Training Loss</h3>
          {recentLosses.length > 0 ? (
            <div className="mini-chart">
              {recentLosses.map((loss, idx) => {
                const heightPct = Math.max(5, (loss / maxLoss) * 100);
                return (
                  <div 
                    key={idx} 
                    className="chart-bar" 
                    style={{ height: `${heightPct}%` }}
                    title={`Loss: ${loss.toFixed(4)}`}
                  ></div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">Train to see loss reduction</p>
          )}
          {loss_history && loss_history.length > 0 && (
             <p className="loss-value">Latest Loss: {loss_history[loss_history.length - 1].toFixed(4)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
