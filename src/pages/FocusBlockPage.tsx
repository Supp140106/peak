import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldOff, Shield, Plus, X, AlertTriangle, CheckCircle2, Loader2, Pencil, Trash2, FolderPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import * as blockDb from '@/database/blockSites';
import type { DbCategory } from '@/database/blockSites';

type Status = 'idle' | 'blocking' | 'loading' | 'error';
export type Category = DbCategory & { custom?: boolean };

function Favicon({ domain }: { domain: string }) {
  const [err, setErr] = useState(false);
  if (err) return <span className="w-4 h-4 rounded-sm bg-[#1a1a1a] inline-block shrink-0" />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt="" width={16} height={16}
      className="rounded-sm shrink-0"
      onError={() => setErr(true)}
    />
  );
}

const EMOJI_OPTIONS = ['📱','🔞','🎰','🎬','🎮','📰','🎯','🛒','💬','🎵','📚','🏆','🌐','💼','🔥'];
const COLOR_OPTIONS = [
  'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-300',
  'bg-red-500/10 border-red-500/30 text-red-400',
   'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-lighter)]',
  'bg-green-500/10 border-green-500/30 text-green-400',
  'bg-purple-500/10 border-purple-500/30 text-purple-400',
  'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'bg-pink-500/10 border-pink-500/30 text-pink-400',
  'bg-teal-500/10 border-teal-500/30 text-teal-400',
];

interface ModalProps {
  category: Category | null;
  onSave: (cat: Category) => void;
  onClose: () => void;
}

