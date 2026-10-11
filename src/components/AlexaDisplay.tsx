import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Heart,
  Send,
  Coffee,
  Pill,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  User,
  Clock,
} from 'lucide-react';
import { AlexaLightRing } from './AlexaLightRing.tsx';
import type { AgentChatMessage, HomeState } from '../types/careContext.ts';
import { playAlexaChime, playEmergencyAlertChime, speakText, stopSpeaking } from '../utils/audio.ts';

interface AlexaDisplayProps {
  homeState: HomeState;
  messages: AgentChatMessage[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
  onMorningCheckin: () => void;
  onSafetyResponse: (answer: 'yes' | 'no') => void;
  onUnresponsiveTimeout: () => void;
  onResetSession: () => void;
  suggestedReplies: string[];
  onOpenProfileModal?: () => void;
}

export const AlexaDisplay: React.FC<AlexaDisplayProps> = ({
  homeState,
  messages,
  isThinking,
  onSendMessage,
  onMorningCheckin,
  onSafetyResponse,
  onUnresponsiveTimeout,
  onResetSession,
  suggestedReplies,
  onOpenProfileModal,
}) => {
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [seniorFontMode, setSeniorFontMode] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Real-Time live ticking clock
  const [liveClock, setLiveClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [liveDate, setLiveDate] = useState(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLiveDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Speech output for latest assistant message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant' && !lastMsg.isSpoken && speechEnabled) {
      playAlexaChime();
      setIsSpeaking(true);
      speakText(lastMsg.content, () => {
        setIsSpeaking(false);
        lastMsg.isSpoken = true;
      });
    }
  }, [messages, speechEnabled]);

  // Emergency sound when state turns emergency
  useEffect(() => {
    if (homeState.safetyState === 'emergency_dispatched') {
      playEmergencyAlertChime();
    }
  }, [homeState.safetyState]);

