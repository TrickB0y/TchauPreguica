import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Picker,
  ActivityIndicator,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../styles/colors';
import BiometriaService from '../services/BiometriaService';
import GPSService from '../services/GPSService';
import CameraService from '../services/CameraService';
import StorageService from '../services/StorageService';
import { STORAGE_KEYS, SITUACOES } from '../utils/constants';

export default function CaptureScreen({ navigation }) {
  const [foto, setFoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [situacao, setSituacao] = useState(SITUACOES[0]);
  const [carregando, setCarregando] = useState(false);

  const capturarFoto = async () => {
    setCarregando(true);
    try {
      const fotoUri = await CameraService.tirarFoto();
      if (fotoUri) {
        setFoto(fotoUri);
        Alert.alert('Sucesso', '📷 Foto capturada!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao capturar foto');
    } finally {
      setCarregando(false);
    }
  };

  const obterGPS = async () => {
    setCarregando(true);
    try {
      const localizacao = await GPSService.obterLocalizacao();
      if (localizacao) {
        setGps(localizacao);
        Alert.alert('Sucesso', '📍 Localização capturada!');
      } else {
        Alert.alert('Erro', 'Não foi possível obter localização');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao obter localização');
    } finally {
      setCarregando(false);
    }
  };

  const salvarAtividade = async () => {
    if (!foto) {
      Alert.alert('Erro', 'Capture uma foto primeiro!');
      return;
    }

    if (!gps) {
      Alert.alert('Erro', 'Obtenha sua localização primeiro!');
      return;
    }

    setCarregando(true);
    try {
      // Autenticar com biometria
      const autenticado = await BiometriaService.autenticar();
      if (!autenticado) {
        Alert.alert('Erro', 'Autenticação biométrica falhou');
        setCarregando(false);
        return;
      }

      // Criar objeto de atividade
      const atividade = {
        id: Date.now(),
        situacao,
        data: new Date().toISOString(),
        foto,
        latitude: gps.latitude,
        longitude: gps.longitude,
        precisao: gps.precisao,
      };

      // Salvar no storage
      const sucesso = await StorageService.adicionarLista(
        STORAGE_KEYS.ATIVIDADES,
        atividade
      );

      if (sucesso) {
        Alert.alert('Sucesso', '✅ Atividade registrada com sucesso!');
        // Limpar formulário
        setFoto(null);
        setGps(null);
        setSituacao(SITUACOES[0]);
        // Voltar para home
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro', 'Erro ao salvar atividade');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao processar atividade');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={globalStyles.titulo}>Registrar Movimento</Text>

      {carregando && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Foto */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.subtitulo}>📷 Foto</Text>
        {foto && (
          <Image
            source={{ uri: foto }}
            style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }}
          />
        )}
        <TouchableOpacity
          style={[globalStyles.button, { backgroundColor: COLORS.secondary }]}
          onPress={capturarFoto}
          disabled={carregando}
        >
          <Text style={globalStyles.buttonText}>
            {foto ? 'Tirar outra foto' : 'Tirar Foto'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* GPS */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.subtitulo}>📍 Localização</Text>
        {gps && (
          <>
            <Text style={{ fontSize: 12, color: COLORS.success, marginBottom: 5 }}>
              ✅ Latitude: {gps.latitude.toFixed(4)}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.success, marginBottom: 10 }}>
              ✅ Longitude: {gps.longitude.toFixed(4)}
            </Text>
          </>
        )}
        <TouchableOpacity
          style={[globalStyles.button, { backgroundColor: COLORS.secondary }]}
          onPress={obterGPS}
          disabled={carregando}
        >
          <Text style={globalStyles.buttonText}>Obter Localização</Text>
        </TouchableOpacity>
      </View>

      {/* Situação */}
      <View style={globalStyles.card}>
        <Text style={globalStyles.subtitulo}>🏃 Tipo de Movimento</Text>
        <Picker
          selectedValue={situacao}
          style={globalStyles.input}
          onValueChange={(itemValue) => setSituacao(itemValue)}
        >
          {SITUACOES.map((sit) => (
            <Picker.Item key={sit} label={sit} value={sit} />
          ))}
        </Picker>
      </View>

      {/* Botão Salvar */}
      <TouchableOpacity
        style={[globalStyles.button, { backgroundColor: COLORS.success }]}
        onPress={salvarAtividade}
        disabled={carregando}
      >
        <Text style={globalStyles.buttonText}>
          {carregando ? 'Processando...' : '✅ Salvar Atividade'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}