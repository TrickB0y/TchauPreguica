import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CaptureScreen() {
  const [foto, setFoto] = useState<string | null>(null);
  const [gps, setGps] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);

  // Tirar Foto
  const tirarFoto = async () => {
    setCarregando(true);
    try {
      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!resultado.cancelled && resultado.assets && resultado.assets[0]) {
        setFoto(resultado.assets[0].uri);
        Alert.alert('Sucesso', '📷 Foto capturada!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao tirar foto');
    } finally {
      setCarregando(false);
    }
  };

  // Obter GPS
  const obterGPS = async () => {
    setCarregando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de localização negada');
        setCarregando(false);
        return;
      }

      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setGps({
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
      });

      Alert.alert('Sucesso', '📍 Localização capturada!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao obter localização');
    } finally {
      setCarregando(false);
    }
  };

  // Autenticar com Biometria
  const autenticarBiometria = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert('Erro', 'Biometria não disponível neste dispositivo');
        return;
      }

      const resultado = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Confirme que é você quem está se movimentando',
      });

      if (resultado.success) {
        Alert.alert('Sucesso', '✅ Autenticação biométrica confirmada!');
        salvarAtividade();
      } else {
        Alert.alert('Erro', 'Autenticação falhou');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro na autenticação');
    }
  };

  // Depois substitua a função salvarAtividade por:
  const salvarAtividade = async () => {
    try {
      const atividade = {
        id: Date.now(),
        data: new Date().toISOString(),
        foto,
        latitude: gps.latitude,
        longitude: gps.longitude,
        situacao: 'Movimento Registrado',
      };

      // Obter atividades existentes
      const listaJson = await AsyncStorage.getItem('@TchauPreguica:atividades');
      const lista = listaJson ? JSON.parse(listaJson) : [];

      // Adicionar nova atividade
      lista.push(atividade);

      // Salvar no storage
      await AsyncStorage.setItem('@TchauPreguica:atividades', JSON.stringify(lista));

      Alert.alert('Sucesso', '✅ Atividade salva com sucesso!');

      // Limpar formulário
      setFoto(null);
      setGps(null);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar atividade');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Registrar Movimento</Text>

      {carregando && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Seção Foto */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>📷 Foto</Text>

        {foto && (
          <Image
            source={{ uri: foto }}
            style={styles.preview}
          />
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#5AC8FA' }]}
          onPress={tirarFoto}
          disabled={carregando}
        >
          <Text style={styles.buttonText}>
            {foto ? 'Tirar outra foto' : 'Tirar Foto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Seção GPS */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>📍 Localização</Text>

        {gps && (
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsText}>✅ Latitude: {gps.latitude.toFixed(4)}</Text>
            <Text style={styles.gpsText}>✅ Longitude: {gps.longitude.toFixed(4)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#5AC8FA' }]}
          onPress={obterGPS}
          disabled={carregando}
        >
          <Text style={styles.buttonText}>Obter Localização</Text>
        </TouchableOpacity>
      </View>

      {/* Seção Biometria e Salvar */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>👤 Autenticação</Text>
        <Text style={styles.infoText}>
          Confirme com sua biometria (impressão digital ou rosto)
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#34C759' }]}
          onPress={autenticarBiometria}
          disabled={carregando}
        >
          <Text style={styles.buttonText}>✅ Autenticar e Salvar</Text>
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View style={[styles.card, { backgroundColor: '#f0f0f0' }]}>
        <Text style={styles.subtitulo}>📝 Resumo</Text>
        <Text style={styles.infoText}>
          ✅ Foto: {foto ? 'Capturada' : 'Pendente'}
        </Text>
        <Text style={styles.infoText}>
          ✅ GPS: {gps ? 'Capturado' : 'Pendente'}
        </Text>
        <Text style={styles.infoText}>
          ✅ Biometria: Necessária para confirmar
        </Text>
      </View>
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
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
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
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  gpsInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  gpsText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});