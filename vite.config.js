import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listens on all local network addresses
    port: 3000, // Optional: specify your preferred port
    proxy: {
      '/api': {
        target: 'http://10.210.13.22:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "", // Rewrite domain to current host
        cookiePathRewrite: "/",   // Ensure path is /
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Ensure CSRF header is present
            if (!proxyReq.getHeader('x-requested-with')) {
              proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            }

            // If Authorization or X-API-KEY header is present, ensure Cookie: apiKey=... is forwarded
            const authHeader = proxyReq.getHeader('authorization');
            let token = null;
            if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7).trim();
            } else {
              const apiKeyHeader = proxyReq.getHeader('x-api-key');
              if (apiKeyHeader && typeof apiKeyHeader === 'string') {
                token = apiKeyHeader.trim();
              }
            }

            if (token && token.startsWith('sk_live_')) {
              const existingCookie = proxyReq.getHeader('cookie') || '';
              if (!existingCookie.includes('apiKey=')) {
                const newCookie = existingCookie ? `${existingCookie}; apiKey=${token}` : `apiKey=${token}`;
                proxyReq.setHeader('cookie', newCookie);
              }
              if (!proxyReq.getHeader('x-api-key')) {
                proxyReq.setHeader('X-API-KEY', token);
              }
            }
          });

          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
              proxyRes.headers['set-cookie'] = cookies.map((c) => {
                let modified = c;
                // 1. Remove 'Secure' attribute so browsers on plain HTTP accept and save the cookie
                modified = modified.replace(/;\s*Secure/gi, '');
                // 2. Relax SameSite=Strict to SameSite=Lax for reliable cookie delivery
                modified = modified.replace(/;\s*SameSite=Strict/gi, '; SameSite=Lax');
                // 3. Strip any remote Domain restriction
                modified = modified.replace(/;\s*Domain=[^;]+/gi, '');
                return modified;
              });

              // 4. Extract apiKey from Set-Cookie and expose in X-Auth-Token header
              for (const c of cookies) {
                const match = c.match(/apiKey=([^;]+)/i);
                if (match && match[1]) {
                  const token = match[1].trim();
                  proxyRes.headers['x-auth-token'] = token;
                  const currentExpose = proxyRes.headers['access-control-expose-headers'];
                  proxyRes.headers['access-control-expose-headers'] = currentExpose
                    ? `${currentExpose}, X-Auth-Token`
                    : 'X-Auth-Token';
                }
              }
            }
          });
        },
      },
    },
  }
})

