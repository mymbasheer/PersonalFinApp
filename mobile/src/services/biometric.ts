// mobile/src/services/biometric.ts
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export const Biometric = {
  async isAvailable(): Promise<{ available: boolean; type: string }> {
    try {
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      return { available, type: biometryType || 'None' };
    } catch {
      return { available: false, type: 'None' };
    }
  },

  async createKeys(): Promise<string | null> {
    try {
      const { publicKey } = await rnBiometrics.createKeys();
      return publicKey;
    } catch {
      return null;
    }
  },

  async authenticate(promptMessage = 'Verify your identity'): Promise<boolean> {
    try {
      const { success } = await rnBiometrics.simplePrompt({ promptMessage });
      return success;
    } catch {
      return false;
    }
  },

  async sign(payload: string): Promise<string | null> {
    try {
      const { success, signature } = await rnBiometrics.createSignature({
        promptMessage: 'Sign in to PersonalFinApp',
        payload,
      });
      return success && signature ? signature : null;
    } catch {
      return null;
    }
  },
};
