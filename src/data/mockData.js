// ===== MOCK DATA =====
// Auto-extracted from App.jsx
import { LayoutGrid, Settings, Users, School, BookMarked, BookOpen, ClipboardList, Medal, Printer, Calendar } from "lucide-react";

const CLASSROOMS = [
  { id:1,  level:1, room:1, room_name:"ป.1/1", level_name:"ป.1", teacher_name:"นางสาวสมหญิง ใจดี" },
  { id:2,  level:2, room:1, room_name:"ป.2/1", level_name:"ป.2", teacher_name:"นางมาลี รักเรียน"    },
  { id:3,  level:3, room:1, room_name:"ป.3/1", level_name:"ป.3", teacher_name:"นายสมชาย ขยันดี"    },
  { id:4,  level:4, room:1, room_name:"ป.4/1", level_name:"ป.4", teacher_name:"นางสาวนภา สุขใจ"    },
  { id:5,  level:5, room:1, room_name:"ป.5/1", level_name:"ป.5", teacher_name:"นายวิชัย เก่งกล้า"  },
  { id:6,  level:6, room:1, room_name:"ป.6/1", level_name:"ป.6", teacher_name:"นางสาวปราณี มานะ"   },
  { id:7,  level:7, room:1, room_name:"ม.1/1", level_name:"ม.1", teacher_name:"นายประสิทธิ์ เชี่ยวชาญ" },
  { id:8,  level:8, room:1, room_name:"ม.2/1", level_name:"ม.2", teacher_name:"นางสาวกัญญา ฉลาดดี"  },
  { id:9,  level:9, room:1, room_name:"ม.3/1", level_name:"ม.3", teacher_name:"นายสุรชัย มั่นคง"    },
  { id:10, level:10, room:1, room_name:"ม.4/1", level_name:"ม.4", teacher_name:"นางวิภา รุ่งเรือง"   },
  { id:11, level:11, room:1, room_name:"ม.5/1", level_name:"ม.5", teacher_name:"นายชัวาล ก้าวหน้า"  },
  { id:12, level:12, room:1, room_name:"ม.6/1", level_name:"ม.6", teacher_name:"นางสาวพิมพ์พร สำเร็จ"},
];

const STUDENTS = [
  { id:1, student_id:"67000001", prefix:"เด็กชาย", first_name:"กิตติพงษ์", last_name:"สุขสม",    gender:"ชาย",  classroom_id:1, room_name:"ป.1/1", teacher_name:"นางสาวสมหญิง ใจดี" },
  { id:2, student_id:"67000002", prefix:"เด็กหญิง",first_name:"พิมพ์ชนก",  last_name:"รักดี",    gender:"หญิง", classroom_id:1, room_name:"ป.1/1", teacher_name:"นางสาวสมหญิง ใจดี" },
  { id:3, student_id:"67000003", prefix:"เด็กชาย", first_name:"ธนกร",      last_name:"มั่งมี",   gender:"ชาย",  classroom_id:2, room_name:"ป.2/1", teacher_name:"นางมาลี รักเรียน" },
  { id:4, student_id:"67000004", prefix:"เด็กหญิง",first_name:"อรอนงค์",   last_name:"งามดี",    gender:"หญิง", classroom_id:2, room_name:"ป.2/1", teacher_name:"นางมาลี รักเรียน" },
  { id:5, student_id:"67000005", prefix:"เด็กชาย", first_name:"พัชลพล",    last_name:"ใจกล้า",   gender:"ชาย",  classroom_id:3, room_name:"ป.3/1", teacher_name:"นายสมชาย ขยันดี" },
  { id:6, student_id:"67000006", prefix:"เด็กหญิง",first_name:"ณัฐธิดา",   last_name:"เพชรงาม",  gender:"หญิง", classroom_id:4, room_name:"ป.4/1", teacher_name:"นางสาวนภา สุขใจ" },
  { id:7, student_id:"67000007", prefix:"เด็กชาย", first_name:"ชนาธิป",    last_name:"ดีงาม",    gender:"ชาย",  classroom_id:5, room_name:"ป.5/1", teacher_name:"นายวิชัย เก่งกล้า" },
  { id:8, student_id:"67000008", prefix:"เด็กหญิง",first_name:"ศิริลักษณ์",last_name:"สวยงาม",   gender:"หญิง", classroom_id:6, room_name:"ป.6/1", teacher_name:"นางสาวปราณี มานะ" },
  { id:9, student_id:"67000009", prefix:"เด็กชาย", first_name:"กิตติพงษ์", last_name:"ขยันเรียน", gender:"ชาย",  classroom_id:1, room_name:"ป.1/1", teacher_name:"นางสาวสมหญิง ใจดี" },
];

