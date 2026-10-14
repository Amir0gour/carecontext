export type RoomType =
  | 'Bedroom'
  | 'Bathroom'
  | 'Kitchen'
  | 'Living Room'
  | 'Front Entry'
  | 'Patio & Garden'
  | 'Hallway'
  | 'Second Floor Suite'
  | 'Stairway'
  | 'Garage'
  | 'Guest Bedroom'
  | string;

export interface RingSensor {
  id: string;
  name: string;
  room: RoomType;
  level?: 'Ground Floor' | 'Second Floor' | 'Single Level';
  type: 'motion' | 'door_contact' | 'pressure' | 'water_freeze' | 'glass_break' | 'doorbell' | 'window_contact';
  state: 'active' | 'clear' | 'open' | 'closed' | 'leak_detected' | 'safe' | 'alert';
  battery: number;
  lastTriggered: string;
  relativeMinutesAgo: number;
  description: string;
  floorPlanId?: string;
}

export interface SensorEvent {
  id: string;
  sensorId: string;
  room: string;
  deviceName: string;
  eventType:
    | 'motion_detected'
    | 'motion_cleared'
    | 'door_opened'
    | 'door_closed'
    | 'bed_exit'
    | 'water_leak'
    | 'water_cleared'
    | 'doorbell_ring'
    | 'glass_break'
    | 'pill_taken'
    | 'window_opened'
    | 'window_closed';
  timestamp: string;
  detail: string;
}

export type FloorPlanId = 'ranch_single_story' | 'townhouse_two_story' | 'compact_suite';

export interface FloorPlanRoom {
  id: string;
  name: string;
  level: string;
  dimensions?: string;
  description: string;
  sensorIds: string[];
}

export interface FloorPlanConfig {
  id: FloorPlanId;
  name: string;
  tagline: string;
  description: string;
  levels: string[];
  defaultRoom: string;
  rooms: FloorPlanRoom[];
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
  floorPlanId?: FloorPlanId;
  activeFloorLevel?: string;
}

