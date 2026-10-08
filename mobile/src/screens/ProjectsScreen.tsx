import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { colors } from '../theme';

export const ProjectsScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Projects
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Your workspace projects
        </Text>
      </View>

      <Card style={styles.emptyCard}>
        <Card.Content style={styles.emptyContent}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No Projects Found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            You haven't created any projects yet.
          </Text>
          <Button
            mode="contained"
            icon="plus"
            buttonColor={colors.primary}
            onPress={() => {}}
          >
            Create Project
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