const SUBJECTS_INIT = [
  { id:1, subject_code:"ท11101", subject_name:"ภาษาไทย",            subject_group:"ภาษาไทย",                  credit: 5, hours: 200, type:"core", level_name:"ป.1" },
  { id:2, subject_code:"ค11101", subject_name:"คณิตศาสตร์",         subject_group:"คณิตศาสตร์",               credit: 4, hours: 160, type:"core", level_name:"ป.1" },
  { id:3, subject_code:"ว11101", subject_name:"วิทยาศาสตร์",        subject_group:"วิทยาศาสตร์และเทคโนโลยี", credit: 3, hours: 120, type:"core", level_name:"ป.1" },
  { id:4, subject_code:"ส11101", subject_name:"สังคมศึกษา",         subject_group:"สังคมศึกษา ศาสนาฯ",        credit: 2, hours: 80,  type:"core", level_name:"ป.1" },
  { id:5, subject_code:"อ11101", subject_name:"ภาษาอังกฤษ",         subject_group:"ภาษาต่างประเทศ",           credit: 5, hours: 200, type:"core", level_name:"ป.1" },
  { id:6, subject_code:"พ11101", subject_name:"สุขศึกษาและพลศึกษา", subject_group:"สุขศึกษาและพลศึกษา",      credit: 2, hours: 80,  type:"core", level_name:"ป.1" },
  { id:7, subject_code:"ศ11101", subject_name:"ศิลปะ",              subject_group:"ศิลปะ",                    credit: 1, hours: 40,  type:"core", level_name:"ป.1" },
  { id:8, subject_code:"ง11101", subject_name:"การงานอาชีพ",        subject_group:"การงานอาชีพ",              credit: 1, hours: 40,  type:"core", level_name:"ป.1" },
];
const SUBJECTS = SUBJECTS_INIT;

