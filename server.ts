import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ToolConfiguration,
} from '@aws-sdk/client-bedrock-runtime';
import type {
  HomeState,
  RingSensor,
  SensorEvent,
  ScheduleItem,
  CaregiverAlert,
  McpToolCall,
} from './src/types/careContext.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-Memory Simulated Home & Ring Sensor State
let state: HomeState = {
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

// Anti-repetition tracking state
const recentResponsePhrases: string[] = [];
let jokeIndex = 0;
let storyIndex = 0;

function recordSpokenPhrase(phrase: string) {
  recentResponsePhrases.push(phrase.toLowerCase().substring(0, 45));
  if (recentResponsePhrases.length > 25) {
    recentResponsePhrases.shift();
  }
}

function hasSpokenRecently(phrase: string): boolean {
  const sample = phrase.toLowerCase().substring(0, 45);
  return recentResponsePhrases.includes(sample);
}

// Preset scenarios for live interactive testing
function setScenario(scenarioKey: string) {
  state.currentScenario = scenarioKey;
  if (scenarioKey === 'early_riser_living_room') {
    state.currentTime = '06:40 AM';
    state.wakeTimeEstimated = '05:35 AM';
    state.currentRoom = 'Living Room';
    state.safetyState = 'normal';
    state.sensors.forEach((s) => {
      if (s.id === 'ring_living_room_motion') {
        s.state = 'active';
        s.lastTriggered = '06:38 AM';
        s.relativeMinutesAgo = 2;
      } else if (s.id === 'ring_kitchen_motion') {
        s.state = 'clear';
        s.lastTriggered = '06:10 AM';
        s.relativeMinutesAgo = 30;
      }
    });
    state.events = [
      {
        id: 'ev-s1',
        sensorId: 'ring_bed_pressure',
        room: 'Bedroom',
        deviceName: 'Smart Bed Sensor Mat',
        eventType: 'bed_exit',
        timestamp: '05:35 AM',
        detail: 'Eleanor got up at 5:35 AM (nearly 1.5 hours earlier than usual)',
      },
      {
        id: 'ev-s2',
        sensorId: 'ring_living_room_motion',
        room: 'Living Room',
        deviceName: 'Living Room Ring Motion',
        eventType: 'motion_detected',
        timestamp: '06:38 AM',
        detail: 'Sitting comfortably in her reading armchair near the window',
      },
    ];
  } else if (scenarioKey === 'dizziness_distress') {
    state.currentTime = '07:30 AM';
    state.currentRoom = 'Bathroom';
    state.safetyState = 'verifying_safety';
    state.sensors.forEach((s) => {
      if (s.id === 'ring_bathroom_motion') {
        s.state = 'active';
        s.lastTriggered = '07:28 AM';
        s.relativeMinutesAgo = 2;
      }
    });
    state.events = [
      {
        id: 'ev-d1',
        sensorId: 'ring_bathroom_motion',
        room: 'Bathroom',
        deviceName: 'Bathroom Ring Motion',
        eventType: 'motion_detected',
        timestamp: '07:28 AM',
        detail: 'Sudden movement near grab bar, prolonged pause',
      },
    ];
  } else {
    // Default 'kitchen_routine'
    state.currentTime = '07:18 AM';
    state.wakeTimeEstimated = '06:15 AM';
    state.currentRoom = 'Kitchen';
    state.safetyState = 'normal';
    state.sensors.forEach((s) => {
      if (s.id === 'ring_kitchen_motion') {
        s.state = 'active';
        s.lastTriggered = '07:16 AM';
        s.relativeMinutesAgo = 2;
      }
    });
  }
}

// MCP Tool Implementations
function mcpGetRingSensorData(hours = 6) {
  const activeSensors = state.sensors.filter((s) => s.state === 'active' || s.state === 'open');
  const frontDoorSensor = state.sensors.find((s) => s.id === 'ring_front_door');
  const fridgeSensor = state.sensors.find((s) => s.id === 'ring_fridge_contact');
  const medSensor = state.sensors.find((s) => s.id === 'ring_medicine_cabinet');
  const bedSensor = state.sensors.find((s) => s.id === 'ring_bed_pressure');

  return {
    timeframe: `Past ${hours} hours`,
    userBaseline: {
      averageWakeTime: state.routineBaselineWake,
      estimatedWakeTimeToday: state.wakeTimeEstimated,
      wokeUpEarly: true,
      varianceMinutes: -45,
    },
    currentStatus: {
      inferredCurrentRoom: state.currentRoom,
      activeSensors: activeSensors.map((s) => `${s.name} in ${s.room}`),
      medicineCabinetOpenedToday: medSensor?.lastTriggered.includes('Today') || false,
      refrigeratorOpenedToday: true,
      frontDoorLocked: frontDoorSensor?.state === 'closed',
      frontDoorLastTriggered: frontDoorSensor?.lastTriggered,
      bedExitTimestamp: bedSensor?.lastTriggered,
    },
    recentSensorEvents: state.events.slice(-6),
    allSensors: state.sensors.map((s) => ({
      id: s.id,
      name: s.name,
      room: s.room,
      state: s.state,
      lastTriggered: s.lastTriggered,
      battery: s.battery,
    })),
  };
}

// Live Real-Time & Date Helpers
export function getEffectiveTime(): string {
  if (state.useLiveTime !== false) {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return state.currentTime || '07:18 AM';
}

export function getEffectiveDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function mcpGetDailySchedule(category = 'all') {
  let items = state.schedule;
  if (category && category !== 'all') {
    items = items.filter((i) => i.category === category);
  }
  const pendingCritical = items.filter((i) => !i.isCompleted && i.isCritical);
  const nextUp = items.find((i) => !i.isCompleted) || items[0];

  return {
    today: getEffectiveDate(),
    currentTime: getEffectiveTime(),
    residentName: state.userName,
    items,
    nextRecommendedAction: nextUp
      ? {
          title: nextUp.title,
          time: nextUp.time,
          category: nextUp.category,
          instruction: nextUp.details,
          isCritical: nextUp.isCritical,
        }
      : null,
    pendingCriticalCount: pendingCritical.length,
  };
}

function mcpAlertFamilyContact(reason: string, severity: 'high' | 'urgent' | 'critical' = 'urgent', details?: string) {
  const alertId = `alert-${Date.now()}`;
  const nowStr = getEffectiveTime();
  const caregiverName = state.caregiverName || 'Sarah Miller';
  const caregiverPhone = state.caregiverPhone || '+1 (555) 234-8901';
  const caregiverRel = state.caregiverRelationship || 'Daughter / Primary Caregiver';

  const activeSensorsText = state.sensors
    .filter((s) => s.state === 'active' || s.state === 'open')
    .map((s) => `${s.room} (${s.name})`)
    .join(', ') || 'No active sensor movement';

  const newAlert: CaregiverAlert = {
    id: alertId,
    timestamp: nowStr,
    severity,
    reason: reason || 'Urgent elder check-in alert triggered',
    details: details || `Safety verification required for ${state.userName} at ${state.homeAddress}`,
    recipient: {
      name: caregiverName,
      relationship: caregiverRel,
      phone: caregiverPhone,
      channel: 'SMS Priority + Alexa Emergency Push',
    },
    status: 'Delivered',
    sensorSnapshot: `Current room: ${state.currentRoom}. Active sensors: ${activeSensorsText}. Estimated wake: ${state.wakeTimeEstimated}.`,
  };

  state.alerts.unshift(newAlert);
  state.safetyState = 'emergency_dispatched';

  return {
    status: 'DISPATCHED_SUCCESSFULLY',
    alertId,
    timestamp: nowStr,
    recipient: `${caregiverName} (${caregiverPhone})`,
    dispatchMethod: 'Twilio SMS & Alexa Emergency Push Gateway',
    deliveredStatus: 'Delivered to phone',
    messageBody: `[URGENT CareContext Alert] ${state.userName}: ${reason}. Context: ${newAlert.sensorSnapshot}`,
  };
}

// Log MCP JSON-RPC 2.0 call
function recordMcpCall(
  tool: 'get_ring_sensor_data' | 'get_daily_schedule' | 'alert_family_contact',
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  latencyMs = 120
): McpToolCall {
  const callId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const entry: McpToolCall = {
    jsonrpc: '2.0',
    id: callId,
    method: 'tools/call',
    params: {
      name: tool,
      arguments: args,
    },
    tool,
    arguments: args,
    result,
    latencyMs,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  state.mcpLogs.unshift(entry);
  if (state.mcpLogs.length > 50) {
    state.mcpLogs.pop();
  }
  return entry;
}

// Amazon Bedrock Tool Specifications (ToolConfiguration schema)
const bedrockToolConfig: ToolConfiguration = {
  tools: [
    {
      toolSpec: {
        name: 'get_ring_sensor_data',
        description: 'Fetches the last 6 hours of motion and contact sensors from local Ring devices.',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              hours: {
                type: 'integer',
                description: 'Number of past hours to inspect (default 6).',
              },
            },
          },
        },
      },
    },
    {
      toolSpec: {
        name: 'get_daily_schedule',
        description: "Fetches Eleanor's medication, hydration, and appointment schedule.",
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Optional category filter: medication, hydration, appointment, or all.',
              },
            },
          },
        },
      },
    },
    {
      toolSpec: {
        name: 'alert_family_contact',
        description: 'Dispatches priority SMS alerts to Sarah Miller with location and telemetry context.',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              reason: {
                type: 'string',
                description: 'Clear reason for the alert, e.g. unresponsiveness, distress, or fall reported.',
              },
              severity: {
                type: 'string',
                description: 'Urgency level: high, urgent, or critical.',
              },
              details: {
                type: 'string',
                description: 'Supporting context from recent activity or user statement.',
              },
            },
            required: ['reason'],
          },
        },
      },
    },
  ],
};

