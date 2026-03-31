import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { TrendingUp, Pencil, Trash2, Save, CheckCircle2, AlertCircle, Info, Calendar, Search, Filter, ShieldCheck, Medal, Star, List, Eye, EyeOff, BarChart3, PieChart } from "lucide-react";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer, Cell, PieChart as RePie, Pie } from "recharts";

/**
 * NationalExamPage (now School Achievement Results)
 * Manages RT, NT, ONET and the new Grade 2 Reading Assessment.
 */
function NationalExamPage({ nationalExams, setNationalExams, examVisibility, setExamVisibility }) {
  const [tab, setTab] = useState("RT");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showReadingChart, setShowReadingChart] = useState(true);

  const TABS = [
    { k: "RT", label: "🎯 RT (ป.1)", color: "#3b82f6" },
    { k: "READING_P2", label: "📖 อ่าน ป.2", color: "#f97316" }, // New Tab
    { k: "NT", label: "📊 NT (ป.3)", color: "#10b981" },
    { k: "ONET", label: "🏆 ONET (ป.6)", color: "#f59e0b" },
    { k: "ONET_M3", label: "🎓 ONET (ม.3)", color: "#8b5cf6" },
    { k: "ONET_M6", label: "📜 ONET (ม.6)", color: "#ec4899" }
  ];

  const handleEditClick = () => {
    if (tab === "READING_P2") {
      setEditedData(nationalExams[tab] || { total: 0, fluent: 0, dysfluent: 0, illiterate: 0 });
    } else {
      const existing = nationalExams[tab] || [];
      if (existing.length === 0) {
        // Auto-load default subjects for this exam type
        const defaults = {
          RT: ["การอ่านออกเสียง", "การอ่านรู้เรื่อง"],
          NT: ["ภาษาไทย", "คณิตศาสตร์"],
          ONET: ["ภาษาไทย", "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์"],
          ONET_M3: ["ภาษาไทย", "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์"],
          ONET_M6: ["ภาษาไทย", "ภาษาอังกฤษ", "คณิตศาสตร์", "วิทยาศาสตร์"]
        };
        const subjects = defaults[tab] || [];
        setEditedData(subjects.map(s => ({ subject: s, school_avg: 0, district_avg: 0, national_avg: 0 })));
      } else {
        setEditedData(JSON.parse(JSON.stringify(existing)));
      }
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const { data: existing, error: findError } = await supabase
        .from('national_exams')
        .select('id')
        .eq('exam_type', tab)
        .maybeSingle();

      if (findError) throw findError;

      const payload = {
        exam_type: tab,
        data: editedData 
      };

      let finalDataRow;
      if (existing) {
        const { data: updated, error: upError } = await supabase
          .from('national_exams')
          .update(payload)
          .eq('id', existing.id)
          .select();
        if (upError) throw upError;
        finalDataRow = updated[0];
      } else {
        const { data: inserted, error: inError } = await supabase
          .from('national_exams')
          .insert([payload])
          .select();
        if (inError) throw inError;
        finalDataRow = inserted[0];
      }
      
      setNationalExams(prev => ({ ...prev, [tab]: finalDataRow.data }));
      setIsEditing(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (err) {
      console.error("Error saving assessment:", err);
      alert(`❌ ไม่สามารถบันทึกข้อมูลได้ เนื่องจาก:\n\n1. ${err.message || 'ระบบขัดข้องชั่วคราว'}\n2. โปรดตรวจสอบการป้อนข้อมูลหรือติดต่อผู้ดูแลระบบครับ`);
    }
  };

  const currentData = isEditing ? editedData : (nationalExams[tab] || (tab === "READING_P2" ? { total:0, fluent:0, dysfluent:0, illiterate:0 } : []));

  // Chart Logic for Standard Tabs
  const standardChartData = Array.isArray(currentData) ? currentData.map(d => ({
    name: d.subject,
    โรงเรียน: d.school_avg || 0,
    เขตพื้นที่: d.district_avg || 0,
    ระดับชาติ: d.national_avg || 0
  })) : [];

  // Chart Logic for Reading P.2
  const isReadingTab = tab === "READING_P2";
  const r = isReadingTab ? currentData : {};
  const total = Number(r.total || 0);
  const readingChartData = isReadingTab ? [
    { name: "อ่านคล่อง", value: Number(r.fluent || 0), color: "#10b981", pct: total > 0 ? (r.fluent/total*100).toFixed(1) : 0 },
    { name: "อ่านไม่คล่อง", value: Number(r.dysfluent || 0), color: "#f59e0b", pct: total > 0 ? (r.dysfluent/total*100).toFixed(1) : 0 },
    { name: "อ่านไม่ออก", value: Number(r.illiterate || 0), color: "#ef4444", pct: total > 0 ? (r.illiterate/total*100).toFixed(1) : 0 },
  ] : [];

  const handleToggleVisibility = async (key) => {
    const newVal = !examVisibility[key];
    const newVis = { ...examVisibility, [key]: newVal };
    setExamVisibility(newVis);
    
    // Persist to DB
    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'exam_visibility', value: newVis }, { onConflict: 'key' });
    } catch (err) {
      console.error("Error saving visibility:", err);
    }
  };

  return (
    <div style={{position: "relative"}}>
      <style>{`
        .nx-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; }
        .nx-vis-container { padding: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
        .nx-vis-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: 12px; width: 280px; transition: all 0.2s; }
        @media (max-width: 1024px) { .nx-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .nx-vis-card { width: 100%; } .nx-vis-container { padding: 12px; gap: 12px; } }
        .stat-badge { padding: 4px 12px; borderRadius: 20px; fontSize: 12px; fontWeight: 800; display: inline-flex; align-items: center; gap: 6px; }
      `}</style>
      
      {showSaveToast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#10b981", color: "#fff", padding: "12px 24px",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
        }}>
          <CheckCircle2 size={20} /> บันทึกข้อมูลสำเร็จ
        </div>
      )}

      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><Medal size={22} style={{color:"#ef4444"}}/> จัดการผลสัมฤทธิ์</h1>
          <p>จัดการผลสอบ RT · NT · ONET และการประเมินทักษะการอ่านของผู้เรียน</p>
        </div>
        <div style={{display: "flex", gap: "12px"}}>
          {isEditing ? (
            <>
              <button className="adm-btn" style={{background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0"}} onClick={() => setIsEditing(false)}>ยกเลิก</button>
              <button className="adm-btn adm-btn-primary" onClick={handleSave}><Save size={16}/> บันทึกข้อมูล</button>
            </>
          ) : (
            <button className="adm-btn adm-btn-primary" onClick={handleEditClick}><List size={16}/> แก้ไขข้อมูล {TABS.find(t=>t.k===tab)?.label.split(" ")[1]}</button>
          )}
        </div>
      </div>

      {/* Visibility Controls */}
      <div className="adm-card" style={{marginBottom: "24px"}}>
        <div className="adm-card-header">
           <div className="adm-card-title"><Eye size={16} style={{color:"#8b5cf6"}}/> ควบคุมการแสดงผลเว็บบอร์ดหน้าแรก</div>
        </div>
        <div className="nx-vis-container">
          {TABS.map(t => {
            const isVisible = examVisibility[t.k];
            return (
              <div key={`vis-${t.k}`} className="nx-vis-card" style={{ background: isVisible ? "#f8fafc" : "#f1f5f9", border: isVisible ? `1px solid ${t.color}40` : "1px solid #e2e8f0" }}>
                <div style={{display: "flex", alignItems:"center", gap: "12px"}}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isVisible ? `${t.color}15` : "#e2e8f0", color: isVisible ? t.color : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </div>
                  <div style={{fontFamily: "var(--font-d)", fontWeight: 700, fontSize: 13, color: "#1e293b"}}>{t.label}</div>
                </div>
                <button onClick={() => handleToggleVisibility(t.k)} style={{ position: "relative", width: "40px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", background: isVisible ? t.color : "#cbd5e1" }}>
                  <div style={{ position: "absolute", top: "2px", left: isVisible ? "22px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding:"10px 20px", borderRadius:12, fontFamily:"var(--font-d)", fontSize:14, fontWeight:700, cursor:"pointer", transition:"all .2s", background: tab===t.k ? t.color : "#fff", color: tab===t.k ? "#fff" : "#64748b", border: tab===t.k ? `2px solid ${t.color}` : "2px solid #e8eef4" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="nx-grid">
        <div className="adm-card">
          <div className="adm-card-header" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div className="adm-card-title"><BarChart3 size={16} style={{color:"#3b82f6"}}/> กราฟแสดงผลสัมฤทธิ์ทางการเรียน</div>
            <button onClick={()=>setShowReadingChart(!showReadingChart)} className="adm-btn" style={{fontSize:11, padding:"4px 10px", height:"auto", opacity:.7}}>{showReadingChart ? "🙈 ซ่อนกราฟ" : "👁️ แสดงกราฟ"}</button>
          </div>
          {showReadingChart && (
            <div style={{padding:24}}>
              <ResponsiveContainer width="100%" height={300}>
                {isReadingTab ? (
                  <BarChart data={readingChartData} margin={{top:20,right:30,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontFamily:"var(--font)",fontSize:13}}/>
                    <YAxis label={{ value: 'จำนวนนักเรียน (คน)', angle: -90, position: 'insideLeft', style:{fontFamily:"var(--font)", fontSize:12, fill:"#94a3b8"} }}/>
                    <Tooltip cursor={{fill: '#f8fafc'}} content={({active, payload}) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{background:"#fff", padding:12, borderRadius:10, boxShadow:"0 10px 20px rgba(0,0,0,.1)", border:"1px solid #e2e8f0"}}>
                            <div style={{fontWeight:800, color:"#1e293b"}}>{payload[0].name}</div>
                            <div style={{fontSize:15, color:payload[0].payload.color, fontWeight:900, marginTop:4}}>{payload[0].value} คน ({payload[0].payload.pct}%)</div>
                          </div>
                        );
                      }
                      return null;
                    }}/>
                    <Bar dataKey="value" radius={[8,8,0,0]} barSize={60}>
                      {readingChartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={standardChartData} margin={{top:5,right:10,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontFamily:"var(--font)",fontSize:12}}/>
                    <YAxis domain={[0,100]} tick={{fontFamily:"var(--font)",fontSize:12}}/>
                    <Tooltip contentStyle={{fontFamily:"var(--font)",borderRadius:12,border:"1px solid #e8eef4",boxShadow:"0 10px 25px rgba(0,0,0,.05)"}}/>
                    <Legend wrapperStyle={{fontFamily:"var(--font)",fontSize:12, paddingTop:20}}/>
                    <Bar name="โรงเรียน" dataKey="โรงเรียน" fill="#3b82f6" radius={[6,6,0,0]} barSize={25}/>
                    <Bar name="เขตพื้นที่" dataKey="เขตพื้นที่" fill="#10b981" radius={[6,6,0,0]} barSize={25}/>
                    <Bar name="ระดับชาติ" dataKey="ระดับชาติ" fill="#f59e0b" radius={[6,6,0,0]} barSize={25}/>
                  </BarChart>
                )}
              </ResponsiveContainer>
              {isReadingTab && (
                <div style={{display:"flex", gap:20, justifyContent:"center", marginTop:20}}>
                   {readingChartData.map(d=>(
                     <div key={d.name} style={{display:"flex",alignItems:"center",gap:8}}>
                       <div style={{width:12,height:12,borderRadius:4,background:d.color}}/>
                       <span style={{fontSize:12.5, fontWeight:700, color:"#64748b"}}>{d.name} {d.pct}%</span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title"><Pencil size={15}/> {isEditing ? "แก้ไขคะแนน" : "ข้อมูลรายละเอียด"}</div>
          </div>
          <div className="adm-card-body" style={{padding:20}}>
             {isReadingTab ? (
               // Reading P.2 Editing Form
               <div style={{display:"flex", flexDirection:"column", gap:16}}>
                  <div style={{padding:16, background:"#f8fafc", borderRadius:12, border:"1px solid #eef2ff"}}>
                    <div className="adm-label">จำนวนนักเรียนที่เข้าทดสอบการอ่าน (คน)</div>
                    <input className="adm-input" type="number" disabled={!isEditing} value={currentData.total} onChange={e=>setEditedData({...editedData, total: Number(e.target.value)})}/>
                  </div>
                  <div className="nx-vis-card" style={{width:"100%", background:"#fff", border:"1px solid #f0fdf4"}}>
                     <div>
                       <div style={{fontWeight:800, color:"#10b981"}}>1. อ่านคล่อง</div>
                       <div style={{fontSize:12, color:"#94a3b8"}}>สามารถอ่านเป็นคำและประโยคได้ดี</div>
                     </div>
                     <input className="adm-input" type="number" style={{width:100, textAlign:"right"}} disabled={!isEditing} value={currentData.fluent} onChange={e=>setEditedData({...editedData, fluent: Number(e.target.value)})}/>
                  </div>
                  <div className="nx-vis-card" style={{width:"100%", background:"#fff", border:"1px solid #fffbeb"}}>
                     <div>
                       <div style={{fontWeight:800, color:"#f59e0b"}}>2. อ่านไม่คล่อง</div>
                       <div style={{fontSize:12, color:"#94a3b8"}}>อ่านได้แต่ยังสะกดคำลำบาก</div>
                     </div>
                     <input className="adm-input" type="number" style={{width:100, textAlign:"right"}} disabled={!isEditing} value={currentData.dysfluent} onChange={e=>setEditedData({...editedData, dysfluent: Number(e.target.value)})}/>
                  </div>
                  <div className="nx-vis-card" style={{width:"100%", background:"#fff", border:"1px solid #fef2f2"}}>
                     <div>
                       <div style={{fontWeight:800, color:"#ef4444"}}>3. อ่านไม่ออก</div>
                       <div style={{fontSize:12, color:"#94a3b8"}}>ไม่สามารถสะกดหรือจำคำพื้นฐานได้</div>
                     </div>
                     <input className="adm-input" type="number" style={{width:100, textAlign:"right"}} disabled={!isEditing} value={currentData.illiterate} onChange={e=>setEditedData({...editedData, illiterate: Number(e.target.value)})}/>
                  </div>
               </div>
             ) : (
               // Standard Subjects Editing Form (RT/NT/ONET)
               currentData.map((row, i) => (
                 <div key={i} style={{ marginBottom:20, padding:"12px", background:isEditing?"#f8fafc":"transparent", borderRadius:10, border:isEditing?"1px solid #e2e8f0":"none" }}>
                    <div style={{fontWeight:800, fontSize:14, color:"#1e293b", marginBottom:10}}>{row.subject}</div>
                    {[{l:"โรงเรียน",f:"school_avg",c:"#2563eb"},{l:"เขตพื้นที่",f:"district_avg",c:"#059669"},{l:"ระดับชาติ",f:"national_avg",c:"#d97706"}].map(m=>(
                       <div key={m.f} style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
                          <span style={{width:60, fontSize:12, fontWeight:700, color:m.c}}>{m.l}</span>
                          {isEditing ? (
                            <input className="adm-input" type="number" min={0} max={100} style={{flex:1, height:32, textAlign:"right"}} value={row[m.f]} onChange={e=>{
                              const nd = [...editedData];
                              nd[i] = {...nd[i], [m.f]: Number(e.target.value)};
                              setEditedData(nd);
                            }}/>
                          ) : (
                            <>
                              <div style={{flex:1, height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden"}}><div style={{width:`${row[m.f]}%`, height:"100%", background:m.c}}/></div>
                              <span style={{width:40, textAlign:"right", fontSize:12, fontWeight:800, color:m.c}}>{row[m.f]}%</span>
                            </>
                          )}
                       </div>
                    ))}
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NationalExamPage;