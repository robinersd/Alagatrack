✅ SETUP CHECKLIST - Login/Register Fix

Follow these steps in order:

## 1️⃣ CREATE DATABASE TABLE
- [ ] Open Supabase dashboard: https://supabase.com
- [ ] Select project: yisifdlwhqamlodgfzge
- [ ] Go to SQL Editor
- [ ] Open file: `setup.sql`
- [ ] Copy and paste SQL into Supabase SQL Editor
- [ ] Click **Run**
- [ ] ✅ See "Success" message

## 2️⃣ SET ENVIRONMENT VARIABLES
- [ ] Go to Supabase → Functions → make-server-c6a1b708
- [ ] Click **Settings** or **Secrets** tab
- [ ] Add environment variable: `SUPABASE_URL`
  - Value: `https://yisifdlwhqamlodgfzge.supabase.co`
- [ ] Add environment variable: `SUPABASE_SERVICE_ROLE_KEY`
  - Value: (Get from Settings → API → Service role secret key)
- [ ] Deploy the function (click Deploy button)
- [ ] ✅ Wait for green checkmark

## 3️⃣ TEST REGISTRATION
- [ ] Open your app in browser
- [ ] Go to Register page
- [ ] Fill in form:
  - Username: `testuser`
  - Email: `test@example.com`
  - Full Name: `Test User`
  - Password: `password123`
- [ ] Click Register
- [ ] ✅ See success message "Registration successful!"

## 4️⃣ TEST LOGIN
- [ ] Go to Login page
- [ ] Enter:
  - Username: `testuser`
  - Password: `password123`
- [ ] Click Login
- [ ] ✅ Should see dashboard

## 5️⃣ VERIFY DATABASE
- [ ] Go to Supabase SQL Editor
- [ ] Run: `SELECT COUNT(*) FROM kv_store_c6a1b708;`
- [ ] ✅ Should show at least 2 rows (user + password)

---

## IF SOMETHING GOES WRONG

### Registration Error?
1. Open browser console: F12 → Console tab
2. Look for red error messages
3. Verify Step 1 and Step 2 are complete

### Login Error?
1. Check browser console for error message
2. Go to Supabase → Functions → Logs tab
3. Look for error details

### Can't find Supabase settings?
- Project URL: Dashboard → Settings → API → Project URL
- Service Role Key: Dashboard → Settings → API → Project API keys → service_role

---

📝 Need help? Check SETUP_INSTRUCTIONS.md for detailed guide
