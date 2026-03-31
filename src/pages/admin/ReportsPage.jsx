import React, { useState, useEffect } from 'react';
import { 
  Printer, ArrowLeft, Download, RefreshCw, 
  ChevronRight, Calendar, User, BookOpen, 
  GraduationCap, FileText, Layout, Activity,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const getSubjectPriority = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("ไทย")) return 1;
  if (n.includes("คณิต")) return 2;
  if (n.includes("วิทยา") || n.includes("วิทย์") || n.includes("เทคโนโลยี")) return 3;
  if (n.includes("สังคม") || n.includes("ศาสนา") || n.includes("วัฒนธรรม")) return 4;
  if (n.includes("ประวัติ")) return 5;
  if (n.includes("สุขศึกษา") || n.includes("พลศึกษา")) return 6;
  if (n.includes("ศิลปะ") || n.includes("นาฏศิลป์") || n.includes("ดนตรี")) return 7;
  if (n.includes("การงาน")) return 8;
  if (n.includes("อังกฤษ") || n.includes("ต่างประเทศ")) return 9;
  return 100;
};

export default function ReportsPage({ 
  classrooms = [], 
  students = [], 
  subjects = [], 
  academicYears = [],
  currentAcademicYear,
  activities = [],
  users = [],
  assignments = {},
  schoolInfo = {}
}) {
  const [filterClass, setFilterClass] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [activeYear, setActiveYear] = useState('');
  const [activeSemester, setActiveSemester] = useState(1);
  const [grades, setGrades] = useState([]);
  const [isFetchingGrades, setIsFetchingGrades] = useState(false);

  const calculateGradeResult = (scoreVal) => {
    const s = parseFloat(scoreVal); if (isNaN(s)) return null;
    if (s >= 80) return "4"; if (s >= 75) return "3.5"; if (s >= 70) return "3"; if (s >= 65) return "2.5"; if (s >= 60) return "2"; if (s >= 55) return "1.5"; if (s >= 50) return "1"; return "0";
  };

  useEffect(() => {
    if (currentAcademicYear) {
      setActiveYear(currentAcademicYear.year.toString());
      setActiveSemester(currentAcademicYear.semester || 1);
    }
  }, [currentAcademicYear]);

  const selectedYearObj = academicYears.find(y => y.year === +activeYear) || currentAcademicYear;

  useEffect(() => {
    if (!filterStudentId || !selectedYearObj) return;
    async function fetchStudentGrades() {
      try {
        setIsFetchingGrades(true);
        const { data, error } = await supabase
          .from('grades')
          .select('*, subjects(*), activities(*)')
          .eq('student_id', filterStudentId)
          .eq('academic_year_id', selectedYearObj.id);
        if (error) throw error;
        setGrades(data || []);
      } catch (err) {
        console.error("Error fetching student grades for report:", err);
      } finally {
        setIsFetchingGrades(false);
      }
    }
    fetchStudentGrades();
  }, [filterStudentId, selectedYearObj?.id]);

  const stObj = students.find(s => s.id == filterStudentId);
  const activeClass = classrooms.find(c => c.id == stObj?.classroom_id);
  const studentLevel = activeClass?.level_name || "";

  const normalizeLevel = (raw = "") => {
    if (!raw) return "";
    let s = raw.toString().trim();
    if (s.includes("อนุบาล")) return "อนุบาล";
    const matches = s.match(/[1-6]/);
    if (matches) return "ป." + matches[0];
    return s;
  };

  const studentLevelNorm = normalizeLevel(studentLevel);

  const levelSubjects = subjects.filter(s => {
    const sNorm = normalizeLevel(s.level_name);
    return sNorm === studentLevelNorm;
  });

  const levelActs = activities.filter(a => {
    const aNorm = normalizeLevel(a.level_name);
    return aNorm === studentLevelNorm;
  });

  const sortedLevelActs = [...levelActs].sort((a, b) => {
    const nA = (a.activity_type || "").toLowerCase();
    const nB = (b.activity_type || "").toLowerCase();
    const getRank = (n) => {
      if (n.includes("แนะแนว")) return 1;
      if (n.includes("ลูกเสือ") || n.includes("เนตรนารี")) return 1.1;
      if (n.includes("ชุมนุม")) return 1.2;
      if (n.includes("สังคม") || n.includes("สาธารณ") || n.includes("บำเพ็ญ")) return 1.3;
      return 99;
    };
    return getRank(nA) - getRank(nB);
  });

  const roomTeacherIds = assignments[activeClass?.id] || [];
  const roomTeacherObj = users.find(u => roomTeacherIds.includes(u.id));
  const roomTeacherName = roomTeacherObj ? `${roomTeacherObj.prefix || ""}${roomTeacherObj.name}` : "................................................";

  const fullCurriculum = [
    ...levelSubjects.sort((a,b) => getSubjectPriority(a.subject_name) - getSubjectPriority(b.subject_name)),
    ...sortedLevelActs
  ];

  const handlePrint = () => window.print();

  const filteredStudents = students.filter(s => {
    if (!filterClass) return false;
    const cls = classrooms.find(c => c.room_name == filterClass);
    return s.classroom_id == cls?.id;
  });

  const isKG = studentLevel.includes("อนุบาล");
  
  const studentOrder = filteredStudents.findIndex(s => s.id == filterStudentId) + 1;

  const handleDownloadPDF = () => {
    const element = document.querySelector('.print-area');
    if (!element) return;
    const studentName = stObj ? `${stObj.first_name}_${stObj.last_name}` : "student";
    const fileName = `รายงาน_${studentName}_ปี${activeYear}.pdf`;
    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save();
  };

  const displayRows = [];
  if (isKG) {
    fullCurriculum.forEach((item, i) => {
      const isAct = item.activity_type !== undefined;
      const grade = grades.find(g => isAct ? g.activity_id == item.id : g.subject_id == item.id);
      displayRows.push({
        no: i + 1,
        name: isAct ? item.activity_type : item.subject_name,
        result: grade ? (grade.grade || "-") : "-"
      });
    });
  } else {
    for (let i = 0; i < 15; i++) {
      const item = fullCurriculum[i];
      if (item) {
        const isAct = item.activity_type !== undefined;
        const grade = grades.find(g => isAct ? g.activity_id == item.id : g.subject_id == item.id);
        let displayScore = "-";
        let displayGrade = "-";
        if (grade) {
          const rawG = grade.grade;
          const rawS = grade.score || grade.raw_score;
          const numG = parseFloat(rawG);
          const numS = parseFloat(rawS);
          if (!isNaN(numG) && numG > 4) {
            displayScore = rawG;
            displayGrade = calculateGradeResult(numG);
          } else {
            displayScore = !isNaN(numS) ? rawS : "-";
            displayGrade = rawG || "-";
            if (!isNaN(numS) && (!rawG || rawG === "-")) {
              displayGrade = calculateGradeResult(numS);
            }
          }
        }
        displayRows.push({
          no: i + 1,
          code: isAct ? (item.activity_code || "-") : (item.subject_code || "-"),
          name: isAct ? item.activity_type : item.subject_name,
          type: isAct ? "กิจกรรม" : (item.type === 'extra' ? "วิชาเพิ่มเติม" : "วิชาพื้นฐาน"),
          hours: isAct ? (item.hours || "-") : (item.credit || "-"),
          score: displayScore,
          result: displayGrade
        });
      } else {
        displayRows.push({ no: i + 1, code: "-", name: "..................................................................", type: "-", hours: "-", score: "-", result: "-" });
      }
    }
  }

  const academicRows = displayRows.filter(r => (r.type && (r.type.includes("พื้นฐาน") || r.type.includes("เพิ่มเติม"))));
  const baseWeight = academicRows.reduce((sum, r) => r.type.includes("พื้นฐาน") ? sum + (parseFloat(r.hours) || 0) : sum, 0);
  const extraWeight = academicRows.reduce((sum, r) => (r.type.includes("เพิ่มเติม") || r.type.includes("extra")) ? sum + (parseFloat(r.hours) || 0) : sum, 0);
  const totalWeightForGPA = baseWeight + extraWeight;
  const totalWeightedPoints = academicRows.reduce((sum, r) => {
    const g = parseFloat(r.result);
    const w = parseFloat(r.hours);
    if (isNaN(g) || isNaN(w)) return sum;
    return sum + (g * w);
  }, 0);
  const finalGPA = totalWeightForGPA > 0 ? (totalWeightedPoints / totalWeightForGPA).toFixed(2) : "0.00";

  return (
    <div className="adm-container" style={{maxWidth:1140}}>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body, html { visibility: hidden; margin: 0 !important; padding: 0 !important; background: #fff !important; width: 100%; height: auto; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; }
          .no-print, .sidebar, .admin-topbar, .adm-header, .adm-card, footer, .mobile-nav, .app-nav { display: none !important; }
          .kg-report, .p6-report { width: 100%; margin: 0 auto; padding: 0 !important; }
          @page { size: A4; margin: 1.5cm; }
        }
      `}</style>
      <header className="adm-header" style={{marginBottom:32}}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <div style={{width:56, height:56, borderRadius:16, background: isKG ? "linear-gradient(135deg,#f472b6,#db2777)" : "linear-gradient(135deg,#6366f1,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 10px 20px rgba(99,102,241,0.2)"}}>
            <FileText size={30} style={{color:"#fff"}}/>
          </div>
          <div>
            <h1 className="adm-title" style={{fontSize:24, fontWeight:900}}>พิมพ์รายงานผลการ{isKG ? "พัฒนา" : "เรียน"}รายบุคคล</h1>
            <p className="adm-subtitle" style={{color:"#64748b"}}>{isKG ? "ระดับปฐมวัย (อนุบาล)" : "ปพ.6: รายงานความก้าวหน้าทางการเรียนระดับชั้นประถมศึกษา"}</p>
          </div>
        </div>
      </header>
      <div className="adm-card animate-slide-up" style={{padding:28, marginBottom:28, background:"#fff", borderRadius:24, border:"1px solid #f1f5f9", boxShadow:"0 4px 6px -1px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex", flexWrap:"wrap", gap:24, alignItems:"flex-end"}}>
          <div style={{minWidth:220}}>
            <label style={{display:"block", marginBottom:10, fontSize:14, fontWeight:800}}>เลือกชั้นเรียน</label>
            <select value={filterClass} onChange={e => {setFilterClass(e.target.value); setFilterStudentId('');}} className="adm-input">
              <option value="">-- เลือกชั้นเรียน --</option>
              {classrooms.sort((a, b) => {
                const getLevelPriority = (name = "") => {
                  if (name.includes("อนุบาล")) return 0;
                  if (name.includes("ประถม") || name.startsWith("ป.")) return 1;
                  if (name.includes("มัธยม") || name.startsWith("ม.")) return 2;
                  return 99;
                };
                const getLevelNum = (name = "") => {
                  const m = name.match(/(\d+)/);
                  return m ? parseInt(m[1]) : 999;
                };
                const getRoomNum = (name = "") => {
                  const m = name.match(/\/(\d+)/);
                  return m ? parseInt(m[1]) : 0;
                };

                const pA = getLevelPriority(a.room_name);
                const pB = getLevelPriority(b.room_name);
                if (pA !== pB) return pA - pB;

                const nA = getLevelNum(a.room_name);
                const nB = getLevelNum(b.room_name);
                if (nA !== nB) return nA - nB;

                return getRoomNum(a.room_name) - getRoomNum(b.room_name);
              }).map(c => <option key={c.id} value={c.room_name}>{c.room_name}</option>)}
            </select>
          </div>
          <div style={{minWidth:280}}>
            <label style={{display:"block", marginBottom:10, fontSize:14, fontWeight:800}}>เลือกนักเรียน</label>
            <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} className="adm-input" disabled={!filterClass}>
              <option value="">-- เลือกนักเรียน --</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.prefix}{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div style={{minWidth:160}}>
            <label style={{display:"block", marginBottom:10, fontSize:14, fontWeight:800}}>ปีการศึกษา</label>
            <select value={activeYear} onChange={e => setActiveYear(e.target.value)} className="adm-input">
              {academicYears.map(y => <option key={y.id} value={y.year}>{y.year}</option>)}
            </select>
          </div>
          <div style={{display:"flex", gap:12}}>
            <button onClick={handlePrint} disabled={!filterStudentId} className="adm-btn adm-btn-primary" style={{height:48, padding:"0 32px", fontSize:16, fontWeight:900, display:"flex", alignItems:"center", gap:10, background: isKG ? "#db2777" : undefined, borderColor: isKG ? "#db2777" : undefined}}>
              <Printer size={20}/> พิมพ์รายงาน
            </button>
            <button onClick={handleDownloadPDF} disabled={!filterStudentId} className="adm-btn" style={{height:48, padding:"0 32px", fontSize:16, fontWeight:900, display:"flex", alignItems:"center", gap:10, background: "linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", boxShadow: "0 10px 20px rgba(16,185,129,0.2)", cursor: "pointer", opacity: !filterStudentId ? 0.6 : 1}}>
              <Download size={20}/> ดาวน์โหลดเอกสาร
            </button>
          </div>
        </div>
      </div>
      {filterStudentId && (
        <div className="print-area animate-slide-up" style={{background: "#fff", padding: "12mm", width: "210mm", height: "297mm", margin: "0 auto", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden", boxSizing: "border-box"}}>
          {isFetchingGrades && (
            <div style={{position:"absolute", inset:0, background:"rgba(255,255,255,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center"}}>
              <div style={{textAlign:"center"}}>
                <RefreshCw className="animate-spin" size={40} style={{color:"#4f46e5", margin:"0 auto 16px"}}/>
                <div style={{fontWeight:800, color:"#1e293b"}}>กำลังดึงข้อมูล...</div>
              </div>
            </div>
          )}
          <div style={{width:"100%", height:"100%", position:"relative", color:"#000", fontFamily:"'Sarabun', sans-serif"}}>
            <div style={{textAlign:"center", marginBottom:12}}>
              <img src={schoolInfo.logo || "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Sema_Thai_Ministry_of_Education.png/600px-Sema_Thai_Ministry_of_Education.png"} alt="logo" style={{width:45, marginBottom:5}} />
              <h2 style={{fontSize:16, fontWeight:900, marginBottom:1, color:"#1e293b"}}>แบบรายงานผลการพัฒนา{isKG ? "" : "ผู้เรียน"}รายบุคคล</h2>
              <div style={{fontSize:14, fontWeight:700, color:"#4f46e5", marginBottom:1}}>โรงเรียนวัดสามัคคีธรรม</div>
              <div style={{fontSize:11, color:"#64748b", fontWeight:600}}>สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุพรรณบุรี เขต 3</div>
              <div style={{marginTop:5, display:"inline-flex", alignItems:"center", gap:8, background:"#f8fafc", padding:"2px 12px", borderRadius:100, border:"1px solid #e2e8f0"}}>
                <Calendar size={12} style={{color:"#6366f1"}}/>
                <span style={{fontWeight:800, color:"#1e293b", fontSize:11}}>ปีการศึกษา {activeYear}</span>
              </div>
            </div>
            
            <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:25, padding:"5px 0", borderBottom:"1.5px solid #f1f5f9", marginBottom:8}}>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase"}}>เลขที่:</span>
                <span style={{fontSize:14, fontWeight:900, color:"#1e293b"}}>{studentOrder || "-"}</span>
              </div>
              <div style={{width:1, height:10, background:"#e2e8f0"}}/>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase"}}>ชั้นเรียน:</span>
                <span style={{fontSize:14, fontWeight:900, color:"#1e293b"}}>{activeClass?.level_name}</span>
              </div>
              <div style={{width:1, height:10, background:"#e2e8f0"}}/>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <span style={{fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase"}}>ชื่อ-นามสกุล:</span>
                <span style={{fontSize:15, fontWeight:900, color:"#1e293b"}}>{stObj?.prefix}{stObj?.first_name} {stObj?.last_name}</span>
              </div>
            </div>

            {isKG ? (
              <div className="kg-report">
                <div style={{textAlign:"center", marginBottom:10}}>
                  <h3 style={{fontSize:16, fontWeight:900, color:"#1e293b", marginBottom:2}}>สรุปผลการประเมินพัฒนาการ</h3>
                  <p style={{fontSize:11, color:"#94a3b8", fontWeight:700}}>(ดี=3, พอใช้=2, ปรับปรุง=1)</p>
                </div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:15}}>
                  {[
                    { label: "ด้านร่างกาย", color: "#ecfdf5", text: "#10b981", key: "ร่างกาย" },
                    { label: "ด้านอารมณ์-จิตใจ", color: "#eff6ff", text: "#3b82f6", key: "อารมณ์" },
                    { label: "ด้านสังคม", color: "#fffbeb", text: "#f59e0b", key: "สังคม" },
                    { label: "ด้านสติปัญญา", color: "#f5f3ff", text: "#8b5cf6", key: "สติปัญญา" }
                  ].map((card, i) => {
                    // Universal Search: Scan BOTH subjects and activities for the developmental keyword
                    const grade = grades.find(g => {
                      const subjName = g.subjects?.subject_name || "";
                      const actName = g.activities?.activity_type || g.activities?.activity_name || "";
                      return subjName.includes(card.key) || actName.includes(card.key);
                    });
                    const val = grade ? (grade.grade || "-") : "-";
                    
                    return (
                      <div key={i} style={{background:card.color, borderRadius:16, padding:15, textAlign:"center", border:"1px solid rgba(0,0,0,0.05)"}}>
                        <div style={{fontSize:13, fontWeight:900, color:card.text, marginBottom:8}}>{card.label}</div>
                        <div style={{fontSize:32, fontWeight:900, color:card.text}}>{val}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{border:"2px dashed #cbd5e1", borderRadius:20, padding:20, textAlign:"center", background:"#f8fafc", marginBottom:20}}>
                   <div style={{fontSize:15, fontWeight:800, color:"#64748b", marginBottom:8}}>สรุปพัฒนาการภาพรวม</div>
                   <div style={{fontSize:24, fontWeight:900, color:"#1e293b"}}>สมตัว</div>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:25, alignItems:"flex-end", paddingRight:20}}>
                   <div style={{textAlign:"center", width:240}}>
                     <div style={{marginBottom:35, fontSize:12, color:"#94a3b8"}}>ลงชื่อ............................................................</div>
                     <div style={{fontSize:15, fontWeight:800, color:"#1e293b"}}>{roomTeacherName}</div>
                     <div style={{fontSize:15, fontWeight:700, color:"#64748b"}}>ครูประจำชั้น</div>
                   </div>
                   <div style={{textAlign:"center", width:240}}>
                     <div style={{marginBottom:35, fontSize:12, color:"#94a3b8"}}>ลงชื่อ............................................................</div>
                     <div style={{fontSize:15, fontWeight:800, color:"#1e293b"}}>{schoolInfo.director_name || "................................................"}</div>
                     <div style={{fontSize:15, fontWeight:700, color:"#64748b"}}>ผู้อำนวยการโรงเรียน</div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="p6-report">
                <table style={{width:"100%", borderCollapse:"collapse", border:"1.2px solid #000", marginBottom:10}}>
                   <thead>
                     <tr style={{background:"#fcfcfc"}}>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, width:40, fontSize:12, fontWeight:800}}>ลำดับที่</th>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, width:80, fontSize:12, fontWeight:800}}>รหัสวิชา</th>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, fontSize:12, fontWeight:800}}>รายวิชา</th>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, width:75, fontSize:12, fontWeight:800}}>ประเภท</th>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, width:75, fontSize:12, fontWeight:800}}>น้ำหนัก/ชม.</th>
                        <th colSpan="2" style={{border:"1px solid #000", padding:2, fontSize:12, fontWeight:800}}>ผลการเรียน</th>
                        <th rowSpan="2" style={{border:"1px solid #000", padding:3, width:75, fontSize:12, fontWeight:800}}>หมายเหตุ</th>
                     </tr>
                     <tr style={{background:"#fcfcfc"}}>
                        <th style={{border:"1px solid #000", padding:2, fontSize:11, width:50, fontWeight:800}}>ร้อยละ</th>
                        <th style={{border:"1px solid #000", padding:2, fontSize:11, width:50, fontWeight:800}}>เกรด</th>
                     </tr>
                   </thead>
                   <tbody>
                      {displayRows.map(row => (
                        <tr key={row.no} style={{height:25}}>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:13}}>{row.no}</td>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:12, fontWeight:600}}>{row.code}</td>
                           <td style={{border:"1px solid #000", padding:"1px 8px", fontSize:13, fontWeight:700}}>{row.name}</td>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:12}}>{row.type === "วิชาพื้นฐาน" ? "พื้นฐาน" : row.type}</td>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:13, fontWeight:600}}>{row.hours}</td>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:13, fontWeight:800}}>{row.score || "-"}</td>
                           <td style={{border:"1px solid #000", padding:2, textAlign:"center", fontSize:14, fontWeight:900}}>{row.result}</td>
                           <td style={{border:"1px solid #000", padding:2}}></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
                <div style={{display:"flex", justifyContent:"space-between", gap:20, marginTop:8, alignItems:"flex-start"}}>
                   <div style={{width:225}}>
                      <table style={{width:"100%", borderCollapse:"collapse", border:"1px solid #000", textAlign:"center"}}>
                         <thead>
                            <tr>
                               <th colSpan="2" style={{border:"1px solid #000", padding:3, fontSize:13, background:"#fcfcfc", fontWeight:800}}>สรุปผลการประเมิน</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr>
                               <td style={{border:"1px solid #000", padding:4, fontSize:13, textAlign:"left", paddingLeft:10}}>น้ำหนักวิชาพื้นฐาน</td>
                               <td style={{border:"1px solid #000", padding:4, fontSize:13, fontWeight:700, width:60}}>{baseWeight.toFixed(1)}</td>
                            </tr>
                            <tr>
                               <td style={{border:"1px solid #000", padding:4, fontSize:13, textAlign:"left", paddingLeft:10}}>น้ำหนักวิชาเพิ่มเติม</td>
                               <td style={{border:"1px solid #000", padding:4, fontSize:13, fontWeight:700}}>{extraWeight.toFixed(1)}</td>
                            </tr>
                            <tr>
                               <td style={{border:"1px solid #000", padding:4, fontSize:14, textAlign:"left", paddingLeft:10, fontWeight:800}}>ผลการเรียนเฉลี่ย</td>
                               <td style={{border:"1px solid #000", padding:4, fontSize:15, fontWeight:900}}>{finalGPA}</td>
                            </tr>
                         </tbody>
                      </table>
                   </div>
                   <div style={{flex:1, display:"flex", flexDirection:"column", gap:25, alignItems:"flex-end", paddingTop:5, paddingRight:15}}>
                      <div style={{textAlign:"center", width:240}}>
                        <div style={{fontSize:12, marginBottom:4, color:"#94a3b8"}}>(....................................................................)</div>
                        <div style={{fontSize:15, fontWeight:800, color:"#1e293b", marginBottom:1}}>{roomTeacherName}</div>
                        <div style={{fontSize:15, fontWeight:700, color:"#64748b"}}>ครูประจำชั้น</div>
                      </div>
                      <div style={{textAlign:"center", width:240}}>
                        <div style={{fontSize:12, marginBottom:4, color:"#94a3b8"}}>(....................................................................)</div>
                        <div style={{fontSize:15, fontWeight:800, color:"#1e293b", marginBottom:1}}>{schoolInfo.director_name || "...................................................."}</div>
                        <div style={{fontSize:15, fontWeight:700, color:"#64748b"}}>ผู้อำนวยการโรงเรียน</div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}