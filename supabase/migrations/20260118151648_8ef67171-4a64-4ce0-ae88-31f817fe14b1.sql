-- Create superadmin user with email hola@sporthub.com.uy and password 1234
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'hola@sporthub.com.uy',
  crypt('1234', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Admin SportHub"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', 'hola@sporthub.com.uy'),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u WHERE u.email = 'hola@sporthub.com.uy';

-- Profile is created automatically by trigger, but update the name
UPDATE public.profiles 
SET full_name = 'Super Admin SportHub'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hola@sporthub.com.uy');

-- Assign superadmin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM auth.users 
WHERE email = 'hola@sporthub.com.uy'
ON CONFLICT (user_id, role) DO NOTHING;