import React from 'react';
import {
  Activity,
  Battery,
  DoorClosed,
  DoorOpen,
  Eye,
  Footprints,
  Flame,
  Home,
  Layers,
  MapPin,
  Pill,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { HomeState, RingSensor, SensorEvent } from '../types/careContext.ts';

interface HomeSensorMapProps {
  homeState: HomeState;
  onSelectScenario: (scenarioKey: string) => void;
  onTriggerSensor: (sensorId: string, eventType: string, detail?: string) => void;
}

export const HomeSensorMap: React.FC<HomeSensorMapProps> = ({
  homeState,
  onSelectScenario,
  onTriggerSensor,
}) => {
  const getSensor = (id: string) => homeState.sensors.find((s) => s.id === id);

  const bedSensor = getSensor('ring_bed_pressure');
  const bedroomMotion = getSensor('ring_bedroom_motion');
  const bathroomMotion = getSensor('ring_bathroom_motion');
  const medicineCabinet = getSensor('ring_medicine_cabinet');
  const kitchenMotion = getSensor('ring_kitchen_motion');
  const fridgeContact = getSensor('ring_fridge_contact');
  const livingMotion = getSensor('ring_living_room_motion');
  const frontDoor = getSensor('ring_front_door');

  const isCurrentRoom = (room: string) => homeState.currentRoom.toLowerCase() === room.toLowerCase();

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
        <div>
          <h2 className="font-bold text-stone-100 text-lg flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            <span>Real-Time Home Context & Ring Sensors</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Model Context Protocol data feed from Ring Motion Detectors & Contact Sensors
          </p>
        </div>

        {/* Inferred Room Indicator */}
        <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 px-3 py-1.5 rounded-xl">
          <MapPin className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs text-stone-300">
            Current Location:{' '}
            <strong className="text-emerald-300 font-semibold">{homeState.currentRoom}</strong>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Preset Scenario Quick-Switch Bar */}
        <div>
          <div className="text-xs font-semibold text-stone-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Test Scenarios (MCP State Generator):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => onSelectScenario('kitchen_routine')}
              className={`p-3 rounded-xl border text-left transition-all ${
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
              onClick={() => onSelectScenario('early_riser_living_room')}
              className={`p-3 rounded-xl border text-left transition-all ${
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
              onClick={() => onSelectScenario('dizziness_distress')}
              className={`p-3 rounded-xl border text-left transition-all ${
                homeState.currentScenario === 'dizziness_distress'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'bg-stone-800/80 border-stone-700/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>3. Bathroom Distress / Dizziness</span>
                {homeState.currentScenario === 'dizziness_distress' && (
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                User in Bathroom. Reports feeling unsteady/dizzy. Triggers safety verification protocol.
              </p>
            </button>
          </div>
        </div>

        {/* Visual Architectural Floor Plan Grid */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Residence Layout: Eleanor&apos;s Single-Story Home</span>
            </span>
            <span className="text-[11px] text-stone-400">Green highlight indicates current presence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Room 1: Master Bedroom */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isCurrentRoom('Bedroom')
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-stone-900/90 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-200">Master Bedroom</span>
                {isCurrentRoom('Bedroom') && (
                  <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    HERE
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 ${bedroomMotion?.state === 'active' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-stone-300">Ring Motion</span>
                  </div>
                  <span className={`text-[11px] font-mono ${bedroomMotion?.state === 'active' ? 'text-amber-400' : 'text-stone-400'}`}>
                    {bedroomMotion?.state === 'active' ? 'Motion Active' : bedroomMotion?.lastTriggered}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-stone-300">Smart Bed Mat</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Exit {homeState.wakeTimeEstimated}
                  </span>
                </div>
              </div>
            </div>

            {/* Room 2: Bathroom */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isCurrentRoom('Bathroom')
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-stone-900/90 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-200">Bathroom</span>
                {isCurrentRoom('Bathroom') && (
                  <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    HERE
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 ${bathroomMotion?.state === 'active' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-stone-300">Ring Motion</span>
                  </div>
                  <span className={`text-[11px] font-mono ${bathroomMotion?.state === 'active' ? 'text-amber-400' : 'text-stone-400'}`}>
                    {bathroomMotion?.state === 'active' ? 'Active' : bathroomMotion?.lastTriggered}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Pill className={`w-3.5 h-3.5 ${medicineCabinet?.state === 'open' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-stone-300">Medicine Cabinet</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      medicineCabinet?.state === 'open'
                        ? 'text-emerald-400'
                        : 'text-amber-300/80'
                    }`}
                  >
                    {medicineCabinet?.state === 'open' ? 'OPEN' : 'NOT OPEN TODAY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Room 3: Kitchen */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isCurrentRoom('Kitchen')
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-stone-900/90 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-200">Kitchen & Counter</span>
                {isCurrentRoom('Kitchen') && (
                  <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    HERE
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 ${kitchenMotion?.state === 'active' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-stone-300">Ring Motion</span>
                  </div>
                  <span className={`text-[11px] font-mono ${kitchenMotion?.state === 'active' ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                    {kitchenMotion?.state === 'active' ? 'Motion Active' : kitchenMotion?.lastTriggered}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                  <div className="flex items-center gap-2">
                    <DoorClosed className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-stone-300">Refrigerator Door</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {fridgeContact?.lastTriggered}
                  </span>
                </div>
              </div>
            </div>

            {/* Room 4: Living Room */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                isCurrentRoom('Living Room')
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-stone-900/90 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-200">Living Room</span>
                {isCurrentRoom('Living Room') && (
                  <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    HERE
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2">
                  <Activity className={`w-3.5 h-3.5 ${livingMotion?.state === 'active' ? 'text-amber-400 animate-pulse' : 'text-stone-400'}`} />
                  <span className="text-stone-300">Ring Motion (Armchair)</span>
                </div>
                <span className={`text-[11px] font-mono ${livingMotion?.state === 'active' ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                  {livingMotion?.state === 'active' ? 'Motion Active' : livingMotion?.lastTriggered}
                </span>
              </div>
            </div>

            {/* Room 5: Front Entry */}
            <div className="rounded-xl p-3.5 border bg-stone-900/90 border-stone-800 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-stone-200">Front Entryway & Porch</span>
                <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded">
                  Perimeter Secure
                </span>
              </div>
              <div className="flex items-center justify-between text-xs bg-stone-950/60 p-2 rounded-lg border border-stone-800">
                <div className="flex items-center gap-2">
                  <DoorClosed className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-stone-300">Ring Deadbolt & Contact Sensor</span>
                </div>
                <span className="text-[11px] font-mono text-stone-400">
                  Closed & Locked (Last opened yesterday 4:15 PM)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Manual Sensor Simulator Buttons */}
        <div>
          <div className="text-xs font-semibold text-stone-400 mb-2 flex items-center justify-between">
            <span>Simulate Sensor Event in Eleanor&apos;s Home:</span>
            <span className="text-[11px] text-stone-400">Updates live telemetry</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                onTriggerSensor('ring_medicine_cabinet', 'door_opened', 'Eleanor opened medicine cabinet')
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-emerald-500/50 flex items-center gap-1.5"
            >
              <Pill className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Medicine Cabinet</span>
            </button>
            <button
              onClick={() =>
                onTriggerSensor('ring_fridge_contact', 'door_opened', 'Refrigerator door opened')
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-cyan-500/50 flex items-center gap-1.5"
            >
              <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Refrigerator</span>
            </button>
            <button
              onClick={() =>
                onTriggerSensor('ring_living_room_motion', 'motion_detected', 'Movement in living room armchair')
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-amber-500/50 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Trigger Living Room Motion</span>
            </button>
            <button
              onClick={() =>
                onTriggerSensor('ring_kitchen_motion', 'motion_detected', 'Movement near kettle & breakfast counter')
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-amber-500/50 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Trigger Kitchen Motion</span>
            </button>
          </div>
        </div>

        {/* Recent 6-Hour Sensor Event Timeline */}
        <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sensor Telemetry Timeline (Last 6 Hours)</span>
            </h3>
            <span className="text-[11px] text-stone-400">{homeState.events.length} events logged</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {homeState.events
              .slice(-8)
              .reverse()
              .map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-stone-900/80 border border-stone-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-stone-400 text-[11px]">{ev.timestamp}</span>
                    <span className="font-semibold text-stone-300">{ev.room}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-300">{ev.detail}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                    {ev.eventType}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
