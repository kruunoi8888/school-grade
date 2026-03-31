const fs = require('fs');

let appContent = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix the initial data mismatch in App.jsx globally
appContent = appContent.replace(/credit:\s*[0-9.]+\s*,\s*hours:\s*40/g, 'credit: 1, hours: 40');
appContent = appContent.replace(/credit:\s*[0-9.]+\s*,\s*hours:\s*80/g, 'credit: 2, hours: 80');
appContent = appContent.replace(/credit:\s*[0-9.]+\s*,\s*hours:\s*120/g, 'credit: 3, hours: 120');
appContent = appContent.replace(/credit:\s*[0-9.]+\s*,\s*hours:\s*160/g, 'credit: 4, hours: 160');
appContent = appContent.replace(/credit:\s*[0-9.]+\s*,\s*hours:\s*200/g, 'credit: 5, hours: 200');

appContent = appContent.replace(/hours:\s*40\s*,\s*credit:\s*[0-9.]+/g, 'hours: 40, credit: 1');
appContent = appContent.replace(/hours:\s*80\s*,\s*credit:\s*[0-9.]+/g, 'hours: 80, credit: 2');
appContent = appContent.replace(/hours:\s*120\s*,\s*credit:\s*[0-9.]+/g, 'hours: 120, credit: 3');
appContent = appContent.replace(/hours:\s*160\s*,\s*credit:\s*[0-9.]+/g, 'hours: 160, credit: 4');
appContent = appContent.replace(/hours:\s*200\s*,\s*credit:\s*[0-9.]+/g, 'hours: 200, credit: 5');


