/**
 * ============================================================================
 * GESTION DE LA COMMUNAUTÉ - AFROCUISTO ADMIN
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import {
    MessageSquare, Heart, Eye, Trash2, ShieldAlert,
    Search, RefreshCw, User, TrendingUp, Image, Calendar
} from 'lucide-react';

interface CommunityPost {
    id: string;
    user_id: string;
    title: string;
    content: string;
    image_url: string;
    category: string;
    likes_count: number;
    comments_count: number;
    views_count: number;
    created_at: string;
    author_name?: string;
    author_avatar?: string;
    author_email?: string;
}

interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    author_name?: string;
}

export function Community() {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'moderation'>('posts');
    const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'posts' || activeTab === 'moderation') {
                // 1. Récupère les posts sans jointure (robuste même sans FK)
                const { data: postsData, error: postsErr } = await supabaseAdmin
                    .from('community_posts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (postsErr) throw postsErr;

                // 2. Récupère les profils des auteurs séparément
                const userIds = [...new Set((postsData || []).map((p: any) => p.user_id).filter(Boolean))];
                let profilesMap: Record<string, { name: string; avatar?: string; email?: string }> = {};

                if (userIds.length > 0) {
                    const { data: profiles } = await supabaseAdmin
                        .from('user_profiles')
                        .select('id, name, avatar, email')
                        .in('id', userIds);
                    if (profiles) {
                        profiles.forEach((p: any) => { profilesMap[p.id] = { name: p.name, avatar: p.avatar, email: p.email }; });
                    }
                }

                // 3. Fusionne
                const enrichedPosts: CommunityPost[] = (postsData || []).map((p: any) => ({
                    ...p,
                    author_name: profilesMap[p.user_id]?.name || 'Utilisateur',
                    author_avatar: profilesMap[p.user_id]?.avatar,
                    author_email: profilesMap[p.user_id]?.email,
                }));

                setPosts(enrichedPosts);

                const s = enrichedPosts.reduce((acc, p) => ({
                    totalPosts: acc.totalPosts + 1,
                    totalLikes: acc.totalLikes + (p.likes_count || 0),
                    totalComments: acc.totalComments + (p.comments_count || 0),
                    totalViews: acc.totalViews + (p.views_count || 0)
                }), { totalPosts: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
                setStats(s);

            } else if (activeTab === 'comments') {
                const { data: commentsData, error: commentsErr } = await supabaseAdmin
                    .from('post_comments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (commentsErr) throw commentsErr;

                const userIds = [...new Set((commentsData || []).map((c: any) => c.user_id).filter(Boolean))];
                let profilesMap: Record<string, string> = {};

                if (userIds.length > 0) {
                    const { data: profiles } = await supabaseAdmin
                        .from('user_profiles')
                        .select('id, name')
                        .in('id', userIds);
                    if (profiles) {
                        profiles.forEach((p: any) => { profilesMap[p.id] = p.name; });
                    }
                }

                const enrichedComments: PostComment[] = (commentsData || []).map((c: any) => ({
                    ...c,
                    author_name: profilesMap[c.user_id] || 'Utilisateur',
                }));
                setComments(enrichedComments);
            }
        } catch (err: any) {
            console.error('Erreur communauté:', err);
            setError(err.message || 'Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const deletePost = async (id: string) => {
        if (!confirm('Souhaitez-vous vraiment supprimer ce post ? Cette action est irréversible.')) return;
        const { error } = await supabaseAdmin.from('community_posts').delete().eq('id', id);
        if (error) { alert('Erreur: ' + error.message); return; }
        setPosts(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
    };

    const deleteComment = async (id: string) => {
        if (!confirm('Supprimer ce commentaire ?')) return;
        const { error } = await supabaseAdmin.from('post_comments').delete().eq('id', id);
        if (error) { alert('Erreur: ' + error.message); return; }
        setComments(prev => prev.filter(c => c.id !== id));
    };

    const filteredPosts = posts.filter(p =>
        !search ||
        p.content?.toLowerCase().includes(search.toLowerCase()) ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.author_name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredComments = comments.filter(c =>
        !search || c.content?.toLowerCase().includes(search.toLowerCase()) || c.author_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ width: '100%', animation: 'fadeIn 0.5s' }}>
            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                <StatCard label="Total Posts" value={stats.totalPosts} icon={<MessageSquare size={20} />} color="#fb5607" />
                <StatCard label="Total Likes" value={stats.totalLikes} icon={<Heart size={20} />} color="#ef4444" />
                <StatCard label="Commentaires" value={stats.totalComments} icon={<TrendingUp size={20} />} color="#7c3aed" />
                <StatCard label="Vues Totales" value={stats.totalViews} icon={<Eye size={20} />} color="#0891b2" />
            </div>

            {/* ── Barre d'outils ── */}
            <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', marginBottom: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <TabButton active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} label="Flux de Posts" />
                    <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} label="Commentaires" />
                    <TabButton active={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} label="Modération" />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            style={{ padding: '10px 16px 10px 36px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', width: '250px', outline: 'none' }}
                        />
                    </div>
                    <button onClick={fetchData} style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Message d'erreur ── */}
            {error && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', color: '#dc2626', fontSize: '14px', fontWeight: 600 }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── Contenu ── */}
            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center', color: '#9ca3af' }}>
                    <RefreshCw className="animate-spin" size={40} style={{ marginBottom: '16px' }} />
                    <p>Chargement des données...</p>
                </div>
            ) : (
                <div>
                    {/* POSTS */}
                    {(activeTab === 'posts') && (
                        <>
                            {filteredPosts.length === 0 ? (
                                <div style={{ background: '#fff', borderRadius: '24px', padding: '80px 40px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                                    <MessageSquare size={48} color="#e5e7eb" style={{ marginBottom: '16px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#374151', marginBottom: '8px' }}>Aucun post trouvé</h3>
                                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                        {search ? 'Aucun résultat pour votre recherche.' : 'Aucun post publié pour le moment.'}
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                                    {filteredPosts.map(post => (
                                        <PostCard key={post.id} post={post} onDelete={deletePost} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* COMMENTS */}
                    {activeTab === 'comments' && (
                        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            {filteredComments.length === 0 ? (
                                <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>
                                    <MessageSquare size={48} color="#e5e7eb" style={{ marginBottom: '16px' }} />
                                    <p>Aucun commentaire trouvé.</p>
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#fafafa' }}>
                                        <tr>
                                            {['Auteur', 'Commentaire', 'Date', 'Actions'].map(h => (
                                                <th key={h} style={{ textAlign: h === 'Actions' ? 'right' : 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredComments.map(comment => (
                                            <tr key={comment.id} style={{ borderTop: '1px solid #f9fafb' }}>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={14} color="#9ca3af" />
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{comment.author_name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#4b5563', maxWidth: '400px' }}>{comment.content}</td>
                                                <td style={{ padding: '14px 20px', fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(comment.created_at).toLocaleString('fr-FR')}</td>
                                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                    <button onClick={() => deleteComment(comment.id)} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* MODERATION */}
                    {activeTab === 'moderation' && (
                        <div style={{ background: '#fff', borderRadius: '24px', padding: '60px 40px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <ShieldAlert size={48} color="#fb5607" style={{ marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Espace Modération Avancée</h3>
                            <p style={{ color: '#9ca3af', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px' }}>
                                Cet espace permet de surveiller les posts signalés et de gérer les bannissements temporaires de la communauté.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900, color: '#fb5607' }}>{posts.filter(p => (p.likes_count || 0) < 0).length}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af' }}>Posts Signalés</p>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', minWidth: '200px' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900, color: '#7c3aed' }}>{posts.length}</h4>
                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#9ca3af' }}>Posts Total</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PostCard({ post, onDelete }: { post: CommunityPost; onDelete: (id: string) => void }) {
    return (
        <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
            {post.image_url ? (
                <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <img src={post.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                        {post.category || 'Autre'}
                    </div>
                </div>
            ) : (
                <div style={{ height: '64px', background: 'linear-gradient(135deg, #fb5607 0%, #ff8c0094 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={24} color="rgba(255,255,255,0.5)" />
                </div>
            )}
            <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {post.author_avatar
                            ? <img src={post.author_avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            : <User size={16} color="#9ca3af" />
                        }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author_name}</p>
                        {post.author_email && <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author_email}</p>}
                    </div>
                    <button onClick={() => onDelete(post.id)} style={{ padding: '7px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={15} />
                    </button>
                </div>
                {/* Contenu */}
                {post.title && <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, lineHeight: 1.3 }}>{post.title}</h4>}
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>
                    {post.content || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Aucun texte</span>}
                </p>
                {/* Stats */}
                <div style={{ display: 'flex', gap: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                        <Heart size={13} color="#ef4444" fill="#ef4444" /> {post.likes_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                        <MessageSquare size={13} color="#7c3aed" /> {post.comments_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                        <Eye size={13} color="#0891b2" /> {post.views_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                        <Calendar size={11} /> {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </span>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: color + '15', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            </div>
            <h3 style={{ margin: 0, fontSize: '32px', fontWeight: 900 }}>{value}</h3>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? '#fff' : '#6b7280',
                transition: 'all 0.2s'
            }}
        >
            {label}
        </button>
    );
}
