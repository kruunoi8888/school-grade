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

    const normalizedQuery = q.replace(/\s+/g, '')
      .replace(/^ด\.ช\./, 'เด็กชาย')
      .replace(/^ด\.ญ\./, 'เด็กหญิง')
      .replace(/^น\.ส\./, 'นางสาว');

    let found = (students || []).find(s => s.student_id === q);
    
    if (!found) {
      const allStudents = (students || []);
      // 1. Try Exact Match First (Full Name or Prefix+Full Name)
      found = allStudents.find(s => {
        const sPrefix = (s.prefix || "").trim();
        const sFirst = (s.first_name || "").trim();
        const sLast = (s.last_name || "").trim();
        const fullStick = `${sPrefix}${sFirst}${sLast}`.replace(/\s+/g, '');
        const fullSpace = `${sFirst}${sLast}`.replace(/\s+/g, '');
        return fullStick === normalizedQuery || fullSpace === normalizedQuery;
      });

      // 2. If no exact, try partial
      if (!found) {
        const matches = allStudents.filter(s => {
          const sPrefix = (s.prefix || "").trim();
          const sFirst = (s.first_name || "").trim();
          const sLast = (s.last_name || "").trim();
          const full1 = `${sPrefix}${sFirst}${sLast}`.replace(/\s+/g, '');
          const full2 = `${sFirst}${sLast}`.replace(/\s+/g, '');
          return full1.includes(normalizedQuery) || full2.includes(normalizedQuery) || normalizedQuery.includes(sFirst);
        });

        if (matches.length > 1) {
          setSearchError(`พบชื่อใกล้เคียงกัน ${matches.length} คน กรุณาระบุนามสกุลหรือระบุชื่อให้ชัดเจนขึ้นครับ`);
          setQueried(q); setLoading(false); return;
        }
        found = matches[0] || null;
      }
    }

    if (!found) {
      setSearchError(`ไม่พบข้อมูลของ "${q}" กรุณาตรวจสอบการสะกดชื่ออีกครั้งครับ`);
      setQueried(q); setLoading(false); return;
    }

    try {
      const { data, error } = await supabase.from('grades').select('*').eq('student_id', found.id).eq('academic_year_id', currentAcademicYear?.id);
      if (error) throw error;
      if (!data || data.length === 0) {
        setSearchError(`ไม่พบข้อมูลผลการเรียนของปี ${year} ในระบบ`);
        setQueried(q); setLoading(false); return;
      }
      setStudentGrades(data); setStudent(found);
    } catch (err) {
      setSearchError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setQueried(q); setLoading(false);
    }
  };

  const classroom = (classrooms || []).find(c => c.id === student?.classroom_id);
  const isKinder = classroom?.level_name?.includes("อนุบาล");

  const displayRows = [];
  if (student) {
    const studentLevel = classroom?.level_name || "";
    
    const getSubjectPriority = (name = "", type = "") => {
      const n = name.toLowerCase();
      if (type === 'กิจกรรมพัฒนาผู้เรียน') {
        if (n.includes("แนะแนว")) return 1001;
        if (n.includes("ลูกเสือ") || n.includes("เนตรนารี")) return 1002;
        if (n.includes("ชุมนุม") || n.includes("ชมรม")) return 1003;
        if (n.includes("สังคม") || n.includes("สาธารณ") || n.includes("ประโยชน์")) return 1004;
        return 1100;
      }
      if (type !== 'extra') {
        if (n.includes("ไทย")) return 1;
        if (n.includes("คณิต")) return 2;
        if (n.includes("วิทยา") || n.includes("เทคโนโลยี")) return 3;
        if (n.includes("สังคม") || n.includes("ศาสนา") || n.includes("วัฒนธรรม")) return 4;
        if (n.includes("ประวัติ")) return 5;
        if (n.includes("สุขศึกษา") || n.includes("พลศึกษา")) return 6;
        if (n.includes("ศิลปะ") || n.includes("นาฏศิลป์") || n.includes("ดนตรี")) return 7;
        if (n.includes("การงาน")) return 8;
        if (n.includes("อังกฤษ") || n.includes("ต่างประเทศ")) return 9;
        return 100;
      }
      if (n.includes("ทุจริต")) return 501;
      if (n.includes("หน้าที่พลเมือง")) return 502;
      return 600;
    };

    const sortedSubjects = (subjects || [])
      .filter(s => s.level_name === studentLevel)
      .sort((a, b) => getSubjectPriority(a.subject_name, a.type) - getSubjectPriority(b.subject_name, b.type));

    sortedSubjects.forEach((item) => {
      const grade = studentGrades.find(g => g.subject_id === item.id);
      let displayScore = "-"; let displayGrade = "-";
      if (grade) {
          const rawG = grade.grade;
          const numG = parseFloat(rawG);
          if (!isNaN(numG) && numG > 4) { displayScore = rawG; displayGrade = calculateGradeResult(numG); }
          else { displayScore = "-"; displayGrade = rawG || "-"; }
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

    const sortedActivities = (activities || [])
      .filter(a => a.level_name === studentLevel || a.level_name === "*" || a.level_name?.includes("ทุกระดับ"))
      .sort((a,b) => getSubjectPriority(a.activity_type, 'กิจกรรม') - getSubjectPriority(b.activity_type, 'กิจกรรม'));

    sortedActivities.forEach((act) => {
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
        .official-table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
        .official-table th, .official-table td { border: 1.2px solid #000; padding: 6px 4px; line-height: 1.2; word-break: break-word; }
        .rating-box { display: inline-flex; gap: 4px; color: #fbbf24; }
        .mobile-grade-card { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: none; }
        .info-grid-responsive { display: grid; grid-template-columns: auto auto auto; gap: 40px; margin-bottom: 25px; justify-content: center; }

        @media (max-width: 768px) {
          .official-table-container { display: none; }
          .mobile-grade-card { display: block; }
          .hero-title-big { font-size: 3.5rem; }
          .search-container-v4 { flex-direction: column; border-radius: 24px; padding: 12px; }
          .search-container-v4 input { font-size: 18px !important; padding-left: 55px !important; height: 60px !important; }
          .search-container-v4 svg { left: 20px !important; width: 24px !important; height: 24px !important; top: 18px !important; }
          .search-container-v4 button { height: 60px; font-size: 18px; }
          .info-grid-responsive { grid-template-columns: 1fr 1.2fr 2.5fr; gap: 15px; }
          .report-document-public { padding: 30px 20px !important; border-radius: 24px !important; }
        }

        @media print { 
          .no-print, footer, .public-nav, nav, .footer-container, .mobile-nav, .mobile-nav-container, .bottom-nav { display: none !important; } 
          .mobile-grade-card { display: none !important; }
          .official-table-container { display: block !important; }
          body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; height: 297mm !important; overflow: hidden !important; }
          .report-document-public { 
            box-shadow: none !important; border: none !important; margin: 0 !important; 
            width: 210mm !important; height: 297mm !important; padding: 10mm 15mm !important; 
            overflow: hidden !important;
            box-sizing: border-box !important;
          } 
          @page { size: A4; margin: 0; }
        }
      `}</style>

      {!student && (
        <section style={{background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", padding: "140px 24px", textAlign: "center", color: "#fff", borderRadius: "0 0 80px 80px", position: "relative", overflow: "hidden"}}>
           <div style={{maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 10}} className="animate-in">
              <img src={schoolInfo?.logo} style={{width: 90, height: 90, marginBottom: 20}} alt="logo" />
              <h1 className="hero-title-big">
                 <span style={{color: "#38bdf8"}}>ตรวจสอบ</span>
                 <span style={{color: "#4f46e5", background: "#fff", padding: "4px 24px", borderRadius: 20}}>ผลการเรียน</span>
              </h1>
              <div style={{fontSize: 22, fontWeight: 800, marginTop: 25, color: "#93c5fd"}}>{schoolInfo?.name || "โรงเรียนวัดสามัคคีธรรม"}</div>
              <div className="search-container-v4" style={{marginTop: 40}}>
                 <div style={{flex: 2, position: "relative"}}>
                    <input placeholder="รหัสนักเรียน หรือชื่อ-นามสกุล" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} style={{width: "100%", height: 74, borderRadius: 30, border: "none", padding: "0 24px 0 74px", fontSize: 24, fontWeight: 900, outline: "none", color: "#1e293b"}} />
                    <Search style={{position: "absolute", left: 28, top: 22, color: "#4f46e5"}} size={30} />
                 </div>
                 <button onClick={handleSearch} disabled={loading} style={{flex: 0.8, background: "#4f46e5", border: "none", borderRadius: 30, color: "#fff", fontWeight: 950, fontSize: 22, cursor: "pointer"}}>
                   {loading ? <RefreshCw className="animate-spin" size={30} /> : "ค้นหาข้อมูล"}
                 </button>
              </div>
              {searchError && <div style={{marginTop: 30, color: "#f87171", fontSize: 22, fontWeight: 900}}>{searchError}</div>}
           </div>
        </section>
      )}

      {student && (
        <div style={{maxWidth: 1140, margin: "0 auto", padding: "40px 16px"}} className="animate-in">
           <div className="no-print" style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 15, alignItems: "center", marginBottom: 30}}>
              <button onClick={() => {setStudent(null); setSearch("");}} style={{display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "2px solid #e2e8f0", padding: "10px 20px", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer"}}>
                <ChevronLeft size={20}/> ย้อนกลับ
              </button>
              <div style={{display: "flex", gap: 12}}>
                 <button onClick={handleDownloadPDF} disabled={downloading} style={{background: "#0ea5e9", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10}}>
                    <Download size={20}/> {downloading ? "..." : "ดาวน์โหลด PDF"}
                 </button>
                 <button onClick={() => window.print()} style={{background: "#1e293b", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10}}>
                    <Printer size={20}/> พิมพ์งาน
                 </button>
              </div>
           </div>

           <div className="report-document-public" style={{background: "#fff", borderRadius: 40, padding: "50px 60px", border: "1px solid #e2e8f0", boxShadow: "0 40px 100px rgba(0,0,0,0.06)", position: "relative"}}>
              <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(to right, #38bdf8, #4f46e5)", borderRadius: "40px 40px 0 0"}} />
              
              <div style={{textAlign: "center", marginBottom: 15}}>
                 <img src={schoolInfo?.logo} style={{width: 70, height: 70, marginBottom: 8}} alt="logo" />
                 <h2 style={{fontSize: 20, fontWeight: 900, color: "#1e293b", marginBottom: 2, fontFamily: "Kanit"}}>{isKinder ? "แบบรายงานผลความสำเร็จการประเมินพัฒนาการ" : "แบบรายงานผลการพัฒนาผู้เรียนรายบุคคล"}</h2>
                 <div style={{fontSize: 16, fontWeight: 800, color: "#4f46e5", marginBottom: 4}}>{schoolInfo?.name}</div>
                 <div style={{display: "inline-flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "6px 20px", borderRadius: 100, fontSize: 13, fontWeight: 900, color: "#1e293b", border: "1.5px solid #e2e8f0"}}>
                    <Calendar size={15} style={{color: "#4f46e5"}}/> ปีการศึกษา {year}
                 </div>
              </div>

              <div className="info-grid-responsive" style={{background: "#f8fafc", padding: "12px 24px", borderRadius: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1.2fr 2.5fr", gap: 15}}>
                 <div style={{textAlign: "left"}}>
                    <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2}}>เลขที่</div>
                    <div style={{fontSize: 15, fontWeight: 950}}>
                      {(() => {
                        if (student.student_no) return student.student_no;
                        const classStudents = (students || [])
                          .filter(s => s.classroom_id === student.classroom_id);
                        const idx = classStudents.findIndex(s => s.id === student.id);
                        return idx !== -1 ? idx + 1 : "-";
                      })()}
                    </div>
                 </div>
                 <div style={{textAlign: "left", borderLeft: "1.5px solid #e2e8f0", paddingLeft: 15}}>
                    <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2}}>ชั้นเรียน</div>
                    <div style={{fontSize: 15, fontWeight: 950}}>{classroom?.level_name}</div>
                 </div>
                 <div className="student-name-full-mobile" style={{textAlign: "left", borderLeft: "1.5px solid #e2e8f0", paddingLeft: 15}}>
                    <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2}}>ชื่อ-นามสกุลนักเรียน</div>
                    <div style={{fontSize: 18, fontWeight: 950, whiteSpace: "nowrap"}}>{student.prefix}{student.first_name} {student.last_name}</div>
                 </div>
              </div>

              {isKinder ? (
                <div className="kg-report-v2 animate-in" style={{marginTop: 20}}>
                   <div style={{textAlign: "center", marginBottom: 15}}>
                      <h3 style={{fontSize: 18, fontWeight: 950, color: "#1e293b", marginBottom: 4}}>สรุปผลการประเมินพัฒนาการ</h3>
                      <p style={{fontSize: 11, color: "#64748b", fontWeight: 700}}>(ดีมาก=3, ดี=2, พอใช้=1)</p>
                   </div>
                   <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, marginBottom: 20}}>
                      {[
                        { label: "ด้านร่างกาย", color: "#ecfdf5", text: "#10b981", key: "ร่างกาย", Icon: Heart },
                        { label: "ด้านอารมณ์-จิตใจ", color: "#eff6ff", text: "#3b82f6", key: "อารมณ์", Icon: Brain },
                        { label: "ด้านสังคม", color: "#fffbeb", text: "#f59e0b", key: "สังคม", Icon: Users },
                        { label: "ด้านสติปัญญา", color: "#f5f3ff", text: "#8b5cf6", key: "สติปัญญา", Icon: Sparkles }
                      ].map((card, i) => {
                        const grade = studentGrades.find(g => {
                          const subjName = subjects.find(s => s.id === g.subject_id)?.subject_name || "";
                          const actName = activities.find(a => a.id === g.activity_id)?.activity_type || activities.find(a => a.id === g.activity_id)?.activity_name || "";
                          return subjName.includes(card.key) || actName.includes(card.key);
                        });
                        const val = grade ? (grade.grade || "-") : "-";
                        return (
                          <div key={i} style={{background: card.color, borderRadius: 20, padding: "16px 12px", textAlign: "center", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 6px 12px rgba(0,0,0,0.02)"}}>
                            <div style={{width: 32, height: 32, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"}}>
                              <card.Icon size={18} style={{color: card.text}}/>
                            </div>
                            <div style={{fontSize: 12, fontWeight: 900, color: card.text, marginBottom: 4}}>{card.label}</div>
                            <div style={{fontSize: 32, fontWeight: 950, color: card.text}}>{val}</div>
                            <div style={{fontSize: 10, fontWeight: 800, color: card.text, opacity: 0.7, marginTop: 2}}>
                              {val === "3" ? "ดีมาก" : (val === "2" ? "ดี" : (val === "1" ? "พอใช้" : ""))}
                            </div>
                          </div>
                        );
                      })}
                   </div>
                   <div style={{border: "2px dashed #cbd5e1", borderRadius: 24, padding: "20px 24px", textAlign: "center", background: "#f8fafc", marginBottom: 20}}>
                      <div style={{fontSize: 14, fontWeight: 800, color: "#64748b", marginBottom: 6}}>สรุปพัฒนาการภาพรวม</div>
                      <div style={{fontSize: 24, fontWeight: 950, color: "#1e293b"}}>สมตัว</div>
                   </div>
                </div>
              ) : (
                <>
                  <div className="official-table-container">
                    <table className="official-table">
                      <thead>
                          <tr style={{background: "#f8fafc"}}>
                            <th style={{width: 50, textAlign: "center"}}>ลำดับ</th>
                            <th style={{textAlign: "left"}}>รายการ / รายวิชา</th>
                            <th style={{width: 80, textAlign: "center"}}>ประเภท</th>
                            <th style={{width: 80, textAlign: "center"}}>นก./ชม.</th>
                            <th style={{width: 80, textAlign: "center"}}>คะแนน</th>
                            <th style={{width: 80, textAlign: "center"}}>เกรด</th>
                          </tr>
                      </thead>
                      <tbody>
                          {displayRows.map(row => (
                            <tr key={row.no}>
                              <td style={{textAlign: "center", fontWeight: 800}}>{row.no}</td>
                              <td style={{fontWeight: 900}}>
                                <span style={{fontSize: 12, color: "#94a3b8", marginRight: 8}}>{row.code}</span>
                                {row.name}
                              </td>
                              <td style={{textAlign: "center", fontSize: 13, fontWeight: 700}}>{row.type}</td>
                              <td style={{textAlign: "center", fontSize: 18, fontWeight: 950}}>{row.hours}</td>
                              <td style={{textAlign: "center", fontSize: 20, fontWeight: 950, color: "#1e293b"}}>{row.score || "-"}</td>
                              <td style={{textAlign: "center", fontSize: 20, fontWeight: 950, color: (parseFloat(row.result) >= 3 || row.result === "ผ") ? "#059669" : "#4f46e5"}}>
                                {row.result}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="no-print">
                    {displayRows.map(row => {
                      const scoreNum = parseFloat(row.result);
                      return (
                        <div key={row.no} className="mobile-grade-card">
                          <div style={{display: "flex", justifyContent: "space-between", marginBottom: 12}}>
                              <div style={{fontSize: 12, fontWeight: 800, color: "#64748b"}}>{row.code} • {row.type}</div>
                              <div style={{background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800}}>ลำดับ {row.no}</div>
                          </div>
                          <div style={{fontSize: 20, fontWeight: 950, color: "#1e293b", marginBottom: 15}}>{row.name}</div>
                          <div style={{display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "12px 16px", borderRadius: 12, gap: 10}}>
                              <div style={{flex: 1}}>
                                <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4}}>นก./ชม.</div>
                                <div style={{fontSize: 18, fontWeight: 900}}>{row.hours}</div>
                              </div>
                              <div style={{flex: 1, textAlign: "center", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0"}}>
                                <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4}}>คะแนน</div>
                                <div style={{fontSize: 18, fontWeight: 900}}>{row.score || "-"}</div>
                              </div>
                              <div style={{flex: 1, textAlign: "right"}}>
                                <div style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 4}}>เกรด</div>
                                <div style={{fontSize: 22, fontWeight: 950, color: (scoreNum >= 3 || row.result === "ผ") ? "#059669" : "#4f46e5"}}>
                                    {row.result}
                                </div>
                              </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{marginTop: 35, textAlign: "right"}}>
                    <span style={{fontSize: 18, fontWeight: 800, color: "#64748b", marginRight: 20}}>GPA:</span>
                    <span style={{fontSize: 48, fontWeight: 950, color: "#1e293b"}}>{gpa}</span>
                  </div>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default GradesPage;