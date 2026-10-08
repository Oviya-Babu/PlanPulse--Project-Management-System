import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors } from '../theme';

interface NetworkErrorBannerProps {
  onRetry: () => void;
  message?: string;
}

export const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({
  onRetry,
  message = 'Unable to connect. Please check your internet connection and try again.',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Button
        mode="contained-tonal"
        compact
        onPress={onRetry}
        buttonColor="#FEE2E2"
        textColor={colors.error}
        style={styles.retryButton}
      >
        Retry
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  message: {
    flex: 1,
    color: '#991B1B',
    fontSize: 12,
    lineHeight: 16,
  },
  retryButton: {
    borderRadius: 6,
  },
});
