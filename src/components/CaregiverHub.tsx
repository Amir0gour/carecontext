import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  ShieldAlert,
  Smartphone,
  User,
  Zap,
} from 'lucide-react';
import type { CaregiverAlert } from '../types/careContext.ts';

interface CaregiverHubProps {
  alerts: CaregiverAlert[];
  onRespondAlert: (alertId: string, replyText: string) => void;
  onClearAlerts: () => void;
}

export const CaregiverHub: React.FC<CaregiverHubProps> = ({
  alerts,
  onRespondAlert,
  onClearAlerts,
}) => {
  const [customReply, setCustomReply] = useState('');
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);

  const latestAlert = alerts[0];

  const handleSendResponse = (alertId: string, text: string) => {
    onRespondAlert(alertId, text);
    setCustomReply('');
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
        <div>
          <h2 className="font-bold text-stone-100 text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Caregiver Emergency & Alert Dispatch Hub</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time recipient view for Sarah Miller (Daughter & Primary Emergency Contact)
          </p>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition-colors border border-stone-700"
          >
            Clear Resolved Alerts
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Caregiver Profile Card */}
        <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-lg text-stone-950 shadow-md">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-100 text-sm">Sarah Miller</span>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/50 px-2 py-0.5 rounded-full font-medium">
                  Primary Guardian
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Daughter • Lives 4 miles away (approx. 8 min drive)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+1 (555) 234-8901</span>
            </span>
          </div>
        </div>

        {/* Live Smartphone Notification Simulator */}
        <div className="bg-stone-950/90 border border-stone-800 rounded-2xl p-4 shadow-2xl max-w-md mx-auto">
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-stone-200">Sarah&apos;s Phone (Live Feed)</span>
            </div>
            <span className="text-[10px] text-stone-400">Lock Screen Priority Alert</span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-medium text-stone-300">All Quiet & Safe</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                No active emergency dispatches. If Eleanor triggers emergency or unresponsiveness, priority SMS appears here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-stone-900/90 border border-rose-600/40 rounded-xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        <Bell className="w-3.5 h-3.5 animate-bounce" />
                      </span>
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                        CareContext Emergency Dispatch
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">{alert.timestamp}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-stone-100 text-sm">{alert.reason}</h4>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80">
                      {alert.details}
                    </p>
                  </div>

                  <div className="text-[11px] text-stone-400 bg-stone-950/40 p-2 rounded-md border border-stone-800/50">
                    <strong className="text-stone-300">Telemetry Snapshot:</strong> {alert.sensorSnapshot}
                  </div>

                  {/* Status & Response State */}
                  {alert.status === 'Caregiver Responded' ? (
                    <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-lg p-2.5 text-xs text-emerald-200">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sarah Responded at {alert.responseTime}:</span>
                      </div>
                      <p className="mt-1 italic">&quot;{alert.caregiverResponseText}&quot;</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-semibold text-stone-400">
                        Simulate Sarah&apos;s Quick Response:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() =>
                            handleSendResponse(
                              alert.id,
                              "I'm 5 minutes away, Mom! Calling your Alexa right now."
                            )
                          }
                          className="px-2.5 py-1 rounded-md text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors"
                        >
                          &quot;I&apos;m 5 min away, calling Alexa!&quot;
                        </button>
                        <button
                          onClick={() =>
                            handleSendResponse(
                              alert.id,
                              'Phoning neighbor Betty next door to check right now!'
                            )
                          }
                          className="px-2.5 py-1 rounded-md text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors"
                        >
                          &quot;Asking neighbor to check&quot;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch Protocol Specs */}
        <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-4 text-xs text-stone-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-200 font-semibold">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>MCP Tool [alert_family_contact] Specification</span>
          </div>
          <p>
            Triggered strictly when the elderly user expresses physical distress, confusion, confirms an emergency, or fails to answer the 30-second safety check. Delivers priority payload to family without alarming or overwhelming the user.
          </p>
        </div>
      </div>
    </div>
  );
};
