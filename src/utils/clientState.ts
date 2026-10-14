import type {
  AgentChatMessage,
  CaregiverAlert,
  FloorPlanConfig,
  FloorPlanId,
  HomeState,
  McpToolCall,
  RingSensor,
  ScheduleItem,
  SensorEvent,
} from '../types/careContext.ts';

const STORAGE_KEY = 'carecontext_homestate_v2';

export const FLOOR_PLANS: FloorPlanConfig[] = [
  {
    id: 'ranch_single_story',
    name: 'Single-Story Suburban Ranch',
    tagline: "Eleanor's Residence (Primary Layout)",
    description: '1,450 sq ft single-level home with zero-threshold entries and perimeter Ring sensor coverage.',
    levels: ['Ground Floor'],
    defaultRoom: 'Kitchen',
    rooms: [
      {
        id: 'bedroom',
        name: 'Master Bedroom',
        level: 'Ground Floor',
        dimensions: '14 x 16 ft',
        description: 'Sleeping quarters, nightstand monitoring, and bed exit tracking',
        sensorIds: ['ring_bed_pressure', 'ring_bedroom_motion', 'ring_bedroom_window'],
      },
      {
        id: 'bathroom',
        name: 'En-Suite Bathroom',
        level: 'Ground Floor',
        dimensions: '8 x 10 ft',
        description: 'Vanity, grab bars, medicine cabinet contact, and sink water sensor',
        sensorIds: ['ring_bathroom_motion', 'ring_medicine_cabinet', 'ring_bath_water_leak'],
      },
      {
        id: 'kitchen',
        name: 'Kitchen & Dining Island',
        level: 'Ground Floor',
        dimensions: '16 x 14 ft',
        description: 'Breakfast prep area, refrigerator contact, under-sink leak sensor, and pantry',
        sensorIds: ['ring_kitchen_motion', 'ring_fridge_contact', 'ring_kitchen_water_leak', 'ring_pantry_contact'],
      },
      {
        id: 'living_room',
        name: 'Living Room & Reading Nook',
        level: 'Ground Floor',
        dimensions: '18 x 16 ft',
        description: 'Armchair resting area, television zone, Echo Show hub, and glass break sensor',
        sensorIds: ['ring_living_room_motion', 'ring_living_room_glassbreak'],
      },
      {
        id: 'front_entry',
        name: 'Front Entryway & Porch',
        level: 'Ground Floor',
        dimensions: '6 x 8 ft',
        description: 'Front door deadbolt contact and Ring Video Doorbell exterior motion/chime',
        sensorIds: ['ring_front_door', 'ring_doorbell_motion'],
      },
      {
        id: 'patio',
        name: 'Back Patio & Sunroom',
        level: 'Ground Floor',
        dimensions: '12 x 12 ft',
        description: 'Garden patio access, sliding glass door sensor, and outdoor motion detector',
        sensorIds: ['ring_patio_motion', 'ring_patio_door'],
      },
    ],
  },
  {
    id: 'townhouse_two_story',
    name: 'Two-Story Townhouse',
    tagline: 'Multi-Level Residence with Stair Monitoring',
    description: '2,100 sq ft dual-level layout with dedicated staircase transition and fall prevention sensors.',
    levels: ['Ground Floor', 'Second Floor'],
    defaultRoom: 'Living Room',
    rooms: [
      {
        id: 'th_foyer',
        name: 'Foyer & Front Entry',
        level: 'Ground Floor',
        dimensions: '8 x 8 ft',
        description: 'Front entryway with Ring Video Doorbell and smart door lock',
        sensorIds: ['ring_th_doorbell', 'ring_th_front_door'],
      },
      {
        id: 'th_living',
        name: 'Living & Dining Room',
        level: 'Ground Floor',
        dimensions: '20 x 16 ft',
        description: 'Open concept living area and acoustic glass break sensor',
        sensorIds: ['ring_th_living_motion', 'ring_th_glassbreak'],
      },
      {
        id: 'th_kitchen',
        name: 'Chef Kitchen & Pantry',
        level: 'Ground Floor',
        dimensions: '14 x 14 ft',
        description: 'Island motion sensor, smart fridge contact, and dishwasher leak detector',
        sensorIds: ['ring_th_kitchen_motion', 'ring_th_fridge', 'ring_th_kitchen_leak'],
      },
      {
        id: 'th_powder',
        name: 'Powder Room',
        level: 'Ground Floor',
        dimensions: '6 x 6 ft',
        description: 'First floor half-bath with motion sensor',
        sensorIds: ['ring_th_powder_motion'],
      },
      {
        id: 'th_garage',
        name: 'Attached Garage',
        level: 'Ground Floor',
        dimensions: '18 x 20 ft',
        description: 'Interior garage transition door sensor',
        sensorIds: ['ring_th_garage_door'],
      },
      {
        id: 'th_stairway',
        name: 'Stairway & Landing',
        level: 'Second Floor',
        dimensions: '6 x 14 ft',
        description: 'Critical transit zone: dual-beam stairway motion and step illumination',
        sensorIds: ['ring_th_stair_motion'],
      },
      {
        id: 'th_primary_bedroom',
        name: 'Primary Bedroom Suite',
        level: 'Second Floor',
        dimensions: '16 x 18 ft',
        description: 'Upstairs master suite with bed sensor mat and motion detector',
        sensorIds: ['ring_th_bed_mat', 'ring_th_master_bed_motion'],
      },
      {
        id: 'th_primary_bath',
        name: 'Primary En-Suite Bathroom',
        level: 'Second Floor',
        dimensions: '10 x 12 ft',
        description: 'Medicine cabinet contact sensor and motion detection',
        sensorIds: ['ring_th_med_cabinet', 'ring_th_master_bath_motion'],
      },
      {
        id: 'th_guest_room',
        name: 'Guest Bedroom / Den',
        level: 'Second Floor',
        dimensions: '12 x 12 ft',
        description: 'Secondary bedroom motion sensor',
        sensorIds: ['ring_th_guest_motion'],
      },
    ],
  },
  {
    id: 'compact_suite',
    name: 'Assisted Living Accessible Suite',
    tagline: 'Compact Accessible Senior Suite',
    description: '680 sq ft single-level accessible studio suite designed for maximum safety and rapid emergency detection.',
    levels: ['Single Level'],
    defaultRoom: 'Living Area',
    rooms: [
      {
        id: 'cs_living_bedroom',
        name: 'Studio Living & Bed Area',
        level: 'Single Level',
        dimensions: '18 x 16 ft',
        description: 'Bed pressure mat, whole-room motion sensor, window safety contact',
        sensorIds: ['ring_cs_bed_mat', 'ring_cs_room_motion', 'ring_cs_window'],
      },
      {
        id: 'cs_accessible_bath',
        name: 'ADA Accessible Bathroom',
        level: 'Single Level',
        dimensions: '10 x 10 ft',
        description: 'Roll-in shower water sensor, emergency pull cord, medicine cabinet contact',
        sensorIds: ['ring_cs_bath_motion', 'ring_cs_med_cabinet', 'ring_cs_shower_water', 'ring_cs_pull_cord'],
      },
      {
        id: 'cs_kitchenette',
        name: 'Accessible Kitchenette',
        level: 'Single Level',
        dimensions: '10 x 8 ft',
        description: 'Compact microwave & mini-fridge magnetic sensors, counter motion detector',
        sensorIds: ['ring_cs_kitch_motion', 'ring_cs_fridge'],
      },
      {
        id: 'cs_entry',
        name: 'Corridor & Suite Entry',
        level: 'Single Level',
        dimensions: '6 x 8 ft',
        description: 'Hallway motion detector and apartment entrance contact sensor',
        sensorIds: ['ring_cs_hall_motion', 'ring_cs_door'],
      },
    ],
  },
];

