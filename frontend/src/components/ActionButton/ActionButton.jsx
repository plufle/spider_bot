import "./ActionButton.css";
import { useEffect } from "react";

export default function ActionButton({ text, primary, setLocked, grid }) {
  async function handleClick() {
    setLocked(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/explore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grid: grid }),
    })

    const data = await res.json();
    console.log(data.status)
  }
  return (
    <button className={`action-btn ${primary ? "primary" : ""}`} onClick={handleClick}>
      {text}
    </button>
  );
}
