import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DoorClosed,
  DoorOpen,
  Droplets,
  Eye,
  Footprints,
  Flame,
  Home,
  Layers,
  MapPin,
  Maximize2,
  Pause,
  Pill,
  Play,
  PlusCircle,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  SkipForward,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { FloorPlanConfig, FloorPlanId, HomeState, RingSensor, SensorEvent } from '../types/careContext.ts';
import { FLOOR_PLANS } from '../utils/clientState.ts';
import { playAlexaChime, playEmergencyAlertChime, playSensorChime } from '../utils/audio.ts';

interface HomeSensorMapProps {
  homeState: HomeState;
  onSelectScenario: (scenarioKey: string) => void;
  onTriggerSensor: (sensorId: string, eventType: string, detail?: string) => void;
  onSelectFloorPlan?: (floorPlanId: FloorPlanId, level?: string) => void;
}

interface RoutineStep {
  sensorId: string;
  eventType: string;
  room: string;
  label: string;
  detail: string;
  delayMs: number;
}

interface RoutineSequence {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  description: string;
  steps: RoutineStep[];
}

const AUTOMATED_ROUTINES: RoutineSequence[] = [
  {
    id: 'morning_wakeup',
    title: 'Morning Wake-Up & Breakfast Routine',
    tagline: 'Normal early-morning transition from bed to kitchen',
    badge: 'Baseline Routine',
    description: 'Simulates bed exit, bedroom dressing motion, morning bathroom vanity, and kitchen coffee preparation.',
    steps: [
      {
        sensorId: 'ring_bed_pressure',
        eventType: 'bed_exit',
        room: 'Bedroom',
        label: '1. Bed Exit Detected',
        detail: 'Eleanor rises from bed at 6:15 AM (45 min earlier than baseline)',
        delayMs: 1400,
      },
      {
        sensorId: 'ring_bedroom_motion',
        eventType: 'motion_detected',
        room: 'Bedroom',
        label: '2. Bedroom Motion Active',
        detail: 'Movement detected around nightstand and closet dresser',
        delayMs: 1600,
      },
      {
        sensorId: 'ring_bathroom_motion',
        eventType: 'motion_detected',
        room: 'Bathroom',
        label: '3. En-suite Bathroom Wash',
        detail: 'Morning washroom routine active at vanity and grab bars',
        delayMs: 1800,
      },
      {
        sensorId: 'ring_kitchen_motion',
        eventType: 'motion_detected',
        room: 'Kitchen',
        label: '4. Kitchen Counter Motion',
        detail: 'Active motion near breakfast counter and electric kettle',
        delayMs: 1800,
      },
      {
        sensorId: 'ring_fridge_contact',
        eventType: 'door_opened',
        room: 'Kitchen',
        label: '5. Refrigerator Opened',
        detail: 'Refrigerator opened for milk & breakfast preparation',
        delayMs: 1600,
      },
    ],
  },
  {
    id: 'medication_adherence',
    title: 'Medication Adherence Routine',
    tagline: 'Morning Lisinopril intake verification',
    badge: 'Health Protocol',
    description: 'Simulates resident moving to the bathroom, opening the medicine cabinet, and automatically marking daily blood pressure medication as taken.',
    steps: [
      {
        sensorId: 'ring_living_room_motion',
        eventType: 'motion_detected',
        room: 'Living Room',
        label: '1. Rises from Living Room Armchair',
        detail: 'Resident stands up from reading armchair',
        delayMs: 1500,
      },
      {
        sensorId: 'ring_bathroom_motion',
        eventType: 'motion_detected',
        room: 'Bathroom',
        label: '2. Enters Bathroom',
        detail: 'Movement detected approaching vanity',
        delayMs: 1600,
      },
      {
        sensorId: 'ring_medicine_cabinet',
        eventType: 'door_opened',
        room: 'Bathroom',
        label: '3. Medicine Cabinet Opened',
        detail: 'Magnetic sensor detects cabinet open - Lisinopril 10mg taken with water',
        delayMs: 1800,
      },
      {
        sensorId: 'ring_medicine_cabinet',
        eventType: 'door_closed',
        room: 'Bathroom',
        label: '4. Medicine Cabinet Closed & Secured',
        detail: 'Daily pill container returned and magnetic seal verified',
        delayMs: 1500,
      },
    ],
  },
  {
    id: 'night_wandering',
    title: 'Late Night Wandering / Exit Alert',
    tagline: '2:15 AM unusual nocturnal activity',
    badge: 'Safety Alert',
    description: 'Simulates middle-of-the-night bed exit followed by an unexpected front door opening, demonstrating Alexa proactive inquiry.',
    steps: [
      {
        sensorId: 'ring_bed_pressure',
        eventType: 'bed_exit',
        room: 'Bedroom',
        label: '1. 02:15 AM Bed Exit',
        detail: 'Nocturnal bed exit outside normal wake baseline',
        delayMs: 1500,
      },
      {
        sensorId: 'ring_bedroom_motion',
        eventType: 'motion_detected',
        room: 'Bedroom',
        label: '2. Transit Through Bedroom',
        detail: 'Slow movement detected heading towards corridor',
        delayMs: 1600,
      },
      {
        sensorId: 'ring_front_door',
        eventType: 'door_opened',
        room: 'Front Entry',
        label: '3. Front Entry Door Opened',
        detail: 'Front deadbolt unlocked and door opened at night',
        delayMs: 1800,
      },
    ],
  },
  {
    id: 'water_leak_emergency',
    title: 'Plumbing Leak Detection Emergency',
    tagline: 'Under-sink pipe rupture detection',
    badge: 'Urgent Hazard',
    description: 'Simulates kitchen motion followed by Ring Water & Freeze Sensor detecting moisture, automatically triggering urgent caregiver alert.',
    steps: [
      {
        sensorId: 'ring_kitchen_motion',
        eventType: 'motion_detected',
        room: 'Kitchen',
        label: '1. Kitchen Activity',
        detail: 'Resident operating breakfast sink faucet',
        delayMs: 1500,
      },
      {
        sensorId: 'ring_kitchen_water_leak',
        eventType: 'water_leak',
        room: 'Kitchen',
        label: '2. Ring Sensor Detects Water Pool',
        detail: 'Under-sink probe detects moisture pooling on cabinet floor',
        delayMs: 1800,
      },
    ],
  },
];

