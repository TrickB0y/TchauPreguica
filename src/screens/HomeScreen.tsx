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
  FlatList,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';

interface FotoData {
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  id: number;
}

export default function CaptureScreen() {
  const [foto, setFoto] = useState<FotoData | null>(null);
  const [historicoFotos, setHistoricoFotos] = useState<FotoData[]>([]);
  const [gps, setGps] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [fotoSelecionadaModal, setFotoSelecionadaModal] = useState<FotoData | null>(null);

  // Tirar Foto
  const tirarFoto = async () => {
    setCarregando(true);
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();

      if (permissao.status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Você precisa permitir acesso à câmera nas configurações do celular.'
        );
        setCarregando(false);
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!resultado.cancelled && resultado.assets && resultado.assets[0]) {
        const novaFoto: FotoData = {
          uri: resultado.assets[0].uri,
          latitude: gps?.latitude,
          longitude: gps?.longitude,
          timestamp: new Date().toLocaleString('pt-BR'),
          id: Date.now(),
        };

        // Adicionar ao histórico
        setHistoricoFotos([...historicoFotos, novaFoto]);

        // Usar como foto atual
        setFoto(novaFoto);

        Alert.alert('Sucesso', `📷 Foto capturada! Total: ${historicoFotos.length + 1}`);
      }
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      Alert.alert(
        'Erro',
        `Erro ao tirar foto: ${error.message || 'Tente novamente'}`
      );
    } finally {
      setCarregando(false);
    }
  };

  // Abrir modal com foto e localização
  const abrirModal = (fotoData: FotoData) => {
    setFotoSelecionadaModal(fotoData);
    setModalVisivel(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalVisivel(false);
    setTimeout(() => setFotoSelecionadaModal(null), 300);
  };

  // Selecionar foto do histórico
  const selecionarFoto = (fotoSelecionada: FotoData) => {
    setFoto(fotoSelecionada);
    setGps({
      latitude: fotoSelecionada.latitude,
      longitude: fotoSelecionada.longitude,
    });
    Alert.alert('Sucesso', '✅ Foto selecionada!');
  };

  // Deletar foto do histórico
  const deletarFoto = (id: number) => {
    Alert.alert('Confirmar', 'Deseja deletar esta foto?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Deletar',
        onPress: () => {
          const novoHistorico = historicoFotos.filter((f) => f.id !== id);
          setHistoricoFotos(novoHistorico);

          // Se deletou a foto atual, seleciona a primeira do histórico
          if (foto?.id === id) {
            setFoto(novoHistorico.length > 0 ? novoHistorico[0] : null);
          }

          fecharModal();
          Alert.alert('Deletado', '🗑️ Foto removida do histórico');
        },
      },
    ]);
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

  // Salvar Atividade
  const salvarAtividade = () => {
    if (!foto) {
      Alert.alert('Erro', 'Selecione uma foto primeiro!');
      return;
    }

    if (!gps) {
      Alert.alert('Erro', 'Obtenha sua localização primeiro!');
      return;
    }

    Alert.alert('Sucesso', '✅ Atividade registrada com sucesso!');

    // Limpar formulário
    setFoto(null);
    setHistoricoFotos([]);
    setGps(null);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.titulo}>Registrar Movimento</Text>

        {carregando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {/* Seção Foto Atual */}
        <View style={styles.card}>
          <Text style={styles.subtitulo}>📷 Foto Atual</Text>

          {foto && (
            <TouchableOpacity onPress={() => abrirModal(foto)}>
              <Image
                source={{ uri: foto.uri }}
                style={styles.preview}
              />
              <Text style={styles.previewHint}>Toque para visualizar em grande</Text>
            </TouchableOpacity>
          )}

          {!foto && (
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyText}>Nenhuma foto selecionada</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#5AC8FA' }]}
            onPress={tirarFoto}
            disabled={carregando}
          >
            <Text style={styles.buttonText}>📸 Tirar Nova Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Histórico de Fotos */}
        {historicoFotos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitulo}>
              🖼️ Histórico de Fotos ({historicoFotos.length})
            </Text>

            <FlatList
              data={historicoFotos}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.fotoItem}>
                  <TouchableOpacity
                    onPress={() => abrirModal(item)}
                    style={[
                      styles.fotoThumbnail,
                      foto?.id === item.id && styles.fotoSelecionada,
                    ]}
                  >
                    <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                    {foto?.id === item.id && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.fotoActions}>
                    <TouchableOpacity
                      onPress={() => selecionarFoto(item)}
                      style={styles.selectButton}
                    >
                      <Text style={styles.selectButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletarFoto(item.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.fotoNumber}>#{index + 1}</Text>
                </View>
              )}
            />
          </View>
        )}

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
            disabled={carregando || !foto}
          >
            <Text style={styles.buttonText}>✅ Autenticar e Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Resumo */}
        <View style={[styles.card, { backgroundColor: '#f0f0f0' }]}>
          <Text style={styles.subtitulo}>📝 Resumo</Text>
          <Text style={styles.infoText}>
            ✅ Fotos: {historicoFotos.length} capturadas
          </Text>
          <Text style={styles.infoText}>
            ✅ Foto Selecionada: {foto ? 'Sim' : 'Não'}
          </Text>
          <Text style={styles.infoText}>
            ✅ GPS: {gps ? 'Capturado' : 'Pendente'}
          </Text>
          <Text style={styles.infoText}>
            ✅ Biometria: Necessária para confirmar
          </Text>
        </View>
      </ScrollView>

      {/* MODAL DA FOTO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={styles.modalContainer}>
          {/* Fundo semi-transparente */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={fecharModal}
          />

          {/* Conteúdo do Modal */}
          <View style={styles.modalContent}>
            {/* Fechar */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={fecharModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Foto em Grande */}
            {fotoSelecionadaModal && (
              <>
                <Image
                  source={{ uri: fotoSelecionadaModal.uri }}
                  style={styles.modalImage}
                />

                {/* Informações */}
                <View style={styles.modalInfo}>
                  <Text style={styles.modalTitle}>📸 Detalhes da Foto</Text>

                  {/* Timestamp */}
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>⏰ Horário:</Text>
                    <Text style={styles.infoValue}>{fotoSelecionadaModal.timestamp}</Text>
                  </View>

                  {/* GPS */}
                  {fotoSelecionadaModal.latitude && fotoSelecionadaModal.longitude ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>📍 Latitude:</Text>
                        <Text style={styles.infoValue}>
                          {fotoSelecionadaModal.latitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>📍 Longitude:</Text>
                        <Text style={styles.infoValue}>
                          {fotoSelecionadaModal.longitude.toFixed(4)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.infoLabel, { color: '#999' }]}>
                      ⚠️ Localização não capturada
                    </Text>
                  )}

                  {/* Botões de Ação */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
                      onPress={() => {
                        selecionarFoto(fotoSelecionadaModal);
                        fecharModal();
                      }}
                    >
                      <Text style={styles.modalButtonText}>✓ Usar Esta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => deletarFoto(fotoSelecionadaModal.id)}
                    >
                      <Text style={styles.modalButtonText}>🗑️ Deletar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
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
    marginBottom: 5,
  },
  previewHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
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
  // Estilos do Histórico de Fotos
  fotoItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  fotoThumbnail: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  fotoSelecionada: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  fotoActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    width: 35,
    height: 35,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 35,
    height: 35,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  fotoNumber: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  // Estilos do Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  modalInfo: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
