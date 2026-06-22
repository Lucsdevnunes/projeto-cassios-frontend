const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  static setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    }
  }

  static loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  static clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  static async request(path: string, options: RequestInit = {}): Promise<any> {
    this.loadTokens();
    const url = `${BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new Error('Não foi possível conectar ao servidor de API.');
    }

    if (response.status === 401 && this.refreshToken && path !== '/auth/login' && path !== '/auth/refresh') {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          this.setTokens(data.accessToken, data.refreshToken);
          
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          const retryRes = await fetch(url, { ...options, headers });
          if (retryRes.ok) return retryRes.json();
        } else {
          this.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Sua sessão expirou. Faça login novamente.');
        }
      } catch (err) {
        console.error('Refresh token process failed', err);
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: 'Erro desconhecido na requisição' }));
      throw new Error(errData.message || `Erro ${response.status}: Falha na requisição.`);
    }

    return response.json();
  }

  static get(path: string, options: RequestInit = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  static post(path: string, body?: any, options: RequestInit = {}) {
    return this.request(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static patch(path: string, body?: any, options: RequestInit = {}) {
    return this.request(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static delete(path: string, options: RequestInit = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export { ApiClient };
export default ApiClient;
