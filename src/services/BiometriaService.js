import * as LocalAuthentication from 'expo-local-authentication';

class BiometriaService {
  static instance = null;

  static getInstance() {
    if (BiometriaService.instance === null) {
      BiometriaService.instance = new BiometriaService();
    }
    return BiometriaService.instance;
  }

  async verificarDisponibilidade() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
      return false;
    }
  }

  async autenticar() {
    try {
      const resultado = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: 'Autentique para confirmar que é você quem está em movimento',
      });

      return resultado.success;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return false;
    }
  }
}

export default BiometriaService.getInstance();