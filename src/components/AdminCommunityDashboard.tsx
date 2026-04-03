import React, { useState, useEffect } from 'react';
import { OptimizedImage } from './OptimizedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
    Users, MessageSquare, FileText, Heart, Eye,
    Trash2, ShieldAlert, CheckCircle, Search,
    Filter, MoreVertical, Ban, RefreshCcw,
    TrendingUp, ExternalLink, ChevronRight, AlertTriangle, Layout, Plus, Edit3, Navigation, XCircle, Bug
} from 'lucide-react';
import { dbService } from '../dbService';
import { CommunityPost, User, BugReport } from '../types';

interface Stats {
    totalPosts: number;
    totalComments: number;
    totalUsers: number;
    totalLikes: number;
    totalViews: number;
}

export const AdminCommunityDashboard: React.FC<{
    isDark: boolean;
    onClose: () => void;
    t: any;
}> = ({ isDark, onClose, t }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'posts' | 'comments' | 'users' | 'reports' | 'sections' | 'bugs'>('stats');
    const [stats, setStats] = useState<Stats | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'stats') {
                const s = await dbService.adminGetCommunityStats();
                setStats(s);
            } else if (activeTab === 'posts') {
                const p = await dbService.adminGetAllPosts();
                setPosts(p);
            } else if (activeTab === 'comments') {
                const c = await dbService.adminGetAllComments();
                setComments(c);
            } else if (activeTab === 'users') {
                const u = await dbService.adminGetAllUsers();
                setUsers(u);
            } else if (activeTab === 'reports') {
                const r = await dbService.adminGetAllReports();
                setReports(r);
            } else if (activeTab === 'sections') {
                const s = await dbService.getRemoteSections();
                setSections(s);
            } else if (activeTab === 'bugs') {
                const b = await dbService.adminGetAllBugReports();
                setBugReports(b);
            }
        } catch (err) {
            console.error('Admin load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('Supprimer définitivement ce post ?')) return;
        const ok = await dbService.adminDeletePost(id);
        if (ok) setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handleDeleteComment = async (id: string) => {
        if (!window.confirm('Supprimer ce commentaire ?')) return;
        const ok = await dbService.adminDeleteComment(id);
        if (ok) setComments(prev => prev.filter(c => c.id !== id));
    };

    const handleToggleBan = async (user: User) => {
        const confirmMsg = `Voulez-vous vraiment changer le statut de ${user.name} ?`;
        if (!window.confirm(confirmMsg)) return;
        await dbService.adminToggleUserBan(user.id, !user.banned);
        loadData(); // Reload users
    };

    const renderStats = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon={<FileText className="text-blue-500" />} label="Publications" value={stats?.totalPosts || 0} trend="+12%" isDark={isDark} />
                <StatCard icon={<MessageSquare className="text-emerald-500" />} label="Commentaires" value={stats?.totalComments || 0} trend="+5%" isDark={isDark} />
                <StatCard icon={<Users className="text-purple-500" />} label="Membres" value={stats?.totalUsers || 0} trend="+24%" isDark={isDark} />
                <StatCard icon={<Heart className="text-rose-500" />} label="Interactions" value={stats?.totalLikes || 0} trend="+18%" isDark={isDark} />
            </div>

            <div className={`p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-stone-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>Visibilité totale</h3>
                    <TrendingUp size={20} className="text-[#fb5607]" />
                </div>
                <div className="flex items-end gap-3">
                    <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{stats?.totalViews.toLocaleString()}</span>
                    <span className="text-[14px] font-bold text-[#fb5607] mb-1.5 flex items-center gap-1">Vues cumulées <Eye size={16} /></span>
                </div>
            </div>

            <div className={`p-4 rounded-3xl ${isDark ? 'bg-white/5' : 'bg-orange-50'}`}>
                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-white/40' : 'text-orange-800/60'}`}>
                    Note: Ces statistiques sont calculées en temps réel à partir de la base de données de production d'AfroCuisto.
                </p>
            </div>
        </div>
    );

    const renderPostsList = () => (
        <div className="space-y-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Rechercher un post..." />
            {loading ? <Loader isDark={isDark} /> : (
                <div className="space-y-3">
                    {posts.filter(p => !searchQuery || p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.author_name.toLowerCase().includes(searchQuery.toLowerCase())).map(post => (
                        <div
                            key={post.id}
                            onClick={() => setSelectedItem(post)}
                            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}
                        >
                            {post.image_url ? (
                                <OptimizedImage src={post.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                            ) : (
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/10' : 'bg-stone-100'}`}>
                                    <FileText size={20} className="text-stone-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-bold truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>{post.author_name}</p>
                                <p className={`text-[11px] truncate ${isDark ? 'text-white/40' : 'text-stone-500'}`}>{post.content || post.title}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100/50 text-[10px] font-bold text-stone-400">
                                    <Heart size={10} /> {post.likes_count}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Post Detail Overlay */}
            <AnimatePresence>
                {selectedItem && activeTab === 'posts' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed inset-6 z-[1100] p-6 rounded-[32px] border flex flex-col shadow-2xl ${isDark ? 'bg-stone-900 border-white/10' : 'bg-white border-stone-100'}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`font-black uppercase tracking-widest text-xs ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Détails de la publication</h3>
                            <button onClick={() => setSelectedItem(null)} className="p-2 rounded-full bg-stone-100 text-stone-500"><XCircle size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden">
                                    {false && selectedItem.author_avatar ? <OptimizedImage src={selectedItem.author_avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-stone-400">{(selectedItem.author_name || 'U').charAt(0)}</div>}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-stone-800'}`}>{selectedItem.author_name}</p>
                                    <p className="text-[10px] text-stone-400 uppercase font-bold">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {selectedItem.image_url && <OptimizedImage src={selectedItem.image_url} className="w-full aspect-video rounded-2xl object-cover" />}
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-600'}`}>{selectedItem.content}</p>
                        </div>
                        <div className="pt-6 border-t border-stone-100 mt-auto flex gap-3">
                            <button onClick={() => { handleDeletePost(selectedItem.id); setSelectedItem(null); }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Supprimer le post</button>
                            <button onClick={() => setSelectedItem(null)} className="px-6 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-xs uppercase tracking-widest">Fermer</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderCommentsList = () => (
        <div className="space-y-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Rechercher un commentaire..." />
            {loading ? <Loader isDark={isDark} /> : (
                <div className="space-y-3">
                    {comments.filter(c => !searchQuery || c.content.toLowerCase().includes(searchQuery.toLowerCase())).map(comment => (
                        <div key={comment.id} className={`p-3 rounded-2xl border flex flex-col gap-2 ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-stone-100 overflow-hidden text-[8px] flex items-center justify-center font-bold">
                                        {false && comment.author_avatar ? <OptimizedImage src={comment.author_avatar} /> : (comment.author_name || 'U').charAt(0)}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase ${isDark ? 'text-white/30' : 'text-stone-400'}`}>{comment.author_name}</span>
                                </div>
                                <button onClick={() => handleDeleteComment(comment.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className={`text-[12px] font-medium leading-tight ${isDark ? 'text-white/80' : 'text-stone-600'}`}>{comment.content}</p>
                            <div className={`mt-1 py-1 px-2 rounded-lg text-[9px] font-bold inline-block w-fit ${isDark ? 'bg-white/5 text-white/30' : 'bg-stone-50 text-stone-400'}`}>
                                Sur: {comment.post_title}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderUsersList = () => (
        <div className="space-y-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Rechercher un membre..." />
            {loading ? <Loader isDark={isDark} /> : (
                <div className="space-y-3">
                    {users.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                        <div key={user.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-700'}`}>
                                {false && user.avatar ? <OptimizedImage src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-[13px] font-bold truncate ${isDark ? 'text-white' : 'text-stone-800'}`}>{user.name}</p>
                                    {user.is_admin && <span className="bg-[#fb5607] text-[8px] text-white px-1.5 py-0.5 rounded-full font-black uppercase">Admin</span>}
                                </div>
                                <p className={`text-[11px] truncate ${isDark ? 'text-white/30' : 'text-stone-500'}`}>{user.email}</p>
                            </div>
                            <button onClick={() => handleToggleBan(user)} className={`p-2.5 rounded-xl transition-colors ${user.banned ? 'text-rose-500 bg-rose-50 border-rose-100' : isDark ? 'text-white/20 hover:text-rose-500' : 'text-stone-300 hover:text-rose-500'}`}>
                                <Ban size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReportsList = () => (
        <div className="space-y-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Filtrer les signalements..." />
            {loading ? <Loader isDark={isDark} /> : (
                <div className="space-y-3">
                    {reports.filter(r => !searchQuery || r.post?.content?.toLowerCase().includes(searchQuery.toLowerCase()) || r.reason?.toLowerCase().includes(searchQuery.toLowerCase())).map(report => (
                        <div key={report.id} className={`p-4 rounded-3xl border flex flex-col gap-3 ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                        <AlertTriangle size={16} />
                                    </div>
                                    <div>
                                        <p className={`text-[12px] font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>Signalé par {report.reporter?.name}</p>
                                        <p className="text-[10px] text-stone-400 font-bold uppercase">{new Date(report.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { if (window.confirm('Ignorer ce signalement ?')) dbService.adminDeleteReport(report.id).then(() => setReports(prev => prev.filter(req => req.id !== report.id))); }}
                                    className="p-2 rounded-xl text-stone-400 hover:text-stone-600 transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            </div>
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-stone-50'} border border-transparent hover:border-rose-200 transition-colors`}>
                                <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-white/20' : 'text-stone-400'}`}>Motif</p>
                                <p className={`text-[13px] font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{report.reason}</p>
                            </div>
                            <div className={`p-3 rounded-2xl border ${isDark ? 'border-white/5 bg-white/5' : 'border-stone-100 bg-white'}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-white/20' : 'text-stone-400'}`}>Contenu du post</p>
                                <p className={`text-[12px] line-clamp-3 ${isDark ? 'text-white/60' : 'text-stone-600'}`}>{report.post?.content}</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[9px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Auteur: {report.post?.author_name}</span>
                                    <button
                                        onClick={() => { if (window.confirm('Supprimer ce post signalé ?')) dbService.adminDeletePost(report.post_id).then(() => { dbService.adminDeleteReport(report.id); setReports(prev => prev.filter(req => req.id !== report.id)); }); }}
                                        className="text-rose-600 font-black text-[10px] uppercase tracking-wider"
                                    >
                                        Supprimer le Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="py-20 text-center opacity-30"><AlertTriangle size={48} className="mx-auto mb-4" /><p className="font-bold">Aucun signalement en attente</p></div>}
                </div>
            )}
        </div>
    );

    const [editingSection, setEditingSection] = React.useState<any | null>(null);
    const [editForm, setEditForm] = React.useState<{ auto_scroll: boolean; scroll_interval: number }>({ auto_scroll: false, scroll_interval: 4 });
    const [saving, setSaving] = React.useState(false);

    const openEdit = (section: any) => {
        const cfg = section.config || {};
        const rawAutoScroll = cfg.auto_scroll ?? cfg.autoScroll ?? cfg.autoscroll ?? cfg.autoplay;
        const rawInterval = cfg.scroll_interval ?? cfg.scrollInterval ?? cfg.interval ?? cfg.autoplay_interval;
        setEditForm({
            auto_scroll: !!(rawAutoScroll === true || rawAutoScroll === 'true' || rawAutoScroll === 1 || rawAutoScroll === '1'),
            scroll_interval: Math.round((Math.max(1500, Number(rawInterval) || 4000)) / 1000)
        });
        setEditingSection(section);
    };

    const saveSection = async () => {
        if (!editingSection) return;
        setSaving(true);
        const newConfig = {
            ...editingSection.config,
            autoplay: editForm.auto_scroll,
            autoplay_interval: editForm.scroll_interval * 1000,
            // also write normalized keys for compatibility
            auto_scroll: editForm.auto_scroll,
            scroll_interval: editForm.scroll_interval * 1000
        };
        const ok = await dbService.adminUpdateSection(editingSection.id, { config: newConfig });
        if (ok) {
            setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, config: newConfig } : s));
            setEditingSection(null);
        }
        setSaving(false);
    };

    const renderSectionsList = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Filtrer les sections..." />
                <button className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform">
                    <Plus size={20} />
                </button>
            </div>
            {loading ? <Loader isDark={isDark} /> : (
                <div className="space-y-4">
                    {sections.filter(s => !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase())).map(section => {
                        const cfg = section.config || {};
                        const autoScrollOn = !!(cfg.autoplay === true || cfg.auto_scroll === true || cfg.autoplay === 'true' || cfg.auto_scroll === 'true' || cfg.autoplay === 1 || cfg.auto_scroll === 1);
                        const intervalSec = Math.round(Math.max(1500, Number(cfg.autoplay_interval ?? cfg.scroll_interval ?? 4000)) / 1000);

                        return (
                            <div key={section.id} className={`p-4 rounded-[28px] border transition-all ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-black text-[15px] ${isDark ? 'text-white' : 'text-stone-900'}`}>{section.title || "Sans titre"}</h4>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${section.config?.page === 'home' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{section.config?.page}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{section.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(section)} className="p-2.5 bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100 transition-colors"><Edit3 size={18} /></button>
                                        <button onClick={() => { if (window.confirm('Supprimer cette section ?')) dbService.adminDeleteSection(section.id).then(() => setSections(prev => prev.filter(s => s.id !== section.id))); }} className="p-2.5 bg-rose-50 rounded-xl text-rose-300 hover:text-rose-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>

                                {/* Auto-scroll indicator badge */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${autoScrollOn ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${autoScrollOn ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                                        {autoScrollOn ? `Défilement auto • ${intervalSec}s` : 'Défilement auto: désactivé'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Section Edit Modal */}
            <AnimatePresence>
                {editingSection && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`fixed inset-6 z-[1100] p-6 rounded-[32px] border flex flex-col shadow-2xl ${isDark ? 'bg-stone-900 border-white/10' : 'bg-white border-stone-100'}`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-stone-900'}`}>{editingSection.title || 'Section'}</h3>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDark ? 'text-white/30' : 'text-stone-400'}`}>Configuration du carrousel</p>
                            </div>
                            <button onClick={() => setEditingSection(null)} className="p-2 rounded-full bg-stone-100 text-stone-500"><XCircle size={18} /></button>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                            {/* Auto-scroll toggle */}
                            <div className={`p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-100'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`font-black text-[14px] ${isDark ? 'text-white' : 'text-stone-800'}`}>Défilement automatique</p>
                                        <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Les cartes défilent automatiquement</p>
                                    </div>
                                    <button
                                        onClick={() => setEditForm(f => ({ ...f, auto_scroll: !f.auto_scroll }))}
                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${editForm.auto_scroll ? 'bg-emerald-500' : isDark ? 'bg-white/20' : 'bg-stone-200'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${editForm.auto_scroll ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Scroll interval */}
                            <div className={`p-5 rounded-3xl border transition-all ${editForm.auto_scroll ? '' : 'opacity-40 pointer-events-none'} ${isDark ? 'bg-white/5 border-white/10' : 'bg-stone-50 border-stone-100'}`}>
                                <p className={`font-black text-[14px] mb-1 ${isDark ? 'text-white' : 'text-stone-800'}`}>Intervalle de défilement</p>
                                <p className={`text-[11px] font-medium mb-4 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Durée entre chaque carte (secondes)</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setEditForm(f => ({ ...f, scroll_interval: Math.max(2, f.scroll_interval - 1) }))} className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black ${isDark ? 'bg-white/10 text-white' : 'bg-stone-200 text-stone-700'}`}>−</button>
                                    <div className="flex-1 text-center">
                                        <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{editForm.scroll_interval}</span>
                                        <span className={`text-sm font-bold ml-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>sec</span>
                                    </div>
                                    <button onClick={() => setEditForm(f => ({ ...f, scroll_interval: Math.min(30, f.scroll_interval + 1) }))} className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-black ${isDark ? 'bg-white/10 text-white' : 'bg-stone-200 text-stone-700'}`}>+</button>
                                </div>
                                {/* Visual speed indicator */}
                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                    {[{ label: 'Rapide', val: 2 }, { label: 'Normal', val: 4 }, { label: 'Lent', val: 8 }].map(preset => (
                                        <button key={preset.label} onClick={() => setEditForm(f => ({ ...f, scroll_interval: preset.val }))}
                                            className={`py-2 rounded-xl text-[11px] font-black transition-all ${editForm.scroll_interval === preset.val ? 'bg-[#ff6d00] text-white' : isDark ? 'bg-white/10 text-white/50' : 'bg-stone-100 text-stone-500'}`}>
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-5 mt-auto flex gap-3">
                            <button onClick={saveSection} disabled={saving} className="flex-1 py-4 bg-[#ff6d00] text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50">
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <button onClick={() => setEditingSection(null)} className={`px-6 py-4 rounded-2xl font-black text-sm ${isDark ? 'bg-white/10 text-white/60' : 'bg-stone-100 text-stone-500'}`}>Annuler</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const severityColor = (s: string) => {
        if (s === 'Bloquant') return 'bg-rose-500/10 text-rose-600 border-rose-200';
        if (s === 'Majeur')   return 'bg-amber-500/10 text-amber-600 border-amber-200';
        if (s === 'Mineur')   return 'bg-blue-500/10 text-blue-600 border-blue-200';
        return 'bg-stone-100 text-stone-500 border-stone-200';
    };

    const statusColor = (s: string) => {
        if (s === 'Résolu')   return 'bg-emerald-500/10 text-emerald-700';
        if (s === 'En cours') return 'bg-blue-500/10 text-blue-700';
        if (s === 'Fermé')    return 'bg-stone-100 text-stone-400';
        return 'bg-amber-500/10 text-amber-700';
    };

    const renderBugsList = () => (
        <div className="space-y-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} isDark={isDark} placeholder="Rechercher un bug..." />
            {loading ? <Loader isDark={isDark} /> : (
                bugReports.length === 0 ? (
                    <div className="py-24 text-center opacity-30">
                        <Bug size={48} className="mx-auto mb-4" />
                        <p className="font-bold text-sm">Aucun bug signalé 🎉</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bugReports
                            .filter(b => !searchQuery ||
                                b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.category.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(bug => (
                                <div key={bug.id} className={`p-5 rounded-[28px] border flex flex-col gap-3 ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${severityColor(bug.severity)}`}>{bug.severity}</span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor(bug.status)}`}>{bug.status}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-white/30' : 'bg-stone-100 text-stone-400'}`}>{bug.category}</span>
                                            </div>
                                            <h4 className={`font-black text-[14px] leading-snug ${isDark ? 'text-white' : 'text-stone-800'}`}>{bug.title}</h4>
                                        </div>
                                        <button
                                            onClick={() => dbService.adminDeleteBugReport(bug.id).then(ok => ok && setBugReports(prev => prev.filter(b => b.id !== bug.id)))}
                                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 transition-colors flex-shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Reporter */}
                                    <div className={`flex items-center gap-2 text-[11px] font-bold ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                            {bug.user_name.charAt(0)}
                                        </div>
                                        {bug.user_name} · {bug.user_email} · {new Date(bug.created_at).toLocaleDateString('fr-FR')}
                                    </div>

                                    {/* Description */}
                                    <p className={`text-[12px] leading-relaxed ${isDark ? 'text-white/60' : 'text-stone-600'}`}>{bug.description}</p>

                                    {/* Steps */}
                                    {bug.steps_to_reproduce && (
                                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-black/30' : 'bg-stone-50'}`}>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${isDark ? 'text-white/20' : 'text-stone-400'}`}>Étapes de reproduction</p>
                                            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-white/50' : 'text-stone-500'}`}>{bug.steps_to_reproduce}</p>
                                        </div>
                                    )}

                                    {/* Device info */}
                                    {bug.device_info && (
                                        <p className={`text-[10px] font-mono ${isDark ? 'text-white/20' : 'text-stone-300'}`}>📱 {bug.device_info}</p>
                                    )}

                                    {/* Status change */}
                                    <div className="flex gap-2 flex-wrap pt-1">
                                        {(['Nouveau', 'En cours', 'Résolu', 'Fermé'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => dbService.adminUpdateBugStatus(bug.id, s).then(ok => ok && setBugReports(prev => prev.map(b => b.id === bug.id ? { ...b, status: s } : b)))}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all active:scale-95 ${
                                                    bug.status === s
                                                        ? 'bg-[#fb5607] text-white shadow-md shadow-[#fb5607]/30'
                                                        : isDark ? 'bg-white/5 text-white/30 hover:bg-white/10' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed inset-0 z-[1000] flex flex-col ${isDark ? 'bg-black' : 'bg-[#f7f7f5]'}`}
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            <div className={`flex items-center justify-between px-6 py-5 border-b sticky top-0 z-10 ${isDark ? 'bg-black/80 backdrop-blur-xl border-white/8' : 'bg-white/90 backdrop-blur-xl border-stone-100 shadow-sm'}`}>
                <div className="flex flex-col">
                    <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>Administration</h1>
                    <span className="text-[10px] font-bold text-[#fb5607] uppercase tracking-widest">AfroCuisto Cockpit</span>
                </div>
                <button
                    onClick={onClose}
                    className={`p-2.5 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-white/5 text-white/50' : 'bg-stone-100 text-stone-500'}`}
                >
                    Fermer
                </button>
            </div>

            <div className={`flex gap-3 px-6 py-4 overflow-x-auto no-scrollbar scroll-smooth ${isDark ? 'bg-black' : 'bg-[#f7f7f5]'}`}>
                <TabBtn id="stats" label="Tableau" icon={<TrendingUp size={16} />} active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} isDark={isDark} />
                <TabBtn id="posts" label="Flux" icon={<FileText size={16} />} active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} isDark={isDark} />
                <TabBtn id="comments" label="Comms" icon={<MessageSquare size={16} />} active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} isDark={isDark} />
                <TabBtn id="users" label="Membres" icon={<Users size={16} />} active={activeTab === 'users'} onClick={() => setActiveTab('users')} isDark={isDark} />
                <TabBtn id="reports" label="Signaux" icon={<AlertTriangle size={16} />} active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} isDark={isDark} />
                <TabBtn id="bugs" label="Bugs" icon={<Bug size={16} />} active={activeTab === 'bugs'} onClick={() => setActiveTab('bugs')} isDark={isDark} />
                <TabBtn id="sections" label="Sections" icon={<Layout size={16} />} active={activeTab === 'sections'} onClick={() => setActiveTab('sections')} isDark={isDark} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar">
                {activeTab === 'stats' && renderStats()}
                {activeTab === 'posts' && renderPostsList()}
                {activeTab === 'comments' && renderCommentsList()}
                {activeTab === 'users' && renderUsersList()}
                {activeTab === 'reports' && renderReportsList()}
                {activeTab === 'bugs' && renderBugsList()}
                {activeTab === 'sections' && renderSectionsList()}
            </div>

            <div className={`absolute bottom-6 left-6 right-6 p-4 rounded-3xl flex items-center justify-between backdrop-blur-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-white/20 shadow-2xl shadow-black/5'}`}>
                <div className="flex items-center gap-3">
                    <RefreshCcw size={18} className={`text-[#fb5607] ${loading ? 'animate-spin' : ''}`} onClick={loadData} />
                    <p className={`text-[11px] font-bold ${isDark ? 'text-white/40' : 'text-stone-500'}`}>Système opérationnel</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse`} />
            </div>
        </motion.div>
    );
};

const StatCard = ({ icon, label, value, trend, isDark }: any) => (
    <div className={`p-4 rounded-3xl border transition-all ${isDark ? 'bg-white/5 border-white/8' : 'bg-white border-stone-100 shadow-sm'}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#fb5607]/10 to-[#fb5607]/5 flex items-center justify-center mb-3">
            {icon}
        </div>
        <p className={`text-[11px] font-bold ${isDark ? 'text-white/30' : 'text-stone-400'}`}>{label}</p>
        <div className="flex items-center gap-2 mt-1">
            <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-stone-900'}`}>{value}</span>
            <span className="text-[10px] font-black text-emerald-500">{trend}</span>
        </div>
    </div>
);

const TabBtn = ({ label, icon, active, onClick, isDark }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold transition-all shrink-0 active:scale-95 ${active
            ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/30 scale-105'
            : isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 shadow-sm'
            }`}
    >
        {icon}
        {label}
    </button>
);

const SearchBar = ({ value, onChange, isDark, placeholder }: any) => (
    <div className="relative group">
        <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-[#fb5607]`} />
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full py-3.5 pl-11 pr-4 rounded-2xl border text-[13px] outline-none transition-all ${isDark ? 'bg-white/5 border-white/8 text-white focus:border-[#fb5607]/50' : 'bg-white border-stone-100 shadow-sm focus:border-[#fb5607]/50'}`}
        />
    </div>
);

const Loader = ({ isDark }: any) => (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#fb5607]/20 border-t-[#fb5607] animate-spin" />
        <p className={`text-[10px] uppercase font-black tracking-widest ${isDark ? 'text-white/20' : 'text-stone-300'}`}>Synchro cloud...</p>
    </div>
);
