import React, { useEffect, useRef } from 'react';

export default function PalmingExercise() {
  const animationRef = useRef(null);

  useEffect(() => {
    const element = animationRef.current;
    if (!element) return;

    // Restart animation on mount
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = '';
    }, 10);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-200 to-green-200">
      <div className="relative w-full max-w-md aspect-[4/5]" ref={animationRef}>
        <svg viewBox="0 0 400 500" className="w-full h-full">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B8E0F6" />
              <stop offset="100%" stopColor="#C8E6C9" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect width="400" height="500" fill="url(#bgGrad)" />

          {/* Head and Face - with breathing animation */}
          <g className="head-breathing">
            {/* Shoulders */}
            <ellipse cx="150" cy="420" rx="60" ry="35" fill="#87CEEB" />
            <ellipse cx="250" cy="420" rx="60" ry="35" fill="#87CEEB" />

            {/* Neck */}
            <rect x="175" y="320" width="50" height="60" fill="#FFD4A3" rx="10" />

            {/* Head */}
            <ellipse cx="200" cy="220" rx="75" ry="85" fill="#FFD4A3" />

            {/* Ears */}
            <ellipse cx="140" cy="220" rx="12" ry="18" fill="#FFCC99" />
            <ellipse cx="260" cy="220" rx="12" ry="18" fill="#FFCC99" />
            <ellipse cx="140" cy="222" rx="6" ry="10" fill="#FFB380" />
            <ellipse cx="260" cy="222" rx="6" ry="10" fill="#FFB380" />

            {/* Hair */}
            <path
              d="M 125 165 Q 115 125 145 115 Q 175 110 200 105 Q 225 110 255 115 Q 285 125 275 165 Q 270 145 265 155 Q 255 135 245 150 Q 235 130 225 145 Q 215 125 205 143 Q 200 120 195 143 Q 185 125 175 145 Q 165 130 155 150 Q 145 135 135 155 Q 130 145 125 165"
              fill="#8B6F47"
            />

            {/* Eyebrows */}
            <path d="M 165 195 Q 178 190 190 193" stroke="#6B5639" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 210 193 Q 222 190 235 195" stroke="#6B5639" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Open Eyes */}
            <g className="open-eyes">
              {/* Left Eye */}
              <ellipse cx="177" cy="210" rx="14" ry="16" fill="white" />
              <circle cx="179" cy="212" r="8" fill="#6B4423" />
              <circle cx="181" cy="210" r="4" fill="black" />
              <circle cx="182" cy="208" r="2" fill="white" />

              {/* Right Eye */}
              <ellipse cx="223" cy="210" rx="14" ry="16" fill="white" />
              <circle cx="221" cy="212" r="8" fill="#6B4423" />
              <circle cx="219" cy="210" r="4" fill="black" />
              <circle cx="218" cy="208" r="2" fill="white" />
            </g>

            {/* Closed Eyes */}
            <g className="closed-eyes">
              <path d="M 165 210 Q 177 215 189 210" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 211 210 Q 223 215 235 210" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>

            {/* Nose */}
            <path d="M 200 225 L 196 238 Q 198 241 200 241 Q 202 241 204 238 L 200 225" fill="#FFB380" />
            <ellipse cx="194" cy="241" rx="3" ry="4" fill="#FFB380" />
            <ellipse cx="206" cy="241" rx="3" ry="4" fill="#FFB380" />

            {/* Smile */}
            <path d="M 180 260 Q 200 270 220 260" stroke="#E0A080" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* Left Hand */}
          <g className="left-hand" transform="translate(140, 420)">
            {/* Palm */}
            <ellipse cx="0" cy="0" rx="28" ry="32" fill="#FFCC99" />
            {/* Thumb */}
            <ellipse cx="-18" cy="-12" rx="11" ry="15" fill="#FFCC99" transform="rotate(-25 -18 -12)" />
            {/* Fingers */}
            <ellipse cx="-8" cy="-25" rx="9" ry="18" fill="#FFCC99" transform="rotate(-8 -8 -25)" />
            <ellipse cx="2" cy="-28" rx="9" ry="19" fill="#FFCC99" />
            <ellipse cx="12" cy="-26" rx="9" ry="18" fill="#FFCC99" transform="rotate(8 12 -26)" />
            <ellipse cx="20" cy="-20" rx="8" ry="15" fill="#FFCC99" transform="rotate(15 20 -20)" />
          </g>

          {/* Right Hand */}
          <g className="right-hand" transform="translate(260, 420)">
            {/* Palm */}
            <ellipse cx="0" cy="0" rx="28" ry="32" fill="#FFCC99" />
            {/* Thumb */}
            <ellipse cx="18" cy="-12" rx="11" ry="15" fill="#FFCC99" transform="rotate(25 18 -12)" />
            {/* Fingers */}
            <ellipse cx="8" cy="-25" rx="9" ry="18" fill="#FFCC99" transform="rotate(8 8 -25)" />
            <ellipse cx="-2" cy="-28" rx="9" ry="19" fill="#FFCC99" />
            <ellipse cx="-12" cy="-26" rx="9" ry="18" fill="#FFCC99" transform="rotate(-8 -12 -26)" />
            <ellipse cx="-20" cy="-20" rx="8" ry="15" fill="#FFCC99" transform="rotate(-15 -20 -20)" />
          </g>
        </svg>

        <style>{`
          @keyframes rubLeft {
            0%, 30% {
              transform: translate(140px, 420px) translateX(0px);
            }
            1.5%, 16.5% {
              transform: translate(140px, 420px) translateX(-8px);
            }
            3%, 18% {
              transform: translate(140px, 420px) translateX(0px);
            }
            4.5%, 19.5% {
              transform: translate(140px, 420px) translateX(-8px);
            }
            6%, 21% {
              transform: translate(140px, 420px) translateX(0px);
            }
            7.5%, 22.5% {
              transform: translate(140px, 420px) translateX(-8px);
            }
            9%, 24% {
              transform: translate(140px, 420px) translateX(0px);
            }
            10.5%, 25.5% {
              transform: translate(140px, 420px) translateX(-8px);
            }
            12%, 27% {
              transform: translate(140px, 420px) translateX(0px);
            }
            30%, 50% {
              transform: translate(140px, 420px) translate(60px, -180px);
            }
            50%, 100% {
              transform: translate(140px, 420px) translate(60px, -180px);
            }
          }

          @keyframes rubRight {
            0%, 30% {
              transform: translate(260px, 420px) translateX(0px);
            }
            1.5%, 16.5% {
              transform: translate(260px, 420px) translateX(8px);
            }
            3%, 18% {
              transform: translate(260px, 420px) translateX(0px);
            }
            4.5%, 19.5% {
              transform: translate(260px, 420px) translateX(8px);
            }
            6%, 21% {
              transform: translate(260px, 420px) translateX(0px);
            }
            7.5%, 22.5% {
              transform: translate(260px, 420px) translateX(8px);
            }
            9%, 24% {
              transform: translate(260px, 420px) translateX(0px);
            }
            10.5%, 25.5% {
              transform: translate(260px, 420px) translateX(8px);
            }
            12%, 27% {
              transform: translate(260px, 420px) translateX(0px);
            }
            30%, 50% {
              transform: translate(260px, 420px) translate(-60px, -180px);
            }
            50%, 100% {
              transform: translate(260px, 420px) translate(-60px, -180px);
            }
          }

          @keyframes breathePulse {
            0%, 50% {
              transform: scale(1);
            }
            55%, 65%, 75%, 85%, 95% {
              transform: scale(1.025);
            }
            60%, 70%, 80%, 90%, 100% {
              transform: scale(1);
            }
          }

          @keyframes headBreathe {
            0%, 50% {
              transform: translateY(0);
            }
            55%, 65%, 75%, 85%, 95% {
              transform: translateY(-3px);
            }
            60%, 70%, 80%, 90%, 100% {
              transform: translateY(0);
            }
          }

          @keyframes eyesClose {
            0%, 40% {
              opacity: 1;
            }
            45%, 100% {
              opacity: 0;
            }
          }

          @keyframes eyesOpen {
            0%, 40% {
              opacity: 0;
            }
            45%, 100% {
              opacity: 1;
            }
          }

          .left-hand {
            animation: rubLeft 10s ease-in-out infinite, breathePulse 10s ease-in-out infinite;
            transform-origin: center;
          }

          .right-hand {
            animation: rubRight 10s ease-in-out infinite, breathePulse 10s ease-in-out infinite;
            transform-origin: center;
          }

          .head-breathing {
            animation: headBreathe 10s ease-in-out infinite;
          }

          .open-eyes {
            animation: eyesClose 10s ease-in-out infinite;
          }

          .closed-eyes {
            animation: eyesOpen 10s ease-in-out infinite;
          }
        `}</style>
      </div>
      
      <div className="absolute bottom-8 text-center text-gray-700 text-sm">
        <p className="font-medium">10-second Palming Exercise Animation</p>
        <p className="text-xs mt-1">0-3s: Rubbing | 3-5s: Moving | 5-10s: Palming with breathing</p>
      </div>
    </div>
  );
}