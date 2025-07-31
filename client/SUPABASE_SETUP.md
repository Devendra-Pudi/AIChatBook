# Supabase Setup Guide for ChatAI

This guide will help you set up Supabase for the ChatAI application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `chatai` (or your preferred name)
   - Database Password: Generate a strong password and save it
   - Region: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (under "Project URL")
   - Anon public key (under "Project API keys" > "anon public")

## Step 3: Configure Environment Variables

1. In your project root, update the `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `src/config/database-schema.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will create all necessary tables, indexes, and security policies

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following settings:

### Site URL
- Set your site URL to `http://localhost:5173` for development
- For production, set it to your actual domain

### Redirect URLs
Add the following redirect URLs:
- `http://localhost:5173/auth/callback` (development)
- `https://yourdomain.com/auth/callback` (production)

### Email Templates (Optional)
You can customize the email templates for:
- Confirm signup
- Reset password
- Magic link

### OAuth Providers (Optional)
To enable OAuth providers:

#### Google OAuth
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Set authorized redirect URIs in Google Console:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

#### GitHub OAuth
1. Go to Authentication > Providers
2. Enable GitHub provider
3. Add your GitHub OAuth App credentials:
   - Client ID
   - Client Secret
4. Set authorization callback URL in GitHub:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

#### Facebook OAuth
1. Go to Authentication > Providers
2. Enable Facebook provider
3. Add your Facebook App credentials:
   - App ID
   - App Secret
4. Set valid OAuth redirect URIs in Facebook:
   - `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 6: Set Up Storage (Optional)

If you plan to use file uploads:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `chat-media`
3. Set the bucket to public if you want direct access to files
4. Configure storage policies as needed

## Step 7: Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:5173`
3. Try registering a new account
4. Check your Supabase dashboard to see if the user was created
5. Test login functionality

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Double-check your environment variables
   - Make sure you're using the anon public key, not the service role key

2. **"Invalid redirect URL" error**
   - Check that your redirect URLs are correctly configured in Supabase
   - Make sure the URL matches exactly (including protocol and port)

3. **Database connection errors**
   - Ensure the database schema was created successfully
   - Check that RLS policies are properly configured

4. **OAuth not working**
   - Verify OAuth provider credentials
   - Check redirect URLs in both Supabase and the OAuth provider
   - Ensure the provider is enabled in Supabase

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
- Check the browser console for detailed error messages

## Production Deployment

When deploying to production:

1. Update environment variables with production Supabase URL and keys
2. Update Site URL and Redirect URLs in Supabase settings
3. Configure OAuth providers with production URLs
4. Set up proper database backups
5. Monitor usage and set up billing alerts

## Security Considerations

1. Never expose your service role key in client-side code
2. Use Row Level Security (RLS) policies to protect data
3. Regularly review and update security policies
4. Enable email confirmation for new users
5. Consider implementing rate limiting for sensitive operations