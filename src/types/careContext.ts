export interface RingSensor {
  id: string;
  name: string;
  room: 'Bedroom' | 'Bathroom' | 'Kitchen' | 'Living Room' | 'Front Entry';
  type: 'motion' | 'door_contact' | 'pressure';
  state: 'active' | 'clear' | 'open' | 'closed';
  battery: number;
  lastTriggered: string;
  relativeMinutesAgo: number;
  description: string;
}

export interface SensorEvent {
  id: string;
  sensorId: string;
  room: string;
  deviceName: string;
  eventType: 'motion_detected' | 'motion_cleared' | 'door_opened' | 'door_closed' | 'bed_exit';
  timestamp: string;
  detail: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  category: 'medication' | 'hydration' | 'appointment' | 'activity';
  details: string;
  isCompleted: boolean;
  isCritical: boolean;
  completedAt?: string;
}

export interface CaregiverAlert {
  id: string;
  timestamp: string;
  severity: 'high' | 'urgent' | 'critical';
  reason: string;
  details: string;
  recipient: {
    name: string;
    relationship: string;
    phone: string;
    channel: string;
  };
  status: 'Sent' | 'Delivered' | 'Caregiver Responded' | 'Resolved';
  sensorSnapshot: string;
  caregiverResponseText?: string;
  responseTime?: string;
}

export interface McpToolCall {
  jsonrpc: '2.0';
  id: string;
  method: 'tools/call';
  params: {
    name: 'get_ring_sensor_data' | 'get_daily_schedule' | 'alert_family_contact';
    arguments: Record<string, unknown>;
  };
  tool: 'get_ring_sensor_data' | 'get_daily_schedule' | 'alert_family_contact';
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  latencyMs: number;
  timestamp: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  thought?: string;
  toolCalls?: McpToolCall[];
  safetyState?: 'normal' | 'verifying_safety' | 'emergency_dispatched';
  isSpoken?: boolean;
}

export interface HomeState {
  currentScenario: string;
  userName: string;
  userAge: number;
  homeAddress: string;
  currentTime: string;
  useLiveTime?: boolean;
  currentRoom: string;
  wakeTimeEstimated: string;
  routineBaselineWake: string;
  caregiverName?: string;
  caregiverPhone?: string;
  caregiverRelationship?: string;
  sensors: RingSensor[];
  events: SensorEvent[];
  schedule: ScheduleItem[];
  alerts: CaregiverAlert[];
  mcpLogs: McpToolCall[];
  safetyState: 'normal' | 'verifying_safety' | 'emergency_dispatched';
}
