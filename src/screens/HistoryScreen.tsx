import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen({ navigation }: any) {
  const [atividades, setAtividades] = useState<any[]>([]);
  const [atualizando, setAtualizando] = useState(false);

  // Carregar atividades
  useEffect(() => {
    carregarAtividades();

    // Recarregar quando voltar para esta tela
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAtividades();
    });

    return unsubscribe;
  }, [navigation]);

  const carregarAtividades = async () => {
    try {
      setAtualizando(true);
      const listaJson = await AsyncStorage.getItem('@TchauPreguica:atividades');
      const lista = listaJson ? JSON.parse(listaJson) : [];
      // Reverter para mostrar mais recentes primeiro
      setAtividades(lista.reverse());
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setAtualizando(false);
    }
  };

  const deletarAtividade = async (id: number) => {
    Alert.alert('Confirmar', 'Deseja deletar este registro?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Deletar',
        onPress: async () => {
          try {
            const listaJson = await AsyncStorage.getItem('@TchauPreguica:atividades');
            const lista = listaJson ? JSON.parse(listaJson) : [];
            const listaAtualizada = lista.filter((a: any) => a.id !== id);
            await AsyncStorage.setItem('@TchauPreguica:atividades', JSON.stringify(listaAtualizada));
            carregarAtividades();
            Alert.alert('Sucesso', '✅ Registro deletado!');
          } catch (error) {
            Alert.alert('Erro', 'Erro ao deletar');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>📋 Histórico</Text>

      {atividades.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>📭 Nenhuma atividade registrada</Text>
          <Text style={styles.emptySubtext}>
            Comece registrando seu primeiro movimento!
          </Text>
        </View>
      ) : (
        atividades.map((atividade, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{atividade.situacao}</Text>
                <Text style={styles.cardDate}>
                  {new Date(atividade.data).toLocaleString('pt-BR')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deletarAtividade(atividade.id)}>
                <Text style={styles.deleteButton}>🗑️</Text>
              </TouchableOpacity>
            </View>

            {atividade.foto && (
              <Image
                source={{ uri: atividade.foto }}
                style={styles.preview}
              />
            )}

            <View style={styles.gpsInfo}>
              <Text style={styles.gpsText}>
                📍 Latitude: {atividade.latitude.toFixed(4)}
              </Text>
              <Text style={styles.gpsText}>
                📍 Longitude: {atividade.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  deleteButton: {
    fontSize: 20,
    padding: 5,
  },
  preview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  gpsInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  gpsText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    marginBottom: 15,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});