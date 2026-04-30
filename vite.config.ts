import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // PKCE stores the code verifier in localStorage per origin; if Vite bumps to 5174 while
    // OAuth started on 5173, sign-in hangs. Keep the port stable or close the other dev server.
    port: 5173,
    strictPort: true,
  },
})
