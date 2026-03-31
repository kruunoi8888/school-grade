import React from "react";
import { Home, GraduationCap, LayoutGrid, Users, ClipboardList, Settings, Medal, LogIn, LogOut } from "lucide-react";

const MobileNav = ({ view, page, adminPage, setPage, setAdminPage, user, onGoAdmin, onGoPublic, onLogout }) => {
  
  const publicItems = [
    { id: "dashboard", label: "หน้าแรก", icon: Home, active: page === "dashboard" && view === "public" },
    { id: "grades", label: "ผลการเรียน", icon: GraduationCap, active: page === "grades" && view === "public" },
  ];

  if (user) {
    publicItems.push({ id: "admin", label: "จัดการ", icon: Settings, active: view === "admin", action: onGoAdmin, isSpecial: true });
    publicItems.push({ id: "logout", label: "ออก", icon: LogOut, active: false, action: onLogout, isLogout: true });
  } else {
    publicItems.push({ id: "login", label: "เจ้าหน้าที่", icon: LogIn, active: false, action: onGoAdmin, isSpecial: true });
  }

  const isTeacher = user?.role === "teacher";
  const adminItems = [
    { id: "admin_home",    label: "ภาพรวม",     icon: LayoutGrid,    active: adminPage === "admin_home" },
    { id: "students",      label: "นักเรียน",    icon: Users,         active: adminPage === "students" },
    { id: "grade_manage",  label: "บันทึกเกรด",  icon: ClipboardList, active: adminPage === "grade_manage" },
    { id: "national_exam", label: "ผลสอบชาติ",   icon: Medal,         active: adminPage === "national_exam" },
    { id: "settings",      label: "ตั้งค่า",      icon: Settings,      active: adminPage === "settings" },
  ].filter(item => {
    if (!isTeacher) return true;
    return ["admin_home", "students", "grade_manage"].includes(item.id);
  });

  const items = view === "admin" ? adminItems : publicItems;

  const handleClick = (item) => {
    if (item.action) {
      item.action();
    } else if (view === "admin") {
      setAdminPage(item.id);
    } else {
      setPage(item.id);
    }
  };

  return (
    <div className="mobile-nav show-mobile">
      <div className="mobile-nav-container">
        {items.map((item) => {
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${item.active ? "active" : ""}`}
              onClick={() => handleClick(item)}
            >
              {item.id === "grades" ? (
                <div 
                  className="animate-pulse-slow"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    width: 44, height: 32, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", marginBottom: 4, 
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                    position: "relative"
                  }}
                >
                  <item.icon size={20} />
                  <span style={{
                    position: "absolute", top: -2, right: -2,
                    display: "block", width: 8, height: 8,
                    borderRadius: "50%", background: "#fff",
                    boxShadow: "0 0 5px rgba(255,255,255,0.8)"
                  }}></span>
                </div>
              ) : item.isSpecial ? (
                <div style={{
                  background: item.id === "admin" ? "linear-gradient(135deg,#2563eb,#4f46e5)" : "linear-gradient(135deg,#1e40af,#3b82f6)",
                  width: 38, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", marginBottom: 4, boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
                }}>
                  <item.icon size={18} />
                </div>
              ) : item.isLogout ? (
                <div style={{
                  background: "linear-gradient(135deg,#ef4444,#f87171)",
                  width: 38, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", marginBottom: 4, boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
                }}>
                  <item.icon size={18} />
                </div>
              ) : (
                <item.icon size={22} className="mobile-nav-icon" />
              )}
              <span className="mobile-nav-label" style={
                item.id === "grades" ? {color: "#d97706", fontWeight: 800} : 
                item.isLogout ? {color:"#ef4444",fontWeight:700} : {}
              }>{item.label}</span>
            </button>
          );
        })}
        {view === "admin" && (
          <button className="mobile-nav-item" onClick={onGoPublic}>
            <Home size={22} className="mobile-nav-icon" />
            <span className="mobile-nav-label">หน้าเว็บ</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileNav;
