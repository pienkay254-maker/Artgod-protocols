
import React, { useState } from 'react';
import { X, GitMerge, Brain, Search, Clock, Trash2 } from 'lucide-react';
// Added AgentStatus to imports
import { AgentToken, MemoryEntry, AgentStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  isLabOpen: boolean;
  setIsLabOpen: (b: boolean) => void;
  isMemoryOpen: boolean;
  setIsMemoryOpen: (b: boolean) => void;
  agents: AgentToken[];
  setAgents: React.Dispatch<React.SetStateAction<AgentToken[]>>;
  memories: MemoryEntry[];
}

const ControlPanel: React.FC<Props> = ({ 
  isLabOpen, setIsLabOpen, isMemoryOpen, setIsMemoryOpen, agents, setAgents, memories 
}) => {
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (mergeIds.length !== 2) return;
    setIsMerging(true);
    
    const a1 = agents.find(a => a.id === mergeIds[0])!;
    const a2 = agents.find(a => a.id === mergeIds[1])!;

    // Set source agents to EVOLVING state during the process
    setAgents(prev => prev.map(a => 
      (a.id === a1.id || a.id === a2.id) ? { ...a, status: AgentStatus.EVOLVING } : a
    ));

    try {
      const result = await geminiService.mergeAgents(
        { emoji: a1.emoji, name: a1.name },
        { emoji: a2.emoji, name: a2.name }
      );

      const newNode: AgentToken = {
        id: Math.random().toString(36),
        emoji: result.emoji,
        name: result.name,
        level: Math.max(a1.level, a2.level) + 1,
        trait: result.trait,
        history: [],
        status: AgentStatus.IDLE,
        position: { x: (a1.position.x + a2.position.x) / 2, y: (a1.position.y + a2.position.y) / 2 }
      };

      // Keep the old agents but reset their status, add the new one
      setAgents(prev => {
        const resetOld = prev.map(a => 
          (a.id === a1.id || a.id === a2.id) ? { ...a, status: AgentStatus.IDLE } : a
        );
        return [...resetOld, newNode];
      });
      
      setIsLabOpen(false);
      setMergeIds([]);
    } catch (e) {
      console.error(e);
      // Reset status on error
      setAgents(prev => prev.map(a => 
        (a.id === a1.id || a.id === a2.id) ? { ...a, status: AgentStatus.IDLE } : a
      ));
    } finally {
      setIsMerging(false);
    }
  };

  const toggleMergeId = (id: string) => {
    setMergeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(0, 2)
    );
  };

  if (!isLabOpen && !isMemoryOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
      <div className="w-full max-w-2xl glass rounded-[40px] shadow-2xl border border-white/10 overflow-hidden relative">
        <button 
          onClick={() => { setIsLabOpen(false); setIsMemoryOpen(false); }}
          className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white/50" />
        </button>

        {isLabOpen && (
          <div className="p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-pink-500/20 rounded-2xl">
                <GitMerge className="w-8 h-8 text-pink-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Evolution Lab</h2>
                <p className="text-white/40">Merge two tokens to create a new form of emotional intelligence.</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-12">
              {agents.map(agent => (
                <button 
                  key={agent.id}
                  onClick={() => toggleMergeId(agent.id)}
                  className={`p-4 rounded-2xl transition-all border ${
                    mergeIds.includes(agent.id) 
                      ? 'bg-pink-500/20 border-pink-500 shadow-lg scale-105' 
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="text-3xl mb-2">{agent.emoji}</div>
                  <div className="text-xs font-bold truncate">{agent.name}</div>
                </button>
              ))}
            </div>

            <button 
              onClick={handleMerge}
              disabled={mergeIds.length !== 2 || isMerging}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                mergeIds.length === 2 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 shadow-lg' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isMerging ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Merge Tokens <GitMerge className="w-5 h-5" /></>
              )}
            </button>
          </div>
        )}

        {isMemoryOpen && (
          <div className="p-12 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Memory Bank</h2>
                <p className="text-white/40">Visualized storage of your agents' long-term collective memory.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
              {memories.length === 0 && (
                <div className="py-20 text-center text-white/20 italic">
                  No memories captured yet. Tell an agent to "remember that..."
                </div>
              )}
              {memories.map(memory => (
                <div key={memory.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/80">{memory.value}</p>
                      <span className="text-[10px] text-white/30 font-mono">
                        {new Date(memory.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
