# MacroSync Error Log

## [2026-06-08 16:33] - Missing JSX Closing Tag in SettingsScreen.jsx

- **Type**: Agent
- **Severity**: Medium
- **File**: `Frontend/src/screens/main/SettingsScreen.jsx:419`
- **Agent**: Aura
- **Root Cause**: An execution error occurred where a replacement chunk unintentionally deleted the `</View>` closing tag for the modal overlay.
- **Error Message**: 
  ```
  SyntaxError: C:\Users\Kaizer\Downloads\MacroSync-main\MacroSync-main\Frontend\src\screens\main\SettingsScreen.jsx: Expected corresponding JSX closing tag for <View>. (419:6)
  ```
- **Fix Applied**: Restored the missing `</View>` tag directly before the closing `</Modal>` tag.
- **Prevention**: Be extremely careful to double check nesting bounds and matching tags before submitting replacements.
- **Status**: Fixed

---

## [2026-06-08 20:05] - Gemini API 503 Overloaded Error in Chatbot

- **Type**: Integration
- **Severity**: High
- **File**: `Backend/main.py`
- **Agent**: Aura
- **Root Cause**: The Google Gemini SDK request using `gemini-2.5-flash` returned a 503 status code due to high temporary demand or rate limit limits on the model.
- **Error Message**: 
  ```
  CHAT ERROR: ServerError("503 UNAVAILABLE. {'error': {'code': 503, 'message': 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.', 'status': 'UNAVAILABLE'}}")
  ```
- **Fix Applied**: Added a helper function `generate_gemini_content` with automatic retry logic (maximum 3 attempts with exponential backoff) and fallback models (retrying with `gemini-2.0-flash` then `gemini-1.5-flash` if `gemini-2.5-flash` fails). Integrated this helper across `/chat`, `/generate-recipe`, and `/analyze-food` endpoints.
- **Prevention**: Standardize model calling and use try-catch loops with backoff and alternative models to survive server-side resource spikes.
- **Status**: Fixed

---

## [2026-06-08 20:10] - TypeError: can't compare offset-naive and offset-aware datetimes in verify_reset_otp

- **Type**: Runtime
- **Severity**: High
- **File**: `Backend/main.py:197`
- **Agent**: Aura
- **Root Cause**: The database timestamp returned by Supabase for `expires_at` was parsed as a timezone-aware datetime, which cannot be compared with a timezone-naive `datetime.utcnow()` object.
- **Error Message**: 
  ```
  TypeError: can't compare offset-naive and offset-aware datetimes
  ```
- **Fix Applied**: Extracted timezone check dynamically: if `expires_at` is timezone-aware, we compare it against `datetime.now(timezone.utc)`, otherwise against `datetime.utcnow()`.
- **Prevention**: Always verify the timezone-awareness when comparing parsed database timestamps with current datetimes.
- **Status**: Fixed

---

## [2026-06-08 20:12] - Case-Sensitive User Lookup and 500 Error Translation in update-password

- **Type**: Logic / Integration
- **Severity**: High
- **File**: `Backend/main.py:204`
- **Agent**: Aura
- **Root Cause**: The user search in `/update-password` did not support case-insensitive emails, causing logins or resets with capitalized inputs to fail user search. Additionally, any caught `HTTPException` inside the block was translated to a generic `500 Internal Server Error`.
- **Error Message**: 
  ```
  UPDATE PASSWORD ERROR: HTTPException(status_code=404, detail='User not found')
  ```
- **Fix Applied**: Updated the search to use `.lower()` for both emails, and caught `HTTPException` explicitly in a separate exception block before `Exception` to prevent status code translation issues.
- **Prevention**: Perform case-insensitive email searches for user lookup, and handle `HTTPException` re-raising explicitly in FastAPI route handlers.
- **Status**: Fixed

---
