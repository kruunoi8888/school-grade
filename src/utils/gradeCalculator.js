// ===== GRADE CALCULATOR =====

const gradePoint = (total) => {
  if (total >= 80) return 4.0;
  if (total >= 75) return 3.5;
  if (total >= 65) return 3.0;
  if (total >= 55) return 2.5;
  if (total >= 45) return 2.0;
  if (total >= 35) return 1.5;
  if (total >= 20) return 1.0;
  return 0;
};

const gradeStr = (gp) => {
  const map = {4.0:"4",3.5:"3.5",3.0:"3",2.5:"2.5",2.0:"2",1.5:"1.5",1.0:"1",0:"0"};
  return map[gp] ?? "0";
};

const gradeLabel = (gp) => {
  if (gp >= 4.0) return "ดีเยี่ยม";
  if (gp >= 3.5) return "ดีมาก";
  if (gp >= 3.0) return "ดี";
  if (gp >= 2.5) return "ค่อนข้างดี";
  if (gp >= 2.0) return "ปานกลาง";
  if (gp >= 1.5) return "พอใช้";
  if (gp >= 1.0) return "ผ่านเกณฑ์ขั้นต่ำ";
  return "ต่ำกว่าเกณฑ์";
};

const gradeColor = (gp) => {
  if (gp >= 3.5) return "#10b981";
  if (gp >= 2.5) return "#3b82f6";
  if (gp >= 2.0) return "#f59e0b";
  if (gp >= 1.0) return "#ef4444";
  return "#6b7280";
};

export { gradePoint, gradeStr, gradeLabel, gradeColor };