import type {
  AgentChatMessage,
  CaregiverAlert,
  HomeState,
  McpToolCall,
  RingSensor,
  ScheduleItem,
} from '../types/careContext.ts';

const STORAGE_KEY = 'carecontext_homestate_v1';

export const INITIAL_HOME_STATE: HomeState = {
  currentScenario: 'kitchen_routine',
  userName: 'Eleanor',
  userAge: 81,
  homeAddress: '742 Evergreen Terrace, Portland, OR',
  caregiverName: 'Sarah Miller',
  caregiverPhone: '+1 (555) 234-8901',
  caregiverRelationship: 'Daughter / Primary Caregiver',
  currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  useLiveTime: true,
  currentRoom: 'Kitchen',
  wakeTimeEstimated: '06:15 AM',
  routineBaselineWake: '07:00 AM',
  safetyState: 'normal',
  sensors: [
    {
      id: 'ring_bedroom_motion',
      name: 'Bedroom Ring Motion Detector',
      room: 'Bedroom',
      type: 'motion',
      state: 'clear',
      battery: 94,
      lastTriggered: '06:14 AM',
      relativeMinutesAgo: 64,
      description: 'Ceiling corner sensor facing bed and dressing area',
    },
    {
      id: 'ring_bed_pressure',
      name: 'Smart Bed Sensor Mat',
      room: 'Bedroom',
      type: 'pressure',
      state: 'clear',
      battery: 100,
      lastTriggered: '06:12 AM (Bed Exit)',
      relativeMinutesAgo: 66,
      description: 'Under-mattress sensor monitoring rest and wake transitions',
    },
    {
      id: 'ring_bathroom_motion',
      name: 'Bathroom Ring Motion Detector',
      room: 'Bathroom',
      type: 'motion',
      state: 'clear',
      battery: 89,
      lastTriggered: '06:28 AM',
      relativeMinutesAgo: 50,
      description: 'Wall mounted near vanity and grab bars',
    },
    {
      id: 'ring_kitchen_motion',
      name: 'Kitchen Ring Motion Detector',
      room: 'Kitchen',
      type: 'motion',
      state: 'active',
      battery: 92,
      lastTriggered: '07:16 AM',
      relativeMinutesAgo: 2,
      description: 'Active motion detected near breakfast counter & stove',
    },
    {
      id: 'ring_fridge_contact',
      name: 'Refrigerator Contact Sensor',
      room: 'Kitchen',
      type: 'door_contact',
      state: 'closed',
      battery: 88,
      lastTriggered: '06:45 AM (Opened 2x)',
      relativeMinutesAgo: 33,
      description: 'Magnetic sensor monitoring food and drink access',
    },
    {
      id: 'ring_medicine_cabinet',
      name: 'Medicine Cabinet Contact Sensor',
      room: 'Bathroom',
      type: 'door_contact',
      state: 'closed',
      battery: 91,
      lastTriggered: 'Yesterday 08:30 PM',
      relativeMinutesAgo: 648,
      description: 'Monitors morning and evening daily pill container access',
    },
    {
      id: 'ring_living_room_motion',
      name: 'Living Room Ring Motion Detector',
      room: 'Living Room',
      type: 'motion',
      state: 'clear',
      battery: 96,
      lastTriggered: '06:35 AM',
      relativeMinutesAgo: 43,
      description: 'Near reading armchair and television',
    },
    {
      id: 'ring_front_door',
      name: 'Front Entry Contact Sensor',
      room: 'Front Entry',
      type: 'door_contact',
      state: 'closed',
      battery: 95,
      lastTriggered: 'Yesterday 04:15 PM',
      relativeMinutesAgo: 900,
      description: 'Front entryway deadbolt & contact sensor',
    },
  ],
  events: [
    {
      id: 'ev-1',
      sensorId: 'ring_bed_pressure',
      room: 'Bedroom',
      deviceName: 'Smart Bed Sensor Mat',
      eventType: 'bed_exit',
      timestamp: '06:12 AM',
      detail: 'Bed exit detected (48 minutes earlier than Eleanor’s 7:00 AM average)',
    },
    {
      id: 'ev-2',
      sensorId: 'ring_bedroom_motion',
      room: 'Bedroom',
      deviceName: 'Bedroom Ring Motion',
      eventType: 'motion_detected',
      timestamp: '06:14 AM',
      detail: 'Movement detected around nightstand and closet',
    },
    {
      id: 'ev-3',
      sensorId: 'ring_bathroom_motion',
      room: 'Bathroom',
      deviceName: 'Bathroom Ring Motion',
      eventType: 'motion_detected',
      timestamp: '06:22 AM',
      detail: 'Morning washroom routine active for 8 minutes',
    },
    {
      id: 'ev-4',
      sensorId: 'ring_living_room_motion',
      room: 'Living Room',
      deviceName: 'Living Room Ring Motion',
      eventType: 'motion_detected',
      timestamp: '06:35 AM',
      detail: 'Transit through living room towards the kitchen',
    },
    {
      id: 'ev-5',
      sensorId: 'ring_fridge_contact',
      room: 'Kitchen',
      deviceName: 'Refrigerator Contact Sensor',
      eventType: 'door_opened',
      timestamp: '06:45 AM',
      detail: 'Fridge opened twice (likely milk / breakfast preparation)',
    },
    {
      id: 'ev-6',
      sensorId: 'ring_kitchen_motion',
      room: 'Kitchen',
      deviceName: 'Kitchen Ring Motion',
      eventType: 'motion_detected',
      timestamp: '07:16 AM',
      detail: 'Sustained gentle movement around kitchen island and kettle',
    },
  ],
  schedule: [
    {
      id: 'sched-1',
      time: '08:00 AM',
      title: 'Blood Pressure Medication (Lisinopril 10mg)',
      category: 'medication',
      details: 'Take 1 tablet with full glass of water. Medicine cabinet currently NOT opened.',
      isCompleted: false,
      isCritical: true,
    },
    {
      id: 'sched-2',
      time: '08:15 AM',
      title: 'Morning Hydration (8 oz Water)',
      category: 'hydration',
      details: 'Drink 1 tall glass of warm lemon water before morning coffee.',
      isCompleted: false,
      isCritical: false,
    },
    {
      id: 'sched-3',
      time: '10:30 AM',
      title: 'Gentle Garden Walk & Stretches',
      category: 'activity',
      details: '15-minute patio walk recommended by Physical Therapist Mark.',
      isCompleted: false,
      isCritical: false,
    },
    {
      id: 'sched-4',
      time: '02:00 PM',
      title: 'Virtual Check-in with Dr. Evans',
      category: 'appointment',
      details: 'Monthly telehealth review on blood pressure log and knee mobility.',
      isCompleted: false,
      isCritical: false,
    },
  ],
  alerts: [],
  mcpLogs: [],
};

