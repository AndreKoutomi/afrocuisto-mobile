import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Trash2, ShoppingBag, ChefHat } from 'lucide-react-native';
import { useShopping } from '../context/ShoppingContext';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../theme/colors';
import { PlayfulShoppingItem } from '../components/common/PlayfulShoppingItem';
import { MarketScreenSkeleton } from '../components/common/Skeletons';
import { AnimatedScreenWrapper } from '../components/common/AnimatedScreenWrapper';
import { useNavigationTransition } from '../context/NavigationTransitionContext';

export const MarketScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { items, toggleItem, removeItem, clearCompleted, totalCount } = useShopping();
  const { isDark } = useTheme();
  const { isScreenLoading } = useNavigationTransition();

  const showSkeleton = isScreenLoading('Market');

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
        },
      ]}
    >
      <AnimatedScreenWrapper>
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#FFFFFF' : AppColors.textPrimary },
            ]}
          >
            Liste de Courses ({totalCount})
          </Text>
          <Text style={styles.headerSubtitle}>
            Ingrédients enregistrés pour vos recettes
          </Text>
        </View>

        {items.some(i => i.isChecked) && (
          <TouchableOpacity onPress={clearCompleted} style={styles.clearBtn}>
            <Text style={styles.clearText}>Nettoyer</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSkeleton ? (
        <MarketScreenSkeleton />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={42} color="#8C8A87" />
          </View>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDark ? '#FFFFFF' : '#1E1D1D' },
            ]}
          >
            Votre panier est vide
          </Text>
          <Text style={styles.emptyDesc}>
            Ajoutez des ingrédients directement depuis les fiches de recettes pour préparer vos courses en toute simplicité.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Recipes')}
          >
            <ChefHat size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.emptyActionBtnText}>Explorer les recettes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PlayfulShoppingItem
              item={item}
              onToggle={toggleItem}
              onRemove={removeItem}
            />
          )}
        />
      )}
      </AnimatedScreenWrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#8C8A87',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#8C8A87',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  list: {
    padding: 16,
    paddingBottom: 135,
  },
});
