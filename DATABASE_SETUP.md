# 🚀 Supabase Database Setup Guide

Follow these steps to transition from **Demo Mode** to **Live Production** with permanent database storage.

## Step 1: Create a Supabase Project
1. Go to [database.new](https://database.new) and create a free project.
2. Under **Project Settings** > **API**, copy your `URL` and `anon public` key.

## Step 2: Configure Environment Variables
1. Create a file named `.env.local` in the root of your project (same folder as `package.json`).
2. Add your keys like this:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
3. **Restart your development server** (`npm run dev`) for these to take effect.

## Step 3: Run the SQL Schema
1. Open your Supabase Dashboard.
2. Go to the **SQL Editor** (icon that looks like `>_` on the left sidebar).
3. Click **"+ New Query"**.
4. Copy the entire contents of the `schema.sql` file in your project.
5. Paste it into the SQL Editor and click **RUN**.

## Step 4: Verify Your Live Connection
1. Refresh your dashboard at `http://localhost:3500`.
2. Look for the "Demo Mode" banner—if it's gone, you are successfully **LIVE!**
3. If the banner is still there, check that your `.env.local` file names are exactly as shown above.

---

### 🛡️ Why we use 'Resilience Failover'
If you ever lose internet connection or encounter a database error, the app will automatically switch back to **Demo Mode** (LocalStorage) so you never lose data while recording live sessions.
