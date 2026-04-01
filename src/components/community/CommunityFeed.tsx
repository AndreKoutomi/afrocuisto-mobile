import React, { useState, useRef } from 'react';
import { OptimizedImage } from './../OptimizedImage';
import { motion, AnimatePresence } from 'motion/react';
import {
    Heart, MessageCircle, Share2, Plus, X, Image as ImageIcon,
    ArrowLeft, Eye, MoreHorizontal, Bookmark, Flag, Trash2,
    UserPlus, UserMinus, Camera, Loader2, Edit2
} from 'lucide-react';
import { CommunityPost, User, PostCategory } from '../../types';
import { dbService } from '../../dbService';

// ─── Utilitaires ────────────────────────────────────────────────────────────

const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "À l'instant";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}j`;
};

/** Compresse une image et la convertit en base64 pour éviter de faire planter l'app avec des fichiers trop lourds */
const compressImage = (file: File, maxWidth = 1024, quality = 0.75): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcul du ratio pour redimensionner
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context failed'));
                ctx.drawImage(img, 0, 0, width, height);

                // Export en JPEG compressé
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });

// ─── Formulaire Plein Écran — optimisé mobile ───────────────────────────────

const FullScreenCreatePostForm: React.FC<{
    currentUser: User | null;
    onSubmit: (data: { title?: string; content?: string; image_url?: string; category?: PostCategory }) => void;
    onCancel: () => void;
    isDark: boolean;
    initialData?: CommunityPost | null;
}> = ({ currentUser, onSubmit, onCancel, isDark, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [category, setCategory] = useState<PostCategory>(initialData?.category || 'Autre');
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);   // local blob preview
    const [imageBase64, setImageBase64] = useState<string | null>(initialData?.image_url || null);     // persisted data
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories: PostCategory[] = ['Recette', 'Astuce', 'Question', 'Moment', 'Autre'];

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            // Prévisualisation immédiate (blob URL — temporaire)
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);

            // Conversion et compression pour persistance
            const b64 = await compressImage(file);
            setImageBase64(b64);
        } catch (err) {
            console.error('Image processing error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const canSubmit = (title.trim() || content.trim() || imageBase64) && !isUploading && !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setIsSubmitting(true);
        try {
            let finalImageUrl: string | undefined = undefined;

            if (imageBase64 && currentUser?.id) {
                // Tentative upload vers Supabase Storage
                const storageUrl = await dbService.uploadPostImage(imageBase64, currentUser.id);
                // Si Storage OK → URL publique. Sinon → base64 comme fallback
                finalImageUrl = storageUrl ?? imageBase64;
            }

            onSubmit({
                title: title.trim() || undefined,
                content: content.trim() || undefined,
                image_url: finalImageUrl,
                category
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    React.useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const mainElement = document.querySelector('main');
        const originalMainOverflow = mainElement?.style.overflow;

        document.body.style.overflow = 'hidden';
        if (mainElement) {
            mainElement.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            if (mainElement) {
                mainElement.style.overflow = originalMainOverflow || '';
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, mass: 0.7 }}
            className={`fixed inset-0 z-[850] flex flex-col overflow-hidden ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f7f7f5]'}`}
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
            {/* ── Header compact ── */}
            <div className={`flex items-center justify-between px-4 py-3 shrink-0 border-b ${isDark ? 'border-white/6' : 'border-stone-100'}`}
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            >
                <button
                    onClick={onCancel}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDark ? 'bg-white/8 text-white/60' : 'bg-stone-100 text-stone-500'}`}
                >
                    <X size={18} />
                </button>

                <span className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-stone-800'}`}>
                    {initialData ? 'Modifier la publication' : 'Nouvelle publication'}
                </span>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`px-4 py-2 rounded-full text-[13px] font-black transition-all active:scale-95 flex items-center gap-1.5 ${canSubmit
                        ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/30'
                        : isDark ? 'bg-white/8 text-white/25' : 'bg-stone-200 text-stone-400'
                        }`}
                >
                    {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                    {initialData ? 'Modifier' : 'Publier'}
                </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Author row */}
                <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#fb5607]/80 to-[#ff9a6c]/60 p-[2px] shrink-0">
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-black overflow-hidden ${isDark ? 'bg-[#111] text-white' : 'bg-white text-stone-700'}`}>
                            {false && currentUser?.avatar
                                ? <OptimizedImage src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                                : getInitials(currentUser?.name)
                            }
                        </div>
                    </div>
                    <div>
                        <p className={`text-[14px] font-bold leading-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>
                            {currentUser?.name}
                        </p>
                        <p className={`text-[11px] ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                            Visible par tous
                        </p>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-2xl text-[12px] font-bold whitespace-nowrap transition-all active:scale-95 ${category === cat
                                ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/20 scale-105'
                                : isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Formulaire */}
                <div className="px-4 pb-4">
                    <input
                        type="text"
                        placeholder="Nom du plat (optionnel)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className={`w-full text-[20px] font-black bg-transparent outline-none mb-3 placeholder:font-medium ${isDark ? 'text-white placeholder-white/20' : 'text-stone-900 placeholder-stone-300'}`}
                    />

                    <textarea
                        placeholder="Partagez votre recette, astuce ou moment culinaire..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={5}
                        className={`w-full text-[15px] font-medium bg-transparent outline-none resize-none leading-relaxed ${isDark ? 'text-white/80 placeholder-white/20' : 'text-stone-600 placeholder-stone-300'}`}
                    />
                </div>

                {/* Image preview */}
                {(imagePreview || isUploading) && (
                    <div className="px-4 pb-4">
                        <div className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-white/8' : 'bg-stone-100'}`} style={{ aspectRatio: '4/3' }}>
                            {imagePreview && !isUploading && (
                                <OptimizedImage src={imagePreview} className="w-full h-full object-cover" alt="Aperçu" />
                            )}
                            {isUploading && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 size={28} className="text-[#fb5607] animate-spin" />
                                </div>
                            )}
                            {imagePreview && (
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm active:scale-90 transition-all"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Barre d'outils fixe en bas ── */}
            <div
                className={`sticky bottom-0 shrink-0 border-t px-4 py-3 flex items-center gap-3 ${isDark ? 'bg-[#0a0a0a] border-white/6' : 'bg-[#f7f7f5] border-stone-100'}`}
                style={{ paddingBottom: '12px' }}
            >
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-95 ${isDark
                        ? 'bg-white/8 text-white/60'
                        : 'bg-white text-stone-600 border border-stone-200 shadow-sm'
                        }`}
                >
                    <Camera size={16} className="text-[#fb5607]" />
                    Photo
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                />
                <span className={`ml-auto text-[11px] font-medium ${isDark ? 'text-white/20' : 'text-stone-400'}`}>
                    {content.length > 0 ? `${content.length} car.` : ''}
                </span>
            </div>
        </motion.div>
    );
};

// ─── MenuItem ────────────────────────────────────────────────────────────────

const MenuItem = ({ icon, label, onClick, isDark, danger }: any) => (
    <button
        onClick={onClick}
        className={`w-full px-4 py-2.5 flex items-center gap-3 text-[13px] font-semibold transition-colors ${danger
            ? 'text-red-500 hover:bg-red-500/8'
            : isDark ? 'text-white/70 hover:bg-white/5' : 'text-stone-700 hover:bg-stone-50'
            }`}
    >
        {icon}
        {label}
    </button>
);

// ─── Filtre par Catégorie ─────────────────────────────────────────────────────

const CategoryFilter = ({ selected, onSelect, isDark }: { selected: string; onSelect: (c: any) => void; isDark: boolean }) => {
    const categories: PostCategory[] = ['Recette', 'Astuce', 'Question', 'Moment', 'Autre'];
    return (
        <div className="flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-1 px-1">
            <button
                onClick={() => onSelect('All')}
                className={`px-4 py-2 rounded-2xl text-[12px] font-bold whitespace-nowrap transition-all ${selected === 'All'
                    ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/20 scale-105'
                    : isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
            >
                Tout voir
            </button>
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => onSelect(cat)}
                    className={`px-4 py-2 rounded-2xl text-[12px] font-bold whitespace-nowrap transition-all ${selected === cat
                        ? 'bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/20 scale-105'
                        : isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};

// ─── Image Lightbox ──────────────────────────────────────────────────────────

const ImageLightbox = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => {
    React.useEffect(() => {
        const originalBodyOverflow = document.body.style.overflow;
        const mainElement = document.querySelector('main');
        const originalMainOverflow = mainElement?.style.overflow;

        document.body.style.overflow = 'hidden';
        if (mainElement) {
            mainElement.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = originalBodyOverflow;
            if (mainElement) {
                mainElement.style.overflow = originalMainOverflow || '';
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.button
                whileTap={{ scale: 0.9 }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
                <X size={24} />
            </motion.button>
            <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={imageUrl}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
            />
        </motion.div>
    );
};

// ─── Carte de post ───────────────────────────────────────────────────────────

const PostCard = ({ post, currentUser, onLike, onCommentClick, onShare, onDeletePost, onSavePost, onFollowAuthor, onEdit, onZoom, isDark }: any) => {
    const hasViewedRef = useRef(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isLiking, setIsLiking] = useState(false); // animation de double-tap
    const isSaved = currentUser?.savedPosts?.includes(post.id);
    const isOwner = currentUser?.id === post.user_id;
    const isFollowing = currentUser?.following?.includes(post.user_id);

    React.useEffect(() => {
        if (!hasViewedRef.current) {
            hasViewedRef.current = true;
            dbService.incrementViewCount(post.id).catch(() => { });
        }
    }, [post.id]);

    const handleDoubleTap = (e: React.MouseEvent) => {
        if (!post.is_liked) {
            onLike(post);
        }
        setIsLiking(true);
        setTimeout(() => setIsLiking(false), 800);
    };

    return (
        <motion.article
            id={`post-${post.id}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
        >
            {/* Author row */}
            <div className="flex items-center justify-between px-1 mb-2.5">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#fb5607] to-[#ff9a6c] p-[1.5px]">
                            <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs ${isDark ? 'bg-[#111] text-white' : 'bg-white text-stone-700'}`}>
                                {false && post.author_avatar
                                    ? <OptimizedImage src={post.author_avatar} className="w-full h-full object-cover" alt="" />
                                    : getInitials(post.author_name)
                                }
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className={`text-[14px] font-bold leading-tight ${isDark ? 'text-white' : 'text-stone-900'}`}>{post.author_name}</p>
                            {post.category && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-white/50' : 'bg-[#fb5607]/10 text-[#fb5607]'
                                    }`}>
                                    {post.category}
                                </span>
                            )}
                        </div>
                        <p className={`text-[11px] ${isDark ? 'text-white/30' : 'text-stone-400'}`}>{formatTimeAgo(post.created_at)}</p>
                    </div>
                </div>

                {/* Options */}
                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'text-white/25 hover:bg-white/5' : 'text-stone-300 hover:bg-stone-100'}`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                        {showOptions && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                    transition={{ duration: 0.14 }}
                                    className={`absolute right-0 top-9 w-44 rounded-2xl shadow-xl border z-50 overflow-hidden py-1 ${isDark ? 'bg-[#1c1c1c] border-white/8' : 'bg-white border-stone-100'}`}
                                >
                                    <MenuItem icon={<Share2 size={14} />} label="Partager" onClick={() => { setShowOptions(false); onShare?.(post); }} isDark={isDark} />
                                    {isOwner && (
                                        <MenuItem icon={<Edit2 size={14} />} label="Modifier" onClick={() => { setShowOptions(false); onEdit?.(post); }} isDark={isDark} />
                                    )}
                                    {currentUser && (
                                        <MenuItem
                                            icon={<Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />}
                                            label={isSaved ? 'Enregistré ✓' : 'Enregistrer'}
                                            onClick={() => { setShowOptions(false); onSavePost?.(post); }}
                                            isDark={isDark}
                                        />
                                    )}
                                    {isOwner ? (
                                        <MenuItem icon={<Trash2 size={14} />} label="Supprimer" onClick={() => { setShowOptions(false); onDeletePost?.(post); }} isDark={isDark} danger />
                                    ) : currentUser && (
                                        <>
                                            <MenuItem
                                                icon={isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                                                label={isFollowing ? 'Ne plus suivre' : 'Suivre'}
                                                onClick={() => { setShowOptions(false); onFollowAuthor?.(post); }}
                                                isDark={isDark}
                                            />
                                            <MenuItem icon={<Flag size={14} />} label="Signaler" onClick={() => setShowOptions(false)} isDark={isDark} danger />
                                        </>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Content Body */}
            <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-[#141414] border border-white/5' : 'bg-white border border-stone-100'} shadow-sm`}>
                {/* Image Section */}
                {post.image_url && (
                    <div className="relative w-full overflow-hidden bg-stone-100" style={{ paddingBottom: '100%' }}>
                        <img
                            src={post.image_url}
                            alt={post.title || 'Photo du plat'}
                            className="absolute inset-0 w-full h-full object-cover cursor-zoom-in active:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onClick={() => onZoom(post.image_url)}
                            onDoubleClick={handleDoubleTap}
                        />

                        {/* Double tap heart animation */}
                        <AnimatePresence>
                            {isLiking && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1.2, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <Heart size={100} fill="#fff" className="text-white drop-shadow-2xl" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Text Content */}
                {(post.title || post.content) && (
                    <div className={`px-4 ${post.image_url ? 'pt-4' : 'pt-5'} pb-4`}>
                        {post.title && (
                            <h3 className={`font-black text-[17px] leading-tight mb-1.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                                {post.title}
                            </h3>
                        )}
                        {post.content && (
                            <p className={`text-[14px] leading-relaxed ${isDark ? 'text-white/60' : 'text-stone-500'}`}>
                                {post.content}
                            </p>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className={`flex items-center justify-between px-4 py-3.5 ${(post.title || post.content) ? `border-t ${isDark ? 'border-white/5' : 'border-stone-50'}` : ''
                    }`}>
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => onLike(post)}
                            className={`flex items-center gap-2 group ${post.is_liked ? 'text-[#ff2a5f]' : isDark ? 'text-white/30' : 'text-stone-400'}`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${post.is_liked ? 'bg-[#ff2a5f]/10' : 'hover:bg-stone-100 group-hover:text-stone-600'
                                }`}>
                                <Heart size={20} fill={post.is_liked ? 'currentColor' : 'none'} strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-black">{post.likes_count ?? 0}</span>
                        </motion.button>

                        <button
                            onClick={() => onCommentClick(post)}
                            className={`flex items-center gap-2 group ${isDark ? 'text-white/30' : 'text-stone-400'}`}
                        >
                            <div className="p-2 rounded-full hover:bg-stone-100 transition-colors group-hover:text-stone-600">
                                <MessageCircle size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-black">{post.comments_count ?? 0}</span>
                        </button>

                        <button
                            onClick={() => onShare?.(post)}
                            className={`p-2 rounded-full hover:bg-stone-100 transition-colors ${isDark ? 'text-white/30' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <Share2 size={19} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className={`flex items-center gap-1.5 ${isDark ? 'text-white/10' : 'text-stone-300'}`}>
                        <Eye size={14} />
                        <span className="text-[11px] font-bold">{post.views_count ?? 0}</span>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

// ─── Feed Principal ──────────────────────────────────────────────────────────

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
    onUpdatePost,
    jumpToPostId,
    showSavedOnly,
    onLoadMore,
    hasMore,
    onFormOpenChange
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
    onCreatePost: (post: { title?: string; content?: string; image_url?: string; category?: PostCategory }) => void;
    onUpdatePost: (postId: string, post: { title?: string; content?: string; image_url?: string; category?: PostCategory }) => void;
    jumpToPostId?: string | null;
    showSavedOnly?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    onFormOpenChange?: (isOpen: boolean) => void;
}) => {
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [postToEdit, setPostToEdit] = useState<CommunityPost | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

    React.useEffect(() => {
        onFormOpenChange?.(isCreatingPost || !!postToEdit);
    }, [isCreatingPost, postToEdit, onFormOpenChange]);

    const filteredPosts = posts.filter(p => {
        if (showSavedOnly) return currentUser?.savedPosts?.includes(p.id);
        if (selectedCategory === 'All') return true;
        return p.category === selectedCategory;
    });

    React.useEffect(() => {
        if (jumpToPostId && posts.length > 0) {
            setTimeout(() => {
                const el = document.getElementById(`post-${jumpToPostId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-[#fb5607]', 'ring-opacity-60');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-[#fb5607]', 'ring-opacity-60'), 2200);
                }
            }, 500);
        }
    }, [jumpToPostId, posts]);

    const handleSubmit = (postData: any) => {
        if (postToEdit) {
            onUpdatePost(postToEdit.id, postData);
            setPostToEdit(null);
        } else {
            onCreatePost(postData);
            setIsCreatingPost(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {(isCreatingPost || postToEdit) && currentUser && (
                    <FullScreenCreatePostForm
                        key={postToEdit ? `edit-${postToEdit.id}` : 'create-form'}
                        currentUser={currentUser}
                        onSubmit={handleSubmit}
                        onCancel={() => { setIsCreatingPost(false); setPostToEdit(null); }}
                        isDark={isDark}
                        initialData={postToEdit}
                    />
                )}
                {zoomImageUrl && (
                    <ImageLightbox
                        imageUrl={zoomImageUrl}
                        onClose={() => setZoomImageUrl(null)}
                    />
                )}
            </AnimatePresence>

            <div className="w-full">
                {/* ── Filtres de Catégories (Sticky) ── */}
                {!showSavedOnly && (
                    <div className={`pt-1 -mx-6 px-6 mb-2 ${isDark ? 'bg-black' : 'bg-[#f3f4f6]'}`}>
                        <CategoryFilter
                            selected={selectedCategory}
                            onSelect={setSelectedCategory}
                            isDark={isDark}
                        />
                    </div>
                )}

                {/* ── Bouton Créer un post ── */}
                {currentUser && !showSavedOnly && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsCreatingPost(true)}
                        className={`w-full flex items-center gap-3 p-3.5 mb-5 rounded-3xl transition-all ${isDark
                            ? 'bg-[#141414] border border-white/5'
                            : 'bg-white border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
                            }`}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#fb5607] to-[#ff9a6c] p-[1.5px] shrink-0">
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-black overflow-hidden ${isDark ? 'bg-[#111] text-white' : 'bg-white text-stone-700'}`}>
                                {false && currentUser.avatar
                                    ? <OptimizedImage src={currentUser.avatar} className="w-full h-full object-cover" alt="" />
                                    : getInitials(currentUser.name)
                                }
                            </div>
                        </div>
                        <span className={`flex-1 text-left text-[13.5px] ${isDark ? 'text-white/30' : 'text-stone-400'}`}>
                            Partagez une recette ou astuce...
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#fb5607] flex items-center justify-center shadow-lg shadow-[#fb5607]/25 shrink-0">
                            <Plus size={17} className="text-white" strokeWidth={2.5} />
                        </div>
                    </motion.button>
                )}

                {/* ── Feed ── */}
                {isLoading && posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-9 h-9 rounded-full border-2 border-[#fb5607]/20 border-t-[#fb5607] animate-spin mb-3" />
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-stone-300'}`}>
                            Chargement...
                        </p>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <>
                        {filteredPosts.map((post: CommunityPost) => (
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
                                onEdit={setPostToEdit}
                                onZoom={setZoomImageUrl}
                                isDark={isDark}
                                t={t}
                            />
                        ))}

                        {hasMore && (
                            <div className="flex justify-center pt-2 pb-10">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onLoadMore}
                                    className={`px-6 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all ${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                        }`}
                                >
                                    Voir plus de pépites
                                </motion.button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                            <Bookmark size={24} className={isDark ? 'text-white/20' : 'text-stone-300'} />
                        </div>
                        <p className={`text-[14px] font-bold mb-1 ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
                            {showSavedOnly ? 'Aucun post enregistré' : 'Soyez le premier à partager !'}
                        </p>
                        <p className={`text-[12px] ${isDark ? 'text-white/20' : 'text-stone-400'}`}>
                            {showSavedOnly ? 'Enregistrez des posts depuis le fil.' : 'La communauté vous attend.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};
