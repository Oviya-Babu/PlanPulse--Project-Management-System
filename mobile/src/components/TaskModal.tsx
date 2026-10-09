import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  Chip,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { Task, TaskPriority, TaskStatus, Project } from '../api/types';
import { createTask, updateTask } from '../api/tasks';
import { fetchProjects } from '../api/projects';
import { colors } from '../theme';

interface TaskModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSaved: () => void;
  task?: Task | null;
  defaultProjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onDismiss,
  onSaved,
  task,
  defaultProjectId,
}) => {
  const isEditing = Boolean(task);

  const [projectId, setProjectId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [dueDate, setDueDate] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      if (task) {
        setProjectId(task.projectId);
        setName(task.name);
        setDescription(task.description || '');
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(task.dueDate || '');
      } else {
        setProjectId(defaultProjectId || '');
        setName('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('PENDING');
        setDueDate('');
      }

      // Fetch projects list if not editing or project selector needed
      if (!defaultProjectId || !task) {
        setIsLoadingProjects(true);
        fetchProjects()
          .then((res) => {
            setProjects(res);
            if (!task && !defaultProjectId && res.length > 0) {
              setProjectId(res[0].id);
            }
          })
          .catch(() => {})
          .finally(() => setIsLoadingProjects(false));
      }
    }
  }, [visible, task, defaultProjectId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage('Task name is required.');
      return;
    }
    if (!isEditing && !projectId) {
      setErrorMessage('Please select a project for this task.');
      return;
    }

    // Validate dueDate format if supplied (YYYY-MM-DD)
    if (dueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setErrorMessage('Due date must be in YYYY-MM-DD format.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isEditing && task) {
        await updateTask(task.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          dueDate: dueDate.trim() || null,
        });
      } else {
        await createTask({
          projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          dueDate: dueDate.trim() || null,
        });
      }

      onSaved();
      onDismiss();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = axiosErr?.response?.data?.error?.message || axiosErr?.message || 'Failed to save task.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text variant="titleLarge" style={styles.title}>
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </Text>

            {errorMessage ? (
              <HelperText type="error" visible style={styles.errorText}>
                {errorMessage}
              </HelperText>
            ) : null}

            {/* Project Picker (only if creating and multiple projects exist) */}
            {!isEditing && !defaultProjectId ? (
              <View style={styles.fieldSection}>
                <Text variant="labelMedium" style={styles.fieldLabel}>
                  Project *
                </Text>
                {isLoadingProjects ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {projects.map((p) => (
                      <Chip
                        key={p.id}
                        selected={projectId === p.id}
                        onPress={() => setProjectId(p.id)}
                        style={styles.chip}
                        compact
                      >
                        {p.name}
                      </Chip>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}

            {/* Task Name */}
            <View style={styles.fieldSection}>
              <Text variant="labelMedium" style={styles.fieldLabel}>
                Task Name *
              </Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Implement authentication screens"
                maxLength={150}
                style={styles.input}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldSection}>
              <Text variant="labelMedium" style={styles.fieldLabel}>
                Description
              </Text>
              <TextInput
                mode="outlined"
                value={description}
                onChangeText={setDescription}
                placeholder="Detailed task description..."
                multiline
                numberOfLines={3}
                maxLength={2000}
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* Priority */}
            <View style={styles.fieldSection}>
              <Text variant="labelMedium" style={styles.fieldLabel}>
                Priority
              </Text>
              <View style={styles.optionsRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.choiceButton,
                      priority === p && styles.choiceButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        priority === p && styles.choiceTextSelected,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View style={styles.fieldSection}>
              <Text variant="labelMedium" style={styles.fieldLabel}>
                Status
              </Text>
              <View style={styles.optionsRow}>
                {(['PENDING', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.choiceButton,
                      status === s && styles.choiceButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        status === s && styles.choiceTextSelected,
                      ]}
                    >
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.fieldSection}>
              <Text variant="labelMedium" style={styles.fieldLabel}>
                Due Date (YYYY-MM-DD)
              </Text>
              <TextInput
                mode="outlined"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2026-12-31"
                maxLength={10}
                style={styles.input}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                disabled={isSubmitting}
                style={styles.actionButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.actionButton}
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  keyboardView: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    paddingHorizontal: 0,
    marginVertical: 0,
  },
  fieldSection: {
    gap: 4,
  },
  fieldLabel: {
    color: '#334155',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    marginRight: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  choiceButtonSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    minWidth: 110,
  },
});
