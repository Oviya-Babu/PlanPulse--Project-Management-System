import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { colors } from '../theme';

export const TasksScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Tasks
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Your task backlog
        </Text>
      </View>

      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Tasks Found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You haven't assigned any tasks yet.
          </Text>
          <Button
            mode="contained"
            icon="plus"
            buttonColor={colors.primary}
            onPress={() => {}}
          >
            Create Task
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
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 16,
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
    marginBottom: 16,
  },
});
