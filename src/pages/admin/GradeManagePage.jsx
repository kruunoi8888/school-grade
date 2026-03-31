import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronRight, Save, X, Info, 
  Pencil, CheckCircle2, AlertCircle, ClipboardList,
  ArrowRight, Download, Users, BookOpen, GraduationCap,
  Baby, Calendar, Loader2, Trash2, Star, Sparkles, LayoutGrid, MousePointer2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sortClassrooms } from '../../utils/studentParser';

const getSubjectPriority = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("ไทย")) return 1;
  if (n.includes("คณิต")) return 2;
  if (n.includes("วิทยา") || n.includes("วิทย์") || n.includes("เทคโนโลยี") || n.includes("คำนวณ") || n.includes("คอม")) return 3;
  if (n.includes("สังคม") || n.includes("ศาสนา") || n.includes("วัฒนธรรม")) return 4;
  if (n.includes("ประวัติ")) return 5;
  if (n.includes("สุขศึกษา") || n.includes("พลศึกษา")) return 6;
  if (n.includes("ศิลปะ") || n.includes("นาฏศิลป์") || n.includes("ดนตรี")) return 7;
  if (n.includes("การงาน")) return 8;
  if (n.includes("อังกฤษ") || n.includes("ต่างประเทศ")) return 9;
  return 100;
};

const getActivityPriority = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("แนะแนว")) return 1;
  if (n.includes("ลูกเสือ") || n.includes("เนตรนารี")) return 2;
  if (n.includes("ชุมนุม") || n.includes("ชมรม")) return 3;
  if (n.includes("สังคม") || n.includes("สาธารณ") || n.includes("ประโยชน์")) return 4;
  return 99;
};

