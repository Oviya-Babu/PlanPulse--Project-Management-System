import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { apiClient } from '../api/client';
import { HealthResponse } from '../api/types';
import { colors } from '../theme';

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      const res = await apiClient.get<HealthResponse>('/health');
      setHealth(res.data);
    } catch {
      setHealth({
        status: 'degraded',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const onRefresh = () => {
    setRefreshing(true);
    checkHealth();
  };

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
          Mobile Workspace Overview
        </Text>
      </View>

      {/* Backend connection status chip */}
      <View style={styles.chipContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Chip
            icon={health?.status === 'ok' ? 'check-circle' : 'alert-circle'}
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  health?.status === 'ok'
                    ? '#DCFCE7'
                    : '#FEE2E2',
              },
            ]}
            textStyle={{
              color: health?.status === 'ok' ? colors.status.completed : colors.error,
              fontWeight: '600',
              fontSize: 12,
            }}
          >
            Backend: {health?.status === 'ok' ? 'Connected' : 'Offline'}
          </Chip>
        )}
      </View>

      {/* 5 Core metrics (PRD §8D order) */}
      <View style={styles.metricsGrid}>
        {/* 1. Total Projects */}
        <Card style={[styles.metricCard, { borderLeftColor: colors.primary }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              TOTAL PROJECTS
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Active & planned
            </Text>
          </Card.Content>
        </Card>

        {/* 2. Total Tasks */}
        <Card style={[styles.metricCard, { borderLeftColor: colors.priority.low }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              TOTAL TASKS
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              All assigned tasks
            </Text>
          </Card.Content>
        </Card>

        {/* 3. Completed Tasks */}
        <Card style={[styles.metricCard, { borderLeftColor: colors.status.completed }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              COMPLETED TASKS
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Done & verified
            </Text>
          </Card.Content>
        </Card>

        {/* 4. Pending Tasks */}
        <Card style={[styles.metricCard, { borderLeftColor: colors.status.inProgress }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              PENDING TASKS
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Awaiting action
            </Text>
          </Card.Content>
        </Card>

        {/* 5. Projects In Progress */}
        <Card style={[styles.metricCard, { borderLeftColor: '#6366F1' }]}>
          <Card.Content>
            <Text variant="labelSmall" style={styles.metricLabel}>
              PROJECTS IN PROGRESS
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              0
            </Text>
            <Text variant="bodySmall" style={styles.metricSub}>
              Currently active
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Empty State Card (AC-UI-03) */}
      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Projects Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Projects created on web or mobile will appear here with live synchronization.
          </Text>
          <Button
            mode="contained"
            icon="plus"
            style={styles.emptyButton}
            buttonColor={colors.primary}
            onPress={() => {}}
          >
            Create First Project
          </Button>
        </Card.Content>
      </Card>
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
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusChip: {
    height: 32,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 8,
    elevation: 1,
  },
  metricLabel: {
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontWeight: 'bold',
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
});
