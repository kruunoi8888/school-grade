import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", background: "#fef2f2", borderRadius: "16px", border: "2px dashed #fecaca", margin: "20px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontFamily: "var(--font-d)", color: "#991b1b", marginBottom: 12 }}>เกิดข้อผิดพลาดในการแสดงผลหน้านี้</h2>
          <p style={{ color: "#b91c1c", marginBottom: 20 }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontFamily: "var(--font-d)", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <RefreshCcw size={16} /> ลองใหม่อีกครั้ง
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
