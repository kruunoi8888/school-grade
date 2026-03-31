import React, { useState } from "react";
import { 
  Search, GraduationCap, School, BookOpen, Hash, 
  Printer, Star, User, Calendar, X, Download, 
  ChevronLeft, Info, Baby, CheckCircle2, Sparkles,
  Award, TrendingUp, ShieldCheck, RefreshCw,
  Heart, Users, Brain, Activity, ClipboardList
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

  const classroom = (classrooms || []).find(c => c.id === student?.classroom_id);
  const isKinder = classroom?.level_name?.includes("อนุบาล");

  const displayRows = [];
  if (student) {
    const studentLevel = classroom?.level_name || "";
    
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
      displayRows.push({ 
        no: displayRows.length + 1, 
        code: item.subject_code || "-", 
        name: item.subject_name || "-", 
        type: item.type === 'extra' ? "วิชาเพิ่มเติม" : (isKinder ? "การประเมิน" : "วิชาพื้นฐาน"), 
        hours: isKinder ? "-" : (item.credit || "0"), 
        score: displayScore, 
        result: displayGrade 
      });
    });

    // Activities
    const levelActivities = (activities || []).filter(a => a.level_name === studentLevel)
      .sort((a,b) => (a.activity_type || "").localeCompare(b.activity_type || ""));

    levelActivities.forEach((act) => {
      const grade = studentGrades.find(g => g.activity_id === act.id);
      displayRows.push({ no: displayRows.length + 1, code: act.activity_code || "-", name: act.activity_type || "-", type: "กิจกรรมพัฒนาผู้เรียน", hours: act.hours || "-", score: "-", result: grade ? (grade.grade || "ผ") : "ผ" });
    });
  }

  const academicRows = displayRows.filter(r => r.type !== "กิจกรรมพัฒนาผู้เรียน");
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
        .official-table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
        .official-table th, .official-table td { border: 1.2px solid #000; padding: 6px 4px; line-height: 1.2; word-break: break-word; }
        .rating-box { display: inline-flex; gap: 4px; color: #fbbf24; }
        
        /* Mobile Cards Styling */
        .mobile-grade-card { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: none; }
        .info-grid-responsive { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr; gap: 16px; margin-bottom: 25px; }

        @media (max-width: 768px) {
          .official-table-container { display: none; }
          .mobile-grade-card { display: block; }
          .hero-title-big { font-size: 3.5rem; }
          .search-container-v4 { flex-direction: column; border-radius: 24px; padding: 12px; }
          .search-container-v4 input { font-size: 18px !important; padding-left: 55px !important; height: 60px !important; }
          .search-container-v4 svg { left: 20px !important; width: 24px !important; height: 24px !important; top: 18px !important; }
          .search-container-v4 button { height: 60px; font-size: 18px; }
          .info-grid-responsive { grid-template-columns: 1fr 1fr; }
          .student-name-full-mobile { grid-column: 1 / -1; margin-top: 10px; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
          .report-document-public { padding: 30px 20px !important; border-radius: 24px !important; }
        }

        @media print { 
          .no-print, footer, .public-nav, nav, .footer-container, .mobile-nav, .mobile-nav-container, .bottom-nav { display: none !important; } 
          .mobile-grade-card { display: none !important; }
          .official-table-container { display: block !important; }
          body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .report-document-public { 
            box-shadow: none !important; border: none !important; margin: 0 !important; 
            width: 210mm !important; height: 297mm !important; 
            max-height: 297mm !important;
            padding: 10mm 15mm !important; 
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
          } 
          @page { size: A4; margin: 0; }
          .official-table td { font-size: 13px !important; }
        }
      `}</style>

      {/* Hero Search Section */}
      {!student && (
        <section style={{background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "140px 24px", textAlign: "center", color: "#fff", borderRadius: "0 0 80px 80px", position: "relative", overflow: "hidden"}}>
           <div style={{maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 10}} className="animate-in">
              <img src={schoolInfo?.logo} style={{width: 90, height: 90, marginBottom: 20, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))"}} alt="logo" />
              <h1 className="hero-title-big" style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
                 <span style={{color: "#38bdf8"}}>ตรวจสอบ</span>
                 <span style={{color: "#4f46e5", background: "#fff", padding: "4px 24px", borderRadius: 20}}>ผลการเรียน</span>
              </h1>
              <div style={{fontSize: 22, fontWeight: 800, marginTop: 25, color: "#93c5fd", lineHeight: 1.2}}>{schoolInfo?.name || "โรงเรียนวัดสามัคคีธรรม"}</div>
              <p style={{fontSize: 15, opacity: 0.8, marginBottom: 40, fontWeight: 700, marginTop: 10, lineHeight: 1.5}}>กรอกรหัสนักเรียน หรือชื่อ-นามสกุล<br/>เพื่อเข้าสู่ระบบประเมินผลรายบุคคล</p>
              
              <div className="search-container-v4">
                 <div style={{flex: 2, position: "relative"}}>
                    <input placeholder="รหัสนักเรียน หรือชื่อ-นามสกุล" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} style={{width: "100%", height: 74, borderRadius: 30, border: "none", padding: "0 24px 0 74px", fontSize: 24, fontWeight: 900, outline: "none", color: "#1e293b"}} />
                    <Search style={{position: "absolute", left: 28, top: 22, color: "#4f46e5"}} size={30} />
                 </div>
                 <button onClick={handleSearch} disabled={loading} style={{flex: 0.8, background: "#4f46e5", border: "none", borderRadius: 30, color: "#fff", fontWeight: 950, fontSize: 22, cursor: "pointer", transition: "0.2s"}}>
                   {loading ? <RefreshCw className="animate-spin" size={30} /> : "ค้นหาข้อมูล"}
                 </button>
              </div>
              {searchError && <div style={{marginTop: 30, color: "#f87171", fontSize: 22, fontWeight: 900, background: "rgba(0,0,0,0.4)", padding: "10px 30px", borderRadius: 20, display: "inline-block"}}>{searchError}</div>}
           </div>
        </section>
      )}

      {student && (
        <div style={{maxWidth: 1140, margin: "0 auto", padding: "40px 16px"}} className="animate-in">
           <div className="no-print" style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 15, alignItems: "center", marginBottom: 30}}>
              <button onClick={() => {setStudent(null); setSearch("");}} style={{display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "2px solid #e2e8f0", padding: "10px 20px", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer"}}>
                <ChevronLeft size={20}/> ย้อนกลับ
              </button>
              <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
                 <button onClick={handleDownloadPDF} disabled={downloading} style={{background: "#0ea5e9", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 20px rgba(14,165,233,0.2)"}}>
                    <Download size={20}/> {downloading ? "..." : "ดาวน์โหลด PDF"}
                 </button>
                 <button onClick={() => window.print()} style={{background: "#1e293b", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10}}>
                    <Printer size={20}/> พิมพ์งาน
                 </button>
              </div>
           </div>

           <div className="report-document-public" style={{background: "#fff", borderRadius: 40, padding: "50px 60px", border: "1px solid #e2e8f0", boxShadow: "0 40px 100px rgba(0,0,0,0.06)", position: "relative"}}>
              <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(to right, #38bdf8, #4f46e5)", borderRadius: "40px 40px 0 0"}} />
              
              <div style={{textAlign: "center", marginBottom: 20}}>
                 <img src={schoolInfo?.logo} style={{width: 90, height: 90, marginBottom: 10}} alt="logo" />
                 <h2 style={{fontSize: 26, fontWeight: 900, color: "#1e293b", marginBottom: 4, fontFamily: "Kanit"}}>{isKinder ? "แบบรายงานผลความสำเร็จการประเมินพัฒนาการ" : "แบบรายงานผลการพัฒนาผู้เรียนรายบุคคล"}</h2>
                 <div style={{fontSize: 20, fontWeight: 800, color: "#4f46e5", marginBottom: 6}}>{schoolInfo?.name}</div>
                 <div style={{fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 15}}>{schoolInfo?.district}</div>
                 <div style={{display: "inline-flex", alignItems: "center", gap: 15, background: "#f8fafc", padding: "8px 30px", borderRadius: 100, fontSize: 16, fontWeight: 900, color: "#1e293b", border: "1.5px solid #e2e8f0"}}>
                    <Calendar size={18} style={{color: "#4f46e5"}}/> ปีการศึกษา {year}
                 </div>
              </div>

              <div className="info-grid-responsive" style={{background: "#f8fafc", padding: "20px 30px", borderRadius: 20, border: "2px solid #f1f5f9", marginBottom: 25}}>
                 <div style={{textAlign: "center"}}>
                    <div style={{fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4}}>เลขประจำตัว</div>
                    <div style={{fontSize: 20, fontWeight: 950}}>{student.student_id}</div>
                 </div>
                 <div style={{textAlign: "center"}}>
                    <div style={{fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4}}>ชั้นเรียน</div>
                    <div style={{fontSize: 20, fontWeight: 950}}>{classroom?.level_name}</div>
                 </div>
                 <div className="student-name-full-mobile" style={{textAlign: "center"}}>
                    <div style={{fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4}}>ชื่อ-นามสกุลนักเรียน</div>
                    <div style={{fontSize: 22, fontWeight: 950, whiteSpace: "nowrap"}}>{student.prefix}{student.first_name} {student.last_name}</div>
                 </div>
              </div>

              <h3 style={{fontSize: 20, fontWeight: 900, marginBottom: 20, textAlign: "center", color: "#1e293b"}}>
                <ClipboardList size={22} style={{verticalAlign: "middle", marginRight: 10, color: "#4f46e5"}}/>
                {isKinder ? "บันทึกผลการประเมินพัฒนาการ" : "บันทึกผลการทดสอบรายวิชา"}
              </h3>

              {/* DESKTOP TABLE VIEW */}
              <div className="official-table-container">
                <table className="official-table">
                  <thead>
                      <tr style={{background: "#f8fafc"}}>
                        <th style={{width: 60, textAlign: "center"}}>ลำดับ</th>
                        <th style={{textAlign: "left"}}>รายการ / รายวิชา</th>
                        {!isKinder && <th style={{width: 100, textAlign: "center"}}>ประเภท</th>}
                        <th style={{width: 110, textAlign: "center"}}>{isKinder ? "ระดับ" : "หน่วยกิต/ชม."}</th>
                        <th style={{width: 110, textAlign: "center"}}>{isKinder ? "ความหมาย" : "เกรด"}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {displayRows.map(row => {
                        const scoreNum = parseFloat(row.result);
                        const kinderLabel = scoreNum === 3 ? "ดีมาก" : (scoreNum === 2 ? "ดี" : (scoreNum === 1 ? "พอใช้" : (row.result !== "-" ? row.result : "-")));
                        const isDevelopment = isKinder && !row.type.includes("กิจกรรม");
                        return (
                          <tr key={row.no}>
                            <td style={{textAlign: "center", fontWeight: 800}}>{row.no}</td>
                            <td style={{fontWeight: 900}}>
                              {isDevelopment ? (
                                <div style={{display: "flex", alignItems: "center", gap: 10}}>
                                  {row.name.includes("ร่างกาย") && <Activity size={18} color="#ef4444"/>}
                                  {row.name.includes("อารมณ์") && <Heart size={18} color="#ec4899"/>}
                                  {row.name.includes("สังคม") && <Users size={18} color="#0ea5e9"/>}
                                  {row.name.includes("สติปัญญา") && <Brain size={18} color="#8b5cf6"/>}
                                  {row.name}
                                </div>
                              ) : (
                                <>
                                  <span style={{fontSize: 12, color: "#94a3b8", marginRight: 8}}>{row.code}</span>
                                  {row.name}
                                </>
                              )}
                            </td>
                            {!isKinder && <td style={{textAlign: "center", fontSize: 13, fontWeight: 700}}>{row.type}</td>}
                            <td style={{textAlign: "center", fontSize: 18, fontWeight: 950}}>
                              {isKinder ? (
                                isNaN(scoreNum) ? row.result : (
                                  <div className="rating-box">
                                    {[...Array(scoreNum)].map((_, i) => <Star key={i} size={15} fill="currentColor"/>)}
                                  </div>
                                )
                              ) : row.hours}
                            </td>
                            <td style={{textAlign: "center", fontSize: 18, fontWeight: 950, color: scoreNum >= 3 ? "#059669" : "#1e293b"}}>
                              {isKinder ? kinderLabel : row.result}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="no-print">
                {displayRows.map(row => {
                  const scoreNum = parseFloat(row.result);
                  const kinderLabel = scoreNum === 3 ? "ดีมาก" : (scoreNum === 2 ? "ดี" : (scoreNum === 1 ? "พอใช้" : (row.result !== "-" ? row.result : "-")));
                  return (
                    <div key={row.no} className="mobile-grade-card">
                       <div style={{display: "flex", justifyContent: "space-between", marginBottom: 12}}>
                          <div style={{fontSize: 12, fontWeight: 800, color: "#64748b"}}>{row.code} • {row.type}</div>
                          <div style={{background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800}}>ลำดับ {row.no}</div>
                       </div>
                       <div style={{fontSize: 20, fontWeight: 950, color: "#1e293b", marginBottom: 15}}>{row.name}</div>
                       <div style={{display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: 12}}>
                          <div>
                             <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4}}>{isKinder ? "ประเมิน" : "นก./ชม."}</div>
                             <div style={{fontSize: 18, fontWeight: 900}}>
                                {isKinder && !isNaN(scoreNum) ? (
                                  <div className="rating-box">
                                    {[...Array(scoreNum)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                                  </div>
                                ) : row.hours}
                             </div>
                          </div>
                          <div style={{textAlign: "right"}}>
                             <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4}}>ผลการเรียน</div>
                             <div style={{fontSize: 24, fontWeight: 950, color: scoreNum >= 3 ? "#059669" : "#4f46e5"}}>
                                {isKinder ? kinderLabel : row.result}
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>

              {!isKinder && (
                <div style={{marginTop: 35, textAlign: "right"}}>
                   <span style={{fontSize: 18, fontWeight: 800, color: "#64748b", marginRight: 20}}>ผลการเรียนเฉลี่ยรายปี (GPA):</span>
                   <span style={{fontSize: 48, fontWeight: 950, color: "#1e293b", letterSpacing: "-2px"}}>{gpa}</span>
                </div>
              )}

              {isKinder && (
                <div style={{marginTop: 40, padding: 25, background: "#fdf2f8", borderRadius: 24, border: "2px dashed #f9a8d4"}}>
                  <h4 style={{fontSize: 18, fontWeight: 900, color: "#be185d", marginBottom: 10, display: "flex", alignItems: "center", gap: 10}}>
                    <Sparkles size={20}/> คำแนะนำสำหรับผู้ปกครอง
                  </h4>
                  <p style={{fontSize: 15, color: "#9d174d", lineHeight: 1.6, fontWeight: 700}}>
                    การประเมินพัฒนาการระดับปฐมวัยมุ่งเน้นการเจริญเติบโตตามวัยทั้ง 4 ด้าน หากนักเรียนมีระดับพัฒนาการ "ดี" (2-3 ดาว) แสดงว่านักเรียนมีความพร้อมในการก้าวสู่ระดับชั้นถัดไปอย่างสมบูรณ์
                  </p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default GradesPage;