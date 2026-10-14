import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  Clock,
  Code2,
  Cpu,
  Heart,
  Home,
  Layers,
  MessageSquare,
  Phone,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  Volume2,
} from 'lucide-react';
import { AlexaDisplay } from './components/AlexaDisplay.tsx';
import { HomeSensorMap } from './components/HomeSensorMap.tsx';
import { DailyScheduleCard } from './components/DailyScheduleCard.tsx';
import { CaregiverHub } from './components/CaregiverHub.tsx';
import { McpInspector } from './components/McpInspector.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import type {
  AgentChatMessage,
  FloorPlanId,
  HomeState,
  McpToolCall,
  ScheduleItem,
} from './types/careContext.ts';
import {
  INITIAL_HOME_STATE,
  loadClientHomeState,
  saveClientHomeState,
  applyScenarioToState,
  applySensorTriggerToState,
  applyFloorPlanToState,
  getEffectiveTime,
} from './utils/clientState.ts';
import { executeClientAgentConversation } from './utils/clientAgent.ts';

const DEFAULT_STATE: HomeState = INITIAL_HOME_STATE;

export default function App() {
  const [activeTab, setActiveTab] = useState<'alexa' | 'sensors' | 'schedule' | 'caregiver' | 'mcp'>('alexa');
  const [homeState, setHomeState] = useState<HomeState>(DEFAULT_STATE);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [liveClock, setLiveClock] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [liveDate, setLiveDate] = useState(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  );

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLiveDate(new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
    "I'm feeling good, just making tea",
    'I already took my blood pressure pill',
    'Feeling a little dizzy this morning...',
    "What's on my schedule for today?",
  ]);

  // Fetch initial home state from backend or local storage
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
        return;
      }
    } catch (err) {
      // Backend not running (e.g. Netlify static deploy)
    }
    // Fallback to local storage or defaults
    const local = loadClientHomeState();
    setHomeState(local);
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Send message / invoke agent
  const sendAgentRequest = async (payload: {
    message?: string;
    triggerType?: 'morning_checkin' | 'user_speech' | 'safety_response' | 'unresponsive_timeout' | 'emergency_sos';
    safetyAnswer?: 'yes' | 'no';
  }) => {
    setIsThinking(true);

    // If it's a user speech message, append to local chat immediately
    if (payload.message) {
      const userMsg: AgentChatMessage = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: payload.message,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const historyPayload = messages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Try server endpoint first
      let data: any = null;
      try {
        const res = await fetch('/api/mcp/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            history: historyPayload,
          }),
        });

        if (res.ok) {
          data = await res.json();
        }
      } catch (networkErr) {
        // Backend not available (Netlify, static hosting)
      }

      // If backend responded with 404/500/offline, use client agent execution
      if (!data || !data.text) {
        data = executeClientAgentConversation(homeState, {
          ...payload,
          history: historyPayload,
        });
      }

      const assistantMsg: AgentChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        thought: data.thought,
        toolCalls: data.toolCalls,
        safetyState: data.safetyState,
        isSpoken: false,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.homeState) {
        setHomeState(data.homeState);
        saveClientHomeState(data.homeState);
      }
      if (data.suggestedReplies) {
        setSuggestedReplies(data.suggestedReplies);
      }
    } catch (err) {
      console.error('Error in agent request:', err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleMorningCheckin = () => {
    sendAgentRequest({ triggerType: 'morning_checkin' });
  };

  const handleSendMessage = (text: string) => {
    sendAgentRequest({ message: text, triggerType: 'user_speech' });
  };

  const handleSafetyResponse = (answer: 'yes' | 'no') => {
    sendAgentRequest({ triggerType: 'safety_response', safetyAnswer: answer });
  };

  const handleUnresponsiveTimeout = () => {
    sendAgentRequest({ triggerType: 'unresponsive_timeout' });
  };

  const handleEmergencySOS = () => {
    sendAgentRequest({ triggerType: 'emergency_sos' });
  };

  const handleSelectScenario = async (scenarioKey: string) => {
    // Optimistic / fallback client state
    const nextState = applyScenarioToState(homeState, scenarioKey);
    setHomeState(nextState);

    try {
      const res = await fetch('/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleTriggerSensor = async (sensorId: string, eventType: string, detail?: string) => {
    // Optimistic / fallback client state
    const nextState = applySensorTriggerToState(homeState, sensorId, eventType, detail);
    setHomeState(nextState);

    try {
      const res = await fetch('/api/sensors/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorId, eventType, detail }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleSelectFloorPlan = async (floorPlanId: FloorPlanId, level?: string) => {
    const nextState = applyFloorPlanToState(homeState, floorPlanId, level);
    setHomeState(nextState);

    try {
      const res = await fetch('/api/floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorPlanId, level }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState((prev) => ({
          ...prev,
          floorPlanId: data.floorPlanId || floorPlanId,
          activeFloorLevel: data.activeFloorLevel || level,
        }));
      }
    } catch (e) {
      // Offline fallback already updated client state
    }
  };

  const handleToggleScheduleItem = async (itemId: string, completed: boolean) => {
    // Optimistic client update
    const updatedSchedule = homeState.schedule.map((item) => {
      if (item.id === itemId) {
        const isDone = completed !== undefined ? completed : !item.isCompleted;
        return {
          ...item,
          isCompleted: isDone,
          completedAt: isDone ? getEffectiveTime(homeState) : undefined,
        };
      }
      return item;
    });
    const nextState: HomeState = { ...homeState, schedule: updatedSchedule };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const res = await fetch('/api/schedule/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, completed }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleSaveProfile = async (profile: {
    userName: string;
    userAge: number;
    homeAddress: string;
    caregiverName?: string;
    caregiverPhone?: string;
    caregiverRelationship?: string;
    useLiveTime?: boolean;
    currentTime?: string;
  }) => {
    const nextState: HomeState = {
      ...homeState,
      ...profile,
    };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const res = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleSaveScheduleItem = async (item: Partial<ScheduleItem>) => {
    let nextSchedule = [...homeState.schedule];
    if (item.id) {
      nextSchedule = nextSchedule.map((s) => (s.id === item.id ? ({ ...s, ...item } as ScheduleItem) : s));
    } else {
      const newItem: ScheduleItem = {
        id: `sched-${Date.now()}`,
        time: item.time || '09:00 AM',
        title: item.title || 'New Item',
        category: item.category || 'activity',
        details: item.details || '',
        isCompleted: false,
        isCritical: item.isCritical || false,
      };
      nextSchedule.push(newItem);
    }
    const nextState: HomeState = { ...homeState, schedule: nextSchedule };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const endpoint = item.id ? '/api/schedule/update' : '/api/schedule/add';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleDeleteScheduleItem = async (itemId: string) => {
    const nextSchedule = homeState.schedule.filter((s) => s.id !== itemId);
    const nextState: HomeState = { ...homeState, schedule: nextSchedule };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const res = await fetch('/api/schedule/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleRespondAlert = async (alertId: string, replyText: string) => {
    const updatedAlerts = homeState.alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'Caregiver Responded' as const,
          caregiverResponseText: replyText || "I'm 5 minutes away, Mom! Calling your Alexa right now.",
          responseTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return a;
    });
    const nextState: HomeState = { ...homeState, alerts: updatedAlerts };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const res = await fetch('/api/alerts/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, responseText: replyText }),
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleClearAlerts = async () => {
    const nextState: HomeState = { ...homeState, alerts: [], safetyState: 'normal' };
    setHomeState(nextState);
    saveClientHomeState(nextState);

    try {
      const res = await fetch('/api/alerts/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setHomeState(data);
        saveClientHomeState(data);
      }
    } catch (e) {
      // Backend unavailable, client state is already updated
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    handleClearAlerts();
    handleSelectScenario('kitchen_routine');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Main Navigation Bar */}
      <header className="border-b border-stone-800 bg-stone-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Agent Skill Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Sparkles className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-stone-100">
                  CareContext
                </h1>
                <span className="text-[11px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                  Alexa+ Agent Skill
                </span>
                <span className="text-[11px] font-semibold bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  Bedrock & MCP Integrated
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-stone-400">
                  Companion for{' '}
                  <span className="text-amber-300 font-semibold">{homeState.userName} ({homeState.userAge})</span>
                </p>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 border border-stone-700 text-[10px] text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Customize resident name, age, caregiver, and clock"
                >
                  <User className="w-3 h-3 text-amber-400" />
                  <span>Change Name & Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-2 text-xs">
            {/* Live Clock & Date Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs text-stone-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>{liveClock}</span>
              <span className="text-stone-500">•</span>
              <span className="text-amber-300/90">{liveDate}</span>
            </div>

            {/* Emergency SOS Quick Button */}
            {homeState.safetyState === 'emergency_dispatched' ? (
              <button
                type="button"
                onClick={() => handleSafetyResponse('yes')}
                className="px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset emergency state and mark resident safe"
              >
                <span>Reset to Safe</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEmergencySOS}
                className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/60 active:scale-95 transition-all cursor-pointer"
                title="Dispatch Immediate Emergency SOS to Caregiver"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Emergency SOS</span>
              </button>
            )}

            {homeState.safetyState === 'emergency_dispatched' ? (
              <span className="bg-rose-950 text-rose-300 border border-rose-700/60 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Emergency Alert Active</span>
              </span>
            ) : homeState.safetyState === 'verifying_safety' ? (
              <span className="bg-amber-950 text-amber-300 border border-amber-700/60 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Safety Verification</span>
              </span>
            ) : (
              <span className="bg-stone-900 border border-stone-800 px-3 py-1 rounded-full text-stone-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Home Normal • {homeState.userName} in <strong>{homeState.currentRoom}</strong></span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 py-1.5 border-t border-stone-800/50">
          <button
            onClick={() => setActiveTab('alexa')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'alexa'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Echo Show Display ({homeState.userName})</span>
            {messages.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 text-[10px] flex items-center justify-center font-mono">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'sensors'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span>Ring Sensors & Floor Plan</span>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">
              [get_ring_sensor_data]
            </span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Daily Schedule & Meds</span>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">
              [get_daily_schedule]
            </span>
          </button>

          <button
            onClick={() => setActiveTab('caregiver')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'caregiver'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Caregiver Dispatch (Sarah)</span>
            {homeState.alerts.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                {homeState.alerts.length}
              </span>
            )}
            <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-mono">
              [alert_family_contact]
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'mcp'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>MCP Protocol Inspector</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
              {homeState.mcpLogs.length} RPCs
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col min-h-0">
        {/* Instruction Guidance Ribbon */}
        <div className="mb-4 bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-900 border border-stone-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider text-[10px]">
              Active Skill Profile
            </span>
            <span className="text-stone-200 font-medium">
              CareContext Proactive Alexa+ Agent Skill
            </span>
            <span className="text-stone-400 hidden md:inline">
              • Silent sensor discovery on check-in • Observant natural phrasing • Gentle schedule reminders • Safety verification
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMorningCheckin}
              disabled={isThinking}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Check-in</span>
            </button>
            <button
              onClick={handleResetSession}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset conversation session"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 min-h-[580px] flex flex-col">
          {activeTab === 'alexa' && (
            <AlexaDisplay
              homeState={homeState}
              messages={messages}
              isThinking={isThinking}
              onSendMessage={handleSendMessage}
              onMorningCheckin={handleMorningCheckin}
              onSafetyResponse={handleSafetyResponse}
              onUnresponsiveTimeout={handleUnresponsiveTimeout}
              onEmergencySOS={handleEmergencySOS}
              onResetSession={handleResetSession}
              suggestedReplies={suggestedReplies}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
            />
          )}

          {activeTab === 'sensors' && (
            <HomeSensorMap
              homeState={homeState}
              onSelectScenario={handleSelectScenario}
              onTriggerSensor={handleTriggerSensor}
              onSelectFloorPlan={handleSelectFloorPlan}
            />
          )}

          {activeTab === 'schedule' && (
            <DailyScheduleCard
              schedule={homeState.schedule}
              onToggleScheduleItem={handleToggleScheduleItem}
              onSaveScheduleItem={handleSaveScheduleItem}
              onDeleteScheduleItem={handleDeleteScheduleItem}
            />
          )}

          {activeTab === 'caregiver' && (
            <CaregiverHub
              alerts={homeState.alerts}
              onRespondAlert={handleRespondAlert}
              onClearAlerts={handleClearAlerts}
            />
          )}

          {activeTab === 'mcp' && <McpInspector logs={homeState.mcpLogs} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950 py-3 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>CareContext • Alexa+ Companion Skill with Model Context Protocol (MCP)</span>
          <span className="text-stone-400 font-mono text-[11px]">
            Tools: [get_ring_sensor_data], [get_daily_schedule], [alert_family_contact]
          </span>
        </div>
      </footer>

      {/* Resident Profile & Companion Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        homeState={homeState}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
