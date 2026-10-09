import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  IconButton,
  Button,
  FAB,
} from 'react-native-paper';
import { Task, TaskPriority, TaskStatus } from '../api/types';
import { fetchTasks, updateTask, deleteTask } from '../api/tasks';
import { TaskModal } from '../components/TaskModal';
import { colors } from '../theme';

export const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');

  // Modal
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await fetchTasks({
        search: searchQuery.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      });
      setTasks(data);
    } catch {
      setError('Unable to load tasks. Please pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = () => {
    loadTasks(true);
  };

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === 'COMPLETED') return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await updateTask(task.id, { status: newStatus });
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch {
      Alert.alert('Error', 'Failed to update task status.');
      loadTasks();
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

  const handleDelete = (task: Task) => {
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
            } catch {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING':
        return '#64748B';
      case 'IN_PROGRESS':
        return '#4F46E5';
      case 'COMPLETED':
        return '#059669';
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const completed = item.status === 'COMPLETED';
    const overdue = isOverdue(item.dueDate, item.status);

    return (
      <Card style={[styles.taskCard, completed && styles.completedCard]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            {/* Quick complete checkbox */}
            <TouchableOpacity
              onPress={() => handleToggleComplete(item)}
              style={[styles.checkbox, completed && styles.checkboxCompleted]}
            >
              {completed && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text
                variant="titleSmall"
                style={[styles.taskName, completed && styles.taskNameCompleted]}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              {item.projectName ? (
                <Text variant="labelSmall" style={styles.projectName}>
                  📁 {item.projectName}
                </Text>
              ) : null}
            </View>

            <View style={styles.actionsContainer}>
              <IconButton
                icon="pencil-outline"
                size={18}
                iconColor="#64748B"
                onPress={() => {
                  setEditingTask(item);
                  setTaskModalVisible(true);
                }}
                style={styles.actionBtn}
              />
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor="#EF4444"
                onPress={() => handleDelete(item)}
                style={styles.actionBtn}
              />
            </View>
          </View>

          {item.description ? (
            <Text variant="bodySmall" style={styles.taskDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Quick action chips */}
          <View style={styles.metaRow}>
            <View style={styles.chipsRow}>
              {/* Priority quick toggle */}
              <TouchableOpacity onPress={() => handleCyclePriority(item)}>
                <Chip
                  compact
                  textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                  style={[styles.smallChip, { backgroundColor: getPriorityColor(item.priority) }]}
                >
                  {item.priority}
                </Chip>
              </TouchableOpacity>

              {/* Status quick toggle */}
              <TouchableOpacity onPress={() => handleCycleStatus(item)}>
                <Chip
                  compact
                  textStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                  style={[styles.smallChip, { backgroundColor: getStatusColor(item.status) }]}
                >
                  {item.status.replace('_', ' ')}
                </Chip>
              </TouchableOpacity>
            </View>

            {/* Due date */}
            {item.dueDate ? (
              <Text
                variant="labelSmall"
                style={[styles.dueDate, overdue && styles.overdueDate]}
              >
                {overdue ? '⚠️ Overdue: ' : '📅 '}
                {item.dueDate}
              </Text>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search tasks..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filtersContainer}>
        <View style={styles.chipsRow}>
          <Text variant="labelSmall" style={styles.filterLabel}>Status:</Text>
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
            <Chip
              key={status}
              compact
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
              style={styles.filterChip}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </Chip>
          ))}
        </View>
        <View style={[styles.chipsRow, { marginTop: 6 }]}>
          <Text variant="labelSmall" style={styles.filterLabel}>Priority:</Text>
          {(['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const).map((priority) => (
            <Chip
              key={priority}
              compact
              selected={priorityFilter === priority}
              onPress={() => setPriorityFilter(priority)}
              style={styles.filterChip}
            >
              {priority === 'ALL' ? 'All' : priority}
            </Chip>
          ))}
        </View>
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => loadTasks()} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'No tasks match your filters.'
              : "You don't have any tasks yet."}
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtitle}>
            {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Try clearing your filters to view other tasks.'
              : 'Tap the + button below to create your first task.'}
          </Text>
          {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? (
            <Button
              mode="text"
              onPress={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              style={styles.retryButton}
            >
              Clear Filters
            </Button>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* FAB to Add Task */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => {
          setEditingTask(null);
          setTaskModalVisible(true);
        }}
      />

      {/* Task Modal */}
      <TaskModal
        visible={taskModalVisible}
        onDismiss={() => setTaskModalVisible(false)}
        onSaved={() => loadTasks(true)}
        task={editingTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#F1F5F9',
    elevation: 0,
    borderRadius: 10,
    height: 44,
  },
  searchInput: {
    minHeight: 0,
    fontSize: 14,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterChip: {
    height: 30,
  },
  filterLabel: {
    color: '#64748B',
    fontWeight: '600',
    marginRight: 4,
    alignSelf: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 10,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  completedCard: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
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
  titleContainer: {
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
  projectName: {
    color: '#64748B',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    margin: 0,
    padding: 0,
    width: 28,
    height: 28,
  },
  taskDesc: {
    color: '#64748B',
    marginTop: 6,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  smallChip: {
    height: 22,
    borderRadius: 11,
  },
  dueDate: {
    color: '#64748B',
    fontWeight: '500',
  },
  overdueDate: {
    color: '#DC2626',
    fontWeight: '700',
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
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
});
