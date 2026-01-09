
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Brain, 
  Zap, 
  Camera, 
  Settings, 
  Maximize2, 
  MessageSquare,
  Sparkles,
  GitMerge,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AgentToken, AgentStatus, Message, MemoryEntry } from './types';
import { geminiService } from './services/geminiService';
import AgentView from './components/AgentView';
import ControlPanel from './components/ControlPanel';

const INITIAL_AGENTS: AgentToken[] = [
  {
    id: '1',
    emoji: '🦊',
    name: 'Spark',
    level: 1,
    trait: 'Curious',
    history: [],
    status: AgentStatus.IDLE,
    position: { x: 100, y: 150 }
  },
  {
    id: '2',
    emoji: '👾',
    name: 'Neon',
    level: 1,
    trait: 'Analytic',
    history: [],
    status: AgentStatus.IDLE,
    position: { x: 400, y: 300 }
  },
  {
    id: 'echo',
    emoji: '🎙️',
    name: 'Echo',
    level: 1,
    trait: 'Harmonious',
    history: [],
    status: AgentStatus.IDLE,
    position: { x: 700, y: 200 }
  }
];

const PRAISE_KEYWORDS = ['good job', 'thanks', 'thank you', 'amazing', 'awesome', 'great', 'brilliant', 'well done', 'love it'];

