import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../styles/colors';
import BiometriaService from '../services/BiometriaService';
import StorageService from '../services/StorageService';
import { STORAGE_KEYS } from '../utils/constants';

export default function HomeScreen({ navigation }) {
  const [temBiometria, setTemBiometria] = useState(false);
  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    verificarBiometria();
    carregarAtividades();

    const unsubscribe = navigation.addListener('focus', () => {
      carregarAtividades();
    });

    return unsubscribe;
  }, [navigation]);

  const verificarBiometria = async () => {
    const disponivel = await BiometriaService.verificarDisponibilidade();
    setTemBiometria(disponivel);
  };

  const carregarAtividades = async () => {
    const lista = await StorageService.obterLista(STORAGE_KEYS.ATIVIDADES);
    setAtividades(lista);
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.titulo}>🚀 TchauPreguica</Text>

      <View style={globalStyles.card}>
        <Text style={globalStyles.subtitulo}>Bem-vindo!</Text>
        <Text style={{ fontSize: 14, color: COLORS.darkGray, lineHeight: 22 }}>
          Registre seus movimentos diários. Tire fotos, compartilhe sua localização
          e continue em movimento! 💪
        </Text>
      </View>

      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: COLORS.success }]}
        onPress={() => navigation.navigate('Captura')}
      >
        <Text style={globalStyles.buttonText}>📸 Registrar Movimento</Text>
      </TouchableOpacity>

      {temBiometria && (
        <View style={globalStyles.card}>
          <Text style={{ color: COLORS.success, fontWeight: 'bold' }}>
            ✅ Biometria disponível
          </Text>
        </View>
      )}

      <View style={globalStyles.card}>
        <Text style={globalStyles.subtitulo}>Últimos Registros ({atividades.length})</Text>
        {atividades.length === 0 ? (
          <Text style={{ color: COLORS.darkGray }}>Nenhum registro ainda</Text>
        ) : (
          atividades.slice(-3).reverse().map((atividade, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>
                {atividade.situacao}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.darkGray }}>
                {new Date(atividade.data).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}