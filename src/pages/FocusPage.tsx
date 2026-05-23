import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, SkipForward, BarChart2, History, Timer, TrendingUp, Volume2, VolumeX, Music, Plus, Minus, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFocusStore } from '@/store/focusStore';
import { FocusHeatmap } from '@/components/focus/FocusHeatmap';
import * as focusDb from '@/database/focus';
import { Card, CardContent } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDuration, formatTime, formatDate } from '@/utils/dates';
import type { FocusSession } from '@/types';

class FocusSoundGenerator {
  private ctx: AudioContext | null = null;
  private activeSound: string | null = null;
  private volume: number = 0.5;
  private nodes: { 
    oscs?: OscillatorNode[]; 
    noise?: AudioBufferSourceNode; 
    gain: GainNode; 
    lfo?: OscillatorNode; 
    filter?: BiquadFilterNode;
  } | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.nodes?.gain) {
      let factor = 1.0;
      if (this.activeSound === 'ocean') factor = 0.35;
      if (this.activeSound === 'rain') factor = 0.6;
      if (this.activeSound === 'binaural') factor = 0.25;
      if (this.activeSound === 'stream') factor = 0.2;
      this.nodes.gain.gain.setValueAtTime(this.volume * factor, this.ctx!.currentTime);
    }
  }

  stop() {
    if (this.nodes) {
      if (this.nodes.oscs) {
        this.nodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} });
      }
      if (this.nodes.noise) {
        try { this.nodes.noise.stop(); } catch (e) {}
      }
      if (this.nodes.lfo) {
        try { this.nodes.lfo.stop(); } catch (e) {}
      }
      try { this.nodes.gain.disconnect(); } catch (e) {}
      this.nodes = null;
    }
    this.activeSound = null;
  }

  play(sound: string) {
    this.init();
    this.stop();
    this.activeSound = sound;
    const ctx = this.ctx!;
    const mainGain = ctx.createGain();
    mainGain.connect(ctx.destination);

    if (sound === 'binaural') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      osc1.frequency.value = 180; 
      osc2.frequency.value = 220;

      if (panner1 && panner2) {
        panner1.pan.value = -1;
        panner2.pan.value = 1;
        osc1.connect(panner1).connect(mainGain);
        osc2.connect(panner2).connect(mainGain);
      } else {
        const merger = ctx.createChannelMerger(2);
        osc1.connect(merger, 0, 0);
        osc2.connect(merger, 0, 1);
        merger.connect(mainGain);
      }

      osc1.start();
      osc2.start();
      this.nodes = { oscs: [osc1, osc2], gain: mainGain };
    } 
    else if (sound === 'rain') {
      const bufferSize = 10 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.025 * white)) / 1.025;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      noise.connect(filter).connect(mainGain);
      noise.start();
      this.nodes = { noise, filter, gain: mainGain };
    } 
    else if (sound === 'ocean') {
      const bufferSize = 4 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 350;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08; 
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.4; 
      
      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain); 

      noise.connect(filter).connect(mainGain);
      lfo.start();
      noise.start();

      this.nodes = { noise, lfo, filter, gain: mainGain };
    } 
    else if (sound === 'stream') {
      const bufferSize = 4 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 1.2;

      noise.connect(filter).connect(mainGain);
      noise.start();
      this.nodes = { noise, filter, gain: mainGain };
    }

    this.setVolume(this.volume);
  }
}

const soundGenerator = new FocusSoundGenerator();

