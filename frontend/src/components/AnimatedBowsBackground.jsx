import React from 'react';

// Gorgeous Lush Pink Satin Bow SVG with full volume loops & silky ribbon folds
const LushSatinBowSVG = ({ size = 56, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-md ${className}`}
  >
    <defs>
      {/* Silky Pink Gradients */}
      <linearGradient id="satinMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffc0cb" />
        <stop offset="40%" stopColor="#f48fb1" />
        <stop offset="85%" stopColor="#ec407a" />
        <stop offset="100%" stopColor="#d81b60" />
      </linearGradient>

      <linearGradient id="satinHighlight" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#ffc0cb" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#f48fb1" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="knotSatin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8bbd0" />
        <stop offset="50%" stopColor="#e91e63" />
        <stop offset="100%" stopColor="#880e4f" />
      </linearGradient>
    </defs>

    {/* Left Silk Ribbon Tail */}
    <path
      d="M52 64 Q40 85 28 110 C34 112, 44 105, 48 98 Q56 80 57 65 Z"
      fill="url(#satinMain)"
    />
    <path
      d="M52 64 Q40 85 28 110 C34 112, 44 105, 48 98"
      stroke="url(#satinHighlight)"
      strokeWidth="2"
      fill="none"
    />

    {/* Right Silk Ribbon Tail */}
    <path
      d="M68 64 Q80 85 92 110 C86 112, 76 105, 72 98 Q64 80 63 65 Z"
      fill="url(#satinMain)"
    />
    <path
      d="M68 64 Q80 85 92 110 C86 112, 76 105, 72 98"
      stroke="url(#satinHighlight)"
      strokeWidth="2"
      fill="none"
    />

    {/* Left Full Bow Loop */}
    <path
      d="M56 58 C35 25 5 45 32 68 C45 74 54 64 58 60 Z"
      fill="url(#satinMain)"
    />
    {/* Left Loop Fold & Highlight */}
    <path
      d="M50 54 C35 32 15 48 35 63 C44 68 52 60 54 58 Z"
      fill="url(#satinHighlight)"
    />

    {/* Right Full Bow Loop */}
    <path
      d="M64 58 C85 25 115 45 88 68 C75 74 66 64 62 60 Z"
      fill="url(#satinMain)"
    />
    {/* Right Loop Fold & Highlight */}
    <path
      d="M70 54 C85 32 105 48 85 63 C76 68 68 60 66 58 Z"
      fill="url(#satinHighlight)"
    />

    {/* Center Wrapped Silk Knot */}
    <path
      d="M54 52 C52 48 68 48 66 52 C68 68 52 68 54 52 Z"
      fill="url(#knotSatin)"
    />
    <ellipse cx="60" cy="58" rx="7" ry="9" fill="url(#knotSatin)" />
    <ellipse cx="58" cy="55" rx="4" ry="6" fill="url(#satinHighlight)" opacity="0.6" />
  </svg>
);

// Cute Small Pink Teddy Bear SVG
const PinkTeddySVG = ({ size = 46, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-sm ${className}`}
  >
    <defs>
      <linearGradient id="teddyFur" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8bbd0" />
        <stop offset="100%" stopColor="#f48fb1" />
      </linearGradient>
      <linearGradient id="innerEar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f8c8dc" />
      </linearGradient>
    </defs>

    {/* Ears */}
    <circle cx="30" cy="28" r="13" fill="url(#teddyFur)" />
    <circle cx="30" cy="28" r="7" fill="url(#innerEar)" />
    <circle cx="70" cy="28" r="13" fill="url(#teddyFur)" />
    <circle cx="70" cy="28" r="7" fill="url(#innerEar)" />

    {/* Body */}
    <ellipse cx="50" cy="70" rx="24" ry="22" fill="url(#teddyFur)" />
    <circle cx="28" cy="68" r="8" fill="url(#innerEar)" />
    <circle cx="72" cy="68" r="8" fill="url(#innerEar)" />

    {/* Head */}
    <circle cx="50" cy="44" r="23" fill="url(#teddyFur)" />
    <ellipse cx="50" cy="50" rx="9" ry="7" fill="#ffffff" opacity="0.9" />

    {/* Nose & Eyes */}
    <path d="M50 47 C48 44, 46 47, 50 51 C54 47, 52 44, 50 47 Z" fill="#ad1457" />
    <circle cx="41" cy="40" r="3" fill="#4a154b" />
    <circle cx="40" cy="39" r="1" fill="#ffffff" />
    <circle cx="59" cy="40" r="3" fill="#4a154b" />
    <circle cx="58" cy="39" r="1" fill="#ffffff" />
    <ellipse cx="36" cy="46" rx="4" ry="2.5" fill="#f06292" opacity="0.5" />
    <ellipse cx="64" cy="46" rx="4" ry="2.5" fill="#f06292" opacity="0.5" />
  </svg>
);

