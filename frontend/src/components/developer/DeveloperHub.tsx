import React, { useState, useEffect } from 'react';
import { 
  Terminal, Code2, Radio, BookOpen, ExternalLink, Copy, Check, 
  RefreshCw, Play, ShieldAlert, Cpu, Sparkles, Send, Trash2 
} from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { DeveloperInfo, WebSocketEventPacket } from '../../types/api';

export const DeveloperHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'api' | 'cli' | 'websocket'>('api');
  const [info, setInfo] = useState<DeveloperInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // WebSocket Live Stream State
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [packets, setPackets] = useState<WebSocketEventPacket[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);

  // CLI Command Generator State
  const [cliCommand, setCliCommand] = useState('convert');
  const [cliInputPath, setCliInputPath] = useState('sample.mp4');
  const [cliTarget, setCliTarget] = useState('webm');
  const [cliAlgorithm, setCliAlgorithm] = useState('all');

  useEffect(() => {
    loadInfo();
    // Subscribe to WebSocket status & events
    const unsubStatus = socketService.onStatusChange(setWsStatus);
    const unsubPackets = socketService.onAny((pkt) => {
      setPackets((prev) => [
        { ...pkt, _receivedAt: new Date().toLocaleTimeString() },
        ...prev.slice(0, 99)
      ]);
    });

    return () => {
      unsubStatus();
      unsubPackets();
    };
  }, []);

  const loadInfo = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDeveloperInfo();
      setInfo(data);
    } catch (err) {
      console.error('Failed to load developer info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSendPing = () => {
    socketService.sendPing();
  };

  const handleTriggerTestEvent = async () => {
    setIsTriggering(true);
    try {
      await api.triggerTestEvent('diagnostic', 'Manual developer broadcast test');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  const generateCliSnippet = () => {
    switch (cliCommand) {
      case 'convert':
        return `./ufs convert "${cliInputPath}" -t ${cliTarget}`;
      case 'hash':
        return `./ufs hash "${cliInputPath}" -a ${cliAlgorithm}`;
      case 'strip-metadata':
        return `./ufs strip-metadata "${cliInputPath}"`;
      case 'ocr':
        return `./ufs ocr "${cliInputPath}" -f text -l eng`;
      case 'pipeline':
        return `./ufs pipeline run 1 "${cliInputPath}"`;
      case 'status':
        return `./ufs status`;
      case 'engines':
        return `./ufs engines`;
      case 'serve':
        return `./ufs serve --host 127.0.0.1 --port 8000`;
      default:
        return `./ufs --help`;
    }
  };

  const endpoints = [
    { method: 'POST', path: '/api/v1/files/upload', desc: 'Stream multipart file uploads with magic byte validation' },
    { method: 'GET', path: '/api/v1/files', desc: 'List tracked files with metadata and recommendations' },
    { method: 'POST', path: '/api/v1/jobs', desc: 'Enqueue asynchronous background processing job' },
    { method: 'GET', path: '/api/v1/jobs/{id}', desc: 'Query active or completed job execution state and logs' },
    { method: 'GET', path: '/api/v1/operations', desc: 'List dynamic operation schemas and parameters' },
    { method: 'POST', path: '/api/v1/batch/convert', desc: 'Batch conversion of multiple files to target format' },
    { method: 'POST', path: '/api/v1/batch/archive', desc: 'Create unified 7z/ZIP archive from file list' },
    { method: 'GET', path: '/api/v1/pipelines', desc: 'List registered sequential multi-step pipelines' },
    { method: 'POST', path: '/api/v1/pipelines/{id}/execute', desc: 'Execute pipeline chain on target file' },
    { method: 'WS', path: '/ws', desc: 'Real-time WebSocket event and telemetry stream' },
    { method: 'GET', path: '/api/v1/developer/info', desc: 'Developer system diagnostics and environment' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-brand-400" />
            Developer Hub & API Explorer
          </h2>
          <p className="text-xs text-slate-400">
            Local-first REST Swagger documentation, CLI toolkit reference, and live real-time WebSocket telemetry.
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex items-center gap-2">
          <a
            href={`${window.location.protocol}//${window.location.hostname}:8000/docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-lg hover:bg-brand-500/30 transition text-xs font-semibold cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Swagger UI
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={`${window.location.protocol}//${window.location.hostname}:8000/redoc`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 text-slate-300 border border-surface-700 rounded-lg hover:bg-surface-800 transition text-xs font-semibold cursor-pointer"
          >
            ReDoc
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>REST API Endpoint</span>
            <Code2 className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">http://127.0.0.1:8000</div>
          <div className="text-[11px] text-emerald-400 mt-1">OpenAPI 3.1 Ready</div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>WebSocket Stream</span>
            <Radio className={`h-4 w-4 ${wsStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-sm font-bold text-white capitalize flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {wsStatus}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ws://127.0.0.1:8000/ws</div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>CLI Executable</span>
            <Terminal className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white">./ufs</div>
          <div className="text-[11px] text-slate-400 mt-1">9 Subcommands Available</div>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Local Engines</span>
            <Cpu className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white">
            {info ? `${info.engines.installed_count} / ${info.engines.total_registered}` : 'Scanning...'}
          </div>
          <div className="text-[11px] text-purple-400 mt-1">Zero Cloud Dependencies</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('api')}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'api'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          REST API & Swagger
        </button>
        <button
          onClick={() => setActiveTab('cli')}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'cli'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          CLI Tool Reference (`ufs`)
        </button>
        <button
          onClick={() => setActiveTab('websocket')}
          className={`pb-2.5 transition flex items-center gap-1.5 border-b-2 ${
            activeTab === 'websocket'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="h-4 w-4" />
          Live WebSocket Telemetry
          {packets.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-brand-500/20 text-brand-300 rounded-full">
              {packets.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: REST API & Swagger */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Full Interactive Swagger UI</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute requests, test authentication-free local endpoints, and inspect complete Pydantic schemas.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="http://127.0.0.1:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                Launch Swagger UI
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => handleCopy('http://127.0.0.1:8000/api/v1/developer/openapi.json', 'openapi-url')}
                className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedText === 'openapi-url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                Copy openapi.json URL
              </button>
            </div>
          </div>

          <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
            <div className="p-3 bg-surface-950/60 border-b border-surface-800 font-semibold text-xs text-slate-300">
              Core REST Endpoints Directory
            </div>
            <div className="divide-y divide-surface-800/60">
              {endpoints.map((ep) => (
                <div key={ep.path + ep.method} className="p-3 flex items-center justify-between hover:bg-surface-800/30 transition text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      ep.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      ep.method === 'POST' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      ep.method === 'WS' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-200">{ep.path}</span>
                  </div>
                  <span className="text-slate-400 hidden sm:inline text-right">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLI Reference */}
      {activeTab === 'cli' && (
        <div className="space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Interactive CLI Command Builder
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Subcommand</label>
                <select
                  value={cliCommand}
                  onChange={(e) => setCliCommand(e.target.value)}
                  className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                >
                  <option value="convert">convert (Transcode media/docs)</option>
                  <option value="hash">hash (Compute SHA-256 / MD5)</option>
                  <option value="strip-metadata">strip-metadata (Privacy scrub)</option>
                  <option value="ocr">ocr (Text extraction)</option>
                  <option value="pipeline">pipeline (Run multi-step)</option>
                  <option value="status">status (System diagnostics)</option>
                  <option value="engines">engines (Check installed binaries)</option>
                  <option value="serve">serve (Start server)</option>
                </select>
              </div>

              {cliCommand === 'convert' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Input File Path</label>
                    <input
                      type="text"
                      value={cliInputPath}
                      onChange={(e) => setCliInputPath(e.target.value)}
                      className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Target Format</label>
                    <input
                      type="text"
                      value={cliTarget}
                      onChange={(e) => setCliTarget(e.target.value)}
                      className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                    />
                  </div>
                </>
              )}

              {cliCommand === 'hash' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Input File Path</label>
                    <input
                      type="text"
                      value={cliInputPath}
                      onChange={(e) => setCliInputPath(e.target.value)}
                      className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Algorithm</label>
                    <select
                      value={cliAlgorithm}
                      onChange={(e) => setCliAlgorithm(e.target.value)}
                      className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                    >
                      <option value="all">All (SHA-256, MD5, SHA-1)</option>
                      <option value="sha256">SHA-256</option>
                      <option value="md5">MD5</option>
                    </select>
                  </div>
                </>
              )}

              {['strip-metadata', 'ocr', 'pipeline'].includes(cliCommand) && (
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Input File Path</label>
                  <input
                    type="text"
                    value={cliInputPath}
                    onChange={(e) => setCliInputPath(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-800 rounded-lg p-2 text-white"
                  />
                </div>
              )}
            </div>

            {/* Generated Command Box */}
            <div className="bg-surface-950 border border-surface-800 rounded-xl p-3 flex items-center justify-between">
              <code className="text-xs text-brand-300 font-mono select-all">
                {generateCliSnippet()}
              </code>
              <button
                onClick={() => handleCopy(generateCliSnippet(), 'cli-snippet')}
                className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ml-3 shrink-0"
              >
                {copiedText === 'cli-snippet' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Command
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live WebSocket Telemetry */}
      {activeTab === 'websocket' && (
        <div className="space-y-4">
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <div>
                <h3 className="text-sm font-bold text-white">WebSocket Stream Inspector</h3>
                <p className="text-xs text-slate-400">
                  Real-time event packets for job progress, cancellations, completions, and engine detection.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendPing}
                className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Send className="h-3.5 w-3.5 text-brand-400" />
                Send Ping
              </button>
              <button
                onClick={handleTriggerTestEvent}
                disabled={isTriggering}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Radio className="h-3.5 w-3.5" />
                Trigger Test Broadcast
              </button>
              <button
                onClick={() => setPackets([])}
                className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Packet Stream Console */}
          <div className="bg-surface-950 border border-surface-800 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-surface-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">Real-Time Event Stream ({packets.length} packets received)</span>
              <span className="text-[11px] text-slate-500">Auto-scrolling stream</span>
            </div>

            <div className="p-3 max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
              {packets.length === 0 ? (
                <div className="py-8 text-center text-slate-500 italic">
                  No packets received yet. Trigger an action, start a job, or click "Send Ping".
                </div>
              ) : (
                packets.map((pkt, idx) => (
                  <div key={idx} className="p-2.5 bg-surface-900 border border-surface-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
                        {pkt.event || 'message'}
                      </span>
                      <span className="text-slate-500">{pkt._receivedAt}</span>
                    </div>
                    <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(pkt, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
