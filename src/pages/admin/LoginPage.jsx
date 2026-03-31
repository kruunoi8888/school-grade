import React, { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";

function LoginPage({ onLogin, onBack, loginWithUsers, users, schoolInfo }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!username || !password) { setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const acc = loginWithUsers(username, password);
      if (acc) { onLogin(acc); }
      else { setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน"); setLoading(false); }
    }, 900);
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#0f172a 100%)",
      position:"relative", overflow:"hidden", padding:20,
      fontFamily:"var(--font)"
    }}>
      {/* BG blobs */}
      {[
        {w:350,h:350,top:"-80px",right:"-80px",opacity:.07},
        {w:250,h:250,bottom:"-60px",left:"-60px",opacity:.06},
        {w:120,h:120,top:"38%",left:"6%",opacity:.05},
      ].map((s,i) => (
        <div key={i} style={{position:"absolute",width:s.w,height:s.h,top:s.top,bottom:s.bottom,left:s.left,right:s.right,borderRadius:"50%",background:"#fff",opacity:s.opacity,pointerEvents:"none"}} />
      ))}
      {/* Radial glows */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 25% 35%, rgba(59,130,246,.18) 0%,transparent 55%), radial-gradient(circle at 75% 70%, rgba(245,158,11,.1) 0%,transparent 55%)",pointerEvents:"none"}} />

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:500}}>
        {/* School header */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{
            width:100,height:100,
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 16px",fontSize:48,
            animation:"logoPulse 3s ease-in-out infinite"
          }}>
            {schoolInfo?.logo ? <img src={schoolInfo.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/> : "🏫"}
          </div>
          <div style={{fontFamily:"var(--font-d)",fontSize:26,fontWeight:900,color:"#fff",marginBottom:6,letterSpacing:"-0.5px"}}>{schoolInfo?.name ?? "โรงเรียนวัดสามัคคีธรรม"}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,.65)",lineHeight:1.5}}>{schoolInfo?.district ?? "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุพรรณบุรี เขต 3"}</div>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,.97)",borderRadius:22,padding:"36px 40px",
          boxShadow:"0 24px 64px rgba(0,0,0,.35)",backdropFilter:"blur(10px)"
        }}>
          <div style={{fontFamily:"var(--font-d)",fontSize:19,fontWeight:700,color:"#1e293b",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
            <LogIn size={18} style={{color:"#3b82f6"}} /> เข้าสู่ระบบ
          </div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:26}}>ระบบดูผลการเรียนออนไลน์ v2.0</div>

          {error && (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",color:"#dc2626",fontSize:13,marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Username */}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13.5,fontWeight:700,color:"#374151",marginBottom:6}}>ชื่อผู้ใช้</label>
            <div style={{position:"relative"}}>
              <User size={16} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}} />
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLogin()}
                placeholder="กรอกชื่อผู้ใช้"
                style={{width:"100%",height:48,padding:"0 14px 0 42px",border:"1.5px solid #e2e8f0",borderRadius:10,fontFamily:"var(--font)",fontSize:15,color:"#1e293b",background:"#f8fafc",outline:"none",transition:"border-color .2s,box-shadow .2s"}}
                onFocus={e => {e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,.1)"; e.target.style.background="#fff"}}
                onBlur={e => {e.target.style.borderColor="#e2e8f0"; e.target.style.boxShadow="none"; e.target.style.background="#f8fafc"}}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:13.5,fontWeight:700,color:"#374151",marginBottom:6}}>รหัสผ่าน</label>
            <div style={{position:"relative"}}>
              <Lock size={16} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}} />
              <input type={showPwd?"text":"password"} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLogin()}
                placeholder="กรอกรหัสผ่าน"
                style={{width:"100%",height:48,padding:"0 44px 0 42px",border:"1.5px solid #e2e8f0",borderRadius:10,fontFamily:"var(--font)",fontSize:15,color:"#1e293b",background:"#f8fafc",outline:"none",transition:"border-color .2s,box-shadow .2s"}}
                onFocus={e => {e.target.style.borderColor="#3b82f6"; e.target.style.boxShadow="0 0 0 3px rgba(59,130,246,.1)"; e.target.style.background="#fff"}}
                onBlur={e => {e.target.style.borderColor="#e2e8f0"; e.target.style.boxShadow="none"; e.target.style.background="#f8fafc"}}
              />
              <button onClick={() => setShowPwd(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16,padding:4}}>
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button onClick={handleLogin} disabled={loading} style={{
            width:"100%",height:50,background:"linear-gradient(135deg,#1e40af,#3b82f6)",
            color:"#fff",border:"none",borderRadius:12,fontFamily:"var(--font-d)",fontSize:16,fontWeight:600,
            cursor:loading?"not-allowed":"pointer",transition:"all .25s",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            boxShadow:"0 4px 16px rgba(59,130,246,.35)",opacity:loading?.8:1
          }}>
            {loading
              ? <><div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.4)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}></div>กำลังเข้าสู่ระบบ...</>
              : <><LogIn size={16} /> เข้าสู่ระบบ</>
            }
          </button>


          {/* Back button */}
          <button onClick={onBack} style={{
            width:"100%",marginTop:14,padding:"9px",background:"transparent",border:"none",
            color:"#94a3b8",fontFamily:"var(--font)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6
          }}>
            <ArrowLeft size={14} /> กลับสู่หน้าหลัก
          </button>
        </div>

        <div style={{textAlign:"center",marginTop:22,fontSize:12,color:"rgba(255,255,255,.3)"}}>
          © {new Date().getFullYear()} พัฒนาโดย ICT {schoolInfo?.name ?? "โรงเรียนวัดสามัคคีธรรม"}
        </div>
      </div>

      <style>{`
        @keyframes logoPulse { 0%,100%{box-shadow:0 12px 32px rgba(59,130,246,.45)} 50%{box-shadow:0 12px 48px rgba(59,130,246,.7)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

export default LoginPage;