  // Handle 30s safety verification countdown
  useEffect(() => {
    if (homeState.safetyState === 'verifying_safety') {
      setCountdown(30);
      playEmergencyAlertChime();
    } else {
      setCountdown(null);
    }
  }, [homeState.safetyState]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      onUnresponsiveTimeout();
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, onUnresponsiveTimeout]);

  // Setup Web Speech API for real voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputMessage(transcript);
            onSendMessage(transcript);
          }
          setIsListening(false);
        };
        recognition.onerror = () => {
          setIsListening(false);
        };
        recognition.onend = () => {
          setIsListening(false);
        };
        recognitionRef.current = recognition;
      }
    }
  }, [onSendMessage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        stopSpeaking();
        setIsSpeaking(false);
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isThinking) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const currentRingState = () => {
    if (homeState.safetyState === 'emergency_dispatched') return 'emergency';
    if (homeState.safetyState === 'verifying_safety') return 'verifying_safety';
    if (isThinking) return 'thinking';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  return (
    <div className="relative flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-2xl overflow-hidden">
      {/* Top Smart Display Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Sparkles className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-stone-100 text-lg">CareContext</span>
              <span className="text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                Alexa+ Skill
              </span>
              <span className="text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MCP Active
              </span>
            </div>
            <div className="text-xs text-stone-400 flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                Companion for{' '}
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="text-amber-300 hover:text-amber-200 font-semibold underline decoration-dotted flex items-center gap-1 cursor-pointer"
                  title="Click to customize resident name & profile"
                >
                  <span>{homeState.userName}</span>
                  <span className="text-[11px] text-stone-400">({homeState.userAge})</span>
                </button>
              </span>
              <span>•</span>
              <span className="text-amber-300/90 font-medium">Inferred: {homeState.currentRoom}</span>
            </div>
          </div>
        </div>

        {/* Accessibility & Audio Controls */}
        <div className="flex items-center gap-2">
          {/* Senior Text Size Toggle */}
          <button
            onClick={() => setSeniorFontMode(!seniorFontMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              seniorFontMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
            }`}
            title="Toggle Large Elder-Accessible Text Mode"
          >
            {seniorFontMode ? 'Senior Font: Large' : 'Senior Font: Standard'}
          </button>

          {/* Voice Speech Toggle */}
          <button
            onClick={() => {
              if (speechEnabled) stopSpeaking();
              setSpeechEnabled(!speechEnabled);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              speechEnabled
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-stone-800 border-stone-700 text-stone-400'
            }`}
            title={speechEnabled ? 'Voice Output Enabled' : 'Voice Output Muted'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset Conversation */}
          <button
            onClick={onResetSession}
            className="p-2 rounded-lg bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 hover:bg-stone-700/80 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Alexa Ambient Interactive Column */}
        <div className="md:w-80 p-6 bg-stone-950/40 border-r border-stone-800/80 flex flex-col items-center justify-between text-center gap-6">
          {/* Real-Time Ambient Clock & Date */}
          <div className="w-full bg-stone-900/80 border border-stone-800 rounded-xl p-4 shadow-inner">
            <div className="flex items-center justify-center gap-1.5 text-stone-400 text-xs font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real-Time Clock • Local</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-stone-100 font-mono">
              {liveClock}
            </div>
            <div className="text-xs text-amber-300/90 font-medium mt-1">
              {liveDate}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Expected wake: <span className="text-stone-200 font-medium">{homeState.routineBaselineWake}</span>
            </div>
          </div>

          {/* Alexa Visual Light Ring & Pulse */}
          <div className="my-auto flex flex-col items-center">
            <AlexaLightRing state={currentRingState()} size="md" />

            <div className="mt-4 max-w-[220px]">
              {homeState.safetyState === 'emergency_dispatched' ? (
                <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-2.5 text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Caregiver Alert Dispatched to Sarah Miller</span>
                </div>
              ) : homeState.safetyState === 'verifying_safety' ? (
                <div className="bg-amber-950/80 border border-amber-600/50 rounded-xl p-2.5 text-amber-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Safety Check In Progress</span>
                </div>
              ) : (
                <div className="text-xs text-stone-400">
                  {isSpeaking ? (
                    <span className="text-cyan-300 font-medium flex items-center justify-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Speaking warmly to {homeState.userName}...
                    </span>
                  ) : isThinking ? (
                    <span className="text-sky-300 font-medium flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Querying Ring MCP Tools...
                    </span>
                  ) : isListening ? (
                    <span className="text-teal-300 font-medium flex items-center justify-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 animate-bounce" /> Listening to {homeState.userName}...
                    </span>
                  ) : (
                    <span>CareContext is monitoring home context proactively</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button: Morning Check-In Hero */}
          <div className="w-full space-y-2">
            <button
              onClick={onMorningCheckin}
              disabled={isThinking}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
            >
              <Coffee className="w-5 h-5 text-stone-950 transition-transform group-hover:scale-110" />
              <span>Simulate Morning Check-in</span>
            </button>
            <p className="text-[11px] text-stone-400">
              Triggers silent <code className="text-cyan-300 font-mono">get_ring_sensor_data</code> MCP tool call before greeting.
            </p>
          </div>
        </div>

        {/* Right Conversational Stream Column */}
        <div className="flex-1 flex flex-col h-full bg-stone-900/50">
          {/* Emergency Safety Alert Priority Banner if in Safety Verification */}
          {homeState.safetyState === 'verifying_safety' && (
            <div className="bg-amber-950/90 border-b border-amber-600/40 p-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-100 text-base flex items-center gap-2">
                      <span>Safety Verification Protocol Active</span>
                      {countdown !== null && (
                        <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700">
                          Auto-alert {homeState.caregiverName || 'Caregiver'} in {countdown}s
                        </span>
                      )}
                    </h3>
                    <p className="text-amber-200/90 text-sm mt-0.5">
                      CareContext is checking if {homeState.userName} needs immediate help.
                    </p>
                  </div>
                </div>

                {/* Big Accessible Yes / No Verification Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSafetyResponse('yes')}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yes, I&apos;m Okay</span>
                  </button>
                  <button
                    onClick={() => onSafetyResponse('no')}
                    className="px-4 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>No, Need Help!</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Dispatched Banner */}
          {homeState.safetyState === 'emergency_dispatched' && (
            <div className="bg-rose-950/90 border-b border-rose-600/50 p-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-rose-100 text-base flex items-center gap-2">
                      <span>Caregiver Emergency Dispatched</span>
                      <span className="text-xs bg-rose-900 text-rose-300 px-2 py-0.5 rounded-full border border-rose-700">
                        High Priority SMS Delivered
                      </span>
                    </h3>
                    <p className="text-rose-200/90 text-sm">
                      {homeState.caregiverName || 'Sarah Miller'} was notified at {homeState.caregiverPhone || '+1 (555) 234-8901'} with home telemetry snapshot.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSafetyResponse('yes')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-600"
                  >
                    Mark {homeState.userName} Safe & Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message History Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400">
                <div className="w-16 h-16 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-stone-200 font-semibold text-lg">Good Morning, {homeState.userName}</h3>
                <p className="text-stone-400 text-sm max-w-md mt-1">
                  CareContext has been quietly monitoring home motion and door sensors. Click{' '}
                  <span className="text-amber-300 font-medium">&quot;Simulate Morning Check-in&quot;</span>{' '}
                  or speak to begin today&apos;s check-in.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={onMorningCheckin}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Morning Check-in</span>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.3)] mt-1">
                    <Sparkles className="w-5 h-5 text-stone-950" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-amber-600/25 border border-amber-500/30 text-stone-100 rounded-tr-sm'
                      : 'bg-stone-800/90 border border-stone-700/80 text-stone-100 rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                      {msg.role === 'assistant' ? (
                        <span className="text-cyan-300">CareContext (Alexa+)</span>
                      ) : (
                        <span className="text-amber-300 flex items-center gap-1">
                          <User className="w-3 h-3" /> Eleanor
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  <div
                    className={`${
                      seniorFontMode ? 'text-lg leading-relaxed font-serif' : 'text-sm leading-normal'
                    } text-stone-100`}
                  >
                    {msg.content}
                  </div>

                  {/* MCP Tool Inspection Badges */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-700/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                        MCP Tools Called:
                      </span>
                      {msg.toolCalls.map((tc) => (
                        <span
                          key={tc.id}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-cyan-300 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          {tc.tool}
                          <span className="text-stone-400 text-[10px]">({tc.latencyMs}ms)</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Internal Reasoning Insight */}
                  {msg.thought && (
                    <div className="mt-2 text-xs text-stone-400/90 italic bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                      <span className="font-semibold text-stone-300 not-italic mr-1">Context Analysis:</span>
                      {msg.thought}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-5 h-5 text-amber-300" />
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-10 h-10 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-spin" />
                </div>
                <div className="bg-stone-800/80 border border-stone-700 rounded-2xl rounded-tl-sm p-4 text-sm text-stone-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-stone-400 font-medium ml-1">
                    Querying Ring MCP telemetry and formulating companion response...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Accessible Quick Response Buttons (Elderly-Friendly One-Tap) */}
          <div className="px-6 py-2 bg-stone-950/60 border-t border-stone-800/60">
            <div className="text-[11px] font-semibold text-stone-400 mb-1.5 flex items-center justify-between">
              <span>Quick Replies (One-Tap for Eleanor):</span>
              <span className="text-stone-400">Click or use microphone below</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(reply)}
                  disabled={isThinking}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-amber-500/40 transition-colors disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Speech Input & Custom Message Form */}
          <form
            onSubmit={handleSend}
            className="p-4 bg-stone-950/90 border-t border-stone-800 flex items-center gap-3"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                  : 'bg-stone-800 text-cyan-300 border-stone-700 hover:bg-stone-700 hover:border-cyan-500/40'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak via Microphone'}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-stone-400" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isListening ? 'Listening to speech...' : 'Type Eleanor’s response or speak above...'}
              disabled={isThinking}
              className="flex-1 bg-stone-800/90 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder:text-stone-400 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isThinking}
              className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition-all shrink-0 cursor-pointer"
              title="Send to CareContext"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
