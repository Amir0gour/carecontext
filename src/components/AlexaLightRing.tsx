import React from 'react';

interface AlexaLightRingProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'verifying_safety' | 'emergency';
  size?: 'sm' | 'md' | 'lg';
}

export const AlexaLightRing: React.FC<AlexaLightRingProps> = ({ state, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
  }[size];

  // Colors based on state
  let gradientClass = 'from-cyan-400 via-sky-500 to-blue-600';
  let pulseClass = 'animate-pulse';
  let shadowClass = 'shadow-[0_0_35px_rgba(56,189,248,0.45)]';
  let label = 'Ready';

  if (state === 'listening') {
    gradientClass = 'from-cyan-300 via-teal-400 to-sky-500';
    pulseClass = 'animate-ping duration-1000';
    shadowClass = 'shadow-[0_0_45px_rgba(45,212,191,0.65)]';
    label = 'Listening...';
  } else if (state === 'thinking') {
    gradientClass = 'from-sky-400 via-indigo-500 to-cyan-400';
    pulseClass = 'animate-spin duration-3000';
    shadowClass = 'shadow-[0_0_40px_rgba(99,102,241,0.55)]';
    label = 'Checking Home Context...';
  } else if (state === 'speaking') {
    gradientClass = 'from-cyan-400 via-blue-500 to-teal-300';
    pulseClass = 'animate-pulse duration-700';
    shadowClass = 'shadow-[0_0_50px_rgba(56,189,248,0.7)]';
    label = 'Speaking';
  } else if (state === 'verifying_safety') {
    gradientClass = 'from-amber-400 via-orange-500 to-yellow-400';
    pulseClass = 'animate-pulse duration-500';
    shadowClass = 'shadow-[0_0_45px_rgba(251,191,36,0.7)]';
    label = 'Safety Verification';
  } else if (state === 'emergency') {
    gradientClass = 'from-rose-500 via-red-600 to-orange-500';
    pulseClass = 'animate-ping duration-700';
    shadowClass = 'shadow-[0_0_60px_rgba(244,63,94,0.8)]';
    label = 'Alert Dispatched';
  }

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className={`relative ${sizeClasses} flex items-center justify-center`}>
        {/* Outer ambient glow halo */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${gradientClass} opacity-70 blur-xl ${pulseClass} transition-all duration-500`}
        />

        {/* Alexa Ring Border */}
        <div
          className={`absolute inset-1 rounded-full p-[3px] bg-gradient-to-tr ${gradientClass} ${shadowClass} transition-all duration-300`}
        >
          <div className="w-full h-full rounded-full bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3">
            {/* Center Core Display */}
            <div className="relative flex flex-col items-center justify-center text-center">
              {state === 'thinking' ? (
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-1" />
              ) : state === 'listening' ? (
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1.5 h-3 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-6 bg-teal-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-4 bg-teal-400 rounded-full animate-bounce" />
                </div>
              ) : state === 'speaking' ? (
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1.5 h-4 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="w-1.5 h-7 bg-sky-300 rounded-full animate-pulse [animation-delay:0.2s]" />
                  <span className="w-1.5 h-5 bg-cyan-400 rounded-full animate-pulse [animation-delay:0.4s]" />
                  <span className="w-1.5 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.1s]" />
                </div>
              ) : state === 'emergency' ? (
                <div className="text-rose-400 font-bold text-xs tracking-wider uppercase animate-pulse">
                  SOS
                </div>
              ) : (
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]" />
              )}
              <span className="text-[10px] font-medium text-stone-300 mt-1 uppercase tracking-wider">
                {state === 'idle' ? 'Alexa+' : label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