export const RANCH_SENSORS: RingSensor[] = [
  {
    id: 'ring_bedroom_motion',
    name: 'Bedroom Ring Motion Detector',
    room: 'Bedroom',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 94,
    lastTriggered: '06:14 AM',
    relativeMinutesAgo: 64,
    description: 'Ceiling corner sensor facing bed and dressing area',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_bed_pressure',
    name: 'Smart Bed Sensor Mat',
    room: 'Bedroom',
    level: 'Ground Floor',
    type: 'pressure',
    state: 'clear',
    battery: 100,
    lastTriggered: '06:12 AM (Bed Exit)',
    relativeMinutesAgo: 66,
    description: 'Under-mattress sensor monitoring rest and wake transitions',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_bedroom_window',
    name: 'Bedroom Window Contact',
    room: 'Bedroom',
    level: 'Ground Floor',
    type: 'window_contact',
    state: 'closed',
    battery: 97,
    lastTriggered: 'Yesterday 06:00 PM',
    relativeMinutesAgo: 790,
    description: 'South-facing bedroom garden window magnetic contact',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_bathroom_motion',
    name: 'Bathroom Ring Motion Detector',
    room: 'Bathroom',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 89,
    lastTriggered: '06:28 AM',
    relativeMinutesAgo: 50,
    description: 'Wall mounted near vanity and grab bars',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_medicine_cabinet',
    name: 'Medicine Cabinet Contact Sensor',
    room: 'Bathroom',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 91,
    lastTriggered: 'Yesterday 08:30 PM',
    relativeMinutesAgo: 648,
    description: 'Monitors morning and evening daily pill container access',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_bath_water_leak',
    name: 'Bathroom Water & Freeze Sensor',
    room: 'Bathroom',
    level: 'Ground Floor',
    type: 'water_freeze',
    state: 'safe',
    battery: 98,
    lastTriggered: 'Status: Dry & Normal (68°F)',
    relativeMinutesAgo: 10,
    description: 'Under vanity pipe flood detector and freeze alert',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_kitchen_motion',
    name: 'Kitchen Ring Motion Detector',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'motion',
    state: 'active',
    battery: 92,
    lastTriggered: '07:16 AM',
    relativeMinutesAgo: 2,
    description: 'Active motion detected near breakfast counter & stove',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_fridge_contact',
    name: 'Refrigerator Contact Sensor',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 88,
    lastTriggered: '06:45 AM (Opened 2x)',
    relativeMinutesAgo: 33,
    description: 'Magnetic sensor monitoring food and drink access',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_kitchen_water_leak',
    name: 'Kitchen Under-Sink Water Sensor',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'water_freeze',
    state: 'safe',
    battery: 95,
    lastTriggered: 'Status: Dry & Normal (69°F)',
    relativeMinutesAgo: 15,
    description: 'Monitors dishwasher line and sink disposal drain',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_pantry_contact',
    name: 'Food Pantry Magnetic Contact',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 93,
    lastTriggered: '06:42 AM',
    relativeMinutesAgo: 36,
    description: 'Monitors oatmeal and breakfast staple cupboard',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_living_room_motion',
    name: 'Living Room Ring Motion Detector',
    room: 'Living Room',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 96,
    lastTriggered: '06:35 AM',
    relativeMinutesAgo: 43,
    description: 'Near reading armchair and television',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_living_room_glassbreak',
    name: 'Acoustic Glass Break Detector',
    room: 'Living Room',
    level: 'Ground Floor',
    type: 'glass_break',
    state: 'safe',
    battery: 99,
    lastTriggered: 'Perimeter Armed & Clear',
    relativeMinutesAgo: 120,
    description: 'Monitors living room picture window and front bay window',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_front_door',
    name: 'Front Entry Contact Sensor',
    room: 'Front Entry',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 95,
    lastTriggered: 'Yesterday 04:15 PM',
    relativeMinutesAgo: 900,
    description: 'Front entryway deadbolt & contact sensor',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_doorbell_motion',
    name: 'Ring Video Doorbell Pro',
    room: 'Front Entry',
    level: 'Ground Floor',
    type: 'doorbell',
    state: 'clear',
    battery: 100,
    lastTriggered: 'Yesterday 04:14 PM (Package Delivery)',
    relativeMinutesAgo: 901,
    description: 'Front porch 1536p HD intercom, motion zones, and doorbell chime',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_patio_motion',
    name: 'Back Patio Ring Outdoor Motion',
    room: 'Patio & Garden',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 91,
    lastTriggered: 'Yesterday 05:40 PM',
    relativeMinutesAgo: 820,
    description: 'Weatherproof PIR sensor overlooking flower beds and sunroom',
    floorPlanId: 'ranch_single_story',
  },
  {
    id: 'ring_patio_door',
    name: 'Patio Sliding Door Contact',
    room: 'Patio & Garden',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 94,
    lastTriggered: 'Yesterday 05:35 PM',
    relativeMinutesAgo: 825,
    description: 'Sliding glass door lock and magnetic seal',
    floorPlanId: 'ranch_single_story',
  },
];

