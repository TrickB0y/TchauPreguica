import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  static instance = null;

  static getInstance() {
    if (StorageService.instance === null) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async salvar(chave, dados) {
    try {
      const jsonDados = JSON.stringify(dados);
      await AsyncStorage.setItem(chave, jsonDados);
      return true;
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return false;
    }
  }

  async obter(chave) {
    try {
      const dados = await AsyncStorage.getItem(chave);
      return dados ? JSON.parse(dados) : null;
    } catch (error) {
      console.error('Erro ao obter:', error);
      return null;
    }
  }

  async adicionarLista(chave, item) {
    try {
      const lista = (await this.obter(chave)) || [];
      lista.push(item);
      return await this.salvar(chave, lista);
    } catch (error) {
      console.error('Erro ao adicionar à lista:', error);
      return false;
    }
  }

  async obterLista(chave) {
    try {
      const lista = await this.obter(chave);
      return lista || [];
    } catch (error) {
      console.error('Erro ao obter lista:', error);
      return [];
    }
  }

  async limpar(chave) {
    try {
      await AsyncStorage.removeItem(chave);
      return true;
    } catch (error) {
      console.error('Erro ao limpar:', error);
      return false;
    }
  }
}

export default StorageService.getInstance();