function CategoryModal({ category, onSave, onClose }: ModalProps) {
  const isNew = !category;
  const [label, setLabel] = useState(category?.label ?? '');
  const [emoji, setEmoji] = useState(category?.emoji ?? '🌐');
  const [color, setColor] = useState(category?.color ?? COLOR_OPTIONS[0]);
  const [domains, setDomains] = useState<string[]>(category?.domains ?? []);
  const [domainInput, setDomainInput] = useState('');

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!d || domains.includes(d)) { setDomainInput(''); return; }
    setDomains(prev => [...prev, d]);
    setDomainInput('');
  };

  const save = () => {
    if (!label.trim()) return;
      onSave({
        id: category?.id ?? `custom_${Date.now()}`,
        label: label.trim(),
        emoji,
        color,
        domains,
        is_custom: 1,
        sort_order: 99,
        custom: true,
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg mx-4 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">
            {isNew ? 'New Category' : `Edit "${category.label}"`}
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors duration-200">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</label>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Category name" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors duration-200 ${emoji === e ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]' : 'border-[#2a2a2a] bg-[#1a1a1a]'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${c.split(' ')[0]} ${color === c ? 'ring-2 ring-[var(--accent)] scale-110' : 'border-transparent'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Domains ({domains.length})
          </label>
          <div className="flex gap-2">
            <Input value={domainInput} onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDomain()}
              placeholder="e.g. example.com" className="flex-1" />
            <Button variant="outline" size="icon" onClick={addDomain} disabled={!domainInput.trim()}>
              <Plus size={16} strokeWidth={1.5} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {domains.map(d => (
              <span key={d} className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-full text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-white">
                <Favicon domain={d} />
                {d}
                <button onClick={() => setDomains(prev => prev.filter(x => x !== d))}
                  className="text-neutral-500 hover:text-red-400 ml-0.5 transition-colors duration-200">
                  <X size={11} strokeWidth={1.5} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={!label.trim()}>
            {isNew ? 'Create Category' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function FocusBlockPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null | 'new'>(null);

  const loadCategories = useCallback(async () => {
    await blockDb.seedBuiltins();
    const cats = await blockDb.getAllCategories();
    setCategories(cats.map(c => ({ ...c, custom: c.is_custom === 1 })));
  }, []);

  useEffect(() => {
    invoke<boolean>('check_admin').then(setIsAdmin).catch(() => setIsAdmin(false));
    invoke<{ active: boolean; domains: string[] }>('get_block_state')
      .then(state => {
        if (state.active && state.domains.length > 0) {
          setDomains(state.domains);
          setStatus('blocking');
        }
      }).catch(() => {});
    loadCategories();
  }, [loadCategories]);

  const addDomain = () => {
    const d = input.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!d || domains.includes(d)) { setInput(''); return; }
    setDomains(prev => [...prev, d]);
    setInput('');
  };

  const removeDomain = (d: string) => setDomains(prev => prev.filter(x => x !== d));

  const addCategory = (cat: Category) => {
    setDomains(prev => {
      const next = [...prev];
      cat.domains.forEach(d => { if (!next.includes(d)) next.push(d); });
      return next;
    });
  };

  const removeCategory = (cat: Category) => {
    const set = new Set(cat.domains);
    setDomains(prev => prev.filter(d => !set.has(d)));
  };

  const isCategoryActive = (cat: Category) => cat.domains.length > 0 && cat.domains.every(d => domains.includes(d));

  const handleSaveCategory = async (cat: Category) => {
    const existing = categories.find(c => c.id === cat.id);
    if (existing) {
      await blockDb.updateCategory(cat.id, cat.label, cat.emoji, cat.color);
      await blockDb.setDomainsForCategory(cat.id, cat.domains);
    } else {
      const created = await blockDb.createCategory(cat.label, cat.emoji, cat.color);
      await blockDb.setDomainsForCategory(created.id, cat.domains);
    }
    await loadCategories();
    setEditingCat(null);
  };

  const handleDeleteCategory = async (id: string) => {
    await blockDb.deleteCategory(id);
    await loadCategories();
  };

  const handleBlock = async () => {
    if (domains.length === 0) return;
    setStatus('loading'); setError('');
    try {
      await invoke('block_domains', { domains });
      setStatus('blocking');
    } catch (e: any) { setError(String(e)); setStatus('error'); }
  };

  const handleUnblock = async () => {
    setStatus('loading'); setError('');
    try {
      await invoke('unblock_domains');
      setStatus('idle'); setDomains([]);
    } catch (e: any) { setError(String(e)); setStatus('error'); }
  };

  const isBlocking = status === 'blocking';
  const isLoading = status === 'loading';
  const locked = isBlocking || isLoading;

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      <header>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(28px,4vw,44px)] font-medium tracking-tight text-white mb-2">
          Focus Block
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-neutral-400 text-lg">
          Block distracting websites at the firewall level — even when the app is closed.
        </motion.p>
      </header>

      {isAdmin === false && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)]">
          <AlertTriangle size={18} strokeWidth={1.5} className="text-[var(--accent-lighter)] shrink-0" />
          <span className="text-sm text-white">Not running as Administrator — restart Peak as Administrator to use blocking.</span>
        </div>
      )}

      {isBlocking && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <Shield size={18} strokeWidth={1.5} className="text-red-400 shrink-0" />
          <span className="text-sm text-red-400 font-medium">Blocking active — persists after closing the app. Click "Stop Blocking" to remove.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-white">Categories</h2>
                <button onClick={() => setEditingCat('new')}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-lighter)] hover:text-[var(--accent)] transition-colors duration-200">
                  <FolderPlus size={14} strokeWidth={1.5} /> New Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map(cat => {
                  const active = isCategoryActive(cat);
                  return (
                    <div key={cat.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${cat.color} ${active ? 'ring-2 ring-offset-1 ring-[var(--accent)]' : ''}`}>
                      <span>{cat.emoji}</span>
                      <span className="flex-1 truncate text-black">{cat.label}</span>
                      <span className="text-xs opacity-60 shrink-0 text-neutral-500">{cat.domains.length}</span>

                      <button onClick={() => setEditingCat(cat)} disabled={locked}
                        className="opacity-50 hover:opacity-100 transition-opacity disabled:pointer-events-none text-neutral-400">
                        <Pencil size={12} strokeWidth={1.5} />
                      </button>

                      {cat.custom && (
                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={locked}
                          className="opacity-50 hover:opacity-100 transition-opacity disabled:pointer-events-none text-neutral-400">
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      )}

                      {active ? (
                        <button onClick={() => removeCategory(cat)} disabled={locked}
                          className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10 hover:bg-white/20 transition-colors duration-200 shrink-0 text-white">
                          Remove all
                        </button>
                      ) : (
                        <button onClick={() => addCategory(cat)} disabled={locked}
                          className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/10 hover:bg-white/20 transition-colors duration-200 shrink-0 text-white">
                          Add all
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-medium text-white">
                Blocked Domains
                {domains.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-neutral-500">
                    {domains.length} site{domains.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h2>

              <div className="flex gap-2">
                <Input placeholder="e.g. facebook.com" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDomain()}
                  disabled={locked} className="flex-1" />
                <Button variant="outline" size="icon" onClick={addDomain}
                  disabled={!input.trim() || locked}>
                  <Plus size={18} strokeWidth={1.5} />
                </Button>
              </div>

              {domains.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-6">
                  No domains added yet. Pick a category above or type a domain.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {domains.map(d => (
                      <motion.span key={d}
                        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                        className="flex items-center gap-1.5 pl-2 pr-2 py-1 rounded-full text-sm bg-[#1a1a1a] border border-[#2a2a2a] text-white">
                        <Favicon domain={d} />
                        <span>{d}</span>
                        {!locked && (
                          <button onClick={() => removeDomain(d)}
                            className="text-neutral-500 hover:text-red-400 transition-colors duration-200 ml-0.5">
                            <X size={12} strokeWidth={1.5} />
                          </button>
                        )}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {status === 'error' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm">
              <AlertTriangle size={16} strokeWidth={1.5} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-white">{error}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className={`border-2 transition-colors duration-200 ${isBlocking ? 'border-red-500/30' : 'border-[#2a2a2a]'}`}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <motion.div
                animate={isBlocking ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-16 h-16 rounded-full flex items-center justify-center ${isBlocking ? 'bg-red-500/10' : 'bg-[#1a1a1a]'}`}>
                {isLoading ? <Loader2 size={28} strokeWidth={1.5} className="text-[var(--accent)] animate-spin" />
                  : isBlocking ? <Shield size={28} strokeWidth={1.5} className="text-red-400" />
                  : <ShieldOff size={28} strokeWidth={1.5} className="text-neutral-500" />}
              </motion.div>

              <div>
                <p className="font-medium text-white">
                  {isLoading ? 'Working...' : isBlocking ? 'Blocking Active' : 'Not Blocking'}
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  {isBlocking ? `${domains.length} site${domains.length !== 1 ? 's' : ''} blocked` : 'All sites accessible'}
                </p>
              </div>

              {isBlocking ? (
                <Button variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleUnblock} disabled={isLoading}>
                  {isLoading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin mr-2" /> : <ShieldOff size={16} strokeWidth={1.5} className="mr-2" />}
                  Stop Blocking
                </Button>
              ) : (
                <Button className="w-full" onClick={handleBlock}
                  disabled={domains.length === 0 || isLoading || isAdmin === false}>
                  {isLoading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin mr-2" /> : <Shield size={16} strokeWidth={1.5} className="mr-2" />}
                  Start Blocking
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              {['Blocks at the Windows Firewall level','Works across all browsers & apps','Persists after closing the app','Restores automatically on login'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-neutral-400">
                  <CheckCircle2 size={14} strokeWidth={1.5} className="text-[var(--accent-lighter)] shrink-0" />{t}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {editingCat !== null && (
          <CategoryModal
            category={editingCat === 'new' ? null : editingCat}
            onSave={handleSaveCategory}
            onClose={() => setEditingCat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
