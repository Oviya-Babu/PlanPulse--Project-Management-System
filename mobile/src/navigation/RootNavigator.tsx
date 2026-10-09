import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { ProjectDetailsScreen } from '../screens/ProjectDetailsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { NetworkErrorBanner } from '../components/NetworkErrorBanner';
import { RootTabParamList, ProjectsStackParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();
const ProjectsStack = createNativeStackNavigator<ProjectsStackParamList>();

function ProjectsStackNavigator() {
  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: 'bold', color: '#0F172A' },
        headerTintColor: colors.primary,
      }}
    >
      <ProjectsStack.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <ProjectsStack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
        options={({ route }) => ({
          title: route.params.projectName || 'Project Details',
        })}
      />
    </ProjectsStack.Navigator>
  );
}

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, networkError, retry } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Splash / Loading State
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <Text style={styles.splashLogo}>P</Text>
        </View>
        <Text variant="headlineSmall" style={styles.splashTitle}>
          PlanPulse
        </Text>
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  // Unauthenticated State (Auth Flow)
  if (!isAuthenticated) {
    return (
      <View style={styles.flexContainer}>
        {networkError && <NetworkErrorBanner onRetry={retry} />}
        {authScreen === 'login' ? (
          <LoginScreen onNavigateToRegister={() => setAuthScreen('register')} />
        ) : (
          <RegisterScreen onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </View>
    );
  }

  // Authenticated State (Main Tabs)
  return (
    <View style={styles.flexContainer}>
      {networkError && <NetworkErrorBanner onRetry={retry} />}
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#0F172A',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E2E8F0',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
          }}
        />
        <Tab.Screen
          name="Projects"
          component={ProjectsStackNavigator}
          options={{
            headerShown: false,
            title: 'Projects',
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            title: 'Tasks',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashLogo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 32,
  },
  splashTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  spinner: {
    marginTop: 20,
  },
});
