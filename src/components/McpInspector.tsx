import React, { useState } from 'react';
import {
  Check,
  Code,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import type { McpToolCall } from '../types/careContext.ts';

interface McpInspectorProps {
  logs: McpToolCall[];
}

export const McpInspector: React.FC<McpInspectorProps> = ({ logs }) => {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    logs.length > 0 ? logs[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const activeCall = logs.find((l) => l.id === selectedCallId) || logs[0];

  const handleCopy = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonRpcRequest = activeCall
    ? {
        jsonrpc: '2.0',
        id: activeCall.id,
        method: 'tools/call',
        params: {
          name: activeCall.tool,
          arguments: activeCall.arguments,
        },
      }
    : null;

  const jsonRpcResponse = activeCall
    ? {
        jsonrpc: '2.0',
        id: activeCall.id,
        result: activeCall.result,
        meta: {
          latencyMs: activeCall.latencyMs,
          timestamp: activeCall.timestamp,
        },
      }
    : null;

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
        <div>
          <h2 className="font-bold text-stone-100 text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Model Context Protocol (MCP) Live Inspector</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Real-time JSON-RPC 2.0 wire protocol trace for Ring sensors, daily schedule, and caregiver dispatch
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2.5 py-1 rounded-lg">
            {logs.length} MCP Calls Captured
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Calls List */}
        <div className="md:w-72 bg-stone-950/40 border-r border-stone-800/80 overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Captured Tool Invocations:
          </div>

          {logs.length === 0 ? (
            <div className="text-xs text-stone-400 p-4 text-center">
              No tool calls yet. Click &quot;Simulate Morning Check-in&quot; to observe live tool execution.
            </div>
          ) : (
            logs.map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCallId(call.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all font-mono text-xs cursor-pointer ${
                  (activeCall && activeCall.id === call.id)
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-md'
                    : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                  <span>{call.timestamp}</span>
                  <span className="text-cyan-400 font-semibold">{call.latencyMs}ms</span>
                </div>
                <div className="font-bold flex items-center gap-1.5 text-stone-100">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{call.tool}</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-1 truncate">
                  rpc: {call.method || 'tools/call'}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Right JSON-RPC Payload Viewer */}
        <div className="flex-1 bg-stone-950/90 overflow-y-auto p-6 flex flex-col">
          {activeCall ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2 font-mono">
                    <span className="text-cyan-400">JSON-RPC 2.0:</span>
                    <span>[{activeCall.tool}]</span>
                  </h3>
                  <span className="text-xs text-stone-400">
                    ID: {activeCall.id} • Latency: {activeCall.latencyMs}ms • Timestamp: {activeCall.timestamp}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy({ request: jsonRpcRequest, response: jsonRpcResponse })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Full RPC'}</span>
                </button>
              </div>

              {/* Wire Request Block */}
              <div>
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Client Request Payload (`tools/call`):</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  {JSON.stringify(jsonRpcRequest, null, 2)}
                </pre>
              </div>

              {/* Wire Response Block */}
              <div>
                <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>MCP Server Response Payload (`result`):</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-emerald-300 font-mono text-xs overflow-x-auto max-h-80 leading-relaxed">
                  {JSON.stringify(jsonRpcResponse, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 text-xs">
              <Cpu className="w-8 h-8 text-stone-600 mb-2" />
              <p>Select a tool call from the left to view the JSON-RPC wire protocol.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