// 2. Replace SubjectManagePage
const startIndex = appContent.indexOf('function SubjectManagePage({ subjects, setSubjects, classrooms })');
const endIndex = appContent.indexOf('const ADMIN_NAV = [');
if (startIndex !== -1 && endIndex !== -1) {
    const newComponent = `function SubjectManagePage({ subjects, setSubjects, classrooms }) {
  const liveClassrooms = classrooms ?? [];
  const allLevels = [...new Set(liveClassrooms.map(c => c.level_name ?? c.room_name.replace(/\\/\\d+$/, "")))];

  const kinderLevels = allLevels.filter(lv => lv.startsWith("อนุบาล"));
  const basicLevels  = allLevels.filter(lv => !lv.startsWith("อนุบาล"));
  const hasKinder    = kinderLevels.length > 0;
  const hasBasic     = basicLevels.length > 0;
  const [levelGroup, setLevelGroup] = React.useState(hasBasic ? "basic" : "kinder");
  const activeLevels = levelGroup === "kinder" ? kinderLevels : basicLevels;

  const [activities, setActivities] = React.useState(ACTIVITIES_INIT.map(a=>({...a})));

  const EMPTY_SUB = { subject_code:"", subject_name:"", subject_group:SUBJECT_GROUPS[0].id, credit:1, hours:40, type:"core", level_name: "" };
  const EMPTY_ACT = { activity_type: ACTIVITY_TYPES[0].id, hours: 40, level_name: "", result: "ผ" };

  const [filterLevel, setFilterLevel] = useState("");
  const [search, setSearch]         = useState("");
  
  const [showModal, setShowModal]   = useState(false);
  const [itemType, setItemType]     = useState("core"); // core | extra | activity
  const [formSub, setFormSub]       = useState({...EMPTY_SUB});
  const [formAct, setFormAct]       = useState({...EMPTY_ACT});
  const [editId, setEditId]         = useState(null);
  const [codeManual, setCodeManual] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  React.useEffect(() => {
    if (codeManual || itemType === "activity") return;
    const grp = SUBJECT_GROUPS.find(g => g.id === formSub.subject_group);
    if (!grp) return;
    const prefix = formSub.type === "extra" ? "เ" : grp.code;
    const lvName = formSub.level_name || (activeLevels[0] ?? "ป.1");
    const siblings = subjects.filter(s =>
      s.subject_group === formSub.subject_group &&
      s.level_name === lvName &&
      s.type === formSub.type &&
      (!editId || s.id !== editId)
    );
    const code = genSubjectCode(prefix, lvName, siblings.length + 1);
    setFormSub(f => ({...f, subject_code: code}));
  }, [formSub.subject_group, formSub.level_name, formSub.type, codeManual, itemType]);

  const grpMeta = (gid) => SUBJECT_GROUPS.find(g => g.id === gid) ?? { color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0" };

  const openAdd = () => {
    setCodeManual(false); setEditId(null); setItemType("core");
    const initLevel = filterLevel || activeLevels[0] || "ป.1";
    setFormSub({...EMPTY_SUB, level_name: initLevel});
    setFormAct({...EMPTY_ACT, level_name: initLevel});
    setShowModal(true);
  };
  const openEditSub = (s) => {
    setCodeManual(true); setEditId(s.id); setItemType(s.type);
    setFormSub({ ...s }); setShowModal(true);
  };
  const openEditAct = (a) => {
    setEditId(a.id); setItemType("activity");
    setFormAct({ ...a }); setShowModal(true);
  };
  
  const handleSave = () => {
    if (itemType === "activity") {
      if (!formAct.activity_type) return;
      if (editId) { setActivities(as=>as.map(a=>a.id===editId?{...a,...formAct}:a)); }
      else { setActivities(as=>[...as,{id:Date.now(),...formAct}]); }
    } else {
      if (!formSub.subject_name.trim() || !formSub.subject_code.trim()) return;
      if (editId) { setSubjects(ss=>ss.map(s=>s.id===editId?{...s,...formSub,type:itemType}:s)); }
      else { setSubjects(ss=>[...ss,{id:Date.now(),...formSub,type:itemType}]); }
    }
    setShowModal(false);
  };
  
  const performDelete = () => {
    if (confirmDel.type === "activity") setActivities(as=>as.filter(a=>a.id!==confirmDel.id));
    else setSubjects(ss=>ss.filter(s=>s.id!==confirmDel.id));
    setConfirmDel(null);
  };

  const coreCount  = subjects.filter(s => s.type === "core").length;
  const extraCount = subjects.filter(s => s.type === "extra").length;
  const levelList  = [...new Set(subjects.map(s => s.level_name).filter(Boolean))];
  const LEVEL_COLORS = ["#059669","#2563eb","#d97706","#7c3aed","#db2777","#ea580c","#0891b2","#6366f1"];
  const lvColor = (lv) => LEVEL_COLORS[LEVEL_NAMES.indexOf(lv) % LEVEL_COLORS.length] ?? "#64748b";

  return (
    <>
      <style>{\`
        .sj-modal-ov{position:fixed;inset:0;background:rgba(10,18,46,.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px);}
        .sj-modal{background:#fff;border-radius:22px;width:100%;max-width:580px;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column;max-height:92vh;}
        .sj-confirm{background:#fff;border-radius:18px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.2);padding:28px;text-align:center;}
        .sj-code-input{font-family:monospace;font-size:15px;letter-spacing:1.5px;font-weight:700;}
        @keyframes sj-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .sj-animate{animation:sj-in .22s ease}
        .hours-quick-btn{padding:8px 12px;border-radius:8px;cursor:pointer;font-family:var(--font-d);font-size:14px;font-weight:800;border:2px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all .18s;min-width:56px;text-align:center;}
        .hours-quick-btn.on{border-color:#6366f1;background:#eef2ff;color:#4f46e5;}
      \`}</style>

      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><BookOpen size={22} style={{color:"#6366f1"}}/> จัดการหลักสูตรและรายวิชา</h1>
          <p>รายวิชาพื้นฐาน {coreCount} วิชา · รายวิชาเพิ่มเติม {extraCount} วิชา · กิจกรรมพัฒนาผู้เรียน {activities.length} รายการ</p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={openAdd}
          style={{background:"linear-gradient(135deg,#4f46e5,#6366f1)",boxShadow:"0 4px 16px rgba(99,102,241,.35)"}}>
          <PlusCircle size={16}/> เพิ่มข้อมูล
        </button>
      </div>

      {hasKinder && hasBasic && (
        <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:700,color:"#64748b",flexShrink:0}}>ระดับการศึกษา :</span>
          <div style={{display:"flex",gap:8}}>
            {[
              { k:"basic",  label:"📚 ระดับขั้นพื้นฐาน", desc:"ป.1–ม.6",       color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
              { k:"kinder", label:"🌱 ระดับอนุบาล",      desc:"อนุบาล 1–3",    color:"#10b981", bg:"#f0fdf4", border:"#a7f3d0" },
            ].map(g => (
              <button key={g.k} onClick={()=>{ setLevelGroup(g.k); setFilterLevel(""); }} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 20px",
                borderRadius:14,cursor:"pointer",fontFamily:"var(--font)",
                border:\`2px solid \${levelGroup===g.k ? g.color : "#e2e8f0"}\`,
                background: levelGroup===g.k ? g.bg : "#fff",
                boxShadow: levelGroup===g.k ? \`0 4px 16px \${g.color}25\` : "none",
                transition:"all .2s"
              }}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color: levelGroup===g.k ? g.color : "#475569"}}>{g.label}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{g.desc}</div>
                </div>
                {levelGroup===g.k && <div style={{width:8,height:8,borderRadius:"50%",background:g.color,flexShrink:0}}/>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:22}}>
        {[
          { label:"วิชาทั้งหมด",  val:subjects.length,   color:"#6366f1", bg:"#eef2ff", icon:"📚" },
          { label:"วิชาพื้นฐาน",     val:coreCount,         color:"#2563eb", bg:"#eff6ff", icon:"📖" },
          { label:"วิชาเพิ่มเติม",   val:extraCount,        color:"#ec4899", bg:"#fdf2f8", icon:"✨" },
          { label:"ระดับชั้น",        val:levelList.length,  color:"#10b981", bg:"#f0fdf4", icon:"🏫" },
          { label:"กิจกรรมพัฒนาฯ",  val:activities.length, color:"#0891b2", bg:"#ecfeff", icon:"🎯" },
        ].map(s => (
          <div key={s.label} style={{background:"#fff",border:\`1.5px solid \${s.color}20\`,borderRadius:14,padding:"14px 16px",
            display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
            <div style={{width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
            <div>
              <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:11.5,color:"#94a3b8",marginTop:2}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter ── */}
      <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <select className="adm-input adm-select" style={{width:160}} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
          <option value="">เลือกชั้นเรียน</option>
          {activeLevels.map(lv=><option key={lv} value={lv}>{lvFull(lv)}</option>)}
        </select>
        <div style={{position:"relative",flex:1,minWidth:180,maxWidth:320}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input className="adm-input" style={{paddingLeft:36}} placeholder="ค้นหาชื่อวิชา รหัส หรือกิจกรรม..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* ── Combined Render per Level ── */}
      {activeLevels.filter(lv => !filterLevel || lv === filterLevel).map(level => {
        const subs = subjects.filter(s => s.level_name === level && (!search || s.subject_name.includes(search) || s.subject_code.includes(search)));
        const acts = activities.filter(a => a.level_name === level && (!search || a.activity_type.includes(search)));
        if (!subs.length && !acts.length) return null;
        
        const lc = lvColor(level);
        const totalSubHrs = subs.reduce((s,x)=>s+(x.hours||0),0);
        const totalActHrs = acts.reduce((s,x)=>s+(x.hours||0),0);

        return (
          <div key={level} className="adm-card sj-animate" style={{marginBottom:32,overflow:"hidden",boxShadow:"0 6px 30px rgba(0,0,0,.03)",border:"none"}}>
            {/* Header */}
            <div style={{background:\`linear-gradient(135deg,\${lc},\${lc}bb)\`,padding:"16px 24px",
              display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <School size={22} style={{color:"#fff"}}/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:"#fff"}}>ชั้น{level}</div>
                  <div style={{fontSize:12.5,color:"rgba(255,255,255,.8)",marginTop:1}}>รายวิชาทั้งหมด {subs.length} วิชา · กิจกรรม {acts.length} กิจกรรม</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                  <Clock size={13}/> เวลารวมทั้งหมด {totalSubHrs + totalActHrs} ชม./ปี
                </span>
                <span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"5px 14px",borderRadius:20,fontSize:12.5,fontWeight:700}}>
                  พื้นฐาน {subs.filter(s=>s.type==="core").length}
                </span>
                <span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"5px 14px",borderRadius:20,fontSize:12.5,fontWeight:700}}>
                  เพิ่มเติม {subs.filter(s=>s.type==="extra").length}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div style={{paddingTop:20}}>
              {/* รายวิชา Section */}
              <div style={{padding:"0 24px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}><BookOpen size={14} style={{color:"#6366f1"}}/></div>
                <span style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800,color:"#1e293b"}}>รายวิชา (วิชาพื้นฐานและเพิ่มเติม)</span>
              </div>
              {subs.length === 0 ? (
                <div style={{padding:"20px",textAlign:"center",color:"#94a3b8",fontSize:13}}>ไม่มีรายวิชาในกลุ่มนี้</div>
              ) : (
                <div style={{overflowX:"auto",marginBottom:24,padding:"0 4px"}}>
                  <table className="adm-table" style={{borderTop:"1px solid #f1f5f9"}}>
                    <thead><tr>
                      <th style={{width:36}}>#</th>
                      <th style={{width:110}}>รหัสวิชา</th>
                      <th>ชื่อรายวิชา</th>
                      <th>กลุ่มสาระ</th>
                      <th style={{width:90,textAlign:"center"}}>ประเภท</th>
                      <th style={{width:80,textAlign:"center"}}>หน่วยกิต</th>
                      <th style={{width:100,textAlign:"center"}}>เวลาเรียน</th>
                      <th style={{width:90,textAlign:"center"}}>จัดการ</th>
                    </tr></thead>
                    <tbody>
                      {subs.map((s,i)=>{
                        const gm = grpMeta(s.subject_group);
                        return (
                          <tr key={s.id}>
                            <td style={{color:"#94a3b8",fontSize:12}}>{i+1}</td>
                            <td><span style={{fontFamily:"monospace",fontWeight:800,fontSize:13.5,background:gm.bg,color:gm.color,padding:"4px 10px",borderRadius:7,border:\`1px solid \${gm.border}\`}}>{s.subject_code}</span></td>
                            <td><div style={{fontWeight:700,fontSize:14,color:"#1e293b"}}>{s.subject_name}</div></td>
                            <td><span style={{background:gm.bg,color:gm.color,border:\`1px solid \${gm.border}\`,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600}}>{s.subject_group}</span></td>
                            <td style={{textAlign:"center"}}>{s.type === "core" ? <span style={{background:"#eff6ff",color:"#2563eb",padding:"4px 12px",borderRadius:20,fontSize:11.5,fontWeight:700}}>พื้นฐาน</span> : <span style={{background:"#fdf2f8",color:"#db2777",padding:"4px 12px",borderRadius:20,fontSize:11.5,fontWeight:700}}>เพิ่มเติม</span>}</td>
                            <td style={{textAlign:"center"}}><span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:15,color:"#1e293b"}}>{s.credit}</span> <span style={{fontSize:11,color:"#94a3b8"}}>นก.</span></td>
                            <td style={{textAlign:"center"}}>
                              <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:20,padding:"4px 12px"}}>
                                <span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:14,color:"#0369a1"}}>{s.hours??40}</span> <span style={{fontSize:11,color:"#7dd3fc"}}>ชม.</span>
                              </div>
                            </td>
                            <td style={{textAlign:"center"}}>
                              <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                                <button onClick={()=>openEditSub(s)} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",cursor:"pointer",transition:"all .2s"}}><Pencil size={13}/></button>
                                <button onClick={()=>setConfirmDel({id:s.id,type:"sub",name:s.subject_name,code:s.subject_code})} style={{width:32,height:32,borderRadius:8,border:"1.5px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",transition:"all .2s"}}><Trash2 size={13}/></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* กิจกรรม Section */}
              <div style={{background:"#f8fafc",padding:"24px 24px",borderTop:"2px dashed #e2e8f0"}}>
                <div style={{marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:8,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center"}}><Star size={14} style={{color:"#d97706"}}/></div>
                  <span style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800,color:"#1e293b"}}>กิจกรรมพัฒนาผู้เรียน</span>
                </div>
                {acts.length === 0 ? (
                  <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"10px"}}>ไม่มีกิจกรรมในกลุ่มนี้</div>
                ) : (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                    {acts.map((a,i)=>{
                      const at = ACTIVITY_TYPES.find(t=>t.id===a.activity_type) ?? {color:"#64748b",bg:"#f8fafc",border:"#e2e8f0",label:a.activity_type};
                      const isPass = a.result==="ผ";
                      return (
                        <div key={a.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderRadius:14,border:\`1px solid \${at.border}\`,background:"#fff",boxShadow:"0 2px 10px rgba(0,0,0,.02)"}}>
                          <div style={{width:40,height:40,borderRadius:12,background:at.bg,color:at.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,marginRight:14,fontFamily:"var(--font-d)" }}>{i+1}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:14.5,color:"#1e293b"}}>{at.label ?? a.activity_type}</div>
                            <div style={{fontSize:12,color:"#64748b",marginTop:5,display:"flex",alignItems:"center",gap:4}}>
                              <Clock size={12} style={{color:"#0891b2"}}/> {a.hours} ชม./ปี
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontWeight:700,fontSize:14,padding:"4px 12px",borderRadius:20,background:isPass?"#f0fdf4":"#fef2f2",color:isPass?"#16a34a":"#ef4444",border:\`1px solid \${isPass?"#bbf7d0":"#fecaca"}\`}}>{isPass?"ผ่าน":"ไม่ผ่าน"}</div>
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              <button onClick={()=>openEditAct(a)} style={{width:26,height:26,borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Pencil size={11}/></button>
                              <button onClick={()=>setConfirmDel({id:a.id,type:"activity",name:a.activity_type,code:""})} style={{width:26,height:26,borderRadius:6,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11}/></button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      
      {/* ── Unified Modal ── */}
      {showModal && (
        <div className="sj-modal-ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="sj-modal" onKeyDown={e=>e.key==="Enter"&&handleSave()}>
            <div style={{padding:"22px 26px 18px",borderBottom:"1px solid #f1f5f9",background:"linear-gradient(135deg,#eef2ff,#fff)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,#4f46e5,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(99,102,241,.3)"}}>
                  {itemType==="activity" ? <Star size={22} color="#fde047"/> : <BookOpen size={22} color="#fff"/>}
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:900,color:"#1e293b"}}>{editId ? "แก้ไขข้อมูล" : "เพิ่มข้อมูลใหม่"}</div>
                  <div style={{fontSize:12.5,color:"#64748b",marginTop:2}}>เพิ่มรายวิชาหรือกิจกรรมสำหรับชั้นเรียน</div>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} style={{width:34,height:34,borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",fontSize:13}}>✕</button>
            </div>
            
            <div style={{overflowY:"auto",padding:"24px 28px",display:"flex",flexDirection:"column",gap:20,flex:1}}>
              {/* Type Selector Dropdown */}
              <div>
                <div className="adm-label">เลือกประเภทรายการ <span style={{color:"#ef4444"}}>*</span></div>
                <div style={{display:"flex",gap:10,background:"#f1f5f9",padding:5,borderRadius:14}}>
                  {[
                    {k:"core", l:"📖 วิชาพื้นฐาน", c:"#2563eb", bg:"#eff6ff"},
                    {k:"extra", l:"✨ วิชาเพิ่มเติม", c:"#db2777", bg:"#fdf2f8"},
                    {k:"activity", l:"🎯 กิจกรรมพัฒนาฯ", c:"#0891b2", bg:"#ecfeff"}
                  ].map(t => (
                    <button key={t.k} onClick={()=>{
                      setItemType(t.k);
                      if(t.k!=="activity") setFormSub(f=>({...f,type:t.k}));
                    }} style={{
                      flex:1,padding:"10px 4px",borderRadius:10,border:"none",fontFamily:"var(--font-d)",fontSize:13.5,fontWeight:800,cursor:"pointer",transition:"all .2s",
                      background:itemType===t.k?t.bg:"transparent",
                      color:itemType===t.k?t.c:"#64748b",
                      boxShadow:itemType===t.k?\`0 4px 14px \${t.c}20\`:"none"
                    }}>{t.l}</button>
                  ))}
                </div>
              </div>

              {/* level selector shared */}
              <div>
                <div className="adm-label">ระดับชั้น <span style={{color:"#ef4444"}}>*</span></div>
                 <select className="adm-input adm-select" value={itemType==="activity" ? formAct.level_name : formSub.level_name}
                  onChange={e=>{
                    const v = e.target.value;
                    if(itemType==="activity") setFormAct(f=>({...f,level_name:v}));
                    else { setFormSub(f=>({...f,level_name:v})); setCodeManual(false); }
                  }}>
                  <option value="">เลือกชั้น (จำเป็น)</option>
                  {activeLevels.map(lv=><option key={lv} value={lv}>{lvFull(lv)}</option>)}
                </select>
              </div>

              {/* Activity Form Portion */}
              {itemType === "activity" ? (
                <>
                  <div>
                    <div className="adm-label">ประเภทกิจกรรม <span style={{color:"#ef4444"}}>*</span></div>
                    <select className="adm-input adm-select" value={formAct.activity_type} onChange={e=>{
                      const type = e.target.value;
                      const refT = ACTIVITY_TYPES.find(x=>x.id===type);
                      setFormAct(f=>({...f, activity_type:type, hours: refT?.hours ?? f.hours}));
                    }}>
                      {ACTIVITY_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="adm-label"><Clock size={13} style={{color:"#0891b2",verticalAlign:"-1px",marginRight:4}}/> เวลาเรียน (ชม./ปี)</div>
                    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                      {[10,20,40,60,80].map(h=>(
                        <button key={h} className={\`hours-quick-btn\${formAct.hours===h?" on":""}\`} onClick={()=>setFormAct(f=>({...f,hours:h}))}>{h}</button>
                      ))}
                    </div>
                    <div style={{position:"relative"}}>
                      <input className="adm-input" type="number" min={1} value={formAct.hours} onChange={e=>setFormAct(f=>({...f,hours:Math.max(1,+e.target.value||1)}))} style={{paddingRight:50,fontFamily:"var(--font-d)",fontWeight:700,fontSize:15,color:"#0369a1"}} />
                      <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#7dd3fc",fontWeight:700}}>ชม.</span>
                    </div>
                  </div>
                  <div>
                    <div className="adm-label">ผลการประเมินเริ่มต้น</div>
                    <div style={{display:"flex",gap:10}}>
                      {[{k:"ผ",l:"ผ่าน",c:"#16a34a",bg:"#f0fdf4"},{k:"มผ",l:"ไม่ผ่าน",c:"#ef4444",bg:"#fef2f2"}].map(r=>(
                         <button key={r.k} onClick={()=>setFormAct(f=>({...f,result:r.k}))} style={{flex:1,padding:12,borderRadius:10,border:\`2px solid \${formAct.result===r.k?r.c:"#e2e8f0"}\`,background:formAct.result===r.k?r.bg:"#fff",color:formAct.result===r.k?r.c:"#94a3b8",fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>{r.k} ({r.l})</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Subject Form Portion */}
                  <div>
                    <div className="adm-label">กลุ่มสาระการเรียนรู้ <span style={{color:"#ef4444"}}>*</span></div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      {SUBJECT_GROUPS.map(g=>(
                        <button key={g.id} onClick={()=>{ setFormSub(f=>({...f,subject_group:g.id})); setCodeManual(false); }} style={{
                          padding:"8px 10px",borderRadius:10,cursor:"pointer",fontFamily:"var(--font)",fontSize:12,fontWeight:700,
                          transition:"all .18s",border:\`2px solid \${formSub.subject_group===g.id?g.color:"#e2e8f0"}\`,
                          background:formSub.subject_group===g.id?g.bg:"#fff",color:formSub.subject_group===g.id?g.color:"#64748b",
                          boxShadow:formSub.subject_group===g.id?\`0 3px 10px \${g.color}30\`:"none"
                        }}>
                          <span style={{fontFamily:"monospace",fontWeight:900,marginRight:4}}>[{g.code}]</span>{g.id}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                     <div className="adm-label" style={{display:"flex",justifyContent:"space-between"}}>
                        <span>รหัสวิชา</span>
                        <button onClick={()=>setCodeManual(x=>!x)} style={{fontSize:11,borderRadius:20,border:"1.5px solid #e2e8f0",background:codeManual?"#fffbeb":"#f1f5f9",color:codeManual?"#d97706":"#64748b",cursor:"pointer",fontWeight:700,padding:"2px 10px"}}>{codeManual?"✏️ แก้เองอยู่":"⚡ อัตโนมัติ"}</button>
                     </div>
                     <div style={{position:"relative"}}>
                       <input className="adm-input sj-code-input" style={{borderColor:codeManual?"#f59e0b":"#e2e8f0",background:codeManual?"#fff":"#f8fafc",color:grpMeta(formSub.subject_group).color}} value={formSub.subject_code} readOnly={!codeManual} onChange={e=>setFormSub(f=>({...f,subject_code:e.target.value}))}/>
                     </div>
                  </div>
                  <div>
                    <div className="adm-label">ชื่อรายวิชา <span style={{color:"#ef4444"}}>*</span></div>
                    <input className="adm-input" placeholder="เช่น ภาษาไทย" value={formSub.subject_name} onChange={e=>setFormSub(f=>({...f,subject_name:e.target.value}))}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div>
                      <div className="adm-label">หน่วยกิต</div>
                      <div style={{display:"flex",gap:6}}>
                        {[1,2,3,4,5].map(cr => (
                          <button key={cr} onClick={() => setFormSub(f => ({ ...f, credit: cr, hours: {1:40,2:80,3:120,4:160,5:200}[cr] ?? f.hours }))}
                            style={{ flex:1,padding:"9px 4px",borderRadius:9,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,transition:"all .2s",border:\`2px solid \${formSub.credit===cr ? "#6366f1" : "#e2e8f0"}\`,background:formSub.credit===cr ? "#eef2ff" : "#f8fafc",color:formSub.credit===cr?"#4f46e5":"#64748b" }}>
                            {cr}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="adm-label"><Clock size={13} style={{color:"#0891b2",verticalAlign:"-1px",marginRight:4}}/> เวลาเรียน (ชม.)</div>
                      <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        {[40,80,120,160,200].map(h=>(
                          <button key={h} className={\`hours-quick-btn\${formSub.hours===h?" on":""}\`} onClick={()=>setFormSub(f=>({...f,hours:h,credit:{40:1,80:2,120:3,160:4,200:5}[h]??f.credit}))}>{h}</button>
                        ))}
                      </div>
                      <div style={{position:"relative"}}>
                        <input className="adm-input" type="number" min={1} value={formSub.hours} onChange={e=>setFormSub(f=>({...f,hours:Math.max(1,+e.target.value||40)}))} style={{paddingRight:50,fontFamily:"var(--font-d)",fontWeight:700,fontSize:15,color:"#0369a1"}} />
                        <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:12,color:"#7dd3fc",fontWeight:700}}>ชม.</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{padding:"14px 28px 20px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end",background:"#fafbff"}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 24px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>ยกเลิก</button>
              <button onClick={handleSave} style={{padding:"10px 28px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#4f46e5,#6366f1)",color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:7,boxShadow:"0 4px 14px rgba(79,70,229,.35)",transition:"all .2s" }}>
                <Save size={14}/> บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDel && (
        <div className="sj-modal-ov" onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}>
          <div className="sj-confirm">
            <div style={{width:64,height:64,borderRadius:20,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:"0 6px 20px rgba(239,68,68,.2)"}}>
              <Trash2 size={30} style={{color:"#ef4444"}}/>
            </div>
            <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:900,color:"#1e293b",marginBottom:8}}>ยืนยันการลบ</div>
            <div style={{fontSize:14,color:"#475569",marginBottom:24}}>
              คุณต้องการลบ <b>{confirmDel.name}</b> ใช่หรือไม่?
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"12px 26px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>ยกเลิก</button>
              <button onClick={performDelete} style={{padding:"12px 26px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#dc2626,#ef4444)",color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(239,68,68,.3)"}}>
                <Trash2 size={15}/> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}`;

    appContent = appContent.slice(0, startIndex) + newComponent + '\n\n' + appContent.slice(endIndex);
    fs.writeFileSync('src/App.jsx', appContent);
    console.log('Successfully replaced SubjectManagePage and updated SUBJECT arrays');
} else {
    console.log('Could not find boundaries.');
    process.exit(1);
}
