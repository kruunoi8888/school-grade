import React, { useState } from "react";
import { School, Settings, Pencil, Trash2, Save, CheckCircle2, BadgeCheck, Bell, PlusCircle, Calendar, Image as ImageIcon, Camera, User, X, Shield, Info } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatThaiDate } from "../../utils/dateFormatter";

function LogoCropModal({ src, onDone, onClose }) {
  const canvasRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const [pos, setPos] = React.useState({ x:0, y:0 });
  const [scale, setScale] = React.useState(1);
  const [imgEl, setImgEl] = React.useState(null);
  const [startDrag, setStartDrag] = React.useState(null);
  const SIZE = 260;

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const tmp = document.createElement("canvas");
      tmp.width = w; tmp.height = h;
      const tmpCtx = tmp.getContext("2d", { alpha: true });
      tmpCtx.clearRect(0, 0, w, h);
      tmpCtx.drawImage(img, 0, 0, w, h);
      const resized = new Image();
      resized.onload = () => {
        setImgEl(resized);
        const s = Math.max(SIZE / resized.width, SIZE / resized.height);
        setScale(s);
        setPos({ x: (SIZE - resized.width * s) / 2, y: (SIZE - resized.height * s) / 2 });
      };
      resized.src = tmp.toDataURL("image/png");
    };
    img.src = src;
  }, [src]);

  React.useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(imgEl, pos.x, pos.y, imgEl.width * scale, imgEl.height * scale);
    ctx.strokeStyle = "rgba(99,102,241,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2 - 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2 - 4, 0, Math.PI*2);
    ctx.stroke();
  }, [imgEl, pos, scale]);

  const onMouseDown = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    setDrag(true);
    setStartDrag({ mx: e.clientX - r.left, my: e.clientY - r.top, px: pos.x, py: pos.y });
  };
  const onMouseMove = (e) => {
    if (!drag || !startDrag) return;
    const r = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    setPos({ x: startDrag.px + (mx - startDrag.mx), y: startDrag.py + (my - startDrag.my) });
  };
  const onMouseUp = () => { setDrag(false); setStartDrag(null); };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    const r = canvasRef.current.getBoundingClientRect();
    setDrag(true);
    setStartDrag({ mx: t.clientX - r.left, my: t.clientY - r.top, px: pos.x, py: pos.y });
  };
  const onTouchMove = (e) => {
    if (!drag || !startDrag) return;
    const t = e.touches[0];
    const r = canvasRef.current.getBoundingClientRect();
    setPos({ x: startDrag.px + (t.clientX - r.left - startDrag.mx), y: startDrag.py + (t.clientY - r.top - startDrag.my) });
  };

  const handleCrop = () => {
    if (!imgEl) return;
    const EXPORT = 200;
    const out = document.createElement("canvas");
    out.width = EXPORT; out.height = EXPORT;
    const ctx = out.getContext("2d", { alpha: true });
    ctx.clearRect(0, 0, EXPORT, EXPORT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.beginPath();
    ctx.arc(EXPORT/2, EXPORT/2, EXPORT/2, 0, Math.PI * 2);
    ctx.clip();
    const ratio = EXPORT / SIZE;
    ctx.drawImage(imgEl, pos.x * ratio, pos.y * ratio, imgEl.width * scale * ratio, imgEl.height * scale * ratio);
    ctx.restore();
    onDone(out.toDataURL("image/png"));
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff",borderRadius:22,width:"100%",maxWidth:380,boxShadow:"0 28px 72px rgba(0,0,0,.3)",overflow:"hidden" }}>
        <div style={{ padding:"20px 24px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(99,102,241,.3)" }}>
              <Pencil size={17} style={{ color:"#fff" }}/>
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:"#1e293b" }}>ปรับแต่งโลโก้</div>
              <div style={{ fontSize:12,color:"#94a3b8" }}>ลากรูปเพื่อตำแหน่ง · เลื่อนซูมด้านล่าง</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",fontSize:14 }}>✕</button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"24px 24px 0" }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            style={{ borderRadius:12,cursor:drag?"grabbing":"grab",border:"1.5px solid #e2e8f0",touchAction:"none" }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
          />
          <div style={{ width:"100%",display:"flex",alignItems:"center",gap:12 }}>
            <span style={{ fontSize:12,color:"#94a3b8",flexShrink:0 }}>ซูม</span>
            <input type="range" min={0.3} max={4} step={0.02} value={scale}
              onChange={e => setScale(parseFloat(e.target.value))}
              style={{ flex:1,accentColor:"#6366f1" }}/>
            <span style={{ fontSize:12,color:"#6366f1",fontWeight:700,width:36,textAlign:"right" }}>{Math.round(scale*100)}%</span>
          </div>
        </div>
        <div style={{ padding:"16px 24px 22px",borderTop:"1px solid #f1f5f9",marginTop:16,display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"9px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer" }}>ยกเลิก</button>
          <button onClick={handleCrop} style={{ padding:"9px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.35)",display:"flex",alignItems:"center",gap:7 }}>
            <Save size={14}/> บันทึกโลโก้
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ schoolInfo, setSchoolInfo, notifications, setNotifications }) {
  const [settingsTab, setSettingsTab] = useState("school");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ ...schoolInfo });
  const [cropSrc, setCropSrc] = useState(null);
  const fileInputRef = React.useRef(null);

  // Sync schoolForm if schoolInfo changes (e.g. after initial fetch)
  React.useEffect(() => {
    if (schoolInfo) setSchoolForm({ ...schoolInfo });
  }, [schoolInfo]);

  // Announcement state
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [editAnnounce, setEditAnnounce] = useState(null);
  const [announceForm, setAnnounceForm] = useState({ title:"", message:"", type:"info", active: true, created_at: new Date().toISOString() });

  const handleLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleCropDone = (dataUrl) => {
    setSchoolForm(f => ({ ...f, logo: dataUrl }));
    setCropSrc(null);
  };

  const handleSaveSchool = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('school_info')
        .upsert({ ...schoolForm, id: 1 });
      
      if (error) throw error;

      setSchoolInfo({ ...schoolForm });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (error) {
      console.error("Error saving school info:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddAnnounce = () => {
    setAnnounceForm({ title:"", message:"", type:"info", active: true, created_at: new Date().toISOString() });
    setEditAnnounce(null);
    setShowAnnounceModal(true);
  };

  const openEditAnnounce = (ann) => {
    setAnnounceForm({ ...ann });
    setEditAnnounce(ann);
    setShowAnnounceModal(true);
  };

  const saveAnnouncement = async () => {
    if (!announceForm.title || !announceForm.message) return;
    
    try {
      let { active, ...noActiveForm } = announceForm;
      let targetForm = announceForm;

      const performSave = async (payload) => {
        if (editAnnounce) {
          return await supabase.from('notifications').update(payload).eq('id', editAnnounce.id).select();
        } else {
          return await supabase.from('notifications').insert([payload]).select();
        }
      };

      let { data, error } = await performSave(targetForm);
      
      // If fails because of 'active' column, retry without it
      if (error && error.message?.includes('active" does not exist')) {
        console.warn("Retrying without 'active' column. Please add 'active' column to 'notifications' table.");
        const retry = await performSave(noActiveForm);
        data = retry.data;
        error = retry.error;
        
        if (!error) {
             alert("บันทึกประกาศแล้ว! (หมายเหตุ: ระบบเปิด-ปิดข่าวยังไม่ทำงาน เนื่องจากคุณครูยังไม่ได้เพิ่มคอลัมน์ active ในฐานข้อมูล Supabase ครับ)");
        }
      }

      if (error) throw error;
      
      if (editAnnounce) {
        setNotifications(prev => prev.map(a => a.id === editAnnounce.id ? data[0] : a));
      } else {
        setNotifications(prev => [data[0], ...prev]);
      }
      setShowAnnounceModal(false);
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("ไม่สามารถบันทึกประกาศได้: " + error.message);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("ยืนยันการลบประกาศนี้?")) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("ไม่สามารถลบประกาศได้");
    }
  };

  const TABS = [
    { key:"school",  label:"ข้อมูลโรงเรียน", Icon:School   },
    { key:"announce", label:"ข่าวประกาศ",   Icon:Bell     },
  ];

  return (
    <div>
      <style>{`
        .settings-tabs { display:flex; gap:4px; background:#f1f5f9; border-radius:12px; padding:4px; margin-bottom:24px; flex-wrap:wrap; }
        .settings-tab  { display:flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px; border:none; cursor:pointer; font-family:var(--font); font-size:13.5px; font-weight:600; transition:all .2s; background:transparent; color:#64748b; }
        .settings-tab.on { background:#fff; color:#1e293b; box-shadow:0 2px 8px rgba(0,0,0,.08); }
        .user-card { background:#fff; border-radius:14px; border:1.5px solid #f1f5f9; padding:16px 18px; display:flex; align-items:center; gap:14px; transition:all .2s; }
        .user-card:hover { border-color:#e2e8f0; box-shadow:0 4px 16px rgba(0,0,0,.07); }
        .user-avatar { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:500; display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeUp .15s ease; }
        .modal-box { background:#fff; border-radius:20px; width:100%; max-width:480px; box-shadow:0 24px 64px rgba(0,0,0,.25); overflow:hidden; }
        .modal-header { padding:20px 24px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
        .modal-body { padding:24px; display:flex; flex-direction:column; gap:16px; }
        .modal-footer { padding:16px 24px; border-top:1px solid #f1f5f9; display:flex; gap:10px; justify-content:flex-end; }
        @media(max-width:640px){ .settings-tab span { display:none; } .settings-tab { padding:9px 12px; } }
      `}</style>

      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><Settings size={22} style={{color:"#6366f1"}}/> ตั้งค่าระบบโรงเรียน</h1>
        </div>
        {settingsTab === "school" && (
          <>
            <button className="adm-btn adm-btn-primary" onClick={handleSaveSchool} disabled={saving} style={{opacity:saving?.85:1,minWidth:130,cursor:saving?"not-allowed":"pointer"}}>
              {saving
                ? <><div style={{width:15,height:15,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>&nbsp;กำลังบันทึก...</>
                : <><Save size={15}/> บันทึก</>
              }
            </button>
            {savedMsg && (
              <div style={{position:"fixed",top:22,left:"50%",transform:"translateX(-50%)",zIndex:900,animation:"fadeUp .3s ease both",background:"linear-gradient(135deg,#059669,#10b981)",borderRadius:16,padding:"14px 26px",boxShadow:"0 12px 40px rgba(16,185,129,.4)",display:"flex",alignItems:"center",gap:12,minWidth:280}}>
                <div style={{width:38,height:38,borderRadius:11,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <CheckCircle2 size={20} style={{color:"#fff"}}/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:900,color:"#fff"}}>บันทึกสำเร็จ! ✓</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.8)",marginTop:1}}>อัปเดตข้อมูลโรงเรียนเรียบร้อยแล้ว</div>
                </div>
              </div>
            )}
          </>
        )}
        {settingsTab === "announce" && <button className="adm-btn adm-btn-primary" style={{background:"linear-gradient(135deg,#c026d3,#9333ea)",boxShadow:"0 4px 16px rgba(147,51,234,.35)"}} onClick={openAddAnnounce}><PlusCircle size={16}/> เพิ่มประกาศ</button>}
      </div>

      <div className="settings-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`settings-tab${settingsTab===t.key?" on":""}`} onClick={()=>setSettingsTab(t.key)}>
            <t.Icon size={16} style={{color: settingsTab===t.key ? "#6366f1" : "#94a3b8"}}/>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {settingsTab === "school" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
          <div className="adm-card">
            <div className="adm-card-header"><div className="adm-card-title"><School size={15} style={{color:"#6366f1"}}/> ข้อมูลโรงเรียน</div></div>
            <div className="adm-card-body">
              <div style={{display:"flex",alignItems:"center",gap:20,padding:"16px 20px",background:"linear-gradient(135deg,#f8faff,#f0f0ff)",borderRadius:14,border:"1.5px solid #e0e7ff",marginBottom:20}}>
                <div style={{width:80,height:80,borderRadius:"50%",flexShrink:0,overflow:"hidden",background:schoolForm.logo?"transparent":"linear-gradient(135deg,#1e40af,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,boxShadow:schoolForm.logo?"none":"0 4px 16px rgba(99,102,241,.25)",border:schoolForm.logo?"none":"3px solid #fff"}}>
                  {schoolForm.logo ? <img src={schoolForm.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🏫"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,color:"#1e293b",marginBottom:4}}>โลโก้โรงเรียน</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>รองรับ JPG, PNG · แนะนำขนาด 200×200px ขึ้นไป</div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>fileInputRef.current?.click()} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:9,border:"1.5px solid #6366f1",background:"#eef2ff",color:"#6366f1",fontFamily:"var(--font-d)",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#6366f1";e.currentTarget.style.color="#fff"}} onMouseLeave={e=>{e.currentTarget.style.background="#eef2ff";e.currentTarget.style.color="#6366f1"}}><PlusCircle size={14}/> อัปโหลดโลโก้</button>
                    {schoolForm.logo && <button onClick={()=>setSchoolForm(f=>({...f,logo:null}))} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9,border:"1.5px solid #fecaca",background:"#fef2f2",color:"#ef4444",fontFamily:"var(--font-d)",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#ef4444"}} onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#fecaca"}}><Trash2 size={14}/> ลบโลโก้</button>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoFile}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {[["ชื่อโรงเรียน","name"],["รหัสโรงเรียน","code"],["ผู้อำนวยการโรงเรียน","director_name"],["สังกัด","district"],["ที่อยู่","address"],["โทรศัพท์","phone"],["อีเมล","email"]].map(([l,k])=>(
                  <div key={k} style={{gridColumn:k==="district"||k==="address"?"1/-1":"auto"}}>
                    <div className="adm-label">{l}</div>
                    <input className="adm-input" value={schoolForm[k]||""} onChange={e=>setSchoolForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {cropSrc && <LogoCropModal src={cropSrc} onDone={handleCropDone} onClose={()=>setCropSrc(null)}/>}

      {settingsTab === "announce" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {notifications.map(ann => (
            <div key={ann.id} className="adm-card" style={{padding:"18px 22px",display:"flex",alignItems:"center",gap:18}}>
              <div style={{width:48,height:48,borderRadius:14,background:ann.type==="warning"?"#fff7ed":ann.type==="success"?"#f0fdf4":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24, opacity: ann.active ? 1 : 0.5}}>
                {ann.type==="warning"?"⚠️":ann.type==="success"?"✅":"📢"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--font-d)",fontSize:16,fontWeight:800,color:ann.active?"#1e293b":"#94a3b8", display:"flex", alignItems:"center", gap:10}}>
                  {ann.title}
                  {!ann.active && <span style={{fontSize:10, background:"#f1f5f9", padding:"2px 8px", borderRadius:6, color:"#94a3b8"}}>ปิดการแสดงผล</span>}
                </div>
                <div style={{fontSize:13,color:ann.active?"#64748b":"#cbd5e1",marginTop:2}}>{ann.message}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:6,display:"flex",alignItems:"center",gap:5}}><Calendar size={11}/> {formatThaiDate(ann.created_at)}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>openEditAnnounce(ann)} className="icon-btn"><Pencil size={15}/></button>
                <button onClick={()=>deleteAnnouncement(ann.id)} className="icon-btn danger"><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div style={{textAlign:"center",padding:60,background:"#f8fafc",borderRadius:20,border:"2px dashed #e2e8f0"}}>
              <Bell size={40} style={{color:"#cbd5e1",marginBottom:12}}/>
              <div style={{fontWeight:700,color:"#94a3b8"}}>ยังไม่มีประกาศ</div>
            </div>
          )}
        </div>
      )}

      {showAnnounceModal && (
        <div className="modal-overlay" onClick={()=>setShowAnnounceModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800}}>{editAnnounce?"แก้ไขประกาศ":"เพิ่มประกาศใหม่"}</div><button onClick={()=>setShowAnnounceModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="adm-label">หัวข้อ</div>
              <input className="adm-input" value={announceForm.title} onChange={e=>setAnnounceForm({...announceForm,title:e.target.value})} placeholder="เช่น ประกาศผลการเรียน 1/2568"/>
              <div className="adm-label">ข้อความ</div>
              <textarea className="adm-input" style={{height:100}} value={announceForm.message} onChange={e=>setAnnounceForm({...announceForm,message:e.target.value})} placeholder="รายละเอียดประกาศ..."/>
              <div className="adm-label">ประเภท</div>
              <div style={{display:"flex",gap:10}}>
                {[{k:"info",l:"📢 ข้อมูล"},{k:"success",l:"✅ แจ้งข่าว"},{k:"warning",l:"⚠️ เตือน"}].map(t=>(
                  <button key={t.k} onClick={()=>setAnnounceForm({...announceForm,type:t.k})} style={{flex:1,padding:10,borderRadius:10,border:announceForm.type===t.k?"2px solid #6366f1":"1px solid #e2e8f0",background:announceForm.type===t.k?"#eef2ff":"#fff"}}>{t.l}</button>
                ))}
              </div>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f8fafc", padding:"12px 16px", borderRadius:12, marginTop:8}}>
                  <div style={{display:"flex", alignItems:"center", gap:10}}>
                    <div style={{width:8, height:8, borderRadius:"50%", background: announceForm.active ? "#10b981" : "#cbd5e1"}}/>
                    <div style={{fontSize:14, fontWeight:700, color:"#475569"}}>เปิดการแสดงผลในหน้าหลัก</div>
                  </div>
                  <button 
                    onClick={() => setAnnounceForm({...announceForm, active: !announceForm.active})}
                    style={{
                        padding:"6px 16px", borderRadius:8, border:"none", 
                        background: announceForm.active ? "linear-gradient(135deg, #10b981, #059669)" : "#e2e8f0",
                        color: announceForm.active ? "#fff" : "#64748b",
                        fontSize:13, fontWeight:800, cursor:"pointer"
                    }}
                  >
                    {announceForm.active ? "เปิดอยู่" : "ปิดอยู่"}
                  </button>
              </div>
            </div>
            <div className="modal-footer"><button onClick={()=>setShowAnnounceModal(false)}>ยกเลิก</button><button onClick={saveAnnouncement} className="adm-btn adm-btn-primary">บันทึก</button></div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SettingsPage;
