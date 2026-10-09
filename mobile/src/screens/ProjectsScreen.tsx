import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  ProgressBar,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProjectsStackParamList } from '../navigation/types';
import { Project, ProjectStatus } from '../api/types';
import { fetchProjects } from '../api/projects';
import { colors } from '../theme';

type NavigationProp = NativeStackNavigationProp<ProjectsStackParamList, 'ProjectsList'>;

export const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ProjectStatus>('ALL');

  const loadProjects = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const data = await fetchProjects({
        search: searchQuery.trim() || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      setProjects(data);
    } catch {
      setError('Unable to load projects. Please pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = () => {
    loadProjects(true);
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

  const renderProjectItem = ({ item }: { item: Project }) => {
    const taskCount = item.taskCount ?? 0;
    const completedCount = item.completedTaskCount ?? 0;
    const progress = taskCount > 0 ? completedCount / taskCount : 0;
    const progressPercent = Math.round(progress * 100);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ProjectDetails', {
            projectId: item.id,
            projectName: item.name,
          })
        }
      >
        <Card style={styles.projectCard}>
          <Card.Content>
            {/* Top row: Name & Status */}
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.projectName} numberOfLines={1}>
                {item.name}
              </Text>
              <Chip
                textStyle={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              >
                {getStatusLabel(item.status)}
              </Chip>
            </View>

            {/* Description */}
            {item.description ? (
              <Text variant="bodySmall" style={styles.projectDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Dates */}
            <Text variant="labelSmall" style={styles.projectDates}>
              {item.startDate && item.endDate
                ? `${item.startDate} – ${item.endDate}`
                : item.startDate
                ? `Started ${item.startDate}`
                : item.endDate
                ? `Due ${item.endDate}`
                : 'No dates scheduled'}
            </Text>

            {/* Task stats & progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text variant="labelSmall" style={styles.taskStats}>
                  {completedCount}/{taskCount} tasks completed
                </Text>
                <Text variant="labelSmall" style={styles.percentText}>
                  {progressPercent}%
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                color={item.status === 'COMPLETED' ? '#059669' : colors.primary}
                style={styles.progressBar}
              />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search projects..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.chipsContainer}>
        {(['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
          <Chip
            key={status}
            selected={selectedStatus === status}
            onPress={() => setSelectedStatus(status)}
            style={styles.filterChip}
            showSelectedOverlay
          >
            {status === 'ALL'
              ? 'All'
              : status === 'NOT_STARTED'
              ? 'Not Started'
              : status === 'IN_PROGRESS'
              ? 'In Progress'
              : 'Completed'}
          </Chip>
        ))}
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => loadProjects()} style={styles.retryButton}>
            Try Again
          </Button>
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            {searchQuery || selectedStatus !== 'ALL'
              ? 'No projects match your filters.'
              : "You don't have any projects yet."}
          </Text>
          <Text variant="bodySmall" style={styles.emptySubtitle}>
            {searchQuery || selectedStatus !== 'ALL'
              ? 'Try clearing your search query or status filter.'
              : 'Create projects on the web dashboard to organize your deliverables.'}
          </Text>
          {searchQuery || selectedStatus !== 'ALL' ? (
            <Button
              mode="text"
              onPress={() => {
                setSearchQuery('');
                setSelectedStatus('ALL');
              }}
              style={styles.retryButton}
            >
              Clear Filters
            </Button>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectItem}
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
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectName: {
    flex: 1,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
    borderRadius: 12,
  },
  projectDesc: {
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  projectDates: {
    color: '#94A3B8',
    marginBottom: 10,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  taskStats: {
    color: '#64748B',
    fontWeight: '500',
  },
  percentText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
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
});
