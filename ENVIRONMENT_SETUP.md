# Environment Setup Guide

This guide explains how to set up environment variables for the ChatAI application.

## 🚨 Important Security Notice

**NEVER commit `.env` files to the repository!** Environment files contain sensitive information like API keys, database credentials, and other secrets that should not be shared publicly.

## Environment Files Structure

The project uses the following environment file structure:

```
├── .env.example                 # Root example (if needed)
├── client/
│   ├── .env.example            # Client environment template
│   └── .env                    # Client environment (ignored by git)
└── server/
    ├── .env.example            # Server environment template  
    └── .env                    # Server environment (ignored by git)
```

## Setup Instructions

### 1. Client Environment Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your actual values:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Together AI Configuration
   VITE_TOGETHER_AI_API_KEY=your_together_ai_api_key
   
   # Socket.io Configuration
   VITE_SOCKET_URL=http://localhost:3001
   
   # App Configuration
   VITE_APP_NAME=ChatAI
   VITE_APP_VERSION=1.0.0
   ```

### 2. Server Environment Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your actual values:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## Environment File Types

The project supports different environment files for different stages:

- `.env` - Default environment file
- `.env.local` - Local overrides (highest priority)
- `.env.development` - Development environment
- `.env.development.local` - Local development overrides
- `.env.test` - Test environment
- `.env.test.local` - Local test overrides
- `.env.production` - Production environment
- `.env.production.local` - Local production overrides
- `.env.staging` - Staging environment
- `.env.staging.local` - Local staging overrides

## Git Ignore Configuration

All environment files are automatically ignored by git through comprehensive `.gitignore` rules:

### Root .gitignore
```gitignore
# Environment variables
.env
.env.*
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local
.env.staging
.env.staging.local

# Environment files in subdirectories
*/.env
*/.env.*
*/.env.local
*/.env.development
*/.env.development.local
*/.env.test
*/.env.test.local
*/.env.production
*/.env.production.local
*/.env.staging
*/.env.staging.local
```

## Verification Commands

To verify your environment files are properly ignored:

```bash
# Check if .env files are ignored
git check-ignore client/.env server/.env

# View ignored files
git status --ignored | grep .env

# Ensure no .env files are tracked
git ls-files | grep "\.env$"
```

## Best Practices

1. **Never commit environment files**: Always use `.env.example` files as templates
2. **Use descriptive variable names**: Make it clear what each variable is for
3. **Document required variables**: Keep `.env.example` files up to date
4. **Use different files for different environments**: Separate development, staging, and production configs
5. **Validate environment variables**: Check for required variables at application startup
6. **Use secure values**: Generate strong, unique keys for production

## Troubleshooting

### Environment Variables Not Loading

1. Check file location: Ensure `.env` files are in the correct directories
2. Check file naming: Environment files must start with `.env`
3. Check syntax: No spaces around the `=` sign
4. Restart development server: Changes require a restart

### Variables Not Available

1. **Client variables**: Must be prefixed with `VITE_`
2. **Server variables**: No prefix required
3. **Check spelling**: Variable names are case-sensitive

### Security Issues

If you accidentally commit environment files:

1. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/.env' --prune-empty --tag-name-filter cat -- --all
   ```

2. **Regenerate all secrets**: Change all API keys, passwords, and tokens
3. **Force push** (if safe to do so):
   ```bash
   git push origin --force --all
   ```

## Support

If you need help with environment setup:
1. Check the `.env.example` files for required variables
2. Refer to service documentation (Supabase, Together AI, etc.)
3. Contact the development team

---

**Remember: Keep your environment files secure and never share them publicly!**