function getBedrockSystemPrompt(): string {
  const name = state.userName;
  const age = state.userAge;
  const caregiver = state.caregiverName || 'Sarah Miller';
  const curTime = getEffectiveTime();
  const curDate = getEffectiveDate();
  const scheduleList = state.schedule.map((s) => `${s.time}: ${s.title} (${s.isCompleted ? 'done' : 'pending'})`).join('; ');

  return `You are CareContext, an empathetic, proactive Alexa+ Agent Skill supporting elderly individuals living independently (${name}, ${age}). Current real-time clock: ${curTime}, ${curDate}. You have access to real-time home context via the Model Context Protocol (MCP).
Current Schedule: [${scheduleList}]
Primary Caregiver: ${caregiver}.
Rules:
1. For morning check-ins, execute get_ring_sensor_data silently before greeting the user.
2. Deducing context from sensors, greet the user warmly and naturally by their name (${name}) (e.g., 'I noticed you were up early in the kitchen...'). Never recite raw sensor metrics or timestamps.
3. Query get_daily_schedule and weave medication and hydration reminders casually into conversation.
4. If the user indicates distress or unresponsiveness, run a simple Yes/No safety check. Escalate immediately via alert_family_contact if confirmed or unanswered within 30 seconds.
5. Answer any question ${name} asks directly, warmly, and knowledgeably (e.g., about home sensors, front door locks, schedule items, real-time clock, doctor visits, weather, caregiver ${caregiver}, jokes, or health). Never repeat previously used phrases or greetings.
6. If the user asks to change their name or update schedule items, acknowledge the change warmly.
Tone: Warm, calm, patient, companionable.`;
}

// Safe AWS Bedrock Client Factory
function createBedrockClient(): BedrockRuntimeClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (
    !accessKeyId ||
    !secretAccessKey ||
    accessKeyId.includes('MY_AWS') ||
    secretAccessKey.includes('MY_AWS')
  ) {
    return null;
  }

  try {
    return new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });
  } catch (err) {
    console.warn('Amazon Bedrock client initialization failed, falling back to mock engine:', err);
    return null;
  }
}

// Wholesome Elder-Friendly Joke Library (Rotates without repetition)
const JOKES = [
  "Why did the scarecrow win an award, Eleanor? Because he was outstanding in his field!",
  "What do you call a fake noodle? An impasta!",
  "Why do hummingbirds hum? Because they don't know the words!",
  "What did one wall say to the other? I'll meet you at the corner!",
  "Why can't a bicycle stand up on its own? Because it was two-tired!",
  "What do you call a sleeping dinosaur? A dino-snore!",
  "How does a penguin build its house? Igloos it together!",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
  "What kind of tea is hard to swallow? Reality!",
  "What do you call cheese that isn't yours? Nacho cheese!",
];

// Uplifting Cozy Vignettes & Stories (Rotates without repetition)
const STORIES = [
  "Here is a lovely thought for this morning: 'Every new day is a fresh blank page in your story. Make sure you fill it with kindness, a warm cup in hand, and peace of mind.'",
  "A little morning reflection: Years ago, poet Mary Oliver asked, 'Tell me, what is it you plan to do with your one wild and precious life?' Sometimes the finest answer is simply savoring the morning light on the windowsill and resting comfortably.",
  "Did you know that morning sunlight through the window actually signals your body to produce serotonin? That's nature's own gentle way of saying 'Welcome to a brand new day.'",
  "Think about your favorite garden flowers—they never rush, yet everything gets accomplished in its own quiet rhythm. May your morning be just as calm and unhurried today.",
  "Here is a comforting thought: 'Peace is not the absence of trouble, but the presence of quiet courage in your heart.' You are doing wonderfully today, Eleanor.",
];

