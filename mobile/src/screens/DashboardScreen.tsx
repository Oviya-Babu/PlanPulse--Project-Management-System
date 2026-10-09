import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/types';
import { DashboardMetrics } from '../api/types';
import { fetchDashboardMetrics } from '../api/dashboard';
import { colors } from '../theme';

type DashboardNavProp = BottomTabNavigationProp<RootTabParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<DashboardNavProp>();

  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch {
      setError('Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
  };

  const totalTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const pendingTasks = metrics?.pendingTasks ?? 0;
  const totalProjects = metrics?.totalProjects ?? 0;
  const projectsInProgress = metrics?.projectsInProgress ?? 0;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const progressPercent = Math.round(progress * 100);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading workspace overview...</Text>
      </View>
    );
  }

  if (error && !metrics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => loadData()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Header section */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          PlanPulse
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Workspace Metrics & Delivery Progress
        </Text>
      </View>

      {/* Progress card if tasks exist */}
      {totalTasks > 0 ? (
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeaderRow}>
              <Text variant="titleSmall" style={styles.progressTitle}>
                Overall Completion
              </Text>
              <Text variant="labelLarge" style={styles.percentText}>
                {progressPercent}%
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color="#059669"
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressSub}>
              {completedTasks} of {totalTasks} tasks completed across all projects.
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      {/* 5 Core metrics (PRD §8D order) */}
      <View style={styles.metricsGrid}>
        {/* 1. Total Projects */}
        <TouchableOpacity onPress={() => navigation.navigate('Projects')} activeOpacity={0.8}>
          <Card style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.metricLabel}>
                TOTAL PROJECTS
              </Text>
              <Text variant="headlineSmall" style={styles.metricValue}>
                {totalProjects}
              </Text>
              <Text variant="bodySmall" style={styles.metricSub}>
                All owned projects &rarr;
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* 2. Total Tasks */}
        <TouchableOpacity onPress={() => navigation.navigate('Tasks')} activeOpacity={0.8}>
          <Card style={[styles.metricCard, { borderLeftColor: '#0284C7' }]}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.metricLabel}>
                TOTAL TASKS
              </Text>
              <Text variant="headlineSmall" style={styles.metricValue}>
                {totalTasks}
              </Text>
              <Text variant="bodySmall" style={styles.metricSub}>
                Across all projects &rarr;
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>

        {/* 3. Completed Tasks */}
        <Card style={[styles.metricCard, { borderLeftColor: '#059669' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              COMPLETED TASKS
            </Text>
            <Text variant="headlineSmall" style={[styles.metricValue, { color: '#059669' }]}>
              {completedTasks}
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Done & verified
            </Text>
          </Card.Content>
        </Card>

        {/* 4. Pending Tasks */}
        <Card style={[styles.metricCard, { borderLeftColor: '#D97706' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              PENDING TASKS
            </Text>
            <Text variant="headlineSmall" style={[styles.metricValue, { color: '#D97706' }]}>
              {pendingTasks}
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Awaiting action
            </Text>
          </Card.Content>
        </Card>

        {/* 5. Projects In Progress */}
        <Card style={[styles.metricCard, { borderLeftColor: '#4F46E5' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              PROJECTS IN PROGRESS
            </Text>
            <Text variant="headlineSmall" style={[styles.metricValue, { color: '#4F46E5' }]}>
              {projectsInProgress}
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Currently active
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Empty State Card if no projects yet (AC-DASH-03) */}
      {totalProjects === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Projects Yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Get started by creating your first project to organize deliverables and track progress.
            </Text>
            <Button
              mode="contained"
              icon="plus"
              style={styles.emptyButton}
              buttonColor={colors.primary}
              onPress={() => navigation.navigate('Projects')}
            >
              Go to Projects
            </Button>
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  percentText: {
    fontWeight: '800',
    color: '#059669',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  progressSub: {
    color: '#64748B',
    marginTop: 8,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  metricSub: {
    color: '#94A3B8',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    borderRadius: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 12,
  },
});
