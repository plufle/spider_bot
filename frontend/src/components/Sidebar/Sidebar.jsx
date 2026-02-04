import "./Sidebar.css";
import ActionButton from "../ActionButton/ActionButton";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">Spider RL</h2>

      <div className="actions">
        <ActionButton text="Start Exploration" primary />
        <ActionButton text="Train Q-Learning" />
        <ActionButton text="Connect Robot" />
      </div>

      <div className="battery">
        <p>Battery 84%</p>
        <div className="battery-bar">
          <div className="battery-fill" />
        </div>
      </div>
    </aside>
  );
}
