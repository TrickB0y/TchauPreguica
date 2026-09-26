
import React from 'react';

import {
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type Props = {
  onContinuar: () => void;
};

export default function WelcomeScreen({
  onContinuar,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.areaClicavel}
        onPress={onContinuar}
        accessibilityRole="button"
        accessibilityLabel="Toque para acessar a página principal"
      >
        <ImageBackground
          source={require('../../assets/welcome.png')}
          style={styles.imagem}
          resizeMode="stretch"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A8DE58',
  },

  areaClicavel: {
    flex: 1,
  },

  imagem: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});