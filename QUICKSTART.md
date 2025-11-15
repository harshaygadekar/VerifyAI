# Quick Start Guide - Supabase Database

Get your VerifyAI database up and running in 5 minutes!

## 🚀 Quick Setup (5 Steps)

### Step 1: Apply Database Schema (2 minutes)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `/home/user/VerifyAI/lib/supabase/schema.sql`
5. Copy all the content (Ctrl+A, Ctrl+C)
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message

### Step 2: Verify Tables Created (30 seconds)

1. Click **Table Editor** in the left sidebar
2. You should see 7 tables:
   - users
   - queries
   - search_results
   - user_sessions
   - query_feedback
   - api_usage
   - saved_searches

### Step 3: Check Environment Variables (30 seconds)

The `.env.local` file has already been created with your credentials:

```bash
cat .env.local
```

You should see:
```env
NEXT_PUBLIC_SUPABASE_URL=https://allfsdplvrifxbcbmmvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 4: Install Dependencies (1 minute)

Dependencies are already installed! Verify:

```bash
npm list @supabase/supabase-js @supabase/ssr
```

### Step 5: Test the Database (1 minute)

Start your development server:

```bash
npm run dev
```

Perform a search in the application, then check your Supabase dashboard:

1. Go to **Table Editor**
2. Click on **queries** table
3. You should see your search query recorded!

## ✅ That's It!

Your database is now live and saving data automatically.

## 🎯 What Happens Now?

Every time someone searches:

1. ✅ Query is saved to `queries` table
2. ✅ Search results saved to `search_results` table
3. ✅ API usage tracked in `api_usage` table

All automatically, no additional code needed!

## 📚 Next Steps

Want to do more? Check out:

- **DATABASE_SETUP.md** - Complete setup guide
- **lib/db/README.md** - How to use database functions
- **lib/db/examples.ts** - Copy-paste code examples
- **IMPLEMENTATION_SUMMARY.md** - Full technical details

## 🔧 Common Issues

### "Table already exists" error

You've already run the schema. This is fine! Skip Step 1.

### "Missing environment variables" error

Check `.env.local` exists and has all three variables. Restart your dev server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Not seeing data in tables

1. Make sure you restarted the dev server after creating `.env.local`
2. Check the browser console for errors
3. Verify Supabase credentials are correct

## 🎓 Quick Examples

### Get User's Query History

```typescript
import { getQueryHistory } from '@/lib/db/queries'

const history = await getQueryHistory(userId, { limit: 20 })
```

### Save a Custom Query

```typescript
import { saveQuery } from '@/lib/db/queries'

const query = await saveQuery({
  user_id: userId,
  query_text: 'What is AI?',
  query_type: 'web',
  sources_count: 5,
  was_successful: true,
})
```

### Get Today's Statistics

```typescript
import { getTodayStats } from '@/lib/db/queries'

const stats = await getTodayStats()
console.log(`Total queries today: ${stats?.total_queries}`)
```

## 🆘 Need Help?

1. Check the error in browser console
2. Check Supabase dashboard logs
3. Review DATABASE_SETUP.md troubleshooting section
4. Check lib/db/README.md for function details

## 🎉 Success!

You now have a production-ready database tracking all your searches and API usage!

---

**Total Setup Time**: ~5 minutes
**Difficulty**: Easy
**Next Step**: Explore the documentation files to learn more!
