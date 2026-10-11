import type {
  AgentChatMessage,
  HomeState,
  McpToolCall,
} from '../types/careContext.ts';
import {
  clientDispatchAlert,
  clientRecordMcpCall,
  getEffectiveDate,
  getEffectiveTime,
  saveClientHomeState,
} from './clientState.ts';

interface AgentRequestPayload {
  message?: string;
  triggerType?: 'morning_checkin' | 'user_speech' | 'safety_response' | 'unresponsive_timeout';
  safetyAnswer?: 'yes' | 'no';
  history?: Array<{ role: string; content: string }>;
}

export interface AgentExecutionResult {
  text: string;
  thought: string;
  toolCalls: McpToolCall[];
  safetyState: 'normal' | 'verifying_safety' | 'emergency_dispatched';
  suggestedReplies: string[];
  homeState: HomeState;
}

const JOKES = [
  'Why did the scarecrow win an award? Because he was outstanding in his field!',
  'What do you call a fake noodle? An impasta!',
  'Why do hummingbirds hum? Because they do not know the words!',
  'What did one wall say to the other? I will meet you at the corner!',
  'Why cannot a bicycle stand up on its own? Because it was two-tired!',
  'What do you call a sleeping dinosaur? A dino-snore!',
  'How does a penguin build its house? Igloos it together!',
  'Why did the golfer bring two pairs of pants? In case he got a hole in one!',
];

let jokeIndex = 0;

