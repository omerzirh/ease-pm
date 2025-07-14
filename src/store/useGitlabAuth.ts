import { create } from 'zustand';
import { Gitlab } from '@gitbeaker/browser';

const HOST = import.meta.env.VITE_GITLAB_HOST || 'https://gitlab.com';
const CLIENT_ID = import.meta.env.VITE_GITLAB_APPLICATION_ID as string;
const REDIRECT_URI = import.meta.env.VITE_GITLAB_CALLBACK as string;

interface GitlabAuthState {
  token: string | null;
  api: InstanceType<typeof Gitlab> | null;
  login: () => Promise<void>;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useGitlabAuth = create<GitlabAuthState>((set, get) => ({
  token: localStorage.getItem('gitlab_token'),
  api: null,
  login: async () => {
    const generateRandom = (length: number) => {
      const array = new Uint32Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('').slice(0, length);
    };

    const base64url = (bytes: ArrayBuffer) => {
      return btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    };

    const sha256 = async (plain: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return base64url(hash);
    };

    const codeVerifier = generateRandom(128);
    const codeChallenge = await sha256(codeVerifier);
    sessionStorage.setItem('gitlab_pkce_verifier', codeVerifier);

    const authUrl = `${HOST}/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}&response_type=code&scope=api&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'GitLabLogin',
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    const interval = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        return;
      }
      try {
        const popupUrl = popup.location.href;
        if (popupUrl && popupUrl.startsWith(REDIRECT_URI)) {
          const urlObj = new URL(popupUrl);
          const code = urlObj.searchParams.get('code');
          if (code) {
            const codeVerifier = sessionStorage.getItem('gitlab_pkce_verifier') || '';
            try {
              const res = await fetch(`${HOST}/oauth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  client_id: CLIENT_ID,
                  grant_type: 'authorization_code',
                  code,
                  code_verifier: codeVerifier,
                  redirect_uri: REDIRECT_URI,
                }),
              });
              if (!res.ok) throw new Error('Token exchange failed');
              const json = await res.json();
              get().setToken(json.access_token);
            } catch (err) {
              console.error(err);
            }
          }
          popup.close();
          clearInterval(interval);
        }
      } catch (_) {
      }
    }, 500);
  },
  setToken: (token: string) => {
    localStorage.setItem('gitlab_token', token);
    set({
      token,
      api: new Gitlab({ oauthToken: token, host: HOST }),
    });
  },
  logout: () => {
    localStorage.removeItem('gitlab_token');
    set({ token: null, api: null });
  },
}));
