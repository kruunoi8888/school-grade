import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { BookOpen, PlusCircle, Pencil, Trash2, Save, Search, Filter, CheckCircle2, Info, School, Star, Clock, Baby, Sparkles } from "lucide-react";
import { ACTIVITY_TYPES, SUBJECT_GROUPS } from "../../data/mockData";
import { sortClassrooms } from "../../utils/studentParser";
import { LEVEL_NAMES, genSubjectCode } from "../../utils/constants";

const lvFull = (lv) => {
  const map = { "ป.1":"ประถมศึกษาปีที่ 1","ป.2":"ประถมศึกษาปีที่ 2","ป.3":"ประถมศึกษาปีที่ 3","ป.4":"ประถมศึกษาปีที่ 4","ป.5":"ประถมศึกษาปีที่ 5","ป.6":"ประถมศึกษาปีที่ 6","ม.1":"มัธยมศึกษาปีที่ 1","ม.2":"มัธยมศึกษาปีที่ 2","ม.3":"มัธยมศึกษาปีที่ 3","ม.4":"มัธยมศึกษาปีที่ 4","ม.5":"มัธยมศึกษาปีที่ 5","ม.6":"มัธยมศึกษาปีที่ 6","อนุบาล 1":"อนุบาลปีที่ 1","อนุบาล 2":"อนุบาลปีที่ 2","อนุบาล 3":"อนุบาลปีที่ 3" };
  return map[lv] ?? lv;
};

// Normalize level names for matching (e.g. ป.1 vs ประถมศึกษาปีที่ 1)
const normalize = (l) => {
  if(!l) return "";
  const map = { "ประถมศึกษาปีที่ 1":"ป.1","ประถมศึกษาปีที่ 2":"ป.2","ประถมศึกษาปีที่ 3":"ป.3","ประถมศึกษาปีที่ 4":"ป.4","ประถมศึกษาปีที่ 5":"ป.5","ประถมศึกษาปีที่ 6":"ป.6","มัธยมศึกษาปีที่ 1":"ม.1","มัธยมศึกษาปีที่ 2":"ม.2","มัธยมศึกษาปีที่ 3":"ม.3","มัธยมศึกษาปีที่ 4":"ม.4","มัธยมศึกษาปีที่ 5":"ม.5","มัธยมศึกษาปีที่ 6":"ม.6" };
  return map[l] || l;
};

