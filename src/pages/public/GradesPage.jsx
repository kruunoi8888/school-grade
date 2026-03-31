import React, { useState } from "react";
import { 
  Search, GraduationCap, School, BookOpen, Hash, 
  Printer, Star, User, Calendar, X, Download, 
  ChevronLeft, Info, Baby, CheckCircle2, Sparkles,
  Award, TrendingUp, ShieldCheck, RefreshCw
} from "lucide-react";
import { supabase } from "../../lib/supabase";

function GradesPage({ schoolInfo, currentAcademicYear, academicYears, students, subjects, classrooms, activities }) {
  const year = String(currentAcademicYear?.year ?? "2568");
  const [search, setSearch] = useState("");
  const [queried, setQueried] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [studentGrades, setStudentGrades] = useState([]);

  const calculateGradeResult = (scoreVal) => {
    const s = parseFloat(scoreVal); if (isNaN(s)) return null;
    if (s >= 80) return "4"; if (s >= 75) return "3.5"; if (s >= 70) return "3"; if (s >= 65) return "2.5"; if (s >= 60) return "2"; if (s >= 55) return "1.5"; if (s >= 50) return "1"; return "0";
  };

  const handleDownloadPDF = () => {
    const element = document.querySelector('.report-document-public');
    if (!element || !window.html2pdf) return;
    setDownloading(true);
    const fileName = `รายงานผลการเรียน_${student?.first_name}_${year}.pdf`;
    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().from(element).set(opt).save().then(() => setDownloading(false)).catch(() => setDownloading(false));
  };

  const handleSearch = async () => {
    let q = search.trim();
    if (!q) return;
    setLoading(true); setSearchError(""); setStudent(null); setStudentGrades([]);
    let found = (students || []).find(s => s.student_id === q);
    if (!found) {
      const parts = q.split(/\s+/);
      const firstName = parts[0]; const lastName = parts[1] || "";
      if (lastName) {
        const matches = (students || []).filter(s => s.first_name.toLowerCase() === firstName.toLowerCase() && s.last_name.toLowerCase() === lastName.toLowerCase());
        if (matches.length > 1) { setSearchError(`พบชื่อซ้ำกัน ${matches.length} คน กรุณาใช้รหัสนักเรียนแทนครับ`); setQueried(q); setLoading(false); return; }
        found = matches[0] || null;
      } else {
        const matches = (students || []).filter(s => s.first_name.toLowerCase() === firstName.toLowerCase());
        if (matches.length > 1) { setSearchError(`พบชื่อ "${firstName}" ซ้ำกัน ${matches.length} คน กรุณาระบุนามสกุลครับ`); setQueried(q); setLoading(false); return; }
        found = matches[0] || null;
      }
    }
    if (!found) { setSearchError(`ไม่พบข้อมูลของ "${q}" กรุณาตรวจสอบการสะกดชื่ออีกครั้งครับ`); setQueried(q); setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('grades').select('*').eq('student_id', found.id).eq('academic_year_id', currentAcademicYear?.id);
      if (error) throw error;
      if (!data || data.length === 0) { setSearchError(`ไม่พบข้อมูลผลการเรียนของปี ${year} ในระบบ`); setQueried(q); setLoading(false); return; }
      setStudentGrades(data); setStudent(found);
    } catch (err) { setSearchError("เกิดข้อผิดพลาดในการดึงข้อมูล"); } finally { setQueried(q); setLoading(false); }
  };

  const isKinder = (classrooms || []).find(c => c.id === student?.classroom_id)?.level_name?.includes("อนุบาล");

  const displayRows = [];
  if (student) {
    const studentLevel = (classrooms || []).find(c => c.id === student.classroom_id)?.level_name || "";
    
    // Subjects
    const levelSubjects = (subjects || []).filter(s => s.level_name === studentLevel)
      .sort((a,b) => {
        const getPriority = (name = "") => {
          const n = name.toLowerCase(); if (n.includes("ไทย")) return 1; if (n.includes("คณิต")) return 2; if (n.includes("วิทยา")) return 3; if (n.includes("สังคม")) return 4; if (n.includes("ประวัติ")) return 5; if (n.includes("สุขศึกษา")) return 6; if (n.includes("ศิลปะ")) return 7; if (n.includes("การงาน")) return 8; if (n.includes("อังกฤษ")) return 9; return 100;
        };
        return getPriority(a.subject_name) - getPriority(b.subject_name);
      });

    levelSubjects.forEach((item, i) => {
      const grade = studentGrades.find(g => g.subject_id === item.id);
      let displayScore = "-"; let displayGrade = "-";
      if (grade) {
          const rawG = grade.grade; const rawS = grade.score || grade.raw_score;
          const numG = parseFloat(rawG); const numS = parseFloat(rawS);
          if (!isNaN(numG) && numG > 4) { displayScore = rawG; displayGrade = calculateGradeResult(numG); } 
          else { displayScore = !isNaN(numS) ? rawS : "-"; displayGrade = rawG || "-"; if (!isNaN(numS) && (!rawG || rawG === "-")) displayGrade = calculateGradeResult(numS); }
      }
      displayRows.push({ no: displayRows.length + 1, code: item.subject_code || "-", name: item.subject_name || "-", type: item.type === 'extra' ? "วิชาเพิ่มทิม" : "วิชาพื้นฐาน", hours: item.credit || "0", score: displayScore, result: displayGrade });
    });

    // Activities
    const levelActivities = (activities || []).filter(a => a.level_name === studentLevel)
      .sort((a,b) => (a.activity_type || "").localeCompare(b.activity_type || ""));

    levelActivities.forEach((act) => {
      const grade = studentGrades.find(g => g.activity_id === act.id);
      displayRows.push({ no: displayRows.length + 1, code: act.activity_code || "-", name: act.activity_type || "-", type: "กิจกรรม", hours: act.hours || "-", score: "-", result: grade ? (grade.grade || "ผ") : "ผ" });
    });
  }

  const academicRows = displayRows.filter(r => r.type !== "กิจกรรม");
  const totalWeight = academicRows.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);
  const totalWeightedPoints = academicRows.reduce((sum, r) => sum + ((parseFloat(r.result) || 0) * (parseFloat(r.hours) || 0)), 0);
  const gpa = totalWeight > 0 ? (totalWeightedPoints / totalWeight).toFixed(2) : "0.00";

  return (
    <div style={{background: "#f8fafc", minHeight: "100vh", fontFamily: "'Sarabun', sans-serif", paddingBottom: 60}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@700;900&family=Sarabun:wght@400;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-title-big { font-size: clamp(2.5rem, 8vw, 5.5rem); font-weight: 950; font-family: 'Kanit'; line-height: 1; text-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .search-container-v4 { background: #fff; padding: 16px; border-radius: 40px; border: 4px solid #4f46e5; display: flex; gap: 16px; max-width: 800px; margin: 0 auto; box-shadow: 0 30px 60px rgba(79, 70, 229, 0.4); }
        .main-table-official { width: 100%; border-collapse: collapse; border: 2.5px solid #000; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
        @media print { .no-print { display: none !important; } .report-document-public { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; padding: 20px !important; } }
      `}</style>

      {/* Hero Search Section - ENHANCED VISIBILITY */}
      {!student && (
        <section style={{background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "140px 24px", textAlign: "center", color: "#fff", borderRadius: "0 0 80px 80px", position: "relative", overflow: "hidden"}}>
           <div style={{maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 10}} className="animate-in">
              <img src={schoolInfo?.logo} style={{width: 120, height: 120, marginBottom: 30, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))"}} alt="logo" />
              <h1 className="hero-title-big">
                 <span style={{color: "#38bdf8"}}>ตรวจสอบ</span><span style={{color: "#4f46e5", background: "#fff", padding: "0 20px", borderRadius: 20, marginLeft: 15}}>ผลการเรียน</span>
              </h1>
              <div style={{fontSize: 28, fontWeight: 800, marginTop: 25, color: "#93c5fd"}}>{schoolInfo?.name || "โรงเรียนวัดสามัคคีธรรม"}</div>
              <p style={{fontSize: 18, opacity: 0.8, marginBottom: 60, fontWeight: 700}}>กรอกรหัสนักเรียน หรือชื่อ-นามสกุล เพื่อเข้าสู่ระบบประเมินผลรายบุคคล</p>
              
              <div className="search-container-v4">
                 <div style={{flex: 2, position: "relative"}}>
                    <input 
                      placeholder="รหัสนักเรียน หรือชื่อ-นามสกุล" 
                      value={search} onChange={e => setSearch(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && handleSearch()} 
                      style={{width: "100%", height: 74, borderRadius: 30, border: "none", padding: "0 24px 0 74px", fontSize: 24, fontWeight: 900, outline: "none", color: "#1e293b"}} 
                    />
                    <Search style={{position: "absolute", left: 28, top: 22, color: "#4f46e5"}} size={30} />
                 </div>
                 <button onClick={handleSearch} disabled={loading} style={{flex: 0.8, background: "#4f46e5", border: "none", borderRadius: 30, color: "#fff", fontWeight: 950, fontSize: 22, cursor: "pointer", transition: "0.2s"}}>
                   {loading ? <RefreshCw className="animate-spin" size={30} /> : "ค้นหาข้อมูล"}
                 </button>
              </div>
              {searchError && <div style={{marginTop: 30, color: "#f87171", fontSize: 22, fontWeight: 900, background: "rgba(0,0,0,0.4)", padding: "10px 30px", borderRadius: 20, display: "inline-block"}}>{searchError}</div>}
           </div>
           {/* Abstract BG elements */}
           <div style={{position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "rgba(79, 70, 229, 0.1)", borderRadius: "50%", filter: "blur(80px)"}}/>
           <div style={{position: "absolute", bottom: -100, left: -100, width: 400, height: 400, background: "rgba(99, 102, 241, 0.1)", borderRadius: "50%", filter: "blur(80px)"}}/>
        </section>
      )}

      {student && (
        <div style={{maxWidth: 1140, margin: "0 auto", padding: "40px 24px"}} className="animate-in">
           <div className="no-print" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40}}>
              <button onClick={() => {setStudent(null); setSearch("");}} style={{display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "2px solid #e2e8f0", padding: "12px 28px", borderRadius: 20, fontSize: 18, fontWeight: 800, cursor: "pointer"}}>
                <ChevronLeft size={24}/> ย้อนกลับ
              </button>
              <div style={{display: "flex", gap: 20}}>
                 <button onClick={handleDownloadPDF} disabled={downloading} style={{background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 20, fontSize: 18, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 20px rgba(14,165,233,0.3)"}}>
                    <Download size={22}/> {downloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลด PDF"}
                 </button>
                 <button onClick={() => window.print()} style={{background: "#1e293b", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 20, fontSize: 18, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 12}}>
                    <Printer size={22}/> พิมพ์เอกสาร
                 </button>
              </div>
           </div>

           <div className="report-document-public" style={{background: "#fff", borderRadius: 40, padding: "50px 60px", border: "1px solid #e2e8f0", boxShadow: "0 40px 100px rgba(0,0,0,0.06)", position: "relative"}}>
              <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(to right, #4f46e5, #ec4899)", borderRadius: "40px 40px 0 0"}} />
              
              <div style={{textAlign: "center", marginBottom: 40}}>
                 <img src={schoolInfo?.logo} style={{width: 100, height: 100, marginBottom: 20}} alt="logo" />
                 <h2 style={{fontSize: 28, fontWeight: 900, color: "#1e293b", marginBottom: 10, fontFamily: "Kanit"}}>แบบรายงานผลการพัฒนาผู้เรียนรายบุคคล</h2>
                 <div style={{fontSize: 22, fontWeight: 800, color: "#4f46e5", marginBottom: 8}}>{schoolInfo?.name}</div>
                 <div style={{fontSize: 16, fontWeight: 600, color: "#64748b", marginBottom: 30}}>{schoolInfo?.district}</div>
                 <div style={{display: "inline-flex", alignItems: "center", gap: 15, background: "#f8fafc", padding: "10px 32px", borderRadius: 100, fontSize: 18, fontWeight: 900, color: "#1e293b", border: "1.5px solid #e2e8f0"}}>
                    <Calendar size={20} style={{color: "#4f46e5"}}/> ปีการศึกษา {year}
                 </div>
              </div>

              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 24, background: "#f8fafc", padding: "30px 40px", borderRadius: 24, border: "2px solid #f1f5f9", marginBottom: 40}}>
                 <div style={{textAlign: "center"}}>
                    <div style={{fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6}}>เลขประจำตัวนักเรียน</div>
                    <div style={{fontSize: 22, fontWeight: 950}}>{student.student_id}</div>
                 </div>
                 <div style={{textAlign: "center"}}>
                    <div style={{fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6}}>ชั้นเรียน / ห้อง</div>
                    <div style={{fontSize: 22, fontWeight: 950}}>{(classrooms || []).find(c => c.id === student.classroom_id)?.level_name}</div>
                 </div>
                 <div style={{textAlign: "center"}}>
                    <div style={{fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6}}>ชื่อ-นามสกุลนักเรียน</div>
                    <div style={{fontSize: 22, fontWeight: 950}}>{student.prefix}{student.first_name} {student.last_name}</div>
                 </div>
              </div>

              {isKinder ? (
                <div style={{textAlign: "center", padding: 60, border: "3px dashed #e2e8f0", borderRadius: 32}}>
                  <h3 style={{fontSize: 26, fontWeight: 900, marginBottom: 15}}>ผลการพัฒนาการระดับปฐมวัย</h3>
                  <p style={{color: "#64748b", fontSize: 18}}>กรุณาติดต่อรับรายงานฉบับจริงได้ที่ห้องวิชาการโรงเรียน</p>
                </div>
              ) : (
                <table className="main-table-official">
                   <thead>
                      <tr style={{background: "#fcfcfc"}}>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 6px", width: 60, fontSize: 14, fontWeight: 950}}>ลำดับที่</th>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 6px", width: 100, fontSize: 14, fontWeight: 950}}>รหัสวิชา</th>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 15px", textAlign: "left", fontSize: 14, fontWeight: 950}}>รายวิชา</th>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 10px", width: 100, fontSize: 14, fontWeight: 950}}>ประเภท</th>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 6px", width: 90, fontSize: 14, fontWeight: 950}}>น้ำหนัก/ชม.</th>
                         <th colSpan="2" style={{border: "1.5px solid #000", padding: "12px 10px", fontSize: 14, fontWeight: 950}}>ผลการเรียน</th>
                         <th rowSpan="2" style={{border: "1.5px solid #000", padding: "12px 10px", width: 90, fontSize: 14, fontWeight: 950}}>หมายเหตุ</th>
                      </tr>
                      <tr>
                         <th style={{border: "1.5px solid #000", padding: "8px 6px", width: 70, fontSize: 13, fontWeight: 950}}>ร้อยละ</th>
                         <th style={{border: "1.5px solid #000", padding: "8px 6px", width: 70, fontSize: 13, fontWeight: 950}}>เกรด</th>
                      </tr>
                   </thead>
                   <tbody>
                      {displayRows.map(row => (
                        <tr key={row.no}>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 15, fontWeight: 800}}>{row.no}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 14, fontWeight: 800}}>{row.code}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 15px", fontSize: 15, fontWeight: 900}}>{row.name}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 13, fontWeight: 800}}>{row.type}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 15, fontWeight: 800}}>{row.hours}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 15, fontWeight: 900}}>{row.score}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px", textAlign: "center", fontSize: 18, fontWeight: 950}}>{row.result}</td>
                           <td style={{border: "1.2px solid #000", padding: "10px 4px"}}></td>
                        </tr>
                      ))}
                      {[...Array(Math.max(0, 10 - displayRows.length))].map((_, i) => (
                        <tr key={"empty-"+i} style={{height: 40}}>
                           {[...Array(8)].map((__, j) => <td key={j} style={{border: "1.2px solid #000"}} />)}
                        </tr>
                      ))}
                   </tbody>
                </table>
              )}

              {!isKinder && (
                <div style={{marginTop: 35, textAlign: "right"}}>
                   <span style={{fontSize: 18, fontWeight: 800, color: "#64748b", marginRight: 20}}>ผลการเรียนเฉลี่ยรายปี (GPA):</span>
                   <span style={{fontSize: 42, fontWeight: 950, color: "#1e293b", letterSpacing: "-1px"}}>{gpa}</span>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default GradesPage;