# MacroSync - Development Changes Summary

Here is a summary of the updates made to both the **Frontend** and **Backend** codebases.

---

## 📱 Frontend Changes

### 1. Browser-based Google Sign-In Flow
* **Issue:** Google OAuth actively blocks sign-ins within native WebViews (`disallowed_useragent`).
* **Solution:** Integrated `expo-web-browser` to open the Google Sign-In webpage inside a secure in-app system browser modal (`WebBrowser.openBrowserAsync`).
* **Implementation Details:**
  * Cleaned up the old mock account selection `<Modal>` overlays from `LoginScreen.jsx`.
  * Added custom URL scheme listener for `sync://google-auth` deep links in `App.js`.
  * The app automatically dismisses the in-app browser using `WebBrowser.dismissBrowser()` once a deep link is received and processes authentication details via `/auth/google-signin`.

### 2. Separated Email and Password Change Modals
* **Issue:** The original setup grouped email and password updates under a single modal.
* **Solution:** Split the credentials update options into two separate actions under the "Security & Account" settings card:
  1. **Change Email Address:** Opens a dedicated modal showing the current logged-in email (read-only), requesting the current password (for authorization), and accepting the new email address.
  2. **Change Password:** Opens a dedicated modal requesting the current password, new password, and confirmation.
* **UI Improvements:**
  * Reordered the Email modal layout to ask for **Current Password** first, followed by **New Email Address**.
  * Ensured the email input field does not mask characters (no `secureTextEntry`).
  * Removed the email field from the Edit Profile modal to keep concerns separated.

### 3. UI and Styling Polish
* Centered the brand title text ("MacroSync", "Create Account", "Forgot Password", etc.) across all primary auth screens to keep layout alignment consistent:
  * `LoginScreen.jsx`
  * `SignUpScreen.jsx`
  * `ForgotPasswordScreen.jsx`
  * `OtpScreen.jsx`
* Fixed missing dependency imports (e.g., Lucide `Mail` icon error).

---

## ⚙️ Backend Changes (`Backend/main.py`)

### 1. Separate Admin Supabase Client
* **Why:** The default `supabase` client is logged into using authenticated user sessions, which overrides its authentication header.
* **Fix:** Created a separate, dedicated `supabase_admin` client using the service role key to perform admin tasks (such as updates) without authorization issues.

### 2. ID-Based Password Updates (`/update-password`)
* Updated to accept `user_id` in the request payload to update passwords directly rather than relying on email lookups, resolving "User not found" errors when database profile emails and auth credentials diverged.

### 3. Added Email Update API (`/update-email`)
* **New Endpoint:** `POST /update-email`
* **Request Schema:**
  ```json
  {
    "user_id": "string",
    "new_email": "string",
    "current_password": "string"
  }
  ```
* **Functionality:**
  1. Updates the email address in **Supabase Auth** (`supabase_admin.auth.admin.update_user_by_id`).
  2. Updates the email address in the **`user_profiles` database table** under the matching `id` column.
  3. Fixed a query bug where the query attempted to check against a non-existent `user_id` column instead of the correct `id` column in the `user_profiles` table.

---

*All local changes have been committed and successfully pushed to the repository main branch.*
