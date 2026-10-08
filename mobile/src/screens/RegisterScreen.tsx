import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, HelperText, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
  const theme = useTheme();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  const validate = () => {
    let valid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError('Full name is required.');
      valid = false;
    } else if (trimmedName.length > 100) {
      setNameError('Full name cannot exceed 100 characters.');
      valid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (!hasMinLength || !hasLetter || !hasDigit) {
      setPasswordError('Password must be 8+ characters with a letter and a digit.');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      await register(fullName.trim(), email.trim(), password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Join PlanPulse
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Create your workspace account
          </Text>
        </View>

        {/* Server Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Form Card */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {/* Full Name Input */}
            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (nameError) setNameError(null);
              }}
              mode="outlined"
              error={!!nameError}
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor={colors.primary}
            />
            {nameError && <HelperText type="error">{nameError}</HelperText>}

            {/* Email Input */}
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!emailError}
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor={colors.primary}
            />
            {emailError && <HelperText type="error">{emailError}</HelperText>}

            {/* Password Input */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(null);
              }}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={!!passwordError}
              style={styles.input}
              outlineColor="#CBD5E1"
              activeOutlineColor={colors.primary}
            />
            {passwordError && <HelperText type="error">{passwordError}</HelperText>}

            {/* Password Requirement Hints */}
            <View style={styles.passwordHints}>
              <Text style={styles.hintTitle}>Requirements:</Text>
              <Text style={[styles.hintItem, hasMinLength && styles.hintMet]}>
                • 8+ characters
              </Text>
              <Text style={[styles.hintItem, hasLetter && styles.hintMet]}>
                • At least one letter
              </Text>
              <Text style={[styles.hintItem, hasDigit && styles.hintMet]}>
                • At least one number
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              buttonColor={colors.primary}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>

            {/* Navigation to Login */}
            <View style={styles.footer}>
              <Text variant="bodySmall" style={styles.footerText}>
                Already have an account?{' '}
              </Text>
              <Button
                mode="text"
                compact
                onPress={onNavigateToLogin}
                textColor={colors.primary}
                labelStyle={styles.linkText}
              >
                Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 28,
  },
  title: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    color: '#64748B',
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  passwordHints: {
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  hintTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  hintItem: {
    fontSize: 11,
    color: '#94A3B8',
  },
  hintMet: {
    color: '#16A34A',
    fontWeight: '600',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#64748B',
  },
  linkText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
});