export function FocusPage() {
  const { 
    mode, timeLeft, isActive, sessionCount, currentSessionId,
    recentSessions, todayFocusTime, totalFocusTime, dailyData, focusStreak,
    setMode, setTimeLeft, setIsActive, tick, startSession, endSession, clearTimer, syncTime, loadStats
  } = useFocusStore();

  const [view, setView] = useState<'yearly' | 'monthly'>('yearly');
  
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const MODES = {
    focus: { time: 25 * 60, label: 'Focus', color: 'var(--accent)' },
    shortBreak: { time: 5 * 60, label: 'Rest', color: '#a3a3a3' },
    longBreak: { time: 15 * 60, label: 'Deep Rest', color: '#a3a3a3' }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  useEffect(() => {
    syncTime();
    loadStats();
  }, [isActive, syncTime, loadStats]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        try {
          soundGenerator.init();
        } catch (e) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const toggleTimer = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      startSession();
    }
  };
  
  const stopTimer = () => {
    endSession();
  };

  const handleSoundChange = (sound: string) => {
    setAmbientSound(sound);
    if (sound === 'none') {
      soundGenerator.stop();
    } else {
      soundGenerator.play(sound);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbientVolume(vol);
    soundGenerator.setVolume(vol);
  };

  const adjustTime = (seconds: number) => {
    if (isActive) return;
    const newTime = Math.max(60, timeLeft + seconds);
    setTimeLeft(newTime);
  };

  const progress = 1 - (timeLeft / MODES[mode].time);
  const activeColor = MODES[mode].color;

  return (
    <div className="h-full flex flex-col space-y-8 pb-20 overflow-y-auto pr-2 scrollbar-hide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-1">Focus Flow</h1>
          <p className="text-neutral-400">Immerse yourself in concentration, block out distraction.</p>
        </div>
        <div className="flex bg-[#141414] border border-[#2a2a2a] p-1 rounded-xl">
          <button 
            onClick={() => setView('yearly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors duration-200",
              view === 'yearly' ? "bg-white text-black" : "text-neutral-500 hover:text-white"
            )}
          >
            Yearly
          </button>
          <button 
            onClick={() => setView('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors duration-200",
              view === 'monthly' ? "bg-white text-black" : "text-neutral-500 hover:text-white"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <Card className="w-full p-8 flex flex-col items-center overflow-hidden relative">
            <AnimatePresence>
              {isActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: [0.06, 0.12, 0.06], 
                    scale: [0.9, 1.1, 0.9] 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 4, 
                    ease: "easeInOut", 
                    repeat: Infinity 
                  }}
                  className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 65%)`
                  }}
                />
              )}
            </AnimatePresence>

            <div className="flex bg-[#0c0c0c] border border-[#2a2a2a] rounded-full p-1 mb-8 z-10">
              {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-widest transition-colors duration-200 relative",
                    mode === m ? "text-black" : "text-neutral-500 hover:text-white"
                  )}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="focus-mode-bg"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {MODES[m].label}
                </button>
              ))}
            </div>

            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  className="stroke-[#2a2a2a] fill-none" 
                  strokeWidth="1.5"
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  className="fill-none" 
                  stroke={activeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{ strokeDasharray: `${Math.max(0, Math.min(progress, 1)) * 283} 283` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              
              <div className="flex flex-col items-center z-10 text-center">
                <motion.div 
                  key={timeLeft}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-6xl font-light tracking-tighter tabular-nums text-white"
                  style={{ fontFamily: 'monospace' }}
                >
                  {formatTime(timeLeft)}
                </motion.div>
                
                <span className="text-[9px] font-medium uppercase tracking-[0.25em] mt-3 text-neutral-500 flex items-center gap-1.5">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />}
                  {isActive ? 'Session Live' : 'Ready'}
                </span>
              </div>
            </div>

            <div className={cn(
              "flex gap-3 mb-8 transition-opacity duration-200",
              (isActive || currentSessionId) ? "opacity-20 pointer-events-none" : "opacity-100"
            )}>
              <button 
                onClick={() => adjustTime(-60)} 
                title="Subtract 1 minute"
                className="p-2 border border-[#2a2a2a] hover:border-neutral-600 text-neutral-400 hover:text-white rounded-xl transition-colors duration-200"
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => adjustTime(-300)} 
                title="Subtract 5 minutes"
                className="px-3 py-1 text-[10px] font-medium border border-[#2a2a2a] hover:border-neutral-600 text-neutral-400 hover:text-white rounded-xl transition-colors duration-200"
              >
                -5m
              </button>
              <button 
                onClick={() => adjustTime(300)} 
                title="Add 5 minutes"
                className="px-3 py-1 text-[10px] font-medium border border-[#2a2a2a] hover:border-neutral-600 text-neutral-400 hover:text-white rounded-xl transition-colors duration-200"
              >
                +5m
              </button>
              <button 
                onClick={() => adjustTime(60)} 
                title="Add 1 minute"
                className="p-2 border border-[#2a2a2a] hover:border-neutral-600 text-neutral-400 hover:text-white rounded-xl transition-colors duration-200"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex items-center gap-5 z-10">
              <button 
                onClick={stopTimer}
                disabled={!currentSessionId}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors duration-200",
                  currentSessionId 
                    ? "border-[#2a2a2a] text-white hover:bg-[#1a1a1a]" 
                    : "border-[#2a2a2a]/50 text-neutral-500 opacity-40 cursor-not-allowed"
                )}
              >
                <Square size={16} strokeWidth={1.5} fill="currentColor" />
              </button>
              <button 
                onClick={clearTimer}
                disabled={!currentSessionId}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors duration-200",
                  currentSessionId ? "" : "opacity-40 cursor-not-allowed"
                )}
                title="Clear timer without saving"
              >
                <Minus size={16} strokeWidth={1.5} />
              </button>
              
              <button 
                onClick={toggleTimer}
                className="w-20 h-20 flex items-center justify-center rounded-3xl text-black transition-colors duration-200"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {isActive ? <Pause size={30} strokeWidth={1.5} fill="black" /> : <Play size={30} strokeWidth={1.5} className="ml-1" fill="black" />}
              </button>

              <button 
                onClick={() => {
                  if (mode === 'focus') setMode('shortBreak');
                  else if (mode === 'shortBreak') setMode('longBreak');
                  else setMode('focus');
                }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-[#2a2a2a] text-white hover:bg-[#1a1a1a] transition-colors duration-200"
              >
                <SkipForward size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-8 flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors duration-200",
                    i <= (sessionCount % 4) 
                      ? "bg-[var(--accent)]" 
                      : "bg-[#2a2a2a]"
                  )} 
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                    <Timer size={15} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Today's Flow</span>
                </div>
                <div className="text-3xl font-medium flex items-baseline text-white">
                  {Math.round(todayFocusTime / 60)}
                  <span className="text-xs font-normal text-neutral-500 ml-1">mins</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                    <TrendingUp size={15} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Total Duration</span>
                </div>
                <div className="text-3xl font-medium flex items-baseline text-white">
                  {Math.round(totalFocusTime / 60)}
                  <span className="text-xs font-normal text-neutral-500 ml-1">mins</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                    <Zap size={15} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Focus Streak</span>
                </div>
                <div className="text-3xl font-medium flex items-baseline text-white">
                  {focusStreak.currentStreak}
                  <span className="text-xs font-normal text-neutral-500 ml-1">days</span>
                  <span className="text-[9px] font-medium text-neutral-500 ml-2" title="Longest streak record">
                    (pb: {focusStreak.longestStreak})
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                    <Music size={15} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-xs uppercase tracking-wider text-white">Ambient Soundscapes</h3>
                </div>
                <div className="text-[8px] font-medium text-[var(--accent-lighter)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Web Audio Synthesized
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                {[
                  { id: 'none', label: 'Mute', icon: VolumeX },
                  { id: 'binaural', label: 'Binaural 40Hz', icon: Zap },
                  { id: 'rain', label: 'Rain', icon: Volume2 },
                  { id: 'ocean', label: 'Ocean', icon: Volume2 },
                  { id: 'stream', label: 'Stream', icon: Volume2 },
                ].map(s => {
                  const SIcon = s.icon;
                  const isSelected = ambientSound === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSoundChange(s.id)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-[10px] font-medium flex flex-col items-center gap-1 transition-colors duration-200",
                        isSelected 
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-lighter)]" 
                          : "border-[#2a2a2a] text-neutral-400 hover:border-neutral-600 hover:text-white"
                      )}
                    >
                      <SIcon size={14} strokeWidth={1.5} />
                      <span className="truncate max-w-full">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a]">
                <Volume2 size={15} strokeWidth={1.5} className="text-neutral-400" />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 accent-[var(--accent)] h-1.5 rounded-lg appearance-none bg-[#2a2a2a] cursor-pointer"
                  disabled={ambientSound === 'none'}
                />
                <span className="text-[10px] font-medium font-mono text-neutral-400 w-8 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                  <History size={15} strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-xs uppercase tracking-wider text-white">Recent Sessions</h3>
              </div>

              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 text-[11px] italic">
                    No focus history log found. Complete a session to start your streak!
                  </div>
                ) : (
                  <> 
                    {recentSessions.slice(0, 3).map((session) => {
                      const isFocus = (session.type as string) === 'focus';
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                              isFocus 
                                ? "bg-[var(--accent)]/10 text-[var(--accent-lighter)]" 
                                : "bg-[#1a1a1a] text-neutral-400"
                            )}>
                              {isFocus ? 'F' : 'R'}
                            </div>
                            <div>
                              <span className="text-[11px] font-medium block capitalize text-white">
                                {isFocus ? 'Focus Session' : (session.type as string) === 'shortBreak' ? 'Short Break' : 'Long Break'}
                              </span>
                              <span className="text-[9px] text-neutral-500">
                                {formatDate(session.startedAt)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-medium font-mono text-neutral-400">
                            {formatDuration(Math.round(session.duration / 60))}
                          </span>
                        </div>
                      );
                    })}
                    {recentSessions.length > 3 && (
                      <button
                        onClick={() => setShowAllSessions(true)}
                        className="mt-2 px-3 py-1 rounded-xl text-[10px] font-medium bg-[#1a1a1a] border border-[#2a2a2a] hover:border-neutral-600 text-neutral-400 hover:text-white transition-colors duration-200"
                      >
                        View All ({recentSessions.length})
                      </button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="flex-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent-lighter)]">
                <BarChart2 size={15} strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-xs uppercase tracking-wider text-white">Focus Consistency</h3>
            </div>
            <div className="text-[8px] font-medium text-neutral-500 uppercase bg-[#1a1a1a] px-2.5 py-1 rounded-lg border border-[#2a2a2a]">
              GitHub Heatmap
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <FocusHeatmap data={dailyData} view={view} onDayClick={setSelectedDate} />
          </div>
          {selectedDate && (
            <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
              <span className="font-medium text-white">{selectedDate}:</span>{' '}
              <span className="text-neutral-400">{dailyData[selectedDate] ? `${dailyData[selectedDate]} min` : 'No data'}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAllSessions} onOpenChange={setShowAllSessions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Recent Sessions</DialogTitle>
            <DialogDescription>
              Full list of your recent focus sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-[#2a2a2a] bg-[#1a1a1a] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                    (session.type as string) === 'focus' ? "bg-[var(--accent)]/10 text-[var(--accent-lighter)]" : "bg-[#1a1a1a] text-neutral-400"
                  )}>
                    {(session.type as string) === 'focus' ? 'F' : 'R'}
                  </div>
                  <div>
                    <span className="text-[11px] font-medium block capitalize text-white">
                      {(session.type as string) === 'focus' ? 'Focus Session' : (session.type as string) === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      {formatDate(session.startedAt)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-medium font-mono text-neutral-400">
                  {formatDuration(Math.round(session.duration / 60))}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
