import "./Sidebar.css";
import ActionButton from "../ActionButton/ActionButton";
import { useState } from "react";
export default function Sidebar() {
  const [locked,setLocked] = useState(false);
  return (
    <aside className="sidebar">
      <h2 className="logo">Spider RL</h2>

      <div className="actions">
        <ActionButton text="Start Exploration" primary />
        <ActionButton text="Train Q-Learning" />
        <ActionButton text="Connect Robot" />
      </div>

    </aside>
  );
}