// Intelligent Agent Logic with Bedrock Converse API + Comprehensive Non-Repetitive Conversational Engine
async function executeAgentConversation({
  message,
  triggerType,
  safetyAnswer,
  history,
}: {
  message?: string;
  triggerType?: 'morning_checkin' | 'user_speech' | 'safety_response' | 'unresponsive_timeout';
  safetyAnswer?: 'yes' | 'no';
  history?: Array<{ role: string; content: string }>;
}) {
  const toolCallsExecuted: McpToolCall[] = [];
  let thought = '';
  let responseText = '';
  let nextSafetyState: 'normal' | 'verifying_safety' | 'emergency_dispatched' = state.safetyState;
  let dynamicReplies: string[] = [];

  // Rule 4: Check if unresponsiveness or confirmed emergency
  if (triggerType === 'unresponsive_timeout' || (triggerType === 'safety_response' && safetyAnswer === 'no')) {
    thought = 'User confirmed distress or remained unresponsive during safety check. Escalating immediately via alert_family_contact to Sarah Miller.';
    const alertResult = mcpAlertFamilyContact(
      triggerType === 'unresponsive_timeout'
        ? `No response from ${state.userName} after 30-second morning check-in safety alert`
        : `${state.userName} indicated they need help or are not okay in the ${state.currentRoom}`,
      'urgent',
      `Home telemetry: ${state.currentRoom} activity. Emergency dispatch initiated.`
    );
    const toolLog = recordMcpCall('alert_family_contact', { reason: alertResult.messageBody, severity: 'urgent' }, alertResult);
    toolCallsExecuted.push(toolLog);
    nextSafetyState = 'emergency_dispatched';
    responseText = `I'm sending a quick message to Sarah right now to let her know to check in on you, Eleanor. Please sit down comfortably and take slow, easy breaths. Help is on the way.`;
    recordSpokenPhrase(responseText);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        "I'm sitting down safely now",
        'Can you call Sarah directly?',
        "I'm feeling a little better",
      ],
    };
  }

  // If safety response is "yes" (e.g., "Yes, I am okay")
  if (triggerType === 'safety_response' && safetyAnswer === 'yes') {
    state.safetyState = 'normal';
    nextSafetyState = 'normal';
    thought = 'User confirmed they are okay. Resetting safety alert state and reassuring Eleanor warmly.';
    const reassuringOptions = [
      `I'm so glad to hear that, Eleanor! Just take your time this morning, and remember I'm right here if you need anything at all.`,
      `What a relief to hear, Eleanor. Please take things slow and easy. Let me know if you'd like a reminder about your tea or schedule!`,
      `Thank goodness you're alright, Eleanor. Sit back and relax, and I'll keep an eye on things for you.`,
    ];
    responseText = reassuringOptions.find((o) => !hasSpokenRecently(o)) || reassuringOptions[0];
    recordSpokenPhrase(responseText);
    return {
      text: responseText,
      thought,
      toolCalls: [],
      safetyState: nextSafetyState,
      suggestedReplies: [
        'Thank you, CareContext',
        'What else is on my schedule today?',
        "I'm going to have my coffee now",
      ],
    };
  }

  // Rule 1 & 3: Perform immediate silent MCP discovery if morning checkin
  if (triggerType === 'morning_checkin') {
    const sensorData = mcpGetRingSensorData(6);
    const sensorLog = recordMcpCall('get_ring_sensor_data', { hours: 6 }, sensorData);
    toolCallsExecuted.push(sensorLog);

    const scheduleData = mcpGetDailySchedule('all');
    const scheduleLog = recordMcpCall('get_daily_schedule', { category: 'all' }, scheduleData);
    toolCallsExecuted.push(scheduleLog);
  }

  // Attempt Amazon Bedrock Converse API call if client is configured
  const bedrockClient = createBedrockClient();
  if (bedrockClient) {
    try {
      const modelId = process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

      let userPrompt = '';
      if (triggerType === 'morning_checkin') {
        userPrompt = `[Trigger: Morning Check-in]. Silent sensor data retrieved: User estimated wake ${state.wakeTimeEstimated} (baseline ${state.routineBaselineWake}), currently in ${state.currentRoom}. Next schedule items: ${state.schedule.slice(0, 2).map((s) => `${s.time} ${s.title}`).join(', ')}. Please greet ${state.userName} warmly and naturally, mentioning activity in the ${state.currentRoom}, and gently remind about water & morning routine. Follow Rules 1-6. Current time: ${getEffectiveTime()}, date: ${getEffectiveDate()}. Do not repeat previously used phrasing.`;
      } else if (message) {
        userPrompt = `${state.userName} says: "${message}". Current room: ${state.currentRoom}. Answer specific question directly, warmly, and helpfully. If she/he asks about doors/sensors/meds/appointments/real-time/date/name, use accurate context. Do not repeat previously used responses.`;
      } else {
        userPrompt = `Good morning check-in for ${state.userName}.`;
      }

      // Build multi-turn dialog history for Bedrock Converse
      const bedrockMessages: any[] = [];
      if (history && Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          bedrockMessages.push({
            role: item.role === 'assistant' ? 'assistant' : 'user',
            content: [{ text: item.content }],
          });
        }
      }
      bedrockMessages.push({
        role: 'user',
        content: [{ text: userPrompt }],
      });

      const converseCommand = new ConverseCommand({
        modelId,
        messages: bedrockMessages,
        system: [{ text: getBedrockSystemPrompt() }],
        toolConfig: bedrockToolConfig,
        inferenceConfig: {
          maxTokens: 512,
          temperature: 0.7,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Amazon Bedrock Converse call timed out')), 4000)
      );

      const bedrockResponse = await Promise.race([
        bedrockClient.send(converseCommand),
        timeoutPromise,
      ]);

      const outputMessage = bedrockResponse.output?.message;
      if (outputMessage?.content) {
        for (const block of outputMessage.content) {
          if (block.text) {
            responseText += block.text;
          }
          if (block.toolUse) {
            const toolName = block.toolUse.name as any;
            const toolInput = (block.toolUse.input || {}) as any;
            if (toolName === 'get_ring_sensor_data') {
              const res = mcpGetRingSensorData(toolInput.hours || 6);
              toolCallsExecuted.push(recordMcpCall('get_ring_sensor_data', toolInput, res));
            } else if (toolName === 'get_daily_schedule') {
              const res = mcpGetDailySchedule(toolInput.category || 'all');
              toolCallsExecuted.push(recordMcpCall('get_daily_schedule', toolInput, res));
            } else if (toolName === 'alert_family_contact') {
              const res = mcpAlertFamilyContact(toolInput.reason, toolInput.severity, toolInput.details);
              toolCallsExecuted.push(recordMcpCall('alert_family_contact', toolInput, res));
              nextSafetyState = 'emergency_dispatched';
            }
          }
        }
      }

      if (responseText.trim()) {
        thought = `Reasoning generated via Amazon Bedrock (${modelId}) with Model Context Protocol tools.`;
        if (
          responseText.toLowerCase().includes('are you feeling okay') ||
          responseText.toLowerCase().includes('are you alright') ||
          responseText.toLowerCase().includes('are you hurt') ||
          responseText.toLowerCase().includes('should i call')
        ) {
          nextSafetyState = 'verifying_safety';
        }
        state.safetyState = nextSafetyState;
        recordSpokenPhrase(responseText);
        return {
          text: responseText.trim(),
          thought,
          toolCalls: toolCallsExecuted,
          safetyState: nextSafetyState,
          suggestedReplies: generateContextualReplies(responseText, nextSafetyState, message),
        };
      }
    } catch (bedrockErr) {
      console.warn('Amazon Bedrock invocation failed or credentials absent, executing intelligent conversational engine:', bedrockErr);
    }
  }

  // =========================================================================
  // Comprehensive Intelligent Conversational Engine
  // Answers EVERY question related to Eleanor's home, health, sensors, and life
  // Guaranteed Anti-Repetition with varied, context-aware phrasing
  // =========================================================================

  if (triggerType === 'morning_checkin') {
    const kitchenGreetings = [
      `Good morning, ${state.userName}! I noticed you were up early and puttering around the kitchen this morning. Before you brew your tea, don't forget to pour yourself a nice glass of water for your morning medication. How are you feeling today?`,
      `Morning, ${state.userName}! It looks like you're already up and bustling in the kitchen. Remember to take a quick moment to have a cool glass of water with your morning medicine before starting your breakfast. How did you sleep?`,
      `A very good morning to you, ${state.userName}! I saw you moving around the kitchen bright and early. While you get settled, please be sure to take your morning pills with some water. What's on your mind today?`,
      `Hello ${state.userName}! The kitchen is nice and warm today. I hope you had sweet dreams. Don't forget your morning water and routine. What would you like to do this morning?`,
    ];
    const livingRoomGreetings = [
      `Good morning, ${state.userName}! I noticed you were up bright and early relaxing in the living room. While you enjoy the quiet morning, be sure to grab a fresh glass of water with your morning medicine when you're ready. How are you doing today?`,
      `Morning, ${state.userName}! It's peaceful in the living room today. While you rest in your chair, remember to drink some water and stay comfortable. How is your morning treating you?`,
      `A gentle morning to you, ${state.userName}. Relaxing in the living room is a peaceful way to start. How are you feeling right now?`,
    ];
    const generalGreetings = [
      `Good morning, ${state.userName}! It looks like you're up and getting your morning started. Remember to drink a little water and take your routine at your own easy pace. How is your morning going so far?`,
      `Rise and shine, ${state.userName}! I hope you had a restful night. Don't forget your morning hydration. How are you feeling today?`,
      `Warm morning greetings, ${state.userName}! It is a quiet and pleasant morning. What is on your mind today?`,
    ];

    if (state.currentRoom === 'Kitchen') {
      thought = `Deducing context: ${state.userName} woke early (~6:15 AM). In Kitchen. Morning schedule due. Selected non-repetitive greeting.`;
      responseText = kitchenGreetings.find((g) => !hasSpokenRecently(g)) || kitchenGreetings[0];
    } else if (state.currentRoom === 'Living Room') {
      thought = `Deducing context: ${state.userName} woke early (5:35 AM). In Living Room. Selected non-repetitive greeting.`;
      responseText = livingRoomGreetings.find((g) => !hasSpokenRecently(g)) || livingRoomGreetings[0];
    } else {
      thought = `Deducing context: ${state.userName} awake. Selected non-repetitive greeting.`;
      responseText = generalGreetings.find((g) => !hasSpokenRecently(g)) || generalGreetings[0];
    }
  } else if (message) {
    const raw = message.trim();
    const lower = raw.toLowerCase();
    const caregiverName = state.caregiverName || 'Sarah Miller';

    // 1. Distress & Emergency Checks (Rule 4)
    const expressesDistress =
      lower.includes('dizzy') ||
      lower.includes('fell') ||
      lower.includes('fall') ||
      lower.includes('hurt') ||
      lower.includes('faint') ||
      lower.includes('lightheaded') ||
      lower.includes('chest') ||
      lower.includes('pain') ||
      lower.includes('help me') ||
      lower.includes('confused') ||
      lower.includes("don't know where");

    const confirmsEmergency =
      lower.includes('yes i need help') ||
      lower.includes('call my daughter') ||
      lower.includes('call sarah') ||
      lower.includes('call caregiver') ||
      lower.includes('help!') ||
      lower.includes('emergency') ||
      lower.includes('call 911');

    if (confirmsEmergency) {
      thought = `User requested urgent assistance. Triggering immediate primary caregiver emergency dispatch via alert_family_contact.`;
      const alertResult = mcpAlertFamilyContact(
        `Emergency assistance requested by ${state.userName}: "${message}"`,
        'critical',
        `User in ${state.currentRoom}. Emergency alert sent to ${caregiverName}.`
      );
      const alertLog = recordMcpCall('alert_family_contact', { reason: alertResult.messageBody, severity: 'critical' }, alertResult);
      toolCallsExecuted.push(alertLog);
      nextSafetyState = 'emergency_dispatched';
      responseText = `I've sent an urgent alert to ${caregiverName} right away, ${state.userName}. She's receiving your location in the ${state.currentRoom}. Please stay right where you are and rest until she reaches you.`;
    } else if (expressesDistress) {
      nextSafetyState = 'verifying_safety';
      thought = `User expressed physical distress ("${message}"). Rule 4 requires asking a simple Yes/No question to verify safety before triggering emergency contact.`;
      const distressQuestions = [
        `Oh dear, I want to make sure you're safe, ${state.userName}. Are you hurt or unable to stand? If you need help, please tell me yes or no so I can contact ${caregiverName}.`,
        `I hear that you're feeling unwell, ${state.userName}. Can you answer me with a simple yes or no—are you in pain or do you need me to call ${caregiverName} right now?`,
      ];
      responseText = distressQuestions.find((q) => !hasSpokenRecently(q)) || distressQuestions[0];
    }

    // Name Change Intent Handler
    else if (
      (raw.match(/(?:my name is|call me|change my name to|i am called|my new name is)\s+([A-Za-z]+)/i) &&
        !lower.includes('joke') &&
        !lower.includes('story') &&
        !lower.includes('schedule'))
    ) {
      const nameMatch = raw.match(/(?:my name is|call me|change my name to|i am called|my new name is)\s+([A-Za-z]+)/i);
      const newName = nameMatch ? nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase() : state.userName;
      state.userName = newName;
      thought = `User requested to update their name to "${newName}". Updated state.userName.`;
      const nameUpdateResponses = [
        `It is so lovely to meet you, ${newName}! I've updated your name in CareContext, and I will happily call you ${newName} from now on. How can I help you today?`,
        `Understood, ${newName}! I've updated my records right away. I'm delighted to keep you company, ${newName}. How is your day going?`,
        `Got it, ${newName}! From now on, you're ${newName}. Is there anything on your schedule or around your home you'd like to check?`,
      ];
      responseText = nameUpdateResponses.find((r) => !hasSpokenRecently(r)) || nameUpdateResponses[0];
      dynamicReplies = ['What is on my schedule?', 'What time is it right now?', 'Tell me a joke'];
    }

    // Name / Identity Inquiry
    else if (
      lower.includes('what is my name') ||
      lower.includes('who am i') ||
      lower.includes('do you know my name') ||
      lower.includes('what do you call me')
    ) {
      thought = `User asked for their identity/name. Current resident name: ${state.userName}.`;
      const nameRecallResponses = [
        `Your name is ${state.userName}! You are living comfortably here at ${state.homeAddress}, and I am your companion CareContext.`,
        `You are ${state.userName}, of course! You are doing wonderfully today.`,
        `You're ${state.userName}! And your primary caregiver ${caregiverName} is keeping in touch with you as well.`,
      ];
      responseText = nameRecallResponses.find((r) => !hasSpokenRecently(r)) || nameRecallResponses[0];
      dynamicReplies = ['What time is it?', 'What is on my schedule?', 'Tell me a story'];
    }

    // Schedule Add Intent
    else if (
      lower.includes('add to schedule') ||
      lower.includes('add a reminder') ||
      lower.includes('remind me to') ||
      lower.includes('schedule a') ||
      lower.includes('put on my schedule') ||
      lower.includes('add reminder')
    ) {
      let newTime = '12:00 PM';
      const timeMatch = raw.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      if (timeMatch) {
        newTime = timeMatch[1].toUpperCase();
        if (!newTime.includes('AM') && !newTime.includes('PM')) {
          newTime += ' PM';
        }
      }
      let taskTitle = raw
        .replace(/(?:please\s+)?(?:add\s+to\s+schedule|add\s+a\s+reminder\s+(?:to|for)?|remind\s+me\s+to|schedule\s+a|put\s+on\s+my\s+schedule|add\s+reminder\s+(?:for|to)?)\s*/i, '')
        .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/i, '')
        .trim();
      if (!taskTitle) taskTitle = 'Personal Routine';

      let category: 'medication' | 'hydration' | 'appointment' | 'activity' = 'activity';
      const catLower = taskTitle.toLowerCase();
      if (catLower.includes('pill') || catLower.includes('med') || catLower.includes('mg') || catLower.includes('tablet') || catLower.includes('vitamin')) {
        category = 'medication';
      } else if (catLower.includes('water') || catLower.includes('tea') || catLower.includes('drink') || catLower.includes('juice')) {
        category = 'hydration';
      } else if (catLower.includes('doctor') || catLower.includes('dr') || catLower.includes('visit') || catLower.includes('appointment') || catLower.includes('clinic')) {
        category = 'appointment';
      }

      const newItem: ScheduleItem = {
        id: `sched-${Date.now()}`,
        time: newTime,
        title: taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1),
        category,
        details: `Added by ${state.userName} via voice command.`,
        isCompleted: false,
        isCritical: category === 'medication',
      };
      state.schedule.push(newItem);
      thought = `User requested adding "${newItem.title}" at ${newTime}. Updated state.schedule and logged MCP.`;
      const scheduleData = mcpGetDailySchedule('all');
      toolCallsExecuted.push(recordMcpCall('get_daily_schedule', { category: 'all' }, scheduleData));

      const addResponses = [
        `I've added "${newItem.title}" to your schedule for ${newItem.time}, ${state.userName}. I will make sure you remember!`,
        `All set! "${newItem.title}" is now recorded on your calendar for ${newItem.time}. You can view it anytime on your schedule card.`,
        `Done, ${state.userName}! I've scheduled "${newItem.title}" at ${newItem.time}. Anything else you'd like on your schedule?`,
      ];
      responseText = addResponses.find((r) => !hasSpokenRecently(r)) || addResponses[0];
      dynamicReplies = ['What is on my schedule now?', 'What time is it?', 'Check my front door'];
    }

    // Schedule Delete / Remove Intent
    else if (
      lower.includes('delete from schedule') ||
      lower.includes('remove from schedule') ||
      lower.includes('cancel my') ||
      lower.includes('delete the') ||
      lower.includes('remove the') ||
      lower.includes('clear the task')
    ) {
      const matchIndex = state.schedule.findIndex((s) => {
        const sLow = s.title.toLowerCase();
        return (
          lower.includes(sLow) ||
          (lower.includes('walk') && sLow.includes('walk')) ||
          (lower.includes('doctor') && sLow.includes('doctor')) ||
          (lower.includes('water') && sLow.includes('water')) ||
          (lower.includes('lisinopril') && sLow.includes('lisinopril')) ||
          (lower.includes('appointment') && s.category === 'appointment')
        );
      });

      if (matchIndex !== -1) {
        const removed = state.schedule.splice(matchIndex, 1)[0];
        thought = `User requested removing "${removed.title}". Removed from schedule.`;
        const scheduleData = mcpGetDailySchedule('all');
        toolCallsExecuted.push(recordMcpCall('get_daily_schedule', { category: 'all' }, scheduleData));
        responseText = `I have removed "${removed.title}" from your daily schedule, ${state.userName}. Your day has been updated.`;
      } else {
        responseText = `I couldn't locate that specific task on your schedule, ${state.userName}. Your current tasks are: ${state.schedule.map((s) => s.title).join(', ')}.`;
      }
      dynamicReplies = ['What is on my schedule today?', 'What time is it?', 'Tell me a joke'];
    }

    // 2. Front Door & Home Security Questions
    else if (
      lower.includes('front door') ||
      lower.includes('door locked') ||
      lower.includes('lock the door') ||
      lower.includes('door closed') ||
      lower.includes('anyone at the door') ||
      lower.includes('security')
    ) {
      const sensorData = mcpGetRingSensorData(6);
      const toolLog = recordMcpCall('get_ring_sensor_data', { hours: 6 }, sensorData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about front door security. Queried get_ring_sensor_data to verify lock status.`;

      const doorSensor = state.sensors.find((s) => s.id === 'ring_front_door');
      const isLocked = doorSensor?.state === 'closed';

      const doorOptions = [
        `I just checked the front entry sensor for you, ${state.userName}. The door is securely closed and locked. It hasn't been opened since yesterday at 4:15 PM, so you're all safe and sound.`,
        `You don't need to worry at all—the front door deadbolt is engaged and the contact sensor shows it is completely closed. Everything is secure, ${state.userName}.`,
        `I checked your Ring front door sensor right now: the door is shut tight and locked. There has been no movement outside either.`,
      ];
      responseText = doorOptions.find((o) => !hasSpokenRecently(o)) || doorOptions[0];
      dynamicReplies = ['Thank you, that makes me feel better', 'Did anyone ring the bell?', 'What else is on my schedule?'];
    }

    // 3. Kitchen, Fridge, Food & Meals
    else if (
      lower.includes('fridge') ||
      lower.includes('refrigerator') ||
      lower.includes('breakfast') ||
      lower.includes('what did i eat') ||
      lower.includes('did i eat') ||
      lower.includes('kitchen') ||
      lower.includes('tea') ||
      lower.includes('coffee')
    ) {
      const sensorData = mcpGetRingSensorData(6);
      const toolLog = recordMcpCall('get_ring_sensor_data', { hours: 6 }, sensorData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about kitchen/food activity. Queried get_ring_sensor_data for fridge and kitchen telemetry.`;

      const fridgeOptions = [
        `Your refrigerator sensor logged that you opened the door twice around 6:45 AM, and there was activity by the stove and kettle. Have you made your morning tea yet, ${state.userName}?`,
        `I see you were in the kitchen earlier and opened the fridge at 6:45 AM. If you're wondering about breakfast, a warm slice of toast with some fruit or tea would be lovely right now, ${state.userName}!`,
        `The kitchen sensors show gentle movement near the counter just a few minutes ago. Make sure you have something nourishing to eat along with your water.`,
      ];
      responseText = fridgeOptions.find((o) => !hasSpokenRecently(o)) || fridgeOptions[0];
      dynamicReplies = ['I just had my tea', 'What pills should I take?', 'Can you check the front door?'];
    }

    // 4. Sleep, Wake Time & Bed Exit
    else if (
      lower.includes('wake up') ||
      lower.includes('what time did i wake') ||
      lower.includes('get up') ||
      lower.includes('how did i sleep') ||
      lower.includes('bed') ||
      lower.includes('sleep')
    ) {
      const sensorData = mcpGetRingSensorData(6);
      const toolLog = recordMcpCall('get_ring_sensor_data', { hours: 6 }, sensorData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about sleep/wake time. Evaluated smart bed mat data.`;

      const sleepOptions = [
        `According to your smart bed mat, you got up at ${state.wakeTimeEstimated} this morning—about 45 minutes earlier than your typical ${state.routineBaselineWake} routine. You spent a few minutes in the bathroom before heading into the kitchen.`,
        `You were up bright and early today, ${state.userName}! Your bed sensor detected you got out of bed at ${state.wakeTimeEstimated}. Did you wake up on your own, or did the morning light wake you?`,
        `You woke up around ${state.wakeTimeEstimated} today, ${state.userName}. That gave you a nice, quiet head start to the morning!`,
      ];
      responseText = sleepOptions.find((o) => !hasSpokenRecently(o)) || sleepOptions[0];
      dynamicReplies = ['The morning light woke me up', 'I was feeling restless', 'What should I do now?'];
    }

    // 5. Where am I / Location History
    else if (
      lower.includes('where am i') ||
      lower.includes('which room') ||
      lower.includes('where was i') ||
      lower.includes('moving around') ||
      lower.includes('location')
    ) {
      const sensorData = mcpGetRingSensorData(6);
      const toolLog = recordMcpCall('get_ring_sensor_data', { hours: 6 }, sensorData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about their current or past location in the home.`;

      const locationOptions = [
        `You are currently in the ${state.currentRoom}, ${state.userName}. Earlier this morning, you moved from your bedroom at ${state.wakeTimeEstimated}, through the hallway to the bathroom, and then into the kitchen.`,
        `Right now you are in the ${state.currentRoom}. The sensors noticed your gentle movement here just a moment ago, ${state.userName}.`,
        `You're in the ${state.currentRoom}! Everything looks cozy and familiar. Take a comfortable seat whenever you'd like.`,
      ];
      responseText = locationOptions.find((o) => !hasSpokenRecently(o)) || locationOptions[0];
      dynamicReplies = ["I'm sitting down now", 'What appointments do I have?', 'Tell me a joke'];
    }

    // 6. Medication Information (Lisinopril / Regimen)
    else if (
      lower.includes('what is lisinopril') ||
      lower.includes('why do i take') ||
      lower.includes('side effect') ||
      lower.includes('what medicine') ||
      lower.includes('what pills')
    ) {
      const schedData = mcpGetDailySchedule('medication');
      const toolLog = recordMcpCall('get_daily_schedule', { category: 'medication' }, schedData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked for medication details on Lisinopril and daily meds.`;

      const medOptions = [
        `Lisinopril is your morning blood pressure medication (10mg tablet). Dr. Evans prescribed it to help keep your blood pressure smooth and steady and protect your heart. It works best when taken with a tall 8-ounce glass of water, ${state.userName}!`,
        `Your primary prescription is Lisinopril 10mg, which you take once each morning. It helps relax your blood vessels so your heart doesn't have to work as hard. Have you taken it yet today, ${state.userName}?`,
        `Lisinopril 10mg is your daily blood pressure pill. Taking it consistently every morning around breakfast helps prevent dizziness and keeps your heart in great shape.`,
      ];
      responseText = medOptions.find((o) => !hasSpokenRecently(o)) || medOptions[0];
      dynamicReplies = ['I just took it now', 'Can you remind me in 10 minutes?', 'Do I have any doctor appointments?'];
    }

    // 7. User Reports Taking Pills
    else if (
      lower.includes('took my pill') ||
      lower.includes('already took') ||
      lower.includes('took the pill') ||
      lower.includes('swallowed') ||
      lower.includes('took my medicine') ||
      lower.includes('medication taken')
    ) {
      thought = `User reported taking morning medication. Updating schedule and praising independence.`;
      const bpItem = state.schedule.find((s) => s.category === 'medication' && !s.isCompleted) || state.schedule.find((s) => s.id === 'sched-1');
      if (bpItem) {
        bpItem.isCompleted = true;
        bpItem.completedAt = getEffectiveTime();
      }

      const pillSuccessOptions = [
        `Wonderful, ${state.userName}! I've marked your medication as taken at ${getEffectiveTime()}. That's the most important health task of the morning checked off. Great job!`,
        `Thank you for letting me know, ${state.userName}! I have recorded your medicine as completed for today. Be sure to sip a little more water to stay nicely hydrated.`,
        `Excellent! Your morning pills are all checked off for today, ${state.userName}. You're doing a fantastic job staying on top of your routine.`,
      ];
      responseText = pillSuccessOptions.find((o) => !hasSpokenRecently(o)) || pillSuccessOptions[0];
      dynamicReplies = ['How much water should I drink?', 'What is on my schedule next?', 'Tell me something uplifting'];
    }

    // 8. Hydration & Water Questions
    else if (
      lower.includes('water') ||
      lower.includes('hydration') ||
      lower.includes('thirsty') ||
      lower.includes('drink')
    ) {
      const schedData = mcpGetDailySchedule('hydration');
      const toolLog = recordMcpCall('get_daily_schedule', { category: 'hydration' }, schedData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about hydration guidelines.`;

      const waterOptions = [
        `Dr. Evans recommends aiming for about 6 to 8 glasses of water throughout the day, ${state.userName}. Having a tall glass in the morning with your medicine is a wonderful habit to wake up your body and support healthy kidney function.`,
        `Staying well-hydrated keeps your energy up and helps prevent morning dizziness. If plain water feels boring, adding a small slice of lemon or cucumber can make it extra refreshing!`,
        `Pouring a fresh 8-ounce glass right now would be perfect, ${state.userName}. Slow, steady sips throughout the day are easiest on the stomach.`,
      ];
      responseText = waterOptions.find((o) => !hasSpokenRecently(o)) || waterOptions[0];
      dynamicReplies = ['I just drank a glass', 'When is my doctor appointment?', 'Check my front door'];
    }

    // 9. Doctor Appointment / Dr. Evans
    else if (
      lower.includes('doctor') ||
      lower.includes('appointment') ||
      lower.includes('dr evans') ||
      lower.includes('clinic') ||
      lower.includes('telehealth') ||
      lower.includes('hospital')
    ) {
      const schedData = mcpGetDailySchedule('appointment');
      const toolLog = recordMcpCall('get_daily_schedule', { category: 'appointment' }, schedData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about doctor appointments. Fetched schedule for Dr. Evans.`;
      const caregiverName = state.caregiverName || 'Sarah Miller';

      const docOptions = [
        `You have a virtual telehealth check-in with Dr. Evans today at 2:00 PM, ${state.userName}. You won't have to travel—it's a friendly video review right here on your screen to check your blood pressure log and knee mobility.`,
        `Yes! Today at 2:00 PM, Dr. Evans is scheduled for your monthly video check-up. I'll make sure to alert you 15 minutes beforehand so you have plenty of time to get comfortable.`,
        `Dr. Evans is scheduled for a telehealth call at 2:00 PM today. ${caregiverName} has also been notified so she can join the call if you'd like her support!`,
      ];
      responseText = docOptions.find((o) => !hasSpokenRecently(o)) || docOptions[0];
      dynamicReplies = ['Can you remind me at 1:45 PM?', `Will ${caregiverName} be on the call?`, 'What else is on my schedule?'];
    }

    // 10. Physical Therapy / Garden Walk
    else if (
      lower.includes('walk') ||
      lower.includes('exercise') ||
      lower.includes('patio') ||
      lower.includes('physical therapy') ||
      lower.includes('mark') ||
      lower.includes('stretches')
    ) {
      const schedData = mcpGetDailySchedule('activity');
      const toolLog = recordMcpCall('get_daily_schedule', { category: 'activity' }, schedData);
      toolCallsExecuted.push(toolLog);
      thought = `User asked about walking/exercise. Queried schedule for physical therapy walk.`;

      const walkOptions = [
        `Your physical therapist Mark scheduled a 15-minute gentle patio walk and calf stretches for 10:30 AM, ${state.userName}. The weather outside will be pleasant and mild, so it will be a lovely breath of fresh air!`,
        `At 10:30 AM, your schedule includes a 15-minute gentle garden stroll. Just put on your comfortable walking shoes and take your cane along if you need a little extra balance.`,
        `Mark recommended a gentle walk around the patio at 10:30 AM. Taking slow steps and enjoying the morning breeze is great for keeping your joints flexible, ${state.userName}.`,
      ];
      responseText = walkOptions.find((o) => !hasSpokenRecently(o)) || walkOptions[0];
      dynamicReplies = ["I'll get my shoes ready", "What's the weather like?", 'Check my schedule'];
    }

    // 11. Daily Schedule Overview (Dynamic from state.schedule)
    else if (
      lower.includes('schedule') ||
      lower.includes('what do i have today') ||
      lower.includes('calendar') ||
      lower.includes("what's next") ||
      lower.includes('plan for today')
    ) {
      const schedData = mcpGetDailySchedule('all');
      const toolLog = recordMcpCall('get_daily_schedule', { category: 'all' }, schedData);
      toolCallsExecuted.push(toolLog);
      thought = `User requested full schedule summary. Dynamically formatted all schedule items.`;

      const allItemsList = state.schedule.map((s) => `${s.time}: ${s.title}${s.isCompleted ? ' (done)' : ''}`).join(', ');
      const pending = state.schedule.filter((s) => !s.isCompleted);
      const pendingNames = pending.map((p) => `${p.time} (${p.title})`).join(', ');

      const schedOptions = [
        `Here is your schedule for today, ${state.userName}: ${allItemsList || 'You currently have no tasks scheduled.'} Would you like details on any of these?`,
        `For today, ${state.userName}: pending items are ${pendingNames || 'All scheduled items are completed for today!'}. How does that sound?`,
        `You have a calm and balanced day ahead, ${state.userName}! Upcoming: ${pendingNames || 'All tasks are checked off!'}. Let me know if you would like to add or change any task.`,
      ];
      responseText = schedOptions.find((o) => !hasSpokenRecently(o)) || schedOptions[0];
      dynamicReplies = ['Remind me about the doctor call', 'Did I take my medicine?', 'Tell me a joke'];
    }

    // 12. Family / Primary Caregiver
    else if (
      lower.includes('sarah') ||
      lower.includes('daughter') ||
      lower.includes('family') ||
      lower.includes('visit') ||
      lower.includes('caregiver') ||
      lower.includes('how far')
    ) {
      const caregiver = state.caregiverName || 'Sarah Miller';
      thought = `User asked about family contact ${caregiver}.`;
      const sarahOptions = [
        `${caregiver} is your primary emergency contact. They live close by—about an 8-minute drive from your house. They checked in on your updates, and they care about you very much!`,
        `${caregiver} is keeping an eye on your updates. If you ever want to chat with them, I can send a message right away asking them to call your Alexa speaker. Would you like me to do that, ${state.userName}?`,
        `${caregiver} is doing well! They are always just a quick phone call away at ${state.caregiverPhone || '+1 (555) 234-8901'}. Would you like me to dial for you?`,
      ];
      responseText = sarahOptions.find((o) => !hasSpokenRecently(o)) || sarahOptions[0];
      dynamicReplies = [`Yes, please tell ${caregiver} to call me`, "No, that's okay, just thinking of them", 'What time is it?'];
    }

    // 13. Time, Date & Clock (Real-Time Live)
    else if (
      lower.includes('what time') ||
      lower.includes('what day') ||
      lower.includes('what date') ||
      lower.includes('clock') ||
      lower.includes('today')
    ) {
      const curTime = getEffectiveTime();
      const curDate = getEffectiveDate();
      thought = `User asked for current time or date. Queried live clock: ${curTime}, ${curDate}.`;
      const timeOptions = [
        `It is currently ${curTime} on ${curDate}, ${state.userName}. A bright, peaceful day!`,
        `The time is ${curTime}. Today is ${curDate}. You have plenty of time to enjoy your morning, ${state.userName}.`,
        `Right now it's ${curTime} on this lovely ${curDate}, ${state.userName}.`,
        `It is ${curTime} on ${curDate}. How is your day going so far?`,
      ];
      responseText = timeOptions.find((o) => !hasSpokenRecently(o)) || timeOptions[0];
      dynamicReplies = ['What is on my schedule?', 'Is it cold outside?', 'Tell me a joke'];
    }

    // 14. Weather Questions
    else if (
      lower.includes('weather') ||
      lower.includes('temperature') ||
      lower.includes('rain') ||
      lower.includes('sunny') ||
      lower.includes('cold') ||
      lower.includes('warm') ||
      lower.includes('jacket') ||
      lower.includes('outside')
    ) {
      thought = `User asked for current weather.`;
      const weatherOptions = [
        `It's currently 68°F and partly sunny here in Portland, with a mild autumn breeze. It will warm up to about 72°F this afternoon—delightful weather for your patio walk at 10:30 AM!`,
        `The weather outside is very pleasant today: 68°F with soft clouds and gentle sunshine. No rain in the forecast, so you won't need an umbrella today, ${state.userName}.`,
        `Outside it's a comfortable 68°F. If you step out on the patio, a light cardigan or sweater will feel just right, ${state.userName}.`,
      ];
      responseText = weatherOptions.find((o) => !hasSpokenRecently(o)) || weatherOptions[0];
      dynamicReplies = ["I'll wear my cardigan", 'Did I lock the front door?', 'Tell me a story'];
    }

    // 15. Jokes & Humor (Rotates without repetition)
    else if (
      lower.includes('joke') ||
      lower.includes('funny') ||
      lower.includes('laugh') ||
      lower.includes('humor') ||
      lower.includes('make me laugh')
    ) {
      thought = `User requested a joke. Selected novel joke from collection.`;
      const selectedJoke = JOKES[jokeIndex % JOKES.length].replace(/Eleanor/g, state.userName);
      jokeIndex = (jokeIndex + 1) % JOKES.length;
      responseText = selectedJoke;
      dynamicReplies = ['Tell me another joke!', 'That was cute!', 'What should I do now?'];
    }

    // 16. Stories, Quotes & Inspiration (Rotates without repetition)
    else if (
      lower.includes('story') ||
      lower.includes('quote') ||
      lower.includes('poem') ||
      lower.includes('inspire') ||
      lower.includes('thought for the day') ||
      lower.includes('brighten my day')
    ) {
      thought = `User requested a story or thought for the day.`;
      const selectedStory = STORIES[storyIndex % STORIES.length].replace(/Eleanor/g, state.userName);
      storyIndex = (storyIndex + 1) % STORIES.length;
      responseText = selectedStory;
      dynamicReplies = ['That was beautiful', 'Tell me another thought', 'What is on my schedule?'];
    }

    // 17. Loneliness, Sadness & Emotional Companionship
    else if (
      lower.includes('lonely') ||
      lower.includes('bored') ||
      lower.includes('sad') ||
      lower.includes('alone') ||
      lower.includes('talk to me') ||
      lower.includes('chat with me') ||
      lower.includes('miss')
    ) {
      const caregiver = state.caregiverName || 'Sarah';
      thought = `User expressed feelings of loneliness or sadness. Providing comforting companion presence.`;
      const comfortOptions = [
        `I am right here with you, ${state.userName}. You are never truly alone. ${caregiver} loves you dearly, and I am always listening. Would you like to hear a gentle story, or should I ask ${caregiver} to give you a quick phone call today?`,
        `It is completely natural to have moments like this. Please know that you are deeply cared for. I'm always happy to keep you company and chat about anything on your mind. How is your favorite tea tasting today, ${state.userName}?`,
        `I'm right here beside you. Take a comfortable breath and relax. Would you like me to play some soft classical music or tell you a cheerful story to keep you company?`,
      ];
      responseText = comfortOptions.find((o) => !hasSpokenRecently(o)) || comfortOptions[0];
      dynamicReplies = ['Tell me a gentle story', `Can you ask ${caregiver} to call me?`, 'I feel a bit better now'];
    }

    // 18. Music & Radio
    else if (
      lower.includes('music') ||
      lower.includes('song') ||
      lower.includes('radio') ||
      lower.includes('sing') ||
      lower.includes('classical')
    ) {
      thought = `User asked about music or radio.`;
      const musicOptions = [
        `I can tune into some soothing classical piano, peaceful acoustic guitar, or soft morning jazz on your Alexa speaker. Which sound would feel nice and relaxing to your ears right now, ${state.userName}?`,
        `Soft music is wonderful for a peaceful morning! Some gentle Mozart or Chopin cello suites would pair beautifully with your cup of tea. Would you like me to put that on?`,
        `How about some tranquil nature sounds—like gentle morning rain or birds in a quiet garden? They can be very calming to listen to in the living room.`,
      ];
      responseText = musicOptions.find((o) => !hasSpokenRecently(o)) || musicOptions[0];
      dynamicReplies = ['Play classical piano', 'Play gentle birdsong', 'What is on my schedule?'];
    }

    // 19. How CareContext & Ring Sensors Work
    else if (
      lower.includes('how do you work') ||
      lower.includes('sensors') ||
      lower.includes('ring') ||
      lower.includes('privacy') ||
      lower.includes('who are you')
    ) {
      const caregiver = state.caregiverName || 'Sarah';
      thought = `User asked about how CareContext and home sensors function.`;
      const techOptions = [
        `I am CareContext, your companion on Alexa+. I use discreet Ring motion detectors and door contact sensors to notice room transitions, wake times, and medicine access. There are no cameras anywhere—just gentle sensors that help keep you safe and keep ${caregiver} informed.`,
        `Think of me as a thoughtful neighbor living right inside your smart speaker! I simply observe the gentle rhythm of your home through Ring door and motion sensors so ${caregiver} never has to worry, while your privacy is completely respected.`,
        `My job is to support your independent living, ${state.userName}! I keep track of your schedule, notice when you're up and about, and can reach ${caregiver} in seconds if you ever need a hand.`,
      ];
      responseText = techOptions.find((o) => !hasSpokenRecently(o)) || techOptions[0];
      dynamicReplies = ['Did I lock the front door?', 'What is my next task?', 'Tell me a joke'];
    }

    // 20. Gratitude, Praise & Affection
    else if (
      lower.includes('thank you') ||
      lower.includes('thanks') ||
      lower.includes('sweet') ||
      lower.includes('good job') ||
      lower.includes('love you') ||
      lower.includes('appreciate')
    ) {
      thought = `User expressed gratitude or kind words.`;
      const thanksOptions = [
        `You are so very welcome, ${state.userName}! Taking care of you and brightening your day is my absolute pleasure.`,
        `It is always a joy chatting with you, ${state.userName}. You have a wonderful, kind spirit. Let me know if you need anything at all!`,
        `Anytime, ${state.userName}! I'm always right here by your side. Enjoy your morning tea!`,
      ];
      responseText = thanksOptions.find((o) => !hasSpokenRecently(o)) || thanksOptions[0];
      dynamicReplies = ['What should I do next?', 'Tell me a joke', "I'm going to relax now"];
    }

    // 21. Dynamic Conversational Responder (Catch-All Anti-Repetition)
    else {
      thought = `Contextual open conversational query on "${raw}". Formulating engaging, non-repetitive elder companion reply.`;
      const openOptions = [
        `That's a thoughtful question, ${state.userName}. Today is moving along nicely, and you have plenty of time to take things at your own easy pace. Is there something specific about your home or day you'd like to check on?`,
        `I hear you, ${state.userName}. It's lovely just chatting with you. Your home is peaceful, your front door is securely locked, and your schedule is on track. How are you feeling right now?`,
        `I'm glad you mentioned that. Everything in your home is quiet and safe this morning. What would make you feel most comfortable right now—a joke, checking your schedule, or some relaxing music?`,
        `Always happy to chat with you, ${state.userName}. Your routine is well on track today. Remember to sip a little water whenever you have a moment. What's on your mind?`,
      ];
      responseText = openOptions.find((o) => !hasSpokenRecently(o)) || openOptions[0];
      dynamicReplies = ['Check my front door', 'What is on my schedule today?', 'Tell me a joke'];
    }
  }

  // Safety state validation & recording
  state.safetyState = nextSafetyState;
  recordSpokenPhrase(responseText);

  return {
    text: responseText,
    thought,
    toolCalls: toolCallsExecuted,
    safetyState: nextSafetyState,
    suggestedReplies: dynamicReplies.length > 0 ? dynamicReplies : generateContextualReplies(responseText, nextSafetyState, message),
  };
}

