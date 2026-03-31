import React, { useState } from "react";
import "./styles/app.css";

// Base Data
import { ADMIN_NAV } from "./data/mockData";

// Components
import PublicNav from "./components/PublicNav";
import MobileNav from "./components/MobileNav";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

// Public Pages
import Dashboard from "./pages/public/Dashboard";
import GradesPage from "./pages/public/GradesPage";

// Admin Pages
import LoginPage from "./pages/admin/LoginPage";
import AdminHome from "./pages/admin/AdminHome";
import SettingsPage from "./pages/admin/SettingsPage";
import AcademicYearPage from "./pages/admin/AcademicYearPage";
import UserManagePage from "./pages/admin/UserManagePage";
import ClassroomsPage from "./pages/admin/ClassroomsPage";
import TeacherAssignmentPage from "./pages/admin/TeacherAssignmentPage";
import StudentsPage from "./pages/admin/StudentsPage";
import SubjectManagePage from "./pages/admin/SubjectManagePage";
import GradeManagePage from "./pages/admin/GradeManagePage";
import NationalExamPage from "./pages/admin/NationalExamPage";
import ReportsPage from "./pages/admin/ReportsPage";

import { supabase } from "./lib/supabase";

export default function App() {
  const [view, setView]           = useState(() => localStorage.getItem("grade_view") || "public");
  const [page, setPage]           = useState("dashboard");
  const [adminPage, setAdminPage] = useState(() => localStorage.getItem("grade_adminPage") || "admin_home");
  const [user, setUser]           = useState(() => {
    const saved = localStorage.getItem("grade_user");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [classrooms, setClassrooms] = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [students,   setStudents]   = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({
    name: "กำลังโหลด...",
    district: "",
    academic_year: "",
    academic_term: ""
  });
  const [users,      setUsers]      = useState([]);
  const [assignments, setAssignments] = useState({});
  const [nationalExams, setNationalExams] = useState({ RT: [], NT: [], ONET: [], ONET_M3: [], ONET_M6: [] });
  const [examVisibility, setExamVisibility] = useState({ RT:true, READING_P2:true, NT:true, ONET:true, ONET_M3:true, ONET_M6:true });
  const [activities, setActivities] = useState([]); // Shared state for activities
  const [selectedImage, setSelectedImage] = useState(null);

  const currentAcademicYear = academicYears.find(y => y.status === "current") ?? academicYears[0] ?? { year: 2568, semester: 1 };

  // Persistence sync
  React.useEffect(() => {
    localStorage.setItem("grade_view", view);
    localStorage.setItem("grade_adminPage", adminPage);
  }, [view, adminPage]);

  // Fetch Initial Data from Supabase
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Parallel fetch for core data with optimized column selection
        const [
          { data: sInfo },
          { data: ayData },
          { data: cData },
          { data: uData },
          { data: nData },
          { data: stData },
          { data: sbData },
          { data: taData },
          { data: neData },
          { data: appSetData },
          { data: acData }
        ] = await Promise.all([
          supabase.from('school_info').select('*').single(),
          supabase.from('academic_years').select('*').order('year', { ascending: false }),
          supabase.from('classrooms').select('*'),
          supabase.from('users').select('*'),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('students').select('*'),
          supabase.from('subjects').select('*'),
          supabase.from('teacher_assignments').select('*'),
          supabase.from('national_exams').select('*'),
          supabase.from('app_settings').select('*').eq('key', 'exam_visibility').single(),
          supabase.from('activities').select('*')
        ]);
        
        if (sInfo) setSchoolInfo(sInfo);
        if (ayData) setAcademicYears(ayData || []);
        if (cData) setClassrooms(cData || []);
        if (uData) {
          setUsers(uData || []);
          // Sync current session with DB data to ensure profile pics/data are fresh
          const savedUser = JSON.parse(localStorage.getItem("grade_user") || "null");
          if (savedUser) {
            const freshUser = uData.find(u => u.id === savedUser.id);
            if (freshUser) {
              setUser(freshUser);
              localStorage.setItem("grade_user", JSON.stringify(freshUser));
            }
          }
        }
        if (nData) setNotifications(nData || []);
        if (stData) setStudents(stData || []);
        if (sbData) setSubjects(sbData || []);
        
        if (taData) {
          const formatted = {};
          taData.forEach(item => {
            if (!formatted[item.classroom_id]) formatted[item.classroom_id] = [];
            formatted[item.classroom_id].push(item.user_id);
          });
          setAssignments(formatted);
        }

        if (neData) {
          const examsMap = { RT: [], READING_P2: { total:0, fluent:0, dysfluent:0, illiterate:0 }, NT: [], ONET: [], ONET_M3: [], ONET_M6: [] };
          neData.forEach(row => {
            if (examsMap.hasOwnProperty(row.exam_type)) {
              examsMap[row.exam_type] = row.data;
            }
          });
          setNationalExams(examsMap);
        }

        if (appSetData && appSetData.value) {
          setExamVisibility(appSetData.value);
        }

        if (acData) setActivities(acData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const goLogin    = () => setView("login");
  const handleLogin = (acc) => {
    localStorage.setItem("grade_user", JSON.stringify(acc));
    localStorage.setItem("grade_view", "admin");
    localStorage.setItem("grade_adminPage", "admin_home");
    setUser(acc); setView("admin"); setAdminPage("admin_home"); 
  };
  const handleLogout = () => {
    localStorage.removeItem("grade_user");
    localStorage.removeItem("grade_view");
    localStorage.removeItem("grade_adminPage");
    setUser(null); setView("public"); setPage("dashboard"); 
  };

  if (isLoading) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column", 
        alignItems: "center", justifyContent: "center", 
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        gap: "20px"
      }}>
        <div style={{
          width: 60, height: 60, border: "4px solid #e2e8f0", 
          borderTopColor: "#3b82f6", borderRadius: "50%", 
          animation: "spin 1s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontFamily: "var(--font-d)", fontWeight: 700, color: "#475569", fontSize: 18 }}>
          กำลังเชื่อมต่อฐานข้อมูล...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-root-wrapper">
        {view === "public" && (
          <div className="app-container mobile-nav-container-wrapper" style={{display:"flex", flexDirection:"column", minHeight:"100vh"}}>
            <PublicNav
              page={page} setPage={setPage}
              onLoginClick={goLogin} user={user}
              onGoAdmin={() => { setView(user ? "admin" : "login"); if (user) setAdminPage("admin_home"); }}
              onLogout={handleLogout}
              schoolInfo={schoolInfo}
            />
            <main className="content" style={{maxWidth:1140,margin:"0 auto",padding:"0 16px", flex:1, width:"100%"}}>
              {page === "dashboard" && (
                <Dashboard 
                  year={schoolInfo.academic_year} 
                  schoolInfo={schoolInfo} 
                  nationalExams={nationalExams} 
                  examVisibility={examVisibility}
                  classrooms={classrooms}
                  students={students}
                  users={users}
                  assignments={assignments}
                  notifications={notifications}
                  setSelectedImage={setSelectedImage}
                />
              )}
              {page === "grades" && <GradesPage schoolInfo={schoolInfo} currentAcademicYear={currentAcademicYear} academicYears={academicYears} students={students} subjects={subjects || []} classrooms={classrooms || []} activities={activities || []} />}
            </main>
            <Footer schoolInfo={schoolInfo} />
            <MobileNav 
              view={view} page={page} adminPage={adminPage} 
              setPage={setPage} setAdminPage={setAdminPage} 
              user={user} onGoAdmin={() => { setView(user ? "admin" : "login"); if (user) setAdminPage("admin_home"); }} 
              onGoPublic={() => { setView("public"); setPage("dashboard"); }} 
              onLogout={handleLogout}
            />
          </div>
        )}

        {view === "login" && (
          <LoginPage
            onLogin={handleLogin}
            onBack={() => { setView("public"); setPage("dashboard"); }}
            loginWithUsers={(u,p) => users.find(x => x.username===u && x.password===p && x.active)}
            users={users}
            schoolInfo={schoolInfo}
          />
        )}

        {view === "admin" && (
          <div className="admin-layout-wrapper mobile-nav-container-wrapper" style={{background:"#f0f4f8",minHeight:"100vh"}}>
            <div className="admin-container" style={{maxWidth:1140,margin:"0 auto",display:"flex",minHeight:"100vh",position:"relative",boxShadow:"0 0 40px rgba(0,0,0,.08)",background:"#fff"}}>
              <div className="sidebar hide-mobile" style={{
                width:260, background:"#334155", display:"flex", flexDirection:"column",
                position:"sticky", top:0, height:"100vh", overflowY:"auto", flexShrink:0, zIndex:20
              }}>
                 <div style={{display:"flex",alignItems:"center",gap:14,padding:"22px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
                    {schoolInfo.logo ? <img src={schoolInfo.logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/> : "🏫"}
                  </div>
                  <div>
                    <div style={{fontFamily:"var(--font-d)",fontWeight:800,fontSize:14,color:"#fff",lineHeight:1.3}}>{schoolInfo.name}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{schoolInfo.district || "สังกัด สพฐ."}</div>
                  </div>
                </div>
                <nav style={{flex:1,padding:"16px 12px"}}>
                  <ul style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:4}}>
                    {(user?.role === "teacher" ? ADMIN_NAV.filter(n => ["admin_home", "students", "grade_manage", "reports"].includes(n.key)) : ADMIN_NAV).map(item => (
                      <li key={item.key}>
                        <button onClick={() => setAdminPage(item.key)} style={{
                          display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                          borderRadius:12,cursor:"pointer",transition:"all .2s",
                          width:"100%",border:"none",fontFamily:"var(--font-d)",fontSize:14,fontWeight:600,
                          background: adminPage === item.key ? "#1e293b" : "transparent",
                          color: adminPage === item.key ? "#fff" : "#94a3b8",
                          borderLeft: adminPage === item.key ? `4px solid ${item.color}` : "4px solid transparent"
                        }}>
                          <item.Icon size={18} style={{color: adminPage === item.key ? item.color : "#64748b",flexShrink:0}}/>
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div style={{padding:"14px 16px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
                   <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{
                      width: 38, height: 38, background: "linear-gradient(135deg, #6366f1, #a855f7)", 
                      borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", 
                      color: "#fff", fontSize: 18, flexShrink: 0, overflow: "hidden", 
                      border: "1.5px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                    }}>
                      {(user?.profile_pic || user?.profilePic) ? (
                        <img src={user.profile_pic || user.profilePic} alt="" style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                      ) : (
                        <div style={{fontWeight: 800}}>{user?.name?.[0] || "?"}</div>
                      )}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{user?.name}</div>
                      <div style={{fontSize: 11, color: "#94a3b8", fontWeight: 600}}>{user?.role?.toUpperCase()}</div>
                    </div>
                    <button onClick={handleLogout} style={{background:"rgba(255,255,255,.08)",border:"none",color:"#94a3b8",width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>↩</button>
                  </div>
                </div>
              </div>
              
              <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,background:"#f8fafc"}}>
                <div className="admin-topbar hide-mobile" style={{background:"rgba(255,255,255,0.9)",backdropFilter:"blur(8px)",borderBottom:"1px solid #f1f5f9",padding:"0 32px",height:68,display:"flex",alignItems:"center",justifyContent:"center",position:"sticky",top:0,zIndex:50}}>
                  <button onClick={() => { setView("public"); setPage("dashboard"); }} style={{padding:"8px 24px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontFamily:"var(--font-d)",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                    ← แผงควบคุมหน้าเว็บไซต์ (Public Site)
                  </button>
                </div>
                <main style={{flex:1,padding:24}}>
                  <ErrorBoundary key={adminPage}>
                    {(() => {
                      switch(adminPage) {
                        case "admin_home":    return <AdminHome setPage={setAdminPage} user={user} users={users} classrooms={classrooms} students={students} assignments={assignments} subjects={subjects || []} schoolInfo={schoolInfo} navItems={(user?.role === "teacher" ? ADMIN_NAV.filter(n => ["admin_home", "students", "grade_manage", "reports"].includes(n.key)) : ADMIN_NAV)} setSelectedImage={setSelectedImage} />;
                        case "settings":      return <SettingsPage schoolInfo={schoolInfo} setSchoolInfo={setSchoolInfo} notifications={notifications} setNotifications={setNotifications} />;
                        case "academic_year": return <AcademicYearPage academicYears={academicYears} setAcademicYears={setAcademicYears} />;
                        case "user_manage":   return <UserManagePage users={users} setUsers={setUsers} currentUser={user} setCurrentUser={setUser} />;
                        case "classrooms":    return <ClassroomsPage classrooms={classrooms} setClassrooms={setClassrooms} assignments={assignments} setAssignments={setAssignments} students={students} />;
                        case "teacher_assign":return <TeacherAssignmentPage users={users} classrooms={classrooms} assignments={assignments} setAssignments={setAssignments} students={students} setAdminPage={setAdminPage} />;
                        case "students":      return <StudentsPage classrooms={classrooms} students={students} setStudents={setStudents} users={users} assignments={assignments} user={user} />;
                        case "subject_manage":return <SubjectManagePage subjects={subjects} setSubjects={setSubjects} classrooms={classrooms} students={students} activities={activities} setActivities={setActivities} />;
                        case "grade_manage":  return <GradeManagePage classrooms={classrooms} subjects={subjects} students={students} activities={activities} currentAcademicYear={currentAcademicYear} setAdminPage={setAdminPage} user={user} assignments={assignments} />;
                        case "national_exam": return <NationalExamPage nationalExams={nationalExams} setNationalExams={setNationalExams} examVisibility={examVisibility} setExamVisibility={setExamVisibility} />;
                        case "reports":       return <ReportsPage schoolInfo={schoolInfo} currentAcademicYear={currentAcademicYear} academicYears={academicYears} classrooms={classrooms} students={students} subjects={subjects} users={users} assignments={assignments} user={user} activities={activities} />;
                        default:              return <AdminHome setPage={setAdminPage} user={user} users={users} classrooms={classrooms} students={students} assignments={assignments} schoolInfo={schoolInfo} navItems={ADMIN_NAV} setSelectedImage={setSelectedImage} />;
                      }
                    })()}
                  </ErrorBoundary>
                </main>
                <Footer schoolInfo={schoolInfo} isAdmin={true} />
              </div>
            </div>
            <MobileNav 
              view={view} page={page} adminPage={adminPage} 
              setPage={setPage} setAdminPage={setAdminPage} 
              user={user} onGoAdmin={() => setAdminPage("admin_home")} 
              onGoPublic={() => { setView("public"); setPage("dashboard"); }} 
              onLogout={handleLogout}
            />
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position:"fixed", top:0, left:0, width:"100vw", height:"100vh", 
            background:"rgba(2, 6, 23, 0.98)", backdropFilter:"blur(20px)", 
            display:"flex", alignItems:"center", justifyContent:"center", 
            zIndex:2147483647, cursor:"zoom-out"
          }}
        >
          <div style={{position:"relative", display:"flex", flexDirection:"column", alignItems:"center", gap:30}}>
            <img 
              src={selectedImage} 
              alt="Profile Full" 
              style={{
                maxWidth:"90vw", maxHeight:"80vh", boxShadow:"0 40px 100px -20px rgba(0,0,0,0.8)",
                borderRadius:40, border:"6px solid rgba(255,255,255,0.15)", background:"#1e293b",
                animation: "modalZoom 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            />
            <div style={{
              background:"rgba(255,255,255,0.1)", padding:"16px 32px", borderRadius:60, 
              color:"#fff", fontSize:18, fontWeight:800, border:"1px solid rgba(255,255,255,0.1)",
              backdropFilter:"blur(10px)"
            }}>
              คลิกเพื่อปิด ✕
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalZoom {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
