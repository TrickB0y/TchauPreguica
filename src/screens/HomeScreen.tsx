import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }: any) {
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
      setAtividades(lista);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>🚀 TchauPreguica</Text>

      <View style={styles.card}>
        <Text style={styles.subtitulo}>Bem-vindo!</Text>
        <Text style={styles.texto}>
          Registre seus movimentos diários. Tire fotos, compartilhe sua localização
          e continue em movimento! 💪
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#34C759' }]}
        onPress={() => navigation.navigate('Captura')}
      >
        <Text style={styles.buttonText}>📸 Registrar Movimento</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.subtitulo}>📊 Estatísticas</Text>
        <Text style={styles.statsText}>Total de registros: {atividades.length}</Text>

        {atividades.length > 0 && (
          <>
            <Text style={[styles.statsText, { marginTop: 10 }]}>
              📍 Último registro: {new Date(atividades[atividades.length - 1].data).toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.statsText}>
              Lat: {atividades[atividades.length - 1].latitude.toFixed(4)}
            </Text>
            <Text style={styles.statsText}>
              Long: {atividades[atividades.length - 1].longitude.toFixed(4)}
            </Text>
          </>
        )}
      </View>

      {atividades.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>👀 Nenhuma atividade registrada</Text>
          <Text style={styles.emptySubtext}>
            Comece registrando seu primeiro movimento!
          </Text>
        </View>
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
    marginBottom: 30,
    marginTop: 20,
    textAlign: 'center',
    color: '#333',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  texto: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
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
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 14,
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