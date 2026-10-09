import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  ProgressBar,
  Button,
  Divider,
} from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ProjectsStackParamList } from '../navigation/types';
import { Project, ProjectStatus } from '../api/types';
import { fetchProjectById } from '../api/projects';
import { colors } from '../theme';

type ProjectDetailsRouteProp = RouteProp<ProjectsStackParamList, 'ProjectDetails'>;

export const ProjectDetailsScreen: React.FC = () => {
  const route = useRoute<ProjectDetailsRouteProp>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await fetchProjectById(projectId);
      setProject(data);
    } catch {
      setError('Unable to load project details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return '#64748B';
      case 'IN_PROGRESS':
        return '#4F46E5';
      case 'COMPLETED':
        return '#059669';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'Not Started';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Project not found.'}</Text>
        <Button mode="contained" onPress={() => loadProject()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  const taskCount = project.taskCount ?? 0;
  const completedCount = project.completedTaskCount ?? 0;
  const pendingCount = taskCount - completedCount;
  const progress = taskCount > 0 ? completedCount / taskCount : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadProject(true)}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text variant="headlineSmall" style={styles.title}>
              {project.name}
            </Text>
            <Chip
              textStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}
              style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) }]}
            >
              {getStatusLabel(project.status)}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            {project.description || 'No description provided for this project.'}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text variant="labelMedium" style={styles.progressLabel}>
                Completion Progress
              </Text>
              <Text variant="labelMedium" style={styles.percentText}>
                {progressPercent}%
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              color={project.status === 'COMPLETED' ? '#059669' : colors.primary}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="labelSmall" style={styles.metricLabel}>
              Total Tasks
            </Text>
            <Text variant="headlineMedium" style={styles.metricValue}>
              {taskCount}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="labelSmall" style={styles.metricLabel}>
              Completed
            </Text>
            <Text variant="headlineMedium" style={[styles.metricValue, { color: '#059669' }]}>
              {completedCount}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="labelSmall" style={styles.metricLabel}>
              Pending
            </Text>
            <Text variant="headlineMedium" style={[styles.metricValue, { color: '#D97706' }]}>
              {pendingCount}
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Schedule Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Timeline & Dates
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.dateRow}>
            <Text variant="bodySmall" style={styles.dateLabel}>
              Start Date
            </Text>
            <Text variant="bodySmall" style={styles.dateValue}>
              {project.startDate || 'Not scheduled'}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text variant="bodySmall" style={styles.dateLabel}>
              End Date
            </Text>
            <Text variant="bodySmall" style={styles.dateValue}>
              {project.endDate || 'No deadline'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Tasks Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            Project Tasks
          </Text>
          <Divider style={styles.divider} />

          {taskCount === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <Text variant="bodyMedium" style={styles.emptyTasksText}>
                This project has no tasks yet.
              </Text>
              <Text variant="bodySmall" style={styles.emptyTasksSub}>
                Tasks created in Slice 3 will appear here.
              </Text>
            </View>
          ) : (
            <Text variant="bodySmall" style={styles.tasksSummary}>
              {taskCount} {taskCount === 1 ? 'task is' : 'tasks are'} tracked in this project.
            </Text>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  statusChip: {
    height: 26,
    borderRadius: 13,
  },
  description: {
    color: '#475569',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
  percentText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  metricContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  metricLabel: {
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#F1F5F9',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateLabel: {
    color: '#64748B',
  },
  dateValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTasksText: {
    color: '#475569',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyTasksSub: {
    color: '#94A3B8',
  },
  tasksSummary: {
    color: '#64748B',
    paddingVertical: 8,
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
