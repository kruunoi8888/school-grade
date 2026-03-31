import React, { useState } from "react";
import { Home, GraduationCap, LogIn, LogOut, User, Settings } from "lucide-react";

function PublicNav({ page, setPage, onLoginClick, user, onGoAdmin, onLogout, schoolInfo }) {
  return (
    <header style={{
      background:"#fff", borderBottom:"1px solid #e2e8f0",
      position:"sticky", top:0, zIndex:100,
      boxShadow:"0 2px 16px rgba(0,0,0,.07)"
    }}>
      <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",gap:0}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginRight:"auto"}}>
          <div style={{width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
            {schoolInfo?.logo ? <img src={schoolInfo.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/> : "🏫"}
          </div>
          <div className="hide-mobile">
            <div style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:14.5,color:"#1e293b",lineHeight:1.2}}>{schoolInfo?.name ?? "โรงเรียนวัดสามัคคีธรรม"}</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>{schoolInfo?.district ?? "สพป.สุพรรณบุรี เขต 3"}</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hide-mobile" style={{display:"flex",alignItems:"center",gap:2}}>
          {[
            {key:"dashboard", label:"หน้าแรก",        Icon:Home,          active:"#eff6ff", ac:"#1e40af", className:""},
            {key:"grades",    label:"เช็คผลการเรียน", Icon:GraduationCap, active:"#fff7ed", ac:"#d97706", className:"animate-pulse-slow btn-nav-highlight"},
          ].map(n=>(
            <button key={n.key} onClick={()=>setPage(n.key)} className={n.className} style={{
              display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:9,
              background: page===n.key ? n.active : "transparent",
              color: page===n.key ? n.ac : "#64748b",
              border:"none",fontFamily:"var(--font)",fontSize:14,fontWeight:600,cursor:"pointer",transition:"all .2s"
            }}>
              <n.Icon size={15}/> {n.label}
              {n.key === "grades" && <span className="nav-badge-new">NEW</span>}
            </button>
          ))}
        </nav>

        {/* User area (stays visible or partially visible) */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:12}}>
          {user ? (
            <>
              <div className="hide-mobile" style={{
                display:"flex",alignItems:"center",gap:8,
                background:"#f1f5f9",border:"1.5px solid #e2e8f0",
                borderRadius:24,padding:"5px 14px 5px 6px",
              }}>
                <div style={{
                  width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background: (user.profile_pic || user.profilePic) ? "transparent" : "linear-gradient(135deg,#2563eb,#6366f1)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:"#fff",boxShadow: (user.profile_pic || user.profilePic) ? "none" : "0 2px 8px rgba(99,102,241,.3)",
                  overflow:"hidden"
                }}>
                  {(user.profile_pic || user.profilePic) ? <img src={user.profile_pic || user.profilePic} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={17}/>}
                </div>
                <div style={{display:"flex",flexDirection:"column",lineHeight:1.1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",whiteSpace:"nowrap"}}>{user.name}</div>
                  <div style={{fontSize:10,color:"#64748b",fontWeight:600}}>{user.role === 'admin' ? 'Administrator' : 'Teacher'}</div>
                </div>
              </div>

              <button
                onClick={onGoAdmin}
                className="hide-mobile"
                title="จัดการระบบ Admin"
                style={{
                  width:36,height:36,borderRadius:10,
                  border:"1.5px solid #e2e8f0",background:"#fff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",transition:"all .2s",color:"#64748b",flexShrink:0
                }}
              >
                <Settings size={16}/>
              </button>

              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                style={{
                  width:36,height:36,borderRadius:10,
                  border:"1.5px solid #fecaca",background:"#fef2f2",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:"pointer",transition:"all .2s",color:"#ef4444",flexShrink:0
                }}
              >
                <LogOut size={16}/>
              </button>
            </>
          ) : (
            <button onClick={onLoginClick} style={{
              display:"flex",alignItems:"center",gap:7,padding:"9px 20px",borderRadius:10,
              background:"linear-gradient(135deg,#1e40af,#3b82f6)",
              color:"#fff",border:"none",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,
              cursor:"pointer",transition:"all .2s",boxShadow:"0 4px 14px rgba(37,99,235,.3)",marginLeft:8
            }}>
              <LogIn size={14}/> <span className="hide-mobile">เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default PublicNav;