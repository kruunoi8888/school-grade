import React from "react";
import {
  Home, GraduationCap, LayoutGrid, ShieldCheck, User, Users, School,
  BookOpen, ClipboardList, Medal, Trophy, Bell, Printer, Settings,
  BarChart3, BarChart2, Building2, BookMarked, Activity, Award, TrendingUp,
  Database, Wrench, LogIn, LogOut, UserPlus, BadgeCheck, Eye, EyeOff,
  Pencil, Trash2, PlusCircle, Search, Hash, ChevronDown, Save, Filter,
  AlertCircle, CheckCircle2, ArrowLeft, FileText, List, Info, Calendar, Clock,
  Lightbulb, Megaphone
} from "lucide-react";

const ICON_MAP = {
  // Navigation
  "grid-fill": Home,        "home": Home,
  "star-fill": GraduationCap, "mortarboard-fill": GraduationCap,
  "lock-fill": LogIn,       "lock": LogIn,   "shield-lock-fill": ShieldCheck,
  "box-arrow-in-right": LogIn,  "box-arrow-right": LogOut,
  // People
  "person-fill": User, "person": User, "person-circle": User,
  "people-fill": Users,
  "person-plus-fill": UserPlus, "person-plus": UserPlus,
  "person-badge": BadgeCheck, "person-badge-fill": BadgeCheck,
  // School / Academic
  "building": School, "building2": School,
  "clipboard2-data-fill": ClipboardList, "clipboard2-check-fill": ClipboardList,
  "trophy-fill": Medal, "trophy": Medal,
  "book": BookOpen, "book-fill": BookOpen,
  "bookmark": BookMarked,
  // UI actions
  "bell-fill": Bell, "bell": Bell,
  "printer-fill": Printer, "printer": Printer,
  "gear-fill": Settings, "gear": Settings,
  "bar-chart-fill": BarChart3, "bar-chart-line": BarChart3,
  "eye": Eye, "eye-fill": Eye, "eye-slash": EyeOff, "eye-slash-fill": EyeOff,
  "pencil": Pencil, "pencil-fill": Pencil,
  "trash": Trash2, "trash-fill": Trash2,
  "plus-circle-fill": PlusCircle, "plus-circle": PlusCircle,
  "search": Search, "hash": Hash,
  "chevron-down": ChevronDown,
  "floppy-fill": Save, "floppy": Save,
  "funnel-fill": Filter, "funnel": Filter,
  "lightbulb-fill": Lightbulb, "lightbulb": Lightbulb,
  "calendar": Calendar, "calendar3": Calendar,
  "clock": Clock,
  "list-ul": List, "list": List,
  "megaphone-fill": Megaphone, "megaphone": Megaphone,
  "info-circle-fill": Info, "info-circle": Info,
  "exclamation-circle-fill": AlertCircle, "exclamation-circle": AlertCircle,
  "check-circle-fill": CheckCircle2,
  "arrow-left": ArrowLeft,
  "database-fill": Database, "database": Database,
  "tools": Wrench,
  "file-earmark-text": FileText, "file-earmark-text-fill": FileText,
  "trophy-fill-alt": Award,
  "graph-up": TrendingUp,
  "cursor-fill": Search,
};

function Icon({ name, style, size }) {
  const Comp = ICON_MAP[name];
  if (!Comp) return <span style={{ fontSize: 14, ...style }}>•</span>;
  return <Comp size={size ?? 16} style={{ flexShrink: 0, ...style }} />;
}

function GradeBadge({ grade }) {
  const map = { "4": "g40", "3.5": "g35", "3": "g30", "2.5": "g25", "2": "g20", "1.5": "g15", "1": "g10", "0": "g0" };
  return <span className={`grade-badge ${map[grade] ?? "g0"}`}>{grade}</span>;
}

function ScoreBar({ label, value, colorClass, color }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <small style={{ width: 80, color, flexShrink: 0, fontSize: 12 }}>{label}</small>
      <div className="score-bar-track flex-1">
        <div className={`score-bar-fill ${colorClass}`} style={{ width: `${value}%` }}></div>
      </div>
      <span style={{ width: 48, textAlign: "right", color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{value.toFixed(1)}%</span>
    </div>
  );
}

export { ICON_MAP, GradeBadge, ScoreBar };
export default Icon;