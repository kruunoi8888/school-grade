import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { Users, User, Pencil, Trash2, PlusCircle, Save, CheckCircle2, Search, Filter, ShieldCheck, Hash, Lock, Camera, Eye, EyeOff, X } from "lucide-react";

function UserManagePage({ users, setUsers, currentUser, setCurrentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name:"", username:"", password:"", role:"teacher", active:true, profilePic: null });
  const [filterRole, setFilterRole] = useState("all");
  const [search, setSearch] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [cropModal, setCropModal] = useState({ show: false, image: null });
  const fileInputRef = useRef(null);

  const adminUsers   = users.filter(u => u.role === "admin");
  const teacherUsers = users.filter(u => u.role === "teacher");

  const filtered = users.filter(u =>
    (filterRole === "all" || u.role === filterRole) &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setForm({ name:"", username:"", password:"", role:"teacher", active:true, profilePic: null });
    setEditUser(null); setShowModal(true); setShowPwd(false);
  };
  const openEdit = (u) => {
    setForm({ name:u.name, username:u.username, password:"", role:u.role, active:u.active, profilePic: u.profile_pic || u.profilePic || null });
    setEditUser(u); setShowModal(true); setShowPwd(false);
  };
  
  const saveUser = async () => {
    if (!form.name.trim() || !form.username.trim()) return;
    
    try {
      const payload = {
        name: form.name,
        username: form.username,
        role: form.role,
        active: form.active,
        profile_pic: form.profilePic
      };
      
      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editUser) {
        const { data, error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', editUser.id)
          .select();
        
        if (error) throw error;
        const updatedUser = data[0];
        setUsers(us => us.map(u => u.id === editUser.id ? updatedUser : u));

        // Sync with current session if we're editing ourselves
        if (currentUser && editUser.id === currentUser.id) {
          setCurrentUser(updatedUser);
          localStorage.setItem("grade_user", JSON.stringify(updatedUser));
        }
      } else {
        if (!form.password.trim()) {
          alert("กรุณากำหนดรหัสผ่านสำหรับการเพิ่มผู้ใช้ใหม่");
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .insert([payload])
          .select();
        
        if (error) throw error;
      setUsers(us => [...us, data[0]]);
      }
      setShowModal(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (err) {
      console.error("Error saving user:", err);
      let userFriendlyMsg = "ระบุข้อมูลไม่ถูกต้อง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ตครับ";
      if (err.code === "23505" || err.message?.includes("users_username_key")) {
        userFriendlyMsg = "ขออภัย ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว โปรดลองใช้ชื่ออื่นแทนครับ";
      }
      alert("❌ ไม่สามารถดำเนินการได้: " + userFriendlyMsg);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Resize if image is massive (> 1200px) to save memory and improve performance
          const MAX_INITIAL = 1200;
          if (img.width > MAX_INITIAL || img.height > MAX_INITIAL) {
            const canvas = document.createElement("canvas");
            const scale = MAX_INITIAL / Math.max(img.width, img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setCropModal({ show: true, image: canvas.toDataURL("image/jpeg", 0.9) });
          } else {
            setCropModal({ show: true, image: reader.result });
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; 
  };

  const onCropSave = (croppedData) => {
    setForm(prev => ({ ...prev, profilePic: croppedData }));
    setCropModal({ show: false, image: null });
  };

  const deleteUser = async (id) => {
    if (id === 1) return; // Protect first admin
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setUsers(us => us.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const toggleActive = async (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ active: !target.active })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      setUsers(us => us.map(u => u.id === id ? data[0] : u));
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  return (
    <>
      <style>{`
        .um-card { background:#fff; border-radius:14px; border:1.5px solid #f1f5f9; padding:16px 18px;
          display:flex; align-items:center; gap:14px; transition:all .2s; }
        .um-card:hover { border-color:#e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,.07); transform:translateY(-1px); }
        .um-avatar { width:46px; height:46px; border-radius:13px; display:flex; align-items:center;
          justify-content:center; flex-shrink:0; overflow:hidden; position:relative; }
        .um-avatar img { width:100%; height:100%; object-fit:cover; }
        .um-modal { position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:600;
          display:flex; align-items:center; justify-content:center; padding:16px;
          animation:fadeUp .15s ease; }
        .um-modal-box { background:#fff; border-radius:22px; width:100%; max-width:500px;
          box-shadow:0 28px 72px rgba(0,0,0,.22); overflow:hidden; max-height:90vh; overflow-y:auto; }
        .um-section-head { display:flex; align-items:center; gap:10px; margin-bottom:14px; padding-top:4px; }
        .um-section-bar  { width:4px; height:22px; border-radius:4px; flex-shrink:0; }
        .um-toggle { width:50px; height:28px; border-radius:14px; border:none; cursor:pointer;
          position:relative; transition:background .3s; flex-shrink:0; }
        .um-toggle-knob { width:22px; height:22px; border-radius:50%; background:#fff; position:absolute;
          top:3px; transition:left .3s; box-shadow:0 1px 4px rgba(0,0,0,.2); }
        .role-selector { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .role-btn { padding:12px; border-radius:12px; cursor:pointer; transition:all .2s;
          font-family:var(--font); font-size:13.5px; font-weight:700; text-align:center; border:2px solid transparent; }
        
        .avatar-upload-container { display:flex; flex-direction:column; align-items:center; gap:12px; padding:10px 0; }
        .avatar-preview { width:100px; height:100px; border-radius:24px; background:#f8fafc; border:2px dashed #e2e8f0;
          display:flex; align-items:center; justify-content:center; position:relative; cursor:pointer; overflow:hidden; transition:all .2s; }
        .avatar-preview:hover { border-color:#cbd5e1; background:#f1f5f9; }
        .avatar-preview img { width:100%; height:100%; object-fit:cover; }
        .avatar-overlay { position:absolute; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center;
          justify-content:center; color:#fff; opacity:0; transition:opacity .2s; }
        .avatar-preview:hover .avatar-overlay { opacity:1; }
      `}</style>

      {showSaveToast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#10b981", color: "#fff", padding: "12px 24px",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          fontFamily: "var(--font-d)", fontWeight: 800, animation: "fadeSlideLeft 0.4s ease"
        }}>
          <CheckCircle2 size={20} /> บันทึกข้อมูลผู้ใช้งานสำเร็จ
        </div>
      )}

      {/* ── Page header ── */}
      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><Users size={22} style={{color:"#ec4899"}}/> จัดการผู้ใช้งาน</h1>
          <p>ผู้ดูแลระบบ {adminUsers.length} คน · ครูผู้สอน {teacherUsers.length} คน · รวม {users.length} คน</p>
        </div>
        <button className="adm-btn adm-btn-primary"
          style={{background:"linear-gradient(135deg,#db2777,#ec4899)",boxShadow:"0 4px 16px rgba(236,72,153,.35)"}}
          onClick={openAdd}>
          <PlusCircle size={16}/> เพิ่มผู้ใช้งาน
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:24}}>
        {[
          { label:"ทั้งหมด",       val:users.length,                              color:"#6366f1", bg:"#eef2ff", Icon:Users       },
          { label:"ผู้ดูแลระบบ",   val:adminUsers.length,                         color:"#d97706", bg:"#fffbeb", Icon:ShieldCheck },
          { label:"ครูผู้สอน",     val:teacherUsers.length,                       color:"#2563eb", bg:"#eff6ff", Icon:User        },
          { label:"กำลังใช้งาน",   val:users.filter(u=>u.active).length,          color:"#059669", bg:"#f0fdf4", Icon:CheckCircle2},
        ].map(s => (
          <div key={s.label} style={{background:"#fff",borderRadius:14,padding:"16px 18px",border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
            <div style={{width:42,height:42,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <s.Icon size={20} style={{color:s.color}}/>
            </div>
            <div>
              <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:"#1e293b",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter/search bar ── */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input className="adm-input" style={{paddingLeft:36}} placeholder="ค้นหาชื่อหรือ username..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:10,padding:3,gap:2}}>
          {[{k:"all",l:"ทั้งหมด"},{k:"admin",l:"ผู้ดูแลระบบ"},{k:"teacher",l:"ครูผู้สอน"}].map(f=>(
            <button key={f.k} onClick={()=>setFilterRole(f.k)} style={{
              padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"var(--font)",
              fontSize:13,fontWeight:600,transition:"all .2s",
              background:filterRole===f.k?"#fff":"transparent",
              color:filterRole===f.k?"#1e293b":"#64748b",
              boxShadow:filterRole===f.k?"0 1px 6px rgba(0,0,0,.08)":"none"
            }}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* ── ผู้ดูแลระบบ group ── */}
      {(filterRole==="all"||filterRole==="admin") && (
        <div style={{marginBottom:28}}>
          <div className="um-section-head">
            <div className="um-section-bar" style={{background:"linear-gradient(180deg,#f59e0b,#f97316)"}}/>
            <div style={{fontFamily:"var(--font-d)",fontSize:16,fontWeight:900,color:"#1e293b"}}>ผู้ดูแลระบบ</div>
            <span style={{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>
              {adminUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())).length} คน
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.filter(u=>u.role==="admin").map(u => (
              <div key={u.id} className="um-card" style={{opacity:u.active?1:.5}}>
                <div className="um-avatar" style={{background:"#fffbeb",boxShadow:"0 4px 12px rgba(245,158,11,.15)"}}>
                  {(u.profile_pic || u.profilePic) ? <img src={u.profile_pic || u.profilePic} alt=""/> : <ShieldCheck size={22} style={{color:"#d97706"}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#1e293b"}}>{u.name}</span>
                    <span style={{background:"#fffbeb",color:"#d97706",border:"1px solid #fde68a",fontSize:11,fontWeight:700,padding:"1px 9px",borderRadius:20}}>
                      🛡️ ผู้ดูแลระบบ
                    </span>
                    {!u.active && <span style={{background:"#f1f5f9",color:"#94a3b8",fontSize:11,padding:"1px 9px",borderRadius:20,fontWeight:600}}>ปิดใช้งาน</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12.5,color:"#64748b"}}>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><Hash size={12}/>{u.username}</span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:u.active?"#10b981":"#94a3b8"}}/>
                      {u.active?"กำลังใช้งาน":"ปิดใช้งาน"}
                    </span>
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button className="um-toggle" style={{background:u.active?"#10b981":"#e2e8f0"}}
                    onClick={()=>toggleActive(u.id)}>
                    <div className="um-toggle-knob" style={{left:u.active?25:3}}/>
                  </button>
                  <button className="icon-btn" onClick={()=>openEdit(u)}><Pencil size={14}/></button>
                  {u.id !== 1 && <button className="icon-btn danger" onClick={()=>deleteUser(u.id)}><Trash2 size={14}/></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ครูผู้สอน group ── */}
      {(filterRole==="all"||filterRole==="teacher") && (
        <div>
          <div className="um-section-head">
            <div className="um-section-bar" style={{background:"linear-gradient(180deg,#3b82f6,#6366f1)"}}/>
            <div style={{fontFamily:"var(--font-d)",fontSize:16,fontWeight:900,color:"#1e293b"}}>ครูผู้สอน</div>
            <span style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>
              {teacherUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())).length} คน
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtered.filter(u=>u.role==="teacher").map(u => {
              return (
                <div key={u.id} className="um-card" style={{opacity:u.active?1:.5}}>
                  <div className="um-avatar" style={{background:"#eff6ff",boxShadow:"0 4px 12px rgba(59,130,246,.12)"}}>
                    {(u.profile_pic || u.profilePic) ? <img src={u.profile_pic || u.profilePic} alt=""/> : <User size={22} style={{color:"#2563eb"}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#1e293b"}}>{u.name}</span>
                      <span style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",fontSize:11,fontWeight:700,padding:"1px 9px",borderRadius:20}}>
                        👩‍🏫 ครูผู้สอน
                      </span>
                      {!u.active && <span style={{background:"#f1f5f9",color:"#94a3b8",fontSize:11,padding:"1px 9px",borderRadius:20,fontWeight:600}}>ปิดใช้งาน</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14,fontSize:12.5,color:"#64748b",flexWrap:"wrap"}}>
                      <span style={{display:"flex",alignItems:"center",gap:4}}><Hash size={12}/>{u.username}</span>
                      <span style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:u.active?"#10b981":"#94a3b8"}}/>
                        {u.active?"กำลังใช้งาน":"ปิดใช้งาน"}
                      </span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button className="um-toggle" style={{background:u.active?"#10b981":"#e2e8f0"}}
                      onClick={()=>toggleActive(u.id)}>
                      <div className="um-toggle-knob" style={{left:u.active?25:3}}/>
                    </button>
                    <button className="icon-btn" onClick={()=>openEdit(u)}><Pencil size={14}/></button>
                    <button className="icon-btn danger" onClick={()=>deleteUser(u.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              );
            })}
            {filtered.filter(u=>u.role==="teacher").length === 0 && (
              <div style={{textAlign:"center",padding:"40px",background:"#f8fafc",borderRadius:14,border:"1.5px dashed #e2e8f0",color:"#94a3b8"}}>
                <User size={40} style={{color:"#e2e8f0",marginBottom:10}}/>
                <div style={{fontWeight:600}}>ไม่พบครูที่ตรงกัน</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="um-modal" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="um-modal-box">
            {/* Header */}
            <div style={{padding:"22px 26px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#db2777,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(236,72,153,.3)"}}>
                  <Users size={18} style={{color:"#fff"}}/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800,color:"#1e293b"}}>
                    {editUser ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
                  </div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>{editUser ? `แก้ไขข้อมูลของ ${form.name}` : "กรอกข้อมูลผู้ใช้งาน"}</div>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",fontSize:16}}>✕</button>
            </div>

            {/* Body */}
            <div style={{padding:"22px 26px",display:"flex",flexDirection:"column",gap:18}}>
              
              {/* Profile Pic Upload */}
              <div className="avatar-upload-container">
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange}/>
                <div className="avatar-preview" onClick={()=>fileInputRef.current.click()}>
                  {form.profilePic ? (
                    <img src={form.profilePic} alt="preview"/>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,color:"#94a3b8"}}>
                      <Camera size={24}/>
                      <span style={{fontSize:11,fontWeight:600}}>เพิ่มรูปภาพ</span>
                    </div>
                  )}
                  <div className="avatar-overlay">
                    <Camera size={20}/>
                  </div>
                </div>
                {form.profilePic && (
                  <button onClick={()=>setForm(f=>({...f,profilePic:null}))} style={{background:"#fee2e2",border:"none",color:"#ef4444",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                    <X size={12}/> ลบรูปภาพ
                  </button>
                )}
              </div>
              


              {/* ประเภทผู้ใช้ */}
              <div>
                <div className="adm-label" style={{marginBottom:10}}>ประเภทผู้ใช้งาน</div>
                <div className="role-selector">
                  {[{k:"admin",l:"🛡️ ผู้ดูแลระบบ",c:"#d97706",bg:"#fffbeb",bdr:"#fde68a"},{k:"teacher",l:"👩‍🏫 ครูผู้สอน",c:"#2563eb",bg:"#eff6ff",bdr:"#bfdbfe"}].map(r=>(
                    <button key={r.k} className="role-btn" onClick={()=>setForm(f=>({...f,role:r.k,classroom_id:r.k==="admin"?"":f.classroom_id}))} style={{
                      border: `2px solid ${form.role===r.k ? r.c : "#e2e8f0"}`,
                      background: form.role===r.k ? r.bg : "#f8fafc",
                      color: form.role===r.k ? r.c : "#94a3b8",
                      boxShadow: form.role===r.k ? `0 4px 14px ${r.c}25` : "none"
                    }}>{r.l}</button>
                  ))}
                </div>
              </div>

              {/* ชื่อ */}
              <div>
                <div className="adm-label">ชื่อ-นามสกุล <span style={{color:"#ef4444"}}>*</span></div>
                <input className="adm-input" placeholder="เช่น นางสาวสมหญิง ใจดี"
                  value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              </div>

              {/* Username */}
              <div>
                <div className="adm-label">ชื่อผู้ใช้ (Username) <span style={{color:"#ef4444"}}>*</span></div>
                <div style={{position:"relative"}}>
                  <Hash size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                  <input className="adm-input" style={{paddingLeft:34}} placeholder="เช่น teacher01"
                    value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="adm-label">
                  รหัสผ่าน {editUser && <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>— เว้นว่างหากไม่ต้องการเปลี่ยน</span>}
                </div>
                <div style={{position:"relative"}}>
                  <Lock size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
                  <input className="adm-input" style={{paddingLeft:34,paddingRight:42}} type={showPwd?"text":"password"} placeholder="กรอกรหัสผ่าน"
                    value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
                  <button onClick={() => setShowPwd(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",padding:4}}>
                    {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              {/* Toggle สถานะ */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:"#f8fafc",borderRadius:12,border:"1.5px solid #e2e8f0"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>สถานะบัญชี</div>
                  <div style={{fontSize:12,color:form.active?"#059669":"#94a3b8",marginTop:2,fontWeight:600}}>
                    {form.active ? "✅ เปิดใช้งาน — สามารถล็อกอินได้" : "⛔ ปิดใช้งาน — ไม่สามารถล็อกอินได้"}
                  </div>
                </div>
                <button className="um-toggle" style={{background:form.active?"#10b981":"#e2e8f0"}}
                  onClick={()=>setForm(f=>({...f,active:!f.active}))}>
                  <div className="um-toggle-knob" style={{left:form.active?25:3}}/>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding:"16px 26px 22px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                ยกเลิก
              </button>
              <button onClick={saveUser} style={{padding:"10px 26px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#db2777,#ec4899)",color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(236,72,153,.35)",display:"flex",alignItems:"center",gap:7}}>
                <Save size={15}/>{editUser ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── CROP MODAL ── */}
      {cropModal.show && (
        <CropModal 
          image={cropModal.image} 
          onSave={onCropSave} 
          onCancel={() => setCropModal({ show: false, image: null })}
        />
      )}
    </>
  );
}

// ── CUSTOM CROP COMPONENT ──
function CropModal({ image, onSave, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const containerRef = useRef(null);

  const CROP_SIZE = 400; // Increased for better quality on modern screens (remains small in DB)

  React.useEffect(() => {
    imgRef.current.src = image;
    imgRef.current.onload = () => {
      // Auto-fit image to crop area initially
      const scale = Math.max(CROP_SIZE / imgRef.current.width, CROP_SIZE / imgRef.current.height);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
    };
  }, [image]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
    
    // Draw image with zoom and offset relative to center of crop area
    ctx.drawImage(
      img,
      (CROP_SIZE / 2 - (img.width * zoom) / 2) + offset.x,
      (CROP_SIZE / 2 - (img.height * zoom) / 2) + offset.y,
      img.width * zoom,
      img.height * zoom
    );

    onSave(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.85)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(5px)"}}>
      <div style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:400,overflow:"hidden",boxShadow:"0 25px 50px -12px rgba(0,0,0,.5)"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:800,fontSize:18,color:"#1e293b"}}>ปรับแต่งรูปภาพ</div>
          <button onClick={onCancel} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer"}}><X size={20}/></button>
        </div>
        
        <div style={{padding:24,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width:CROP_SIZE, height:CROP_SIZE, borderRadius:24, overflow:"hidden", border:"3px solid #f1f5f9",
              background:"#f8fafc", cursor:"move", position:"relative", boxShadow:"0 10px 15px -3px rgba(0,0,0,.1)"
            }}>
            <img 
              src={image} 
              draggable={false}
              style={{
                position:"absolute",
                top:"50%", left:"50%",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                pointerEvents:"none"
              }}
            />
            {/* Overlay Mask */}
            <div style={{position:"absolute",inset:0,boxShadow:"0 0 0 9999px rgba(0,0,0,.4)",borderRadius:"50%",pointerEvents:"none",border:"2px solid rgba(255,255,255,.5)"}}/>
          </div>

          <div style={{width:"100%",background:"#f8fafc",padding:16,borderRadius:16,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700,color:"#64748b"}}>
              <span>ซูมเข้า/ออก</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input 
              type="range" min="0.1" max="3" step="0.01" 
              value={zoom} onChange={e=>setZoom(parseFloat(e.target.value))}
              style={{width:"100%",accentColor:"#ec4899"}}
            />
          </div>
        </div>

        <div style={{padding:20,background:"#f8fafc",display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:12,borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",fontWeight:700,color:"#64748b",cursor:"pointer"}}>ยกเลิก</button>
          <button onClick={handleSave} style={{flex:2,padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#db2777,#ec4899)",color:"#fff",fontWeight:800,cursor:"pointer",boxShadow:"0 4px 12px rgba(236,72,153,.3)"}}>ตกลงและบันทึก</button>
        </div>
        
        <canvas ref={canvasRef} style={{display:"none"}} />
      </div>
    </div>
  );
}

export default UserManagePage;