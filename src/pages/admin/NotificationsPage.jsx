import React, { useState } from "react";
import { Bell, PlusCircle, Pencil, Trash2, Clock } from "lucide-react";
import { NOTIFICATIONS } from "../../data/mockData";

function NotificationsPage() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const TYPE_META = {
    success:{bg:"#f0fdf4",border:"#bbf7d0",dot:"#10b981",badge:"success"},
    warning:{bg:"#fffbeb",border:"#fde68a",dot:"#f59e0b",badge:"warning"},
    info:   {bg:"#eff6ff",border:"#bfdbfe",dot:"#3b82f6",badge:"info"},
  };
  return (
    <div>
      <div className="adm-ph">
        <div className="adm-ph-left">
          <h1><Bell size={22} style={{color:"#8b5cf6"}}/> จัดการการแจ้งเตือน</h1>
          <p>{notifs.length} การแจ้งเตือน</p>
        </div>
        <button className="adm-btn adm-btn-primary"><PlusCircle size={16}/> เพิ่มประกาศ</button>
      </div>
      <div className="adm-card">
        <div className="adm-card-body" style={{display:"flex",flexDirection:"column",gap:12}}>
          {notifs.map(n=>{
            const m = TYPE_META[n.type] ?? TYPE_META.info;
            return (
              <div key={n.id} style={{background:m.bg,border:`1.5px solid ${m.border}`,borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:14,transition:"box-shadow .2s"}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.08)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{width:10,height:10,borderRadius:"50%",background:m.dot,flexShrink:0,marginTop:5}}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--font-d)",fontSize:15,fontWeight:800,color:"#1e293b",marginBottom:4}}>{n.title}</div>
                  <div style={{fontSize:13.5,color:"#64748b",lineHeight:1.6}}>{n.message}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:12,color:"#94a3b8"}}>
                    <Clock size={12}/> {n.created_at}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span className={`adm-badge ${m.badge}`}>{n.type.toUpperCase()}</span>
                  <button className="icon-btn"><Pencil size={13}/></button>
                  <button className="icon-btn danger" onClick={()=>setNotifs(ns=>ns.filter(x=>x?.id!==n.id))}><Trash2 size={13}/></button>
                </div>
              </div>
            );
          })}
          {notifs.length===0 && (
            <div style={{textAlign:"center",padding:"52px 20px"}}>
              <Bell size={48} style={{color:"#e2e8f0",marginBottom:12}}/>
              <div style={{fontSize:16,fontWeight:700,color:"#94a3b8"}}>ไม่มีการแจ้งเตือน</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;