// Client storage helpers
export function loadClientHomeState(): HomeState {
  if (typeof window === 'undefined') return INITIAL_HOME_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_HOME_STATE;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_HOME_STATE, ...parsed };
  } catch (e) {
    return INITIAL_HOME_STATE;
  }
}

export function saveClientHomeState(state: HomeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore storage quota errors
  }
}

// Helpers for time/date
export function getEffectiveTime(state: HomeState): string {
  if (state.useLiveTime) {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return state.currentTime || '07:18 AM';
}

export function getEffectiveDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// MCP local simulators
export function clientRecordMcpCall(
  currentState: HomeState,
  tool: 'get_ring_sensor_data' | 'get_daily_schedule' | 'alert_family_contact',
  args: Record<string, unknown>,
  result: Record<string, unknown>
): { toolCall: McpToolCall; nextLogs: McpToolCall[] } {
  const call: McpToolCall = {
    jsonrpc: '2.0',
    id: `call-client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    method: 'tools/call',
    params: {
      name: tool,
      arguments: args,
    },
    tool,
    arguments: args,
    result,
    latencyMs: Math.floor(Math.random() * 45) + 35,
    timestamp: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };

  const nextLogs = [call, ...currentState.mcpLogs].slice(0, 50);
  return { toolCall: call, nextLogs };
}

export function clientDispatchAlert(
  currentState: HomeState,
  reason: string,
  severity: 'high' | 'urgent' | 'critical' = 'urgent',
  details?: string
): { alert: CaregiverAlert; nextAlerts: CaregiverAlert[] } {
  const alertId = `alert-${Date.now()}`;
  const sensorSnap = `Location: ${currentState.currentRoom} | Wake: ${currentState.wakeTimeEstimated} | Last Sensor: ${
    currentState.sensors.find((s) => s.state === 'active' || s.state === 'open')?.name || 'None'
  }`;

  const newAlert: CaregiverAlert = {
    id: alertId,
    timestamp: getEffectiveTime(currentState),
    severity,
    reason,
    details: details || `Proactive safety protocol triggered for ${currentState.userName}.`,
    recipient: {
      name: currentState.caregiverName || 'Sarah Miller',
      relationship: currentState.caregiverRelationship || 'Daughter / Primary Caregiver',
      phone: currentState.caregiverPhone || '+1 (555) 234-8901',
      channel: 'SMS Priority Gateway & Alexa In-Home Intercom',
    },
    status: 'Sent',
    sensorSnapshot: sensorSnap,
  };

  return { alert: newAlert, nextAlerts: [newAlert, ...currentState.alerts] };
}

// Client simulation for scenario change
export function applyScenarioToState(currentState: HomeState, scenarioKey: string): HomeState {
  const next: HomeState = { ...currentState, currentScenario: scenarioKey };

  if (scenarioKey === 'early_riser_living_room') {
    next.currentTime = '06:40 AM';
    next.wakeTimeEstimated = '05:35 AM';
    next.currentRoom = 'Living Room';
    next.safetyState = 'normal';
    next.sensors = next.sensors.map((s) => {
      if (s.id === 'ring_living_room_motion') {
        return { ...s, state: 'active', lastTriggered: '06:38 AM', relativeMinutesAgo: 2 };
      }
      if (s.id === 'ring_kitchen_motion') {
        return { ...s, state: 'clear', lastTriggered: '06:10 AM', relativeMinutesAgo: 30 };
      }
      return s;
    });
    next.events = [
      {
        id: `ev-${Date.now()}-1`,
        sensorId: 'ring_bed_pressure',
        room: 'Bedroom',
        deviceName: 'Smart Bed Sensor Mat',
        eventType: 'bed_exit',
        timestamp: '05:35 AM',
        detail: `${next.userName} got up at 5:35 AM (nearly 1.5 hours earlier than usual)`,
      },
      {
        id: `ev-${Date.now()}-2`,
        sensorId: 'ring_living_room_motion',
        room: 'Living Room',
        deviceName: 'Living Room Ring Motion',
        eventType: 'motion_detected',
        timestamp: '06:38 AM',
        detail: `Sitting comfortably in reading armchair near the window`,
      },
      ...next.events,
    ];
  } else if (scenarioKey === 'dizziness_distress') {
    next.currentTime = '07:30 AM';
    next.currentRoom = 'Bathroom';
    next.safetyState = 'verifying_safety';
    next.sensors = next.sensors.map((s) => {
      if (s.id === 'ring_bathroom_motion') {
        return { ...s, state: 'active', lastTriggered: '07:28 AM', relativeMinutesAgo: 2 };
      }
      return s;
    });
    next.events = [
      {
        id: `ev-${Date.now()}-3`,
        sensorId: 'ring_bathroom_motion',
        room: 'Bathroom',
        deviceName: 'Bathroom Ring Motion',
        eventType: 'motion_detected',
        timestamp: '07:28 AM',
        detail: 'Sudden movement near grab bar, prolonged pause',
      },
      ...next.events,
    ];
  } else {
    // Default kitchen routine
    next.currentTime = '07:18 AM';
    next.wakeTimeEstimated = '06:15 AM';
    next.currentRoom = 'Kitchen';
    next.safetyState = 'normal';
    next.sensors = next.sensors.map((s) => {
      if (s.id === 'ring_kitchen_motion') {
        return { ...s, state: 'active', lastTriggered: '07:16 AM', relativeMinutesAgo: 2 };
      }
      return s;
    });
  }

  saveClientHomeState(next);
  return next;
}

// Client simulation for individual sensor triggers
export function applySensorTriggerToState(
  currentState: HomeState,
  sensorId: string,
  eventType: string,
  detail?: string
): HomeState {
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  let updatedRoom = currentState.currentRoom;

  const updatedSensors = currentState.sensors.map((sensor) => {
    if (sensor.id === sensorId) {
      if (sensor.room) updatedRoom = sensor.room;
      return {
        ...sensor,
        state: (eventType.includes('open') ? 'open' : 'active') as any,
        lastTriggered: timeStr,
        relativeMinutesAgo: 0,
      };
    }
    return sensor;
  });

  const targetSensor = currentState.sensors.find((s) => s.id === sensorId);
  const newEvent = {
    id: `ev-${Date.now()}`,
    sensorId,
    room: targetSensor?.room || updatedRoom,
    deviceName: targetSensor?.name || 'Home Sensor',
    eventType: eventType as any,
    timestamp: timeStr,
    detail: detail || `Sensor event on ${targetSensor?.name || sensorId}`,
  };

  const next: HomeState = {
    ...currentState,
    sensors: updatedSensors,
    currentRoom: updatedRoom,
    events: [newEvent, ...currentState.events].slice(0, 30),
  };

  saveClientHomeState(next);
  return next;
}
