import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Bookmark, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { CommunityFeed } from './community/CommunityFeed';
import CommentModal from './CommentModal';

interface CommunityViewProps {
  isDark: boolean;
  t: any;
  currentUser: any;
  communityPosts: any[];
  isCommunityLoading: boolean;
  showSavedPosts: boolean;
  setShowSavedPosts: (show: boolean) => void;
  displayedCommunityPosts: any[];
  selectedPostForComments: any;
  setSelectedPostForComments: (post: any) => void;
  postComments: any[];
  isCommentsLoading: boolean;
  isCommunityFormOpen: boolean;
  setIsCommunityFormOpen: (open: boolean) => void;
  loadMoreCommunityPosts: () => void;
  hasMoreCommunityPosts: boolean;
  jumpToPostId: string | null;
  handleLike: (post: any) => void;
  handleAddComment: (content: string) => void;
  handleCreatePost: (data: any) => void;
  handleUpdatePost: (id: string, data: any) => void;
  handleShare: (post: any) => void;
  handleDeletePost: (post: any) => void;
  handleSavePost: (post: any) => void;
  handleFollowAuthor: (post: any) => void;
  scrollToTop: () => void;
  refreshCommunity: () => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({
  isDark,
  t,
  currentUser,
  communityPosts,
  isCommunityLoading,
  showSavedPosts,
  setShowSavedPosts,
  displayedCommunityPosts,
  selectedPostForComments,
  setSelectedPostForComments,
  postComments,
  isCommentsLoading,
  setIsCommunityFormOpen,
  loadMoreCommunityPosts,
  hasMoreCommunityPosts,
  jumpToPostId,
  handleLike,
  handleAddComment,
  handleCreatePost,
  handleUpdatePost,
  handleShare,
  handleDeletePost,
  handleSavePost,
  handleFollowAuthor,
  scrollToTop,
  refreshCommunity
}) => {
  return (
    <div className={`flex-1 flex flex-col pb-44 transition-colors ${isDark ? 'bg-black' : 'bg-[#f3f4f6]'}`}>
      <header
        style={{
          padding: '16px 24px',
          paddingTop: Capacitor.isNativePlatform() ? 'calc(env(safe-area-inset-top, 40px) + 16px)' : '24px',
          paddingBottom: '16px',
          position: 'sticky',
          top: 0,
          background: isDark ? '#000000ff' : '#f3f4f6',
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showSavedPosts && (
              <button
                onClick={() => setShowSavedPosts(false)}
                className={`w-[42px] h-[42px] -ml-2 rounded-full flex items-center justify-center text-[#fb5607] shadow-sm transition-transform active:scale-95 shrink-0 border ${isDark ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white border-stone-100 hover:bg-stone-50'}`}
              >
                <ChevronLeft size={24} strokeWidth={2.5} className="mr-0.5" />
              </button>
            )}
            <motion.h1 
              whileTap={{ scale: 0.94 }}
              onClick={() => { scrollToTop(); refreshCommunity(); }}
              className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-stone-800'} cursor-pointer`}
            >
              {showSavedPosts ? "Enregistrés" : t.community}
            </motion.h1>
          </div>
          {currentUser && !showSavedPosts && (
            <button
              onClick={() => setShowSavedPosts(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95 ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-white border-stone-200 text-stone-600 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-stone-50'}`}
            >
              <Bookmark size={18} fill="none" />
            </button>
          )}
        </div>
        <p className={`text-xs font-medium mt-1 opacity-50 ${isDark ? 'text-white' : 'text-stone-500'}`}>
          {showSavedPosts ? "Vos publications sauvegardées" : t.communityDesc}
        </p>
      </header>

      <div className="px-6">
        <CommunityFeed
          posts={displayedCommunityPosts}
          currentUser={currentUser}
          isLoading={isCommunityLoading}
          t={t}
          isDark={isDark}
          onLike={handleLike}
          onCommentClick={(post) => setSelectedPostForComments(post)}
          onShare={handleShare}
          onDeletePost={handleDeletePost}
          onSavePost={handleSavePost}
          onFollowAuthor={handleFollowAuthor}
          onCreatePost={handleCreatePost}
          onUpdatePost={handleUpdatePost}
          onLoadMore={loadMoreCommunityPosts}
          hasMore={hasMoreCommunityPosts}
          jumpToPostId={jumpToPostId}
          showSavedOnly={showSavedPosts}
          onFormOpenChange={setIsCommunityFormOpen}
        />
      </div>

      <CommentModal
        isOpen={!!selectedPostForComments}
        onClose={() => setSelectedPostForComments(null)}
        post={selectedPostForComments}
        comments={postComments}
        onAddComment={handleAddComment}
        isLoading={isCommentsLoading}
        t={t}
        isDark={isDark}
      />
    </div>
  );
};

export default CommunityView;