// --- Optimized Row Component ---
const GradeRow = React.memo(({ 
  s, sIdx, subjects, isEditMode, isK, draftGrades, grades, currentSem, onScore, 
  handleKeyDown, handlePaste, calcGPA, deleteStudentGrades, getKStyles, calculateGradeResult, gradeKey 
}) => {
  const gpa = !isK ? calcGPA(s.id, currentSem) : null;
  
  return (
    <tr key={s.id} style={{transition:"background 0.2s"}}>
      <td style={{position:"sticky",left:0,zIndex:10,background:"#fff", textAlign:"center", color:"#94a3b8", fontWeight:700, borderBottom:"1px solid #f1f5f9"}}>{sIdx+1}</td>
      <td style={{position:"sticky",left:60,zIndex:10,background:"#fff", borderBottom:"1px solid #f1f5f9"}}>
        <div style={{fontWeight:800, fontSize:15, color:"#1e293b"}}>{s.prefix}{s.first_name} {s.last_name}</div>
        <div style={{fontSize:12,color:"#94a3b8", fontWeight:600}}>{s.student_id}</div>
      </td>
      {subjects.map((sub, subIdx) => {
        const typeKey = sub.is_activity ? 'act' : 'sub';
        const targetId = sub.is_activity ? sub.original_id : sub.id;
        const dKey = `${s.id}_${typeKey}_${targetId}_${currentSem}`;
        const val = isEditMode ? (draftGrades[dKey] || "") : (grades[gradeKey(s.id, sub.id, currentSem)] || "");
        const isSumK = sub.subject_code?.startsWith('K_SUM') || sub.subject_name?.includes('สรุป');

        return (
          <td key={sub.id} style={{textAlign:"center", borderBottom:"1px solid #f1f5f9", padding:isEditMode?"4px":"12px"}}>
            {isEditMode ? (
              sub.is_activity || isK ? (
                <select 
                  id={`input-${sIdx}-${subIdx}`}
                  value={val} 
                  onChange={e => onScore(s.id, typeKey, targetId, currentSem, e.target.value)}
                  onKeyDown={e => handleKeyDown(e, sIdx, subIdx)}
                  onPaste={e => handlePaste(e, sIdx, subIdx)}
                  style={{
                    width:"100%", padding:"10px", borderRadius:10, border:"1.5px solid #e2e8f0",
                    fontWeight:900, fontSize:14, background: getKStyles(val).bg, color: getKStyles(val).color,
                    textAlign:"center", cursor:"pointer"
                  }}
                >
                  <option value="">-</option>
                  {isSumK ? (
                    <><option value="สมตัว">สมตัว</option><option value="ไม่สมตัว">ไม่สมตัว</option></>
                  ) : sub.is_activity ? (
                    <><option value="ผ">ผ</option><option value="มผ">มผ</option></>
                  ) : (
                    <><option value="3">3 (ดี)</option><option value="2">2 (พอใช้)</option><option value="1">1 (ปรับปรุง)</option></>
                  )}
                </select>
              ) : (
                <div style={{display:"flex", alignItems:"center", gap:8, justifyContent:"center"}}>
                  <div style={{position:"relative"}}>
                    <input 
                      id={`input-${sIdx}-${subIdx}`}
                      type="number" step="0.5" 
                      value={val} 
                      onChange={e => onScore(s.id, typeKey, targetId, currentSem, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, sIdx, subIdx)}
                      onPaste={e => handlePaste(e, sIdx, subIdx)}
                      style={{
                        width:74, padding:"10px 0", borderRadius:10, border:"1.5px solid #cbd5e1",
                        textAlign:"center", fontWeight:900, fontSize:16, outlineColor:"#4f46e5"
                      }} 
                      placeholder="-"
                    />
                    {val && !isNaN(parseFloat(val)) && (
                      <div style={{
                        position:"absolute", right:-38, top:"50%", transform:"translateY(-50%)",
                        background:"#f1f5f9", padding:"2px 6px", borderRadius:6, fontSize:11,
                        fontWeight:900, color:"#4f46e5", border:"1px solid #e2e8f0"
                      }}>
                        {calculateGradeResult(val)}
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div style={{
                display:"inline-flex", padding: sub.is_activity || isK ? "6px 14px" : "4px 10px", borderRadius: sub.is_activity || isK ? 10 : 16,
                background: getKStyles(val).bg, color: getKStyles(val).color, border: `1px solid ${getKStyles(val).border}`,
                fontWeight:900, fontSize:14
              }}>
                {val || "-"}
              </div>
            )}
          </td>
        );
      })}
      {!isK && <td style={{textAlign:"center",background:"#f0fdf450",fontWeight:900, fontSize:18, color:"#16a34a", borderBottom:"1px solid #f1f5f9"}}>{gpa}</td>}
      <td style={{textAlign:"center", borderBottom:"1px solid #f1f5f9"}}>
        <div style={{display:"flex", gap:8, justifyContent:"center"}}>
          {!isEditMode && (
            <button onClick={() => setIsEditMode(true)} style={{padding:8, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#4f46e5", cursor:"pointer"}}><Pencil size={14}/></button>
          )}
          <button onClick={() => deleteStudentGrades(s)} style={{padding:8, borderRadius:8, border:"1px solid #fee2e2", background:"#fef2f2", color:"#ef4444", cursor:"pointer"}}><Trash2 size={14}/></button>
        </div>
      </td>
    </tr>
  );
});

export default function GradeManagePage({ 
  classrooms: propClassrooms = [], 
  user, 
  assignments: propAssignments = {},
  subjects: propSubjects = [],
  students: propStudents = [],
  activities: propActivities = [],
  currentAcademicYear,
  setAdminPage
}) {
  const [loading, setLoading] = useState(true);
  const [activeCurriculum, setActiveCurriculum] = useState('kindergarten');
  const [classrooms, setClassrooms] = useState(propClassrooms);
  const [filterClass, setFilterClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradeRows, setGradeRows] = useState([]);
  const [grades, setGrades] = useState({});
  const [draftGrades, setDraftGrades] = useState({});
  const [currentSem, setCurrentSem] = useState(1);
  const [isSemesterMode, setIsSemesterMode] = useState(true);
  const [activeYear, setActiveYear] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [bulkModal, setBulkModal] = useState({ open: false, target: null });
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => {
    if (filterClass) fetchClassroomData();
    else { setStudents([]); setSubjects([]); setGrades({}); }
  }, [filterClass, currentSem, isSemesterMode]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [classRes, yearRes] = await Promise.all([
        supabase.from('classrooms').select('*'),
        supabase.from('academic_years').select('*').eq('status', 'current').single()
      ]);
      setClassrooms(sortClassrooms(classRes.data || []));
      if (yearRes.data) {
        setActiveYear(yearRes.data);
        setIsSemesterMode(yearRes.data.announce_type === 'semester');
        setCurrentSem(yearRes.data.semester || 1);
      }
    } catch (err) { console.error('Initial error:', err.message); }
    finally { setLoading(false); }
  }

  const normalizeLevel = (l) => {
    if (!l) return "";
    const map = {
      "ประถมศึกษาปีที่ 1": "ป.1", "ประถมศึกษาปีที่ 2": "ป.2", "ประถมศึกษาปีที่ 3": "ป.3",
      "ประถมศึกษาปีที่ 4": "ป.4", "ประถมศึกษาปีที่ 5": "ป.5", "ประถมศึกษาปีที่ 6": "ป.6"
    };
    return map[l] || l;
  };

  async function fetchClassroomData() {
    try {
      setLoading(true);
      const selectedClass = classrooms.find(c => c.room_name === filterClass);
      if (!selectedClass) return;
      const normLevel = normalizeLevel(selectedClass.level_name || selectedClass.room_name.split('/')[0]);
      const { data: dbSubs } = await supabase.from('subjects').select('*').or(`level_name.eq."${normLevel}",level_name.eq."${selectedClass.level_name}"`);
      const sortedSubs = [...(dbSubs || [])].sort((a,b) => getSubjectPriority(a.subject_name) - getSubjectPriority(b.subject_name));
      const sortedActivities = (propActivities || []).filter(a => normalizeLevel(a.level_name) === normLevel || a.level_name === "*" || a.level_name?.includes("ทุกระดับ")).sort((a,b) => getActivityPriority(a.activity_type) - getActivityPriority(b.activity_type));
      setSubjects([...sortedSubs.map(s => ({ ...s, is_activity: false })), ...sortedActivities.map(a => ({ id: `act_${a.id}`, subject_code: "กิจกรรม", subject_name: a.activity_type, type: "activity", is_activity: true, original_id: a.id }))]);
      const { data: studs } = await supabase.from('students').select('*').eq('classroom_id', selectedClass.id).order('student_id');
      setStudents(studs || []);
      const studIds = (studs || []).map(s => s.id);
      let grdData = [];
      if (studIds.length > 0) {
        let query = supabase.from('grades').select('*').in('student_id', studIds);
        if (activeYear) query = query.eq('academic_year_id', activeYear.id);
        const { data } = await query;
        grdData = data || []; setGradeRows(grdData);
      }
      const grdMap = {};
      grdData.forEach(g => {
        const key = g.activity_id ? gradeKey(g.student_id, `act_${g.activity_id}`, currentSem) : gradeKey(g.student_id, g.subject_id, currentSem);
        grdMap[key] = String(g.score || g.grade || "");
      });
      setGrades(grdMap);
      const initialDraft = {};
      grdData.forEach(g => {
        const type = g.activity_id ? 'act' : 'sub';
        const tid = g.activity_id || g.subject_id;
        initialDraft[`${g.student_id}_${type}_${tid}_${currentSem}`] = String(g.score || g.grade || "");
      });
      setDraftGrades(initialDraft);
    } catch (err) { console.error('Fetch error:', err.message); }
    finally { setLoading(false); }
  }

  const gradeKey = (sid, subid, sem) => `${sid}_${subid}_${sem}`;
  const calculateGradeResult = (scoreVal) => {
    const s = parseFloat(scoreVal); if (isNaN(s)) return null;
    if (s >= 80) return "4"; if (s >= 75) return "3.5"; if (s >= 70) return "3"; if (s >= 65) return "2.5"; if (s >= 60) return "2"; if (s >= 55) return "1.5"; if (s >= 50) return "1"; return "0";
  };
  const gradePoint = (val) => {
    const s = parseFloat(val); if (isNaN(s)) return null;
    if (s >= 80) return 4.0; if (s >= 75) return 3.5; if (s >= 70) return 3.0; if (s >= 65) return 2.5; if (s >= 60) return 2.0; if (s >= 55) return 1.5; if (s >= 50) return 1.0; return 0;
  };
  const getKStyles = (val) => {
    if (!val || val === "-") return { color: "#94a3b8", bg: "#f8fafc", border: "transparent" };
    if (val === "3" || val === "ผ") return { color: "#059669", bg: "#ecfdf5", border: "#10b98140" };
    if (val === "1" || val === "มผ") return { color: "#dc2626", bg: "#fef2f2", border: "#ef444440" };
    if (val === "สมตัว") return { color: "#4f46e5", bg: "#eef2ff", border: "#6366f140" };
    if (val === "ไม่สมตัว") return { color: "#64748b", bg: "#f8fafc", border: "#94a3b840" };
    return { color: "#94a3b8", bg: "#f8fafc", border: "transparent" };
  };
  const calcGPA = (sid, sem) => {
    let tp = 0; let tc = 0;
    subjects.filter(s => !s.is_activity).forEach(sub => {
      const g = grades[gradeKey(sid, sub.id, sem)];
      if (g) { tp += (gradePoint(g) * (sub.credit || 0)); tc += (sub.credit || 0); }
    });
    return tc > 0 ? (tp / tc).toFixed(2) : "0.00";
  };
  const onScore = (sid, type, targetId, sem, val) => {
    setDraftGrades(prev => ({ ...prev, [`${sid}_${type}_${targetId}_${sem}`]: String(val) }));
  };
  const handleKeyDown = (e, sIdx, subIdx) => {
    let ts = sIdx; let tsub = subIdx;
    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); ts = Math.min(sIdx + 1, students.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); ts = Math.max(sIdx - 1, 0); }
    else if (e.key === 'ArrowRight') tsub = Math.min(subIdx + 1, subjects.length - 1);
    else if (e.key === 'ArrowLeft') tsub = Math.max(subIdx - 1, 0);
    else return;
    const el = document.getElementById(`input-${ts}-${tsub}`);
    if (el) el.focus();
  };
  const handlePaste = (e, sIdx, subIdx) => {
    const rows = e.clipboardData.getData('Text').trim().split(/\r?\n/);
    const newDraft = { ...draftGrades };
    rows.forEach((row, rO) => {
      row.split('\t').forEach((val, cO) => {
        const tS = sIdx + rO; const tSub = subIdx + cO;
        if (tS < students.length && tSub < subjects.length) {
          const s = students[tS]; const sub = subjects[tSub];
          const typeKey = sub.is_activity ? 'act' : 'sub';
          const targetId = sub.is_activity ? sub.original_id : sub.id;
          newDraft[`${s.id}_${typeKey}_${targetId}_${currentSem}`] = val.trim();
        }
      });
    });
    setDraftGrades(newDraft);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true); if (!activeYear) throw new Error("No Year");
      const allUpserts = Object.keys(draftGrades).map(key => {
        const [sid, type, targetId, sem] = key.split('_');
        const val = draftGrades[key] || "";
        const numericVal = parseFloat(val);
        
        let finalGrade = val;
        let finalScore = null;

        // If it's an academic subject and a numeric score is entered
        if (type === 'sub' && !isNaN(numericVal) && !activeCurriculum.includes('kindergarten')) {
          if (numericVal > 4) {
             finalGrade = calculateGradeResult(numericVal);
             finalScore = numericVal;
          } else {
             finalGrade = String(numericVal);
             finalScore = null; // Or keep it if we decide 0-4 scores exist
          }
        }

        const existing = gradeRows.find(r => String(r.student_id) === String(sid) && (type === 'sub' ? String(r.subject_id) === String(targetId) : String(r.activity_id) === String(targetId)) && String(r.academic_year_id) === String(activeYear.id) && String(r.semester) === String(sem));
        
        const row = { 
          student_id: parseInt(sid), 
          subject_id: type === 'sub' ? parseInt(targetId) : null, 
          activity_id: type === 'act' ? parseInt(targetId) : null, 
          grade: finalGrade,
          score: finalScore,
          academic_year_id: activeYear.id, 
          semester: parseInt(sem) 
        };
        if (existing?.id) row.id = existing.id;
        return row;
      });
      if (allUpserts.length > 0) {
        const withId = allUpserts.filter(r => r.id);
        const withoutId = allUpserts.filter(r => !r.id).map(({id, ...rest}) => rest);
        if (withId.length > 0) await supabase.from('grades').upsert(withId);
        if (withoutId.length > 0) await supabase.from('grades').insert(withoutId);
      }
      await fetchClassroomData(); setSuccess(true); setTimeout(() => setSuccess(false), 3000); setIsEditMode(false);
    } catch (err) { alert('Error: ' + err.message); } finally { setSaving(false); }
  };

  const handleBulkApply = () => {
    const values = bulkInput.trim().split(/\r?\n/).map(v => v.trim());
    const newDraft = { ...draftGrades };
    students.forEach((s, idx) => { if (idx < values.length) {
      const typeKey = bulkModal.target.is_activity ? 'act' : 'sub';
      const tId = bulkModal.target.is_activity ? bulkModal.target.original_id : bulkModal.target.id;
      newDraft[`${s.id}_${typeKey}_${tId}_${currentSem}`] = values[idx];
    }});
    setDraftGrades(newDraft); setBulkModal({ open: false, target: null }); setBulkInput(''); setIsEditMode(true);
  };

  const fillAllColumn = (sub, val) => {
    const nD = { ...draftGrades };
    students.forEach(s => {
      const typeKey = sub.is_activity ? 'act' : 'sub';
      const tId = sub.is_activity ? sub.original_id : sub.id;
      nD[`${s.id}_${typeKey}_${tId}_${currentSem}`] = val;
    });
    setDraftGrades(nD); setIsEditMode(true);
  };

  const deleteStudentGrades = async (stud) => {
    if (!window.confirm("Delete grades?")) return;
    try {
      setSaving(true);
      await supabase.from('grades').delete().eq('student_id', stud.id).eq('academic_year_id', activeYear.id);
      await fetchClassroomData(); setSuccess(true);
    } catch (err) { alert('Error: ' + err.message); } finally { setSaving(false); }
  };

  const filteredClassrooms = (propClassrooms || []).filter(c => {
    const isKinder = c.room_name?.includes('อนุบาล') || c.level_name?.includes('อนุบาล');
    return activeCurriculum === 'kindergarten' ? isKinder : !isKinder;
  });

  return (
    <div className="adm-container" style={{maxWidth:1140}}>
      <header className="adm-header" style={{marginBottom:32}}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <div style={{width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#6366f1,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 10px 20px rgba(99,102,241,0.2)"}}>
            <GraduationCap size={30} style={{color:"#fff"}}/>
          </div>
          <div>
            <h1 className="adm-title" style={{fontSize:24, fontWeight:900}}>จัดการผลการเรียนและเกรด</h1>
            <p className="adm-subtitle" style={{color:"#64748b"}}>บันทึก แก้ไข และติดตามผลการพัฒนาผู้เรียนรายบุคคล</p>
          </div>
        </div>
      </header>

      <div style={{ display:"flex",gap:4,background:"#fff", padding:6,borderRadius:16, border:"1px solid #e2e8f0",marginBottom:28,width:"fit-content" }}>
        {['kindergarten', 'basic'].map(id => (
          <button key={id} onClick={() => { setActiveCurriculum(id); setFilterClass(''); }}
            style={{
              padding:"12px 24px", borderRadius:12, border:"none", fontWeight:800, cursor:"pointer",
              background: activeCurriculum===id ? "#f1f5f9" : "transparent"
            }}
          > {id==='kindergarten'?'ปฐมวัย':'ขั้นพื้นฐาน'} </button>
        ))}
      </div>

      <div className="adm-card" style={{padding:28,marginBottom:28}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:24,alignItems:"flex-end"}}>
          <div style={{flex:1,minWidth:280}}>
            <label style={{display:"block", marginBottom:10, fontSize:14, fontWeight:800}}>เลือกชั้นเรียน</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="adm-input">
              <option value="">-- เลือกชั้นเรียน --</option>
              {filteredClassrooms.map(c => <option key={c.id} value={c.room_name}>{c.room_name}</option>)}
            </select>
          </div>
          {activeYear && (
            <div style={{display:"flex", gap:10}}>
              <div style={{padding:"10px 20px", background:"#f8fafc", borderRadius:14, border:"1px solid #e2e8f0"}}>
                <div style={{fontSize:11, fontWeight:800, color:"#94a3b8"}}>ปีการศึกษา {activeYear.year}</div>
              </div>
              {isSemesterMode && (
                <div style={{display:"flex", gap:5}}>
                  {[1, 2].map(s => (
                    <button key={s} onClick={() => setCurrentSem(s)} style={{padding:"10px 20px", background:currentSem===s?"#4f46e5":"#fff", color:currentSem===s?"#fff":"#64748b", border:"1px solid #e2e8f0", borderRadius:14}}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? <div style={{textAlign:"center",padding:100}}><Loader2 className="animate-spin" size={40}/></div> : filterClass ? (
        <div className="adm-card" style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:24, borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h3 style={{margin:0, fontWeight:900}}>{filterClass}</h3>
            <div style={{display:"flex", gap:10}}>
              {!isEditMode ? (
                <button onClick={() => setIsEditMode(true)} className="adm-btn adm-btn-primary">เริ่มกรอกข้อมูล</button>
              ) : (
                <>
                  <button onClick={() => setIsEditMode(false)} className="adm-btn">ยกเลิก</button>
                  <button onClick={handleSaveAll} disabled={saving} className="adm-btn adm-btn-primary">{saving?'กำลังบันทึก...':'บันทึกทั้งหมด'}</button>
                </>
              )}
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  <th style={{padding:12, width:50, borderBottom:"2px solid #e2e8f0"}}>#</th>
                  <th style={{padding:12, textAlign:"left", minWidth:200, borderBottom:"2px solid #e2e8f0"}}>ชื่อ-นามสกุล</th>
                  {subjects.map(sub => (
                    <th key={sub.id} style={{padding:12, textAlign:"center", minWidth:120, borderBottom:"2px solid #e2e8f0"}}>
                      <div style={{fontSize:10, color:"#64748b"}}>{sub.subject_code}</div>
                      <div style={{fontSize:13, fontWeight:900}}>{sub.subject_name}</div>
                      {isEditMode && (
                        <button onClick={() => fillAllColumn(sub, 'ผ')} style={{fontSize:9, background:"#ecfdf5", border:"none", borderRadius:4, padding:"2px 6px"}}>ผ ทั้งหมด</button>
                      )}
                    </th>
                  ))}
                  {!activeCurriculum.includes('kindergarten') && <th style={{padding:12, borderBottom:"20px solid #e2e8f0"}}>GPA</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s, sIdx) => (
                  <GradeRow key={s.id} s={s} sIdx={sIdx} subjects={subjects} isEditMode={isEditMode} isK={activeCurriculum==='kindergarten'} draftGrades={draftGrades} grades={grades} currentSem={currentSem} onScore={onScore} handleKeyDown={handleKeyDown} handlePaste={handlePaste} calcGPA={calcGPA} deleteStudentGrades={deleteStudentGrades} getKStyles={getKStyles} calculateGradeResult={calculateGradeResult} gradeKey={gradeKey} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {success && <div style={{position:"fixed", bottom:20, right:20, background:"#10b981", color:"#fff", padding:"10px 20px", borderRadius:10}}>Saved!</div>}
      
      {bulkModal.open && <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000}}>
        <div style={{background:"#fff", padding:30, borderRadius:20, width:500}}>
          <h3>Bulk Entry - {bulkModal.target?.subject_name}</h3>
          <textarea value={bulkInput} onChange={e=>setBulkInput(e.target.value)} style={{width:"100%", height:200}}/>
          <button onClick={handleBulkApply}>Apply</button>
          <button onClick={()=>setBulkModal({open:false})}>Close</button>
        </div>
      </div>}
    </div>
  );
}