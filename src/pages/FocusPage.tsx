// =============================================
// PEAK — Focus & Pomodoro Page
// =============================================

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

// =============================================
// Web Audio Synthesizer (Offline Ambient Sound)
// =============================================
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
      osc2.frequency.value = 220; // 40Hz difference (Gamma wave stimulation)

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
  
    // Ambient sound states
  const [ambientSound, setAmbientSound] = useState<string>('none');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);
  // Dialog visibility for full recent sessions list
  const [showAllSessions, setShowAllSessions] = useState(false);
  // Selected date from calendar heatmap
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const MODES = {
    focus: { time: 25 * 60, label: 'Focus', color: 'var(--color-accent)' },
    shortBreak: { time: 5 * 60, label: 'Rest', color: 'var(--color-success)' },
    longBreak: { time: 15 * 60, label: 'Deep Rest', color: 'var(--color-warning)' }
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

  // Keep ambient audio alive across navigation; only stop when user mutes
  // Add visibility change handling to resume audio if the tab becomes active again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        // Ensure AudioContext is resumed when tab gains focus
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

  // Soft glow color calculations for breathing animation
  const activeColor = MODES[mode].color;

  return (
    <div className="h-full flex flex-col space-y-8 pb-20 overflow-y-auto pr-2 scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] mb-1">Focus Flow</h1>
          <p className="text-[var(--color-text-secondary)] font-medium">Immerse yourself in concentration, block out distraction.</p>
        </div>
        <div className="flex bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => setView('yearly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              view === 'yearly' ? "bg-[var(--color-accent)] text-white shadow" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Yearly
          </button>
          <button 
            onClick={() => setView('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              view === 'monthly' ? "bg-[var(--color-accent)] text-white shadow" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Timer & Customizer */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <Card className="w-full border border-[var(--color-border)] shadow-xl bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] p-8 flex flex-col items-center overflow-hidden relative rounded-3xl">
            {/* Animated breathing glow background */}
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
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ 
                    background: `radial-gradient(circle at 50% 50%, ${activeColor} 0%, transparent 65%)`
                  }}
                />
              )}
            </AnimatePresence>

            {/* Mode Selector */}
            <div className="flex bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full p-1 mb-8 shadow-inner z-10">
              {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative",
                    mode === m ? "text-white" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  )}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="focus-mode-bg-premium"
                      className="absolute inset-0 rounded-full bg-[var(--color-text-primary)] shadow-sm"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Premium Timer Ring with glowing tip */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Outer shadow / scale border */}
                <circle 
                  cx="50" cy="50" r="45" 
                  className="stroke-[var(--color-border)] fill-none opacity-20" 
                  strokeWidth="1.5"
                />
                {/* Active path */}
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
                  className="text-6xl font-light tracking-tighter tabular-nums text-[var(--color-text-primary)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  {formatTime(timeLeft)}
                </motion.div>
                
                <span className="text-[9px] font-bold uppercase tracking-[0.25em] mt-3 text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
                  {isActive ? 'Session Live' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Time Adjustments (locked during active session) */}
            <div className={cn(
              "flex gap-3 mb-8 transition-opacity duration-300",
              (isActive || currentSessionId) ? "opacity-20 pointer-events-none" : "opacity-100"
            )}>
              <button 
                onClick={() => adjustTime(-60)} 
                title="Subtract 1 minute"
                className="p-2 border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <Minus size={14} />
              </button>
              <button 
                onClick={() => adjustTime(-300)} 
                title="Subtract 5 minutes"
                className="px-3 py-1 text-[10px] font-bold border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                -5m
              </button>
              <button 
                onClick={() => adjustTime(300)} 
                title="Add 5 minutes"
                className="px-3 py-1 text-[10px] font-bold border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                +5m
              </button>
              <button 
                onClick={() => adjustTime(60)} 
                title="Add 1 minute"
                className="p-2 border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Primary Controls */}
            <div className="flex items-center gap-5 z-10">
              <button 
                onClick={stopTimer}
                disabled={!currentSessionId}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-90",
                  currentSessionId 
                    ? "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]" 
                    : "border-[var(--color-border)]/50 text-[var(--color-text-tertiary)] opacity-40 cursor-not-allowed"
                )}
              >
                <Square size={16} fill="currentColor" />
              </button>
              {/* Clear Timer Button */}
              <button 
                onClick={clearTimer}
                disabled={!currentSessionId}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl border border-red-500 text-red-500 hover:bg-red-100 transition-all active:scale-90",
                  currentSessionId ? "" : "opacity-40 cursor-not-allowed"
                )}
                title="Clear timer without saving"
              >
                <Minus size={16} />
              </button>
              
              <button 
                onClick={toggleTimer}
                className="w-20 h-20 flex items-center justify-center rounded-3xl text-white transition-all shadow-lg active:scale-95 cursor-pointer"
                style={{ 
                  backgroundColor: activeColor, 
                  boxShadow: `0 8px 30px -10px ${activeColor}` 
                }}
              >
                {isActive ? <Pause size={30} fill="white" /> : <Play size={30} className="ml-1" fill="white" />}
              </button>

              <button 
                onClick={() => {
                  if (mode === 'focus') setMode('shortBreak');
                  else if (mode === 'shortBreak') setMode('longBreak');
                  else setMode('focus');
                }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all active:scale-90"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Current Session Indicators */}
            <div className="mt-8 flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    i <= (sessionCount % 4) 
                      ? "scale-110 shadow" 
                      : "bg-[var(--color-border)]/50"
                  )} 
                  style={{ 
                    backgroundColor: i <= (sessionCount % 4) ? activeColor : undefined 
                  }}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Stats & Audio Synthesizer & History */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Daily Goal / Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                    <Timer size={15} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Today's Flow</span>
                </div>
                <div className="text-3xl font-bold flex items-baseline">
                  {Math.round(todayFocusTime / 60)}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">mins</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center text-[var(--color-success)]">
                    <TrendingUp size={15} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Total Duration</span>
                </div>
                <div className="text-3xl font-bold flex items-baseline">
                  {Math.round(totalFocusTime / 60)}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">mins</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 animate-pulse">
                    <Zap size={15} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Focus Streak</span>
                </div>
                <div className="text-3xl font-bold flex items-baseline">
                  {focusStreak.currentStreak}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-1">days</span>
                  <span className="text-[9px] font-semibold text-[var(--color-text-tertiary)] ml-2" title="Longest streak record">
                    (pb: {focusStreak.longestStreak})
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offline Soundscapes Synthesizer */}
          <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Music size={15} />
                  </div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">Ambient Soundscapes</h3>
                </div>
                <div className="text-[8px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Web Audio Synthesized
                </div>
              </div>

              {/* Sound Option List */}
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
                        "py-2 px-3 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all active:scale-95",
                        isSelected 
                          ? "border-purple-500 bg-purple-500/5 text-purple-500 font-extrabold shadow-sm" 
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                      )}
                    >
                      <SIcon size={14} />
                      <span className="truncate max-w-full">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-4 bg-[var(--color-bg-tertiary)] p-3 rounded-xl border border-[var(--color-border)]">
                <Volume2 size={15} className="text-[var(--color-text-secondary)]" />
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 accent-purple-500 h-1.5 rounded-lg appearance-none bg-[var(--color-border)] cursor-pointer"
                  disabled={ambientSound === 'none'}
                />
                <span className="text-[10px] font-bold font-mono text-[var(--color-text-secondary)] w-8 text-right">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent History Timeline */}
          <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <History size={15} />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">Recent Sessions</h3>
              </div>

              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-6 text-[var(--color-text-tertiary)] text-[11px] italic">
                    No focus history log found. Complete a session to start your streak!
                  </div>
                ) : (
                  <> 
                    {/* Show only first 3 sessions */}
                    {recentSessions.slice(0, 3).map((session) => {
                      const isFocus = (session.type as string) === 'focus';
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner",
                              isFocus 
                                ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" 
                                : "bg-[var(--color-success-light)] text-[var(--color-success)]"
                            )}>
                              {isFocus ? 'F' : 'R'}
                            </div>
                            <div>
                              <span className="text-[11px] font-bold block capitalize text-[var(--color-text-primary)]">
                                {isFocus ? 'Focus Session' : (session.type as string) === 'shortBreak' ? 'Short Break' : 'Long Break'}
                              </span>
                              <span className="text-[9px] text-[var(--color-text-tertiary)]">
                                {formatDate(session.startedAt)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-[var(--color-text-secondary)]">
                            {formatDuration(Math.round(session.duration / 60))}
                          </span>
                        </div>
                      );
                    })}
                    {/* Show button if more than 3 sessions */}
                    {recentSessions.length > 3 && (
                      <button
                        onClick={() => setShowAllSessions(true)}
                        className={cn("mt-2 px-3 py-1 rounded-xl text-[10px] font-bold bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] transition-colors")}
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

      {/* GitHub Heatmap Grid Card */}
      <Card className="border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm rounded-2xl flex-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-warning-light)] flex items-center justify-center text-[var(--color-warning)]">
                <BarChart2 size={15} />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)]">Focus Consistency</h3>
            </div>
            <div className="text-[8px] font-extrabold text-[var(--color-text-tertiary)] uppercase bg-[var(--color-bg-tertiary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]">
              GitHub Heatmap
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <FocusHeatmap data={dailyData} view={view} onDayClick={setSelectedDate} />
          </div>
          {selectedDate && (
            <div className="mt-4 p-4 bg-[var(--color-bg-tertiary)] rounded-lg shadow">
              <span className="font-bold">{selectedDate}:</span> {dailyData[selectedDate] ? `${dailyData[selectedDate]} min` : 'No data'}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog for all sessions */}
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
              <div key={session.id} className="flex items-center justify-between p-3 border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner",
                    (session.type as string) === 'focus' ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "bg-[var(--color-success-light)] text-[var(--color-success)]"
                  )}>
                    {(session.type as string) === 'focus' ? 'F' : 'R'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold block capitalize text-[var(--color-text-primary)]">
                      {(session.type as string) === 'focus' ? 'Focus Session' : (session.type as string) === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </span>
                    <span className="text-[9px] text-[var(--color-text-tertiary)]">
                      {formatDate(session.startedAt)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold font-mono text-[var(--color-text-secondary)]">
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
