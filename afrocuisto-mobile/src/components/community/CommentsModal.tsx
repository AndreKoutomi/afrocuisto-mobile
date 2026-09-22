import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Send, Heart, MessageCircle, Sparkles } from 'lucide-react-native';
import { CommunityPost, PostComment } from '../../types/community';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../theme/colors';
import { getImageSource } from '../../utils/imageHelper';

interface CommentsModalProps {
  visible: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  post,
  onClose,
  onAddComment,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [inputText, setInputText] = useState('');

  if (!visible || !post) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    onAddComment(post.id, inputText.trim());
    setInputText('');
  };

  const commentsList = post.comments || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#191715' : '#FFFFFF',
              borderColor: isDark ? '#2E2A27' : '#EFECE6',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Poignée de drag */}
          <View style={styles.handleWrap}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? '#3D3834' : '#D6D1C7' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MessageCircle size={20} color={AppColors.primary} />
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
                ]}
              >
                Commentaires ({commentsList.length})
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <X
                size={20}
                color={isDark ? '#D6D3CD' : AppColors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Liste des commentaires */}
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {commentsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Sparkles size={32} color={AppColors.primary} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                  ]}
                >
                  Soyez le premier à commenter !
                </Text>
                <Text style={styles.emptySubtitle}>
                  Partagez une astuce ou posez une question sur cette préparation.
                </Text>
              </View>
            ) : (
              commentsList.map(comment => (
                <View
                  key={comment.id}
                  style={[
                    styles.commentItem,
                    {
                      backgroundColor: isDark ? '#211E1C' : '#F9F8F5',
                      borderColor: isDark ? '#2E2A27' : '#EFECE6',
                    },
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthorRow}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarLetter}>
                          {comment.authorName.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.commentAuthorName,
                            { color: isDark ? '#FFFFFF' : '#1E1D1D' },
                          ]}
                        >
                          {comment.authorName}
                        </Text>
                        <Text style={styles.commentTime}>{comment.createdAt}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.likeCommentBtn}>
                      <Heart size={14} color="#8C8A87" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.commentBody,
                      { color: isDark ? '#E5E2DC' : '#3D3B39' },
                    ]}
                  >
                    {comment.content}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Barre d'input de commentaire */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark ? '#211E1C' : '#F3F1EC',
                borderColor: isDark ? '#38322E' : '#E5E0D8',
              },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ajouter un commentaire gourmet..."
              placeholderTextColor={isDark ? '#8C8A87' : '#9E9B97'}
              style={[
                styles.textInput,
                { color: isDark ? '#FFFFFF' : '#1E1D1D' },
              ]}
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputText.trim()
                    ? AppColors.primary
                    : isDark
                    ? '#38322E'
                    : '#DDD8CF',
                },
              ]}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
              onPress={handleSend}
            >
              <Send size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '80%',
    minHeight: 400,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentsListContent: {
    paddingVertical: 14,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#8C8A87',
    textAlign: 'center',
    maxWidth: 240,
  },
  commentItem: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  commentAuthorName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10.5,
    color: '#8C8A87',
  },
  likeCommentBtn: {
    padding: 4,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});