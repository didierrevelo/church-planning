import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '../utils/useDebounce';
import { searchAPI } from '../services/api';
import { EmptyState } from '../components';

interface SearchResults {
  services: any[];
  songs: any[];
  members: any[];
  ministries: any[];
}

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ services: [], songs: [], members: [], ministries: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ services: [], songs: [], members: [], ministries: [] });
      setSearched(false);
      return;
    }
    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchAPI.search(debouncedQuery);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [debouncedQuery]);

  const totalResults = results.services.length + results.songs.length + results.members.length + results.ministries.length;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar servicios, canciones, miembros..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5B5EA6" style={{ marginTop: 40 }} />
      ) : searched && totalResults === 0 ? (
        <EmptyState icon="search-outline" message={`No se encontraron resultados para "${query}"`} />
      ) : (
        <FlatList
          data={[
            ...results.services.map((s: any) => ({ ...s, _type: 'service' })),
            ...results.songs.map((s: any) => ({ ...s, _type: 'song' })),
            ...results.members.map((m: any) => ({ ...m, _type: 'member' })),
            ...results.ministries.map((m: any) => ({ ...m, _type: 'ministry' })),
          ]}
          keyExtractor={(item: any) => `${item._type}-${item.id}`}
          renderItem={({ item }: any) => {
            switch (item._type) {
              case 'service':
                return (
                  <TouchableOpacity style={styles.resultItem} onPress={() => navigation.navigate('ServiceDetail', { serviceId: item.id })}>
                    <Ionicons name="calendar" size={20} color="#5B5EA6" />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSub}>{new Date(item.date).toLocaleDateString('es-ES')} · {item.status}</Text>
                    </View>
                  </TouchableOpacity>
                );
              case 'song':
                return (
                  <TouchableOpacity style={styles.resultItem}>
                    <Ionicons name="musical-note" size={20} color="#5B5EA6" />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      {item.key && <Text style={styles.resultSub}>Tono: {item.key}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              case 'member':
                return (
                  <View style={styles.resultItem}>
                    <Ionicons name="person" size={20} color="#5B5EA6" />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>{item.user?.name}</Text>
                      <Text style={styles.resultSub}>Rol: {item.role}</Text>
                    </View>
                  </View>
                );
              case 'ministry':
                return (
                  <View style={styles.resultItem}>
                    <Ionicons name="people" size={20} color="#5B5EA6" />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle}>{item.name}</Text>
                      <Text style={styles.resultSub}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
                    </View>
                  </View>
                );
              default:
                return null;
            }
          }}
          ListHeaderComponent={
            searched ? (
              <Text style={styles.countText}>{totalResults} resultado{totalResults !== 1 ? 's' : ''}</Text>
            ) : null
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 16, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  list: { paddingBottom: 40 },
  countText: { fontSize: 13, color: '#999', marginHorizontal: 16, marginBottom: 8 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 6,
    padding: 14, borderRadius: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
  },
  resultContent: { marginLeft: 12, flex: 1 },
  resultTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  resultSub: { fontSize: 12, color: '#999', marginTop: 2 },
});