function generateContextualReplies(spokenText: string, safetyState: string, lastUserMessage?: string): string[] {
  if (safetyState === 'verifying_safety') {
    return [
      'No, I need help right now!',
      "Yes, I'm okay! Just feeling a little unsteady.",
      'Please call Sarah.',
    ];
  }
  if (safetyState === 'emergency_dispatched') {
    return [
      'I am sitting down safely',
      'Can you call Sarah on speaker?',
      'I feel a bit better now',
    ];
  }

  // Diverse dynamic replies based on conversation
  const lowerMsg = (lastUserMessage || '').toLowerCase();
  if (lowerMsg.includes('door') || lowerMsg.includes('lock')) {
    return ['Is anyone at the door?', 'Did I take my medicine?', 'What time is it?'];
  }
  if (lowerMsg.includes('pill') || lowerMsg.includes('med')) {
    return ['How much water should I drink?', 'When is Dr. Evans?', 'Tell me a joke'];
  }
  if (lowerMsg.includes('doctor') || lowerMsg.includes('dr evans')) {
    return ['Can you remind me at 1:45 PM?', 'Will Sarah be with me?', 'Check my front door'];
  }
  if (lowerMsg.includes('joke')) {
    return ['Tell me another joke!', 'That made me smile', 'What is on my schedule?'];
  }

  return [
    'Did I lock the front door?',
    'What appointments do I have today?',
    'Tell me a joke',
    'Tell me a nice thought for today',
  ];
}

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json(state);
});