export default function App() {
  const [agents, setAgents] = useState<AgentToken[]>(INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persistence/Memory simulator
  useEffect(() => {
    const savedAgents = localStorage.getItem('ei_agents');
    const savedMemories = localStorage.getItem('ei_memories');
    if (savedAgents) setAgents(JSON.parse(savedAgents));
    if (savedMemories) setMemories(JSON.parse(savedMemories));
  }, []);

  useEffect(() => {
    localStorage.setItem('ei_agents', JSON.stringify(agents));
    localStorage.setItem('ei_memories', JSON.stringify(memories));
  }, [agents, memories]);

  const speakText = async (text: string) => {
    if (!isAudioEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const base64Audio = await geminiService.textToSpeech(text);
    if (base64Audio) {
      const bytes = geminiService.decodeBase64(base64Audio);
      const buffer = await geminiService.decodeAudioData(bytes, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    }
  };

  const handleLevelUp = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.LEVEL_UP } : a));
    
    // Aesthetic pause for animation
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const nextLevel = agent.level + 1;
      const evolvedTrait = await geminiService.evolveTrait(agent.trait, nextLevel);
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, level: nextLevel, trait: evolvedTrait, status: AgentStatus.IDLE } 
          : a
      ));
    } catch (e) {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.IDLE } : a));
    }
  };

  const handleAgentChat = async (agentId: string, text: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.THINKING } : a));
    
    const agent = agents.find(a => a.id === agentId)!;
    const memoryString = memories.map(m => `${m.key}:${m.value}`).join(', ');
    
    try {
      const response = await geminiService.chatWithAgent(
        agent.name, 
        agent.emoji, 
        text, 
        agent.history, 
        memoryString
      );

      const newMsg: Message = { role: 'agent', content: response.text, timestamp: Date.now(), sources: response.sources };
      const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() - 1 };

      const newHistory = [...agent.history, userMsg, newMsg];
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { ...a, history: newHistory, status: AgentStatus.IDLE } 
          : a
      ));

      // Audio Response
      if (isAudioEnabled) {
        speakText(response.text);
      }

      // Level Up Logic
      const turns = newHistory.length / 2;
      const isPraise = PRAISE_KEYWORDS.some(k => text.toLowerCase().includes(k));
      
      if (turns % 3 === 0 || isPraise) {
        setTimeout(() => handleLevelUp(agentId), 500);
      }

      // Memory extraction
      if (text.toLowerCase().includes('remember that')) {
        const val = text.split('remember that')[1].trim();
        const newMemory: MemoryEntry = {
          id: Math.random().toString(36),
          key: `note_${Date.now()}`,
          value: val,
          timestamp: Date.now()
        };
        setMemories(prev => [newMemory, ...prev].slice(0, 50));
      }
    } catch (e) {
      console.error(e);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: AgentStatus.IDLE } : a));
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const captureAndEdit = async (prompt: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/png').split(',')[1];
    
    setCapturedImage('loading');
    const result = await geminiService.editImage(base64, prompt);
    setCapturedImage(result);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      {/* Background Growing Patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="grid grid-cols-12 h-full opacity-5">
           {Array.from({ length: 144 }).map((_, i) => (
             <div key={i} className="border-[0.5px] border-white/20"></div>
           ))}
        </div>
      </div>

      {/* Agents Space */}
      <div className="relative z-10 w-full h-full">
        {agents.map(agent => (
          <AgentView 
            key={agent.id} 
            agent={agent} 
            isSelected={selectedAgentId === agent.id}
            isGlobalAudio={isAudioEnabled}
            onClick={() => setSelectedAgentId(agent.id)}
            onCloseChat={() => setSelectedAgentId(null)}
            onSendMessage={(msg) => handleAgentChat(agent.id, msg)}
          />
        ))}
      </div>

      {/* Main UI Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 glass rounded-full shadow-2xl">
        <button 
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={`p-3 rounded-full transition-all group relative ${isAudioEnabled ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white/40'}`}
        >
          {isAudioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isAudioEnabled ? 'Disable Echo Mode' : 'Enable Echo Mode'}
          </span>
        </button>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        <button 
          onClick={() => setIsMemoryOpen(true)}
          className="p-3 hover:bg-white/10 rounded-full transition-all group relative"
        >
          <Brain className="w-6 h-6 text-purple-400" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Memory Bank</span>
        </button>
        <button 
          onClick={() => setIsLabOpen(true)}
          className="p-3 hover:bg-white/10 rounded-full transition-all group relative"
        >
          <GitMerge className="w-6 h-6 text-pink-400" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Evolution Lab</span>
        </button>
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        <button 
          onClick={() => startCamera()}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all group relative"
        >
          <Camera className="w-6 h-6 text-blue-400" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sensor Input</span>
        </button>
      </div>

      {/* Camera/Sensor Overlay */}
      {isCameraActive && (
        <div className="fixed inset-0 z-[60] glass flex items-center justify-center p-8">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <input 
                type="text" 
                placeholder="Ask sensors to analyze or edit..."
                className="w-80 px-4 py-3 rounded-xl bg-black/60 border border-white/20 text-white focus:outline-none focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') captureAndEdit(e.currentTarget.value);
                }}
              />
              <button 
                onClick={() => setIsCameraActive(false)}
                className="px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-xl font-bold transition-colors"
              >
                Close Sensors
              </button>
            </div>
            {capturedImage && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4">
                {capturedImage === 'loading' ? (
                  <div className="text-xl animate-pulse">Processing Sensory Data...</div>
                ) : (
                  <>
                    <img src={capturedImage} className="max-h-[70%] rounded-lg shadow-2xl mb-4" />
                    <button 
                      onClick={() => setCapturedImage(null)}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      Back to Feed
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Panels */}
      <ControlPanel 
        isLabOpen={isLabOpen} 
        setIsLabOpen={setIsLabOpen}
        isMemoryOpen={isMemoryOpen}
        setIsMemoryOpen={setIsMemoryOpen}
        agents={agents}
        setAgents={setAgents}
        memories={memories}
      />

      {/* Header Overlay */}
      <div className="fixed top-8 left-8 z-50">
        <h1 className="text-2xl font-bold flex items-center gap-3 neon-text">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            EMOTIONAL INTELLIGENCE
          </span>
          <span className="text-xl">😁</span>
        </h1>
        <p className="text-xs text-white/40 tracking-widest mt-1 font-mono uppercase">ARTGOD PROTOCOL v3.1</p>
      </div>
    </div>
  );
}
