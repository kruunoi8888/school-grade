import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, User, ArrowRight, Bell, Calendar, GraduationCap, School, BookOpen, Search, ArrowUpRight, TrendingUp, TrendingDown, Star, Users2, Building2, UserCircle, LayoutDashboard, ChevronRight, MessageCircle, BadgeCheck, Target } from "lucide-react";
import { CLASSROOMS, STUDENTS, SUBJECTS_INIT, NATIONAL_EXAMS, NOTIFICATIONS } from "../../data/mockData";
import { gradePoint, gradeStr, gradeLabel, gradeColor } from "../../utils/gradeCalculator";
import Icon from "../../components/Icon";
import ScoreBar from "../../components/ScoreBar";
import { formatThaiDate } from "../../utils/dateFormatter";
import { sortClassrooms } from "../../utils/studentParser";

function Dashboard({ year, schoolInfo, nationalExams, examVisibility, classrooms, students, users, assignments, notifications, setSelectedImage }) {
  const [examTab, setExamTab] = useState("RT");

  // Sync tab status
  React.useEffect(() => {
    const allTabs = ["RT", "READING_P2", "NT", "ONET", "ONET_M3", "ONET_M6"];
    if (examVisibility && !examVisibility[examTab]) {
      const firstVisible = allTabs.find(t => examVisibility[t]);
      if (firstVisible) setExamTab(firstVisible);
    }
  }, [examVisibility, examTab]);

  const totalStudents = (students || []).length;
  const maleCount = (students || []).filter(s => s.gender === "ชาย").length;
  const femaleCount = (students || []).filter(s => s.gender === "หญิง").length;

  const isReadingTab = examTab === "READING_P2";
  const currentExamsRaw = (nationalExams && nationalExams[examTab]) || (isReadingTab ? { total:0, fluent:0, dysfluent:0, illiterate:0 } : (NATIONAL_EXAMS[examTab] || []));
  
  const examData = isReadingTab ? [
    { name: "อ่านคล่อง", value: currentExamsRaw.fluent || 0, color: "#10b981" },
    { name: "อ่านไม่คล่อง", value: currentExamsRaw.dysfluent || 0, color: "#f59e0b" },
    { name: "อ่านไม่ออก", value: currentExamsRaw.illiterate || 0, color: "#ef4444" },
  ] : (Array.isArray(currentExamsRaw) ? currentExamsRaw.map(row => ({
    name: row.subject,
    โรงเรียน: row.school_avg,
    เขตพื้นที่: row.district_avg,
    ระดับชาติ: row.national_avg,
  })) : []);

  return (
    <div className="animate-in">
      <div className="page-header" style={{marginBottom:32}}>
        <div>
          <div className="page-h-title" style={{fontSize:28, fontWeight:900, letterSpacing:-0.5}}>
            <div style={{width:48,height:48,borderRadius:14,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",boxShadow:"0 4px 12px rgba(59,130,246,0.1)"}}>
              <LayoutDashboard size={24} />
            </div>
            แดชบอร์ดภาพรวมสรุป
          </div>
          <div className="page-h-sub" style={{marginLeft:60, marginTop:0, fontSize:15, fontWeight:600}}>
            <span style={{color:"#3b82f6"}}>ปีการศึกษา {year}</span> 
            <span style={{margin:"0 10px", color:"#e2e8f0"}}>|</span> 
            {schoolInfo?.name || "ระบบจัดการโรงเรียน"}
          </div>
        </div>
      </div>

      {/* Dynamic Announcements Section */}
      {notifications?.filter(n => n.active)?.length > 0 && (
        <div className="card mb-4" style={{border:"none", boxShadow:"0 10px 30px rgba(0,0,0,0.04)", overflow:"hidden", borderRadius:24}}>
          <div className="card-header" style={{background:"#fff", borderBottom:"1px solid #f8fafc", padding:"20px 24px"}}>
             <div style={{display:"flex", alignItems:"center", gap:12}}>
                <div style={{width:10, height:10, borderRadius:"50%", background:"#ef4444", animation:"pulse 2s infinite"}}/>
                <style>{`@keyframes pulse { 0% { transform: scale(0.95); opacity: 1; } 70% { transform: scale(1.1); opacity: 0.5; } 100% { transform: scale(0.95); opacity: 1; } }`}</style>
                <div style={{fontFamily:"Kanit", fontSize:18, fontWeight:900, color:"#1e293b"}}>ข่าวประกาศล่าสุด</div>
             </div>
          </div>
          <div className="card-body" style={{padding:0, maxHeight: 300, overflowY: "auto"}}>
            {notifications.filter(n => n.active).map((ann, idx) => (
              <div key={ann.id} style={{
                padding:"20px 24px", display:"flex", gap:16, 
                borderBottom: idx === notifications.filter(n => n.active).length - 1 ? "none" : "1px solid #f1f5f9",
                background: idx % 2 === 0 ? "#fff" : "#fafbff"
              }}>
                 <div style={{
                   width:44, height:44, borderRadius:12, flexShrink:0,
                   background: ann.type==="warning"?"#fff7ed":ann.type==="success"?"#f0fdf4":"#eff6ff",
                   display:"flex", alignItems:"center", justifyContent:"center", fontSize:20
                 }}>
                    {ann.type==="warning"?"⚠️":ann.type==="success"?"✅":"📢"}
                 </div>
                 <div style={{flex:1}}>
                    <div style={{fontFamily:"Kanit", fontSize:16, fontWeight:800, color:"#1e293b", marginBottom:4}}>{ann.title}</div>
                    <div style={{fontSize:14, color:"#475569", lineHeight:1.6, fontWeight:600}}>{ann.message}</div>
                    <div style={{display:"flex", alignItems:"center", gap:6, marginTop:8, fontSize:12, color:"#94a3b8", fontWeight:700}}>
                       <Calendar size={12}/> {formatThaiDate(ann.created_at)}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row mb-4">
        {[
          { icon:Users, val:totalStudents, lbl:"นักเรียนทั้งหมด", col:"blue" },
          { icon:User, val:maleCount, lbl:"นักเรียนชาย", col:"cyan" },
          { icon:Users, val:femaleCount, lbl:"นักเรียนหญิง", col:"rose" },
          { icon:BadgeCheck, val:(users || []).length, lbl:"ครูและบุคลากร", col:"violet" }
        ].map((s,i)=>(
          <div key={i} className="col-3">
            <div className={`stat-card ${s.col}`}>
              <div className="sc-body"><div className="sc-header"><div className="sc-icon-wrap"><s.icon size={22}/></div></div><div className="sc-value">{s.val}</div><div className="sc-label">{s.lbl}</div></div>
            </div>
          </div>
        ))}
      </div>


      {/* School Achievement Results Section */}
      <div className="card animate-in mb-4">
        <div className="card-header">
           <div className="card-title"><Target size={18} style={{color:"#f59e0b"}}/> ผลสัมฤทธิ์ทางการเรียนของโรงเรียน</div>
        </div>
        <div className="card-body">
          <div className="exam-tabs mb-4">
            {[ {k:"RT", l:"🎯 RT (ป.1)"}, {k:"READING_P2", l:"📖 อ่าน ป.2"}, {k:"NT", l:"📊 NT (ป.3)"}, {k:"ONET", l:"🏆 ONET (ป.6)"}, {k:"ONET_M3", l:"🎓 ONET (ม.3)"}, {k:"ONET_M6", l:"📜 ONET (ม.6)"} ]
              .filter(t => !examVisibility || examVisibility[t.k]).map(t => (
                <button key={t.k} className={`exam-tab ${examTab===t.k?"active":""}`} onClick={() => setExamTab(t.k)}>{t.l}</button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
            {isReadingTab ? (
               <BarChart data={examData} margin={{top:20,right:30,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{fontFamily:"var(--font)",fontSize:13}}/>
                  <YAxis label={{ value: 'จำนวนคน', angle: -90, position: 'insideLeft', style:{fontFamily:"var(--font)",fontSize:12} }}/>
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="value" radius={[8,8,0,0]} barSize={60}>
                    {examData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Bar>
               </BarChart>
            ) : (
              <BarChart data={examData} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontFamily:"Sarabun",fontSize:12}} />
                <YAxis domain={[0,100]} tick={{fontFamily:"Sarabun",fontSize:12}} />
                <Tooltip contentStyle={{fontFamily:"Sarabun"}} />
                <Legend wrapperStyle={{fontFamily:"Sarabun",fontSize:13}} />
                <Bar name="โรงเรียน" dataKey="โรงเรียน" fill="#3b82f6" radius={[4,4,0,0]} />
                <Bar name="เขตพื้นที่" dataKey="เขตพื้นที่" fill="#10b981" radius={[4,4,0,0]} />
                <Bar name="ระดับชาติ" dataKey="ระดับชาติ" fill="#f59e0b" radius={[4,4,0,0]} />
              </BarChart>
            )}
          </ResponsiveContainer>

          {isReadingTab ? (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16, marginTop:24}}>
               {examData.map(d=>{
                 const pct = currentExamsRaw.total > 0 ? ((d.value / currentExamsRaw.total) * 100).toFixed(1) : 0;
                 return (
                   <div key={d.name} style={{padding:16, background:d.color+"10", borderRadius:12, border:`1px solid ${d.color}20`, textAlign:"center"}}>
                      <div style={{fontSize:12, fontWeight:800, color:d.color, marginBottom:4}}>{d.name} <span style={{fontSize:11, background:d.color+"20", padding:"0 6px", borderRadius:4}}>{pct}%</span></div>
                      <div style={{fontFamily:"var(--font-d)", fontSize:28, fontWeight:900, color:"#1e293b"}}>{d.value}</div>
                      <div style={{fontSize:11, color:"#94a3b8"}}>คน</div>
                   </div>
                 );
               })}
               <div style={{padding:16, background:"#f8fafc", borderRadius:12, border:"1px solid #e2e8f0", textAlign:"center"}}>
                  <div style={{fontSize:12, fontWeight:800, color:"#64748b", marginBottom:4}}>รวมเข้าทดสอบ</div>
                  <div style={{fontFamily:"var(--font-d)", fontSize:28, fontWeight:900, color:"#1e293b"}}>{currentExamsRaw.total || 0}</div>
                  <div style={{fontSize:11, color:"#94a3b8"}}>นักเรียน (คน)</div>
               </div>
            </div>
          ) : (
            <div style={{marginTop:24}}>
              {Array.isArray(currentExamsRaw) && currentExamsRaw.map((row, i) => {
                const diff = +(row.school_avg - row.national_avg).toFixed(1);
                const isHigher = diff > 0;
                return (
                  <div key={i} className="score-bar-group" style={{marginBottom:24, background: isHigher ? "rgba(254,249,195,0.3)" : "transparent", padding: "12px", borderRadius: "12px", border: isHigher ? "1px dashed #fde047" : "1px solid transparent"}}>
                    <div className="score-bar-header" style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12}}>
                      <div style={{display: "flex", alignItems: "center", gap: 10}}>
                        <div className="score-bar-label" style={{marginBottom:0, fontSize: 15}}>{row.subject}</div>
                        {isHigher && <div className="stat-badge" style={{background:"#fef9c3", color:"#a16207", border:"1px solid #fde047"}}><Star size={12} fill="#ea580c"/> สูงกว่าระดับประเทศ</div>}
                      </div>
                      <div style={{display: "flex", alignItems: "center", gap: 6, fontSize:13, fontWeight:800, color: isHigher?"#16a34a":"#dc2626"}}>
                        {isHigher ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {isHigher ? "+" : ""}{diff}
                      </div>
                    </div>
                    <ScoreBar label="โรงเรียน" value={row.school_avg} colorClass="fill-school" color="#1e40af" />
                    <ScoreBar label="เขตพื้นที่" value={row.district_avg} colorClass="fill-district" color="#059669" />
                    <ScoreBar label="ระดับชาติ" value={row.national_avg} colorClass="fill-national" color="#d97706" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* ── Enrollment Summary (Live Data) ── */}
      <div className="card animate-in mb-5" style={{border:"none", boxShadow:"0 10px 40px rgba(0,0,0,0.06)", borderRadius:24, overflow:"hidden"}}>
        <div className="card-header" style={{background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"24px 30px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%"}}>
            <div style={{display:"flex", alignItems:"center", gap:14}}>
              <div style={{width:6, height:30, background:"linear-gradient(180deg, #3b82f6, #6366f1)", borderRadius:4}}/>
              <div style={{fontFamily:"Kanit", fontSize:22, fontWeight:900, color:"#1e293b", letterSpacing:"-0.5px"}}>จำนวนนักเรียนแยกรายชั้น</div>
            </div>
            <div style={{fontSize:13, background:"#eff6ff", color:"#3b82f6", padding:"6px 16px", borderRadius:20, fontWeight:700}}>ประจำปีการศึกษา {year}</div>
          </div>
        </div>
        <div className="card-body" style={{padding:0}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse", minWidth: 800}}>
              <thead>
                <tr style={{background:"#fafbff", borderBottom:"1.5px solid #f1f5f9"}}>
                  <th style={{padding:"20px 30px", textAlign:"left", fontSize:13, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap", width:240}}>ชั้นเรียน</th>
                  <th style={{padding:"20px 20px", textAlign:"center", fontSize:13, fontWeight:800, color:"#3b82f6", width:100}}>ชาย (คน)</th>
                  <th style={{padding:"20px 20px", textAlign:"center", fontSize:13, fontWeight:800, color:"#ec4899", width:100}}>หญิง (คน)</th>
                  <th style={{padding:"20px 20px", textAlign:"center", fontSize:13, fontWeight:800, color:"#1e293b", width:140}}>รวมทั้งหมด</th>
                  <th style={{padding:"20px 30px", textAlign:"left", fontSize:13, fontWeight:800, color:"#64748b", textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap"}}>ครูประจำชั้น</th>
                </tr>
              </thead>
              <tbody>
                {(classrooms?.length > 0 ? sortClassrooms(classrooms) : []).map((c, idx) => {
                  const classStudents = (students || []).filter(s => s.classroom_id === c.id);
                  const male = classStudents.filter(s => s.prefix?.includes("ชาย") || s.prefix === "นาย").length;
                  const female = classStudents.filter(s => s.prefix?.includes("หญิง") || s.prefix?.includes("นาง")).length;
                  const classTeachers = (assignments[c.id] || []).map(tid => users?.find(u => u.id === tid)).filter(Boolean);
                  const rowBg = idx % 2 === 0 ? "#fff" : "#f8fafc";
                  
                  return (
                    <tr key={c.id} style={{background:rowBg, borderBottom: idx === classrooms.length - 1 ? "none" : "1px solid #edf2f7"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f1f5f9"} onMouseLeave={e=>e.currentTarget.style.background=rowBg}>
                      <td style={{padding:"22px 30px", whiteSpace:"nowrap", width:300}}>
                        <div style={{display:"flex", alignItems:"center", gap:16}}>
                          <div style={{width:12, height:12, borderRadius:4, background:idx % 2 === 0 ? "#3b82f6" : "#6366f1", boxShadow:"0 2px 4px rgba(0,0,0,0.1)"}}/>
                          <span style={{fontFamily:"Kanit", fontSize:17, fontWeight:800, color:"#1e293b"}}>ชั้น{c.room_name}</span>
                        </div>
                      </td>
                      <td style={{padding:"22px 20px", textAlign:"center", fontFamily:"Kanit", fontSize:18, fontWeight:700, color:"#475569", width:120}}>{male}</td>
                      <td style={{padding:"22px 20px", textAlign:"center", fontFamily:"Kanit", fontSize:18, fontWeight:700, color:"#475569", width:120}}>{female}</td>
                      <td style={{padding:"22px 20px", textAlign:"center", width:160}}>
                        <span style={{background:"#f1f5f9", padding:"6px 20px", borderRadius:14, fontFamily:"Kanit", fontSize:18, fontWeight:900, color:"#1e293b", border:"1.5px solid #e2e8f0"}}>
                          {classStudents.length}
                        </span>
                      </td>
                      <td style={{padding:"22px 30px"}}>
                        {classTeachers.length > 0 ? (
                          <div style={{display:"flex", flexDirection:"column", gap:10}}>
                            {classTeachers.map((t, i) => (
                              <div key={i} style={{display:"flex", alignItems:"center", gap:12, whiteSpace:"nowrap"}}>
                                <div 
                                  onClick={() => (t.profile_pic || t.profilePic) && setSelectedImage(t.profile_pic || t.profilePic)}
                                  style={{
                                    width:32, height:32, borderRadius:10, background:"#fff", 
                                    display:"flex", alignItems:"center", justifyContent:"center", 
                                    boxShadow:"0 2px 6px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9", 
                                    overflow:"hidden", cursor:(t.profile_pic || t.profilePic) ? "zoom-in" : "default"
                                  }}
                                  title={(t.profile_pic || t.profilePic) ? "คลิกเพื่อดูรูปใหญ่" : ""}
                                >
                                  {(t.profile_pic || t.profilePic) ? (
                                    <img src={t.profile_pic || t.profilePic} alt="" style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                                  ) : (
                                    <UserCircle size={16} style={{color:"#64748b"}}/>
                                  )}
                                </div>
                                <span style={{fontSize:16, color:"#475569", fontWeight:600}}>{t.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{fontSize:14, color:"#94a3b8", fontStyle:"italic", display:"flex", alignItems:"center", gap:10}}>
                            <div style={{width:24, height:1, background: "#e2e8f0"}}/> ยังไม่ระบุครูประจำชั้น
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:"#1e293b", color:"#fff"}}>
                  <td style={{padding:"22px 30px", fontFamily:"Kanit", fontSize:16, fontWeight:900}}>สรุปยอดรวมสุทธิ</td>
                  <td style={{padding:"22px 20px", textAlign:"center", fontFamily:"Kanit", fontSize:20, fontWeight:900, color:"#60a5fa"}}>{(students || []).filter(s => s.prefix?.includes("ชาย") || s.prefix === "นาย").length}</td>
                  <td style={{padding:"22px 20px", textAlign:"center", fontFamily:"Kanit", fontSize:20, fontWeight:900, color:"#f472b6"}}>{(students || []).filter(s => s.prefix?.includes("หญิง") || s.prefix?.includes("นาง")).length}</td>
                  <td style={{padding:"22px 20px", textAlign:"center"}}>
                    <span style={{background:"rgba(255,255,255,0.15)", padding:"8px 24px", borderRadius:12, fontFamily:"Kanit", fontSize:22, fontWeight:900}}>
                      {(students || []).length}
                    </span>
                  </td>
                  <td style={{padding:"22px 30px", fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:800, textTransform:"uppercase", letterSpacing:1}}>TOTAL SCHOOL POPULATION</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;