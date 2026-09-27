import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useColorMode } from '../context/ColorModeContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (errMessage: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
}) => {
  const { loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();
  const { mode } = useColorMode();
  const navigate = useNavigate();

  const handleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
      showSuccess('Signed in with Google successfully!');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const message = err.message || 'Google sign-in failed. Please try again.';
      showError(message);
      if (onError) onError(message);
    }
  };

  const handleError = () => {
    const message = 'Google authentication was cancelled or failed.';
    showError(message);
    if (onError) onError(message);
  };

  return (
    <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:w-full">
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) {
            handleSuccess(res.credential);
          } else {
            handleError();
          }
        }}
        onError={handleError}
        theme={mode === 'dark' ? 'filled_black' : 'outline'}
        shape="rectangular"
        size="large"
        width="100%"
        text={text}
      />
    </div>
  );
};
