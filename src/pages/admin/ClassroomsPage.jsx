import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { sortClassrooms } from "../../utils/studentParser";
import { School, Users, User, Pencil, Trash2, PlusCircle, Save, CheckCircle2, ChevronRight, LayoutGrid, Info, BadgeCheck, Calendar } from "lucide-react";

function ClassroomsPage({ classrooms, setClassrooms, assignments, setAssignments, students }) {
  const LEVEL_COLORS = [
    { color:"#059669", light:"#f0fdf4", border:"#bbf7d0", shadow:"rgba(5,150,105,.18)" },
    { color:"#2563eb", light:"#eff6ff", border:"#bfdbfe", shadow:"rgba(37,99,235,.18)"  },
    { color:"#d97706", light:"#fffbeb", border:"#fde68a", shadow:"rgba(217,119,6,.18)"  },
    { color:"#7c3aed", light:"#f5f3ff", border:"#ddd6fe", shadow:"rgba(124,58,237,.18)" },
    { color:"#db2777", light:"#fdf2f8", border:"#fbcfe8", shadow:"rgba(219,39,119,.18)" },
    { color:"#ea580c", light:"#fff7ed", border:"#fed7aa", shadow:"rgba(234,88,12,.18)"  },
  ];

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({ room_name:"", curriculum_type:"basic" });
  const [savedToast, setSavedToast] = useState(false);

  const showSaved = () => { setSavedToast(true); setTimeout(()=>setSavedToast(false), 2000); };

  const openAdd = () => {
    setForm({ room_name:"", curriculum_type:"basic" });
    setEditItem(null); setShowModal(true);
  };
  const openEdit = (cl) => {
    setForm({ room_name:cl.room_name, curriculum_type: cl.curriculum_type || 'basic' });
    setEditItem(cl); setShowModal(true);
  };

  const saveItem = async () => {
    if (!form.room_name.trim()) return;
    const derivedLevelName = form.room_name.replace(/\/\d+$/, "").trim();
    
    // Extract level (e.g., 'อนุบาล 2' -> 2, 'ป.4/2' -> 4)
    const levelMatch = form.room_name.match(/(\d+)/);
    const levelNumber = levelMatch ? parseInt(levelMatch[1]) : 1;
    
    // Extract room (e.g., 'ป.4/2' -> 2, 'อนุบาล 2' -> 1)
    const roomMatch = form.room_name.match(/\/(\d+)/);
    const roomNumber = roomMatch ? parseInt(roomMatch[1]) : 1;
    
    try {
      if (editItem) {
        const { data, error } = await supabase
          .from('classrooms')
          .update({ 
            room_name: form.room_name, 
            level_name: derivedLevelName,
            level: levelNumber,
            room: roomNumber,
            curriculum_type: form.curriculum_type || 'basic'
          })
          .eq('id', editItem.id)
          .select();
        
        if (error) throw error;
        setClassrooms(cs => cs.map(c => c.id === editItem.id ? data[0] : c));
      } else {
        const newClData = { 
          room_name: form.room_name, 
          level_name: derivedLevelName,
          level: levelNumber,
          room: roomNumber,
          year: 2568, // Default year
          curriculum_type: form.curriculum_type || 'basic'
        };
        const { data, error } = await supabase
          .from('classrooms')
          .insert([newClData])
          .select();
        
        if (error) throw error;
        const newCl = data[0];
        setClassrooms(cs => [...cs, newCl]);
        setAssignments(prev => ({ ...prev, [newCl.id]: [] }));
      }
      setShowModal(false);
      showSaved();
    } catch (err) {
      console.error("Error saving classroom:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้: " + err.message);
    }
  };

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setClassrooms(cs => cs.filter(c => c.id !== id));
      setAssignments(prev => { const next={...prev}; delete next[id]; return next; });
      setConfirmDel(null);
      showSaved();
    } catch (err) {
      console.error("Error deleting classroom:", err);
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

  const totalStudents = students.length;

  return (
    <>
      <style>{`
        .cl-card { background:#fff; border-radius:18px; overflow:hidden; transition:all .22s;
          box-shadow:0 2px 14px rgba(0,0,0,.06); border:1.5px solid #f1f5f9; }
        .cl-card:hover { transform:translateY(-4px); }
        .cl-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:600;
          display:flex; align-items:center; justify-content:center; padding:16px;
          animation:fadeUp .15s ease; }
        .cl-modal { background:#fff; border-radius:22px; width:100%; max-width:460px;
          box-shadow:0 28px 72px rgba(0,0,0,.22); overflow:hidden; }
        .cl-confirm { background:#fff; border-radius:18px; width:100%; max-width:360px;
          box-shadow:0 20px 60px rgba(0,0,0,.2); padding:28px; text-align:center; }
        .cl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; }
      `}</style>

      {/* ── Saved toast ── */}
      {savedToast && (
        <div style={{
          position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",
          background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",
          padding:"12px 26px",borderRadius:14,zIndex:999,
          boxShadow:"0 8px 32px rgba(16,185,129,.45)",
          fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,
          display:"flex",alignItems:"center",gap:9,
          animation:"fadeUp .2s ease"
        }}>
          <CheckCircle2 size={18}/> บันทึกข้อมูลชั้นเรียนเรียบร้อยแล้ว
        </div>
      )}

      {/* ── Header ── */}
      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><School size={22} style={{color:"#10b981"}}/> จัดการชั้นเรียน</h1>
          <p>ปีการศึกษา 2568 · {classrooms.length} ชั้นเรียน · นักเรียนรวม {totalStudents} คน</p>
        </div>
        <button className="adm-btn adm-btn-primary"
          style={{background:"linear-gradient(135deg,#059669,#10b981)",boxShadow:"0 4px 16px rgba(16,185,129,.35)"}}
          onClick={openAdd}>
          <PlusCircle size={16}/> เพิ่มชั้นเรียน
        </button>
      </div>


      {/* ── Cards grid ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
        {sortClassrooms(classrooms).map((cl,idx) => {
          const cc = LEVEL_COLORS[((cl.level||1)-1) % LEVEL_COLORS.length] ?? LEVEL_COLORS[idx % LEVEL_COLORS.length];
          const assignedCount = (assignments[cl.id]||[]).length;
          const studentCount = students.filter(s => s.classroom_id === cl.id).length;
          return (
            <div key={cl.id} style={{
              background:"#fff", borderRadius:16,
              boxShadow:"0 2px 12px rgba(0,0,0,.06)",
              border:"1.5px solid #f1f5f9",
              overflow:"hidden", transition:"all .22s", cursor:"default",
              display:"flex", flexDirection:"column"
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 32px ${cc.shadow}`;e.currentTarget.style.borderColor=cc.border}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";e.currentTarget.style.borderColor="#f1f5f9"}}>

              {/* Hero gradient area */}
              <div style={{
                background:`linear-gradient(135deg,${cc.color} 0%,${cc.color}bb 100%)`,
                padding:"22px 20px 18px",
                position:"relative",overflow:"hidden"
              }}>
                {/* bg circle deco */}
                <div style={{position:"absolute",width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,.1)",top:-20,right:-20,pointerEvents:"none"}}/>
                <div style={{position:"absolute",width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,.07)",bottom:-10,left:10,pointerEvents:"none"}}/>

                <div style={{position:"relative",zIndex:1}}>
                  {/* Index number small */}
                  <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700,letterSpacing:.8,marginBottom:8,textTransform:"uppercase"}}>
                    ชั้นเรียน #{idx+1}
                  </div>
                  {/* Class name big */}
                  <div style={{
                    fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,
                    color:"#fff",lineHeight:1.15,letterSpacing:"-.3px",
                    display:"flex", alignItems:"center", gap:8
                  }}>
                    {cl.room_name}
                    {cl.curriculum_type === "kindergarten" && (
                      <span style={{
                        fontSize:10, background:"rgba(255,255,255,.25)", 
                        padding:"2px 8px", borderRadius:6, fontWeight:800,
                        textTransform:"uppercase", letterSpacing:.5
                      }}>บริบทอนุบาล</span>
                    )}
                  </div>
                  {/* year badge + teacher badge */}
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    <div style={{
                      display:"inline-flex",alignItems:"center",gap:5,
                      background:"rgba(255,255,255,.2)",
                      borderRadius:20,padding:"3px 11px",
                      fontSize:11,fontWeight:700,color:"rgba(255,255,255,.9)"
                    }}>
                      <Calendar size={11}/> ปีการศึกษา {cl.year}
                    </div>
                    <div style={{
                      display:"inline-flex",alignItems:"center",gap:5,
                      background:"rgba(255,255,255,.25)",
                      borderRadius:20,padding:"3px 11px",
                      fontSize:11,fontWeight:700,color:"rgba(255,255,255,.95)"
                    }}>
                      <Users size={10}/> {studentCount} นักเรียน
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom action area */}
              <div style={{
                padding:"12px 14px",
                display:"flex",alignItems:"center",justifyContent:"space-between",
                borderTop:`3px solid ${cc.color}18`
              }}>
                <div style={{
                  fontSize:12,color:"#94a3b8",display:"flex",alignItems:"center",gap:5
                }}>
                  <School size={13} style={{color:cc.color}}/>
                  <span style={{color:cc.color,fontWeight:700,fontSize:12}}>ห้องเรียน</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>openEdit(cl)} style={{
                    width:32,height:32,borderRadius:9,
                    border:`1.5px solid ${cc.border}`,background:cc.light,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",transition:"all .18s",color:cc.color
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=cc.color;e.currentTarget.style.color="#fff"}}
                  onMouseLeave={e=>{e.currentTarget.style.background=cc.light;e.currentTarget.style.color=cc.color}}
                  title="แก้ไข">
                    <Pencil size={13}/>
                  </button>
                  <button onClick={()=>setConfirmDel(cl)} style={{
                    width:32,height:32,borderRadius:9,
                    border:"1.5px solid #fecaca",background:"#fef2f2",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",transition:"all .18s",color:"#ef4444"
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#ef4444";e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#ef4444"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#fecaca"}}
                  title="ลบ">
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add new placeholder */}
        <button onClick={openAdd} style={{
          background:"#fafbff",border:"2px dashed #c7d2fe",borderRadius:16,
          minHeight:160,cursor:"pointer",display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",gap:8,
          transition:"all .22s",color:"#a5b4fc"
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="#eef2ff";e.currentTarget.style.borderColor="#6366f1";e.currentTarget.style.color="#6366f1";e.currentTarget.style.transform="translateY(-4px)"}}
        onMouseLeave={e=>{e.currentTarget.style.background="#fafbff";e.currentTarget.style.borderColor="#c7d2fe";e.currentTarget.style.color="#a5b4fc";e.currentTarget.style.transform=""}}>
          <div style={{width:48,height:48,borderRadius:13,background:"rgba(99,102,241,.1)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .22s"}}>
            <PlusCircle size={24}/>
          </div>
          <div style={{fontFamily:"var(--font-d)",fontSize:14,fontWeight:700}}>เพิ่มชั้นเรียนใหม่</div>
          <div style={{fontSize:11,opacity:.7}}>คลิกเพื่อเพิ่ม</div>
        </button>
      </div>

      {/* ── MODAL: เพิ่ม/แก้ไข ── */}
      {showModal && (
        <div className="cl-modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="cl-modal" onKeyDown={e=>e.key==="Enter"&&saveItem()}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg,#f0fdf4,#fff)",
              padding:"22px 26px 18px",borderBottom:"1px solid #f1f5f9",
              display:"flex",alignItems:"center",justifyContent:"space-between"
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{
                  width:42,height:42,borderRadius:12,
                  background:`linear-gradient(135deg,#059669,#10b981)`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 4px 14px rgba(16,185,129,.3)"
                }}>
                  <School size={20} style={{color:"#fff"}}/>
                </div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:17,fontWeight:800,color:"#1e293b"}}>
                    {editItem ? `แก้ไข: ${editItem.room_name}` : "เพิ่มชั้นเรียนใหม่"}
                  </div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>
                    {editItem ? "แก้ไขข้อมูลชั้นเรียน" : "กรอกข้อมูลชั้นเรียนที่ต้องการเพิ่ม"}
                  </div>
                </div>
              </div>
              <button onClick={()=>setShowModal(false)} style={{width:32,height:32,borderRadius:9,border:"1.5px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b",fontSize:15}}>✕</button>
            </div>

            {/* Body */}
            <div style={{padding:"24px 26px",display:"flex",flexDirection:"column",gap:18}}>

              {/* ชื่อชั้นเรียน */}
              <div>
                <div className="adm-label">ชื่อชั้นเรียน <span style={{color:"#ef4444"}}>*</span></div>
                <input className="adm-input"
                  placeholder="เช่น อนุบาลปีที่ 1, ป.3/2, มัธยมศึกษาปีที่ 1/1"
                  value={form.room_name}
                  onChange={e=>{
                    const v = e.target.value;
                    setForm(f=>({...f, room_name:v, curriculum_type: v.includes("อนุบาล") ? "kindergarten" : "basic"}));
                  }}/>
                <div style={{fontSize:11.5,color:"#94a3b8",marginTop:6,display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["อนุบาล 1","อนุบาล 2","อนุบาล 3","ป.1","ป.2","ป.3","ป.4","ป.5","ป.6","ม.1","ม.2","ม.3","ม.4","ม.5","ม.6"].map(s=>(
                    <button key={s} 
                      onClick={()=>setForm(f=>({...f, room_name:s, curriculum_type: s.includes("อนุบาล") ? "kindergarten" : "basic"}))} 
                      style={{
                        padding:"2px 10px",borderRadius:20,border:"1px solid #e2e8f0",
                        background:"#f8fafc",color:"#64748b",fontSize:11,cursor:"pointer",
                        fontFamily:"var(--font)",transition:"all .15s"
                      }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#10b981";e.currentTarget.style.color="#059669";e.currentTarget.style.background="#f0fdf4"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#64748b";e.currentTarget.style.background="#f8fafc"}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{padding:"16px 26px 22px",borderTop:"1px solid #f1f5f9",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowModal(false)} style={{padding:"10px 22px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                ยกเลิก
              </button>
              <button onClick={saveItem} disabled={!form.room_name.trim()} style={{
                padding:"10px 26px",borderRadius:10,border:"none",
                background: form.room_name.trim() ? "linear-gradient(135deg,#059669,#10b981)" : "#e2e8f0",
                color: form.room_name.trim() ? "#fff" : "#94a3b8",
                fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:form.room_name.trim()?"pointer":"not-allowed",
                boxShadow:form.room_name.trim()?"0 4px 16px rgba(16,185,129,.35)":"none",
                display:"flex",alignItems:"center",gap:7,transition:"all .2s"
              }}>
                <Save size={14}/>{editItem ? "บันทึกการแก้ไข" : "เพิ่มชั้นเรียน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {confirmDel && (
        <div className="cl-modal-overlay" onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}>
          <div className="cl-confirm">
            <div style={{width:60,height:60,borderRadius:18,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 16px rgba(239,68,68,.15)"}}>
              <Trash2 size={28} style={{color:"#ef4444"}}/>
            </div>
            <div style={{fontFamily:"var(--font-d)",fontSize:18,fontWeight:800,color:"#1e293b",marginBottom:6}}>ยืนยันการลบ</div>
            <div style={{fontSize:14,color:"#64748b",marginBottom:6}}>
              คุณต้องการลบ <strong style={{color:"#1e293b"}}>ชั้น{confirmDel.room_name}</strong> ใช่หรือไม่?
            </div>
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#dc2626",marginBottom:22}}>
              ⚠️ ข้อมูลนักเรียนในชั้นนี้จะถูกลบออกด้วย
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={{padding:"10px 24px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                ยกเลิก
              </button>
              <button onClick={()=>deleteItem(confirmDel?.id)} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#dc2626,#ef4444)",color:"#fff",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(239,68,68,.35)",display:"flex",alignItems:"center",gap:6}}>
                <Trash2 size={14}/> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClassroomsPage;