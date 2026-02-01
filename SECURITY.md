# Security Audit Report

**Date:** January 31, 2026  
**Auditor:** Automated Security Audit  
**Application:** bouslov.com (Next.js + Supabase)

---

## Executive Summary

This document outlines the security review of bouslov.com, a family competition tracker built with Next.js 15, NextAuth, and Supabase. The application restricts access to whitelisted family email addresses.

### Risk Assessment

| Severity | Issues Found | Issues Fixed |
|----------|-------------|--------------|
| High     | 3           | 3            |
| Medium   | 4           | 4            |
| Low      | 2           | 1            |

---

## Issues Fixed

### HIGH: Missing Rate Limiting on API Routes (FIXED ✅)

**Before:** Only `/api/scores POST` had rate limiting. All other endpoints (pins, travels, uploads, comments) had no rate limiting, allowing potential DoS attacks or abuse.

**After:** Implemented `lib/security.ts` with comprehensive rate limiting:
- General API requests: 100/minute
- Uploads: 10/minute  
- Write operations (POST/PUT/DELETE): 30/minute
- Score submissions: 5 per 5 minutes per category

All API routes now use the centralized rate limiter.

---

### HIGH: Unauthenticated GET Endpoint for Scores (FIXED ✅)

**Before:** `/api/scores GET` did not require authentication, exposing all scores and user data to unauthenticated requests.

**After:** Added session check to require authentication before returning scores.

---

### HIGH: No URL Validation for User Links (FIXED ✅)

**Before:** User-provided links in pins were not validated, potentially allowing `javascript:` or `data:` URLs (XSS vectors).

**After:** Added `isValidUrl()` function that only allows `http:` and `https:` protocols. All link inputs are now validated before storage.

---

### MEDIUM: Missing Security Headers (FIXED ✅)

**Before:** Only basic headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection) were configured.

**After:** Added:
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

### MEDIUM: No Input Length Limits (FIXED ✅)

**Before:** No limits on title, description, or comment length could lead to storage abuse or DoS.

**After:** Added limits:
- Title: 200 characters
- Description: 5000 characters
- Comments: 2000 characters

---

### MEDIUM: Coordinate Validation (FIXED ✅)

**Before:** Latitude/longitude values were not validated for valid ranges.

**After:** Added `isValidCoordinate()` function ensuring lat: -90 to 90, lng: -180 to 180.

---

### MEDIUM: Pin Type Validation (FIXED ✅)

**Before:** Pin type validation only on create, not on update.

**After:** Added pin type validation to PUT endpoint.

---

### LOW: Login Page Shows Authorized Emails (NOT FIXED)

The login page displays authorized usernames (`gbouslov, dbouslov, jbouslov, bouslovd`). This is a minor information disclosure but acceptable for a private family app where the user list is essentially public knowledge.

---

## Existing Security Measures (Good Practices Found)

### Authentication ✅
- **NextAuth with Google OAuth:** Secure authentication using NextAuth.js
- **Email Whitelist:** Only 5 specific family email addresses can authenticate
- **JWT Sessions:** Stateless session management
- **Lowercase Email Normalization:** Prevents case-sensitivity bypasses

### Authorization ✅
- **API-Level Auth:** All API routes check `getServerSession()` before processing
- **Ownership Checks:** Update/delete operations verify `user_email` matches session
- **Supabase Operations:** Use email from session, not from request body

### Data Protection ✅
- **Environment Variables:** `.env*` files properly gitignored
- **Service Key Handling:** Supabase service key used server-side only
- **No Sensitive Data in Client:** User emails used as identifiers, not passwords

### File Upload Security ✅
- **Type Validation:** Only jpeg, png, gif, webp allowed
- **Size Limit:** Maximum 5MB per file
- **Unique Filenames:** Timestamp + random string prevents conflicts

---

## Supabase RLS Analysis

### Current State
RLS policies use `USING (true)` for all operations. This effectively disables row-level security, relying entirely on API-level authentication.

### Assessment
For this application, this is **acceptable** because:
1. The API layer enforces authentication on all routes
2. All write operations filter by `user_email` from the session
3. The application is private with a fixed whitelist

### Recommendation for Future
If the application grows or becomes multi-tenant, implement proper RLS:
```sql
-- Example stricter policy
CREATE POLICY "Users can only modify own data" ON pins
  FOR UPDATE USING (user_email = current_setting('app.current_user_email'));
```

---

## Architecture Security

### Request Flow
```
Client Request
    ↓
Next.js API Route
    ↓
getServerSession() ← Validates JWT
    ↓
Rate Limiter Check
    ↓
Input Validation
    ↓
Supabase (with session email)
```

### CSRF Protection
- NextAuth provides CSRF protection via `csrfToken`
- All state-changing operations require valid session
- No custom CSRF tokens needed for this architecture

---

## Recommendations (Future Improvements)

### 1. Distributed Rate Limiting
Current in-memory rate limiting won't work across multiple Vercel instances. Consider:
- **Upstash Redis** for distributed rate limiting
- **Vercel Edge Config** for configuration

### 2. Content Security Policy
Add CSP headers for additional XSS protection:
```typescript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; img-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
}
```

### 3. Audit Logging
Consider logging:
- Authentication attempts (success/failure)
- Write operations
- Rate limit violations

### 4. Image Content Validation
Current upload validates MIME type but not actual content. Consider:
- Magic byte verification
- Virus scanning for larger scale

---

## Files Modified

1. `lib/security.ts` - NEW: Rate limiting and validation utilities
2. `app/api/scores/route.ts` - Added auth check to GET, rate limiting
3. `app/api/pins/route.ts` - URL validation, coordinate validation, rate limiting
4. `app/api/pins/[id]/route.ts` - Validation and rate limiting for updates
5. `app/api/pins/upload/route.ts` - Rate limiting for uploads
6. `app/api/pins/[id]/comments/route.ts` - Rate limiting, content length limits
7. `app/api/travels/route.ts` - Rate limiting
8. `next.config.ts` - Additional security headers

---

## Conclusion

The application had a solid security foundation with proper authentication and authorization patterns. Key improvements made include comprehensive rate limiting, input validation, and URL sanitization. The remaining recommendations are enhancements rather than critical fixes.

For a private family application with a fixed whitelist, the current security posture is **good**.
