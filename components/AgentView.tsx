
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, ExternalLink, Globe, Sparkles, Star, Mic, Volume2 } from 'lucide-react';
import { AgentToken, AgentStatus } from '../types';

interface Props {
  agent: AgentToken;
  isSelected: boolean;
  isGlobalAudio: boolean;
  onClick: () => void;
  onCloseChat: () => void;
  onSendMessage: (msg: string) => void;
}

const AgentView: React.FC<Props> = ({ agent, isSelected, isGlobalAudio, onClick, onCloseChat, onSendMessage }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.history]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const isEvolving = agent.status === AgentStatus.EVOLVING;
  const isThinking = agent.status === AgentStatus.THINKING;
  const isLevelingUp = agent.status === AgentStatus.LEVEL_UP;
  const isEcho = agent.id === 'echo';

  return (
    <>
      {/* Floating Token */}
      <div 
        onClick={onClick}
        style={{ left: agent.position.x, top: agent.position.y }}
        className={`absolute cursor-pointer group transition-all duration-500 ease-out
          ${isSelected ? 'scale-125 z-40' : 'hover:scale-110 z-20'}
          ${isEvolving || isLevelingUp ? 'z-50' : ''}
        `}
      >
        <div className={`
          relative w-20 h-20 rounded-full flex items-center justify-center text-4xl
          transition-all duration-700
          ${isThinking ? 'animate-bounce shadow-[0_0_30px_rgba(255,255,255,0.4)]' : ''}
          ${isEvolving ? 'animate-evolve ring-4 ring-pink-500/50' : ''}
          ${isEcho && isGlobalAudio ? 'ring-4 ring-blue-500 animate-pulse' : ''}
          ${isLevelingUp ? 'animate-levelup ring-8 ring-yellow-400/80 bg-yellow-500/20' : 'shadow-[0_0_15px_rgba(255,255,255,0.1)]'}
          ${isSelected ? 'bg-white/10 ring-4 ring-purple-500/50' : 'bg-white/5 group-hover:bg-white/10'}
        `}>
          {agent.emoji}
          
          {/* Sound Waves for Echo */}
          {isEcho && isGlobalAudio && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-60">
              <div className="w-1 h-6 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-8 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-1 h-10 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: '0.5s' }}></div>
              <div className="w-1 h-8 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: '0.7s' }}></div>
              <div className="w-1 h-6 bg-blue-400 rounded-full animate-wave" style={{ animationDelay: '0.9s' }}></div>
            </div>
          )}

          {/* Level Up Indicator */}
          {isLevelingUp && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-lg animate-bounce flex items-center gap-1 drop-shadow-lg">
              <Star className="w-5 h-5 fill-yellow-400" /> LEVEL UP!
            </div>
          )}

          {/* Evolving Particles */}
          {isEvolving && (
            <>
              <div className="absolute animate-orbit text-pink-400 opacity-80">
                <Sparkles size={16} />
              </div>
              <div className="absolute animate-orbit text-purple-400 opacity-80" style={{ animationDelay: '-1s' }}>
                <Sparkles size={12} />
              </div>
              <div className="absolute animate-orbit text-blue-400 opacity-80" style={{ animationDelay: '-2.2s' }}>
                <Sparkles size={14} />
              </div>
            </>
          )}

          {/* Status Label */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
            <span className={`text-[10px] font-mono tracking-tighter block text-center uppercase transition-colors ${isLevelingUp ? 'text-yellow-400 animate-pulse' : 'text-white/50'}`}>
              {isEvolving ? 'EVOLVING...' : isLevelingUp ? 'TRANSCENDING...' : isEcho && isGlobalAudio ? 'LISTENING...' : `LVL ${agent.level}`}
            </span>
            <span className={`text-sm font-bold block text-center transition-colors ${isEvolving ? 'text-pink-400' : isLevelingUp ? 'text-yellow-400' : 'text-white/80'}`}>
              {agent.name}
            </span>
          </div>

          {/* Thinking Rings */}
          {isThinking && (
            <div className="absolute inset-[-8px] border border-purple-500/30 rounded-full animate-ping"></div>
          )}
        </div>
      </div>

      {/* Chat Interface Overlay */}
      {isSelected && (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 w-96 h-[70vh] glass rounded-3xl z-[100] flex flex-col shadow-2xl overflow-hidden border border-purple-500/20">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{agent.emoji}</span>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {agent.name} 
                  <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">L{agent.level}</span>
                </h3>
                <span className="text-xs text-purple-400 font-mono tracking-widest uppercase">{agent.trait}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               {isEcho && (
                 <div className={`p-2 rounded-full ${isGlobalAudio ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                   <Volume2 size={16} />
                 </div>
               )}
               <button onClick={onCloseChat} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <X className="w-5 h-5 text-white/40" />
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {agent.history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                {isEcho ? <Mic className="w-12 h-12 mb-4" /> : <Globe className="w-12 h-12 mb-4" />}
                <p className="text-sm">
                  {isEcho 
                    ? "I am the Echo agent. I translate the intelligence of other agents into audio. Enable Echo Mode below to hear us speak." 
                    : "Grounded with Google Search. Ask me anything about the world or tell me to remember something."}
                </p>
                <p className="text-[10px] mt-2 uppercase tracking-widest text-purple-400 font-mono">I grow with every 3rd message or when praised.</p>
              </div>
            )}
            {agent.history.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                  msg.role === 'user' ? 'bg-blue-600/20 text-blue-100 rounded-br-none' : 'bg-white/5 text-white/90 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.sources.map((s, si) => (
                      <a 
                        key={si} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded flex items-center gap-1 text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-2 h-2" /> {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white/5 border-t border-white/10">
            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isEcho ? "Type to speak through Echo..." : `Chat with ${agent.name}...`}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={isThinking || isEvolving || isLevelingUp}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentView;