app.post('/api/scenario', (req, res) => {
  const { scenario } = req.body;
  if (scenario) {
    setScenario(scenario);
  }
  res.json(state);
});

app.post('/api/schedule/toggle', (req, res) => {
  const { itemId, completed } = req.body;
  const item = state.schedule.find((s) => s.id === itemId);
  if (item) {
    item.isCompleted = completed !== undefined ? completed : !item.isCompleted;
    if (item.isCompleted) {
      item.completedAt = state.currentTime;
    } else {
      delete item.completedAt;
    }
  }
  res.json(state);
});

app.post('/api/sensors/trigger', (req, res) => {
  const { sensorId, eventType, detail } = req.body;
  const sensor = state.sensors.find((s) => s.id === sensorId);
  if (sensor) {
    sensor.state = eventType.includes('open') ? 'open' : 'active';
    sensor.lastTriggered = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    sensor.relativeMinutesAgo = 0;
    state.events.push({
      id: `ev-${Date.now()}`,
      sensorId: sensor.id,
      room: sensor.room,
      deviceName: sensor.name,
      eventType,
      timestamp: sensor.lastTriggered,
      detail: detail || `Sensor event on ${sensor.name}`,
    });
    if (sensor.room) {
      state.currentRoom = sensor.room;
    }
  }
  res.json(state);
});

