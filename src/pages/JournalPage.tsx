import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Search, Book, Smile, Edit3 } from 'lucide-react';
import { useJournalStore } from '@/store/journalStore';

export function JournalPage() {
  const { entries, fetchEntries, addEntry, isLoading } = useJournalStore();
  const [isComposing, setIsComposing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reflection' | 'gratitude'>('all');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [type, setType] = useState<'reflection' | 'gratitude'>('reflection');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = entries.filter(e => 
    activeTab === 'all' || e.type === activeTab
  );

  const handleSave = async () => {
    if (!content.trim()) return;
    
    await addEntry({
      date: new Date().toISOString().split('T')[0],
      content,
      mood: mood as any,
      moodScore: 0,
      type,
      tags: []
    });
    
    setContent('');
    setMood(null);
    setIsComposing(false);
  };

  const MOOD_EMOJIS = {
    great: '😁', good: '🙂', okay: '😐', bad: '😕', terrible: '😫'
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">Journal</h1>
          <p className="text-neutral-400">Reflect, track moods, and practice gratitude.</p>
        </div>
        <Button onClick={() => setIsComposing(true)} className="gap-2">
          <Edit3 size={16} strokeWidth={1.5} /> New Entry
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex bg-[#141414] border border-[#2a2a2a] rounded-xl p-1">
          {['all', 'reflection', 'gratitude'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors duration-200 ${
                activeTab === tab 
                  ? 'bg-white text-black' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input placeholder="Search journal..." className="pl-9" />
        </div>
      </div>

      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          >
            <Card className="border-[var(--accent-border)]">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="h-10 rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors duration-200"
                  >
                    <option value="reflection">Reflection</option>
                    <option value="gratitude">Gratitude</option>
                  </select>
                  
                  <div className="flex bg-[#0c0c0c] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    {Object.entries(MOOD_EMOJIS).map(([key, emoji]) => (
                      <button 
                        key={key} 
                        title={key}
                        onClick={() => setMood(key)}
                        className={`w-10 h-10 flex items-center justify-center transition-colors duration-200 text-lg ${mood === key ? 'bg-[var(--accent-soft)]' : 'hover:bg-[#1a1a1a]'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?" 
                  className="min-h-[120px] text-base border-none bg-transparent px-0 focus:border-none resize-none shadow-none" 
                  autoFocus
                />
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#2a2a2a]">
                  <Button variant="ghost" onClick={() => setIsComposing(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save Entry</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-hide">
        {filteredEntries.map((entry, i) => (
          <motion.div 
            key={entry.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-6"
          >
            <div className="w-24 shrink-0 flex flex-col items-end relative pt-1">
              <span className="text-sm font-medium text-neutral-400">{entry.date}</span>
              <div className="absolute right-[-17px] top-2 w-3 h-3 rounded-full bg-[#1a1a1a] border-2 border-[#2a2a2a] z-10" />
              <div className="absolute right-[-12px] top-4 bottom-[-32px] w-0.5 bg-[#2a2a2a]" />
            </div>

            <Card className="flex-1 group hover:border-[var(--accent-border)] transition-colors duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {entry.type === 'reflection' ? <Book size={14} strokeWidth={1.5} /> : <Smile size={14} strokeWidth={1.5} />}
                    {entry.type}
                  </div>
                  {entry.mood && (
                    <span className="text-xl" title={entry.mood}>{MOOD_EMOJIS[entry.mood as keyof typeof MOOD_EMOJIS]}</span>
                  )}
                </div>
                <p className="text-white whitespace-pre-wrap leading-relaxed">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredEntries.length === 0 && !isLoading && (
          <div className="text-center p-12 text-neutral-400">
            No journal entries yet. Start writing!
          </div>
        )}
      </div>
    </div>
  );
}
