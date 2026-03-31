import React, { useState } from "react";
import { 
  Search, GraduationCap, School, BookOpen, Hash, 
  Printer, Star, User, Calendar, X, Download, 
  ChevronLeft, ChevronRight, Info, Baby, CheckCircle2, Sparkles, PlusCircle,
  Award, TrendingUp, ShieldCheck, RefreshCw,
  Heart, Users, Brain, Activity, ClipboardList, Lightbulb
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
  const [zoomScale, setZoomScale] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 0.5 : 1);
  const [lastDist, setLastDist] = useState(0);

  const checkMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

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
      if (type.includes('กิจกรรม')) {
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

    const normalizeLevel = (l) => {
      if (!l) return "";
      return l.trim()
        .replace("ประถมศึกษาปีที่ ", "ป.")
        .replace("มัธยมศึกษาปีที่ ", "ม.")
        .replace("อนุบาลปีที่ ", "อนุบาล ")
        .replace("ป. ", "ป.")
        .replace("ม. ", "ม.")
        .replace(" ", ""); // Remove any spaces to match "ป.1" with "ป. 1"
    };
    
    const targetNorm = normalizeLevel(studentLevel);

    const sortedSubjects = (subjects || [])
      .filter(s => {
        const sNorm = normalizeLevel(s.level_name);
        return sNorm === targetNorm || s.level_name === "*" || s.level_name?.includes("ทุกระดับ");
      })
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
      .filter(a => {
        const aNorm = normalizeLevel(a.level_name);
        return aNorm === targetNorm || a.level_name === "*" || a.level_name?.includes("ทุกระดับ");
      })
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
        
        @keyframes gradMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.2); } 50% { box-shadow: 0 0 40px rgba(79, 70, 229, 0.4); } 100% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.2); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rotate-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .animate-up { animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-rotate { animation: rotate-slow 20s linear infinite; }
        
        .hero-title-v2 { font-size: clamp(2rem, 7vw, 5rem); font-weight: 900; font-family: 'Kanit'; line-height: 1.1; margin-bottom: 20px; }
        .gradient-text { background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradMove 5s ease infinite; }
        
        .search-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 35px;
          padding: 12px;
          display: flex;
          gap: 12px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          transition: all 0.4s ease;
        }
        .search-glass:focus-within {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-5px);
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.6);
        }

        .search-input-v5 {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 20px;
          font-weight: 700;
          padding: 0 20px 0 60px;
          height: 64px;
          outline: none;
        }
        .search-input-v5::placeholder { color: rgba(255, 255, 255, 0.5); }

        .search-btn-v5 {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          border-radius: 25px;
          color: #fff;
          font-weight: 950;
          font-size: 18px;
          padding: 0 40px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }
        .search-btn-v5:hover { transform: scale(1.05); filter: brightness(1.1); box-shadow: 0 15px 25px rgba(79, 70, 229, 0.4); }
        .search-btn-v5:active { transform: scale(0.98); }

        .official-table { width: 100%; border-collapse: collapse; border: 2px solid #000; table-layout: fixed; }
        .official-table th, .official-table td { border: 1.2px solid #000; padding: 6px 4px; line-height: 1.2; word-break: break-word; }
        .rating-box { display: inline-flex; gap: 4px; color: #fbbf24; }
        .mobile-grade-card { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; display: none; }
        .info-grid-responsive { display: grid; grid-template-columns: auto auto auto; gap: 40px; margin-bottom: 25px; justify-content: center; }
        
        .no-mobile { display: block; }

        .decor-blob { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 1; opacity: 0.4; }
        .blob-1 { width: 400px; height: 400px; background: #4f46e5; top: -100px; left: -100px; }
        .blob-2 { width: 300px; height: 300px; background: #ec4899; bottom: -50px; right: -50px; }

        @media (max-width: 768px) {
          .search-btn-v5 { height: 50px; width: 100%; justify-content: center; font-size: 16px; }
          .hero-title-v2 { font-size: 2.2rem; margin-bottom: 15px; }
          .search-glass { flex-direction: column; border-radius: 20px; padding: 8px; gap: 6px; }
          .search-input-v5 { font-size: 16px; padding-left: 50px; height: 50px; }
          .info-grid-responsive { grid-template-columns: 1fr 1.2fr 2.5fr !important; gap: 15px !important; padding: 15px 25px !important; text-align: left !important; }
          .student-info-item { display: block !important; align-items: flex-start !important; }
          .student-name-full-mobile { grid-column: span 1 !important; border-top: none !important; margin-top: 0 !important; padding-top: 0 !important; border-left: 1.5px solid #e2e8f0 !important; padding-left: 15px !important; align-items: flex-start !important; }
          .info-label-v2 { font-size: 10px !important; text-align: left !important; }
          .info-value-v2 { font-size: 15px !important; text-align: left !important; }
          .report-document-public { 
             width: 800px !important; 
             min-width: 800px !important; 
             box-shadow: none !important;
             margin: 0 auto !important;
             display: block !important;
          }
          .report-document-wrapper { display: flex; justify-content: center; overflow: hidden; padding: 10px 0; }
          .official-table { width: 100% !important; min-width: 100% !important; }
          .summary-bar-responsive { flex-wrap: nowrap !important; min-width: 100% !important; border-radius: 20px !important; }
          .btn-action-mobile { min-height: 50px; }
          .gpa-card-mobile { padding: 8px 15px !important; gap: 10px !important; border-radius: 18px !important; }
          .gpa-value-mobile { font-size: 32px !important; }
          .gpa-label-mobile { font-size: 9px !important; }
          .gpa-icon-mobile { width: 32px !important; height: 32px !important; }
          .gpa-icon-mobile svg { width: 18px !important; height: 18px !important; }
        }

        .zoom-control-bar {
           display: none; position: sticky; top: 10px; z-index: 50; 
           background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
           padding: 8px 12px; border-radius: 100px; border: 1px solid #e2e8f0;
           box-shadow: 0 10px 25px rgba(0,0,0,0.05); gap: 10px; margin-bottom: 10px;
        }

        @media (max-width: 768px) { 
          .zoom-control-bar { display: inline-flex; }
          .report-document-wrapper { display: flex; justify-content: center; overflow: hidden; padding: 10px 0; }
          .report-document-public { 
             width: 800px !important; 
             min-width: 800px !important; 
             box-shadow: none !important;
             margin: 0 auto !important;
             display: block !important;
          }
        }

        @media print { 
          .no-print, footer, .public-nav, nav, .footer-container, .mobile-nav, .mobile-nav-container, .bottom-nav { display: none !important; } 
          .official-table-container { display: block !important; }
          body, html { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; height: 297mm !important; overflow: hidden !important; }
          .report-document-public { 
            box-shadow: none !important; border: none !important; margin: 0 !important; 
            width: 210mm !important; height: 297mm !important; padding: 1mm 15mm 10mm 15mm !important; 
            overflow: hidden !important;
            box-sizing: border-box !important;
          } 
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {!student && (
        <section style={{background: "#0f172a", minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px"}}>
           {/* Decorative Elements */}
           <div className="decor-blob blob-1"></div>
           <div className="decor-blob blob-2"></div>
           
           <div style={{maxWidth: 1000, width: "100%", margin: "0 auto", position: "relative", zIndex: 10, textAlign: "center"}} className="animate-up">
              {/* Subtle Floating Elements */}
              <div style={{position: "absolute", top: "10%", left: "5%", opacity: 0.03, animation: "float 8s ease-in-out infinite"}} className="no-mobile">
                 <GraduationCap size={180} color="#fff" />
              </div>
              <div style={{position: "absolute", bottom: "20%", right: "8%", opacity: 0.03, animation: "float 10s ease-in-out infinite alternate"}} className="no-mobile">
                 <BookOpen size={150} color="#fff" />
              </div>
              <div style={{position: "absolute", top: "40%", right: "15%", opacity: 0.02, animation: "float 12s ease-in-out infinite"}} className="no-mobile">
                 <Award size={120} color="#fff" />
              </div>

              <h1 className="hero-title-v2">
                 <div style={{color: "#fff", opacity: 0.9}}>ตรวจสอบ</div>
                 <div className="gradient-text">ผลการเรียนออนไลน์</div>
              </h1>
              
              <div style={{fontSize: 20, fontWeight: 600, marginTop: 10, color: "#94a3b8", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6}}>
                {schoolInfo?.name || "โรงเรียนวัดสามัคคีธรรม"} <br/>
                <div style={{display: "flex", justifyContent: "center", gap: 15, marginTop: 15, flexWrap: "wrap"}}>
                  {[
                    { s: "1", t: "ป้อนชื่อ-นามสกุล" },
                    { s: "2", t: "กดปุ่มค้นหา" },
                    { s: "3", t: "ตรวจสอบผลการเรียน" }
                  ].map((step, idx) => (
                    <div key={idx} style={{display: "flex", alignItems: "center", gap: 8, fontSize: 14, background: "rgba(255,255,255,0.03)", padding: "6px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontWeight: 700}}>
                       <span style={{background: "linear-gradient(135deg, #4f46e5, #7c3aed)", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 950, color: "#fff", boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)"}}>{step.s}</span>
                       {step.t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="search-glass">
                 <div style={{flex: 1, position: "relative"}}>
                    <input 
                       className="search-input-v5"
                       placeholder="ใส่ชื่อ-นามสกุลเพื่อค้นหา" 
                       value={search} 
                       onChange={e => setSearch(e.target.value)} 
                       onKeyDown={e => e.key === "Enter" && handleSearch()} 
                    />
                    <Search style={{position: "absolute", left: 24, top: 17, color: "rgba(255,255,255,0.4)"}} size={28} />
                 </div>
                 <button className="search-btn-v5" onClick={handleSearch} disabled={loading}>
                   {loading ? <RefreshCw className="animate-spin" size={24} /> : (
                     <>ค้นหาข้อมูล <ChevronRight size={20} /></>
                   )}
                 </button>
              </div>

              {searchError && (
                <div style={{marginTop: 30, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.1)", padding: "12px 25px", borderRadius: "15px", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 16, fontWeight: 700}}>
                   <Info size={20} /> {searchError}
                </div>
              )}

           </div>
        </section>
      )}


      {student && (
        <div style={{maxWidth: 1140, margin: "0 auto", padding: "10px 16px"}} className="animate-in">
           <div className="no-print" style={{display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 15, alignItems: "center", marginBottom: 30}}>
              <button 
                onClick={() => {setStudent(null); setSearch("");}} 
                className="btn-secondary-v2"
                style={{display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "2px solid #e2e8f0", padding: "12px 24px", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "all 0.3s ease"}}
              >
                <ChevronLeft size={20}/> ย้อนกลับ
              </button>
              <div style={{display: "flex", gap: 12}}>
                 <button 
                   onClick={handleDownloadPDF} 
                   disabled={downloading} 
                   className="btn-primary-glow"
                   style={{background: "#0ea5e9", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s ease", boxShadow: "0 10px 20px rgba(14, 165, 233, 0.2)"}}
                 >
                    <Download size={20}/> {downloading ? "..." : "ดาวน์โหลด PDF"}
                 </button>
                 <button 
                   onClick={() => window.print()} 
                   className="btn-dark-v2"
                   style={{background: "#1e293b", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.3s ease"}}
                 >
                    <Printer size={20}/> พิมพ์ผลการเรียน
                 </button>
              </div>
           </div>

           <div className="no-print" style={{display: "flex", justifyContent: "center", position: "sticky", top: 10, zIndex: 100}}>
              <div className="zoom-control-bar animate-in">
                 <button onClick={() => setZoomScale(s => Math.max(0.4, s - 0.1))} style={{padding: "6px 12px", border: "none", background: "none", cursor: "pointer"}}><Search size={18} style={{transform: "scale(0.8)"}} />-</button>
                 <div style={{width: 1, height: 15, background: "#e2e8f0"}} />
                 <button onClick={() => setZoomScale(1)} style={{fontSize: 12, fontWeight: 800, border: "none", background: "none", cursor: "pointer", color: "#64748b"}}>{Math.round(zoomScale * 100)}%</button>
                 <div style={{width: 1, height: 15, background: "#e2e8f0"}} />
                 <button onClick={() => setZoomScale(s => Math.min(2, s + 0.1))} style={{padding: "6px 12px", border: "none", background: "none", cursor: "pointer"}}><Search size={18} />+</button>
              </div>
           </div>

           <div 
             className="report-document-wrapper" 
             style={{
                perspective: "1000px",
                display: "flex",
                justifyContent: "center",
                width: "100%",
                paddingBottom: 40
             }}
             onTouchMove={(e) => {
                if (e.touches.length === 2 && checkMobile()) {
                  const dist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                  );
                  if (lastDist > 0) {
                    const ratio = dist / lastDist;
                    setZoomScale(s => Math.min(2.5, Math.max(0.3, s * ratio)));
                  }
                  setLastDist(dist);
                }
             }}
             onTouchEnd={() => setLastDist(0)}
           >
             <div className="report-document-public" style={{
                background: "#fff", 
                borderRadius: 40, 
                padding: checkMobile() ? "20px 30px 40px 30px" : "20px 60px 40px 60px", 
                border: "1px solid #e2e8f0", 
                boxShadow: "0 40px 100px rgba(0,0,0,0.06)", 
                position: "relative", 
                overflow: "hidden",
                transform: checkMobile() ? `scale(${zoomScale})` : "none",
                transformOrigin: "top center",
                transition: "transform 0.1s ease-out",
                width: checkMobile() ? 800 : "100%",
                maxWidth: 1000,
                minWidth: checkMobile() ? 800 : "auto",
                margin: "0 auto"
             }}>
              {/* Official Background Watermark */}
              <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-25deg)", opacity: 0.05, width: 400, height: 400, pointerEvents: "none", zIndex: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
                 <img src={schoolInfo?.logo} style={{width: "100%", height: "auto"}} alt="watermark" />
              </div>

              <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(to right, #38bdf8, #4f46e5)", borderRadius: "40px 40px 0 0"}} />
              
              <div style={{textAlign: "center", marginBottom: 8}}>
                 <img src={schoolInfo?.logo} style={{width: 50, height: 50, marginBottom: 2}} alt="logo" />
                 <h2 style={{fontSize: 20, fontWeight: 900, color: "#1e293b", marginBottom: 2, fontFamily: "Kanit"}}>{isKinder ? "แบบรายงานผลความสำเร็จการประเมินพัฒนาการ" : "แบบรายงานผลการเรียนรายบุคคล"}</h2>
                 <div style={{fontSize: 16, fontWeight: 800, color: "#4f46e5", marginBottom: 4}}>{schoolInfo?.name}</div>
                 <div style={{display: "inline-flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "6px 20px", borderRadius: 100, fontSize: 13, fontWeight: 900, color: "#1e293b", border: "1.5px solid #e2e8f0"}}>
                    <Calendar size={15} style={{color: "#4f46e5"}}/> ปีการศึกษา {year}
                 </div>
              </div>

              <div className="info-grid-responsive" style={{background: "#f8fafc", padding: "12px 24px", borderRadius: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1.2fr 2.5fr", gap: 15}}>
                 <div className="student-info-item" style={{textAlign: "left"}}>
                    <div className="info-label-v2" style={{fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 2}}>เลขที่</div>
                    <div className="info-value-v2" style={{fontSize: 15, fontWeight: 950}}>
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
                   <div style={{textAlign: "center", marginBottom: 8}}>
                      <h3 style={{fontSize: 18, fontWeight: 950, color: "#1e293b", marginBottom: 4}}>สรุปผลการประเมินพัฒนาการ</h3>
                      <p style={{fontSize: 11, color: "#64748b", fontWeight: 700}}>(ดีมาก=3, ดี=2, พอใช้=1)</p>
                   </div>
                   <div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, marginBottom: 20}}>
                      {[
                        { label: "ด้านร่างกาย", color: "#ecfdf5", text: "#10b981", key: "ร่างกาย", Icon: Activity },
                        { label: "ด้านอารมณ์-จิตใจ", color: "#fff1f2", text: "#f43f5e", key: "อารมณ์", Icon: Heart },
                        { label: "ด้านสังคม", color: "#fffbeb", text: "#f2920c", key: "สังคม", Icon: Users },
                        { label: "ด้านสติปัญญา", color: "#eff6ff", text: "#2563eb", key: "สติปัญญา", Icon: Lightbulb }
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

                  {/* Mobile cards removed for professional table view */}

                   <div className="summary-bar-responsive" style={{marginTop: 30, background: "linear-gradient(to right, #f8fafc, #fff, #f8fafc)", padding: "20px 30px", borderRadius: 32, border: "1.5px solid #e2e8f0", boxShadow: "0 20px 50px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, position: "relative"}}>
                      <div style={{display: "flex", alignItems: "center", gap: 30, flex: 1}}>
                         <div style={{display: "flex", alignItems: "center", gap: 15}}>
                            <div style={{width: 48, height: 48, borderRadius: 16, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #d1fae5"}}>
                               <BookOpen size={24} style={{color: "#059669"}}/>
                            </div>
                            <div>
                               <div style={{fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2}}>หน่วยกิตพื้นฐาน</div>
                               <div style={{fontSize: 24, fontWeight: 950, color: "#1e293b"}}>{displayRows.filter(r => r.type === "วิชาพื้นฐาน").reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0)} <span style={{fontSize: 14, fontWeight: 800, color: "#94a3b8"}}>นก.</span></div>
                            </div>
                         </div>
                         
                         <div style={{height: 40, width: 1.5, background: "#e2e8f0"}} />

                         <div style={{display: "flex", alignItems: "center", gap: 15}}>
                            <div style={{width: 48, height: 48, borderRadius: 16, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #dbeafe"}}>
                               <PlusCircle size={24} style={{color: "#2563eb"}}/>
                            </div>
                            <div>
                               <div style={{fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2}}>หน่วยกิตเพิ่มเติม</div>
                               <div style={{fontSize: 24, fontWeight: 950, color: "#1e293b"}}>{displayRows.filter(r => r.type === "วิชาเพิ่มเติม").reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0)} <span style={{fontSize: 14, fontWeight: 800, color: "#94a3b8"}}>นก.</span></div>
                            </div>
                         </div>
                      </div>

                         <div className="gpa-card-mobile" style={{background: "linear-gradient(135deg, #4f46e5, #7c3aed)", backgroundColor: "#4f46e5", padding: "12px 35px", borderRadius: 24, color: "#fff", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 15px 35px rgba(79, 70, 229, 0.2)", border: "1px solid rgba(255,255,255,0.1)", position: "relative", overflow: "hidden"}}>
                            {/* Subtle Glow Sparkle */}
                            <div style={{position: "absolute", top: -10, right: -10, opacity: 0.2}}>
                               <Award size={60} strokeWidth={1} />
                            </div>
                            
                            <div style={{textAlign: "right", position: "relative", zIndex: 1}}>
                               <div className="gpa-label-mobile" style={{fontSize: 11, fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2}}>เกรดเฉลี่ย</div>
                               <div className="gpa-value-mobile" style={{fontSize: 48, fontWeight: 950, lineHeight: 1, letterSpacing: "-1px"}}>{gpa}</div>
                            </div>
                            <div className="gpa-icon-mobile" style={{width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                               <Award size={24} style={{color: "#fff"}} />
                            </div>
                         </div>
                   </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GradesPage;