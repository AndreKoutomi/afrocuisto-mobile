import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Loader, Bell } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  comments: any[];
  onAddComment: (content: string) => void;
  isLoading: boolean;
  t: any;
  isDark: boolean;
}

const getInitials = (name: string) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  post,
  comments,
  onAddComment,
  isLoading,
  t,
  isDark
}) => {
  const [commentText, setCommentText] = useState('');

  const handleSend = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`w-full max-w-md h-[80vh] rounded-t-[40px] flex flex-col overflow-hidden relative ${isDark ? 'bg-[#0d0d0d]/80 border-t border-white/10' : 'bg-white/70 border-t border-white/80'}`}
            style={{ backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
          >
            <header className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-stone-800'}`}>{t.comments}</h3>
                <p className="text-xs text-stone-400 font-medium">{post?.author_name}</p>
              </div>
              <button onClick={onClose} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-600'}`}>
                <XCircle size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-orange-500" size={32} /></div>
              ) : comments.length > 0 ? (
                comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center font-black text-orange-600 text-[10px] shrink-0">
                      {getInitials(c.author_name)}
                    </div>
                    <div className={`flex-1 p-3 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-stone-100'}`}>
                      <h5 className={`text-[12px] font-bold mb-0.5 ${isDark ? 'text-white' : 'text-stone-800'}`}>{c.author_name}</h5>
                      <p className={`text-[13px] leading-relaxed ${isDark ? 'text-white/70' : 'text-stone-600'}`}>{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 opacity-50">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4"><Bell size={32} /></div>
                  <p className="text-sm font-medium">{t.noComments}</p>
                </div>
              )}
            </div>

            <div className={`p-6 border-t ${isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-100'}`}>
              <div className="relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={t.writeComment}
                  className={`w-full py-4 pl-5 pr-14 rounded-[20px] text-sm font-medium outline-none transition-all border ${isDark ? 'bg-black/40 text-white border-white/10 focus:border-[#fb5607]' : 'bg-white text-stone-800 border-stone-200 focus:border-[#fb5607]'}`}
                />
                <button
                  onClick={handleSend}
                  disabled={!commentText.trim()}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[#fb5607] text-white shadow-lg shadow-[#fb5607]/20 active:scale-90 disabled:opacity-30`}
                >
                  <motion.div whileTap={{ x: 5 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></motion.div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommentModal;
