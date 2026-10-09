import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  ProgressBar,
  Button,
  Divider,
  IconButton,
} from 'react-native-paper';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ProjectsStackParamList } from '../navigation/types';
import { Project, ProjectStatus, Task, TaskPriority, TaskStatus } from '../api/types';
import { fetchProjectById } from '../api/projects';
import { fetchTasks, updateTask, deleteTask } from '../api/tasks';
import { TaskModal } from '../components/TaskModal';
import { colors } from '../theme';

type ProjectDetailsRouteProp = RouteProp<ProjectsStackParamList, 'ProjectDetails'>;

export const ProjectDetailsScreen: React.FC = () => {
  const route = useRoute<ProjectDetailsRouteProp>();
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const [projData, tasksData] = await Promise.all([
        fetchProjectById(projectId),
        fetchTasks({ projectId }),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch {
      setError('Unable to load project details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await updateTask(task.id, { status: newStatus });
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      // Reload project metrics in background
      fetchProjectById(projectId).then(setProject).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to update task status.');
      loadData();
    }
  };

  const handleCycleStatus = async (task: Task) => {
    const cycle: Record<TaskStatus, TaskStatus> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'PENDING',
    };
    const nextStatus = cycle[task.status];
    try {
      await updateTask(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      fetchProjectById(projectId).then(setProject).catch(() => {});
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const handleCyclePriority = async (task: Task) => {
    const cycle: Record<TaskPriority, TaskPriority> = {
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'LOW',
    };
    const nextPriority = cycle[task.priority];
    try {
      await updateTask(task.id, { priority: nextPriority });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, priority: nextPriority } : t))
      );
    } catch {
      Alert.alert('Error', 'Failed to update priority.');
    }
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
              fetchProjectById(projectId).then(setProject).catch(() => {});
            } catch {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

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

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'LOW':
        return '#0284C7';
      case 'MEDIUM':
        return '#D97706';
      case 'HIGH':
        return '#E11D48';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return '#64748B';
      case 'IN_PROGRESS':
        return '#4F46E5';
      case 'COMPLETED':
        return '#059669';
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
        <Button mode="contained" onPress={() => loadData()} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  const taskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendingCount = taskCount - completedCount;
  const progress = taskCount > 0 ? completedCount / taskCount : 0;
  const progressPercent = Math.round(progress * 100);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
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
            <View style={styles.tasksHeaderRow}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Tasks ({taskCount})
              </Text>
              <Button
                mode="contained-tonal"
                icon="plus"
                compact
                onPress={() => {
                  setEditingTask(null);
                  setTaskModalVisible(true);
                }}
              >
                Add Task
              </Button>
            </View>
            <Divider style={styles.divider} />

            {tasks.length === 0 ? (
              <View style={styles.emptyTasksContainer}>
                <Text variant="bodyMedium" style={styles.emptyTasksText}>
                  This project has no tasks yet.
                </Text>
                <Text variant="bodySmall" style={styles.emptyTasksSub}>
                  Tap "Add Task" above to create deliverables for this project.
                </Text>
              </View>
            ) : (
              <View style={styles.taskListContainer}>
                {tasks.map((item) => {
                  const completed = item.status === 'COMPLETED';
                  return (
                    <View
                      key={item.id}
                      style={[styles.taskItemCard, completed && styles.taskItemCompleted]}
                    >
                      <View style={styles.taskItemRow}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          onPress={() => handleToggleComplete(item)}
                          style={[styles.checkbox, completed && styles.checkboxCompleted]}
                        >
                          {completed && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>

                        <View style={styles.taskTextCol}>
                          <Text
                            variant="titleSmall"
                            style={[styles.taskName, completed && styles.taskNameCompleted]}
                          >
                            {item.name}
                          </Text>
                          {item.description ? (
                            <Text variant="bodySmall" style={styles.taskDesc} numberOfLines={2}>
                              {item.description}
                            </Text>
                          ) : null}

                          {/* Chips and due date */}
                          <View style={styles.taskMetaRow}>
                            <TouchableOpacity onPress={() => handleCyclePriority(item)}>
                              <Chip
                                compact
                                textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                                style={[
                                  styles.smallChip,
                                  { backgroundColor: getPriorityColor(item.priority) },
                                ]}
                              >
                                {item.priority}
                              </Chip>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => handleCycleStatus(item)}>
                              <Chip
                                compact
                                textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                                style={[
                                  styles.smallChip,
                                  { backgroundColor: getTaskStatusColor(item.status) },
                                ]}
                              >
                                {item.status.replace('_', ' ')}
                              </Chip>
                            </TouchableOpacity>

                            {item.dueDate ? (
                              <Text variant="labelSmall" style={styles.dueDateText}>
                                📅 {item.dueDate}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Edit & Delete actions */}
                        <View style={styles.taskActionIcons}>
                          <IconButton
                            icon="pencil-outline"
                            size={18}
                            iconColor="#64748B"
                            onPress={() => {
                              setEditingTask(item);
                              setTaskModalVisible(true);
                            }}
                            style={styles.iconBtn}
                          />
                          <IconButton
                            icon="delete-outline"
                            size={18}
                            iconColor="#EF4444"
                            onPress={() => handleDeleteTask(item)}
                            style={styles.iconBtn}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        visible={taskModalVisible}
        onDismiss={() => setTaskModalVisible(false)}
        onSaved={() => loadData(true)}
        task={editingTask}
        defaultProjectId={projectId}
      />
    </>
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
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  taskListContainer: {
    gap: 10,
  },
  taskItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskTextCol: {
    flex: 1,
  },
  taskName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  taskDesc: {
    color: '#64748B',
    marginTop: 4,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  smallChip: {
    height: 22,
    borderRadius: 11,
  },
  dueDateText: {
    color: '#64748B',
    fontWeight: '500',
  },
  taskActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    margin: 0,
    padding: 0,
    width: 28,
    height: 28,
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