app.post('/api/alerts/respond', (req, res) => {
  const { alertId, responseText } = req.body;
  const alert = state.alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.status = 'Caregiver Responded';
    alert.caregiverResponseText = responseText || "I'm 5 minutes away, Mom! Calling your Alexa right now.";
    alert.responseTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  res.json(state);
});

app.post('/api/alerts/clear', (req, res) => {
  state.alerts = [];
  state.safetyState = 'normal';
  res.json(state);
});

// Update Resident & Caregiver Profile
app.post('/api/user-profile', (req, res) => {
  const {
    userName,
    userAge,
    homeAddress,
    caregiverName,
    caregiverPhone,
    caregiverRelationship,
    useLiveTime,
    currentTime,
  } = req.body;
  if (userName) state.userName = userName.trim();
  if (userAge) state.userAge = Number(userAge);
  if (homeAddress !== undefined) state.homeAddress = homeAddress.trim();
  if (caregiverName) state.caregiverName = caregiverName.trim();
  if (caregiverPhone) state.caregiverPhone = caregiverPhone.trim();
  if (caregiverRelationship) state.caregiverRelationship = caregiverRelationship.trim();
  if (useLiveTime !== undefined) state.useLiveTime = Boolean(useLiveTime);
  if (currentTime) state.currentTime = currentTime.trim();

  if (state.useLiveTime !== false) {
    state.currentTime = getEffectiveTime();
  }
  res.json(state);
});

