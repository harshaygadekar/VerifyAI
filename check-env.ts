
import dotenv from 'dotenv';
dotenv.config();

console.log('FIRECRAWL_API_KEY exists:', !!process.env.FIRECRAWL_API_KEY);
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
