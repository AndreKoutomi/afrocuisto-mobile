import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Plus, Camera, X, Image as ImageIcon, Send, ChevronLeft, ArrowLeft, Eye, MoreHorizontal, Bookmark, Link2, Flag, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { CommunityPost, User } from '../../types';

// Utilitaires copiés depuis App.tsx pour l'indépendance du composant
const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "À l'instant";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
};

// --- Composant : Formulaire de création plein écran (Design exact de l'image) ---
const FullScreenCreatePostForm = ({ currentUser, onSubmit, onCancel, isDark, t }: any) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() && !content.trim() && !imagePreview) return;
        onSubmit({
            title: title.trim(),
            content: content.trim(),
            image_url: imagePreview || undefined
        });
        setTitle('');
        setContent('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            className={`fixed inset-0 z-[100] flex flex-col ${isDark ? 'bg-black' : 'bg-[#f0f4f5]'}`}
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 40px) + 24px)' }}
        >
            {/* Header */}
            <header className="px-6 flex items-center justify-between mb-8">
                <button onClick={onCancel} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${isDark ? 'bg-white/10 text-white' : 'bg-white text-stone-800'}`}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={`text-[17px] font-bold tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>Nouvelle publication</h1>
                <div className="w-12" /> {/* Spacer pour centrer */}
            </header>

            <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar">
                {/* Fields Container */}
                <div className="flex flex-col gap-4">
                    {/* Nom du Plat Field */}
                    <div className={`rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border transition-colors ${isDark ? 'bg-[#1a1a1a] border-white/5 focus-within:border-white/20' : 'bg-white border-transparent focus-within:border-stone-200'}`}>
                        <label className={`block text-[11px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Nom du plat (Optionnel)</label>
                        <input
                            type="text"
                            placeholder="Ex: Poulet Yassa"
                            className={`w-full text-lg font-black bg-transparent outline-none ${isDark ? 'text-white placeholder-white/20' : 'text-stone-900 placeholder-stone-300'}`}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>


                    {/* Contenu et Image Field */}
                    <div className={`rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border transition-colors ${isDark ? 'bg-[#1a1a1a] border-white/5 focus-within:border-white/20' : 'bg-white border-transparent focus-within:border-stone-200'}`}>
                        <label className={`block text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>Recette ou Astuces</label>
                        <textarea
                            placeholder="Partagez tous les détails ici..."
                            className={`w-full h-32 text-[15px] font-medium bg-transparent outline-none resize-none mb-4 ${isDark ? 'text-white/80 placeholder-white/20' : 'text-stone-600 placeholder-stone-300'}`}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />

                        {imagePreview && (
                            <div className="relative rounded-2xl overflow-hidden aspect-video bg-stone-100 mb-6 border border-stone-200/50 group">
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                <button onClick={() => setImagePreview(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95">
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Media Bar */}
                        <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-white/5' : 'border-stone-100'}`}>
                            <div className="flex items-center gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className={`px-4 py-2.5 rounded-full flex items-center gap-2.5 font-bold text-[13px] tracking-wide transition-colors ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}>
                                    <ImageIcon size={18} strokeWidth={2.5} className={isDark ? 'text-[#fb5607]' : 'text-[#fb5607]'} />
                                    <span>Ajouter l'image du plat</span>
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            </div>
                            <div className={`px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${isDark ? 'border-white/10 text-white/40' : 'border-stone-200 text-stone-400'}`}>
                                Communauté
                            </div>
                        </div>
                    </div>
                </div>

                {/* Removed Sub Menus For Cleaner App Logic */}
            </div>

            {/* Bottom Actions Sticky */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 flex items-center gap-4 bg-gradient-to-t pb-[calc(env(safe-area-inset-bottom,20px)+24px)] ${isDark ? 'from-black via-black to-transparent' : 'from-[#f0f4f5] via-[#f0f4f5] to-transparent'}`}>
                <button
                    onClick={onCancel}
                    className={`flex-[0.8] py-4 rounded-[28px] font-bold text-[15px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] active:scale-95 transition-transform ${isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-stone-900'}`}
                >
                    Brouillon
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!title.trim() && !content.trim() && !imagePreview}
                    className={`flex-[1.2] py-4 rounded-[28px] font-bold text-[15px] shadow-[0_8px_30px_rgba(251,86,7,0.3)] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 bg-[#fb5607] text-white`}
                >
                    Publier
                </button>
            </div>
        </motion.div>
    );
};

// --- Composant : Carte de publication ---
const PostCard = ({ post, currentUser, onLike, onCommentClick, onShare, onDeletePost, onSavePost, onFollowAuthor, isDark, t }: any) => {
    const hasViewedRef = useRef(false);
    const [showOptions, setShowOptions] = useState(false);

    React.useEffect(() => {
        if (!hasViewedRef.current) {
            hasViewedRef.current = true;
            // Ne pas utiliser await pour ne pas bloquer le rendu, on incremente silencieusement en arrière plan
            import('../../dbService').then(({ dbService }) => {
                dbService.incrementViewCount(post.id);
            });
        }
    }, [post.id]);
    // Animation framer-motion variants
    const pulseVariant = {
        liked: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
        unliked: { scale: 1 }
    };

    return (
        <motion.div
            id={`post-${post.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-6 ${isDark ? 'bg-[#1a1a1a] border border-white/5' : 'bg-white'}`}
        >
            {/* Header : Avatar + Name + Date + Options */}
            <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt={post.author_name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-500">
                                {getInitials(post.author_name)}
                            </div>
                        )}
                        {/* Green indicator dot */}
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h4 className={`text-[15px] font-bold leading-tight ${isDark ? 'text-white' : 'text-stone-800'}`}>{post.author_name}</h4>
                        <p className={`text-[12px] font-medium leading-tight mt-0.5 ${isDark ? 'text-white/40' : 'text-stone-400'}`}>
                            {formatTimeAgo(post.created_at)}
                        </p>
                    </div>
                </div>

                {/* Options Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-1.5 transition-colors ${isDark ? 'text-white/30 hover:text-white/60' : 'text-stone-300 hover:text-stone-500'}`}
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    <AnimatePresence>
                        {showOptions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className={`absolute right-0 top-10 w-48 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border z-50 overflow-hidden ${isDark ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-stone-100'}`}
                                >
                                    <button
                                        onClick={() => {
                                            setShowOptions(false);
                                            if (onShare) onShare(post);
                                        }}
                                        className={`w-full px-4 py-3 flex items-center gap-3 text-[13px] font-bold transition-colors ${isDark ? 'text-white hover:bg-white/5' : 'text-stone-700 hover:bg-stone-50'}`}
                                    >
                                        <Share2 size={16} /> Partager
                                    </button>

                                    {/* Action User Specific & Save */}
                                    {currentUser && (
                                        <button
                                            onClick={() => { setShowOptions(false); if (onSavePost) onSavePost(post); }}
                                            className={`w-full px-4 py-3 flex items-center gap-3 text-[13px] font-bold transition-colors ${isDark ? 'text-white hover:bg-white/5' : 'text-stone-700 hover:bg-stone-50'}`}
                                        >
                                            <Bookmark size={16} fill={currentUser?.savedPosts?.includes(post.id) ? "currentColor" : "none"} />
                                            {currentUser?.savedPosts?.includes(post.id) ? "Retirer des favoris" : "Enregistrer"}
                                        </button>
                                    )}

                                    {currentUser?.id === post.user_id ? (
                                        <button
                                            onClick={() => { setShowOptions(false); onDeletePost && onDeletePost(post); }}
                                            className="w-full px-4 py-3 flex items-center gap-3 text-[13px] font-bold transition-colors text-red-500 hover:bg-red-500/10"
                                        >
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    ) : (
                                        <>
                                            {currentUser && (
                                                <button
                                                    onClick={() => { setShowOptions(false); if (onFollowAuthor) onFollowAuthor(post); }}
                                                    className={`w-full px-4 py-3 flex items-center gap-3 text-[13px] font-bold transition-colors ${isDark ? 'text-white hover:bg-white/5' : 'text-stone-700 hover:bg-stone-50'}`}
                                                >
                                                    {currentUser?.following?.includes(post.user_id) ? (
                                                        <><UserMinus size={16} /> Ne plus suivre</>
                                                    ) : (
                                                        <><UserPlus size={16} /> Suivre l'auteur</>
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowOptions(false)}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-[13px] font-bold transition-colors text-red-500 hover:bg-red-500/10"
                                            >
                                                <Flag size={16} /> Signaler
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Display */}
            {(post.title || post.content) && (
                <div className="px-5 pb-3">
                    {post.title && (
                        <h3 className={`font-black text-lg mb-0.5 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            {post.title}
                        </h3>
                    )}
                    {post.content && (
                        <p className={`text-[14px] leading-relaxed ${isDark ? 'text-white/80' : 'text-stone-600'}`}>
                            {post.content}
                        </p>
                    )}
                </div>
            )}

            {/* Image */}
            {post.image_url && (
                <div className="w-full aspect-video bg-stone-100 relative group overflow-hidden">
                    <img src={post.image_url} alt="Plat" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
            )}

            {/* Action Bar (Mockup Exact Match) */}
            <div className="px-5 py-4 flex items-center justify-between">
                {/* Real Views Count */}
                <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/30' : 'text-stone-300'}`}>
                    <Eye size={18} fill="currentColor" strokeWidth={0} />
                    <span className="text-[13px] font-bold">{post.views_count || 0}</span>
                </div>

                <div className="flex items-center gap-5">
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        animate={post.is_liked ? "liked" : "unliked"}
                        variants={pulseVariant}
                        onClick={() => onLike(post)}
                        className={`flex items-center gap-1.5 transition-colors ${post.is_liked ? 'text-[#ff2a5f]' : (isDark ? 'text-white/30 hover:text-white/70' : 'text-stone-300 hover:text-stone-500')}`}
                    >
                        <Heart size={18} fill="currentColor" strokeWidth={0} />
                        <span className="text-[13px] font-bold">{post.likes_count || '0'}</span>
                    </motion.button>

                    <button
                        onClick={() => onCommentClick(post)}
                        className={`flex items-center gap-1.5 transition-colors ${isDark ? 'text-white/30 hover:text-white/70' : 'text-stone-300 hover:text-stone-500'}`}
                    >
                        <MessageCircle size={18} fill="currentColor" strokeWidth={0} />
                        <span className="text-[13px] font-bold">{post.comments_count || '0'}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Composant Principal : CommunityFeed ---
export const CommunityFeed = ({
    posts,
    currentUser,
    isLoading,
    t,
    isDark,
    onLike,
    onCommentClick,
    onShare,
    onDeletePost,
    onSavePost,
    onFollowAuthor,
    onCreatePost,
    jumpToPostId,
    showSavedOnly
}: {
    posts: CommunityPost[];
    currentUser: User | null;
    isLoading: boolean;
    t: any;
    isDark: boolean;
    onLike: (post: CommunityPost) => void;
    onCommentClick: (post: CommunityPost) => void;
    onShare: (post: CommunityPost) => void;
    onDeletePost?: (post: CommunityPost) => void;
    onSavePost?: (post: CommunityPost) => void;
    onFollowAuthor?: (post: CommunityPost) => void;
    onCreatePost: (post: { title?: string; content?: string; image_url?: string }) => void;
    jumpToPostId?: string | null;
    showSavedOnly?: boolean;
}) => {
    const [isCreatingPost, setIsCreatingPost] = useState(false);

    React.useEffect(() => {
        if (jumpToPostId && posts.length > 0) {
            // Un petit délai pour s'assurer que le rendu est terminé
            setTimeout(() => {
                const element = document.getElementById(`post-${jumpToPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight effect could be added here
                    element.classList.add('ring-4', 'ring-[#fb5607]', 'ring-opacity-50', 'transition-all', 'duration-1000');
                    setTimeout(() => element.classList.remove('ring-4', 'ring-[#fb5607]', 'ring-opacity-50'), 2000);
                }
            }, 500);
        }
    }, [jumpToPostId, posts]);

    const handleSubmit = (postData: { title?: string; content?: string; image_url?: string }) => {
        onCreatePost(postData);
        setIsCreatingPost(false);
    };

    if (isCreatingPost && currentUser) {
        return (
            <AnimatePresence>
                <FullScreenCreatePostForm
                    currentUser={currentUser}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsCreatingPost(false)}
                    isDark={isDark}
                    t={t}
                />
            </AnimatePresence>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="w-full max-w-md pb-24">
                {currentUser && !showSavedOnly && (
                    <button
                        onClick={() => setIsCreatingPost(true)}
                        className={`w-full flex items-center gap-3 p-4 mb-6 rounded-[28px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border font-bold active:scale-[0.98] transition-all ${isDark ? 'bg-[#121212] border-white/5 text-white/80' : 'bg-white border-stone-100 text-stone-600'}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-[#fb5607]/10 flex items-center justify-center text-[#fb5607] shrink-0">
                            <Plus size={20} />
                        </div>
                        Créer un post...
                    </button>
                )}

                {isLoading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                        <div className="w-12 h-12 rounded-full border-4 border-[#fb5607]/20 border-t-[#fb5607] animate-spin mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">{t.loading || 'Chargement...'}</p>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        {posts.map((post: CommunityPost) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUser={currentUser}
                                onLike={onLike}
                                onCommentClick={onCommentClick}
                                onShare={onShare}
                                onDeletePost={onDeletePost}
                                onSavePost={onSavePost}
                                onFollowAuthor={onFollowAuthor}
                                isDark={isDark}
                                t={t}
                            />
                        ))}
                    </>
                ) : (
                    <div className="text-center py-16 opacity-40">
                        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bookmark size={32} className="text-stone-300" />
                        </div>
                        <p className="text-sm font-medium">
                            {showSavedOnly ? "Aucun post enregistré pour le moment." : "L'aventure commence ici, soyez le premier à partager !"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
