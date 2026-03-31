// ===== CONSTANTS =====
const LEVEL_NAMES = ["อนุบาล 1","อนุบาล 2","อนุบาล 3","ป.1","ป.2","ป.3","ป.4","ป.5","ป.6","ม.1","ม.2","ม.3","ม.4","ม.5","ม.6"];

// Mapping according to Thai National Standard codes:
// Primary (ป.1 - ป.6) -> 11, 12, 13, 14, 15, 16 
// Junior Secondary (ม.1 - ม.3) -> 21, 22, 23
// Senior Secondary (ม.4 - ม.6) -> 31, 32, 33
const LEVEL_CODE_MAP = { 
  "ป.1":"11", "ป.2":"12", "ป.3":"13", "ป.4":"14", "ป.5":"15", "ป.6":"16",
  "ประถมศึกษาปีที่ 1":"11", "ประถมศึกษาปีที่ 2":"12", "ประถมศึกษาปีที่ 3":"13", 
  "ประถมศึกษาปีที่ 4":"14", "ประถมศึกษาปีที่ 5":"15", "ประถมศึกษาปีที่ 6":"16",
  "ม.1":"21", "ม.2":"22", "ม.3":"23",
  "มัธยมศึกษาปีที่ 1":"21", "มัธยมศึกษาปีที่ 2":"22", "มัธยมศึกษาปีที่ 3":"23",
  "ม.4":"31", "ม.5":"32", "ม.6":"33",
  "มัธยมศึกษาปีที่ 4":"31", "มัธยมศึกษาปีที่ 5":"32", "มัธยมศึกษาปีที่ 6":"33",
  "อนุบาล 1":"01", "อนุบาล 2":"02", "อนุบาล 3":"03" 
};

const LEVEL_FULL_MAP = {
  "ป.1":"ประถมศึกษาปีที่ 1","ป.2":"ประถมศึกษาปีที่ 2","ป.3":"ประถมศึกษาปีที่ 3",
  "ป.4":"ประถมศึกษาปีที่ 4","ป.5":"ประถมศึกษาปีที่ 5","ป.6":"ประถมศึกษาปีที่ 6",
  "ม.1":"มัธยมศึกษาปีที่ 1","ม.2":"มัธยมศึกษาปีที่ 2","ม.3":"มัธยมศึกษาปีที่ 3",
  "ม.4":"มัธยมศึกษาปีที่ 4","ม.5":"มัธยมศึกษาปีที่ 5","ม.6":"มัธยมศึกษาปีที่ 6",
  "อนุบาล 1":"อนุบาลปีที่ 1","อนุบาล 2":"อนุบาลปีที่ 2","อนุบาล 3":"อนุบาลปีที่ 3",
};

const lvFull = (lv) => LEVEL_FULL_MAP[lv] ? `${lv} — ${LEVEL_FULL_MAP[lv]}` : lv;

const genSubjectCode = (groupCode, levelName, runningNum) => {
  const lvCode = LEVEL_CODE_MAP[levelName];
  if (!lvCode) {
    // Fallback logic for dynamic names
    const num = levelName.match(/\d+/) ? levelName.match(/\d+/)[0] : "1";
    if (levelName.includes("หน้า") || levelName.includes("อนุบาล")) return "0" + num;
    if (levelName.includes("ม")) return "2" + num;
    return "1" + num;
  }
  const run = String(runningNum).padStart(2,"0");
  // Formula: [GroupCode] + [LevelCategoryYear] + [Semester/Type] + [RunningNum]
  // Example: ท + 11 + 1 + 01 = ท11101 (P.1 Thai)
  // Example: ท + 21 + 1 + 01 = ท21101 (M.1 Thai)
  return groupCode + lvCode + "1" + run;
};

export { LEVEL_NAMES, LEVEL_CODE_MAP, LEVEL_FULL_MAP, lvFull, genSubjectCode };