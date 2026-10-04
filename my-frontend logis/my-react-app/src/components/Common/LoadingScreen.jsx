import React from 'react';
import { Lottie } from 'lottie-react';
import loadingCarAnimation from '../../assets/Loading_car.json';

export default function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f0f7ff 50%, #e0f2fe 100%)',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Decorative blurred backdrop glow */}
      <div
        style={{
          position: 'absolute',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(2, 132, 199, 0.05) 60%, transparent 100%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Minimalist Glass Card */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          borderRadius: '28px',
          padding: '28px 40px 32px 40px',
          maxWidth: '360px',
          width: '85%',
          textAlign: 'center',
          animation: 'fadeInUp 0.35s ease-out'
        }}
      >
        {/* Lottie Car Motion */}
        <div
          style={{
            width: '220px',
            height: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 10px 18px rgba(2, 132, 199, 0.15))'
          }}
        >
          <Lottie
            src={loadingCarAnimation}
            animationData={loadingCarAnimation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Dynamic Loading Bar */}
        <div
          style={{
            width: '160px',
            height: '4px',
            backgroundColor: '#e2e8f0',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative',
            marginTop: '8px'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '45%',
              background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
              borderRadius: '9999px',
              animation: 'loadingProgress 1.4s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Embedded keyframe styles */}
      <style>{`
        @keyframes loadingProgress {
          0% {
            left: -45%;
            width: 30%;
          }
          50% {
            width: 55%;
          }
          100% {
            left: 100%;
            width: 30%;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