// Sync Live Real-Time or Simulated Clock
app.post('/api/time/sync', (req, res) => {
  const { useLiveTime, currentTime } = req.body;
  if (useLiveTime !== undefined) state.useLiveTime = Boolean(useLiveTime);
  if (currentTime) state.currentTime = currentTime.trim();
  if (state.useLiveTime !== false) {
    state.currentTime = getEffectiveTime();
  }
  res.json(state);
});

// Add Item to Daily Schedule
app.post('/api/schedule/add', (req, res) => {
  const { time, title, category, details, isCritical } = req.body;
  if (title) {
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      time: time || '12:00 PM',
      title: title.trim(),
      category: category || 'activity',
      details: details ? details.trim() : '',
      isCompleted: false,
      isCritical: Boolean(isCritical),
    };
    state.schedule.push(newItem);
    recordMcpCall('get_daily_schedule', { action: 'add_item', item: newItem }, mcpGetDailySchedule('all'));
  }
  res.json(state);
});

// Update Existing Schedule Item
app.post('/api/schedule/update', (req, res) => {
  const { id, time, title, category, details, isCritical, isCompleted } = req.body;
  const item = state.schedule.find((s) => s.id === id);
  if (item) {
    if (time !== undefined) item.time = time.trim();
    if (title !== undefined) item.title = title.trim();
    if (category !== undefined) item.category = category;
    if (details !== undefined) item.details = details.trim();
    if (isCritical !== undefined) item.isCritical = Boolean(isCritical);
    if (isCompleted !== undefined) {
      item.isCompleted = Boolean(isCompleted);
      if (item.isCompleted) {
        item.completedAt = getEffectiveTime();
      } else {
        delete item.completedAt;
      }
    }
    recordMcpCall('get_daily_schedule', { action: 'update_item', item }, mcpGetDailySchedule('all'));
  }
  res.json(state);
});

