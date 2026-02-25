import "./Sidebar.css";
import ActionButton from "../ActionButton/ActionButton";
export default function Sidebar({ setLocked, grid }) {
  return (
    <aside className="sidebar">
      <h2 className="logo">Spider RL</h2>

      <div className="actions">
        <ActionButton text="Start Exploration" primary setLocked={setLocked} grid={grid} />
        <ActionButton text="Train Q-Learning" />
        <ActionButton text="Connect Robot" />
      </div>

    </aside>
  );
}
