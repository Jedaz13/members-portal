/**
 * Gut Healing Academy - Referral Tracker
 *
 * Add this script to any external page (quiz, offer, landing pages) to enable
 * referral tracking. It captures ?ref= parameters, stores them in a 14-day
 * cookie, and auto-appends the ref code to links pointing to the members portal.
 *
 * Usage: <script src="https://app.guthealingacademy.com/referral-tracker.js"></script>
 */
(function() {
    'use strict';

    var COOKIE_DOMAIN = '.guthealingacademy.com';
    var COOKIE_DAYS = 14;
    var COOKIE_NAME = 'ref_code';
    var LS_KEY = 'referral_code';
    var PORTAL_PATTERNS = [
        'app.guthealingacademy.com',
        '/signup',
        '/index.html'
    ];

    // Get ref code from URL
    var urlParams = new URLSearchParams(window.location.search);
    var refCode = urlParams.get('ref');

    // If ref code is in URL, store it
    if (refCode) {
        // Set cookie with 14-day expiry
        var expires = new Date();
        expires.setDate(expires.getDate() + COOKIE_DAYS);
        document.cookie = COOKIE_NAME + '=' + encodeURIComponent(refCode) +
            ';expires=' + expires.toUTCString() +
            ';path=/;domain=' + COOKIE_DOMAIN + ';SameSite=Lax';
        // Backup in localStorage
        try { localStorage.setItem(LS_KEY, refCode); } catch(e) {}
    }

    // Read ref code from cookie
    function getRefFromCookie() {
        var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    // Read ref code from any available source
    function getRefCode() {
        if (refCode) return refCode;
        var fromCookie = getRefFromCookie();
        if (fromCookie) return fromCookie;
        try { return localStorage.getItem(LS_KEY) || null; } catch(e) { return null; }
    }

    // Append ref code to links pointing to the members portal
    function appendRefToLinks() {
        var ref = getRefCode();
        if (!ref) return;

        document.querySelectorAll('a[href]').forEach(function(link) {
            var href = link.getAttribute('href');
            if (!href) return;

            var isPortalLink = PORTAL_PATTERNS.some(function(pattern) {
                return href.indexOf(pattern) !== -1;
            });

            if (isPortalLink) {
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

    // Observe dynamic content changes
    var target = document.body || document.documentElement;
    if (target && typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function() { appendRefToLinks(); });
        observer.observe(target, { childList: true, subtree: true });
    }

    // Expose helper for manual use in redirects
    window.GHA_Referral = {
        getRefCode: getRefCode,
        buildUrl: function(baseUrl) {
            var ref = getRefCode();
            if (!ref) return baseUrl;
            var url;
            try { url = new URL(baseUrl); } catch(e) { return baseUrl; }
            if (!url.searchParams.has('ref')) {
                url.searchParams.set('ref', ref);
            }
            return url.toString();
        }
    };
})();
