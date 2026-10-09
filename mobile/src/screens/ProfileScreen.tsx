import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, useTheme, ProgressBar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardMetrics } from '../api/dashboard';
import { DashboardMetrics } from '../api/types';
import { colors } from '../theme';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetchDashboardMetrics()
      .then((data) => setMetrics(data))
      .catch(() => setMetrics(null));
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const totalTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const totalProjects = metrics?.totalProjects ?? 0;
  const projectsInProgress = metrics?.projectsInProgress ?? 0;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Avatar.Text
          size={76}
          label={getInitials(user?.fullName)}
          style={{ backgroundColor: colors.primary }}
          color="#FFFFFF"
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.fullName || 'User'}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.email || ''}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Workspace Owner</Text>
        </View>
      </View>

      {/* Workspace Performance Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Workspace Performance
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalProjects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
              <Text style={styles.statSub}>{projectsInProgress} active</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
              <Text style={styles.statSub}>{completedTasks} done</Text>
            </View>
          </View>

          {totalTasks > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Completion Rate</Text>
                <Text style={styles.progressPercent}>{completionRate}%</Text>
              </View>
              <ProgressBar
                progress={totalTasks > 0 ? completedTasks / totalTasks : 0}
                color="#059669"
                style={styles.progressBar}
              />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Account Details Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account Details
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Member Since</Text>
            <Text style={styles.rowValue}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'Recent'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Security Protocol</Text>
            <Text style={styles.rowValue}>Argon2id + JWT</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Multi-Tenant State</Text>
            <Text style={[styles.rowValue, { color: '#059669' }]}>Isolated</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Account UUID</Text>
            <Text style={styles.rowCode}>
              {user?.id ? `${user.id.slice(0, 12)}...` : 'N/A'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={logout}
        textColor={colors.error}
        style={styles.logoutButton}
      >
        Log Out
      </Button>
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
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  name: {
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  email: {
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  statSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  rowValue: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
  },
  rowCode: {
    color: '#334155',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  logoutButton: {
    width: '100%',
    borderColor: '#FCA5A5',
    borderRadius: 10,
    marginTop: 8,
  },
});
