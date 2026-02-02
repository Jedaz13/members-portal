# Referral System - External Pages Setup Guide

## Overview

The referral system tracks users through: **Quiz -> Signup -> Trial -> Paid Activation**.

Referral links look like: `https://guthealingacademy.com/quiz?ref=CODE`

The members portal (app.guthealingacademy.com) already handles tracking once users arrive
at signup.html or index.html. But the **external pages** (quiz, offer pages) need a small
script to preserve the `?ref=` parameter through the funnel.

---

## What You Need to Add

### 1. Add This Script to ALL Pages That Receive Referral Traffic

This includes: `quiz-4`, `offer-4`, `offer-3`, and any landing pages.

Add this script snippet **in the `<head>` or at the top of `<body>`** on each page:

```html
<script>
// === REFERRAL TRACKING (add to quiz & offer pages) ===
(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var refCode = urlParams.get('ref');

    // If ref code is in URL, store it in cookie (14-day expiry)
    if (refCode) {
        var expires = new Date();
        expires.setDate(expires.getDate() + 14);
        document.cookie = 'ref_code=' + encodeURIComponent(refCode) +
            ';expires=' + expires.toUTCString() +
            ';path=/;domain=.guthealingacademy.com;SameSite=Lax';
        // Also store in localStorage as backup
        try { localStorage.setItem('referral_code', refCode); } catch(e) {}
    }

    // Read existing ref code from cookie (for pages loaded without ?ref=)
    function getRefCode() {
        var match = document.cookie.match(/(?:^|;\s*)ref_code=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    // Append ref code to any outgoing links to the members portal
    function appendRefToLinks() {
        var ref = refCode || getRefCode();
        if (!ref) return;

        document.querySelectorAll('a[href]').forEach(function(link) {
            var href = link.getAttribute('href');
            // Only modify links pointing to the members portal
            if (href && (
                href.includes('app.guthealingacademy.com') ||
                href.includes('/signup') ||
                href.includes('/index.html')
            )) {
                var url;
                try { url = new URL(href, window.location.origin); } catch(e) { return; }
                if (!url.searchParams.has('ref')) {
                    url.searchParams.set('ref', ref);
                    link.setAttribute('href', url.toString());
                }
            }
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendRefToLinks);
    } else {
        appendRefToLinks();
    }

    // Also run after any dynamic content loads (for SPA-like pages)
    var observer = new MutationObserver(function() { appendRefToLinks(); });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
</script>
```

### 2. Quiz Result -> Signup Redirect

When the quiz is completed and you redirect the user to sign up, make sure to include
the ref parameter:

```javascript
// BEFORE (no referral tracking):
window.location.href = 'https://app.guthealingacademy.com/signup.html?email=' + userEmail;

// AFTER (with referral tracking):
var ref = '';
var refMatch = document.cookie.match(/(?:^|;\s*)ref_code=([^;]*)/);
if (refMatch) ref = decodeURIComponent(refMatch[1]);
// Or from localStorage:
if (!ref) try { ref = localStorage.getItem('referral_code') || ''; } catch(e) {}

var signupUrl = 'https://app.guthealingacademy.com/signup.html?email=' + encodeURIComponent(userEmail);
if (ref) signupUrl += '&ref=' + encodeURIComponent(ref);
window.location.href = signupUrl;
```

### 3. Offer Pages -> Checkout/Signup Links

On offer-3, offer-4, etc., the script from step 1 will automatically append `?ref=`
to links pointing to the members portal. If you have JavaScript-triggered redirects
(button onclick, form submissions), add the ref parameter manually:

```javascript
// Get ref code from cookie or localStorage
function getRefCode() {
    var match = document.cookie.match(/(?:^|;\s*)ref_code=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
    try { return localStorage.getItem('referral_code') || ''; } catch(e) { return ''; }
}

// Use in your redirect:
var url = 'https://app.guthealingacademy.com/signup.html';
var ref = getRefCode();
if (ref) url += '?ref=' + encodeURIComponent(ref);
window.location.href = url;
```

---

## How the 14-Day Cookie Attribution Works

1. User clicks referral link: `guthealingacademy.com/quiz?ref=abc123`
2. Script sets cookie `ref_code=abc123` with 14-day expiry and `.guthealingacademy.com` domain
3. User browses quiz pages, offer pages - cookie persists across pages
4. User signs up days later (even without clicking the referral link again)
5. Signup page reads cookie/localStorage and stores the ref code
6. On login, the members portal creates a referral record attributing to `abc123`

The cookie uses `domain=.guthealingacademy.com` so it works across subdomains
(guthealingacademy.com, app.guthealingacademy.com, www.guthealingacademy.com).

---

## Important: Cookie Domain

If the quiz/offer pages are on a **different domain** than the members portal
(e.g., quiz is on `guthealingacademy.com` and portal is on `app.guthealingacademy.com`),
the cookie domain `.guthealingacademy.com` will work across both.

If they're on completely different domains, you'll need to pass `?ref=` explicitly
in every redirect URL between domains. The localStorage fallback won't work across
different domains.

---

## Pages to Update

| Page | What to Add |
|------|------------|
| Quiz landing (quiz-4) | Full script from step 1 |
| Quiz result / redirect | Ref param in signup redirect (step 2) |
| Offer page (offer-3) | Full script from step 1 |
| Offer page (offer-4) | Full script from step 1 |
| Any other landing page | Full script from step 1 |

---

## Testing

1. Visit `https://guthealingacademy.com/quiz?ref=testcode`
2. Check browser cookies - should see `ref_code=testcode`
3. Navigate through quiz, reach signup
4. On signup page, check localStorage has `referral_code=testcode`
5. Create account and sign in
6. In Supabase, check `referrals` table for a new row with `referrer_code=testcode`
7. Check `users` table - the new user should have `referred_by=testcode`

## Commission Trigger

Commissions are only generated when:
- A referred user's status becomes `active` (paid subscription, NOT just trial)
- The admin clicks "Mark Paid" in the admin console for that month
- Default rate: 20% of the subscription price ($47 monthly = $9.40, $297 annual = $59.40)
- Minimum payout threshold: $50
- One-time commission per referred user (not recurring)
- Refunds in the first month: admin can click "Refund" on the commission to claw it back
