import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Users, User, Search, Filter, PlusCircle, Pencil, Trash2, Save, CheckCircle2, Info, School, Briefcase, GraduationCap, UserPlus, Download, AlertCircle, Upload, ChevronRight, FileText, List } from "lucide-react";
import { sortClassrooms, detectGender, parseBulkLine } from "../../utils/studentParser";
function StudentsPage({ classrooms: propClassrooms, assignments: propAssignments, users: propUsers, students, setStudents, user }) {
  // Use live data from props
  const liveClassrooms  = propClassrooms  || [];
  const liveAssignments = propAssignments || {};
  const liveUsers       = propUsers       || [];

  // helper: ดึงรายชื่อครูและรูปโปรไฟล์จาก assignments + users (real-time)
  const getTeachersForClass = (classroomId) => {
    const tids = liveAssignments[classroomId] ?? [];
    if (tids.length === 0) return [];
    return tids
      .map(tid => liveUsers.find(u => u.id === tid))
      .filter(Boolean);
  };

  // helper: ดึง classroom object (live)
  const getClassroomById = (id) => liveClassrooms.find(c=>c.id===+id) || liveClassrooms[0] || { id: 1, room_name: "" };

  // เมื่อ classrooms เปลี่ยน ให้ sync ข้อมูลที่เกี่ยวข้อง
  const syncStudentClassInfo = (ss) => ss.map(s => {
    const cl = liveClassrooms.find(c => c.id === s.classroom_id);
    if (!cl) return s;
    return {
      ...s,
      room_name:    cl.room_name,
      teachers:     getTeachersForClass(s.classroom_id),
    };
  });

  const EMPTY_FORM = { student_id:"", prefix:"เด็กชาย", first_name:"", last_name:"", gender:"ชาย", classroom_id: liveClassrooms[0]?.id ?? 1 };

  const [search, setSearch]           = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [addMode, setAddMode]         = useState("single");
  const [editStudent, setEditStudent] = useState(null);
  const [confirmDel, setConfirmDel]   = useState(null);
  const [form, setForm]               = useState({...EMPTY_FORM});
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(false);

  // ── Bulk state ──
  const [selectedClassId, setSelectedClassId] = useState(liveClassrooms[0]?.id ?? 1);
  const [bulkText, setBulkText]       = useState("");
  const [bulkPreview, setBulkPreview] = useState([]);
  const [fileError, setFileError]     = useState("");
  const [importDone, setImportDone]   = useState(false);
  const fileRef = React.useRef(null);

  // Sync effect for student class info
  React.useEffect(() => {
    if (students && students.length > 0) {
      setStudents(prev => syncStudentClassInfo(prev));
    }
  }, [propClassrooms, propAssignments, propUsers]);

  const isTeacher = user?.role === "teacher";
  const myClassrooms = isTeacher 
    ? liveClassrooms.filter(c => (liveAssignments[c.id] || []).includes(user.id))
    : liveClassrooms;
  const myRoomIds = myClassrooms.map(c => c.id);

  const filtered = students.filter(s => {
    // If teacher, only see their assigned classrooms
    if (isTeacher && !myRoomIds.includes(s.classroom_id)) return false;

    const matchSearch  = !search || s.first_name.includes(search) || s.last_name.includes(search) || s.student_id.includes(search);
    const matchClass   = !filterClass  || s.classroom_id === +filterClass;
    const matchGender  = !filterGender || s.gender === filterGender;
    return matchSearch && matchClass && matchGender;
  }).sort((a, b) => {
    const lvPr = (n) => (n.includes("อนุบาล") ? 0 : n.includes("ประถม") || n.startsWith("ป.") ? 1 : n.includes("มัธยม") || n.startsWith("ม.") ? 2 : 3);
    const lvNu = (n) => { const m = n.match(/(\d+)/); return m ? +m[1] : 999; };
    const rmNu = (n) => { const m = n.match(/\/(\d+)/); return m ? +m[1] : 0; };
    const nA = a.room_name || "", nB = b.room_name || "";
    if (lvPr(nA) !== lvPr(nB)) return lvPr(nA) - lvPr(nB);
    if (lvNu(nA) !== lvNu(nB)) return lvNu(nA) - lvNu(nB);
    if (rmNu(nA) !== rmNu(nB)) return rmNu(nA) - rmNu(nB);
    return (a.student_id || "").localeCompare(b.student_id || "");
  });

  // ── Open Add modal ──
  const openAdd = () => {
    const cid = filterClass ? +filterClass : (liveClassrooms[0]?.id ?? 1);
    setSelectedClassId(cid);
    setAddMode("single");
    setBulkText(""); setBulkPreview([]); setFileError(""); setImportDone(false);
    setForm({...EMPTY_FORM, student_id:`67${String(Date.now()).slice(-6)}`, classroom_id: cid});
    setEditStudent(null);
    setShowModal("add");
  };
  const openEdit = (s) => {
    setForm({ student_id:s.student_id, prefix:s.prefix, first_name:s.first_name, last_name:s.last_name, gender:s.gender, classroom_id:s.classroom_id });
    setEditStudent(s); setShowModal("edit");
  };

  // ── Save single ──
  const saveStudent = async () => {
    if (!form.first_name.trim()||!form.last_name.trim()||!form.student_id.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน (รหัส, ชื่อ, นามสกุล)");
      return;
    }
    
    try {
      setSaving(true);
      const studentData = {
        student_id: form.student_id,
        prefix: form.prefix,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender,
        classroom_id: +form.classroom_id
      };

      if (editStudent) {
        const { data, error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editStudent.id)
          .select();
        
        if (error) throw error;
        const updated = syncStudentClassInfo([data[0]])[0];
        setStudents(ss => ss.map(s => s.id === editStudent.id ? updated : s));
      } else {
        const { data, error } = await supabase
          .from('students')
          .insert([studentData])
          .select();
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("บันทึกสำเร็จแต่ไม่มีข้อมูลส่งกลับมา");
        const added = syncStudentClassInfo([data[0]])[0];
        setStudents(ss => [...ss, added]);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving student:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ── Parse bulk text → preview ──
  const parseBulk = (text) => {
    const baseId = Date.now();
    const lines = text.split("\n").map((l,i)=>parseBulkLine(l,i,baseId)).filter(Boolean);
    setBulkPreview(lines);
  };

  // ── Save bulk ──
  const saveBulk = async () => {
    if (!bulkPreview.length) return;
    
    try {
      setSaving(true);
      const clId = +selectedClassId;
      const dataToInsert = bulkPreview.map(s => ({
        student_id: s.student_id,
        prefix: s.prefix,
        first_name: s.first_name.trim(),
        last_name: s.last_name.trim(),
        gender: s.gender,
        classroom_id: clId
      }));

      // Use upsert to prevent duplicate key errors if the user re-imports
      const { data, error } = await supabase
        .from('students')
        .upsert(dataToInsert, { onConflict: 'student_id' })
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("นำเข้าสำเร็จแต่ไม่มีข้อมูลส่งกลับมา");

      const added = syncStudentClassInfo(data);
      // Merge into local state, updating existing or appending new students
      setStudents(ss => {
        const existingMap = new Map(ss.map(s => [s.student_id, s]));
        added.forEach(a => existingMap.set(a.student_id, a));
        return Array.from(existingMap.values());
      });

      setImportDone(true);
      setSuccess(true);
      setTimeout(() => { 
        setShowModal(false); 
        setImportDone(false); 
        setSuccess(false);
      }, 1400);
    } catch (error) {
      console.error("Error importing students:", error);
      alert("ไม่สามารถนำเข้าข้อมูลได้: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  // ── Parse CSV/TXT file ──
  const handleFile = (e) => {
    setFileError(""); setBulkPreview([]);
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt","csv"].includes(ext)) { setFileError("รองรับเฉพาะไฟล์ .txt และ .csv เท่านั้น"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).map(l => l.replace(/[,\t|]+/g," ").trim()).filter(Boolean);
      const dataLines = lines.filter(l => /[\u0E00-\u0E7F\d]/.test(l));
      const baseId = Date.now();
      const parsed = dataLines.map((l,i)=>parseBulkLine(l,i,baseId)).filter(Boolean);
      if (!parsed.length) setFileError("ไม่พบข้อมูลนักเรียนในไฟล์ กรุณาตรวจสอบรูปแบบ");
      else setBulkPreview(parsed);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const deleteStudent = async (id) => { 
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setStudents(ss => ss.filter(s => s.id !== id)); 
      setConfirmDel(null); 
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("ไม่สามารถลบข้อมูลนักเรียนได้");
    }
  };
  const PREFIX_BY_GENDER = { ชาย:["เด็กชาย","นาย"], หญิง:["เด็กหญิง","นางสาว","นาง"] };

  // colors for class chips
  const CL_COLORS = ["#059669","#2563eb","#d97706","#7c3aed","#db2777","#ea580c"];
  const clColor = (id) => CL_COLORS[(+id-1)%CL_COLORS.length] || "#3b82f6";
  const lockedCl = getClassroomById(selectedClassId);
  const modalCl  = editStudent ? getClassroomById(form.classroom_id) : lockedCl;

  return (
    <>
      <style>{`
        .st-ov{position:fixed;inset:0;background:rgba(10,18,46,.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px);}
        .st-modal{background:#fff;border-radius:24px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column;max-height:92vh;}
        .st-body{overflow-y:auto;padding:22px 26px;display:flex;flex-direction:column;gap:16px;}
        .st-confirm{background:#fff;border-radius:18px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.2);padding:28px;text-align:center;}
        .st-view{background:#fff;border-radius:22px;width:100%;max-width:420px;box-shadow:0 28px 72px rgba(0,0,0,.22);overflow:hidden;}
        .mode-tab{padding:9px 18px;border-radius:10px;font-family:var(--font-d);font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid transparent;transition:all .2s;display:flex;align-items:center;gap:6px;}
        .bulk-textarea{width:100%;min-height:160px;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-family:var(--font);font-size:13.5px;resize:vertical;color:#1e293b;line-height:1.7;transition:border-color .2s;}
        .bulk-textarea:focus{outline:none;border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.1);}
        .preview-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;background:#f8fafc;border:1px solid #f1f5f9;transition:background .15s;}
        .preview-row:hover{background:#f0f9ff;border-color:#bae6fd;}
        .drop-zone{border:2px dashed #bae6fd;border-radius:14px;padding:28px;text-align:center;background:#f0f9ff;cursor:pointer;transition:all .2s;}
        .drop-zone:hover{border-color:#0ea5e9;background:#e0f2fe;}
        .cl-lock-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 14px 7px 10px;border-radius:12px;font-family:var(--font-d);font-size:13px;font-weight:700;}
        @keyframes st-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .st-animate{animation:st-in .22s ease}
        .preview-edit-input{border:1px solid #e2e8f0;border-radius:7px;padding:4px 8px;font-family:var(--font);font-size:13px;width:100%;background:#fff;}
        .preview-edit-input:focus{outline:none;border-color:#0ea5e9;}
      `}</style>

      {/* ─── Page Header ─── */}
      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><Users size={22} style={{color:"#0ea5e9"}}/> รายชื่อนักเรียน</h1>
          <p>ปีการศึกษา 2568 · พบ {filtered.length} คน</p>
        </div>
        {filterClass && (
          <button className="adm-btn adm-btn-primary" onClick={openAdd}>
            <UserPlus size={16}/> เพิ่มนักเรียน
          </button>
        )}
      </div>

      {/* ─── Table card ─── */}
      <div className="adm-card">
        <div style={{padding:"16px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",gap:12,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:220}}>
            <Search size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
            <input className="adm-input" style={{paddingLeft:38}} placeholder="ค้นหานักเรียน..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="adm-input adm-select" style={{width:180}} value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
            <option value="">{isTeacher ? "ทุกชั้นเรียนของฉัน" : "ทุกชั้นเรียน"}</option>
            {sortClassrooms(myClassrooms).map(c=><option key={c.id} value={c.id}>ชั้น{c.room_name}</option>)}
          </select>
          <select className="adm-input adm-select" style={{width:130}} value={filterGender} onChange={e=>setFilterGender(e.target.value)}>
            <option value="">ทุกเพศ</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option>
          </select>
        </div>
        <div style={{overflowX:"auto"}}>
          <table className="adm-table" style={{minWidth:800}}>
            <thead><tr style={{minWidth:900, display:"table-row"}}>
              <th style={{width:40}}>#</th>
              <th style={{width:80}}>รหัส</th>
              <th style={{minWidth:160}}>ชื่อ-นามสกุล</th>
              <th style={{width:70, textAlign:"center"}}>เพศ</th>
              <th style={{width:110}}>ชั้นเรียน</th>
              <th style={{minWidth:160}}>ครูประจำชั้น</th>
              <th style={{width:110, textAlign:"center"}}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={7} style={{textAlign:"center",padding:"48px 20px",color:"#94a3b8"}}>
                  <Users size={40} style={{marginBottom:10,opacity:.3}}/><br/>ไม่พบนักเรียน
                </td></tr>
              )}
              {filtered.map((s,i)=>(
                <tr key={s?.id}>
                  <td style={{color:"#94a3b8",fontSize:13}}>{i+1}</td>
                  <td><span style={{fontFamily:"monospace",background:"#f1f5f9",padding:"2px 9px",borderRadius:6,fontSize:12}}>{s.student_id}</span></td>
                  <td style={{minWidth:140}}>
                    <div style={{fontWeight:700, fontSize:13.5, color:"#1e293b", lineHeight:1.2}}>
                      <div>{s.prefix}{s.first_name}</div>
                      <div style={{fontSize:12, color:"#64748b", fontWeight:500}}>{s.last_name}</div>
                    </div>
                  </td>
                  <td style={{textAlign:"center"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:2,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:s.gender==="ชาย"?"#eff6ff":"#fdf2f8",color:s.gender==="ชาย"?"#3b82f6":"#ec4899"}}>
                      {s.gender==="ชาย" ? "👦" : "👧"} {s.gender}
                    </span>
                  </td>
                  <td><span className="adm-badge" style={{background:`${clColor(s.classroom_id)}15`,color:clColor(s.classroom_id),border:`1px solid ${clColor(s.classroom_id)}30`,fontWeight:700,padding:"3px 8px",fontSize:12}}>ชั้น{s.room_name}</span></td>
                  <td style={{minWidth:170}}>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {s.teachers && s.teachers.length > 0 ? (
                        s.teachers.map(t => (
                          <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"1px 0"}}>
                            <div style={{
                              width:24,height:24,borderRadius:6,background:(t.profile_pic || t.profilePic)?"transparent":"#f1f5f9",
                              display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,
                              border:(t.profile_pic || t.profilePic)?"none":"1px solid #e2e8f0"
                            }}>
                              {(t.profile_pic || t.profilePic) ? <img src={t.profile_pic || t.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={12} style={{color:"#94a3b8"}}/>}
                            </div>
                            <div>
                              <div style={{fontSize:13, color:"#334155", fontWeight:600, lineHeight:1.1}}>{t.name?.split(" ")[0]}</div>
                              <div style={{fontSize:11, color:"#94a3b8", fontWeight:400, marginTop:1}}>{t.name?.split(" ").slice(1).join(" ")}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{fontSize:12.5,color:"#94a3b8",fontStyle:"italic"}}>ยังไม่มีครูประจำชั้น</span>
                      )}
                    </div>
                  </td>
                  <td style={{width:110}}>
                    <div style={{display:"flex", gap:6, justifyContent:"center", whiteSpace:"nowrap"}}>
                      <button onClick={()=>openEdit(s)} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #bbf7d0",background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .18s",color:"#059669"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#059669";e.currentTarget.style.color="#fff"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.color="#059669"}}
                        title="แก้ไข"><Pencil size={13}/></button>
                      <button onClick={()=>setConfirmDel(s)} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #fecaca",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .18s",color:"#ef4444"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff"}}
                        onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444"}}
                        title="ลบ"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════ MODAL: เพิ่มนักเรียน ════ */}
      {showModal==="add" && (
        <div className="st-ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="st-modal st-animate" style={{maxWidth:640}}>
            <div style={{padding:"20px 26px 0",background:"linear-gradient(135deg,#f0f9ff,#fff)",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#0ea5e9,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(14,165,233,.3)"}}>
                    <UserPlus size={20} style={{color:"#fff"}}/>
                  </div>
                  <div>
                    <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:900,color:"#1e293b"}}>เพิ่มนักเรียน</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>เลือกชั้นเรียนก่อน แล้วเพิ่มรายชื่อ</div>
                  </div>
                </div>
                <button onClick={()=>setShowModal(false)} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",fontSize:15}}>✕</button>
              </div>
              <div style={{marginBottom:14}}>
                <div className="adm-label" style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"#0ea5e9",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>1</div>
                  เลือกชั้นเรียนที่จะเพิ่ม <span style={{color:"#ef4444"}}>*</span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {sortClassrooms(myClassrooms).map(cl => {
                    const cc = clColor(cl.id);
                    const sel = selectedClassId===cl.id;
                    const hasData = form.first_name.trim() !== "" || form.last_name.trim() !== "" || bulkText.trim() !== "" || bulkPreview.length > 0;
                    
                    return (
                      <button 
                        key={cl.id} 
                        onClick={() => {
                          if (!hasData) {
                            setSelectedClassId(cl.id);
                            setForm(f => ({ ...f, classroom_id: cl.id }));
                          }
                        }} 
                        disabled={hasData && !sel}
                        style={{
                          padding:"8px 16px",borderRadius:10,cursor:hasData ? "not-allowed" : "pointer",transition:"all .18s",
                          fontFamily:"var(--font-d)",fontSize:13,fontWeight:700,
                          background: sel ? cc : "#f8fafc",
                          color: sel ? "#fff" : "#64748b",
                          border: sel ? `2px solid ${cc}` : "2px solid #e2e8f0",
                          boxShadow: sel ? `0 4px 14px ${cc}40` : "none",
                          opacity: (hasData && !sel) ? 0.4 : 1,
                          filter: (hasData && !sel) ? "grayscale(0.5)" : "none"
                        }}
                      >
                        {cl.room_name}
                      </button>
                    );
                  })}
                </div>
                {form.first_name.trim() !== "" || form.last_name.trim() !== "" || bulkText.trim() !== "" || bulkPreview.length > 0 ? (
                  <div style={{fontSize:11,color:"#ef4444",marginTop:6,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                    <AlertCircle size={12}/> ล็อกชั้นเรียนเนื่องจากมีการกรอกข้อมูลแล้ว (ล้างข้อมูลเพื่อเปลี่ยนชั้นเรียน)
                  </div>
                ) : null}
                <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:7,padding:"7px 14px 7px 10px",borderRadius:12,background:`${clColor(selectedClassId)}10`,border:`1.5px solid ${clColor(selectedClassId)}30`}}>
                  <div style={{width:28,height:28,borderRadius:8,background:clColor(selectedClassId),display:"flex",alignItems:"center",justifyContent:"center"}}><School size={14} style={{color:"#fff"}}/></div>
                  <div>
                    <div style={{fontFamily:"var(--font-d)",fontSize:13,fontWeight:800,color:clColor(selectedClassId)}}>🔒 ชั้น{lockedCl.room_name}</div>
                    <div style={{fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:4}}>
                      {getTeachersForClass(lockedCl.id).length > 0 
                        ? getTeachersForClass(lockedCl.id).map(t => t.name).join(", ") 
                        : "ยังไม่มีครูประจำชั้น"}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{marginBottom:0}}>
                <div className="adm-label" style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"#0ea5e9",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,flexShrink:0}}>2</div>เลือกวิธีการเพิ่มนักเรียน
                </div>
                <div style={{display:"flex",gap:6,background:"#f1f5f9",padding:4,borderRadius:12}}>
                  {[
                    {k:"single", icon:<UserPlus size={14}/>, l:"เพิ่มทีละคน"},
                    {k:"bulk",   icon:<List size={14}/>,     l:"พิมพ์หลายคน"},
                    {k:"file",   icon:<FileText size={14}/>, l:"นำเข้าไฟล์"},
                  ].map(m=>(
                    <button key={m.k} className="mode-tab" onClick={()=>{setAddMode(m.k);setBulkPreview([]);setBulkText("");setFileError("");}} style={{
                      flex:1,justifyContent:"center",
                      background: addMode===m.k?"#fff":"transparent",
                      color: addMode===m.k?"#0ea5e9":"#64748b",
                      borderColor: addMode===m.k?"#bae6fd":"transparent",
                      boxShadow: addMode===m.k?"0 2px 8px rgba(0,0,0,.09)":"none"
                    }}>{m.icon}{m.l}</button>
                  ))}
                </div>
              </div>
              <div style={{height:1,background:"#f1f5f9",marginTop:16}}/>
            </div>
            <div className="st-body" style={{flex:1}}>
              {addMode==="single" && (
                <>
                  <div><div className="adm-label">รหัสนักเรียน <span style={{color:"#ef4444"}}>*</span></div>
                    <input className="adm-input" placeholder="เช่น 67000009" value={form.student_id} onChange={e=>setForm(f=>({...f,student_id:e.target.value}))}/></div>
                  <div><div className="adm-label">เพศ</div>
                    <div style={{display:"flex",gap:10}}>
                      {["ชาย","หญิง"].map(g=>(
                        <button key={g} onClick={()=>setForm(f=>({...f,gender:g,prefix:g==="ชาย"?"เด็กชาย":"เด็กหญิง"}))} style={{
                          flex:1,padding:"10px",borderRadius:10,cursor:"pointer",transition:"all .2s",fontFamily:"var(--font)",fontSize:14,fontWeight:700,
                          border: form.gender===g?(g==="ชาย"?"2px solid #3b82f6":"2px solid #ec4899"):"2px solid #e2e8f0",
                          background: form.gender===g?(g==="ชาย"?"#eff6ff":"#fdf2f8"):"#f8fafc",
                          color: form.gender===g?(g==="ชาย"?"#2563eb":"#db2777"):"#94a3b8"
                        }}>{g==="ชาย"?"👦 ชาย":"👧 หญิง"}</button>
                      ))}
                    </div>
                  </div>
                  <div><div className="adm-label">คำนำหน้าชื่อ</div>
                    <select className="adm-input adm-select" value={form.prefix} onChange={e=>{const p=e.target.value; setForm(f=>({...f,prefix:p,gender:detectGender(p)}));}}>
                      {(PREFIX_BY_GENDER[form.gender]??["เด็กชาย","นาย"]).map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><div className="adm-label">ชื่อ <span style={{color:"#ef4444"}}>*</span></div>
                    <input className="adm-input" placeholder="ชื่อ (ไม่ต้องมีคำนำหน้า)" value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/></div>
                  <div><div className="adm-label">นามสกุล <span style={{color:"#ef4444"}}>*</span></div>
                    <input className="adm-input" placeholder="นามสกุล" value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/></div>
                </>
              )}
              {addMode==="bulk" && (
                <>
                  <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:12,padding:"12px 16px"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>💡 รูปแบบที่รองรับ (แต่ละบรรทัด = 1 คน)</div>
                    <div style={{fontSize:12,color:"#78350f",lineHeight:1.9,fontFamily:"monospace"}}>เด็กชาย ชื่อ นามสกุล<br/>เด็กหญิง ชื่อ นามสกุล รหัสนักเรียน<br/>รหัสนักเรียน เด็กชาย ชื่อ นามสกุล</div>
                  </div>
                  <div>
                    <div className="adm-label" style={{marginBottom:8}}>พิมพ์หรือวางรายชื่อนักเรียน</div>
                    <textarea className="bulk-textarea" placeholder={"เด็กชาย กิตติพงษ์ สุขสม\nเด็กหญิง พิมพ์ชนก รักดี\n67000011 เด็กหญิง อรอนงค์ งามดี"} value={bulkText} onChange={e=>{setBulkText(e.target.value);parseBulk(e.target.value);}}/>
                  </div>
                  {bulkPreview.length>0 && (
                    <div>
                      <div className="adm-label"><CheckCircle2 size={15} style={{color:"#059669"}}/> พบ {bulkPreview.length} คน</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:260,overflowY:"auto"}}>
                        {bulkPreview.map((s,i)=>(
                          <div key={i} className="preview-row">
                            <span style={{fontSize:12,color:"#94a3b8",width:22}}>{i+1}</span>
                            <input className="preview-edit-input" value={s.first_name} onChange={e=>setBulkPreview(prev=>prev.map((r,ri)=>ri===i?{...r,first_name:e.target.value}:r))}/>
                            <input className="preview-edit-input" value={s.last_name} onChange={e=>setBulkPreview(prev=>prev.map((r,ri)=>ri===i?{...r,last_name:e.target.value}:r))}/>
                            <button onClick={()=>setBulkPreview(prev=>prev.filter((_,ri)=>ri!==i))} style={{color:"#ef4444"}}><Trash2 size={11}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {addMode==="file" && (
                <>
                  <div className="drop-zone" onClick={()=>fileRef.current?.click()}>
                    <div style={{fontSize:36,marginBottom:10}}>📂</div>
                    <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#0369a1"}}>คลิกเพื่อเลือกไฟล์</div>
                    <input ref={fileRef} type="file" accept=".txt,.csv" style={{display:"none"}} onChange={handleFile}/>
                  </div>
                  {fileError && <div style={{color:"#dc2626",fontSize:13}}><AlertCircle size={15}/> {fileError}</div>}
                  {bulkPreview.length>0 && <div>พบ {bulkPreview.length} คน</div>}
                </>
              )}
            </div>
            <div style={{padding:"14px 26px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafbff"}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b"}} disabled={saving}>ยกเลิก</button>
              {addMode==="single" ? (
                <button onClick={saveStudent} className="adm-btn adm-btn-primary" disabled={saving || success}>
                  {saving ? "กำลังเพิ่ม..." : success ? "เพิ่มสำเร็จ!" : "เพิ่มนักเรียน"}
                </button>
              ) : (
                <button onClick={saveBulk} className="adm-btn adm-btn-primary" disabled={!bulkPreview.length || saving || success}>
                  {saving ? "กำลังนำเข้า..." : success ? "นำเข้าสำเร็จ!" : `นำเข้า ${bulkPreview.length} คน`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: แก้ไข ════ */}
      {showModal==="edit" && editStudent && (
        <div className="st-ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="st-modal st-animate" style={{maxWidth:480}}>
            <div style={{padding:"20px 26px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <Pencil size={18} style={{color:"#f59e0b"}}/>
                <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800}}>แก้ไขข้อมูลนักเรียน</div>
              </div>
              <button onClick={()=>setShowModal(false)} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>✕</button>
            </div>
            <div className="st-body" style={{padding:"24px 26px"}}>
              <div style={{marginBottom:16}}>
                <label className="adm-label">รหัสประจำตัวนักเรียน</label>
                <input className="adm-input" value={form.student_id} onChange={e=>setForm(f=>({...f,student_id:e.target.value}))} placeholder="เช่น 67000001"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div><label className="adm-label">ชื่อ</label><input className="adm-input" value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/></div>
                <div><label className="adm-label">นามสกุล</label><input className="adm-input" value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/></div>
              </div>
              <div style={{marginTop:16}}>
                <label className="adm-label">ชั้นเรียน</label>
                <select className="adm-input adm-select" value={form.classroom_id} onChange={e=>setForm(f=>({...f,classroom_id:+e.target.value}))}>
                  {sortClassrooms(myClassrooms).map(c=><option key={c.id} value={c.id}>ชั้น{c.room_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{padding:"14px 26px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafbff"}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b"}}>ยกเลิก</button>
              <button onClick={saveStudent} className="adm-btn adm-btn-primary"><Save size={14}/> บันทึกการแก้ไข</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: ยืนยันลบ ════ */}
      {confirmDel && (
        <div className="st-ov" onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}>
          <div className="st-confirm st-animate">
            <div style={{width:56,height:56,borderRadius:16,background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444",marginBottom:16,margin:"0 auto 16px"}}>
              <Trash2 size={28}/>
            </div>
            <div style={{fontFamily:"var(--font-d)",fontSize:19,fontWeight:800,textAlign:"center"}}>ยืนยันการลบ</div>
            <div style={{fontSize:14,color:"#64748b",margin:"8px 0 24px",textAlign:"center"}}>คุณต้องการลบรายชื่อของ <strong style={{color:"#1e293b"}}>{confirmDel.prefix}{confirmDel.first_name} {confirmDel.last_name}</strong> ใช่หรือไม่?</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,padding:"11px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:700}}>ยกเลิก</button>
              <button onClick={()=>deleteStudent(confirmDel.id)} style={{flex:1,background:"#ef4444",color:"#fff",padding:"11px",borderRadius:12,border:"none",fontWeight:700}}>ลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Fallback constants
const CLASSROOMS = [
  { id:1, room_name:"ป.1/1", teacher_name:"นางสาวสมหญิง ใจดี" },
  { id:2, room_name:"ป.2/1", teacher_name:"นางมาลี รักเรียน" },
  { id:3, room_name:"ป.3/1", teacher_name:"นายสมชาย ขยันดี" },
];

const STUDENTS = [];

export default StudentsPage;