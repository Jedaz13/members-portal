// Gut Healing Academy - Tracking & Analytics Module
// Comprehensive event tracking for GTM/GA4 integration

// ============================================
// DATA LAYER UTILITIES
// ============================================

// Ensure dataLayer exists
function getDataLayer() {
    window.dataLayer = window.dataLayer || [];
    return window.dataLayer;
}

// Hash email for privacy-safe tracking (SHA-256)
async function hashEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedEmail);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// USER IDENTIFICATION
// ============================================

async function identifyUser(userData) {
    var dataLayer = getDataLayer();

    // Calculate trial days remaining
    var trialDaysRemaining = null;
    if (userData.trialEndsAt && userData.subscriptionStatus === 'trial') {
        var trialEnd = new Date(userData.trialEndsAt);
        var now = new Date();
        trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Hash email for privacy-safe tracking
    var emailHashed = await hashEmail(userData.email);

    // Set shared user ID cookie for cross-domain tracking
    setSharedUserId(userData.id);

    dataLayer.push({
        'event': 'user_identified',
        'userId': userData.id,
        'userEmailHashed': emailHashed,
        'userStatus': userData.subscriptionStatus,
        'trialDaysRemaining': trialDaysRemaining,
        'gutPattern': userData.gutPattern || null,
        'protocolAssigned': userData.protocolName || null,
        'signupDate': userData.signupDate || null,
        'hasPractitioner': !!userData.practitionerId,

        // For GA4 User-ID feature
        'user_id': userData.id,

        // For Facebook Advanced Matching
        'user_data': {
            'em': emailHashed
        }
    });

    console.log('User identified for tracking:', userData.id);
}

// Clear user on logout
function clearUser() {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'user_logout',
        'userId': null,
        'userStatus': 'anonymous'
    });

    // Remove shared user ID cookie
    document.cookie = 'gha_user_id=; domain=.guthealingacademy.com; path=/; max-age=0';
}

// ============================================
// CROSS-DOMAIN TRACKING
// ============================================

function setSharedUserId(userId) {
    // Set cookie on root domain so it's accessible from both domains
    var maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `gha_user_id=${userId}; domain=.guthealingacademy.com; path=/; max-age=${maxAge}; secure; samesite=lax`;
}

function getSharedUserId() {
    var match = document.cookie.match(/gha_user_id=([^;]+)/);
    return match ? match[1] : null;
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

function trackPageView(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'page_view',
        'pageType': data.pageType,
        'pageName': data.pageName,
        'pagePath': data.pagePath,
        'protocolName': data.protocolName || null,
        'protocolDay': data.protocolDay || null,
        'protocolWeek': data.protocolWeek || null
    });
}

// Track tab changes as virtual page views
function trackTabView(tabName, tabType) {
    trackPageView({
        pageType: tabType,
        pageName: tabName,
        pagePath: `/dashboard#${tabType}`
    });
}

// ============================================
// PROTOCOL ENGAGEMENT
// ============================================

function trackProtocolView(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'protocol_view',
        'protocolName': data.protocolName,
        'protocolDay': data.protocolDay || null,
        'protocolWeek': data.protocolWeek || null,
        'contentLocked': data.isLocked || false
    });
}

function trackDailyTracking(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'tracking_submit',
        'protocolName': data.protocolName,
        'trackingDay': data.trackingDay,
        'completionPercent': data.completionPercent,
        'symptomTrend': data.symptomTrend || null
    });
}

function trackStreak(currentStreak, longestStreak) {
    var dataLayer = getDataLayer();
    var milestone = null;
    if (currentStreak === 7) milestone = '1_week';
    else if (currentStreak === 14) milestone = '2_weeks';
    else if (currentStreak === 30) milestone = '1_month';

    dataLayer.push({
        'event': 'streak_update',
        'currentStreak': currentStreak,
        'longestStreak': longestStreak,
        'streakMilestone': milestone
    });
}

// ============================================
// MESSAGING TRACKING
// ============================================

function trackMessageSent(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'message_sent',
        'messageType': data.messageType,
        'hasAttachment': data.hasAttachment,
        'isFirstMessage': data.isFirstMessage
    });
}

