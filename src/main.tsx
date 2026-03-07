/**
 * ARQUIVO DE ENTRADA DA APLICAÇÃO (main.tsx)
 * 
 * Este é o ponto de entrada principal da aplicação React. Ele é responsável por:
 * - Inicializar o React 18 com o novo sistema de renderização
 * - Conectar a aplicação ao DOM do HTML
 * - Carregar os estilos globais
 */

// Importa a função createRoot do React 18 para renderização moderna
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
