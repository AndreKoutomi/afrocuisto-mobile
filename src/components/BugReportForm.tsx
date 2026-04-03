import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, ChevronDown, Send, CheckCircle2, Loader2, XCircle, AlertCircle, Smartphone, Tag } from 'lucide-react';
import { dbService } from '../dbService';
import { BugSeverity, BugCategory } from '../types';
import { Capacitor } from '@capacitor/core';

interface BugReportFormProps {
  currentUser: any;
  isDark: boolean;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SEVERITIES: { value: BugSeverity; label: string; color: string; desc: string }[] = [
  { value: 'Bloquant',   label: '🔴 Bloquant',   color: 'border-rose-400 bg-rose-50 text-rose-700',    desc: "L'app plante ou est inutilisable" },
  { value: 'Majeur',     label: '🟠 Majeur',      color: 'border-amber-400 bg-amber-50 text-amber-700', desc: 'Fonctionnalité importante cassée' },
  { value: 'Mineur',     label: '🔵 Mineur',      color: 'border-blue-400 bg-blue-50 text-blue-700',    desc: 'Problème gênant mais contournable' },
  { value: 'Cosmétique', label: '⚪ Cosmétique',  color: 'border-stone-300 bg-stone-50 text-stone-600', desc: 'Problème visuel sans impact' },
];

const CATEGORIES: BugCategory[] = [
  'Interface', 'Connexion', 'Recettes', 'Communauté', 'Panier', 'Notifications', 'Performance', 'Autre'
];

const getDeviceInfo = (): string => {
  const platform = Capacitor.getPlatform();
  const ua = navigator.userAgent;
  if (platform === 'android') return `Android · App v1.0.1`;
  if (platform === 'ios') return `iOS · App v1.0.1`;
  return `Web · ${ua.substring(0, 60)}`;
};

export const BugReportForm: React.FC<BugReportFormProps> = ({ currentUser, isDark, showAlert }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    steps_to_reproduce: '',
    severity: '' as BugSeverity | '',
    category: '' as BugCategory | '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = form.title.trim().length >= 5 &&
    form.description.trim().length >= 10 &&
    form.severity !== '' &&
    form.category !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    const result = await dbService.submitBugReport({
      user_id: currentUser?.id,
      user_name: currentUser?.name || 'Anonyme',
      user_email: currentUser?.email || 'N/A',
      title: form.title.trim(),
      description: form.description.trim(),
      steps_to_reproduce: form.steps_to_reproduce.trim() || undefined,
      severity: form.severity as BugSeverity,
      category: form.category as BugCategory,
      device_info: getDeviceInfo(),
      app_version: '1.0.1',
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      showAlert('Erreur lors de l\'envoi du rapport. Réessayez.', 'error');
    }
  };

  const handleReset = () => {
    setForm({ title: '', description: '', steps_to_reproduce: '', severity: '', category: '' });
    setSubmitted(false);
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-stone-800'}`}>
          Rapport envoyé !
        </h3>
        <p className={`text-sm leading-relaxed max-w-[260px] mb-8 ${isDark ? 'text-white/50' : 'text-stone-400'}`}>
          Merci ! Notre équipe va analyser votre signalement et vous tiendra informé(e) des corrections.
        </p>
        <button
          onClick={handleReset}
          className="px-8 py-4 bg-[#fb5607] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#fb5607]/30 active:scale-95 transition-all"
        >
          Signaler un autre bug
        </button>
      </motion.div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header card */}
      <div className={`flex items-center gap-4 p-5 rounded-3xl border ${isDark ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-100'}`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <Bug size={24} className="text-rose-500" />
        </div>
        <div>
          <h3 className={`font-black text-[15px] ${isDark ? 'text-white' : 'text-stone-800'}`}>
            Signaler un bug
          </h3>
          <p className={`text-[12px] leading-relaxed mt-0.5 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
            Votre rapport nous aide à améliorer AfroCuisto pour tout le monde.
          </p>
        </div>
      </div>

      {/* Device info badge */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
        <Smartphone size={14} className={isDark ? 'text-white/30' : 'text-stone-400'} />
        <span className={`text-[11px] font-mono ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
          {getDeviceInfo()}
        </span>
      </div>

      {/* Severity selector */}
      <div>
        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
          Gravité du bug <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SEVERITIES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, severity: s.value }))}
              className={`p-3 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                form.severity === s.value
                  ? s.color + ' shadow-md'
                  : isDark ? 'border-white/10 bg-white/5 text-white/50' : 'border-stone-100 bg-white text-stone-500'
              }`}
            >
              <p className="text-[13px] font-black">{s.label}</p>
              <p className={`text-[10px] leading-tight mt-0.5 ${form.severity === s.value ? 'opacity-70' : 'opacity-50'}`}>{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className={`text-[10px] font-black uppercase tracking-widest mb-3 block ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
          Catégorie <span className="text-rose-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm(f => ({ ...f, category: cat }))}
              className={`px-4 py-2 rounded-full text-[12px] font-black transition-all active:scale-95 border ${
                form.category === cat
                  ? 'bg-[#fb5607] text-white border-[#fb5607] shadow-md shadow-[#fb5607]/30'
                  : isDark ? 'border-white/10 bg-white/5 text-white/40' : 'border-stone-200 bg-white text-stone-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
          Titre du bug <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Ex : Le bouton Partager ne fonctionne pas"
          maxLength={120}
          className={`w-full py-3.5 px-5 rounded-2xl border text-[14px] font-medium outline-none transition-all focus:ring-2 focus:ring-[#fb5607]/20 ${
            isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/40' : 'bg-white border-stone-200 text-stone-800 placeholder:text-stone-300 focus:border-[#fb5607]/40'
          }`}
        />
      </div>

      {/* Description */}
      <div>
        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
          Description détaillée <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Décrivez precisément ce qui se passe et ce que vous attendiez..."
          rows={4}
          maxLength={1000}
          className={`w-full py-3.5 px-5 rounded-2xl border text-[14px] font-medium outline-none transition-all focus:ring-2 focus:ring-[#fb5607]/20 resize-none leading-relaxed ${
            isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/40' : 'bg-white border-stone-200 text-stone-800 placeholder:text-stone-300 focus:border-[#fb5607]/40'
          }`}
        />
        <p className={`text-[10px] text-right mt-1 ${isDark ? 'text-white/20' : 'text-stone-300'}`}>{form.description.length}/1000</p>
      </div>

      {/* Steps to reproduce (optional) */}
      <div>
        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
          Étapes pour reproduire <span className="opacity-50">(optionnel)</span>
        </label>
        <textarea
          value={form.steps_to_reproduce}
          onChange={e => setForm(f => ({ ...f, steps_to_reproduce: e.target.value }))}
          placeholder={"1. Aller sur l'onglet Recettes\n2. Appuyer sur Partager\n3. L'app se ferme"}
          rows={3}
          maxLength={500}
          className={`w-full py-3.5 px-5 rounded-2xl border text-[13px] font-medium outline-none transition-all focus:ring-2 focus:ring-[#fb5607]/20 resize-none leading-relaxed ${
            isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#fb5607]/40' : 'bg-white border-stone-200 text-stone-800 placeholder:text-stone-300 focus:border-[#fb5607]/40'
          }`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
          isValid && !isSubmitting
            ? 'bg-[#fb5607] text-white shadow-xl shadow-[#fb5607]/30'
            : isDark ? 'bg-white/5 text-white/20' : 'bg-stone-100 text-stone-300'
        }`}
      >
        {isSubmitting ? (
          <><Loader2 size={18} className="animate-spin" /> Envoi en cours...</>
        ) : (
          <><Send size={18} /> Envoyer le rapport</>
        )}
      </button>
    </form>
  );
};
