import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Avatar.Text
          size={72}
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
      </View>

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
            <Text style={styles.rowLabel}>Security</Text>
            <Text style={styles.rowValue}>JWT Authenticated</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
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
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  rowValue: {
    color: '#0F172A',
    fontWeight: '500',
    fontSize: 14,
  },
  logoutButton: {
    width: '100%',
    borderColor: '#FCA5A5',
    borderRadius: 8,
  },
});
