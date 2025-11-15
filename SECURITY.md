# Security Guidelines

## Environment Variables

### Critical Security Rules

1. **NEVER commit `.env.local` to git**
   - `.env.local` is already in `.gitignore`
   - Always verify before pushing: `git status`

2. **Rotate keys immediately if exposed**
   - If you accidentally commit keys, rotate them IMMEDIATELY
   - Go to respective service dashboards and generate new keys

3. **Use environment-specific files**
   - `.env.local` - Local development (gitignored)
   - Production - Use platform environment variables (Vercel, etc.)

## Supabase Security

### Service Role Key
⚠️ **CRITICAL**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL Row Level Security policies.

**Rules:**
- NEVER expose service role key to client
- ONLY use in server-side code (API routes, server components)
- Store in environment variables, NEVER in code
- Rotate if exposed

### Anon Key
✅ **Safe to expose**: The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe for client-side use.
- Respects Row Level Security (RLS) policies
- Has limited permissions

## API Keys

### Firecrawl & Groq Keys
- Store in `.env.local` for development
- Use platform environment variables for production
- Consider implementing usage limits/quotas
- Monitor usage in respective dashboards

## Best Practices

1. **Always use HTTPS** in production
2. **Implement rate limiting** on API routes
3. **Validate all user inputs** (use Zod)
4. **Enable CORS properly** (restrict origins)
5. **Use secure headers** (CSP, HSTS, etc.)
6. **Regular security audits**
7. **Keep dependencies updated**

## Reporting Security Issues

If you find a security vulnerability, please report it to the project maintainer privately.

DO NOT open public issues for security vulnerabilities.
