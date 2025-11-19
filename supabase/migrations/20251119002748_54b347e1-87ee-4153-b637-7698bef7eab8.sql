-- Create profile for papagaiomengo@gmail.com
INSERT INTO public.profiles (id, email, nickname)
VALUES 
  ('3dd140ee-7be3-4546-b018-6d3ddcba62d2', 'papagaiomengo@gmail.com', public.generate_random_nickname())
ON CONFLICT (id) DO NOTHING;