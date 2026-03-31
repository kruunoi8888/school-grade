import React, { useState } from "react";
import { User, Users, School, BookOpen, BadgeCheck, ChevronDown, TrendingUp } from "lucide-react";
import { ADMIN_NAV } from "../../data/mockData";
import { sortClassrooms } from "../../utils/studentParser";

function AdminHome({ setPage, user, users = [], classrooms = [], students = [], assignments = {}, subjects = [], schoolInfo, navItems, setSelectedImage }) {
  const cards = (navItems || ADMIN_NAV).filter(n => n.key !== "admin_home");
  const now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? "อรุณสวัสดิ์" : h < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  const isTeacher = user?.role === "teacher";
  const myRoomIds = isTeacher 
    ? Object.keys(assignments).filter(rid => (assignments[rid] || []).includes(user.id)).map(id => +id)
    : [];
  
  const myStudents = isTeacher ? students.filter(s => myRoomIds.includes(s.classroom_id)) : students;
  const myClassrooms = isTeacher ? classrooms.filter(c => myRoomIds.includes(c.id)) : classrooms;

  const STATS = [
    { 
      label: isTeacher ? "นักเรียนของฉัน" : "นักเรียนทั้งหมด", 
      value: myStudents.length, 
      sub: isTeacher ? "คน" : "ข้อมูลปัจจุบัน", 
      Icon: Users,       
      c: "#fff",    
      bg: "rgba(255,255,255,.12)" 
    },
    { 
      label: isTeacher ? "ชั้นเรียนที่รับผิดชอบ" : "ชั้นเรียน",        
      value: myClassrooms.length,   
      sub: isTeacher ? "ห้องเรียนที่ได้รับ" : "ห้องเรียนในระบบ", 
      Icon: School,      
      c: "#fde68a", 
      bg: "rgba(253,230,138,.15)" 
    },
    { 
      label: "ครูและบุคลากร",   
      value: users.length,  
      sub: "คน",         
      Icon: BadgeCheck,  
      c: "#a5f3fc", 
      bg: "rgba(165,243,252,.15)" 
    }
  ];

  const DESCS = {
    settings:        "จัดการข้อมูลพื้นฐานของโรงเรียน",
    classrooms:      "เพิ่ม แก้ไข ห้องเรียนและปีการศึกษา",
    teacher_assign:  "มอบหมายครูประจำชั้น 1 ชั้น หลายคน",
    students:        "ทะเบียนนักเรียนทั้งหมดในระบบ",
    subject_manage:  "จัดการรายวิชาพื้นฐานและวิชาเพิ่มเติม",
    grade_manage:    "บันทึกและแก้ไขคะแนนรายวิชา",
    national_exam:   "การจัดการผลสัมฤทธิ์ของผู้เรียน",
    notifications:   "ประกาศและแจ้งเตือนผู้ปกครอง",
    reports:         "พิมพ์รายงานผลการเรียนทุกรูปแบบ",
    academic_year:   "จัดการปีการศึกษาและโหมดประกาศผล",
    user_manage:     "จัดการสิทธิ์และรูปภาพผู้ใช้งาน",
  };

  return (
    <>
      <style>{`
        .home-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        .home-stat { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .grade-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        @media(max-width:1100px){ .home-grid, .grade-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:800px) { 
          .home-grid { grid-template-columns:repeat(2,1fr); } 
          .home-stat { grid-template-columns:repeat(2,1fr); } 
          .grade-grid { grid-template-columns:1fr; } 
        }
        @media(max-width:480px) { 
          .home-grid { grid-template-columns:1fr; } 
          .home-stat { grid-template-columns:1fr; } 
        }
        .mc { background:#fff; border-radius:18px; overflow:hidden; cursor:pointer;
              box-shadow:0 4px 20px rgba(0,0,0,.04); border:1.5px solid #f0f4f8;
              display:flex; flex-direction:column; transition:all .25s ease; text-align:left; }
        .mc:hover { transform:translateY(-6px); box-shadow:0 12px 30px rgba(0,0,0,.08); }
        .mc-top { padding:26px 24px 20px; flex:1; display:flex; flex-direction:column; gap:18px; }
        .mc-bot { padding:14px 24px; border-top:1.5px solid #f8fafc; display:flex; align-items:center; justify-content:space-between; background:#fafbff; }
        
        .hero-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          border-radius: 32px; padding: 56px 48px; margin-bottom: 40px;
          position: relative; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
        }
        .hero-blob { position:absolute; border-radius:50%; pointer-events:none; z-index:0; }
        .hero-content { position:relative; z-index:1; }
        
        .stat-glass {
          background: rgba(255, 255, 255, 0.04);
          borderRadius: 24px; padding: 24px 28px;
          backdropFilter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          boxShadow: 0 10px 30px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .stat-glass:hover { background: rgba(255, 255, 255, 0.07); transform: translateY(-3px); }
      `}</style>

      {/* ── Hero Banner ── */}
      <div className="hero-card">
        <div className="hero-blob" style={{width:500,height:500,background:"radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",top:-150,right:-150}}/>
        <div className="hero-blob" style={{width:350,height:350,background:"radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",bottom:-150,left:-50}}/>

        <div className="hero-content">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:48,flexWrap:"wrap",gap:24}}>
            <div style={{display:"flex",alignItems:"center",gap:28}}>
              <div style={{
                width:96,height:96,borderRadius:28,
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                background: (user?.profile_pic || user?.profilePic) ? "transparent" : "rgba(255,255,255,0.05)",
                backdropFilter:"blur(12px)", border: "1.5px solid rgba(255,255,255,0.1)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
                overflow: "hidden"
              }}>
                {(user?.profile_pic || user?.profilePic) ? <img src={user.profile_pic || user.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={44} style={{color:"#fff"}}/>}
              </div>
              <div>
                <div style={{fontSize:16,color:"rgba(255,255,255,0.5)",marginBottom:8,fontWeight:600}}>{greet} 👋</div>
                <div style={{fontFamily:"Kanit",fontSize:36,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-0.8px"}}>{user?.name}</div>
                <div style={{marginTop:14,display:"flex",alignItems:"center",gap:12}}>
                  <span style={{background:"rgba(99,102,241,0.25)", border:"1px solid rgba(99,102,241,0.3)", color:"#c7d2fe",padding:"5px 16px",borderRadius:14,fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1.2}}>{user?.role}</span>
                  <div style={{width:1.5,height:16,background:"rgba(255,255,255,0.15)"}}/>
                  <span style={{fontSize:14,color:"rgba(255,255,255,0.4)",fontWeight:600}}>{schoolInfo?.name}</span>
                </div>
              </div>
            </div>
            
            <div style={{textAlign:"right"}} className="hide-mobile">
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontWeight:800,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Academic System</div>
              <div style={{fontFamily:"Kanit",fontSize:24,fontWeight:900,color:"#fff",opacity:0.9}}>V2.5 PLATINUM</div>
              <div style={{height:4,width:80,background:"linear-gradient(90deg, #3b82f6, transparent)",borderRadius:2,marginTop:10,marginLeft:"auto"}}/>
            </div>
          </div>
 
          <div className="home-stat">
            {STATS.map(s => (
              <div key={s.label} className="stat-glass">
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                  <div style={{width:36,height:36,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <s.Icon size={18} style={{color:s.c}}/>
                  </div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontWeight:700}}>{s.label}</div>
                </div>
                <div style={{fontFamily:"Kanit",fontSize:38,fontWeight:900,color:s.c,lineHeight:1,marginBottom:8}}>{s.value}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontWeight:600}}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,padding:"0 8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:6,height:28,background:"linear-gradient(180deg,#3b82f6,#6366f1)",borderRadius:6}}/>
          <div style={{fontFamily:"Kanit",fontSize:22,fontWeight:900,color:"#1e293b",letterSpacing:"-.5px"}}>เมนูจัดการระบบ</div>
        </div>
        <div style={{fontSize:13,color:"#64748b",background:"#f1f5f9",padding:"6px 16px",borderRadius:24,fontWeight:700}}>{cards.length} รายการ</div>
      </div>

      {/* ── Menu cards ── */}
      <div className="home-grid" style={{marginBottom:60}}>
        {cards.map(item => (
          <button key={item.key} className="mc" onClick={() => setPage(item.key)}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 20px 40px ${item.color}25`;e.currentTarget.style.borderColor=`${item.color}40`}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.04)";e.currentTarget.style.borderColor="#f0f4f8"}}>
            <div style={{height:4,background:`linear-gradient(90deg,${item.color},${item.color}55)`}}/>
            <div className="mc-top">
              <div style={{width:56,height:56,borderRadius:16,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 6px 20px ${item.color}20`}}>
                <item.Icon size={28} style={{color:item.color}}/>
              </div>
              <div>
                <div style={{fontFamily:"Kanit",fontSize:17,fontWeight:800,color:"#1e293b",lineHeight:1.3,marginBottom:8}}>{item.label}</div>
                <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{DESCS[item.key]}</div>
              </div>
            </div>
            <div className="mc-bot">
              <span style={{fontSize:13,color:item.color,fontWeight:800}}>เปิดหน้าจัดการ</span>
              <div style={{width:28,height:28,borderRadius:10,background:item.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <ChevronDown size={14} style={{color:item.color,transform:"rotate(-90deg)"}}/>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{height:40}} />

      <div style={{height:40}} />
    </>
  );
}

export default AdminHome;