import * as ImagePicker from 'expo-image-picker';

class CameraService {
  static instance = null;

  static getInstance() {
    if (CameraService.instance === null) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  async verificarPermissao() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissão da câmera:', error);
      return false;
    }
  }

  async tirarFoto() {
    try {
      const permissaoObtida = await this.verificarPermissao();
      if (!permissaoObtida) {
        throw new Error('Permissão da câmera negada');
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!resultado.cancelled) {
        return resultado.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      return null;
    }
  }
}

export default CameraService.getInstance();