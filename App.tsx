
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthScreen from './src/screens/AuthScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CaptureScreen from './src/screens/CaptureScreen';

const SESSION_KEY = '@tchaupreguica:sessao';

type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
};

type Pagina = 'boas-vindas' | 'principal';

export default function App() {
  const [usuario, setUsuario] =
    useState<UsuarioLogado | null>(null);

  const [pagina, setPagina] =
    useState<Pagina>('boas-vindas');

  const [iniciando, setIniciando] = useState(true);

  useEffect(() => {
    async function carregarSessao() {
      try {
        const sessao =
          await AsyncStorage.getItem(SESSION_KEY);

        if (sessao) {
          const dados: UsuarioLogado =
            JSON.parse(sessao);

          if (dados.id && dados.nome && dados.email) {
            setUsuario(dados);

            // Se já estava conectado, abre
            // diretamente a página principal.
            setPagina('principal');
          }
        }
      } catch {
        setUsuario(null);
      } finally {
        setIniciando(false);
      }
    }

    carregarSessao();
  }, []);

  async function fazerLogin(dados: UsuarioLogado) {
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(dados)
    );

    setUsuario(dados);

    // Mostra a tela verde após cada novo login.
    setPagina('boas-vindas');
  }

  function confirmarLogout() {
    Alert.alert(
      'Sair do aplicativo',
      'Deseja realmente encerrar sua sessão?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                SESSION_KEY
              );

              setUsuario(null);
              setPagina('boas-vindas');
            } catch {
              Alert.alert(
                'Erro',
                'Não foi possível encerrar a sessão.'
              );
            }
          },
        },
      ]
    );
  }

  if (iniciando) {
    return (
      <View style={styles.carregamento}>
        <ActivityIndicator
          size="large"
          color="#8050FF"
        />
      </View>
    );
  }

  if (!usuario) {
    return (
      <AuthScreen
        onLogin={fazerLogin}
      />
    );
  }

  if (pagina === 'boas-vindas') {
    return (
      <WelcomeScreen
        onContinuar={() =>
          setPagina('principal')
        }
      />
    );
  }

  return (
    <CaptureScreen
      key={usuario.id}
      route={{
        params: {
          usuarioId: usuario.id,
          nomeUsuario: usuario.nome,
        },
      }}
      onLogout={confirmarLogout}
    />
  );
}

const styles = StyleSheet.create({
  carregamento: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});