const ACTIVITY_TYPES = [
  { id: "แนะแนว",           label: "แนะแนว",                hours: 40, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  { id: "ลูกเสือ-เนตรนารี",  label: "ลูกเสือ-เนตรนารี",     hours: 40, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", label: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", hours: 10, color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0" },
];

const ACTIVITIES_INIT = [
  { id: 1, activity_type: "แนะแนว",           hours: 40, level_name: "ป.1", result: "ผ" },
  { id: 2, activity_type: "ลูกเสือ-เนตรนารี",      hours: 40, level_name: "ป.1", result: "ผ" },
  { id: 3, activity_type: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", hours: 10, level_name: "ป.1", result: "ผ" },
];

const SUBJECT_GROUPS = [
  { id:"ภาษาไทย",                  code:"ท", color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
  { id:"คณิตศาสตร์",               code:"ค", color:"#f97316", bg:"#fff7ed", border:"#fed7aa" },
  { id:"วิทยาศาสตร์และเทคโนโลยี", code:"ว", color:"#10b981", bg:"#f0fdf4", border:"#a7f3d0" },
  { id:"สังคมศึกษา ศาสนาฯ",        code:"ส", color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
  { id:"ภาษาต่างประเทศ",           code:"อ", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
  { id:"สุขศึกษาและพลศึกษา",       code:"พ", color:"#06b6d4", bg:"#ecfeff", border:"#a5f3fc" },
  { id:"ศิลปะ",                    code:"ศ", color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe" },
  { id:"การงานอาชีพ",              code:"ง", color:"#78716c", bg:"#fafaf9", border:"#d6d3d1" },
  { id:"รายวิชาเพิ่มเติม",         code:"เ", color:"#ec4899", bg:"#fdf2f8", border:"#fbcfe8" },
];

const LEVEL_NAMES = ["อนุบาล 1","อนุบาล 2","อนุบาล 3","ป.1","ป.2","ป.3","ป.4","ป.5","ป.6","ม.1","ม.2","ม.3","ม.4","ม.5","ม.6"];
const LEVEL_CODE_MAP = { "ป.1":1,"ป.2":2,"ป.3":3,"ป.4":4,"ป.5":5,"ป.6":6,"ม.1":1,"ม.2":2,"ม.3":3,"ม.4":4,"ม.5":5,"ม.6":6,"อนุบาล 1":1,"อนุบาล 2":2,"อนุบาล 3":3 };
const LEVEL_FULL_MAP = {
  "ป.1":"ประถมศึกษาปีที่ 1","ป.2":"ประถมศึกษาปีที่ 2","ป.3":"ประถมศึกษาปีที่ 3",
  "ป.4":"ประถมศึกษาปีที่ 4","ป.5":"ประถมศึกษาปีที่ 5","ป.6":"ประถมศึกษาปีที่ 6",
  "ม.1":"มัธยมศึกษาปีที่ 1","ม.2":"มัธยมศึกษาปีที่ 2","ม.3":"มัธยมศึกษาปีที่ 3",
  "ม.4":"มัธยมศึกษาปีที่ 4","ม.5":"มัธยมศึกษาปีที่ 5","ม.6":"มัธยมศึกษาปีที่ 6",
  "อนุบาล 1":"อนุบาลปีที่ 1","อนุบาล 2":"อนุบาลปีที่ 2","อนุบาล 3":"อนุบาลปีที่ 3",
};

const gradePoint = (total) => {
  if (total >= 80) return 4.0;
  if (total >= 75) return 3.5;
  if (total >= 65) return 3.0;
  if (total >= 55) return 2.5;
  if (total >= 45) return 2.0;
  if (total >= 35) return 1.5;
  if (total >= 20) return 1.0;
  return 0;
};

const gradeStr = (gp) => {
  const map = {4.0:"4",3.5:"3.5",3.0:"3",2.5:"2.5",2.0:"2",1.5:"1.5",1.0:"1",0:"0"};
  return map[gp] ?? "0";
};

const GRADES_67001 = SUBJECTS.map((s, i) => {
  const mids = [42,38,44,40,46,43,45,41];
  const fins = [35,30,36,32,37,35,36,33];
  const behs = [8,7,8,9,8,9,8,7];
  const total = mids[i]+fins[i]+behs[i];
  const gp = gradePoint(total);
  return { subject_id:s?.id, subject_name:s.subject_name, subject_group:s.subject_group, credit:s.credit, score_midterm:mids[i], score_final:fins[i], score_behavior:behs[i], score_total:total, grade_point:gp, grade:gradeStr(gp) };
});

const NATIONAL_EXAMS = {
  RT:   [ { subject:"การอ่านออกเสียง", school_avg:74.5, district_avg:70.2, national_avg:68.8 }, { subject:"การอ่านรู้เรื่อง", school_avg:71.3, district_avg:67.5, national_avg:65.1 } ],
  NT:   [ { subject:"ภาษาไทย", school_avg:62.4, district_avg:58.7, national_avg:55.3 }, { subject:"คณิตศาสตร์", school_avg:58.9, district_avg:55.1, national_avg:52.6 } ],
  ONET: [ { subject:"ภาษาไทย", school_avg:55.2, district_avg:51.8, national_avg:49.7 }, { subject:"คณิตศาสตร์", school_avg:48.7, district_avg:45.3, national_avg:43.1 }, { subject:"วิทยาศาสตร์", school_avg:52.1, district_avg:48.6, national_avg:46.9 }, { subject:"ภาษาอังกฤษ", school_avg:44.3, district_avg:40.9, national_avg:38.5 } ],
  ONET_M3: [
    { subject:"ภาษาไทย",     school_avg:58.3, district_avg:54.1, national_avg:51.8 },
    { subject:"คณิตศาสตร์",   school_avg:42.7, district_avg:39.5, national_avg:37.2 },
    { subject:"วิทยาศาสตร์",  school_avg:45.6, district_avg:42.3, national_avg:40.1 },
    { subject:"ภาษาอังกฤษ",  school_avg:38.9, district_avg:35.7, national_avg:33.4 },
    { subject:"สังคมศึกษา",   school_avg:50.2, district_avg:47.8, national_avg:45.3 },
  ],
  ONET_M6: [
    { subject:"ภาษาไทย",     school_avg:52.1, district_avg:48.6, national_avg:46.2 },
    { subject:"คณิตศาสตร์",   school_avg:30.5, district_avg:27.8, national_avg:25.4 },
    { subject:"วิทยาศาสตร์",  school_avg:35.8, district_avg:32.4, national_avg:30.1 },
    { subject:"ภาษาอังกฤษ",  school_avg:33.2, district_avg:30.1, national_avg:28.5 },
    { subject:"สังคมศึกษา",   school_avg:44.7, district_avg:41.3, national_avg:39.6 },
  ],
};

const NOTIFICATIONS = [
  { id:1, title:"ประกาศผลการเรียน ภาคเรียนที่ 1/2568", message:"ขณะนี้ระบบได้เปิดให้ตรวจสอบผลการเรียนภาคเรียนที่ 1 ปีการศึกษา 2568 แล้ว", type:"success", created_at:"2024-10-15" },
  { id:2, title:"กำหนดการสอบปลายภาค", message:"การสอบปลายภาคจะจัดขึ้นในวันที่ 1-5 มีนาคม 2568 ขอให้นักเรียนเตรียมความพร้อม", type:"warning", created_at:"2024-10-10" },
  { id:3, title:"วันหยุดชดเชยวันพ่อแห่งชาติ", message:"โรงเรียนหยุดชดเชยวันพ่อแห่งชาติ วันจันทร์ที่ 9 ธันวาคม 2567", type:"info", created_at:"2024-10-05" },
];

const ADMIN_NAV = [
  { key:"admin_home",      label:"ภาพรวมจัดการ",             Icon: LayoutGrid,   color:"#3b82f6", bg:"#eff6ff" },
  { key:"settings",        label:"ตั้งค่าระบบโรงเรียน",       Icon: Settings,     color:"#6366f1", bg:"#eef2ff" },
  { key:"academic_year",   label:"จัดการปีการศึกษา",          Icon: Calendar,     color:"#10b981", bg:"#f0fdf4" },
  { key:"user_manage",     label:"จัดการผู้ใช้งาน",           Icon: Users,        color:"#ec4899", bg:"#fdf2f8" },
  { key:"classrooms",      label:"จัดการชั้นเรียน",            Icon: School,       color:"#10b981", bg:"#f0fdf4" },
  { key:"teacher_assign",  label:"มอบหมายครูประจำชั้น",       Icon: BookMarked,   color:"#0891b2", bg:"#ecfeff" },
  { key:"students",        label:"จัดการรายชื่อนักเรียน",      Icon: Users,        color:"#0ea5e9", bg:"#f0f9ff" },
  { key:"subject_manage",  label:"จัดการรายวิชา",              Icon: BookOpen,      color:"#6366f1", bg:"#eef2ff" },
  { key:"grade_manage",    label:"จัดการเกรด/ผลการเรียน",     Icon: ClipboardList, color:"#f59e0b", bg:"#fffbeb" },
  { key:"national_exam",   label:"จัดการผลสัมฤทธิ์",    Icon: Medal,        color:"#ef4444", bg:"#fef2f2" },
  { key:"reports",         label:"พิมพ์รายงาน",                Icon: Printer,      color:"#64748b", bg:"#f8fafc" },
];

export { CLASSROOMS, STUDENTS, SUBJECTS_INIT, SUBJECTS, ACTIVITY_TYPES, ACTIVITIES_INIT, SUBJECT_GROUPS, GRADES_67001, NATIONAL_EXAMS, NOTIFICATIONS, ADMIN_NAV };