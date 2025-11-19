-- Create profiles for users with game results but no profile
INSERT INTO public.profiles (id, email, nickname)
VALUES 
  ('da59696d-968f-454d-9965-7e4a3be8d5b8', 'leonardbritop@gmail.com', public.generate_random_nickname()),
  ('d2211f69-0c7c-4ba4-907e-3d8091bd8877', 'canal.maturrangos@gmail.com', public.generate_random_nickname())
ON CONFLICT (id) DO NOTHING;