export const HomeSensorMap: React.FC<HomeSensorMapProps> = ({
  homeState,
  onSelectScenario,
  onTriggerSensor,
  onSelectFloorPlan,
}) => {
  // Current active floor plan
  const activePlanId: FloorPlanId = homeState.floorPlanId || 'ranch_single_story';
  const activePlanConfig =
    FLOOR_PLANS.find((f) => f.id === activePlanId) || FLOOR_PLANS[0];

  // Active level state (for multi-level floor plans like Townhouse)
  const [selectedLevel, setSelectedLevel] = useState<string>(
    homeState.activeFloorLevel || activePlanConfig.levels[0] || 'Ground Floor'
  );

  // Sync selected level when plan changes
  useEffect(() => {
    if (activePlanConfig.levels.length > 0 && !activePlanConfig.levels.includes(selectedLevel)) {
      setSelectedLevel(activePlanConfig.levels[0]);
    }
  }, [activePlanId, activePlanConfig, selectedLevel]);

  // Simulation studio state
  const [activeStudioTab, setActiveStudioTab] = useState<'quick' | 'routines' | 'custom'>('quick');

  // Automated Routine Playback State
  const [activeRoutineId, setActiveRoutineId] = useState<string>('morning_wakeup');
  const [isPlayingRoutine, setIsPlayingRoutine] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const routineTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom Event Injector State
  const [customSensorId, setCustomSensorId] = useState<string>('');
  const [customEventType, setCustomEventType] = useState<string>('motion_detected');
  const [customDetail, setCustomDetail] = useState<string>('');

  // Telemetry Filter State
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [copiedMcp, setCopiedMcp] = useState<boolean>(false);

  // Helper to find a sensor in homeState.sensors
  const getSensor = (id: string): RingSensor | undefined => {
    return homeState.sensors.find((s) => s.id === id);
  };

  const isCurrentRoom = (roomName: string) => {
    return homeState.currentRoom.toLowerCase() === roomName.toLowerCase();
  };

  // Trigger sensor with chime feedback
  const handleTriggerWithFeedback = (sensorId: string, eventType: string, detail?: string) => {
    if (eventType === 'water_leak' || eventType === 'glass_break') {
      playEmergencyAlertChime();
    } else {
      playSensorChime();
    }
    onTriggerSensor(sensorId, eventType, detail);
  };

  // Set default custom sensor when plan changes
  useEffect(() => {
    if (homeState.sensors.length > 0 && !customSensorId) {
      setCustomSensorId(homeState.sensors[0].id);
    }
  }, [homeState.sensors, customSensorId]);

  // Automated routine playback runner
  const currentRoutine =
    AUTOMATED_ROUTINES.find((r) => r.id === activeRoutineId) || AUTOMATED_ROUTINES[0];

  useEffect(() => {
    if (!isPlayingRoutine) {
      if (routineTimerRef.current) clearTimeout(routineTimerRef.current);
      return;
    }

    if (currentStepIndex >= currentRoutine.steps.length) {
      setIsPlayingRoutine(false);
      playAlexaChime();
      return;
    }

    const step = currentRoutine.steps[currentStepIndex];
    if (step) {
      handleTriggerWithFeedback(step.sensorId, step.eventType, step.detail);
    }

    routineTimerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, step?.delayMs || 1600);

    return () => {
      if (routineTimerRef.current) clearTimeout(routineTimerRef.current);
    };
  }, [isPlayingRoutine, currentStepIndex, activeRoutineId]);

  const handleStartRoutine = () => {
    setCurrentStepIndex(0);
    setIsPlayingRoutine(true);
  };

  const handlePauseRoutine = () => {
    setIsPlayingRoutine(false);
  };

  const handleStepRoutine = () => {
    const nextIdx = currentStepIndex + 1 >= currentRoutine.steps.length ? 0 : currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    const step = currentRoutine.steps[nextIdx];
    if (step) {
      handleTriggerWithFeedback(step.sensorId, step.eventType, step.detail);
    }
  };

  const handleResetRoutine = () => {
    setIsPlayingRoutine(false);
    setCurrentStepIndex(-1);
  };

  // Handle Floor Plan Switch
  const handleFloorPlanChange = (planId: FloorPlanId) => {
    if (onSelectFloorPlan) {
      const cfg = FLOOR_PLANS.find((f) => f.id === planId);
      const lvl = cfg?.levels[0] || 'Ground Floor';
      setSelectedLevel(lvl);
      onSelectFloorPlan(planId, lvl);
      playSensorChime();
    }
  };

  // Filtered rooms for the active floor plan and level
  const displayedRooms = activePlanConfig.rooms.filter((room) => {
    if (activePlanConfig.levels.length <= 1) return true;
    if (selectedLevel === 'All Levels') return true;
    return room.level === selectedLevel;
  });

  // Filtered sensor events
  const filteredEvents = homeState.events.filter((ev) => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'motion') return ev.eventType.includes('motion') || ev.eventType === 'bed_exit';
    if (eventFilter === 'doors') return ev.eventType.includes('door') || ev.eventType.includes('window');
    if (eventFilter === 'safety') return ev.eventType === 'water_leak' || ev.eventType === 'glass_break';
    return ev.room.toLowerCase() === eventFilter.toLowerCase();
  });

  // Helper for sensor state badge styles
  const renderSensorStateBadge = (sensor: RingSensor) => {
    if (sensor.state === 'active') {
      return (
        <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
          <Activity className="w-2.5 h-2.5 text-amber-400" />
          <span>Active</span>
        </span>
      );
    }
    if (sensor.state === 'open') {
      return (
        <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-2 py-0.5 rounded flex items-center gap-1">
          <DoorOpen className="w-2.5 h-2.5 text-cyan-400" />
          <span>Open</span>
        </span>
      );
    }
    if (sensor.state === 'leak_detected') {
      return (
        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/90 border border-rose-500/70 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
          <Droplets className="w-2.5 h-2.5 text-rose-400" />
          <span>LEAK DETECTED</span>
        </span>
      );
    }
    if (sensor.state === 'alert') {
      return (
        <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/90 border border-rose-500/70 px-2 py-0.5 rounded flex items-center gap-1">
          <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
          <span>ALERT</span>
        </span>
      );
    }
    if (sensor.state === 'safe') {
      return (
        <span className="text-[10px] font-medium text-emerald-300/80 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
          Normal
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-stone-400 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">
        {sensor.state === 'closed' ? 'Closed' : 'Clear'}
      </span>
    );
  };

  // Helper for sensor icon
  const renderSensorIcon = (sensor: RingSensor) => {
    switch (sensor.type) {
      case 'pressure':
        return <Footprints className="w-4 h-4 text-cyan-400" />;
      case 'door_contact':
        return sensor.state === 'open' ? (
          <DoorOpen className="w-4 h-4 text-cyan-400" />
        ) : (
          <DoorClosed className="w-4 h-4 text-stone-400" />
        );
      case 'window_contact':
        return <Maximize2 className="w-4 h-4 text-sky-400" />;
      case 'water_freeze':
        return <Droplets className={`w-4 h-4 ${sensor.state === 'leak_detected' ? 'text-rose-400 animate-pulse' : 'text-blue-400'}`} />;
      case 'glass_break':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'doorbell':
        return <Bell className="w-4 h-4 text-emerald-400" />;
      case 'motion':
      default:
        return (
          <Activity
            className={`w-4 h-4 ${sensor.state === 'active' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`}
          />
        );
    }
  };

  // Copy MCP payload to clipboard
  const handleCopyMcp = () => {
    const payload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'get_ring_sensor_data',
        arguments: {
          hours: 6,
          residenceLayout: activePlanConfig.name,
          currentRoom: homeState.currentRoom,
          activeSensorsCount: homeState.sensors.filter((s) => s.state === 'active' || s.state === 'open').length,
          eventsLogged: homeState.events.length,
        },
      },
      currentTelemetry: homeState.events.slice(0, 10),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(() => {});
    setCopiedMcp(true);
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  // Total active sensors count
  const activeSensorsCount = homeState.sensors.filter(
    (s) => s.state === 'active' || s.state === 'open' || s.state === 'leak_detected'
  ).length;

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
      {/* Top Header & Residence Location Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-stone-950/90 border-b border-stone-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-stone-100 text-lg">
              Ring Sensors & Floor Plan Studio
            </h2>
            <span className="text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
              MCP Live Feed
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Model Context Protocol telemetry stream for Amazon Alexa Care Agent · {homeState.sensors.length} Connected Ring Sensors
          </p>
        </div>

        {/* Current Location & Sensor Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-900/90 border border-stone-700/80 px-3 py-1.5 rounded-xl">
            <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-stone-400">Current Room: </span>
              <strong className="text-emerald-300 font-semibold">{homeState.currentRoom}</strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-900/90 border border-stone-700/80 px-3 py-1.5 rounded-xl text-xs text-stone-300">
            <Radio className={`w-3.5 h-3.5 ${activeSensorsCount > 0 ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
            <span>
              <strong className={activeSensorsCount > 0 ? 'text-amber-300' : 'text-stone-300'}>
                {activeSensorsCount}
              </strong>{' '}
              Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* FLOOR PLAN SELECTOR STRIP */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                Select Residence Floor Plan:
              </span>
            </div>
            <span className="text-xs text-stone-400">
              Interactive architectural blueprints tailored for senior independent living
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FLOOR_PLANS.map((plan) => {
              const isSelected = plan.id === activePlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleFloorPlanChange(plan.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
                      : 'bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                        {plan.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">{plan.tagline}</p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-500/20 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-stone-400">
                    <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {plan.rooms.length} Rooms
                    </span>
                    <span className="bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                      {plan.levels.join(', ')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Level Switcher (If Multi-Level Floor Plan) */}
          {activePlanConfig.levels.length > 1 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-800/80">
              <span className="text-xs text-stone-400 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Floor Level:
              </span>
              <div className="flex items-center gap-1.5">
                {activePlanConfig.levels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setSelectedLevel(lvl);
                      playSensorChime();
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedLevel === lvl
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm'
                        : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel('All Levels');
                    playSensorChime();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedLevel === 'All Levels'
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm'
                      : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                >
                  All Levels
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PRESET MCP TEST SCENARIOS */}
        <div>
          <div className="text-xs font-semibold text-stone-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Preset Daily Scenarios (Alexa Morning Check-in Context):</span>
            </span>
            <span className="text-[11px] text-stone-400">Updates live baseline variance</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onSelectScenario('kitchen_routine');
                playSensorChime();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                homeState.currentScenario === 'kitchen_routine'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>1. Morning Kitchen Routine</span>
                {homeState.currentScenario === 'kitchen_routine' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                Up at 6:15 AM (45m early). Active in Kitchen. Fridge opened. Medicine cabinet not opened.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectScenario('early_riser_living_room');
                playSensorChime();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                homeState.currentScenario === 'early_riser_living_room'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>2. Living Room Early Riser</span>
                {homeState.currentScenario === 'early_riser_living_room' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                Up at 5:35 AM (very early). Relaxing in reading armchair. Water & Lisinopril pending.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectScenario('dizziness_distress');
                playEmergencyAlertChime();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                homeState.currentScenario === 'dizziness_distress'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>3. Bathroom Distress / Pause</span>
                {homeState.currentScenario === 'dizziness_distress' && (
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                Movement in bathroom near grab bar followed by silence. Prompts Alexa safety check.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectScenario('water_leak_alert');
                playEmergencyAlertChime();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                homeState.currentScenario === 'water_leak_alert'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>4. Sink Water Leak Alert</span>
                {homeState.currentScenario === 'water_leak_alert' && (
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                Under-sink flood sensor triggers moisture warning and logs urgent caregiver alert.
              </p>
            </button>
          </div>
        </div>

        {/* INTERACTIVE ARCHITECTURAL FLOOR PLAN BLUEPRINT */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-stone-800/80 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-stone-100 text-sm">
                  {activePlanConfig.name} — Interactive Room Schematics
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Click any sensor on the floor plan below to simulate instant real-time events
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300 font-medium">Eleanor Present</span>
              </span>
              <span>·</span>
              <span className="text-[11px]">Hover sensor to simulate</span>
            </div>
          </div>

          {/* Rooms Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedRooms.map((room) => {
              const here = isCurrentRoom(room.name);
              const roomSensors = room.sensorIds
                .map((id) => getSensor(id))
                .filter((s): s is RingSensor => s !== undefined);

              return (
                <div
                  key={room.id}
                  className={`rounded-xl p-4 border transition-all ${
                    here
                      ? 'bg-emerald-950/25 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/30'
                      : 'bg-stone-900/90 border-stone-800/90 hover:border-stone-700'
                  }`}
                >
                  {/* Room Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-100">{room.name}</span>
                        {room.dimensions && (
                          <span className="text-[10px] font-mono text-stone-400">
                            {room.dimensions}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {room.description}
                      </p>
                    </div>

                    {here && (
                      <span className="text-[10px] font-bold bg-emerald-900/90 text-emerald-300 border border-emerald-600/50 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>HERE</span>
                      </span>
                    )}
                  </div>

                  {/* Room Sensors List */}
                  <div className="space-y-2 mt-3">
                    {roomSensors.length === 0 ? (
                      <p className="text-[11px] text-stone-400 italic py-2">
                        No sensors assigned in this room zone
                      </p>
                    ) : (
                      roomSensors.map((sensor) => {
                        const isActionActive =
                          sensor.state === 'active' ||
                          sensor.state === 'open' ||
                          sensor.state === 'leak_detected';

                        return (
                          <button
                            key={sensor.id}
                            type="button"
                            onClick={() => {
                              // Toggle sensor state on click
                              let nextEvent = 'motion_detected';
                              let nextDetail = `Manual simulation on ${sensor.name}`;

                              if (sensor.type === 'door_contact' || sensor.type === 'window_contact') {
                                nextEvent = sensor.state === 'open' ? 'door_closed' : 'door_opened';
                                nextDetail =
                                  sensor.state === 'open'
                                    ? `${sensor.name} closed`
                                    : `${sensor.name} opened`;
                              } else if (sensor.type === 'water_freeze') {
                                nextEvent = sensor.state === 'leak_detected' ? 'water_cleared' : 'water_leak';
                                nextDetail =
                                  sensor.state === 'leak_detected'
                                    ? `Moisture cleared on ${sensor.name}`
                                    : `Moisture pooling detected on ${sensor.name}!`;
                              } else if (sensor.type === 'doorbell') {
                                nextEvent = 'doorbell_ring';
                                nextDetail = 'Ring Doorbell pressed - Visitor/Delivery at front entry';
                              } else if (sensor.type === 'pressure') {
                                nextEvent = 'bed_exit';
                                nextDetail = 'Bed exit detected by Smart Bed Sensor Mat';
                              } else {
                                nextEvent = sensor.state === 'active' ? 'motion_cleared' : 'motion_detected';
                                nextDetail =
                                  sensor.state === 'active'
                                    ? `Motion cleared in ${sensor.room}`
                                    : `Active movement detected in ${sensor.room}`;
                              }

                              handleTriggerWithFeedback(sensor.id, nextEvent, nextDetail);
                            }}
                            className={`w-full flex items-center justify-between text-xs p-2.5 rounded-lg border transition-all text-left cursor-pointer group ${
                              isActionActive
                                ? 'bg-stone-950/80 border-amber-500/40 hover:border-amber-400'
                                : 'bg-stone-950/50 border-stone-800/80 hover:border-stone-700 hover:bg-stone-950'
                            }`}
                            title={`Click to simulate event on ${sensor.name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="shrink-0">{renderSensorIcon(sensor)}</div>
                              <div className="min-w-0">
                                <div className="font-semibold text-stone-200 truncate text-[11px] group-hover:text-amber-200 transition-colors">
                                  {sensor.name}
                                </div>
                                <div className="text-[10px] text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                                  <span className="flex items-center gap-0.5">
                                    <Battery className="w-2.5 h-2.5 text-stone-400" />
                                    {sensor.battery}%
                                  </span>
                                  <span>·</span>
                                  <span className="font-mono text-stone-400">
                                    {sensor.lastTriggered}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {renderSensorStateBadge(sensor)}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SENSOR EVENT SIMULATION STUDIO */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-stone-100 text-sm">
                  Sensor Event Simulation Studio
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Simulate single events, automated routine playback sequences, or inject custom MCP telemetry
              </p>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveStudioTab('quick')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeStudioTab === 'quick'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                1-Click Events
              </button>
              <button
                type="button"
                onClick={() => setActiveStudioTab('routines')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  activeStudioTab === 'routines'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>Automated Flows</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStudioTab('custom')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeStudioTab === 'custom'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Custom Injector
              </button>
            </div>
          </div>

          {/* TAB 1: 1-CLICK QUICK EVENT SIMULATOR */}
          {activeStudioTab === 'quick' && (
            <div>
              <div className="text-xs text-stone-400 mb-3 flex items-center justify-between">
                <span>Instantly trigger real-world resident actions in {homeState.userName}&apos;s home:</span>
                <span className="text-[11px] text-stone-400">Audio chime enabled · Updates Alexa Model Context</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_kitchen_motion',
                      'motion_detected',
                      `${homeState.userName} moved to Kitchen breakfast counter`
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-amber-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Activity className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Kitchen Motion</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Island & Kettle</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_fridge_contact',
                      'door_opened',
                      'Refrigerator door opened (breakfast prep)'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-cyan-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <DoorOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Open Refrigerator</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Hydration & food</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_medicine_cabinet',
                      'door_opened',
                      `${homeState.userName} opened medicine cabinet - Lisinopril 10mg taken`
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-emerald-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Pill className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Take Daily Pills</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Auto-checks schedule</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_doorbell_motion',
                      'doorbell_ring',
                      'Front Video Doorbell chime sounded - Visitor or package delivery'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-emerald-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Bell className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Ring Doorbell</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Visitor / Package</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_bed_pressure',
                      'bed_exit',
                      'Bed exit detected by Smart Bed Sensor Mat'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-cyan-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Footprints className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Smart Bed Exit</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Mattress sensor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_front_door',
                      'door_opened',
                      'Front entryway door opened'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-cyan-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <DoorOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Open Front Door</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Deadbolt contact</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_kitchen_water_leak',
                      'water_leak',
                      'Moisture pooling detected under kitchen sink pipe! Dispatched alert to Sarah Miller.'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-rose-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Droplets className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-rose-300">Water Leak Alert</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Under-sink probe</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_patio_motion',
                      'motion_detected',
                      `${homeState.userName} enjoying morning fresh air on garden patio`
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-amber-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Patio & Garden</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Outdoor motion</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTriggerWithFeedback(
                      'ring_living_room_glassbreak',
                      'glass_break',
                      'Acoustic glass break sensor triggered in Living Room'
                    )
                  }
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-rose-500/50 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Glass Break Alert</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Acoustic sensor</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Clear active motion in current sensors
                    homeState.sensors.forEach((s) => {
                      if (s.state === 'active') {
                        onTriggerSensor(s.id, 'motion_cleared', `Motion cleared on ${s.name}`);
                      }
                    });
                    playSensorChime();
                  }}
                  className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-600 flex flex-col items-start gap-2 transition-all cursor-pointer group"
                >
                  <RotateCcw className="w-4 h-4 text-stone-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-xs font-semibold text-stone-200">Clear Motion</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">Resting state</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATED SCENARIO ROUTINES PLAYER */}
          {activeStudioTab === 'routines' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-stone-400">
                  Select a multi-step routine and hit <strong>Play Routine</strong> to simulate step-by-step telemetry:
                </span>
                <span className="text-[11px] text-stone-400">
                  {isPlayingRoutine ? '▶ Playing in real-time...' : 'Paused'}
                </span>
              </div>

              {/* Routine Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {AUTOMATED_ROUTINES.map((routine) => {
                  const isSelected = routine.id === activeRoutineId;
                  return (
                    <button
                      key={routine.id}
                      type="button"
                      onClick={() => {
                        setActiveRoutineId(routine.id);
                        setCurrentStepIndex(-1);
                        setIsPlayingRoutine(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                          {routine.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                          {routine.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                        {routine.tagline}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Playback Controls & Progress Bar */}
              <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {!isPlayingRoutine ? (
                    <button
                      type="button"
                      onClick={handleStartRoutine}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Routine</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseRoutine}
                      className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStepRoutine}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Next Step</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetRoutine}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 text-xs transition-all cursor-pointer"
                    title="Reset routine sequence"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stepper Status Indicators */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                  {currentRoutine.steps.map((step, idx) => {
                    const isDone = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                          isCurrent
                            ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-sm animate-pulse'
                            : isDone
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                            : 'bg-stone-950 text-stone-400 border-stone-800'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                        )}
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM SENSOR EVENT INJECTOR */}
          {activeStudioTab === 'custom' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400">
                Select any Ring sensor in the active residence, configure event properties, and inject into live Model Context Protocol telemetry:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Select Sensor */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Target Ring Sensor:
                  </label>
                  <select
                    value={customSensorId}
                    onChange={(e) => setCustomSensorId(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  >
                    {homeState.sensors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.room})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Event Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Event Type:
                  </label>
                  <select
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="motion_detected">motion_detected (Active)</option>
                    <option value="motion_cleared">motion_cleared (Clear)</option>
                    <option value="door_opened">door_opened (Open)</option>
                    <option value="door_closed">door_closed (Closed)</option>
                    <option value="bed_exit">bed_exit (Smart Bed Mat)</option>
                    <option value="water_leak">water_leak (Leak Detected)</option>
                    <option value="water_cleared">water_cleared (Safe & Dry)</option>
                    <option value="doorbell_ring">doorbell_ring (Chime)</option>
                    <option value="glass_break">glass_break (Acoustic Alert)</option>
                    <option value="pill_taken">pill_taken (Medication Intended)</option>
                  </select>
                </div>

                {/* Custom Note Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Event Context / Detail Note:
                  </label>
                  <input
                    type="text"
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                    placeholder="e.g. Eleanor preparing morning herbal tea..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400 placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const target = homeState.sensors.find((s) => s.id === customSensorId);
                    const note =
                      customDetail.trim() ||
                      `Simulated ${customEventType} on ${target?.name || customSensorId}`;
                    handleTriggerWithFeedback(customSensorId, customEventType, note);
                    setCustomDetail('');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Inject Sensor Event</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RECENT 6-HOUR SENSOR EVENT TIMELINE & TELEMETRY STREAM */}
        <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-stone-100 text-xs uppercase tracking-wider">
                  Live Sensor Telemetry Timeline (Last 6 Hours)
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {homeState.events.length} events logged · Available to Amazon Alexa via MCP tool `get_ring_sensor_data`
              </p>
            </div>

            {/* Filter Chips & Copy JSON */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setEventFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  eventFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/50'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                All ({homeState.events.length})
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('motion')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  eventFilter === 'motion'
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/50'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                Motion
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('doors')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  eventFilter === 'doors'
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/50'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                Doors & Windows
              </button>
              <button
                type="button"
                onClick={() => setEventFilter('safety')}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  eventFilter === 'safety'
                    ? 'bg-cyan-500/20 text-cyan-200 font-semibold border border-cyan-500/50'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200'
                }`}
              >
                Water & Alerts
              </button>

              <button
                type="button"
                onClick={handleCopyMcp}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-900 text-stone-300 border border-stone-700 hover:bg-stone-800 flex items-center gap-1 transition-all cursor-pointer ml-1"
                title="Copy current telemetry as Model Context Protocol JSON"
              >
                {copiedMcp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMcp ? 'Copied MCP!' : 'Copy MCP JSON'}</span>
              </button>
            </div>
          </div>

          {/* Events Stream */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-xs">
                No sensor events found matching the active filter.
              </div>
            ) : (
              filteredEvents.slice(0, 20).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between text-xs p-2.5 rounded-xl bg-stone-900/90 border border-stone-800/80 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <span className="font-mono text-stone-400 text-[11px] shrink-0 mt-0.5">
                      {ev.timestamp}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-200 text-[11px]">{ev.room}</span>
                        <span className="text-stone-400">·</span>
                        <span className="text-stone-400 text-[11px] truncate">{ev.deviceName}</span>
                      </div>
                      <p className="text-stone-300 text-[11px] mt-0.5 leading-snug">
                        {ev.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                      ev.eventType === 'water_leak' || ev.eventType === 'glass_break'
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 font-bold animate-pulse'
                        : ev.eventType.includes('door')
                        ? 'bg-cyan-950/60 border-cyan-800/50 text-cyan-300'
                        : ev.eventType === 'bed_exit'
                        ? 'bg-sky-950/60 border-sky-800/50 text-sky-300'
                        : 'bg-stone-950 border-stone-800 text-amber-300'
                    }`}
                  >
                    {ev.eventType}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
