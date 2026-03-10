/**
 * CONFIGURAÇÃO DO VITE (vite.config.ts)
 * 
 * Este arquivo configura o bundler Vite que é usado para:
 * - Desenvolvimento local com hot reload
 * - Build de produção otimizado
 * - Transformação de código TypeScript/JSX
 * - Configuração de plugins e aliases
 */

// Importa a função principal de configuração do Vite
import { defineConfig } from "vite";
// Plugin para suporte ao React com SWC (compilador mais rápido que Babel)
import react from "@vitejs/plugin-react-swc";
// Utilitário Node.js para manipulação de caminhos de arquivo
import path from "path";
// Plugin da Lovable para desenvolvimento (tagging de componentes)
import { componentTagger } from "lovable-tagger";

/**
 * CONFIGURAÇÃO PRINCIPAL DO VITE
 * 
 * A função recebe o modo atual (development/production) e retorna a configuração
 */
export default defineConfig(({ mode }) => ({
  /**
   * CONFIGURAÇÃO DO SERVIDOR DE DESENVOLVIMENTO
   */
  server: {
    host: "::",        // Escuta em todas as interfaces de rede (0.0.0.0)
    port: 8080,        // Porta onde o servidor de desenvolvimento irá rodar
  },
  
  /**
   * PLUGINS DO VITE
   * 
   * Array de plugins que estendem as funcionalidades do Vite
   */
  plugins: [
    react(),           // Plugin React com SWC para compilação rápida
    
    // Plugin componentTagger só é ativado em modo desenvolvimento
    mode === 'development' &&
    componentTagger(), // Usado pela Lovable para identificar componentes na UI
    
  ].filter(Boolean),   // Remove valores falsy (como false quando não é development)
  
  /**
   * CONFIGURAÇÃO DE RESOLUÇÃO DE MÓDULOS
   */
  resolve: {
    alias: {
      // Alias "@" aponta para a pasta src, permitindo imports como "@/components/Button"
      // Em vez de imports relativos complicados como "../../components/Button"
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
