"use client";

// Landing Page — "/"

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '-10%',
        width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(192,57,43,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%', right: '-10%',
        width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <div className={`glass-panel ${mounted ? 'animate-slide-up' : ''}`} style={{
        maxWidth: '800px',
        width: '100%',
        padding: '4rem 2rem',
        textAlign: 'center',
        zIndex: 1,
        borderTop: '2px solid rgba(212,175,55,0.4)',
        borderBottom: '2px solid rgba(212,175,55,0.1)'
      }}>
        <div style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
          <span style={{
            fontSize: '0.9rem',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'var(--accent-gold)',
            fontWeight: 600
          }}>
            Trò chơi tương tác lịch sử
          </span>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)', marginTop: '8px' }} />
        </div>

        <h1 className="text-gradient" style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          marginBottom: '1.5rem',
          textShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          Giải Mã Bức Ảnh <br/> Lịch Sử
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 3rem auto',
          fontStyle: 'italic',
          lineHeight: 1.8
        }}>
          Việc cải cách ruộng đất năm 1953–1956 Đảng ta đã mắc sai lầm như thế nào? <br/>
          Một hành trình nhìn lại quá khứ qua từng mảnh ghép.
        </p>

        <nav style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link href="/host" style={linkBtnStyle(true)}>
            <span style={{ fontSize: '1.3rem', marginRight: '8px' }}>🎮</span> VÀO PHÒNG ĐIỀU KHIỂN (HOST)
          </Link>
          <Link href="/display" style={linkBtnStyle(false)}>
            <span style={{ fontSize: '1.3rem', marginRight: '8px' }}>📺</span> MỞ MÀN HÌNH CHIẾU (DISPLAY)
          </Link>
        </nav>
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        color: 'var(--border-gold)',
        fontSize: '0.9rem',
        letterSpacing: '2px',
        opacity: 0.6
      }}>
        HỌC PHẦN: ĐƯỜNG LỐI CÁCH MẠNG CỦA ĐẢNG CỘNG SẢN VIỆT NAM
      </div>
    </main>
  );
}

const linkBtnStyle = (primary: boolean) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1rem 2rem',
  background: primary ? 'linear-gradient(135deg, var(--accent-red), #901010)' : 'rgba(30, 25, 20, 0.8)',
  color: primary ? '#fff' : 'var(--text-gold)',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  border: primary ? 'none' : '1px solid var(--border-gold)',
  boxShadow: primary ? 'var(--glow-red)' : 'var(--shadow-sm)',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
});
