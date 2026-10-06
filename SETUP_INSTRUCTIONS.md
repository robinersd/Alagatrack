# 🚀 AlagaTrack Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Create the Database Table

1. Go to your Supabase dashboard: https://supabase.com
2. Select your project "yisifdlwhqamlodgfzge"
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `setup.sql`
6. Click **Run**

✅ You should see "Success" message

### Step 2: Set Environment Variables in Supabase Function

1. In your Supabase dashboard, click **Functions** (left sidebar)
2. Click the function named `make-server-c6a1b708`
3. Click the **Secrets** or **Environment Variables** tab
4. Add these environment variables:

| Variable Name | Value | Where to get it |
|---|---|---|
| `SUPABASE_URL` | `https://yisifdlwhqamlodgfzge.supabase.co` | Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | (Your service role key) | Settings → API → Project API keys (copy the "service_role" secret key) |

⚠️ **IMPORTANT**: The service role key is secret! Don't share it or commit it to git.

### Step 3: Redeploy Function (if needed)

1. In Functions, click on `make-server-c6a1b708`
2. If you made changes to environment variables, click **Deploy** button
3. Wait for deployment to complete

### Step 4: Test the Setup

1. Open your application in browser
2. Go to **Register** page
3. Try to create a new account
4. Check browser console (F12) for any errors

## Troubleshooting

### Error: "Table does not exist"
- ✅ Run the `setup.sql` file (Step 1)
- Make sure no SQL errors occurred

### Error: "Failed to create user" or "Invalid credentials on login"
- ✅ Check that environment variables are set (Step 2)
- Make sure the service role key is correct (not the anon key)
- Go to Functions and verify the environment variables are shown

### Error: "401 Unauthorized"
- The Supabase credentials are incorrect
- Double-check `SUPABASE_SERVICE_ROLE_KEY` - use the service role key, NOT the anon key

### Registration works but login doesn't
- Make sure password is stored correctly
- Check browser console for the exact error message
- Go to Supabase SQL Editor and run:
  ```sql
  SELECT * FROM kv_store_c6a1b708 LIMIT 10;
  ```
  This shows you what data was stored. You should see entries like:
  - `user:` entries (user data)
  - `password:` entries (passwords)

## Database Structure

After registering users, your `kv_store_c6a1b708` table will contain:

```
key: "user:user_1708770800000"
value: {
  "id": "user_1708770800000",
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "chw"
}

key: "password:john_doe"
value: "securePassword123"
```

## Need Help?

If something doesn't work:
1. Check browser console (F12) - what error is shown?
2. Check Supabase function logs (Functions → make-server-c6a1b708 → Logs)
3. Verify the `kv_store_c6a1b708` table exists in SQL Editor
4. Verify environment variables are set in the Function settings

---

✅ Once these steps are done, login and register should work!