// Cute Vibrant Pink Butterfly SVG
const PinkButterflySVG = ({ size = 46, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-md ${className}`}
  >
    <defs>
      <linearGradient id="butterflyWing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff80ab" />
        <stop offset="50%" stopColor="#f48fb1" />
        <stop offset="100%" stopColor="#ea80fc" />
      </linearGradient>
      <linearGradient id="wingInner" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ff4081" />
      </linearGradient>
    </defs>

    {/* Upper Wings */}
    <path
      d="M50 46 C25 15, 5 35, 18 62 C32 70, 48 56, 50 46 Z"
      fill="url(#butterflyWing)"
    />
    <ellipse cx="32" cy="42" rx="7" ry="12" transform="rotate(-20 32 42)" fill="url(#wingInner)" opacity="0.75" />

    <path
      d="M50 46 C75 15, 95 35, 82 62 C68 70, 52 56, 50 46 Z"
      fill="url(#butterflyWing)"
    />
    <ellipse cx="68" cy="42" rx="7" ry="12" transform="rotate(20 68 42)" fill="url(#wingInner)" opacity="0.75" />

    {/* Lower Wings */}
    <path
      d="M48 52 C30 62, 18 82, 38 90 C50 86, 48 65, 48 52 Z"
      fill="url(#butterflyWing)"
      opacity="0.9"
    />
    <path
      d="M52 52 C70 62, 82 82, 62 90 C50 86, 52 65, 52 52 Z"
      fill="url(#butterflyWing)"
      opacity="0.9"
    />

    {/* Body & Antennae */}
    <ellipse cx="50" cy="52" rx="3.5" ry="18" fill="#6a1b9a" />
    <circle cx="50" cy="32" r="4.5" fill="#6a1b9a" />

    <path d="M49 29 Q40 18 35 15" stroke="#6a1b9a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <circle cx="35" cy="15" r="2" fill="#ff4081" />
    <path d="M51 29 Q60 18 65 15" stroke="#6a1b9a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <circle cx="65" cy="15" r="2" fill="#ff4081" />
  </svg>
);

export default function AnimatedBowsBackground() {
  // Rich background layout with MANY MORE butterflies, plush satin bows, and cute teddy bears!
  const elements = [
    // Satin Bows
    { type: 'bow', top: '6%', left: '4%', size: 58, duration: '7s', delay: '0s', rotate: '-6deg' },
    { type: 'bow', top: '10%', right: '5%', size: 62, duration: '8.5s', delay: '1s', rotate: '8deg' },
    { type: 'bow', top: '45%', left: '3%', size: 52, duration: '7.5s', delay: '2s', rotate: '4deg' },
    { type: 'bow', top: '52%', right: '4%', size: 56, duration: '6.5s', delay: '0.5s', rotate: '-8deg' },
    { type: 'bow', top: '78%', left: '6%', size: 60, duration: '9s', delay: '1.5s', rotate: '10deg' },
    { type: 'bow', top: '84%', right: '6%', size: 54, duration: '7.2s', delay: '2.5s', rotate: '-4deg' },

    // Pink Teddies
    { type: 'teddy', top: '24%', left: '10%', size: 46, duration: '9.5s', delay: '1.2s', rotate: '6deg' },
    { type: 'teddy', top: '64%', right: '12%', size: 48, duration: '8s', delay: '0.3s', rotate: '-10deg' },
    { type: 'teddy', top: '86%', left: '45%', size: 44, duration: '10s', delay: '2.1s', rotate: '5deg' },

    // Fluttering Butterflies (Added MANY MORE butterflies across screen!)
    { type: 'butterfly', top: '14%', left: '32%', size: 46, duration: '5.2s', delay: '0.2s', rotate: '-15deg' },
    { type: 'butterfly', top: '18%', left: '68%', size: 50, duration: '5.8s', delay: '1.4s', rotate: '12deg' },
    { type: 'butterfly', top: '32%', left: '16%', size: 42, duration: '6.2s', delay: '2.0s', rotate: '-8deg' },
    { type: 'butterfly', top: '36%', right: '22%', size: 48, duration: '4.8s', delay: '0.7s', rotate: '18deg' },
    { type: 'butterfly', top: '56%', left: '28%', size: 44, duration: '5.5s', delay: '1.8s', rotate: '-10deg' },
    { type: 'butterfly', top: '60%', right: '35%', size: 46, duration: '6.0s', delay: '0.5s', rotate: '14deg' },
    { type: 'butterfly', top: '72%', left: '48%', size: 52, duration: '5.0s', delay: '2.3s', rotate: '-5deg' },
    { type: 'butterfly', top: '82%', left: '20%', size: 40, duration: '6.4s', delay: '1.1s', rotate: '10deg' },
    { type: 'butterfly', top: '88%', right: '18%', size: 44, duration: '5.6s', delay: '0.9s', rotate: '-12deg' }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#fff2f6] via-[#fbf9f5] to-[#f8eaf1]">
      {/* Ambient pink glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-pink-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-1/3 w-[28rem] h-[28rem] bg-purple-300/20 rounded-full blur-3xl"></div>

      {/* Floating Animated Elements */}
      {elements.map((item, idx) => (
        <div
          key={idx}
          className="absolute gpu-accelerated transition-transform opacity-85 hover:opacity-100"
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            transform: `rotate(${item.rotate})`,
            animation: item.type === 'butterfly'
              ? `flutterButterfly ${item.duration} ease-in-out infinite alternate`
              : item.type === 'teddy'
              ? `swayTeddy ${item.duration} ease-in-out infinite alternate`
              : `floatBow ${item.duration} ease-in-out infinite alternate`,
            animationDelay: item.delay
          }}
        >
          {item.type === 'bow' && <LushSatinBowSVG size={item.size} />}
          {item.type === 'teddy' && <PinkTeddySVG size={item.size} />}
          {item.type === 'butterfly' && <PinkButterflySVG size={item.size} />}
        </div>
      ))}
    </div>
  );
}