function SubjectManagePage({ subjects, setSubjects, classrooms, students, activities, setActivities }) {
  const liveClassrooms = classrooms ?? [];
  const allLevels = [...new Set(liveClassrooms.map(c => c.level_name ?? c.room_name.replace(/\/\d+$/, "")))];

  const kinderLevels = allLevels.filter(lv => lv.startsWith("อนุบาล"));
  const basicLevels  = allLevels.filter(lv => !lv.startsWith("อนุบาล"));
  const hasKinder    = kinderLevels.length > 0;
  const hasBasic     = basicLevels.length > 0;
  const [levelGroup, setLevelGroup] = React.useState(hasBasic ? "basic" : "kinder");
  const activeLevels = levelGroup === "kinder" ? kinderLevels : basicLevels;

  const EMPTY_SUB = { subject_code:"", subject_name:"", subject_group:SUBJECT_GROUPS[0]?.id, credit:1, hours:40, type:"core", level_name: "" };
  const EMPTY_ACT = { activity_code: "", activity_type: ACTIVITY_TYPES[0]?.id, hours: 40, level_name: "", result: "ผ" };

  const [filterLevel, setFilterLevel] = useState("");
  const [search, setSearch]         = useState("");
  
  const [showModal, setShowModal]   = useState(false);
  const [itemType, setItemType]     = useState("core"); // core | extra | activity
  const [formSub, setFormSub]       = useState({...EMPTY_SUB});
  const [formAct, setFormAct]       = useState({...EMPTY_ACT});
  const [editId, setEditId]         = useState(null);
  const [codeManual, setCodeManual] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [customActName, setCustomActName] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  const isKinder = filterLevel?.startsWith("อนุบาล");

  React.useEffect(() => {
    if (codeManual || itemType === "activity") return;
    const grp = SUBJECT_GROUPS.find(g => g?.id === formSub.subject_group);
    if (!grp) return;
    const prefix = formSub.type === "extra" ? "เ" : grp.code;
    const lvName = formSub.level_name || (activeLevels[0] ?? "ป.1");
    const siblings = subjects.filter(s =>
      s.subject_group === formSub.subject_group &&
      s.level_name === lvName &&
      s.type === formSub.type &&
      (!editId || s?.id !== editId)
    );
    const code = genSubjectCode(prefix, lvName, siblings.length + 1);
    setFormSub(f => ({...f, subject_code: code}));
  }, [formSub.subject_group, formSub.level_name, formSub.type, codeManual, itemType]);

  const grpMeta = (gid) => SUBJECT_GROUPS.find(g => g?.id === gid) ?? { color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0" };

  const openAdd = () => {
    setCodeManual(false); setEditId(null); setItemType("core");
    const initLevel = filterLevel || activeLevels[0] || "ป.1";
    setFormSub({...EMPTY_SUB, level_name: initLevel});
    setFormAct({...EMPTY_ACT, level_name: initLevel});
    setCustomActName("");
    setShowModal(true);
  };
  const openEditSub = (s) => {
    setCodeManual(true); setEditId(s?.id); setItemType(s.type);
    setFormSub({ ...s }); setShowModal(true);
  };
  const openEditAct = (a) => {
    setEditId(a?.id); setItemType("activity");
    setFormAct({ ...a, activity_code: a.activity_code || "" }); 
    const isStd = ACTIVITY_TYPES.find(t=>t.id===a.activity_type);
    setCustomActName(isStd ? "" : a.activity_type);
    setShowModal(true);
  };
  
  const handleSave = async () => {
    try {
      if (itemType === "activity") {
        let finalType = formAct.activity_type;
        if (finalType === "OTHER") finalType = customActName.trim();
        if (!finalType) return;
        
        const finalAct = { ...formAct, activity_type: finalType };
        if (editId) { 
          const { data, error } = await supabase
            .from('activities')
            .update(finalAct)
            .eq('id', editId)
            .select();
          if (error) throw error;
          setActivities(as=>as.map(a=>a?.id===editId?data[0]:a)); 
        }
        else { 
          const { data, error } = await supabase
            .from('activities')
            .insert([finalAct])
            .select();
          if (error) throw error;
          setActivities(as=>[...as, data[0]]); 
        }
      } else {
        if (!formSub.subject_name.trim() || !formSub.subject_code.trim()) return;
        
        const subData = { ...formSub, type: itemType };
        if (editId) {
          const { data, error } = await supabase
            .from('subjects')
            .update(subData)
            .eq('id', editId)
            .select();
          
          if (error) throw error;
          setSubjects(ss => ss.map(s => s.id === editId ? data[0] : s));
        } else {
          const { data, error } = await supabase
            .from('subjects')
            .insert([subData])
            .select();
          
          if (error) throw error;
          setSubjects(ss => [...ss, data[0]]);
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving curriculum item:", err);
      if (err.code === "23505") {
        alert(`รหัสวิชา "${formSub.subject_code}" มีอยู่ในระบบแล้ว\nกรุณาใช้รหัสอื่น หรือเปลี่ยนรหัสให้ไม่ซ้ำกัน`);
      } else {
        alert("ไม่สามารถบันทึกข้อมูลได้: " + (err.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ"));
      }
    }
  };
  
  const performDelete = async () => {
    try {
      if (confirmDel?.type === "activity") {
        const { error } = await supabase
          .from('activities')
          .delete()
          .eq('id', confirmDel.id);
        if (error) throw error;
        setActivities(as=>as.filter(a=>a?.id!==confirmDel?.id));
      } else {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', confirmDel?.id);
        
        if (error) throw error;
        setSubjects(ss => ss.filter(s => s.id !== confirmDel?.id));
      }
      setConfirmDel(null);
    } catch (err) {
      console.error("Error deleting curriculum item:", err);
      alert("ไม่สามารถลบข้อมูลได้");
    }
  };

   const seedKindergarten = async () => {
    if (!filterLevel || !isKinder) return;
    if (!window.confirm(`ยืนยันการตั้งค่าเริ่มต้นสำหรับชั้น ${lvFull(filterLevel)}? วิชาเดิมในระดับนี้จะถูกลบและแทนที่ด้วย 5 ด้านพัฒนาการมาตรฐาน`)) return;

    try {
      setIsSeeding(true);
      await supabase.from('subjects').delete().eq('level_name', filterLevel);

      const items = [
        { code: "K_PHY", name: "ด้านร่างกาย", group: "พัฒนาการ" },
        { code: "K_EMO", name: "ด้านอารมณ์-จิตใจ", group: "พัฒนาการ" },
        { code: "K_SOC", name: "ด้านสังคม", group: "พัฒนาการ" },
        { code: "K_INT", name: "ด้านสติปัญญา", group: "พัฒนาการ" },
        { code: "K_SUM", name: "พัฒนาการ", group: "สรุปผล" },
      ];

      const newSubs = items.map(it => ({
        subject_code: `${it.code}_${filterLevel.replace(" ","")}`,
        subject_name: it.name,
        subject_group: it.group,
        credit: 0,
        hours: 0,
        type: "core",
        level_name: filterLevel
      }));

      const { data, error } = await supabase.from('subjects').insert(newSubs).select();
      if (error) throw error;

      setSubjects(prev => [
        ...prev.filter(s => s.level_name !== filterLevel),
        ...data
      ]);
      alert("ตั้งค่าพัฒนาการพื้นฐานเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการโหลดข้อมูลมาตรฐาน");
    } finally {
      setIsSeeding(false);
    }
  };

  const seedBasicSubjects = async () => {
    if (!filterLevel || isKinder) return;
    if (!window.confirm(`ต้องการใช้ AI ช่วยจัดเตรียมรายวิชาพื้นฐาน (8 กลุ่มสาระ) สำหรับชั้น ${lvFull(filterLevel)} ใช่หรือไม่?`)) return;

    try {
      setIsSeeding(true);
      const items = [
        { g: "ภาษาไทย", c: "ท", n: "ภาษาไทย" },
        { g: "คณิตศาสตร์", c: "ค", n: "คณิตศาสตร์" },
        { g: "วิทยาศาสตร์และเทคโนโลยี", c: "ว", n: "วิทยาศาสตร์และเทคโนโลยี" },
        { g: "วิทยาศาสตร์และเทคโนโลยี", c: "ว", n: "วิทยาการคำนวณ" },
        { g: "สังคมศึกษา ศาสนาฯ", c: "ส", n: "สังคมศึกษา ศาสนา และวัฒนธรรม" },
        { g: "สังคมศึกษา ศาสนาฯ", c: "ส", n: "ประวัติศาสตร์" },
        { g: "สุขศึกษาและพลศึกษา", c: "พ", n: "สุขศึกษา" },
        { g: "สุขศึกษาและพลศึกษา", c: "พ", n: "พลศึกษา" },
        { g: "ศิลปะ", c: "ศ", n: "ศิลปะ" },
        { g: "การงานอาชีพ", c: "ง", n: "การงานอาชีพ" },
        { g: "ภาษาต่างประเทศ", c: "อ", n: "ภาษาอังกฤษ" },
      ];

      // Manual collision check skip logic
      const newSubs = [];
      for(let i=0; i<items.length; i++){
        const it = items[i];
        const siblings = [...subjects, ...newSubs].filter(s => s.subject_group === it.g && s.level_name === filterLevel);
        const code = genSubjectCode(it.c, filterLevel, siblings.length + 1);
        
        // Skip if code already in DB subjects state
        if (subjects.find(s => s.subject_code === code)) continue;

        newSubs.push({
          subject_code: code,
          subject_name: it.n,
          subject_group: it.g,
          credit: 1,
          hours: 40,
          type: "core",
          level_name: filterLevel
        });
      }

      if (newSubs.length === 0) {
        alert("มีรายวิชาครอบคลุมอยู่แล้ว ไม่พบวิชาใหม่ที่ต้องเพิ่ม");
        return;
      }

      const { data, error } = await supabase.from('subjects').insert(newSubs).select();
      if (error) throw error;

      setSubjects(prev => [...prev, ...data]);
      alert(`AI จัดเตรียมรายวิชาพื้นฐาน ${data.length} วิชา สำเร็จ!`);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถรัน AI จัดเตรียมวิชาได้: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Dynamic Stats based on unique subject names across levels
  const currentSubs = filterLevel ? subjects.filter(s => normalize(s.level_name) === normalize(filterLevel)) : subjects;
  const currentActs = filterLevel ? activities.filter(a => normalize(a.level_name) === normalize(filterLevel)) : activities;

  const coreNames  = [...new Set(currentSubs.filter(s => s.type === "core").map(s => (s.subject_name||"").trim()))];
  const extraNames = [...new Set(currentSubs.filter(s => s.type === "extra").map(s => (s.subject_name||"").trim()))];
  const totalNames = [...new Set(currentSubs.map(s => (s.subject_name||"").trim()))];
  const actNames   = [...new Set(currentActs.map(a => (a.activity_type||"").trim()))];

  const coreCount  = coreNames.length;
  const extraCount = extraNames.length;
  const uniqueCount = totalNames.length;
  const actCount   = actNames.length;
  const levelList  = activeLevels;
  const LEVEL_COLORS = ["#059669","#2563eb","#d97706","#7c3aed","#db2777","#ea580c","#0891b2","#6366f1"];
  const lvColor = (lv) => LEVEL_COLORS[LEVEL_NAMES.indexOf(lv) % LEVEL_COLORS.length] ?? "#64748b";

  return (
    <>
      <style>{`
        .sj-modal-ov{position:fixed;inset:0;background:rgba(10,18,46,.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px);}
        .sj-modal{background:#fff;border-radius:22px;width:100%;max-width:580px;box-shadow:0 32px 80px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column;max-height:92vh;}
        .sj-confirm{background:#fff;border-radius:18px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.2);padding:28px;text-align:center;}
        .sj-code-input{font-family:monospace;font-size:15px;letter-spacing:1.5px;font-weight:700;}
        @keyframes sj-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .sj-animate{animation:sj-in .22s ease}
        .hours-quick-btn{padding:8px 12px;border-radius:8px;cursor:pointer;font-family:var(--font-d);font-size:14px;font-weight:800;border:2px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all .18s;min-width:56px;text-align:center;}
        .hours-quick-btn.on{border-color:#6366f1;background:#eef2ff;color:#4f46e5;}
        .adm-table { width:100%; border-collapse:collapse; background:#fff; min-width: 800px; }
        .adm-table th { background:#f8fafc; padding:12px 10px; text-align:left; font-size:12.5px; color:#64748b; font-weight:800; border-bottom:2px solid #f1f5f9; white-space:nowrap; }
        .adm-table td { padding:10px 10px; border-bottom:1px solid #f1f5f9; vertical-align:middle; transition: all .2s; font-size: 13.5px; }
        .adm-table tr:hover td { background:#fafbff; }
        .table-container { width: 100%; overflow-x: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>

      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1>
            {levelGroup === "kinder" ? (
              <><Baby size={22} style={{color:"#10b981"}}/> จัดการหลักสูตรปฐมวัย</>
            ) : (
              <><BookOpen size={22} style={{color:"#6366f1"}}/> จัดการหลักสูตรและรายวิชา</>
            )}
          </h1>
          <p>
            {levelGroup === "kinder" ? (
              <>ด้านพัฒนาการ {[...new Set(subjects.filter(s=>s.subject_group==="พัฒนาการ").map(s=>s.subject_name.trim()))].length} ด้าน · สรุปผล {[...new Set(subjects.filter(s=>s.subject_group==="สรุปผล").map(s=>s.subject_name.trim()))].length} รายการ · กิจกรรมเสริม {activities.length} รายการ</>
            ) : (
              <>รายวิชาพื้นฐาน {coreCount} วิชา · รายวิชาเพิ่มเติม {extraCount} วิชา · กิจกรรมพัฒนาผู้เรียน {activities.length} รายการ</>
            )}
          </p>
        </div>
        {filterLevel && (
          <div style={{display:"flex",gap:12}}>
            <button className="adm-btn" onClick={isKinder ? seedKindergarten : seedBasicSubjects} disabled={isSeeding}
              style={{
                background: "#fff",
                border: `2px solid ${isKinder ? "#10b981" : "#6366f1"}`,
                color: isKinder ? "#059669" : "#4f46e5",
                padding: "0 22px",
                borderRadius: 14,
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                transition: "all 0.2s"
              }}>
              {isSeeding ? "กำลังเตรียมตัว..." : <><Sparkles size={16} /> {isKinder ? "AI จัดชุดปฐมวัย" : "AI จัดเตรียมวิชาพื้นฐาน"}</>}
            </button>

            <button className="adm-btn adm-btn-primary" onClick={openAdd}
              style={{
                background: levelGroup === "kinder" ? "linear-gradient(135deg,#059669,#10b981)" : "linear-gradient(135deg,#4f46e5,#6366f1)",
                boxShadow: levelGroup === "kinder" ? "0 4px 16px rgba(16,185,129,.35)" : "0 4px 16px rgba(99,102,241,.35)",
                borderRadius: 14,
                padding: "0 22px"
              }}>
              <PlusCircle size={16}/> {levelGroup === "kinder" ? "เพิ่มผลพัฒนาการ" : "เพิ่มข้อมูลวิชา"}
            </button>
          </div>
        )}
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
                border:`2px solid ${levelGroup===g.k ? g.color : "#e2e8f0"}`,
                background: levelGroup===g.k ? g.bg : "#fff",
                boxShadow: levelGroup===g.k ? `0 4px 16px ${g.color}25` : "none",
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
      {filterLevel && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:14,marginBottom:22}}>
          {levelGroup === "kinder" ? (
            // Kindergarten Stats Cards
            [
              { label:"ด้านพัฒนาการ",  val:[...new Set(subjects.filter(s=>s.subject_group==="พัฒนาการ").map(s=>s.subject_name.trim()))].length, color:"#10b981", bg:"#f0fdf4", icon:"🌱" },
              { label:"สรุปผลประเมิน",  val:[...new Set(subjects.filter(s=>s.subject_group==="สรุปผล").map(s=>s.subject_name.trim()))].length, color:"#2563eb", bg:"#eff6ff", icon:"📋" },
              { label:"กิจกรรมเสริม",   val:activities.length, color:"#0891b2", bg:"#ecfeff", icon:"🎯" },
              { label:"ระดับอนุบาล",    val:levelList.filter(l=>l.startsWith("อนุบาล")).length, color:"#7c3aed", bg:"#f5f3ff", icon:"🎠" },
            ].map(s => (
              <div key={s.label} style={{background:"#fff",border:`1.5px solid ${s.color}20`,borderRadius:14,padding:"14px 16px",
                display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                <div style={{width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:11.5,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                </div>
              </div>
            ))
          ) : (
            // Basic Education Stats Cards
            [
              { label:"วิชาทั้งหมด",  val:uniqueCount,         color:"#6366f1", bg:"#eef2ff", icon:"📚" },
              { label:"วิชาพื้นฐาน",     val:coreCount,         color:"#2563eb", bg:"#eff6ff", icon:"📖" },
              { label:"วิชาเพิ่มเติม",   val:extraCount,        color:"#ec4899", bg:"#fdf2f8", icon:"✨" },
              { label:"ระดับชั้น",        val:levelList.length,  color:"#10b981", bg:"#f0fdf4", icon:"🏫" },
              { label:"กิจกรรมพัฒนาฯ",  val:actCount, color:"#0891b2", bg:"#ecfeff", icon:"🎯" },
            ].map(s => (
              <div key={s.label} style={{background:"#fff",border:`1.5px solid ${s.color}20`,borderRadius:14,padding:"14px 16px",
                display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                <div style={{width:40,height:40,borderRadius:11,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontFamily:"var(--font-d)",fontSize:22,fontWeight:900,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:11.5,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Filter ── */}
      <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <select className="adm-input adm-select" style={{width:220}} value={filterLevel} onChange={e=>setFilterLevel(e.target.value)}>
          <option value="">เลือกชั้นเรียน</option>
          {activeLevels.map(lv=><option key={lv} value={lv}>{lvFull(lv)}</option>)}
        </select>
        <div style={{position:"relative",flex:1,minWidth:180,maxWidth:320}}>
          <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input className="adm-input" style={{paddingLeft:36}} placeholder="ค้นหาชื่อวิชา รหัส หรือกิจกรรม..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      {/* ── Combined Render per Level ── */}
      {!filterLevel ? (
        <div style={{ textAlign:"center", padding:"70px 20px", background:"#fff", borderRadius:16, border:"1.5px dashed #cbd5e1" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><BookOpen size={30} style={{ color:"#94a3b8" }}/></div>
          <div style={{ fontFamily:"var(--font-d)", fontSize:18, fontWeight:800, color:"#1e293b", marginBottom:8 }}>กรุณาเลือกชั้นเรียน</div>
          <div style={{ fontSize:14, color:"#64748b" }}>โปรดเลือกชั้นเรียนจากกล่องตัวเลือกด้านบน เพื่อดูและจัดการรายวิชา</div>
        </div>
      ) : activeLevels.filter(lv => lv === filterLevel).map(level => {
        const getSJPriority = (name) => {
          if (!name) return 99;
          const n = name.toLowerCase();
          if (n.includes("ไทย")) return 1;
          if (n.includes("คณิต")) return 2;
          if (n.includes("วิทยา") || n.includes("วิทย์") || n.includes("เทคโนโลยี") || n.includes("คำนวณ") || n.includes("คอม")) return 3;
          if (n.includes("สังคม") || n.includes("ศาสนา") || n.includes("วัฒนธรรม")) return 4;
          if (n.includes("ประวัติ")) return 5;
          if (n.includes("สุขศึกษา") || n.includes("พลศึกษา")) return 6;
          if (n.includes("ศิลปะ") || n.includes("ดนตรี") || n.includes("นาฏศิลป์")) return 7;
          if (n.includes("การงาน")) return 8;
          if (n.includes("อังกฤษ") || n.includes("ต่างประเทศ")) return 9;
          return 99;
        };

        const subs = subjects
          .filter(s => normalize(s.level_name) === normalize(level) && (!search || s.subject_name.toLowerCase().includes(search.toLowerCase()) || s.subject_code.toLowerCase().includes(search.toLowerCase())))
          .sort((a, b) => {
             const pa = getSJPriority(a.subject_name);
             const pb = getSJPriority(b.subject_name);
             if (pa !== pb) return pa - pb;
             return (a.id || 0) - (b.id || 0);
          });
        
        const getActPriority = (name) => {
          if (!name) return 99;
          const n = name.toLowerCase();
          if (n.includes("แนะแนว")) return 1;
          if (n.includes("ลูกเสือ") || n.includes("เนตรนารี") || n.includes("บำเพ็ญ")) return 2;
          if (n.includes("ชุมนุม") || n.includes("ชมรม")) return 3;
          if (n.includes("สังคม") || n.includes("สาธารณ")) return 4;
          return 99;
        };

        const acts = activities
          .filter(a => normalize(a.level_name) === normalize(level) && (!search || (a.activity_type || "").toLowerCase().includes(search.toLowerCase())))
          .sort((a, b) => {
             const pa = getActPriority(a.activity_type);
             const pb = getActPriority(b.activity_type);
             if (pa !== pb) return pa - pb;
             return (a.activity_type || "").localeCompare(b.activity_type || "");
          });
        
        const lc = lvColor(level);
        const totalSubHrs = subs.reduce((s,x)=>s+(x.hours||0),0);
        const totalActHrs = acts.reduce((s,x)=>s+(x.hours||0),0);

        return (
          <div key={level} className="adm-card sj-animate" style={{marginBottom:32,overflow:"hidden",boxShadow:"0 6px 30px rgba(0,0,0,.03)",border:"none"}}>
            {/* Header */}
            <div style={{background:`linear-gradient(135deg,${lc},${lc}bb)`,padding:"16px 24px",
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
                {isKinder ? (
                  <button onClick={seedKindergarten} disabled={isSeeding} style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,border:"none",cursor:"pointer"}}>
                    {isSeeding ? "กำลังตั้งค่า..." : "🪄 ตั้งค่าผลพัฒนาการ (5 ด้าน)"}
                  </button>
                ) : (
                  <>
                    <span style={{background:"rgba(255,255,255,.15)",color:"#fff",padding:"6px 16px",borderRadius:20,fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                      <Clock size={13}/> เวลารวมทั้งหมด {totalSubHrs + totalActHrs} ชม./ปี
                    </span>
                    <span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"5px 14px",borderRadius:20,fontSize:12.5,fontWeight:700}}>
                      พื้นฐาน {subs.filter(s=>s.type==="core").length}
                    </span>
                    <span style={{background:"rgba(255,255,255,.2)",color:"#fff",padding:"5px 14px",borderRadius:20,fontSize:12.5,fontWeight:700}}>
                      เพิ่มเติม {subs.filter(s=>s.type==="extra").length}
                    </span>
                  </>
                )}
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
                <div className="table-container" style={{marginBottom:24, background: "#fff", borderRadius: 16, boxShadow: "0 0 0 1px #f1f5f9"}}>
                  <table className="adm-table">
                    <thead><tr>
                      <th style={{width:40}}>#</th>
                      <th>{isKinder ? "รหัส" : "รหัสวิชา"}</th>
                      <th>{isKinder ? "รายการประเมินพัฒนาการ" : "ชื่อรายวิชา"}</th>
                      <th>{isKinder ? "กลุ่มพัฒนาการ" : "กลุ่มสาระ"}</th>
                      {!isKinder && <th style={{textAlign:"center"}}>ประเภท</th>}
                      {!isKinder && <th style={{textAlign:"center"}}>หน่วยกิต</th>}
                      {!isKinder && <th style={{textAlign:"center"}}>เวลาเรียน</th>}
                      <th style={{textAlign:"center", width:100}}>จัดการ</th>
                    </tr></thead>
                    <tbody>
                      {subs.map((s,i)=>{
                        const gm = grpMeta(s.subject_group);
                        return (
                          <tr key={s?.id}>
                            <td style={{color:"#94a3b8",fontSize:12,textAlign:"center"}}>{i+1}</td>
                            <td><span style={{fontFamily:"monospace",fontWeight:800,fontSize:13.5,background:gm.bg,color:gm.color,padding:"4px 10px",borderRadius:7,border:`1px solid ${gm.border}`,whiteSpace:"nowrap"}}>{s.subject_code}</span></td>
                            <td><div style={{fontWeight:700,fontSize:14.5,color:"#1e293b",whiteSpace:"nowrap"}}>{s.subject_name}</div></td>
                            <td><span style={{display:"inline-block",background:gm.bg,color:gm.color,border:`1px solid ${gm.border}`,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{s.subject_group}</span></td>
                             {!isKinder && <td style={{textAlign:"center"}}>{s.type === "core" ? <span style={{display:"inline-block",background:"#eff6ff",color:"#2563eb",padding:"5px 14px",borderRadius:20,fontSize:11.5,fontWeight:700,whiteSpace:"nowrap"}}>พื้นฐาน</span> : <span style={{display:"inline-block",background:"#fdf2f8",color:"#db2777",padding:"5px 14px",borderRadius:20,fontSize:11.5,fontWeight:700,whiteSpace:"nowrap"}}>เพิ่มเติม</span>}</td>}
                             {!isKinder && <td style={{textAlign:"center"}}><span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:15,color:"#1e293b"}}>{s.credit}</span> <span style={{fontSize:11,color:"#94a3b8"}}>นก.</span></td>}
                             {!isKinder && <td style={{textAlign:"center"}}>
                               <div style={{display:"inline-flex",alignItems:"center",gap:4,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:20,padding:"4px 12px",whiteSpace:"nowrap"}}>
                                 <span style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:14,color:"#0369a1"}}>{s.hours??40}</span> <span style={{fontSize:11,color:"#7dd3fc"}}>ชม.</span>
                               </div>
                             </td>}
                            <td style={{textAlign:"center"}}>
                              <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                                <button onClick={()=>openEditSub(s)} style={{width:34,height:34,borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}} title="แก้ไข"><Pencil size={14}/></button>
                                <button onClick={()=>setConfirmDel({id:s?.id,type:"sub",name:s.subject_name,code:s.subject_code})} style={{width:34,height:34,borderRadius:10,border:"1.5px solid #fecaca",background:"#fef2f2",color:"#ef4444",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center"}} title="ลบ"><Trash2 size={14}/></button>
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
                      const at = ACTIVITY_TYPES.find(t=>t?.id===a.activity_type) ?? {color:"#64748b",bg:"#f8fafc",border:"#e2e8f0",label:a.activity_type};
                      const isPass = a.result==="ผ";
                      return (
                        <div key={a?.id} style={{display:"flex",alignItems:"center",padding:"14px 16px",borderRadius:14,border:`1px solid ${at.border}`,background:"#fff",boxShadow:"0 2px 10px rgba(0,0,0,.02)"}}>
                          <div style={{width:40,height:40,borderRadius:12,background:at.bg,color:at.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,marginRight:14,fontFamily:"var(--font-d)" }}>{i+1}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:700,fontSize:14.5,color:"#1e293b"}}>{at.label ?? a.activity_type}</div>
                            <div style={{fontSize:12,color:"#64748b",marginTop:5,display:"flex",alignItems:"center",gap:4}}>
                              <Clock size={12} style={{color:"#0891b2"}}/> {a.hours} ชม./ปี
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontWeight:700,fontSize:14,padding:"4px 12px",borderRadius:20,background:isPass?"#f0fdf4":"#fef2f2",color:isPass?"#16a34a":"#ef4444",border:`1px solid ${isPass?"#bbf7d0":"#fecaca"}`}}>{isPass?"ผ่าน":"ไม่ผ่าน"}</div>
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              <button onClick={()=>openEditAct(a)} style={{width:26,height:26,borderRadius:6,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Pencil size={11}/></button>
                              <button onClick={()=>setConfirmDel({id:a?.id,type:"activity",name:a.activity_type,code:""})} style={{width:26,height:26,borderRadius:6,border:"1px solid #fecaca",background:"#fef2f2",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Trash2 size={11}/></button>
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
        <div className="sj-modal-ov">
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
                    {k:"core", l: isKinder ? "🧠 ด้านพัฒนาการ" : "📖 วิชาพื้นฐาน", c:"#2563eb", bg:"#eff6ff"},
                    {k:"extra", l:"✨ วิชาเพิ่มเติม", c:"#db2777", bg:"#fdf2f8", hidden: isKinder},
                    {k:"activity", l: isKinder ? "🎯 กิจกรรม/ชุมนุม" : "🎯 กิจกรรมพัฒนาฯ", c:"#0891b2", bg:"#ecfeff"}
                  ].filter(t => !t.hidden).map(t => (
                    <button key={t.k} onClick={()=>{
                      setItemType(t.k);
                      if(t.k!=="activity") setFormSub(f=>({...f,type:t.k}));
                    }} style={{
                      flex:1,padding:"10px 4px",borderRadius:10,border:"none",fontFamily:"var(--font-d)",fontSize:13.5,fontWeight:800,cursor:"pointer",transition:"all .2s",
                      background:itemType===t.k?t.bg:"transparent",
                      color:itemType===t.k?t.c:"#64748b",
                      boxShadow:itemType===t.k?`0 4px 14px ${t.c}20`:"none"
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

              {itemType === "activity" ? (
                <>
                  <div>
                    <div className="adm-label">รหัสกิจกรรม (เช่น ก16901)</div>
                    <input className="adm-input" placeholder="ใส่รหัสกิจกรรมตามมาตรฐานโรงเรียน" 
                      value={formAct.activity_code} onChange={e=>setFormAct(f=>({...f,activity_code:e.target.value}))}
                      style={{fontFamily:"monospace",fontWeight:800,fontSize:15,color:"#0891b2"}} />
                  </div>
                  <div>
                    <div className="adm-label">ประเภทกิจกรรม <span style={{color:"#ef4444"}}>*</span></div>
                    <select className="adm-input adm-select" 
                      value={ACTIVITY_TYPES.find(t=>t.id===formAct.activity_type) ? formAct.activity_type : (formAct.activity_type ? "OTHER" : ACTIVITY_TYPES[0]?.id)} 
                      onChange={e=>{
                        const type = e.target.value;
                        if (type === "OTHER") {
                          setFormAct(f=>({...f, activity_type: "OTHER" }));
                        } else {
                          const refT = ACTIVITY_TYPES.find(x=>x?.id===type);
                          setFormAct(f=>({...f, activity_type:type, hours: refT?.hours ?? f.hours}));
                        }
                    }}>
                      {ACTIVITY_TYPES.map(t=><option key={t?.id} value={t?.id}>{t.label}</option>)}
                      <option value="OTHER">➕ อื่นๆ (ระบุชุมนุม/กิจกรรมพิเศษ)</option>
                    </select>
                  </div>

                  {(formAct.activity_type === "OTHER" || (formAct.activity_type && !ACTIVITY_TYPES.find(t=>t.id===formAct.activity_type))) && (
                    <div className="sj-animate">
                      <div className="adm-label">ชื่อกิจกรรม/ชุมนุม <span style={{color:"#ef4444"}}>*</span></div>
                      <input className="adm-input" placeholder="เช่น ชุมนุมภาษาไทย, บำเพ็ญประโยชน์" 
                        value={customActName} onChange={e=>setCustomActName(e.target.value)}
                        style={{borderColor:"#0891b2", background:"#f0fdfa"}} />
                      <div style={{fontSize:11,color:"#0d9488",marginTop:5}}>* กิจกรรมนี้จะแสดงผลในตารางเกรดตามชื่อที่ระบุ</div>
                    </div>
                  )}

                  <div>
                    <div className="adm-label"><Clock size={13} style={{color:"#0891b2",verticalAlign:"-1px",marginRight:4}}/> เวลาเรียน (ชม./ปี)</div>
                    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                      {[10,20,40,60,80].map(h=>(
                        <button key={h} className={`hours-quick-btn${formAct.hours===h?" on":""}`} onClick={()=>setFormAct(f=>({...f,hours:h}))}>{h}</button>
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
                         <button key={r.k} onClick={()=>setFormAct(f=>({...f,result:r.k}))} style={{flex:1,padding:12,borderRadius:10,border:`2px solid ${formAct.result===r.k?r.c:"#e2e8f0"}`,background:formAct.result===r.k?r.bg:"#fff",color:formAct.result===r.k?r.c:"#94a3b8",fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>{r.k} ({r.l})</button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Subject Form Portion */}
                  {!(formSub.level_name?.startsWith("อนุบาล")) && (
                    <div>
                      <div className="adm-label">กลุ่มสาระการเรียนรู้ <span style={{color:"#ef4444"}}>*</span></div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                        {SUBJECT_GROUPS.map(g=>(
                          <button key={g?.id} onClick={()=>{ setFormSub(f=>({...f,subject_group:g?.id})); setCodeManual(false); }} style={{
                            padding:"8px 10px",borderRadius:10,cursor:"pointer",fontFamily:"var(--font)",fontSize:12,fontWeight:700,
                            transition:"all .18s",border:`2px solid ${formSub.subject_group===g?.id?g.color:"#e2e8f0"}`,
                            background:formSub.subject_group===g?.id?g.bg:"#fff",color:formSub.subject_group===g?.id?g.color:"#64748b",
                            boxShadow:formSub.subject_group===g?.id?`0 3px 10px ${g.color}30`:"none"
                          }}>
                            <span style={{fontFamily:"monospace",fontWeight:900,marginRight:4}}>[{g.code}]</span>{g?.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                     <div className="adm-label" style={{display:"flex",justifyContent:"space-between"}}>
                        <span>{formSub.level_name?.startsWith("อนุบาล") ? "รหัส" : "รหัสวิชา"}</span>
                        <button onClick={()=>setCodeManual(x=>!x)} style={{fontSize:11,borderRadius:20,border:"1.5px solid #e2e8f0",background:codeManual?"#fffbeb":"#f1f5f9",color:codeManual?"#d97706":"#64748b",cursor:"pointer",fontWeight:700,padding:"2px 10px"}}>{codeManual?"✏️ แก้เองอยู่":"⚡ อัตโนมัติ"}</button>
                     </div>
                     <div style={{position:"relative"}}>
                       <input className="adm-input sj-code-input" style={{borderColor:codeManual?"#f59e0b":"#e2e8f0",background:codeManual?"#fff":"#f8fafc",color:grpMeta(formSub.subject_group).color}} value={formSub.subject_code} readOnly={!codeManual} onChange={e=>setFormSub(f=>({...f,subject_code:e.target.value}))}/>
                     </div>
                  </div>
                  <div>
                    <div className="adm-label">{formSub.level_name?.startsWith("อนุบาล") ? "รายการประเมินพัฒนาการ" : "ชื่อรายวิชา"} <span style={{color:"#ef4444"}}>*</span></div>
                    <input className="adm-input" placeholder={formSub.level_name?.startsWith("อนุบาล") ? "เช่น ด้านร่างกาย" : "เช่น ภาษาไทย"} value={formSub.subject_name} onChange={e=>setFormSub(f=>({...f,subject_name:e.target.value}))}/>
                  </div>
                  <div style={{display: formSub.level_name?.startsWith("อนุบาล") ? "none" : "grid", gridTemplateColumns:"1fr 1fr",gap:16}}>
                    <div>
                      <div className="adm-label">หน่วยกิต</div>
                      <div style={{display:"flex",gap:6}}>
                        {[1,2,3,4,5].map(cr => (
                          <button key={cr} onClick={() => setFormSub(f => ({ ...f, credit: cr, hours: {1:40,2:80,3:120,4:160,5:200}[cr] ?? f.hours }))}
                            style={{ flex:1,padding:"9px 4px",borderRadius:9,cursor:"pointer",fontFamily:"var(--font-d)",fontSize:14,fontWeight:800,transition:"all .2s",border:`2px solid ${formSub.credit===cr ? "#6366f1" : "#e2e8f0"}`,background:formSub.credit===cr ? "#eef2ff" : "#f8fafc",color:formSub.credit===cr?"#4f46e5":"#64748b" }}>
                            {cr}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="adm-label"><Clock size={13} style={{color:"#0891b2",verticalAlign:"-1px",marginRight:4}}/> เวลาเรียน (ชม.)</div>
                      <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        {[40,80,120,160,200].map(h=>(
                          <button key={h} className={`hours-quick-btn${formSub.hours===h?" on":""}`} onClick={()=>setFormSub(f=>({...f,hours:h,credit:{40:1,80:2,120:3,160:4,200:5}[h]??f.credit}))}>{h}</button>
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
        <div className="sj-modal-ov">
          <div className="sj-confirm">
            <div style={{width:64,height:64,borderRadius:20,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",boxShadow:"0 6px 20px rgba(239,68,68,.2)"}}>
              <Trash2 size={30} style={{color:"#ef4444"}}/>
            </div>
            <div style={{fontFamily:"var(--font-d)",fontSize:20,fontWeight:900,color:"#1e293b",marginBottom:8}}>ยืนยันการลบ</div>
            <div style={{fontSize:14,color:"#475569",marginBottom:24}}>
              คุณต้องการลบ <b>{confirmDel?.name}</b> ใช่หรือไม่?
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
}

export default SubjectManagePage;