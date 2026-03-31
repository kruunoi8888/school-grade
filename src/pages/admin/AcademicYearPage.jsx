import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { PlusCircle, Pencil, Trash2, Calendar, CheckCircle2, X } from "lucide-react";

const ANNOUNCE_OPTIONS = [
  { k:"yearly",   label:"ประกาศผลการเรียนแบบรายปี",   sub:"ประกาศครั้งเดียวเมื่อสิ้นปีการศึกษา",   icon:"📅", color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
  { k:"semester", label:"ประกาศผลการเรียนแบบรายภาคเรียน",   sub:"ประกาศรายภาคเรียน", icon:"📋", color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
];

const EMPTY_FORM = { year:"", announceType:"yearly", semester:"1" };

export default function AcademicYearPage({ academicYears, setAcademicYears }) {
  const years = academicYears ?? [];
  const setYears = setAcademicYears ?? (() => {});

  const [modal, setModal]   = useState(null); // null | { mode:"add"|"edit", data:{...} }
  const [form,  setForm]    = useState(EMPTY_FORM);

  const currentYear = years.find(y => y.status === "current");

  const openAdd  = () => { setForm(EMPTY_FORM); setModal({ mode:"add" }); };
  const openEdit = (y) => { setForm({ year:String(y.year), announceType:y.announce_type || y.announceType, semester:String(y.semester) }); setModal({ mode:"edit", id:y.id }); };
  const closeModal = () => setModal(null);

  const setCurrentYear = async (id) => {
    try {
      const target = years.find(y => y.id === id);
      if (!target) return;

      // Update all years: others to past/future, target to current
      const updates = years.map(y => {
        let newStatus = "future";
        if (y.id === id) newStatus = "current";
        else if (y.year < target.year) newStatus = "past";
        return { id: y.id, status: newStatus };
      });

      // Perform bulk updates (Supabase doesn't have a clean bulk update by ID without upsert)
      // We can use a loop or a single upsert if we select all fields.
      // For simplicity, we'll just update them one by one or use a clever upsert.
      
      const { error } = await supabase
        .from('academic_years')
        .upsert(years.map(y => {
           let ns = "future";
           if (y.id === id) ns = "current";
           else if (y.year < target.year) ns = "past";
           return { ...y, status: ns };
        }));

      if (error) throw error;
      setYears(ys => ys.map(y => ({ ...y, status: y.id===id ? "current" : (y.year < target.year ? "past" : "future") })));
    } catch (err) {
      console.error("Error setting current year:", err);
    }
  };

  const saveForm = async () => {
    if (!form.year) return;
    const yr = +form.year;
    
    try {
      const payload = {
        year: yr,
        semester: +form.semester,
        announce_type: form.announceType,
      };

      if (modal.mode === "add") {
        const curYr = currentYear?.year ?? 2568;
        payload.status = yr > curYr ? "future" : yr < curYr ? "past" : "current";
        
        const { data, error } = await supabase
          .from('academic_years')
          .insert([payload])
          .select();
        
        if (error) throw error;
        setYears(ys => [...ys, data[0]]);
      } else {
        const { data, error } = await supabase
          .from('academic_years')
          .update(payload)
          .eq('id', modal.id)
          .select();
        
        if (error) throw error;
        setYears(ys => ys.map(y => y.id === modal.id ? data[0] : y));
      }
      closeModal();
    } catch (err) {
      console.error("Error saving academic year:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const deleteYear = async (id) => {
    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setYears(ys => ys.filter(y => y.id !== id));
    } catch (err) {
      console.error("Error deleting academic year:", err);
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const STATUS_STYLE = {
    current: { label:"ปัจจุบัน",   bg:"#dcfce7", color:"#16a34a", border:"#bbf7d0", dot:"#4ade80" },
    future:  { label:"ปีหน้า",     bg:"#dbeafe", color:"#2563eb", border:"#bfdbfe", dot:"#60a5fa" },
    past:    { label:"ผ่านมาแล้ว", bg:"#f1f5f9", color:"#64748b", border:"#e2e8f0", dot:"#94a3b8" },
  };

  return (
    <>
      <style>{`
        .yr-card { background:#fff; border-radius:16px; border:1.5px solid #f1f5f9; padding:18px 22px; display:flex; align-items:center; gap:16px; transition:all .2s; }
        .yr-card:hover { border-color:#e2e8f0; box-shadow:0 4px 18px rgba(0,0,0,.07); }
        .yr-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:700; }
        .yr-modal-ov { position:fixed; inset:0; background:rgba(15,23,42,.55); z-index:600; display:flex; align-items:center; justify-content:center; padding:16px; }
        .yr-opt { display:flex; align-items:center; gap:12px; padding:13px 14px; border-radius:12px; cursor:pointer; transition:all .2s; border:2px solid; }
        .yr-icon-btn { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .18s; border:1.5px solid; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:4,height:28,background:"linear-gradient(180deg,#3b82f6,#6366f1)",borderRadius:4}}/>
          <div>
            <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:"#1e293b"}}>จัดการปีการศึกษา</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>กำหนดปีการศึกษาและรูปแบบการประกาศผลการเรียน</div>
          </div>
        </div>

        {/* ── Prominent Add button ── */}
        <button onClick={openAdd} style={{
          display:"flex",alignItems:"center",gap:8,
          padding:"11px 22px",borderRadius:12,border:"none",
          background:"linear-gradient(135deg,#2563eb,#6366f1)",
          color:"#fff",fontFamily:"var(--font-d)",fontSize:14.5,fontWeight:800,
          cursor:"pointer",boxShadow:"0 6px 20px rgba(99,102,241,.4)",
          transition:"all .2s"
        }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(99,102,241,.5)"}}
        onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 20px rgba(99,102,241,.4)"}}>
          <PlusCircle size={17}/> + เพิ่มปีการศึกษา
        </button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:20}}>
        {/* ── Current year banner ── */}
        {currentYear && (
          <div style={{
            background:"linear-gradient(135deg,#1e3a8a,#2563eb,#3b82f6)",
            borderRadius:18,padding:"22px 28px",
            position:"relative",overflow:"hidden",boxShadow:"0 10px 32px rgba(37,99,235,.3)"
          }}>
            <div style={{position:"absolute",width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.07)",top:-50,right:-30,pointerEvents:"none"}}/>
            <div style={{position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 8px #4ade80"}}/>
                  ปีการศึกษาที่กำลังใช้งาน
                </div>
                <div style={{fontFamily:"var(--font-d)",fontSize:34,fontWeight:900,color:"#fff",lineHeight:1}}>{currentYear.year}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:6, fontWeight:600}}>
                  {(currentYear.announce_type === "semester" || currentYear.announceType === "semester") ? "ประกาศผลการเรียนแบบรายภาคเรียน" : "ประกาศผลการเรียนแบบรายปี"}
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
                {[
                  ["ปีปัจจุบัน", String(currentYear.year),  "#fff"],
                  ["รูปแบบ",     (currentYear.announce_type === "semester" || currentYear.announceType === "semester") ? "รายภาคเรียน" : "รายปี", "#fde68a"],
                  ["สถานะ",      "Active",                  "#86efac"],
                ].map(([l,v,col]) => (
                  <div key={l} style={{background:"rgba(255,255,255,.12)",borderRadius:12,padding:"10px 16px",backdropFilter:"blur(4px)"}}>
                    <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800,color:col,lineHeight:1}}>{v}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:3}}>{l}</div>
                  </div>
                ))}
                {/* Edit current year */}
                <button onClick={() => openEdit(currentYear)} style={{
                  display:"flex",alignItems:"center",gap:6,padding:"9px 16px",
                  borderRadius:10,border:"1.5px solid rgba(255,255,255,.3)",
                  background:"rgba(255,255,255,.15)",color:"#fff",
                  fontFamily:"var(--font-d)",fontSize:13,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)"
                }}>
                  <Pencil size={13}/> แก้ไข
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Year list ── */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[...years].sort((a,b)=>b.year-a.year || b.semester-a.semester).map(y => {
            const sm = STATUS_STYLE[y.status];
            const ao = ANNOUNCE_OPTIONS.find(o => o.k === (y.announceType || y.announce_type));
            return (
              <div key={y.id} className="yr-card">
                {/* Year badge icon */}
                <div style={{
                  width:58,height:58,borderRadius:15,flexShrink:0,
                  background: y.status==="current" ? "linear-gradient(135deg,#1e40af,#3b82f6)"
                             : y.status==="future"  ? "linear-gradient(135deg,#0369a1,#0ea5e9)"
                             : "#f1f5f9",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow: y.status==="current" ? "0 6px 18px rgba(37,99,235,.3)" : "none"
                }}>
                  <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:900,color:y.status==="past"?"#94a3b8":"#fff",lineHeight:1,textAlign:"center"}}>
                    <div style={{fontSize:10,opacity:.7}}>ปี</div>
                    {y.year}
                  </div>
                </div>

                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontFamily:"var(--font-d)",fontSize:15.5,fontWeight:800,color:"#1e293b"}}>
                      ปีการศึกษา {y.year}
                    </span>
                    <span className="yr-badge" style={{background:sm.bg,color:sm.color,border:`1px solid ${sm.border}`}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:sm.dot}}/>{sm.label}
                    </span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12.5,color:"#64748b"}}>
                    <span style={{fontSize:15}}>{ao?.icon}</span>
                    <span>{ao?.label ?? "-"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {/* Edit button — always visible */}
                  <button className="yr-icon-btn"
                    onClick={() => openEdit(y)}
                    style={{background:"#eff6ff",borderColor:"#bfdbfe",color:"#2563eb"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#2563eb";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#2563eb"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.color="#2563eb";e.currentTarget.style.borderColor="#bfdbfe"}}>
                    <Pencil size={13}/>
                  </button>

                  {y.status !== "current" && (
                    <button onClick={() => setCurrentYear(y.id)} style={{
                      padding:"7px 14px",borderRadius:9,border:"1.5px solid #bfdbfe",
                      background:"#eff6ff",color:"#2563eb",fontFamily:"var(--font-d)",
                      fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .18s",
                      display:"flex",alignItems:"center",gap:5
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background="#2563eb";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#2563eb"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.color="#2563eb";e.currentTarget.style.borderColor="#bfdbfe"}}>
                      <CheckCircle2 size={13}/> ตั้งเป็นปัจจุบัน
                    </button>
                  )}

                  {y.status !== "current" && (
                    <button className="yr-icon-btn"
                      onClick={() => deleteYear(y.id)}
                      style={{background:"#fef2f2",borderColor:"#fecaca",color:"#ef4444"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#ef4444"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#fecaca"}}>
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="yr-modal-ov" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 440, boxShadow: "0 28px 72px rgba(0,0,0,.22)", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,.3)" }}>
                  <Calendar size={19} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    {modal.mode === "add" ? "เพิ่มปีการศึกษา" : "แก้ไขปีการศึกษา"}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {modal.mode === "add" ? "กรอกข้อมูลปีการศึกษาใหม่" : "แก้ไขข้อมูลและรูปแบบการประกาศ"}
                  </div>
                </div>
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Year input */}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#374151", marginBottom: 7 }}>
                  ปีการศึกษา (พ.ศ.) <span style={{ color: "#ef4444" }}>*</span>
                </div>
                <input
                  type="number" placeholder="เช่น 2569"
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  style={{ width: "100%", height: 42, padding: "0 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontFamily: "var(--font)", fontSize: 15, color: "#1e293b", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Announce type */}
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#374151", marginBottom: 10 }}>รูปแบบการประกาศผลการเรียน</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ANNOUNCE_OPTIONS.map(t => {
                    const active = form.announceType === t.k;
                    return (
                      <div key={t.k} className="yr-opt"
                        onClick={() => setForm(f => ({ ...f, announceType: t.k }))}
                        style={{ borderColor: active ? t.color : "#f1f5f9", background: active ? t.bg : "#fff", display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 12, cursor: "pointer", border: "2px solid" }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0, fontSize: 18,
                          background: active ? t.color : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#fff" : "#94a3b8"
                        }}>{t.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 800, color: active ? t.color : "#1e293b" }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={saveForm} disabled={!form.year} style={{
                padding: "9px 24px", borderRadius: 9, border: "none", fontFamily: "var(--font-d)",
                fontSize: 14, fontWeight: 700, cursor: form.year ? "pointer" : "not-allowed",
                background: form.year ? "linear-gradient(135deg,#2563eb,#6366f1)" : "#e2e8f0",
                color: form.year ? "#fff" : "#94a3b8",
                boxShadow: form.year ? "0 4px 16px rgba(99,102,241,.35)" : "none",
                display: "flex", alignItems: "center", gap: 6
              }}>
                {modal.mode === "add" ? <><PlusCircle size={14} /> เพิ่มปีการศึกษา</> : <><CheckCircle2 size={14} /> บันทึกการแก้ไข</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
