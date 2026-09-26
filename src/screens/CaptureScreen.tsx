
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateAsync } from 'expo-local-authentication';
import MapView, { Marker } from 'react-native-maps';

// =====================================================
// TIPOS
// =====================================================

type Foto = {
  id: string;
  uri: string;
  data: string;
  latitude?: number;
  longitude?: number;
  endereco?: string;
};

type Props = {
  route?: {
    params?: {
      usuarioId?: string;
      nomeUsuario?: string;
    };
  };
  onLogout?: () => void;
};

type Aba = 'inicio' | 'localizacao' | 'historico';

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function temLocalizacao(foto: Foto): boolean {
  return (
    typeof foto.latitude === 'number' &&
    typeof foto.longitude === 'number' &&
    Number.isFinite(foto.latitude) &&
    Number.isFinite(foto.longitude)
  );
}

function formatarData(data: string): string {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return 'Data não disponível';
  }

  return valor.toLocaleString('pt-BR');
}

function formatarEndereco(foto: Foto): string {
  return foto.endereco?.trim() || 'Endereço não disponível';
}

async function autenticar() {
    try {
      const resultado = await authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: 'Autentique para confirmar que é você quem está em movimento',
      });

      return resultado.success;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return false;
    }
  }

async function obterEndereco(
  latitude: number,
  longitude: number
): Promise<string | undefined> {
  try {
    const enderecos = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (enderecos.length === 0) {
      return undefined;
    }

    const local = enderecos[0];

    const rua = local.street || local.name || '';
    const numero = local.streetNumber || '';
    const bairro = local.district || '';
    const cidade = local.city || local.subregion || '';
    const estado = local.region || '';

    const ruaNumero = [rua, numero]
      .filter(Boolean)
      .join(', ');

    const cidadeEstado = [cidade, estado]
      .filter(Boolean)
      .join(' - ');

    const endereco = [
      ruaNumero,
      bairro,
      cidadeEstado,
    ]
      .filter(Boolean)
      .join(', ');

    return endereco || undefined;
  } catch {
    return undefined;
  }
}

// =====================================================
// TELA PRINCIPAL
// =====================================================

