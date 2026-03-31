import React from "react";

const ScoreBar = ({ label, value, colorClass, color }) => {
  const pct = Math.min(100, value);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      {/* Label */}
      <div style={{ width:76, fontSize:12.5, color:"#64748b", fontWeight:600, flexShrink:0 }}>{label}</div>

      {/* Progress bar track */}
      <div style={{ flex:1, height:10, background:"#f1f5f9", borderRadius:5, overflow:"hidden" }}>
        <div
          className={colorClass}
          style={{
            width: `${pct}%`,
            height:"100%",
            borderRadius:5,
            background: color,
            transition: "width .6s ease",
          }}
        />
      </div>

      {/* Score value */}
      <div style={{ width:44, textAlign:"right", fontFamily:"var(--font-d)", fontSize:14, fontWeight:800, color, flexShrink:0 }}>
        {value}
      </div>
    </div>
  );
};

export default ScoreBar;