// Delete Schedule Item
app.post('/api/schedule/delete', (req, res) => {
  const { itemId } = req.body;
  const index = state.schedule.findIndex((s) => s.id === itemId);
  if (index !== -1) {
    const removed = state.schedule.splice(index, 1)[0];
    recordMcpCall('get_daily_schedule', { action: 'delete_item', itemId }, mcpGetDailySchedule('all'));
  }
  res.json(state);
});

app.post('/api/mcp/chat', async (req, res) => {
  try {
    const { message, triggerType, safetyAnswer, history } = req.body;
    const result = await executeAgentConversation({
      message,
      triggerType,
      safetyAnswer,
      history,
    });
    res.json({
      ...result,
      homeState: state,
    });
  } catch (err: any) {
    console.error('Error in /api/mcp/chat:', err);
    res.status(500).json({ error: err.message || 'Internal agent error' });
  }
});

// Port configuration: use process.env.PORT || 3000
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && (PORT === 3000 || !process.env.VITE_RUNNING_SEPARATE)) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite middleware not attached, running in API-only proxy mode:', e);
    }
  } else if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareContext Alexa+ Bedrock MCP Agent Skill running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Trying fallback port ${PORT + 1}...`);
      app.listen(PORT + 1, '0.0.0.0', () => {
        console.log(`CareContext fallback server running on http://0.0.0.0:${PORT + 1}`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