export const TOWNHOUSE_SENSORS: RingSensor[] = [
  {
    id: 'ring_th_doorbell',
    name: 'Front Porch Video Doorbell',
    room: 'Front Entry',
    level: 'Ground Floor',
    type: 'doorbell',
    state: 'clear',
    battery: 100,
    lastTriggered: '06:05 AM',
    relativeMinutesAgo: 73,
    description: 'Townhouse entrance camera and smart doorbell chime',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_front_door',
    name: 'Townhouse Front Door Contact',
    room: 'Front Entry',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 96,
    lastTriggered: 'Yesterday 06:30 PM',
    relativeMinutesAgo: 770,
    description: 'Deadbolt and primary foyer entryway sensor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_living_motion',
    name: 'Great Room Motion Detector',
    room: 'Living Room',
    level: 'Ground Floor',
    type: 'motion',
    state: 'active',
    battery: 93,
    lastTriggered: '07:15 AM',
    relativeMinutesAgo: 3,
    description: 'Ground floor main gathering space motion sensor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_glassbreak',
    name: 'Great Room Glass Break Detector',
    room: 'Living Room',
    level: 'Ground Floor',
    type: 'glass_break',
    state: 'safe',
    battery: 98,
    lastTriggered: 'Status: Normal',
    relativeMinutesAgo: 60,
    description: 'Acoustic detector for living room patio doors',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_kitchen_motion',
    name: 'Chef Kitchen Island Motion',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 92,
    lastTriggered: '06:50 AM',
    relativeMinutesAgo: 28,
    description: 'PIR motion sensor covering kitchen island and stove',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_fridge',
    name: 'Smart Refrigerator Contact',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 90,
    lastTriggered: '06:48 AM',
    relativeMinutesAgo: 30,
    description: 'Monitors food and hydration access in kitchen',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_kitchen_leak',
    name: 'Kitchen Sink & Dishwasher Water Sensor',
    room: 'Kitchen',
    level: 'Ground Floor',
    type: 'water_freeze',
    state: 'safe',
    battery: 97,
    lastTriggered: 'Status: Dry & Normal (69°F)',
    relativeMinutesAgo: 10,
    description: 'Leak detection under kitchen sink basin',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_powder_motion',
    name: 'Powder Room Motion Detector',
    room: 'Powder Room',
    level: 'Ground Floor',
    type: 'motion',
    state: 'clear',
    battery: 95,
    lastTriggered: '06:30 AM',
    relativeMinutesAgo: 48,
    description: 'First floor powder room sensor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_garage_door',
    name: 'Garage Entry Contact Sensor',
    room: 'Garage',
    level: 'Ground Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 94,
    lastTriggered: 'Yesterday 03:00 PM',
    relativeMinutesAgo: 980,
    description: 'Fire door contact leading to attached garage',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_stair_motion',
    name: 'Stairway Dual-Beam Motion Sensor',
    room: 'Stairway',
    level: 'Second Floor',
    type: 'motion',
    state: 'clear',
    battery: 95,
    lastTriggered: '06:25 AM (Descended stairs)',
    relativeMinutesAgo: 53,
    description: 'Critical fall-prevention transit detector on 14-step staircase',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_bed_mat',
    name: 'Upper Master Smart Bed Mat',
    room: 'Second Floor Suite',
    level: 'Second Floor',
    type: 'pressure',
    state: 'clear',
    battery: 100,
    lastTriggered: '06:10 AM (Bed Exit)',
    relativeMinutesAgo: 68,
    description: 'Upper level primary bedroom mattress pressure monitor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_master_bed_motion',
    name: 'Upper Master Bedroom Motion',
    room: 'Second Floor Suite',
    level: 'Second Floor',
    type: 'motion',
    state: 'clear',
    battery: 93,
    lastTriggered: '06:18 AM',
    relativeMinutesAgo: 60,
    description: 'Second floor master bedroom corner sensor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_master_bath_motion',
    name: 'Upper Master Bath Motion',
    room: 'Second Floor Suite',
    level: 'Second Floor',
    type: 'motion',
    state: 'clear',
    battery: 91,
    lastTriggered: '06:20 AM',
    relativeMinutesAgo: 58,
    description: 'Upstairs master bath vanity motion sensor',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_med_cabinet',
    name: 'Upper Master Medicine Cabinet Contact',
    room: 'Second Floor Suite',
    level: 'Second Floor',
    type: 'door_contact',
    state: 'closed',
    battery: 92,
    lastTriggered: 'Yesterday 08:45 PM',
    relativeMinutesAgo: 635,
    description: 'Upstairs medication storage cabinet contact',
    floorPlanId: 'townhouse_two_story',
  },
  {
    id: 'ring_th_guest_motion',
    name: 'Guest Room / Study Motion',
    room: 'Guest Bedroom',
    level: 'Second Floor',
    type: 'motion',
    state: 'clear',
    battery: 96,
    lastTriggered: '2 days ago',
    relativeMinutesAgo: 2800,
    description: 'Upper guest room and study motion detector',
    floorPlanId: 'townhouse_two_story',
  },
];