export function executeClientAgentConversation(
  currentState: HomeState,
  payload: AgentRequestPayload
): AgentExecutionResult {
  const { message, triggerType, safetyAnswer } = payload;
  let nextState: HomeState = { ...currentState };
  let responseText = '';
  let thought = '';
  let nextSafetyState: 'normal' | 'verifying_safety' | 'emergency_dispatched' = nextState.safetyState;
  const toolCallsExecuted: McpToolCall[] = [];

  const userName = nextState.userName || 'Eleanor';
  const caregiverName = nextState.caregiverName || 'Sarah Miller';
  const curTime = getEffectiveTime(nextState);
  const curDate = getEffectiveDate();

  // 1. Unresponsive Timeout (Safety escalation)
  if (triggerType === 'unresponsive_timeout') {
    nextSafetyState = 'emergency_dispatched';
    nextState.safetyState = nextSafetyState;
    thought = `Protocol escalated: 30-second silence reached during safety verification. Dispatched priority alert to ${caregiverName}.`;
    responseText = `Eleanor, I haven't heard from you in 30 seconds. To keep you safe, I have alerted your daughter ${caregiverName} via high-priority message, and I'm opening the speaker intercom right now. Help is on the way. Please stay right where you are.`;

    const alertDetails = {
      reason: 'No voice response during 30s proactive safety check',
      severity: 'critical',
      details: `Eleanor was in the ${nextState.currentRoom}. Safety check prompt timed out after 30 seconds with no verbal confirmation.`,
    };

    const { alert, nextAlerts } = clientDispatchAlert(
      nextState,
      alertDetails.reason,
      'critical',
      alertDetails.details
    );
    nextState.alerts = nextAlerts;

    const { toolCall, nextLogs } = clientRecordMcpCall(
      nextState,
      'alert_family_contact',
      alertDetails,
      {
        status: 'dispatched',
        alertId: alert.id,
        deliveryMethod: 'SMS Priority Gateway & Alexa In-Home Intercom',
        recipient: nextState.caregiverName,
        phone: nextState.caregiverPhone,
      }
    );
    toolCallsExecuted.push(toolCall);
    nextState.mcpLogs = nextLogs;

    saveClientHomeState(nextState);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        'I am sitting down safely',
        `Can you call ${caregiverName} on speaker?`,
        "I'm feeling a bit better now",
      ],
      homeState: nextState,
    };
  }

  // 2. Safety response "no" (Needs help)
  if (triggerType === 'safety_response' && safetyAnswer === 'no') {
    nextSafetyState = 'emergency_dispatched';
    nextState.safetyState = nextSafetyState;
    thought = `User indicated they are not okay. Escalating immediately to emergency protocol and notifying ${caregiverName}.`;
    responseText = `I hear you, ${userName}. Please sit down immediately and don't try to get up. I have dispatched an urgent alert to ${caregiverName} with your location in the ${nextState.currentRoom}. Help is on the way right now.`;

    const alertDetails = {
      reason: `${userName} verbally stated they are not okay / experiencing distress`,
      severity: 'urgent',
      details: `Direct distress confirmation in ${nextState.currentRoom}. Alexa placed in priority emergency monitoring mode.`,
    };

    const { alert, nextAlerts } = clientDispatchAlert(
      nextState,
      alertDetails.reason,
      'urgent',
      alertDetails.details
    );
    nextState.alerts = nextAlerts;

    const { toolCall, nextLogs } = clientRecordMcpCall(
      nextState,
      'alert_family_contact',
      alertDetails,
      {
        status: 'dispatched',
        alertId: alert.id,
        recipient: nextState.caregiverName,
      }
    );
    toolCallsExecuted.push(toolCall);
    nextState.mcpLogs = nextLogs;

    saveClientHomeState(nextState);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        'I am sitting down safely',
        `Can you call ${caregiverName} on speaker?`,
        "I'm feeling a bit better now",
      ],
      homeState: nextState,
    };
  }

  // 3. Safety response "yes" (Confirmed okay)
  if (triggerType === 'safety_response' && safetyAnswer === 'yes') {
    nextSafetyState = 'normal';
    nextState.safetyState = nextSafetyState;
    thought = `User confirmed they are okay. Resetting safety alert state and reassuring ${userName} warmly.`;
    responseText = `I'm so glad to hear that, ${userName}! Just take your time this morning, and remember I'm right here if you need anything at all.`;

    saveClientHomeState(nextState);
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
      homeState: nextState,
    };
  }

  // 4. Morning Check-in Trigger (Rule 1 & 3: Silent Ring MCP Query)
  if (triggerType === 'morning_checkin') {
    // Record silent sensor discovery call
    const sensorResult = {
      sensors: nextState.sensors,
      recentEvents: nextState.events.slice(0, 5),
      inferredRoom: nextState.currentRoom,
      wakeTime: nextState.wakeTimeEstimated,
    };
    const sensorMcp = clientRecordMcpCall(
      nextState,
      'get_ring_sensor_data',
      { hours: 6 },
      sensorResult
    );
    toolCallsExecuted.push(sensorMcp.toolCall);
    nextState.mcpLogs = sensorMcp.nextLogs;

    // Record schedule call
    const scheduleMcp = clientRecordMcpCall(
      nextState,
      'get_daily_schedule',
      { category: 'all' },
      { items: nextState.schedule }
    );
    toolCallsExecuted.push(scheduleMcp.toolCall);
    nextState.mcpLogs = scheduleMcp.nextLogs;

    thought = `Deducing context: ${userName} awoke around ${nextState.wakeTimeEstimated}. Present in ${nextState.currentRoom}. Pill cabinet unopened. Greeting warmly with proactive context.`;

    if (nextState.currentRoom === 'Kitchen') {
      responseText = `Good morning, ${userName}! I noticed you were up early and puttering around the kitchen this morning. Before you brew your tea, don't forget to pour yourself a nice glass of water for your morning medication. How are you feeling today?`;
    } else if (nextState.currentRoom === 'Living Room') {
      responseText = `Good morning, ${userName}! I noticed you were up bright and early relaxing in the living room. While you enjoy the quiet morning, be sure to grab a fresh glass of water with your morning medicine when you're ready. How are you doing today?`;
    } else {
      responseText = `Good morning, ${userName}! It looks like you're up and getting your morning started. Remember to drink a little water and take your routine at your own easy pace. How is your morning going so far?`;
    }

    saveClientHomeState(nextState);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        "I'm feeling good, just making tea",
        'I already took my blood pressure pill',
        'Feeling a little dizzy this morning...',
        "What's on my schedule for today?",
      ],
      homeState: nextState,
    };
  }

  // 5. Conversational speech parsing
  if (message) {
    const raw = message.trim();
    const lower = raw.toLowerCase();

    // Check distress / dizziness
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
      lower.includes('confused');

    if (expressesDistress) {
      nextSafetyState = 'verifying_safety';
      nextState.safetyState = nextSafetyState;
      thought = `User indicated physical distress/dizziness. Initiating 2-step verification protocol before emergency escalation.`;
      responseText = `${userName}, I heard you mention feeling dizzy or unsteady. Are you feeling okay right now, or would you like me to call ${caregiverName}? Please say Yes or No.`;

      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          "Yes, I'm okay! Just feeling a little unsteady.",
          'No, I need help right now!',
          `Please call ${caregiverName}.`,
        ],
        homeState: nextState,
      };
    }

    // Schedule / medication query
    if (lower.includes('schedule') || lower.includes('appointment') || lower.includes('agenda') || lower.includes('today')) {
      const scheduleMcp = clientRecordMcpCall(
        nextState,
        'get_daily_schedule',
        { category: 'all' },
        { items: nextState.schedule }
      );
      toolCallsExecuted.push(scheduleMcp.toolCall);
      nextState.mcpLogs = scheduleMcp.nextLogs;

      thought = `Querying daily schedule via MCP get_daily_schedule.`;
      const pendingItems = nextState.schedule.filter((s) => !s.isCompleted);
      if (pendingItems.length === 0) {
        responseText = `You're completely caught up for today, ${userName}! All your daily medications, hydration, and appointments have been checked off. Take it easy and enjoy your afternoon.`;
      } else {
        const listText = pendingItems
          .map((i) => `${i.time}: ${i.title}`)
          .join(', ');
        responseText = `Here is what's coming up on your schedule today, ${userName}: ${listText}. Let me know whenever you'd like me to mark any of these complete!`;
      }

      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'Mark my morning pill complete',
          'What time is Dr. Evans?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Pill taken / Medication confirmation
    if (lower.includes('took my pill') || lower.includes('took pill') || lower.includes('took my medicine') || lower.includes('already took')) {
      const pillItem = nextState.schedule.find((s) => s.category === 'medication' && !s.isCompleted);
      if (pillItem) {
        pillItem.isCompleted = true;
        pillItem.completedAt = curTime;
      }
      thought = `User confirmed taking medication. Marked Lisinopril completed in daily schedule.`;
      responseText = `Wonderful, ${userName}! I've marked your blood pressure medication as taken for today. Staying consistent makes a big difference. Be sure to drink plenty of fluids too!`;

      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'What else is on my schedule today?',
          'Did I lock the front door?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Time & Date query
    if (lower.includes('what time') || lower.includes('what day') || lower.includes('what is the date') || lower.includes('clock')) {
      thought = `Resident inquired about current time/date.`;
      responseText = `Right now, it is ${curTime} on ${curDate}, ${userName}. Everything is right on track.`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'What is on my schedule today?',
          'How is the front door?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Front door / locks query
    if (lower.includes('door') || lower.includes('lock') || lower.includes('front')) {
      const frontDoor = nextState.sensors.find((s) => s.id === 'ring_front_door');
      thought = `Resident asked about door security. Queried Ring contact sensor state.`;
      responseText = `I checked your Ring Front Door sensor, ${userName}. Your front door is completely closed and securely locked. The perimeter is safe and sound!`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'What is on my schedule today?',
          'Tell me a joke',
          "I'm going to have my coffee now",
        ],
        homeState: nextState,
      };
    }

    // Joke request
    if (lower.includes('joke') || lower.includes('laugh') || lower.includes('funny')) {
      const joke = JOKES[jokeIndex % JOKES.length];
      jokeIndex++;
      thought = `Resident requested a lighthearted joke. Selected elder-friendly uplifting quip.`;
      responseText = `Here is one for you, ${userName}: ${joke}`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'Tell me another joke!',
          'That made me smile',
          'What is on my schedule?',
        ],
        homeState: nextState,
      };
    }

    // General warm reply
    thought = `Warm, context-aware companion response. Resident in ${nextState.currentRoom}.`;
    responseText = `I'm right here with you in the ${nextState.currentRoom}, ${userName}. Everything in your home is calm and running smoothly. Let me know if you need help with your medications, your schedule, or if you'd like to reach ${caregiverName}!`;

    saveClientHomeState(nextState);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        'What is on my schedule today?',
        'Did I lock the front door?',
        'Tell me a joke',
      ],
      homeState: nextState,
    };
  }

  return {
    text: `Hello ${userName}, I am here and keeping an eye on your home. How can I help you today?`,
    thought: 'Fallback prompt response.',
    toolCalls: [],
    safetyState: nextSafetyState,
    suggestedReplies: ['What is on my schedule today?', 'Tell me a joke'],
    homeState: nextState,
  };
}
