import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Ionicons name="warning" size={48} color="#f44336" />
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.message}>{this.state.error?.message || 'Error inesperado'}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={styles.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 12 },
  message: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btn: { backgroundColor: '#5B5EA6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
