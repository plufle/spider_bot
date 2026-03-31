import "./Sidebar.css";
import ActionButton from "../ActionButton/ActionButton";

export default function Sidebar({ setLocked, grid, robot, setRobot, fetchMetrics, btStatus, setBtStatus }) {
  return (
    <aside className="sidebar">
      <h2 className="logo">Spider RL</h2>

      <div className="actions">
        <ActionButton text="Start Exploration" primary actionType="explore" setLocked={setLocked} grid={grid} robot={robot} setRobot={setRobot} fetchMetrics={fetchMetrics} />
        <ActionButton text="Train Q-Learning" actionType="train" setLocked={setLocked} grid={grid} fetchMetrics={fetchMetrics} />
        <ActionButton text={btStatus === "online" ? "Robot Connected" : "Connect Robot"} actionType="connect" setLocked={setLocked} fetchMetrics={fetchMetrics} />
      </div>

    </aside>
  );
}
