import * as Location from 'expo-location';

class GPSService {
  static instance = null;

  static getInstance() {
    if (GPSService.instance === null) {
      GPSService.instance = new GPSService();
    }
    return GPSService.instance;
  }

  async verificarPermissao() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  async obterLocalizacao() {
    try {
      const permissaoObtida = await this.verificarPermissao();
      if (!permissaoObtida) {
        throw new Error('Permissão de localização negada');
      }

      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: localizacao.coords.latitude,
        longitude: localizacao.coords.longitude,
        precisao: localizacao.coords.accuracy,
      };
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      return null;
    }
  }
}

export default GPSService.getInstance();