export const COMPACT_SUITE_SENSORS: RingSensor[] = [
  {
    id: 'ring_cs_bed_mat',
    name: 'Suite Bed Pressure Mat',
    room: 'Living Area',
    level: 'Single Level',
    type: 'pressure',
    state: 'clear',
    battery: 100,
    lastTriggered: '06:20 AM (Bed Exit)',
    relativeMinutesAgo: 58,
    description: 'Bed exit and rest monitor with zero-delay trigger',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_room_motion',
    name: 'Suite 360° Ceiling Motion Sensor',
    room: 'Living Area',
    level: 'Single Level',
    type: 'motion',
    state: 'active',
    battery: 95,
    lastTriggered: '07:17 AM',
    relativeMinutesAgo: 1,
    description: 'Whole-room wide angle motion detector with immobility alert',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_window',
    name: 'Safety Window Contact Sensor',
    room: 'Living Area',
    level: 'Single Level',
    type: 'window_contact',
    state: 'closed',
    battery: 97,
    lastTriggered: 'Yesterday 05:00 PM',
    relativeMinutesAgo: 850,
    description: 'Accessible window opening sensor',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_bath_motion',
    name: 'Accessible Bath Motion Sensor',
    room: 'Bathroom',
    level: 'Single Level',
    type: 'motion',
    state: 'clear',
    battery: 92,
    lastTriggered: '06:35 AM',
    relativeMinutesAgo: 43,
    description: 'Roll-in bathroom motion sensor with prolonged inactivity alert',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_med_cabinet',
    name: 'Daily Pill Organizer Contact',
    room: 'Bathroom',
    level: 'Single Level',
    type: 'door_contact',
    state: 'closed',
    battery: 90,
    lastTriggered: 'Yesterday 08:15 PM',
    relativeMinutesAgo: 660,
    description: 'Magnetic sensor on accessible medication drawer',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_shower_water',
    name: 'Roll-In Shower Water & Freeze Sensor',
    room: 'Bathroom',
    level: 'Single Level',
    type: 'water_freeze',
    state: 'safe',
    battery: 98,
    lastTriggered: 'Status: Safe & Dry (70°F)',
    relativeMinutesAgo: 20,
    description: 'Monitors shower threshold for water pooling or slip hazards',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_pull_cord',
    name: 'Emergency Pull-Cord Magnetic Anchor',
    room: 'Bathroom',
    level: 'Single Level',
    type: 'door_contact',
    state: 'closed',
    battery: 100,
    lastTriggered: 'Anchor Secure (Ready)',
    relativeMinutesAgo: 5,
    description: 'Wall-mounted emergency assistance cord in accessible shower',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_kitch_motion',
    name: 'Kitchenette Counter Motion',
    room: 'Kitchenette',
    level: 'Single Level',
    type: 'motion',
    state: 'clear',
    battery: 93,
    lastTriggered: '06:55 AM',
    relativeMinutesAgo: 23,
    description: 'Monitors tea kettle, sink, and breakfast counter',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_fridge',
    name: 'Mini-Fridge Contact Sensor',
    room: 'Kitchenette',
    level: 'Single Level',
    type: 'door_contact',
    state: 'closed',
    battery: 89,
    lastTriggered: '06:52 AM',
    relativeMinutesAgo: 26,
    description: 'Monitors juice, milk, and hydration access',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_hall_motion',
    name: 'Suite Entry Corridor Motion',
    room: 'Hallway',
    level: 'Single Level',
    type: 'motion',
    state: 'clear',
    battery: 94,
    lastTriggered: '06:22 AM',
    relativeMinutesAgo: 56,
    description: 'Entrance foyer and vestibule motion sensor',
    floorPlanId: 'compact_suite',
  },
  {
    id: 'ring_cs_door',
    name: 'Suite Entrance Door Contact',
    room: 'Hallway',
    level: 'Single Level',
    type: 'door_contact',
    state: 'closed',
    battery: 96,
    lastTriggered: 'Yesterday 04:30 PM (Nurse Check)',
    relativeMinutesAgo: 890,
    description: 'Suite primary entrance with nurse visit verification',
    floorPlanId: 'compact_suite',
  },
];

