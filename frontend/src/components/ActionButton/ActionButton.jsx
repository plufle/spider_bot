import "./ActionButton.css";

export default function ActionButton({ text, primary}) {
  return (
    <button className={`action-btn ${primary ? "primary" : ""}`}>
      {text}
    </button>
  );
}