export default function CaptureScreen({
  route,
  onLogout,
}: Props) {
  const usuarioId = route?.params?.usuarioId;

  const nomeUsuario =
    route?.params?.nomeUsuario || 'Usuário';

  // Cada usuário possui um histórico próprio.
  const storageKey = usuarioId
    ? `@tchaupreguica:fotos:${usuarioId}`
    : null;

  const [fotos, setFotos] = useState<Foto[]>([]);

  const [fotoPendente, setFotoPendente] =
    useState<string | null>(null);

  const [fotoSelecionada, setFotoSelecionada] =
    useState<Foto | null>(null);

  const [carregando, setCarregando] = useState(false);

  const [carregandoHistorico, setCarregandoHistorico] =
    useState(true);

  const [aba, setAba] = useState<Aba>('inicio');

  // ===================================================
  // CARREGAR HISTÓRICO DO USUÁRIO
  // ===================================================

  useEffect(() => {
    let ativo = true;

    setFotos([]);
    setFotoPendente(null);
    setFotoSelecionada(null);
    setCarregandoHistorico(true);

    async function carregarFotos() {
      if (!storageKey) {
        if (ativo) {
          setCarregandoHistorico(false);
        }

        return;
      }

      try {
        const dados = await AsyncStorage.getItem(
          storageKey
        );

        if (!ativo) return;

        const fotosSalvas: Foto[] = dados
          ? JSON.parse(dados)
          : [];

        if (!Array.isArray(fotosSalvas)) {
          setFotos([]);
          return;
        }

        // Converte o endereço das fotos antigas
        // que possuem coordenadas, mas não endereço.
        // O histórico original permanece disponível
        // mesmo que a conversão falhe.
        setFotos(fotosSalvas);
        setCarregandoHistorico(false);

        const precisaAtualizar = fotosSalvas.some(
          (foto) =>
            temLocalizacao(foto) &&
            !foto.endereco
        );

        if (!precisaAtualizar) return;

        const fotosAtualizadas = await Promise.all(
          fotosSalvas.map(async (foto) => {
            if (
              !temLocalizacao(foto) ||
              foto.endereco
            ) {
              return foto;
            }

            const endereco = await obterEndereco(
              foto.latitude!,
              foto.longitude!
            );

            return endereco
              ? { ...foto, endereco }
              : foto;
          })
        );

        if (!ativo) return;

        const houveMudanca = fotosAtualizadas.some(
          (foto, indice) =>
            foto.endereco !==
            fotosSalvas[indice].endereco
        );

        if (houveMudanca) {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify(fotosAtualizadas)
          );

          if (ativo) {
            setFotos(fotosAtualizadas);
          }
        }
      } catch {
        if (ativo) {
          Alert.alert(
            'Erro',
            'Não foi possível carregar seu histórico.'
          );
        }
      } finally {
        if (ativo) {
          setCarregandoHistorico(false);
        }
      }
    }

    carregarFotos();

    return () => {
      ativo = false;
    };
  }, [storageKey]);

  // ===================================================
  // SALVAR HISTÓRICO
  // ===================================================

  async function salvarHistorico(
    novasFotos: Foto[]
  ) {
    if (!storageKey) {
      throw new Error('Usuário não identificado.');
    }

    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(novasFotos)
    );

    setFotos(novasFotos);
  }

  // ===================================================
  // ABRIR CÂMERA
  // ===================================================

  async function abrirCamera() {
    if (!usuarioId) {
      Alert.alert(
        'Erro',
        'Faça login para registrar uma foto.'
      );

      return;
    }

    if (carregando || carregandoHistorico) {
      return;
    }

    try {
      const permissao =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Autorize o acesso à câmera nas configurações do celular.'
        );

        return;
      }

      const resultado =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.9,
        });

      if (
        !resultado.canceled &&
        resultado.assets.length > 0
      ) {
        setFotoPendente(
          resultado.assets[0].uri
        );
      }
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível abrir a câmera.'
      );
    }
  }

  // ===================================================
  // TIRAR NOVAMENTE
  // ===================================================

  async function tirarNovamente() {
    if (carregando) return;

    setFotoPendente(null);

    // Aguarda o fechamento da prévia antes
    // de abrir novamente a câmera no iPhone.
    setTimeout(() => {
      abrirCamera();
    }, 350);
  }

  // ===================================================
  // APROVAR FOTO
  // ===================================================

  async function aprovarFoto() {
    if (
      !fotoPendente ||
      !usuarioId ||
      !storageKey ||
      carregando
    ) {
      return;
    }

    setCarregando(true);

    let uriPermanente: string | null = null;
    let historicoSalvo = false;

    try {
      const id =
        `${Date.now()}-` +
        Math.random().toString(36).slice(2, 10);

      // Pasta exclusiva do usuário.
      const pasta =
        `${FileSystem.documentDirectory}` +
        `fotos/${usuarioId}/`;

      const informacoes =
        await FileSystem.getInfoAsync(pasta);

      if (!informacoes.exists) {
        await FileSystem.makeDirectoryAsync(
          pasta,
          { intermediates: true }
        );
      }

      uriPermanente = `${pasta}${id}.jpg`;

      // Salva a imagem permanentemente.
      await FileSystem.copyAsync({
        from: fotoPendente,
        to: uriPermanente,
      });

      const novaFoto: Foto = {
        id,
        uri: uriPermanente,
        data: new Date().toISOString(),
      };

      // Obtém as coordenadas e o endereço.
      // Se o GPS falhar, a foto ainda será salva.
      try {
        autenticar();
        const permissao =
          await Location.requestForegroundPermissionsAsync();

        if (permissao.granted) {
          const posicao =
            await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

          const latitude =
            posicao.coords.latitude;

          const longitude =
            posicao.coords.longitude;

          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {
            novaFoto.latitude = latitude;
            novaFoto.longitude = longitude;

            novaFoto.endereco =
              await obterEndereco(
                latitude,
                longitude
              );
          }
        }
      } catch {
        // A localização é opcional.
      }

      // Somente fotos aprovadas são salvas.
      await salvarHistorico([
        novaFoto,
        ...fotos,
      ]);

      historicoSalvo = true;

      setFotoPendente(null);
      setAba('inicio');

      Alert.alert(
        'Foto aprovada!',
        'Seu registro foi salvo com sucesso.'
      );
    } catch {
      if (
        uriPermanente &&
        !historicoSalvo
      ) {
        await FileSystem.deleteAsync(
          uriPermanente,
          { idempotent: true }
        ).catch(() => {});
      }

      Alert.alert(
        'Erro',
        'Não foi possível salvar a foto.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // EXCLUIR FOTO
  // ===================================================

  function confirmarExclusao(foto: Foto) {
    Alert.alert(
      'Excluir foto',
      'Deseja realmente excluir este registro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirFoto(foto),
        },
      ]
    );
  }

  async function excluirFoto(foto: Foto) {
    if (carregando) return;

    setCarregando(true);

    try {
      const novasFotos = fotos.filter(
        (item) => item.id !== foto.id
      );

      await salvarHistorico(novasFotos);

      setFotoSelecionada(null);

      try {
        await FileSystem.deleteAsync(
          foto.uri,
          { idempotent: true }
        );
      } catch {
        // A foto já saiu do histórico.
      }

      Alert.alert(
        'Registro excluído',
        'A foto foi removida do seu histórico.'
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível excluir a foto.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // ABRIR ENDEREÇO NO GOOGLE MAPS
  // ===================================================

  async function abrirLocalizacao(foto: Foto) {
    if (!temLocalizacao(foto)) {
      Alert.alert(
        'Localização indisponível',
        'Esta foto não possui localização registrada.'
      );

      return;
    }

    const latitude = foto.latitude!;
    const longitude = foto.longitude!;

    const url =
      'https://www.google.com/maps/search/?api=1' +
      `&query=${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o mapa.'
      );
    }
  }

  // ===================================================
  // CARTÃO DE FOTO
  // ===================================================

  function renderizarFoto({
    item,
  }: {
    item: Foto;
  }) {
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.uri }}
          style={styles.imagemCard}
          resizeMode="cover"
        />

        <View style={styles.conteudoCard}>
          <View style={styles.linhaLocalizacao}>
            <Ionicons
              name="location"
              size={20}
              color="#087BEE"
            />

            <Text style={styles.tituloCard}>
              LOCALIZAÇÃO
            </Text>
          </View>

          <Text style={styles.endereco}>
            {formatarEndereco(item)}
          </Text>

          <View style={styles.linhaData}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#777"
            />

            <Text style={styles.data}>
              {formatarData(item.data)}
            </Text>
          </View>

          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.botaoAcao}
              onPress={() =>
                abrirLocalizacao(item)
              }
              accessibilityLabel="Abrir no mapa"
            >
              <Ionicons
                name="location-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoAcao}
              onPress={() =>
                setFotoSelecionada(item)
              }
              accessibilityLabel="Visualizar foto"
            >
              <Ionicons
                name="eye-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoAcao,
                styles.botaoExcluir,
              ]}
              onPress={() =>
                confirmarExclusao(item)
              }
              accessibilityLabel="Excluir foto"
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ===================================================
  // ABAS
  // ===================================================

  const fotosExibidas =
    aba === 'localizacao'
      ? fotos.filter(temLocalizacao)
      : fotos;

  const tituloSecao =
    aba === 'historico'
      ? 'Histórico de registros'
      : aba === 'localizacao'
        ? 'Minhas localizações'
        : 'Meus registros';


// ===================================================
// REFAZER FOTO DE UM REGISTRO JÁ SALVO
// ===================================================

async function refazerFotoRegistro(foto: Foto) {
  if (!usuarioId || !storageKey || carregando) {
    return;
  }

  try {
    const permissao =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert(
        'Permissão necessária',
        'Autorize o acesso à câmera nas configurações do celular.'
      );

      return;
    }

    const resultado =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

    if (
      resultado.canceled ||
      resultado.assets.length === 0
    ) {
      return;
    }

    setCarregando(true);

    const novoId =
      `${Date.now()}-` +
      Math.random().toString(36).slice(2, 10);

    const pasta =
      `${FileSystem.documentDirectory}` +
      `fotos/${usuarioId}/`;

    const informacoes =
      await FileSystem.getInfoAsync(pasta);

    if (!informacoes.exists) {
      await FileSystem.makeDirectoryAsync(
        pasta,
        { intermediates: true }
      );
    }

    const novaUriPermanente = `${pasta}${novoId}.jpg`;

    // Copia o novo arquivo com um nome diferente do antigo,
    // pra evitar que o <Image> reaproveite do cache pelo
    // mesmo URI e continue mostrando a foto velha.
    await FileSystem.copyAsync({
      from: resultado.assets[0].uri,
      to: novaUriPermanente,
    });

    let fotoAtualizada: Foto = {
      ...foto,
      uri: novaUriPermanente,
      data: new Date().toISOString(),
    };

    // Atualiza a localização também, se possível.
    // Se falhar, mantém as coordenadas antigas.
    try {
      const permissaoLocalizacao =
        await Location.requestForegroundPermissionsAsync();

      if (permissaoLocalizacao.granted) {
        const posicao =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        const latitude = posicao.coords.latitude;
        const longitude = posicao.coords.longitude;

        if (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        ) {
          fotoAtualizada = {
            ...fotoAtualizada,
            latitude,
            longitude,
            endereco: await obterEndereco(
              latitude,
              longitude
            ),
          };
        }
      }
    } catch {
      // A localização é opcional.
    }

    const novasFotos = fotos.map((item) =>
      item.id === foto.id ? fotoAtualizada : item
    );

    await salvarHistorico(novasFotos);

    // Apaga o arquivo antigo só depois de tudo
    // ter sido salvo com sucesso.
    await FileSystem.deleteAsync(
      foto.uri,
      { idempotent: true }
    ).catch(() => {});

    setFotoSelecionada(fotoAtualizada);

    Alert.alert(
      'Foto atualizada!',
      'O registro foi atualizado com a nova foto.'
    );
  } catch {
    Alert.alert(
      'Erro',
      'Não foi possível tirar a foto novamente.'
    );
  } finally {
    setCarregando(false);
  }
}
  // ===================================================
  // INTERFACE PRINCIPAL
  // ===================================================

  return (
    <LinearGradient
      colors={[
        '#8050FF',
        '#527BB7',
        '#00B979',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.areaSegura}>

        {/* CABEÇALHO */}

        <View style={styles.cabecalho}>
          <View style={styles.linhaCabecalho}>
            <View style={styles.areaBoasVindas}>
              <Text style={styles.boasVindas}>
                Bem-vindo(a),
              </Text>

              <Text style={styles.nomeUsuario}>
                {nomeUsuario}!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botaoSair}
              onPress={onLogout}
              accessibilityLabel="Sair da conta"
            >
              <Ionicons
                name="log-out-outline"
                size={21}
                color="#fff"
              />

              <Text style={styles.textoSair}>
                Sair
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitulo}>
            Registre suas atividades com uma foto.
          </Text>

          <TouchableOpacity
            style={styles.botaoRegistrar}
            onPress={abrirCamera}
            disabled={
              carregando ||
              carregandoHistorico
            }
          >
            <Ionicons
              name="camera-outline"
              size={26}
              color="#fff"
            />

            <Text style={styles.textoRegistrar}>
              Registre aqui
            </Text>
          </TouchableOpacity>
        </View>

        {/* HISTÓRICO */}

        <View style={styles.areaPrincipal}>
          <View style={styles.linhaTitulo}>
            <Text style={styles.tituloSecao}>
              {tituloSecao}
            </Text>

            <View style={styles.contador}>
              <Text style={styles.textoContador}>
                {fotosExibidas.length}
              </Text>
            </View>
          </View>

          {carregandoHistorico ? (
            <View style={styles.estadoVazio}>
              <ActivityIndicator
                size="large"
                color="#fff"
              />

              <Text style={styles.textoVazioSecundario}>
                Carregando seus registros...
              </Text>
            </View>
          ) : fotosExibidas.length === 0 ? (
            <View style={styles.estadoVazio}>
              <Ionicons
                name={
                  aba === 'localizacao'
                    ? 'location-outline'
                    : 'images-outline'
                }
                size={68}
                color="#fff"
              />

              <Text style={styles.textoVazio}>
                {aba === 'localizacao'
                  ? 'Nenhuma localização registrada.'
                  : 'Você ainda não possui registros.'}
              </Text>

              <Text style={styles.textoVazioSecundario}>
                {aba === 'localizacao'
                  ? 'As fotos com localização aparecerão aqui.'
                  : 'Toque em "Registre aqui" para começar.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={fotosExibidas}
              keyExtractor={(item) => item.id}
              renderItem={renderizarFoto}
              contentContainerStyle={styles.lista}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* PRÉVIA DA FOTO */}

        <Modal
          visible={fotoPendente !== null}
          animationType="slide"
          onRequestClose={() => {
            if (!carregando) {
              setFotoPendente(null);
            }
          }}
        >
          <View style={styles.modal}>
            <Text style={styles.tituloModal}>
              Confira sua foto
            </Text>

            {fotoPendente && (
              <Image
                source={{
                  uri: fotoPendente,
                }}
                style={styles.imagemPrevia}
                resizeMode="contain"
              />
            )}

            <TouchableOpacity
              style={styles.botaoRefazer}
              onPress={tirarNovamente}
              disabled={carregando}
            >
              <Ionicons
                name="refresh"
                size={23}
                color="#fff"
              />

              <Text style={styles.textoBotao}>
                Tirar novamente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoAprovar}
              onPress={aprovarFoto}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="#fff"
                  />

                  <Text style={styles.textoBotao}>
                    Aprovar foto
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setFotoPendente(null)
              }
              disabled={carregando}
            >
              <Text style={styles.textoCancelar}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* DETALHES DA FOTO */}

        <Modal
          visible={fotoSelecionada !== null}
          animationType="slide"
          onRequestClose={() =>
            setFotoSelecionada(null)
          }
        >
          <ScrollView
            style={styles.modal}
            contentContainerStyle={styles.detalhes}
          >
            <Text style={styles.tituloModal}>
              Detalhes do registro
            </Text>

            {fotoSelecionada && (
              <>
                <Image
                  source={{
                    uri: fotoSelecionada.uri,
                  }}
                  style={styles.imagemDetalhes}
                  resizeMode="contain"
                />

                <Text style={styles.rotuloDetalhe}>
                  Data e hora
                </Text>

                <Text style={styles.valorDetalhe}>
                  {formatarData(
                    fotoSelecionada.data
                  )}
                </Text>

                <Text style={styles.rotuloDetalhe}>
                  Endereço
                </Text>

                <Text style={styles.valorDetalhe}>
                  {formatarEndereco(
                    fotoSelecionada
                  )}
                </Text>
                
                <View style={styles.container}>
                  <MapView 
                    loadingEnabled={true}
                    style={styles.map}
                    initialRegion={{
                      latitude: Number(fotoSelecionada.latitude),
                      longitude: Number(fotoSelecionada.longitude),
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: Number(fotoSelecionada.latitude), longitude: Number(fotoSelecionada.longitude) }}
                      title="Meu ponto"
                      description="Descrição opcional"
                    />
                  </MapView>
                </View>
                    
                <TouchableOpacity
                  style={styles.botaoNovaFoto}
                  onPress={() => refazerFotoRegistro(fotoSelecionada)}
                  disabled={carregando}
                  >
                  
                  <Ionicons
                    name="refresh"
                    size={23}
                    color="#fff"
                  />

                  <Text style={styles.textoBotao}>
                    Tirar novamente
                  </Text>
                </TouchableOpacity>

                {temLocalizacao(
                  fotoSelecionada
                ) && (
                  <TouchableOpacity
                    style={styles.botaoMapa}
                    onPress={() =>
                      abrirLocalizacao(
                        fotoSelecionada
                      )
                    }
                  >
                    <Ionicons
                      name="map-outline"
                      size={22}
                      color="#fff"
                    />

                    <Text style={styles.textoBotao}>
                      Abrir no mapa
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.botaoFechar}
                  onPress={() =>
                    setFotoSelecionada(null)
                  }
                >
                  <Text style={styles.textoBotao}>
                    Fechar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 100,
  },

  areaSegura: {
    flex: 1,
  },

  cabecalho: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 24,
  },

  linhaCabecalho: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },

  areaBoasVindas: {
    flex: 1,
  },

  boasVindas: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
  },

  nomeUsuario: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 2,
  },

  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF90',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  textoSair: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  subtitulo: {
    color: '#F2EFFF',
    fontSize: 15,
    marginTop: 12,
    marginBottom: 25,
  },

  botaoRegistrar: {
    backgroundColor: '#087BEE',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
  },

  textoRegistrar: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
  },

  areaPrincipal: {
    flex: 1,
    paddingHorizontal: 20,
  },

  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  tituloSecao: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
  },

  contador: {
    backgroundColor: '#FFFFFF35',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  textoContador: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  lista: {
    paddingBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 4,
  },

  imagemCard: {
    width: '100%',
    height: 205,
    backgroundColor: '#EAEAEA',
  },

  conteudoCard: {
    padding: 16,
  },

  linhaLocalizacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  tituloCard: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#292929',
  },

  endereco: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    lineHeight: 21,
  },

  linhaData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },

  data: {
    fontSize: 13,
    color: '#777',
  },

  acoes: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
  },

  botaoAcao: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: '#087BEE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoExcluir: {
    backgroundColor: '#E84855',
  },

  estadoVazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  textoVazio: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },

  textoVazioSecundario: {
    color: '#F1F1F1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },

  barraInferior: {
    backgroundColor: '#0869D7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 15,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  itemNavegacao: {
    alignItems: 'center',
    gap: 5,
    minWidth: 80,
  },

  textoNavegacao: {
    color: '#fff',
    fontSize: 12,
  },

  modal: {
    flex: 1,
    backgroundColor: '#201C35',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 30,
  },

  tituloModal: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },

  imagemPrevia: {
    width: '100%',
    flex: 1,
    marginBottom: 24,
  },

  botaoRefazer: {
    backgroundColor: '#697386',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },

  botaoAprovar: {
    backgroundColor: '#00A86B',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  textoBotao: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  textoCancelar: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },

  detalhes: {
    paddingBottom: 45,
  },

  imagemDetalhes: {
    width: '100%',
    height: 350,
    marginBottom: 20,
  },

  rotuloDetalhe: {
    color: '#A7A0BF',
    fontSize: 14,
    marginTop: 15,
  },

  valorDetalhe: {
    color: '#fff',
    fontSize: 17,
    marginTop: 5,
    lineHeight: 25,
  },

  botaoNovaFoto: {
    backgroundColor: '#697386',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 25,
  },

  botaoMapa: {
    backgroundColor: '#00A86B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },

  botaoFechar: {
    backgroundColor: '#087BEE',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
    marginBottom:40,
  },
});