
import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const USERS_KEY = '@tchaupreguica:usuarios';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  salt: string;
};

type Props = {
  onLogin: (usuario: {
    id: string;
    nome: string;
    email: string;
  }) => void | Promise<void>;
};

export default function AuthScreen({ onLogin }: Props) {
  const [tela, setTela] = useState<'login' | 'cadastro'>(
    'login'
  );

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function buscarUsuarios(): Promise<Usuario[]> {
    const dados = await AsyncStorage.getItem(USERS_KEY);

    if (!dados) return [];

    const usuarios = JSON.parse(dados);

    return Array.isArray(usuarios) ? usuarios : [];
  }

  async function gerarHash(
    senhaOriginal: string,
    salt: string
  ) {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${senhaOriginal}`
    );
  }

  function limparCampos() {
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
    setMostrarSenha(false);
  }

  function mudarTela(novaTela: 'login' | 'cadastro') {
    limparCampos();
    setTela(novaTela);
  }

  // CADASTRO

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();

    if (
      !nomeLimpo ||
      !emailLimpo ||
      !senha ||
      !confirmarSenha
    ) {
      Alert.alert(
        'Atenção',
        'Preencha todos os campos.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert(
        'E-mail inválido',
        'Digite um endereço de e-mail válido.'
      );
      return;
    }

    if (senha.length < 8) {
      Alert.alert(
        'Senha muito curta',
        'A senha deve ter pelo menos 8 caracteres.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        'Senhas diferentes',
        'A confirmação deve ser igual à senha.'
      );
      return;
    }

    setCarregando(true);

    try {
      const usuarios = await buscarUsuarios();

      const emailExiste = usuarios.some(
        (usuario) => usuario.email === emailLimpo
      );

      if (emailExiste) {
        Alert.alert(
          'E-mail já cadastrado',
          'Utilize outro e-mail ou faça login.'
        );
        return;
      }

      const salt = Crypto.randomUUID();

      const senhaHash = await gerarHash(
        senha,
        salt
      );

      const novoUsuario: Usuario = {
        id: Crypto.randomUUID(),
        nome: nomeLimpo,
        email: emailLimpo,
        senhaHash,
        salt,
      };

      await AsyncStorage.setItem(
        USERS_KEY,
        JSON.stringify([...usuarios, novoUsuario])
      );

      limparCampos();
      setTela('login');

      Alert.alert(
        'Cadastro realizado!',
        'Agora você pode entrar com seu e-mail e senha.'
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível realizar o cadastro.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // LOGIN

  async function entrar() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert(
        'Atenção',
        'Informe seu e-mail e senha.'
      );
      return;
    }

    setCarregando(true);

    try {
      const usuarios = await buscarUsuarios();

      const usuario = usuarios.find(
        (item) => item.email === emailLimpo
      );

      if (!usuario) {
        Alert.alert(
          'Erro',
          'E-mail ou senha incorretos.'
        );
        return;
      }

      const senhaHash = await gerarHash(
        senha,
        usuario.salt
      );

      if (senhaHash !== usuario.senhaHash) {
        Alert.alert(
          'Erro',
          'E-mail ou senha incorretos.'
        );
        return;
      }

      await onLogin({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      });

      limparCampos();
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível realizar o login.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // INTERFACE

  return (
    <LinearGradient
      colors={['#8050FF', '#527BB7', '#00B979']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <Ionicons
              name="walk-outline"
              size={65}
              color="#fff"
            />

            <Text style={styles.nomeAplicativo}>
              TchauPreguiça
            </Text>

            <Text style={styles.slogan}>
              Registre suas atividades!
            </Text>
          </View>

          <View style={styles.formulario}>
            {tela === 'login' ? (
              <>
                <Ionicons
                  name="person-circle-outline"
                  size={90}
                  color="#4B4B4B"
                  style={styles.avatar}
                />

                <Text style={styles.titulo}>
                  Bem-vindo de volta!
                </Text>

                <TextInput
                  style={styles.campo}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#777"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />

                <View style={styles.campoSenha}>
                  <TextInput
                    style={styles.entradaSenha}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#777"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    autoComplete="current-password"
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                  >
                    <Ionicons
                      name={
                        mostrarSenha
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={23}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.botaoLogin}
                  onPress={entrar}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.textoBotao}>
                      ENTRAR
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.textoAlternativo}>
                  Ainda não possui uma conta?
                </Text>

                <TouchableOpacity
                  onPress={() => mudarTela('cadastro')}
                >
                  <Text style={styles.link}>
                    Cadastre-se
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={65}
                  color="#8050FF"
                  style={styles.avatar}
                />

                <Text style={styles.titulo}>
                  Crie sua conta
                </Text>

                <TextInput
                  style={styles.campo}
                  placeholder="Digite seu nome"
                  placeholderTextColor="#777"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                  autoComplete="name"
                />

                <TextInput
                  style={styles.campo}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#777"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />

                <View style={styles.campoSenha}>
                  <TextInput
                    style={styles.entradaSenha}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#777"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setMostrarSenha(!mostrarSenha)
                    }
                  >
                    <Ionicons
                      name={
                        mostrarSenha
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={23}
                      color="#555"
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.campo}
                  placeholder="Confirme sua senha"
                  placeholderTextColor="#777"
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoComplete="new-password"
                />

                <TouchableOpacity
                  style={styles.botaoCadastro}
                  onPress={cadastrar}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.textoBotao}>
                      CADASTRAR
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.textoAlternativo}>
                  Já possui uma conta?
                </Text>

                <TouchableOpacity
                  onPress={() => mudarTela('login')}
                >
                  <Text style={styles.link}>
                    Fazer login
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 45,
  },

  logoArea: {
    alignItems: 'center',
    marginBottom: 30,
  },

  nomeAplicativo: {
    color: '#fff',
    fontSize: 31,
    fontWeight: 'bold',
    marginTop: 8,
  },

  slogan: {
    color: '#F2EFFF',
    fontSize: 15,
    marginTop: 6,
  },

  formulario: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    paddingHorizontal: 25,
    paddingVertical: 35,
    alignItems: 'center',
    elevation: 5,
  },

  avatar: {
    marginBottom: 10,
  },

  titulo: {
    color: '#292929',
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 28,
    textAlign: 'center',
  },

  campo: {
    borderWidth: 1.5,
    borderColor: '#777',
    borderRadius: 25,
    width: '100%',
    height: 53,
    paddingHorizontal: 20,
    color: '#222',
    fontSize: 15,
    marginBottom: 17,
  },

  campoSenha: {
    borderWidth: 1.5,
    borderColor: '#777',
    borderRadius: 25,
    width: '100%',
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 17,
  },

  entradaSenha: {
    flex: 1,
    color: '#222',
    fontSize: 15,
  },

  botaoLogin: {
    backgroundColor: '#21AD12',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  botaoCadastro: {
    backgroundColor: '#6B7DF2',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },

  textoBotao: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },

  textoAlternativo: {
    color: '#666',
    fontSize: 14,
    marginTop: 25,
  },

  link: {
    color: '#526BEA',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
});