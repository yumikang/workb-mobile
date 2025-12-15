/**
 * WORKB Mobile - Main Tab Navigator
 * Bottom tab navigation for main app screens
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MainTabParamList } from '../../types';
import { Colors } from '../../constants';
import { useNoticesStore } from '../../stores';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LeaveScreen from '../screens/LeaveScreen';
import NoticesScreen from '../screens/NoticesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabBarIcon = ({
  name,
  focused,
  badge,
}: {
  name: string;
  focused: boolean;
  badge?: number;
}) => (
  <View>
    <Icon
      name={name}
      size={24}
      color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
    />
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
      </View>
    )}
  </View>
);

const MainTabNavigator: React.FC = () => {
  const unreadCount = useNoticesStore((state) => state.unreadCount);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: '홈',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                name={focused ? 'home' : 'home-outline'}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Leave"
          component={LeaveScreen}
          options={{
            tabBarLabel: '휴가',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                name={focused ? 'calendar' : 'calendar-outline'}
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Notices"
          component={NoticesScreen}
          options={{
            tabBarLabel: '게시판',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                name={focused ? 'document-text' : 'document-text-outline'}
                focused={focused}
                badge={unreadCount}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: '설정',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon
                name={focused ? 'settings' : 'settings-outline'}
                focused={focused}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
});

export default MainTabNavigator;
