import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '../services/api';
import { Notification } from '../types';
import { EmptyState, LoadingScreen } from '../components';

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (pageNum = 1, append = false) => {
    try {
      const response = await notificationsAPI.getAll(pageNum);
      const { data, pagination } = response.data;
      if (append) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setHasMore(pageNum < pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={18} color="#fff" />
          <Text style={styles.markAllText}>Marcar todo como leído</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.read && styles.unread]}
            onPress={() => handleMarkRead(item.id)}
          >
            <View style={[styles.iconContainer, !item.read && styles.iconUnread]}>
              <Ionicons
                name={
                  item.type === 'song_key_change' ? 'musical-notes' :
                  item.type === 'service_confirmed' ? 'checkmark-circle' :
                  'notifications'
                }
                size={20} color="#5B5EA6"
              />
            </View>
            <View style={styles.content}>
              <Text style={[styles.message, !item.read && styles.messageUnread]}>
                {item.message}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadNotifications(1);
          }} />
        }
        onEndReached={() => {
          if (hasMore && !loading) loadNotifications(page + 1, true);
        }}
        ListEmptyComponent={
          <EmptyState icon="notifications-off-outline" message="Sin notificaciones" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B5EA6',
    padding: 10,
  },
  markAllText: { color: '#fff', marginLeft: 6, fontSize: 14, fontWeight: '600' },
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  unread: { backgroundColor: '#f0f0ff' },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  iconUnread: { backgroundColor: '#e0e0ff' },
  content: { flex: 1 },
  message: { fontSize: 14, color: '#333', lineHeight: 20 },
  messageUnread: { fontWeight: '600' },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#5B5EA6', marginLeft: 8,
  },
});
