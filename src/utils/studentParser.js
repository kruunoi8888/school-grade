// ===== STUDENT PARSER =====

// ── Gender detection from prefix ─────────────────────────────────────────
const MALE_PREFIXES   = ["เด็กชาย","นาย","ด.ช.","ด.ช","ชาย"];
const FEMALE_PREFIXES = ["เด็กหญิง","นางสาว","นาง","ด.ญ.","ด.ญ","หญิง"];
const detectGender = (prefix) => {
  const p = (prefix||"").trim();
  if (FEMALE_PREFIXES.some(x=>p.startsWith(x)||p===x)) return "หญิง";
  if (MALE_PREFIXES.some(x=>p.startsWith(x)||p===x))   return "ชาย";
  return "ชาย";
};
const normalizePrefix = (raw) => {
  const p = (raw||"").trim();
  if (p==="ด.ช."||p==="ด.ช") return "เด็กชาย";
  if (p==="ด.ญ."||p==="ด.ญ") return "เด็กหญิง";
  return p;
};

const parseBulkLine = (line, idx, baseId) => {
  const raw = line.trim().replace(/\s+/g," ");
  if (!raw) return null;
  
  // Split tokens, but we'll also try to detect joined prefixes later
  let tokens = raw.split(" ").filter(Boolean);
  if (tokens.length < 1) return null;

  let prefix="", first="", last="", sid="", gender="ชาย";

  // 1. Check if first token is a student id (digits only, 3-11 chars)
  if (/^\d{3,11}$/.test(tokens[0])) { 
    sid = tokens[0];
    tokens.shift();
  } else if (!sid && tokens.length > 2 && /^\d{3,11}$/.test(tokens[tokens.length-1])) {
    // Check if last token is student id
    sid = tokens[tokens.length-1];
    tokens.pop();
  }

  if (tokens.length === 0) return null;

  // 2. Identify Prefix (Handling both separated and joined cases)
  const allPrefixes = [...MALE_PREFIXES, ...FEMALE_PREFIXES];
  const firstToken = tokens[0];
  const foundPfx = allPrefixes.find(pf => firstToken.startsWith(pf));

  if (foundPfx) {
    prefix = normalizePrefix(foundPfx);
    gender = detectGender(foundPfx);
    
    // If the prefix was joined (e.g., "เด็กชายกิตติพงษ์"), remove the prefix part from the token
    if (firstToken === foundPfx) {
      tokens.shift();
    } else {
      tokens[0] = firstToken.replace(foundPfx, "").trim();
    }
  } else {
    // Default guess
    prefix = "เด็กชาย"; 
    gender = "ชาย";
  }

  // 3. Extract First and Last Name
  // Remaining tokens are assumed to be First Name and Last Name
  if (tokens.length >= 2) {
    first = tokens[0];
    last = tokens[1];
  } else if (tokens.length === 1) {
    // If only one token is left, it might be "First-Last" or just "First"
    if (tokens[0].includes("-")) {
      const split = tokens[0].split("-");
      first = split[0];
      last = split[1];
    } else {
      first = tokens[0];
    }
  }

  if (!sid) sid = String(baseId + idx).padStart(8,"0");
  if (!first) return null;

  return { prefix, first_name:first, last_name:last, gender, student_id:sid };
};

const sortClassrooms = (list) => {
  if (!list || !Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const lvPr = (n) => (n.includes("อนุบาล") ? 0 : n.includes("ประถม") || n.startsWith("ป.") ? 1 : n.includes("มัธยม") || n.startsWith("ม.") ? 2 : 3);
    const lvNu = (n) => { const m = n.match(/(\d+)/); return m ? +m[1] : 999; };
    const rmNu = (n) => { const m = n.match(/\/(\d+)/); return m ? +m[1] : 0; };
    const nA = a.room_name || "", nB = b.room_name || "";
    if (lvPr(nA) !== lvPr(nB)) return lvPr(nA) - lvPr(nB);
    if (lvNu(nA) !== lvNu(nB)) return lvNu(nA) - lvNu(nB);
    return rmNu(nA) - rmNu(nB);
  });
};

export { MALE_PREFIXES, FEMALE_PREFIXES, detectGender, normalizePrefix, parseBulkLine, sortClassrooms };