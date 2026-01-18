-- The user hola@sporthub.com.uy already exists, just assign superadmin role
DO $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'hola@sporthub.com.uy';
  
  IF existing_user_id IS NOT NULL THEN
    -- Assign superadmin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update profile name
    UPDATE public.profiles 
    SET full_name = 'Super Admin SportHub'
    WHERE user_id = existing_user_id;
    
    RAISE NOTICE 'Superadmin role assigned to user: %', existing_user_id;
  ELSE
    RAISE NOTICE 'User not found';
  END IF;
END $$;