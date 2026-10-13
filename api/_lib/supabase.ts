/**
 * CLIENTE SUPABASE DAS FUNÇÕES (supabase.ts)
 *
 * As funções liam a URL e a chave do ambiente (SUPABASE_URL ou
 * VITE_SUPABASE_URL). Sem essas variáveis, createClient('') lança: o perfil
 * caía no HTML genérico — sem a foto na prévia do link — e o sitemap
 * quebrava. O site em si não depende delas, porque
 * src/integrations/supabase/client.ts traz os valores escritos no código.
 *
 * O fallback usa esses mesmos valores públicos. A chave anon é pública por
 * desenho (já vai no JavaScript do site); o que cada uma pode ler é decidido
 * pelas regras de acesso (RLS) do banco.
 */

import { createClient } from '@supabase/supabase-js';

const PUBLIC_SUPABASE_URL = 'https://jmygqrqfzglbislftczz.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteWdxcnFmemdsYmlzbGZ0Y3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjEyMTIsImV4cCI6MjA3MDQzNzIxMn0.-SATJkWJNhgpGY8g1o_REhIy-xhaKWIN8_Yrxrzzd1A';

export const createServerClient = () =>
  createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_SUPABASE_ANON_KEY
  );
