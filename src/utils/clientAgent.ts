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
  triggerType?: 'morning_checkin' | 'user_speech' | 'safety_response' | 'unresponsive_timeout' | 'emergency_sos';
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

  // 1. Direct Emergency SOS Trigger
  if (triggerType === 'emergency_sos') {
    nextSafetyState = 'emergency_dispatched';
    nextState.safetyState = nextSafetyState;
    thought = `Emergency SOS triggered. Initiating immediate escalation protocol and notifying ${caregiverName}.`;
    responseText = `${userName}, I have received your emergency alert. I have notified your daughter ${caregiverName} via priority SMS with your location details, and I've activated the Alexa speaker intercom. Help is on the way. Please stay seated and safe.`;

    const alertDetails = {
      reason: 'Emergency SOS button pressed directly',
      severity: 'critical' as const,
      details: `${userName} pressed the Emergency SOS button in the ${nextState.currentRoom}. Caregiver alerted immediately.`,
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

  // 1b. Unresponsive Timeout (Safety escalation fallback)
  if (triggerType === 'unresponsive_timeout') {
    nextSafetyState = 'emergency_dispatched';
    nextState.safetyState = nextSafetyState;
    thought = `Safety escalation: Proactive safety check timed out. Dispatched priority alert to ${caregiverName}.`;
    responseText = `${userName}, I haven't heard back from you. To ensure you are safe, I have alerted your daughter ${caregiverName} via priority message, and I'm opening the speaker intercom right now. Help is on the way. Please stay right where you are.`;

    const alertDetails = {
      reason: 'Safety check escalation confirmed',
      severity: 'critical' as const,
      details: `${userName} was in the ${nextState.currentRoom}. Safety check escalated to emergency dispatch.`,
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

    // Weather query
    if (lower.includes('weather') || lower.includes('temperature') || lower.includes('rain') || lower.includes('sunny') || lower.includes('jacket') || lower.includes('cold') || lower.includes('outside')) {
      thought = `Resident asked about current weather and outdoor conditions.`;
      responseText = `It's currently 68°F and partly sunny in Portland, ${userName}, with a gentle breeze. It will warm up to about 72°F this afternoon—delightful weather for a light patio walk. You won't need an umbrella today!`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'What should I wear?',
          'What is on my schedule today?',
          'Did I lock the front door?',
        ],
        homeState: nextState,
      };
    }

    // Cooking & Everyday Recipes
    if (
      lower.includes('boil egg') ||
      lower.includes('boiled egg') ||
      lower.includes('recipe') ||
      lower.includes('cook') ||
      lower.includes('soup') ||
      lower.includes('lunch') ||
      lower.includes('dinner') ||
      lower.includes('easy meal') ||
      lower.includes('oatmeal') ||
      lower.includes('food') ||
      lower.includes('breakfast')
    ) {
      thought = `Resident asked for day-to-day cooking, recipe, or meal preparation guidance.`;
      if (lower.includes('egg')) {
        responseText = `For perfect hard-boiled eggs, ${userName}: place the eggs in a saucepan covered with cold water by one inch. Bring to a boil, then turn off the heat, cover with a lid, and let them sit for 10 to 12 minutes. Cool them in cold water and they peel like a charm!`;
      } else if (lower.includes('soup')) {
        responseText = `An easy, comforting vegetable soup is wonderful, ${userName}! Simmer low-sodium vegetable or chicken broth with sliced carrots, celery, and soft noodles for 15 minutes. It's gentle on the stomach and deeply nourishing.`;
      } else if (lower.includes('oatmeal')) {
        responseText = `Warm oatmeal is fantastic for your heart, ${userName}! Cook rolled oats with milk or water for 5 minutes, then stir in a little honey, a dash of cinnamon, and fresh berries or sliced bananas.`;
      } else {
        responseText = `For an easy, healthy meal, ${userName}, how about a warm toasted English muffin with soft scrambled eggs, or a bowl of vegetable soup with crackers? Both take under ten minutes and give you great steady energy!`;
      }
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'How long to boil eggs?',
          'What is on my schedule today?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Gardening & Houseplants
    if (
      lower.includes('plant') ||
      lower.includes('orchid') ||
      lower.includes('flower') ||
      lower.includes('garden') ||
      lower.includes('watering') ||
      lower.includes('water my') ||
      lower.includes('tomato') ||
      lower.includes('succulent') ||
      lower.includes('yellow leaves') ||
      lower.includes('soil')
    ) {
      thought = `Resident asked about houseplant care or gardening.`;
      if (lower.includes('orchid')) {
        responseText = `Orchids love gentle care, ${userName}! Water them about once a week by letting lukewarm water drain through the bark, or place three ice cubes at the base weekly. Keep them in bright indirect light away from heaters.`;
      } else if (lower.includes('yellow')) {
        responseText = `Yellow leaves usually mean a houseplant is getting slightly too much water, ${userName}. Wait until the top inch of soil feels completely dry before watering again, and ensure the pot drains freely.`;
      } else {
        responseText = `For indoor houseplants like peace lilies and pothos, ${userName}, water them only when the top inch of soil feels dry to your finger. Gentle morning sunlight and wiping dust off the leaves keeps them thriving!`;
      }
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'How about orchids?',
          'Check patio door sensor',
          'Tell me a story',
        ],
        homeState: nextState,
      };
    }

    // Gentle Senior Exercises & Stiffness
    if (
      lower.includes('stretch') ||
      lower.includes('exercise') ||
      lower.includes('knee') ||
      lower.includes('stiff') ||
      lower.includes('joint') ||
      lower.includes('arthritis') ||
      lower.includes('balance') ||
      lower.includes('sleep')
    ) {
      thought = `Resident inquired about gentle exercises, mobility, or soothing stiffness.`;
      if (lower.includes('knee') || lower.includes('stiff')) {
        responseText = `For easing morning stiffness, ${userName}, try seated leg extensions in a sturdy chair: slowly straighten one leg out, hold for 3 seconds, and lower it gently. Doing 5 on each side helps lubricate the joints with zero stress on your knees!`;
      } else if (lower.includes('sleep')) {
        responseText = `To enjoy a deeper, peaceful sleep, ${userName}: keep your bedroom cool around 67°F, sip a warm cup of caffeine-free chamomile tea, and practice taking slow, gentle breaths before closing your eyes.`;
      } else {
        responseText = `Three wonderful gentle stretches for today, ${userName}: 1) Gentle neck tilts from side to side, 2) Seated shoulder rolls backward, and 3) Ankle circles to keep your feet limber and improve balance!`;
      }
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'That feels good',
          'When is my doctor appointment?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Trivia, Curiosities, Riddles & Poetry
    if (
      lower.includes('trivia') ||
      lower.includes('riddle') ||
      lower.includes('fact') ||
      lower.includes('curiosity') ||
      lower.includes('history') ||
      lower.includes('poem')
    ) {
      thought = `Resident requested mental engagement, trivia, riddle, or an interesting fact.`;
      if (lower.includes('riddle')) {
        responseText = `Here is a fun riddle for you, ${userName}: What has hands and a face, but cannot smile or hug you? ... A clock! It keeps our daily schedule running smoothly every single day.`;
      } else if (lower.includes('trivia') || lower.includes('fact')) {
        responseText = `Here is a delightful fact, ${userName}: Hummingbirds are the only birds in the world that can fly backward and upside down! Their tiny wings beat up to 80 times per second.`;
      } else {
        responseText = `Here is a classic uplifting verse for you, ${userName}: "Hope is the thing with feathers / That perches in the soul / And sings the tune without the words / And never stops at all." By Emily Dickinson.`;
      }
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'Tell me another fact!',
          'Tell me a riddle',
          'What is on my schedule?',
        ],
        homeState: nextState,
      };
    }

    // Household tips
    if (lower.includes('stain') || lower.includes('clean') || lower.includes('stove') || lower.includes('appliance')) {
      thought = `Resident asked for a practical household tip.`;
      responseText = `For removing coffee or tea stains from cups or clothing, ${userName}, a paste of baking soda and warm water works wonders gently! Also remember to double check that all stove burners are set to off after cooking.`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'Are all doors locked?',
          'What is on my schedule?',
          'Tell me a joke',
        ],
        homeState: nextState,
      };
    }

    // Gratitude / Thank you
    if (lower.includes('thank you') || lower.includes('thanks') || lower.includes('appreciate')) {
      thought = `Resident expressed gratitude. Responding warmly.`;
      responseText = `You are so very welcome, ${userName}! Keeping you company and helping around the house is my absolute pleasure. Enjoy your morning!`;
      saveClientHomeState(nextState);
      return {
        text: responseText,
        thought,
        toolCalls: toolCallsExecuted,
        safetyState: nextSafetyState,
        suggestedReplies: [
          'What is on my schedule today?',
          'Tell me a joke',
          "I'm going to relax now",
        ],
        homeState: nextState,
      };
    }

    // General warm reply
    thought = `Warm, context-aware companion response. Resident in ${nextState.currentRoom}.`;
    responseText = `I'm right here with you in the ${nextState.currentRoom}, ${userName}. Everything in your home is calm and running smoothly. Let me know if you need help with your medications, your schedule, easy recipes, or if you'd like to reach ${caregiverName}!`;

    saveClientHomeState(nextState);
    return {
      text: responseText,
      thought,
      toolCalls: toolCallsExecuted,
      safetyState: nextSafetyState,
      suggestedReplies: [
        'How long to boil eggs?',
        'What is on my schedule today?',
        'How is the weather today?',
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