function trackMessageReceived() {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'practitioner_response_received'
    });
}

// Determine message type from content
function determineMessageType(message) {
    var lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('?')) return 'question';
    if (lowerMessage.includes('symptom') || lowerMessage.includes('feeling')) return 'symptom_update';
    return 'general';
}

// ============================================
// RESOURCE ENGAGEMENT
// ============================================

function trackResourceView(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'resource_view',
        'resourceId': data.resourceId,
        'resourceName': data.resourceName,
        'resourceType': data.resourceType,
        'resourceCategory': data.resourceCategory,
        'contentLocked': data.isLocked
    });
}

function trackResourceClick(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'resource_click',
        'resourceId': data.resourceId,
        'resourceName': data.resourceName,
        'resourceType': data.resourceType,
        'resourceCategory': data.resourceCategory
    });
}

// ============================================
// UPGRADE/CONVERSION TRACKING
// ============================================

function trackUpgradePromptView(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'upgrade_prompt_view',
        'promptLocation': data.promptLocation,
        'trialDaysRemaining': data.daysRemaining || null,
        'triggerReason': data.triggerReason || null
    });
}

function trackUpgradePromptClick(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'upgrade_prompt_click',
        'promptLocation': data.promptLocation,
        'trialDaysRemaining': data.daysRemaining || null
    });
}

function trackBeginCheckout(data) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'begin_checkout',
        'ecommerce': {
            'currency': data.currency || 'USD',
            'value': data.value,
            'items': [{
                'item_id': data.planType === '6-month' ? '6_month_membership' : 'monthly_membership',
                'item_name': data.planType === '6-month' ? '6-Month Healing Journey' : 'Monthly Membership',
                'item_category': 'subscription',
                'item_variant': data.planType,
                'price': data.value,
                'quantity': 1,
                'discount': data.discountAmount || 0
            }]
        },
        'checkoutType': data.planType,
        'originalPrice': data.originalPrice,
        'discountAmount': data.discountAmount || 0,
        'couponCode': data.couponCode || null
    });
}

// ============================================
// TRIAL TRACKING
// ============================================

var trackedTrialMilestones = new Set();

function trackTrialMilestone(daysRemaining, userStatus) {
    if (userStatus !== 'trial') return;

    var dataLayer = getDataLayer();
    var milestones = [7, 3, 2, 1, 0];

    milestones.forEach(function(milestone) {
        if (daysRemaining <= milestone && !trackedTrialMilestones.has(milestone)) {
            trackedTrialMilestones.add(milestone);

            dataLayer.push({
                'event': 'trial_milestone',
                'trialDaysRemaining': daysRemaining,
                'milestone': milestone === 0 ? 'expired' : milestone + '_days_left'
            });

            // If 3 days or less, track as high-intent upgrade prompt
            if (milestone <= 3) {
                trackUpgradePromptView({
                    promptLocation: 'trial_expiring_banner',
                    daysRemaining: daysRemaining,
                    triggerReason: 'trial_ending'
                });
            }
        }
    });
}

// ============================================
// ERROR & FEATURE TRACKING
// ============================================

function trackError(errorType, errorMessage, errorLocation) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'error_occurred',
        'errorType': errorType,
        'errorMessage': errorMessage,
        'errorLocation': errorLocation
    });
}

function trackFeatureUsage(featureName, action) {
    var dataLayer = getDataLayer();
    dataLayer.push({
        'event': 'feature_used',
        'featureName': featureName,
        'featureAction': action
    });
}

// ============================================
// INITIALIZE TRACKING
// ============================================

function initializeTracking() {
    console.log('Tracking module initialized');

    // Track initial page view
    trackPageView({
        pageType: 'login',
        pageName: 'Member Portal Login',
        pagePath: window.location.pathname
    });

    // Check for shared user ID from main site
    var sharedUserId = getSharedUserId();
    if (sharedUserId) {
        console.log('Found shared user ID from cross-domain:', sharedUserId);
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTracking);
} else {
    initializeTracking();
}
