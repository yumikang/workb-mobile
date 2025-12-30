/**
 * WORKB Mobile - Apple Authentication Service
 * Sign In with Apple integration (iOS only)
 */

import { Platform } from 'react-native';
import appleAuth, {
  appleAuthAndroid,
  AppleAuthRequestOperation,
  AppleAuthRequestScope,
  AppleAuthCredentialState,
} from '@invertase/react-native-apple-authentication';

export interface AppleAuthCredential {
  identityToken: string;
  authorizationCode: string;
  user: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
}

class AppleAuthService {
  /**
   * Check if Apple Sign In is available on this device
   */
  isSupported(): boolean {
    if (Platform.OS === 'ios') {
      return appleAuth.isSupported;
    }
    return false;
  }

  /**
   * Perform Apple Sign In
   * Returns credential on success, throws on failure/cancel
   */
  async signIn(): Promise<AppleAuthCredential> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only supported on iOS');
    }

    if (!appleAuth.isSupported) {
      throw new Error('Apple Sign In is not supported on this device');
    }

    try {
      // Perform the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [
          AppleAuthRequestScope.EMAIL,
          AppleAuthRequestScope.FULL_NAME,
        ],
      });

      // Get credential state
      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState === AppleAuthCredentialState.AUTHORIZED) {
        const { identityToken, authorizationCode, user, email, fullName } =
          appleAuthRequestResponse;

        if (!identityToken || !authorizationCode) {
          throw new Error('Apple Sign In failed: Missing tokens');
        }

        console.log('[AppleAuth] Sign in successful:', user);

        return {
          identityToken,
          authorizationCode,
          user,
          email: email || null,
          fullName: fullName
            ? {
                givenName: fullName.givenName || null,
                familyName: fullName.familyName || null,
              }
            : null,
        };
      } else {
        throw new Error('Apple Sign In failed: Not authorized');
      }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        throw new Error('CANCELED');
      }
      console.error('[AppleAuth] Sign in error:', error);
      throw error;
    }
  }

  /**
   * Check if user's Apple credential is still valid
   */
  async checkCredentialState(userId: string): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      const credentialState = await appleAuth.getCredentialStateForUser(userId);
      return credentialState === AppleAuthCredentialState.AUTHORIZED;
    } catch (error) {
      console.error('[AppleAuth] Credential check error:', error);
      return false;
    }
  }

  /**
   * Listen for credential revocation
   */
  onCredentialRevoked(callback: () => void): () => void {
    if (Platform.OS !== 'ios') {
      return () => {};
    }

    return appleAuth.onCredentialRevoked(callback);
  }
}

export const appleAuthService = new AppleAuthService();
export default AppleAuthService;
