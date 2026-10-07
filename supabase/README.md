# Supabase setup for SkillVector auth

1. Open your Supabase project.
2. Go to SQL Editor and run the contents of `profiles-auth.sql`.
3. Go to Authentication > Providers and enable:
   - Email
   - Google
4. In Authentication > URL Configuration, set the redirect URLs to:
   - `http://127.0.0.1:4173/auth/callback`
   - `http://localhost:4173/auth/callback`
   - `http://localhost:3000/auth/callback` if using local dev
   - your production domain later if deployed
5. In Authentication > Settings, enable email confirmations if you want the verification flow.
6. For Google auth, add your Google OAuth client ID and secret in the provider settings.
7. Confirm your app uses the values from `.env`.
