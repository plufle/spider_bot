import "./ActionButton.css";

export default function ActionButton({ text, primary,setLocked}) {
  return (
    <button className={`action-btn ${primary ? "primary" : ""}`} onClick={()=>setLocked(true)}>
      {text}
    </button>
  );
}
