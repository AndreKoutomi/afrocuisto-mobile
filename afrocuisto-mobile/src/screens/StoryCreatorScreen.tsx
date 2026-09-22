import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { WhatsAppStoryCreator } from '../components/community/WhatsAppStoryCreator';
import { CommunityStory } from '../types/community';

export const StoryCreatorScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handlePublishStory = (newStory: CommunityStory) => {
    // Navigation back to community with story
    navigation.goBack();
  };

  return (
    <WhatsAppStoryCreator
      visible={true}
      onClose={() => navigation.goBack()}
      onPublishStory={handlePublishStory}
    />
  );
};
