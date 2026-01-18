-- Update superadmin password to roso.4112
UPDATE auth.users 
SET encrypted_password = crypt('roso.4112', gen_salt('bf'))
WHERE email = 'hola@sporthub.com.uy';