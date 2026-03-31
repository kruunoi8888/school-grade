const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const injection = `
  const ACTIVITY_TYPES = [
    { id: "แนะแนว", label: "แนะแนว", hours: 40, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
    { id: "ลูกเสือ-เนตรนารี", label: "ลูกเสือ-เนตรนารี", hours: 40, color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
    { id: "ชุมนุม", label: "ชุมนุมภาษาไทย", hours: 20, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { id: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", label: "กิจกรรมเพื่อสังคม", hours: 10, color: "#db2777", bg: "#fdf2f8", border: "#fbcfe8" }
  ];
  const ACTIVITIES_INIT = [
    { id: 1, activity_type: "แนะแนว", level_name: "ป.1", hours: 40, result: "ผ" },
    { id: 2, activity_type: "ลูกเสือ-เนตรนารี", level_name: "ป.1", hours: 40, result: "ผ" },
    { id: 3, activity_type: "ชุมนุม", level_name: "ป.1", hours: 20, result: "ผ" },
    { id: 4, activity_type: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", level_name: "ป.1", hours: 10, result: "ผ" }
  ];
`;

if (!code.includes('const ACTIVITY_TYPES = [')) {
  code = code.replace('const [activities, setActivities] = React.useState(ACTIVITIES_INIT.map(a=>({...a})));', injection + '\n  const [activities, setActivities] = React.useState(ACTIVITIES_INIT.map(a=>({...a})));');
  fs.writeFileSync('src/App.jsx', code);
  console.log('Fixed App.jsx by injecting ACTIVITY_TYPES');
} else {
  console.log('ACTIVITY_TYPES already exists');
}
