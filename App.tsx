import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RecipeProvider } from './src/context/RecipeContext';
import { ShoppingProvider } from './src/context/ShoppingContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppColors } from './src/theme/colors';
import { WebDeviceFrame } from './src/components/common/WebDeviceFrame';

import { CustomBottomTabBar } from './src/components/navigation/CustomBottomTabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecipeListScreen } from './src/screens/RecipeListScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { MarketScreen } from './src/screens/MarketScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { AiChefScreen } from './src/screens/AiChefScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AnimationLabScreen } from './src/screens/AnimationLabScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { OtpScreen } from './src/screens/auth/OtpScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/auth/ResetPasswordScreen';
import { ResetSuccessScreen } from './src/screens/auth/ResetSuccessScreen';
import { OnboardingScreen } from './src/screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tabs conformes au design Figma Node 19:17
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Recipes" component={RecipeListScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
};

const navThemeLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const navThemeDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121110',
  },
};

const RootNavigation: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <NavigationContainer theme={isDark ? navThemeDark : navThemeLight}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="ResetSuccess" component={ResetSuccessScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="RecipeList" component={RecipeListScreen} />
        <Stack.Screen name="AiChef" component={AiChefScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AnimationLab" component={AnimationLabScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

import { NavigationTransitionProvider } from './src/context/NavigationTransitionContext';
import { CookingTimerProvider } from './src/context/CookingTimerContext';
import { InteractiveTimerPill } from './src/components/common/InteractiveTimerPill';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <RecipeProvider>
            <ShoppingProvider>
              <CookingTimerProvider>
                <NavigationTransitionProvider>
                  <WebDeviceFrame>
                    <RootNavigation />
                    <InteractiveTimerPill />
                  </WebDeviceFrame>
                </NavigationTransitionProvider>
              </CookingTimerProvider>
            </ShoppingProvider>
          </RecipeProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
