import React, { useState } from "react";
import { School, MapPin, Phone, Mail, Globe, Code } from "lucide-react";

const Footer = ({ schoolInfo, isAdmin = false }) => {
  const currentYear = new Date().getFullYear() + 543; // Buddhist Era

  return (
    <footer className="site-footer" style={{
      background: "#334155", // Neutral Slate Gray
      borderTop: "1px solid rgba(255,255,255,0.1)",
      padding: "36px 24px 28px",
      marginTop: "auto",
      width: "100%",
      color: "#f1f5f9"
    }}>
      <div style={{
        maxWidth: 1140,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "22px"
      }}>
        
        {/* School Info Section - Centered & Tight */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", maxWidth: 800 }}>
          <div style={{
            width: 80, height: 80, 
            display: "flex", 
            alignItems: "center", justifyContent: "center", 
            marginBottom: 2
          }}>
            {schoolInfo.logo ? (
              <img src={schoolInfo.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <School size={40} style={{color: "#fff"}} />
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <div style={{ fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 21, color: "#fff", lineHeight: 1.1 }}>
              {schoolInfo.name}
            </div>
            <div style={{ fontSize: 13.5, color: "#cbd5e1", fontWeight: 500 }}>
              {schoolInfo.district}
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.04)",
            padding: "12px 32px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            marginTop: 4,
            width: "fit-content"
          }}>
            {schoolInfo.address && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>
                <MapPin size={14} style={{ color: "#60a5fa" }} />
                <span>{schoolInfo.address}</span>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "24px" }}>
              {schoolInfo.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>
                  <Phone size={14} style={{ color: "#60a5fa" }} />
                  <span>{schoolInfo.phone}</span>
                </div>
              )}
              {schoolInfo.email && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>
                  <Mail size={14} style={{ color: "#60a5fa" }} />
                  <span>{schoolInfo.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Info Section - Tighter Dark Slate Style */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "6px",
          padding: "14px 40px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          width: "100%",
          maxWidth: 600,
          marginTop: 6
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa" }}>
              <Code size={11} />
            </div>
            <div style={{ fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 11, color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" }}>
              Designed & Developed By
            </div>
          </div>
          
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: 12.5, color: "#cbd5e1" }}>
            <span style={{ color: "#fff", fontWeight: 700 }}>Mr. Ratchapol Worrakan</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>Tel: 0815144041</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>E-Mail: kruunoi@gmail.com</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
