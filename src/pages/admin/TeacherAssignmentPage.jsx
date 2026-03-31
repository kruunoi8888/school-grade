import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { sortClassrooms } from "../../utils/studentParser";
import { Users, User, CheckCircle2, PlusCircle, Pencil, Trash2, Save, School, Briefcase, BadgeCheck, Search, Filter, BookMarked, UserPlus, ChevronDown, Info } from "lucide-react";

function TeacherAssignmentPage({ users, classrooms, assignments, setAssignments, students, setAdminPage }) {
  const teachers = users.filter(u => u.role === "teacher" && u.active);
  const [activeView, setActiveView]   = useState("classroom"); // classroom | teacher
  const [showModal, setShowModal]     = useState(false);
  const [modalCid, setModalCid]       = useState(null);
  const [search, setSearch]           = useState("");
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [expandTeacher, setExpandTeacher] = useState(null);

  const LEVEL_COLORS = [
    { color:"#059669", light:"#f0fdf4", border:"#a7f3d0" },
    { color:"#2563eb", light:"#eff6ff", border:"#bfdbfe" },
    { color:"#d97706", light:"#fffbeb", border:"#fde68a" },
    { color:"#7c3aed", light:"#f5f3ff", border:"#ddd6fe" },
    { color:"#db2777", light:"#fdf2f8", border:"#fbcfe8" },
    { color:"#ea580c", light:"#fff7ed", border:"#fed7aa" },
  ];
  const colorOf = (cl) => LEVEL_COLORS[((cl.level||1)-1)%LEVEL_COLORS.length];

  const assignedCount = (cid) => (assignments[cid]||[]).length;
  const teacherClasses = (tid) => classrooms.filter(cl=>(assignments[cl.id]||[]).includes(tid));

  const openAssign = (cid) => { setModalCid(cid); setShowModal(true); };
  const toggleTeacher = (tid) => {
    setAssignments(prev => {
      const cur = prev[modalCid] || [];
      return { ...prev, [modalCid]: cur.includes(tid) ? cur.filter(x=>x!==tid) : [...cur, tid] };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { data: remoteData } = await supabase.from('teacher_assignments').select('*');
      
      const toInsert = [];
      const toDeleteIds = [];
      
      // Map local to flat list
      const localFlat = [];
      Object.entries(assignments).forEach(([cid, tids]) => {
        tids.forEach(tid => {
          localFlat.push({ classroom_id: cid, user_id: tid });
        });
      });
      
      // 1. Identify what to insert
      localFlat.forEach(local => {
        const found = remoteData?.find(r => 
          Number(r.classroom_id) === Number(local.classroom_id) && 
          Number(r.user_id) === Number(local.user_id)
        );
        if (!found) toInsert.push(local);
      });
      
      // 2. Identify what to delete (including duplicates in remote)
      // Track which assignments we've already "kept" to avoid keeping duplicates
      const keptAssignments = new Set();
      
      remoteData?.forEach(remote => {
        const key = `${remote.classroom_id}_${remote.user_id}`;
        const isStillAssigned = localFlat.find(l => 
          Number(l.classroom_id) === Number(remote.classroom_id) && 
          Number(l.user_id) === Number(remote.user_id)
        );
        
        if (isStillAssigned && !keptAssignments.has(key)) {
          // Keep this one, and mark as kept so any others with same key get deleted
          keptAssignments.add(key);
        } else {
          // Delete it because either it's not in local anymore, OR it's a duplicate in remote
          toDeleteIds.push(remote.id);
        }
      });
      
      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from('teacher_assignments').insert(toInsert);
        if (insErr) throw insErr;
      }
      
      if (toDeleteIds.length > 0) {
        const { error: delErr } = await supabase.from('teacher_assignments').delete().in('id', toDeleteIds);
        if (delErr) throw delErr;
      }

      setSaved(true);
      setShowModal(false);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeTeacher = async (cid, tid) => {
    // Optimistic UI update
    setAssignments(prev => ({ ...prev, [cid]: (prev[cid]||[]).filter(x=>x!==tid) }));
    
    // Check if we should delete immediately for better UX
    // But since the Page has a "Save All" button, we follow the pattern
    // However, if the user complained about "reappearing", we should ensure Save All cleans up duplicates.
  };

  const sortedAllClassrooms = React.useMemo(() => sortClassrooms(classrooms), [classrooms]);

  const filteredClassrooms = sortedAllClassrooms.filter(cl =>
    !search || cl.room_name.includes(search) || (assignments[cl.id]||[]).some(tid => {
      const t = teachers.find(u=>u.id===tid);
      return t?.name.includes(search);
    })
  );
  const filteredTeachers = teachers.filter(t => !search || t.name.includes(search));

  const totalAssigned = new Set(Object.values(assignments).flat()).size;
  const unassigned    = teachers.filter(t => !Object.values(assignments).flat().includes(t?.id));
  const modalCl       = classrooms.find(c=>c.id===modalCid);
  const modalColor    = modalCl ? colorOf(modalCl) : LEVEL_COLORS[0];

  return (
    <>
      <style>{`
        .ta-modal-ov{position:fixed;inset:0;background:rgba(10,20,50,.55);z-index:700;
          display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px);}
        .ta-modal{background:#fff;border-radius:24px;width:100%;max-width:520px;
          box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column;max-height:88vh;}
        .ta-teacher-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 6px;
          border-radius:20px;font-size:12.5px;font-weight:600;cursor:default;}
        .ta-remove-btn{width:16px;height:16px;border-radius:50%;border:none;cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;font-size:9px;
          background:rgba(0,0,0,.12);color:inherit;transition:all .15s;padding:0;}
        .ta-remove-btn:hover{background:rgba(239,68,68,.25);color:#dc2626;}
        .ta-cl-card{background:#fff;border-radius:18px;border:1.5px solid #f1f5f9;
          box-shadow:0 2px 12px rgba(0,0,0,.05);overflow:hidden;transition:all .22s;}
        .ta-cl-card:hover{transform:translateY(-3px);}
        .ta-teacher-row{display:flex;align-items:center;gap:12px;padding:11px 16px;
          border-radius:12px;cursor:pointer;transition:all .18s;border:1.5px solid transparent;}
        .ta-teacher-row:hover{background:#f8fafc;border-color:#e2e8f0;}
        .ta-teacher-row.selected{background:#f0f9ff;border-color:#bae6fd;}
        .ta-tab{padding:9px 20px;border-radius:10px;font-family:var(--font-d);font-size:13.5px;
          font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all .2s;}
        .ta-stat-mini{background:#f8fafc;border-radius:12px;padding:14px 18px;
          border:1.5px solid #f1f5f9;display:flex;flex-direction:column;gap:4px;}
        @keyframes ta-slide-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .ta-animate{animation:ta-slide-in .2s ease}
      `}</style>

      {/* ─── Page Header ─── */}
      <div className="adm-ph" style={{marginBottom:20}}>
        <div className="adm-ph-left">
          <h1 style={{display:"flex",alignItems:"center",gap:10}}>
            <BookMarked size={22} style={{color:"#0891b2"}}/>
            มอบหมายครูประจำชั้น
          </h1>
          <p>จัดการการมอบหมายครูประจำชั้นเรียน — 1 ชั้น หลายคน · 1 คน หลายชั้น</p>
        </div>
      </div>

      {/* ─── Summary bar ─── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {[
          { label:"ชั้นเรียนทั้งหมด", value:classrooms.length, icon:"🏫", c:"#0891b2", bg:"#ecfeff", border:"#a5f3fc" },
          { label:"มีครูแล้ว",         value:classrooms.filter(cl=>assignedCount(cl.id)>0).length, icon:"✅", c:"#059669", bg:"#f0fdf4", border:"#a7f3d0" },
          { label:"ยังไม่มีครู",       value:classrooms.filter(cl=>assignedCount(cl.id)===0).length, icon:"⚠️", c:"#d97706", bg:"#fffbeb", border:"#fde68a" },
          { label:"ครูที่ยังไม่ได้มอบ", value:unassigned.length, icon:"👤", c:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
        ].map(s=>(
          <div key={s.label} style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:"16px 20px"}}>
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{fontFamily:"var(--font-d)",fontSize:26,fontWeight:900,color:s.c,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:4,fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Toolbar ─── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {/* Search */}
        <div style={{position:"relative",flex:1,minWidth:220}}>
          <Search size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input className="adm-input" style={{paddingLeft:38}} placeholder="ค้นหาห้องเรียน หรือชื่อครู..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {/* View tabs */}
        <div style={{display:"flex",gap:6,background:"#f1f5f9",padding:4,borderRadius:12}}>
          {[{k:"classroom",l:"📋 รายชั้นเรียน"},{k:"teacher",l:"👤 รายครู"}].map(t=>(
            <button key={t.k} className="ta-tab" onClick={()=>{setActiveView(t.k);setSearch("");}} style={{
              background: activeView===t.k?"#fff":"transparent",
              color: activeView===t.k?"#1e293b":"#64748b",
              boxShadow: activeView===t.k?"0 2px 8px rgba(0,0,0,.1)":"none",
              borderColor: activeView===t.k?"#e2e8f0":"transparent"
            }}>{t.l}</button>
          ))}
        </div>
        {/* Save button */}
        <button onClick={handleSave} disabled={saving} style={{
          display:"flex",alignItems:"center",gap:8,padding:"10px 24px",borderRadius:11,border:"none",
          background: saving ? "#94a3b8" : "linear-gradient(135deg,#0891b2,#0ea5e9)",
          color:"#fff",
          fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor: saving ? "not-allowed" : "pointer",
          boxShadow: saving ? "none" : "0 4px 16px rgba(8,145,178,.35)",
          transition:"all .2s",flexShrink:0
        }}
        onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(8,145,178,.45)"}}}
        onMouseLeave={e=>{if(!saving){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(8,145,178,.35)"}}}>
          {saving ? (
            <><div className="animate-spin" style={{width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%"}}/> กำลังบันทึก...</>
          ) : (
            <><Save size={15}/> บันทึกทั้งหมด</>
          )}
        </button>
      </div>

      {/* ─── Saved toast ─── */}
      {saved && (
        <div style={{
          position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",
          padding:"13px 28px",borderRadius:14,zIndex:999,
          boxShadow:"0 8px 32px rgba(16,185,129,.45)",
          fontFamily:"var(--font-d)",fontSize:15,fontWeight:700,
          display:"flex",alignItems:"center",gap:10,
          animation:"ta-slide-in .25s ease"
        }}>
          <CheckCircle2 size={20}/> บันทึกการมอบหมายเรียบร้อยแล้ว
        </div>
      )}

      {/* ═══════════════ VIEW: BY CLASSROOM ═══════════════ */}
      {activeView === "classroom" && (
        <div className="ta-animate" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18}}>
          {filteredClassrooms.map(cl => {
            const cc = colorOf(cl);
            const tids = assignments[cl.id] || [];
            const assignedTeachers = tids.map(tid=>teachers.find(t=>t?.id===tid)).filter(Boolean);
            const realStudentCount = students.filter(s => s.classroom_id === cl.id).length;
            
            return (
              <div key={cl.id} className="ta-cl-card"
                onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 10px 32px ${cc.color}20`;e.currentTarget.style.borderColor=cc.border}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.05)";e.currentTarget.style.borderColor="#f1f5f9"}}>

                {/* Card Top */}
                <div style={{background:`linear-gradient(135deg,${cc.color} 0%,${cc.color}cc 100%)`,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.1)",top:-24,right:-20,pointerEvents:"none"}}/>
                  <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-.3px"}}>{cl.room_name}</div>
                      <button 
                        onClick={() => {
                          // In a real app we might pass the filter state, 
                          // but for now we just link to the page.
                          setAdminPage("students");
                        }}
                        style={{
                          background:"rgba(255,255,255,.2)",border:"none",borderRadius:6,
                          fontSize:11,color:"#fff",padding:"2px 8px",marginTop:4,
                          cursor:"pointer",display:"flex",alignItems:"center",gap:4,
                          transition:"all .2s"
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.3)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.2)"}
                      >
                        <Users size={11}/> {realStudentCount || cl.student_count} คน · ดูรายชื่อ →
                      </button>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{
                        background: tids.length>0?"rgba(255,255,255,.25)":"rgba(255,200,0,.3)",
                        color:"#fff",padding:"4px 12px",borderRadius:20,
                        fontSize:12,fontWeight:700,
                        border:`1px solid ${tids.length>0?"rgba(255,255,255,.3)":"rgba(255,220,0,.5)"}`
                      }}>
                        {tids.length>0?`${tids.length} ครู`:"ยังไม่มีครู"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{padding:"14px 16px 16px"}}>
                  {/* Assigned teachers */}
                  {assignedTeachers.length > 0 ? (
                    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                      {assignedTeachers.map(t => (
                        <div key={t?.id} style={{
                          display:"flex",alignItems:"center",gap:10,
                          background:`${cc.color}08`,borderRadius:10,
                          padding:"8px 12px",border:`1px solid ${cc.color}18`
                        }}>
                          <div style={{
                            width:32,height:32,borderRadius:9,flexShrink:0,
                            background: (t.profile_pic || t.profilePic) ? "transparent" : `linear-gradient(135deg,${cc.color},${cc.color}99)`,
                            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",overflow:"hidden"
                          }}>
                            {(t.profile_pic || t.profilePic) ? <img src={t.profile_pic || t.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={15}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13.5,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                            <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>ครูประจำชั้น</div>
                          </div>
                          <button onClick={()=>removeTeacher(cl.id, t?.id)} style={{
                            width:26,height:26,borderRadius:7,border:"1.5px solid #fecaca",
                            background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",
                            cursor:"pointer",transition:"all .15s",color:"#ef4444",flexShrink:0
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#ef4444"}}
                          onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#fecaca"}}
                          title="ถอดออก"><Trash2 size={12}/></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding:"16px",borderRadius:12,border:"1.5px dashed #e2e8f0",
                      textAlign:"center",marginBottom:14,background:"#fafbff"
                    }}>
                      <Users size={20} style={{color:"#cbd5e1",marginBottom:4}}/>
                      <div style={{fontSize:12.5,color:"#94a3b8",fontWeight:600}}>ยังไม่ได้มอบหมายครู</div>
                    </div>
                  )}

                  {/* Assign button */}
                  <button onClick={()=>openAssign(cl.id)} style={{
                    width:"100%",padding:"10px",borderRadius:11,border:`1.5px solid ${cc.color}40`,
                    background:`${cc.color}0c`,color:cc.color,fontFamily:"var(--font-d)",
                    fontSize:13.5,fontWeight:700,cursor:"pointer",transition:"all .2s",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=cc.color;e.currentTarget.style.color="#fff";e.currentTarget.style.boxShadow=`0 4px 16px ${cc.color}35`}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${cc.color}0c`;e.currentTarget.style.color=cc.color;e.currentTarget.style.boxShadow="none"}}>
                    <UserPlus size={14}/> {tids.length>0?"แก้ไขการมอบหมาย":"มอบหมายครู"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ VIEW: BY TEACHER ═══════════════ */}
      {activeView === "teacher" && (
        <div className="ta-animate adm-card">
          <div className="adm-card-header">
            <div className="adm-card-title"><Users size={16} style={{color:"#0891b2"}}/> สรุปภาระงานครูประจำชั้น</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{teachers.length} คน · มอบหมายแล้ว {totalAssigned} คน</div>
          </div>
          <div style={{padding:"16px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filteredTeachers.map(t => {
                const myClasses = teacherClasses(t?.id);
                const isOpen = expandTeacher === t?.id;
                return (
                  <div key={t?.id} style={{
                    background:"#fff",borderRadius:14,border:"1.5px solid #f1f5f9",
                    overflow:"hidden",transition:"all .2s",
                    boxShadow: isOpen?"0 4px 20px rgba(0,0,0,.08)":"none"
                  }}>
                    {/* Teacher row */}
                    <div style={{
                      display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
                      cursor:"pointer",background: isOpen?"linear-gradient(135deg,#f0f9ff,#fff)":"#fff"
                    }} onClick={()=>setExpandTeacher(isOpen?null:t?.id)}>
                      <div style={{
                        width:44,height:44,borderRadius:13,flexShrink:0,
                        background: (t.profile_pic || t.profilePic) ? "transparent" : "linear-gradient(135deg,#0891b2,#06b6d4)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#fff",boxShadow: (t.profile_pic || t.profilePic) ? "none" : "0 4px 12px rgba(8,145,178,.3)", overflow:"hidden"
                      }}>
                        {(t.profile_pic || t.profilePic) ? <img src={t.profile_pic || t.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={20}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>
                          {myClasses.length>0
                            ? <span style={{color:"#0891b2",fontWeight:600}}>รับผิดชอบ {myClasses.length} ชั้นเรียน</span>
                            : <span style={{color:"#f59e0b",fontWeight:600}}>⚠️ ยังไม่ได้มอบหมาย</span>}
                        </div>
                      </div>
                      {/* Class badges */}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:200}}>
                        {myClasses.slice(0,3).map(cl=>{
                          const cc = colorOf(cl);
                          return <span key={cl.id} style={{padding:"3px 10px",borderRadius:20,background:cc.light,color:cc.color,fontSize:11.5,fontWeight:700,border:`1px solid ${cc.border}`}}>{cl.room_name}</span>;
                        })}
                        {myClasses.length>3 && <span style={{padding:"3px 10px",borderRadius:20,background:"#f1f5f9",color:"#64748b",fontSize:11.5,fontWeight:700}}>+{myClasses.length-3}</span>}
                        {myClasses.length===0 && <span style={{padding:"3px 12px",borderRadius:20,background:"#fef3c7",color:"#d97706",fontSize:11.5,fontWeight:700}}>ไม่มี</span>}
                      </div>
                      <div style={{color:"#94a3b8",transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0deg)",flexShrink:0}}>
                        <ChevronDown size={16}/>
                      </div>
                    </div>

                    {/* Expand: list classes */}
                    {isOpen && (
                      <div style={{padding:"0 18px 16px",borderTop:"1px solid #f1f5f9"}}>
                        {myClasses.length>0 ? (
                          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginTop:14}}>
                            {myClasses.map(cl=>{
                              const cc = colorOf(cl);
                              return (
                                <div key={cl.id} style={{
                                  display:"flex",alignItems:"center",gap:10,
                                  padding:"10px 14px",borderRadius:12,
                                  background:cc.light,border:`1.5px solid ${cc.border}`
                                }}>
                                  <div style={{width:34,height:34,borderRadius:9,background:cc.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    <School size={16} style={{color:"#fff"}}/>
                                  </div>
                                  <div>
                                    <div style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"#1e293b"}}>{cl.room_name}</div>
                                    <div style={{fontSize:11,color:"#94a3b8"}}>{students.filter(s=>s.classroom_id===cl.id).length} คน · ดูรายชื่อ →</div>
                                  </div>
                                  <button onClick={()=>removeTeacher(cl.id, t?.id)} style={{
                                    marginLeft:"auto",width:24,height:24,borderRadius:6,
                                    border:"1.5px solid #fecaca",background:"#fef2f2",
                                    display:"flex",alignItems:"center",justifyContent:"center",
                                    cursor:"pointer",color:"#ef4444",transition:"all .15s",flexShrink:0
                                  }}
                                  onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff"}}
                                  onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444"}}
                                  title="ถอด"><Trash2 size={11}/></button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{textAlign:"center",padding:"20px",color:"#94a3b8"}}>
                            <Users size={28} style={{marginBottom:6,opacity:.3}}/>
                            <div style={{fontSize:13,fontWeight:600}}>ยังไม่ได้รับมอบหมายชั้นเรียนใด</div>
                          </div>
                        )}
                        <button onClick={()=>{
                          // Find first classroom to open, or open first one
                          setActiveView("classroom");
                          setExpandTeacher(null);
                        }} style={{
                          marginTop:12,padding:"8px 18px",borderRadius:9,border:"1.5px solid #bae6fd",
                          background:"#f0f9ff",color:"#0891b2",fontFamily:"var(--font-d)",
                          fontSize:13,fontWeight:700,cursor:"pointer",
                          display:"flex",alignItems:"center",gap:6
                        }}>
                          <BookMarked size={13}/> ไปมอบหมายชั้นเรียน
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: ASSIGN TEACHERS ═══════════════ */}
      {showModal && modalCl && (
        <div className="ta-modal-ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="ta-modal" onKeyDown={e=>e.key==="Enter"&&handleSave()}>
            {/* Header */}
            <div style={{
              background:`linear-gradient(135deg,${modalColor.color} 0%,${modalColor.color}cc 100%)`,
              padding:"22px 26px 18px",flexShrink:0,position:"relative",overflow:"hidden"
            }}>
              <div style={{position:"absolute",width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.1)",top:-30,right:-20,pointerEvents:"none"}}/>
              <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontWeight:600,marginBottom:4}}>มอบหมายครูประจำชั้น</div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:24,fontWeight:900,color:"#fff",letterSpacing:"-.4px"}}>{modalCl.room_name}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:4,display:"flex",alignItems:"center",gap:8}}>
                    <Users size={13}/> {modalCl.student_count} คน
                    <span style={{opacity:.4}}>·</span>
                    <span style={{background:"rgba(255,255,255,.2)",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>
                      เลือกแล้ว {(assignments[modalCid]||[]).length} คน
                    </span>
                  </div>
                </div>
                <button onClick={()=>setShowModal(false)} style={{
                  width:32,height:32,borderRadius:9,border:"1.5px solid rgba(255,255,255,.3)",
                  background:"rgba(255,255,255,.15)",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15
                }}>✕</button>
              </div>
            </div>

            {/* Info bar */}
            <div style={{padding:"12px 20px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9",
              display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <Info size={14} style={{color:"#0891b2",flexShrink:0}}/>
              <span style={{fontSize:12.5,color:"#64748b"}}>เลือกได้หลายคน · ครู 1 คนสามารถรับผิดชอบได้หลายชั้น</span>
            </div>

            {/* Teacher list */}
            <div style={{overflowY:"auto",padding:"16px",flex:1,display:"flex",flexDirection:"column",gap:8}}>
              {teachers.length === 0 && (
                <div style={{textAlign:"center",padding:"40px",color:"#94a3b8"}}>
                  <Users size={40} style={{marginBottom:10,opacity:.3}}/><br/>ไม่มีครูในระบบ
                </div>
              )}
              {teachers.map(t => {
                const selected = (assignments[modalCid]||[]).includes(t?.id);
                const otherClasses = teacherClasses(t?.id).filter(cl=>cl.id!==modalCid);
                return (
                  <div key={t?.id} className={`ta-teacher-row${selected?" selected":""}`}
                    onClick={()=>toggleTeacher(t?.id)}>
                    {/* Avatar */}
                    <div style={{
                      width:42,height:42,borderRadius:12,flexShrink:0,
                      background: (t.profile_pic || t.profilePic)
                        ? "transparent"
                        : selected
                          ? `linear-gradient(135deg,${modalColor.color},${modalColor.color}99)`
                          : "linear-gradient(135deg,#e2e8f0,#f1f5f9)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color: selected?"#fff":"#94a3b8",
                      transition:"all .2s",
                      boxShadow: (selected && !(t.profile_pic || t.profilePic)) ? `0 4px 12px ${modalColor.color}35` : "none",
                      overflow: "hidden"
                    }}>
                      {(t.profile_pic || t.profilePic) ? <img src={t.profile_pic || t.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={19}/>}
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                      {otherClasses.length>0 && (
                        <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                          {otherClasses.map(cl=>{
                            const cc2 = colorOf(cl);
                            return <span key={cl.id} style={{padding:"1px 8px",borderRadius:12,background:cc2.light,color:cc2.color,fontSize:11,fontWeight:700,border:`1px solid ${cc2.border}`}}>{cl.room_name}</span>;
                          })}
                        </div>
                      )}
                      {otherClasses.length===0 && <div style={{fontSize:11.5,color:"#94a3b8",marginTop:2}}>ยังไม่ได้รับมอบหมายชั้นอื่น</div>}
                    </div>
                    {/* Checkbox */}
                    <div style={{
                      width:24,height:24,borderRadius:7,border: selected?`none`:"1.5px solid #cbd5e1",
                      background: selected?modalColor.color:"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      transition:"all .2s",flexShrink:0,
                      boxShadow: selected?`0 2px 8px ${modalColor.color}50`:"none"
                    }}>
                      {selected && <span style={{color:"#fff",fontSize:14,fontWeight:900,lineHeight:1}}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{padding:"16px 20px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                ยกเลิก
              </button>
              <button onClick={handleSave} style={{
                padding:"10px 28px",borderRadius:10,border:"none",
                background:`linear-gradient(135deg,${modalColor.color},${modalColor.color}cc)`,
                color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",
                boxShadow:`0 4px 16px ${modalColor.color}45`,display:"flex",alignItems:"center",gap:7
              }}>
                <Save size={14}/> ยืนยันการมอบหมาย
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TeacherAssignmentPage;