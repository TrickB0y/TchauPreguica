import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../styles/colors';
import StorageService from '../services/StorageService';
import { STORAGE_KEYS } from '../utils/constants';

export default function HistoryScreen({ navigation }) {
  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    carregarAtividades();

    const unsubscribe = navigation.addListener('focus', () => {
      carregarAtividades();
    });

    return unsubscribe;
  }, [navigation]);

  const carregarAtividades = async () => {
    const lista = await StorageService.obterLista(STORAGE_KEYS.ATIVIDADES);
    setAtividades(lista.reverse());
  };

  const deletarAtividade = async (id) => {
    Alert.alert('Confirmar', 'Deseja deletar este registro?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Deletar',
        onPress: async () => {
          const lista = await StorageService.obterLista(STORAGE_KEYS.ATIVIDADES);
          const listaAtualizada = lista.filter((a) => a.id !== id);
          await StorageService.salvar(STORAGE_KEYS.ATIVIDADES, listaAtualizada);
          carregarAtividades();
        },
      },
    ]);
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.titulo}>📋 Histórico</Text>

      {atividades.length === 0 ? (
        <View style={globalStyles.centerContainer}>
          <Text style={{ fontSize: 18, color: COLORS.darkGray }}>
            Nenhuma atividade registrada
          </Text>
        </View>
      ) : (
        atividades.map((atividade) => (
          <View key={atividade.id} style={globalStyles.card}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {atividade.situacao}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
                  {new Date(atividade.data).toLocaleString('pt-BR')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deletarAtividade(atividade.id)}>
                <Text style={{ color: COLORS.danger, fontWeight: 'bold', fontSize: 20 }}>
                  🗑️
                </Text>
              </TouchableOpacity>
            </View>

            {atividade.foto && (
              <Image
                source={{ uri: atividade.foto }}
                style={{ width: '100%', height: 150, borderRadius: 8, marginBottom: 10 }}
              />
            )}

            <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
              📍 Lat: {atividade.latitude.toFixed(4)} | Long: {atividade.longitude.toFixed(4)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}