export const FLOOR_PLAN_SENSORS: Record<FloorPlanId, RingSensor[]> = {
  ranch_single_story: RANCH_SENSORS,
  townhouse_two_story: TOWNHOUSE_SENSORS,
  compact_suite: COMPACT_SUITE_SENSORS,
};

export const INITIAL_HOME_STATE: HomeState = {
  currentScenario: 'kitchen_routine',
  floorPlanId: 'ranch_single_story',
  activeFloorLevel: 'Ground Floor',
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
  sensors: RANCH_SENSORS,
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
    if (!raw) {
      // Check legacy storage
      const legacy = localStorage.getItem('carecontext_homestate_v1');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return { ...INITIAL_HOME_STATE, ...parsed, sensors: RANCH_SENSORS };
      }
      return INITIAL_HOME_STATE;
    }
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

// Switch Floor Plan
export function applyFloorPlanToState(
  currentState: HomeState,
  floorPlanId: FloorPlanId,
  level?: string
): HomeState {
  const config = FLOOR_PLANS.find((f) => f.id === floorPlanId) || FLOOR_PLANS[0];
  const newSensors = FLOOR_PLAN_SENSORS[floorPlanId] || RANCH_SENSORS;
  const activeLevel = level || (config.levels.length > 0 ? config.levels[0] : 'Ground Floor');

  const next: HomeState = {
    ...currentState,
    floorPlanId,
    activeFloorLevel: activeLevel,
    currentRoom: config.defaultRoom,
    sensors: newSensors,
  };

  saveClientHomeState(next);
  return next;
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
    currentState.sensors.find((s) => s.state === 'active' || s.state === 'open' || s.state === 'leak_detected')?.name || 'None'
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
      if (s.id.includes('living') && s.type === 'motion') {
        return { ...s, state: 'active', lastTriggered: '06:38 AM', relativeMinutesAgo: 2 };
      }
      if (s.id.includes('kitchen') && s.type === 'motion') {
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
      if (s.id.includes('bath') && s.type === 'motion') {
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
  } else if (scenarioKey === 'water_leak_alert') {
    next.currentTime = '07:25 AM';
    next.currentRoom = 'Kitchen';
    next.sensors = next.sensors.map((s) => {
      if (s.type === 'water_freeze' && s.id.includes('kitchen')) {
        return { ...s, state: 'leak_detected', lastTriggered: '07:24 AM (LEAK DETECTED)', relativeMinutesAgo: 1 };
      }
      return s;
    });
    next.events = [
      {
        id: `ev-${Date.now()}-leak`,
        sensorId: 'ring_kitchen_water_leak',
        room: 'Kitchen',
        deviceName: 'Kitchen Under-Sink Water Sensor',
        eventType: 'water_leak',
        timestamp: '07:24 AM',
        detail: 'Moisture detected under kitchen sink pipe! Audio alarm sounding.',
      },
      ...next.events,
    ];
    const { nextAlerts } = clientDispatchAlert(
      next,
      'Plumbing Leak Detected: Kitchen Under-Sink Sensor',
      'urgent',
      'Water sensor triggered under kitchen sink. Possible disposal line or valve leak. Eleanor notified on Alexa.'
    );
    next.alerts = nextAlerts;
  } else if (scenarioKey === 'patio_morning_garden') {
    next.currentTime = '07:45 AM';
    next.currentRoom = 'Patio & Garden';
    next.safetyState = 'normal';
    next.sensors = next.sensors.map((s) => {
      if (s.id.includes('patio') && s.type === 'motion') {
        return { ...s, state: 'active', lastTriggered: '07:42 AM', relativeMinutesAgo: 3 };
      }
      if (s.id.includes('patio') && s.type === 'door_contact') {
        return { ...s, state: 'open', lastTriggered: '07:40 AM', relativeMinutesAgo: 5 };
      }
      return s;
    });
    next.events = [
      {
        id: `ev-${Date.now()}-garden`,
        sensorId: 'ring_patio_motion',
        room: 'Patio & Garden',
        deviceName: 'Back Patio Ring Outdoor Motion',
        eventType: 'motion_detected',
        timestamp: '07:42 AM',
        detail: 'Eleanor enjoying gentle morning sunshine in the flower garden.',
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
      if (s.id.includes('kitchen') && s.type === 'motion') {
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

  // Determine new sensor state based on eventType
  let newState: RingSensor['state'] = 'active';
  if (eventType === 'motion_cleared') newState = 'clear';
  else if (eventType === 'door_opened' || eventType === 'window_opened') newState = 'open';
  else if (eventType === 'door_closed' || eventType === 'window_closed') newState = 'closed';
  else if (eventType === 'water_leak') newState = 'leak_detected';
  else if (eventType === 'water_cleared') newState = 'safe';
  else if (eventType === 'glass_break') newState = 'alert';
  else if (eventType === 'pill_taken') newState = 'closed';

  let targetSensor = currentState.sensors.find((s) => s.id === sensorId);

  // If sensor is not found in active list, check if it exists in one of the other floor plan sets
  if (!targetSensor) {
    for (const sensorList of Object.values(FLOOR_PLAN_SENSORS)) {
      const match = sensorList.find((s) => s.id === sensorId);
      if (match) {
        targetSensor = match;
        break;
      }
    }
  }

  const sensorName = targetSensor?.name || sensorId;
  const sensorRoom = targetSensor?.room || updatedRoom;
  if (sensorRoom) updatedRoom = sensorRoom;

  const updatedSensors = currentState.sensors.map((sensor) => {
    if (sensor.id === sensorId) {
      return {
        ...sensor,
        state: newState,
        lastTriggered: timeStr,
        relativeMinutesAgo: 0,
      };
    }
    return sensor;
  });

  // If sensor was not already in the array, prepend it
  if (!currentState.sensors.some((s) => s.id === sensorId) && targetSensor) {
    updatedSensors.unshift({
      ...targetSensor,
      state: newState,
      lastTriggered: timeStr,
      relativeMinutesAgo: 0,
    });
  }

  const newEvent: SensorEvent = {
    id: `ev-${Date.now()}`,
    sensorId,
    room: sensorRoom,
    deviceName: sensorName,
    eventType: eventType as any,
    timestamp: timeStr,
    detail: detail || `Sensor event on ${sensorName}`,
  };

  // If medicine cabinet was opened or pill was taken, automatically update the medication schedule!
  let updatedSchedule = currentState.schedule;
  if (sensorId.includes('med') || eventType === 'pill_taken') {
    updatedSchedule = currentState.schedule.map((item) => {
      if (item.category === 'medication' && !item.isCompleted) {
        return {
          ...item,
          isCompleted: true,
          completedAt: timeStr,
          details: `Taken at ${timeStr} with full glass of water. Verified by Ring sensor.`,
        };
      }
      return item;
    });
  }

  // If water leak is simulated, create a caregiver alert automatically
  let updatedAlerts = currentState.alerts;
  if (eventType === 'water_leak') {
    const { nextAlerts } = clientDispatchAlert(
      currentState,
      `Water Leak Alert: ${sensorName}`,
      'urgent',
      `Moisture detected by ${sensorName} in ${sensorRoom} at ${timeStr}. Check water supply valve.`
    );
    updatedAlerts = nextAlerts;
  }

  const next: HomeState = {
    ...currentState,
    sensors: updatedSensors,
    currentRoom: updatedRoom,
    schedule: updatedSchedule,
    alerts: updatedAlerts,
    events: [newEvent, ...currentState.events].slice(0, 40),
  };

  saveClientHomeState(next);
  return next;
}
