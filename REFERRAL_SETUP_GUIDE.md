# Referral System - External Pages Setup Guide

## Overview

The referral system tracks users through: **Quiz -> Signup -> Trial -> Paid Activation**.

Referral links look like: `https://guthealingacademy.com/quiz?ref=CODE`

The members portal (app.guthealingacademy.com) already handles tracking once users arrive
at signup.html or index.html. But the **external pages** (quiz, offer pages) need a small
script to preserve the `?ref=` parameter through the funnel.

---

## Quick Setup (Recommended)

### 1. Add One Script Tag to Every External Page

Add this single line to the `<head>` of every quiz, offer, and landing page:

```html
<script src="https://app.guthealingacademy.com/referral-tracker.js"></script>
```

That's it. The script automatically:
- Captures `?ref=` from the URL and stores it in a 14-day cookie
- Backs up the ref code in localStorage
- Auto-appends `?ref=` to all links pointing to the members portal
- Watches for dynamically added links and updates them too

### 2. For JavaScript Redirects (Quiz Results, Button Clicks)

If your page redirects users via JavaScript (not a regular `<a>` link), use the
built-in helper to build the URL with the ref code attached:

```javascript
// Quiz result redirect
var signupUrl = 'https://app.guthealingacademy.com/signup.html?email=' + encodeURIComponent(userEmail);
window.location.href = GHA_Referral.buildUrl(signupUrl);

// Button click redirect
var url = 'https://app.guthealingacademy.com/signup.html';
window.location.href = GHA_Referral.buildUrl(url);
```

`GHA_Referral.buildUrl(url)` appends `?ref=CODE` if a referral code exists,
or returns the URL unchanged if there's no referral.

You can also get the raw ref code:

```javascript
var ref = GHA_Referral.getRefCode(); // returns code string or null
```

---

## Pages to Update

| Page | What to Add |
|------|------------|
| Quiz landing (quiz-4) | Script tag in `<head>` |
| Quiz result / redirect | Script tag + `GHA_Referral.buildUrl()` in redirect |
| Offer page (offer-3) | Script tag in `<head>` |
| Offer page (offer-4) | Script tag in `<head>` |
| Any new landing page | Script tag in `<head>` |

Every new page you create just needs the one `<script>` tag. No other changes
are needed unless the page uses JavaScript redirects.

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

## Alternative: Inline Script (No External File)

If you prefer not to load the external script, you can copy-paste this into the
`<head>` of each page:

```html
<script>
(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var refCode = urlParams.get('ref');

    if (refCode) {
        var expires = new Date();
        expires.setDate(expires.getDate() + 14);
        document.cookie = 'ref_code=' + encodeURIComponent(refCode) +
            ';expires=' + expires.toUTCString() +
            ';path=/;domain=.guthealingacademy.com;SameSite=Lax';
        try { localStorage.setItem('referral_code', refCode); } catch(e) {}
    }

    function getRefCode() {
        var match = document.cookie.match(/(?:^|;\s*)ref_code=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    function appendRefToLinks() {
        var ref = refCode || getRefCode();
        if (!ref) return;
        document.querySelectorAll('a[href]').forEach(function(link) {
            var href = link.getAttribute('href');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendRefToLinks);
    } else {
        appendRefToLinks();
    }

    var observer = new MutationObserver(function() { appendRefToLinks(); });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
</script>
```

Note: The inline version does NOT expose `GHA_Referral.buildUrl()`. For JavaScript
redirects with the inline version, manually read the ref code:

```javascript
var ref = '';
var refMatch = document.cookie.match(/(?:^|;\s*)ref_code=([^;]*)/);
if (refMatch) ref = decodeURIComponent(refMatch[1]);
if (!ref) try { ref = localStorage.getItem('referral_code') || ''; } catch(e) {}

var signupUrl = 'https://app.guthealingacademy.com/signup.html?email=' + encodeURIComponent(userEmail);
if (ref) signupUrl += '&ref=' + encodeURIComponent(ref);
window.location.href = signupUrl;
```

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
