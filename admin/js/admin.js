/**
 * Admin Console - Gut Healing Academy
 * Handles authentication, tab navigation, and support queue management
 */

// ============================================
// Configuration
// ============================================
const ADMIN_CONFIG = {
    supportWebhookUrl: 'https://hook.eu1.make.com/7oa9tp3w77vdu3jyzu3ik9e6pa6qvh2n',
    autoRefreshInterval: 30000, // 30 seconds
    defaultTab: 'support'
};

// Supabase Configuration (matching main app)
const SUPABASE_URL = 'https://mwabljnngygkmahjgvps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjQ3MzgsImV4cCI6MjA4MTEwMDczOH0.rbZYj1aXui_xZ0qkg7QONdHppnJghT2r0ycZwtr3a-E';

// Initialize Supabase client (using different name to avoid conflict with SDK global)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Protocol names for display
const PROTOCOL_NAMES = {
    1: 'Bloating',
    2: 'IBS-C',
    3: 'IBS-D',
    4: 'IBS-M',
    5: 'Post-SIBO',
    6: 'Gut-Brain'
};

// ============================================
// Global State
// ============================================
let currentUser = null;
let currentAdmin = null;
let supportConversations = [];
let currentFilter = 'all';
let autoRefreshEnabled = false;
let autoRefreshTimer = null;
let highlightedConversationId = null;

// Q&A State
let qaSessions = [];
let qaQuestions = [];
let selectedSessionDate = null;
let qaAutoRefreshEnabled = false;
let qaAutoRefreshTimer = null;
let hosts = [];

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Parse URL parameters for deep linking
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const idParam = urlParams.get('id');

    if (idParam) {
        highlightedConversationId = idParam;
    }

    // Set default tab from URL or config
    if (tabParam && ['support', 'qa', 'members', 'settings'].includes(tabParam)) {
        ADMIN_CONFIG.defaultTab = tabParam;
    }

    // Check authentication
    await checkAuth();

    // Set up event listeners
    setupEventListeners();
});

// ============================================
// Authentication
// ============================================
async function checkAuth() {
    showView('loading-view');

    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error || !session) {
            // Redirect to login
            window.location.href = '/index.html';
            return;
        }

        currentUser = session.user;

        // Check if user is admin
        const isAdmin = await checkAdminAccess(currentUser.id);

        if (!isAdmin) {
            showView('access-denied-view');
            return;
        }

        // Fetch admin user details
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
        }

        currentAdmin = userData || { email: currentUser.email };

        // Update UI with user info
        updateAdminUI();

        // Show dashboard
        showView('dashboard-view');

        // Initialize tabs and load data
        initializeTabs();

    } catch (err) {
        console.error('Auth error:', err);
        window.location.href = '/index.html';
    }
}

async function checkAdminAccess(userId) {
    try {
        // Get current user's email from auth session
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user?.email) {
            console.error('No user email found');
            return false;
        }

        // Check if user is admin using email lookup
        // (email-based lookup handles the case where quiz takers have a different UUID)
        const { data, error } = await supabaseClient
            .from('users')
            .select('is_admin, role')
            .eq('email', user.email)
            .single();

        if (error) {
            console.error('Error checking admin access:', error);
            return false;
        }

        // Allow access if is_admin is true OR role is practitioner
        return data?.is_admin === true || data?.role === 'practitioner';
    } catch (err) {
        console.error('Admin check error:', err);
        return false;
    }
}

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '/index.html';
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/index.html';
    }
}

// ============================================
// View Management
// ============================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
}

function updateAdminUI() {
    // Update user name in header
    const userName = currentAdmin.first_name || currentAdmin.name || currentUser.email.split('@')[0];
    const userNameEl = document.getElementById('admin-user-name');
    if (userNameEl) {
        userNameEl.textContent = userName;
    }

    // Update welcome message
    const welcomeEl = document.querySelector('.admin-welcome h1');
    if (welcomeEl) {
        welcomeEl.textContent = `Welcome, ${userName}`;
    }
}

// ============================================
// Tab Navigation
// ============================================
function initializeTabs() {
    const defaultTab = ADMIN_CONFIG.defaultTab;
    switchTab(defaultTab);
}

function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`${tabId}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    // Load tab-specific data
    if (tabId === 'support') {
        loadSupportConversations();
    } else if (tabId === 'qa') {
        initializeQATab();
    }

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    if (tabId !== 'support') {
        url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url);
}

function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) {
                switchTab(btn.dataset.tab);
            }
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Profile button
    const profileBtn = document.getElementById('btn-profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = '/profile.html';
        });
    }

    // Filter select
    const filterSelect = document.getElementById('status-filter');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            renderSupportConversations();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadSupportConversations();
        });
    }

    // Auto-refresh toggle
    const autoRefreshToggle = document.getElementById('auto-refresh');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', (e) => {
            autoRefreshEnabled = e.target.checked;
            if (autoRefreshEnabled) {
                startAutoRefresh();
            } else {
                stopAutoRefresh();
            }
        });
    }
}

// ============================================
// Support Conversations
// ============================================
async function loadSupportConversations() {
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        const { data, error } = await supabaseClient
            .from('support_conversations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading conversations:', error);
            showToast('Failed to load conversations', 'error');
            return;
        }

        supportConversations = data || [];
        renderSupportConversations();
        updateFilterStats();

        // Scroll to highlighted conversation if exists
        if (highlightedConversationId) {
            setTimeout(() => {
                scrollToConversation(highlightedConversationId);
                highlightedConversationId = null; // Clear after scrolling
            }, 100);
        }

    } catch (err) {
        console.error('Load error:', err);
        showToast('Failed to load conversations', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

function renderSupportConversations() {
    const container = document.getElementById('questions-list');
    if (!container) return;

    // Filter conversations
    let filtered = supportConversations;
    if (currentFilter !== 'all') {
        filtered = supportConversations.filter(c => c.status === currentFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No ${currentFilter === 'all' ? '' : currentFilter + ' '}questions yet</h3>
                <p>Questions from the offer page will appear here when visitors submit them.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(conv => renderConversationCard(conv)).join('');

    // Add event listeners to action buttons
    setupCardEventListeners();
}

function renderConversationCard(conv) {
    const isHighlighted = conv.id === highlightedConversationId;
    const statusClass = conv.status || 'pending';
    const statusLabel = formatStatus(conv.status);
    const timeAgo = formatTimeAgo(conv.created_at);

    // Build context tags
    let contextTags = '';
    if (conv.protocol_name) {
        contextTags += `<span class="context-tag protocol">${escapeHtml(conv.protocol_name)}</span>`;
    }
    if (conv.primary_complaint_label) {
        contextTags += `<span class="context-tag">${escapeHtml(conv.primary_complaint_label)}</span>`;
    }
    if (conv.duration) {
        contextTags += `<span class="context-tag">${escapeHtml(conv.duration)}</span>`;
    }
    if (conv.treatments_formatted) {
        contextTags += `<span class="context-tag">Tried: ${escapeHtml(conv.treatments_formatted)}</span>`;
    }
    if (conv.gut_brain) {
        contextTags += `<span class="context-tag stress">Stress-triggered</span>`;
    }

    // Build response section if exists
    let responseSection = '';
    if (conv.admin_response) {
        const respondedAgo = conv.responded_at ? formatTimeAgo(conv.responded_at) : '';
        responseSection = `
            <div class="question-response">
                <div class="response-label">Your Response</div>
                <div class="response-text">${escapeHtml(conv.admin_response)}</div>
                ${respondedAgo ? `<div class="response-meta">Responded ${respondedAgo}</div>` : ''}
            </div>
        `;
    }

    // Build action buttons based on status
    let actionButtons = '';
    if (conv.status === 'pending') {
        actionButtons = `
            <button class="btn-primary btn-reply" data-id="${conv.id}">Reply</button>
            <button class="btn-secondary btn-status" data-id="${conv.id}" data-status="call_booked">Mark: Call Booked</button>
            <button class="btn-text btn-status" data-id="${conv.id}" data-status="closed">Close</button>
        `;
    } else if (conv.status === 'responded') {
        actionButtons = `
            <button class="btn-secondary btn-status" data-id="${conv.id}" data-status="call_booked">Mark: Call Booked</button>
            <button class="btn-secondary btn-status" data-id="${conv.id}" data-status="converted">Mark: Converted</button>
            <button class="btn-text btn-status" data-id="${conv.id}" data-status="closed">Close</button>
        `;
    } else if (conv.status === 'call_booked') {
        actionButtons = `
            <button class="btn-success btn-status" data-id="${conv.id}" data-status="converted">Mark: Converted</button>
            <button class="btn-text btn-status" data-id="${conv.id}" data-status="closed">Close</button>
        `;
    }

    return `
        <div class="question-card${isHighlighted ? ' highlighted' : ''}" data-id="${conv.id}">
            <div class="question-card-header">
                <div class="question-card-header-left">
                    <span class="question-status ${statusClass}">${statusLabel}</span>
                    <span class="question-user">
                        ${conv.name ? escapeHtml(conv.name) : 'Anonymous'}
                        (<a href="mailto:${escapeHtml(conv.email)}">${escapeHtml(conv.email)}</a>)
                    </span>
                </div>
                <span class="question-time">${timeAgo}</span>
            </div>
            <div class="question-card-body">
                ${contextTags ? `<div class="question-context">${contextTags}</div>` : ''}
                <div class="question-text">"${escapeHtml(conv.visitor_message)}"</div>
                ${responseSection}
                <div class="reply-form" id="reply-form-${conv.id}">
                    <textarea class="reply-textarea" id="reply-text-${conv.id}" placeholder="Type your response..."></textarea>
                    <div class="reply-actions">
                        <button class="btn-primary btn-send-reply" data-id="${conv.id}">Send Response</button>
                        <button class="btn-secondary btn-cancel-reply" data-id="${conv.id}">Cancel</button>
                    </div>
                </div>
            </div>
            <div class="question-card-footer">
                <div class="footer-meta">
                    ${conv.utm_source ? `<span class="context-tag">Source: ${escapeHtml(conv.utm_source)}</span>` : ''}
                </div>
                <div class="footer-actions">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

function setupCardEventListeners() {
    // Reply buttons
    document.querySelectorAll('.btn-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            showReplyForm(id);
        });
    });

    // Send reply buttons
    document.querySelectorAll('.btn-send-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            sendReply(id);
        });
    });

    // Cancel reply buttons
    document.querySelectorAll('.btn-cancel-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            hideReplyForm(id);
        });
    });

    // Status change buttons
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const status = btn.dataset.status;
            updateConversationStatus(id, status);
        });
    });
}

function showReplyForm(id) {
    const form = document.getElementById(`reply-form-${id}`);
    if (form) {
        form.classList.add('active');
        const textarea = document.getElementById(`reply-text-${id}`);
        if (textarea) {
            textarea.focus();
        }
    }
}

function hideReplyForm(id) {
    const form = document.getElementById(`reply-form-${id}`);
    if (form) {
        form.classList.remove('active');
    }
}

async function sendReply(id) {
    const textarea = document.getElementById(`reply-text-${id}`);
    const sendBtn = document.querySelector(`.btn-send-reply[data-id="${id}"]`);

    if (!textarea || !textarea.value.trim()) {
        showToast('Please enter a response', 'warning');
        return;
    }

    const response = textarea.value.trim();
    const conversation = supportConversations.find(c => c.id === id);

    if (!conversation) {
        showToast('Conversation not found', 'error');
        return;
    }

    // Show loading state
    if (sendBtn) {
        sendBtn.classList.add('btn-loading');
        sendBtn.disabled = true;
    }

    try {
        // Update database
        const { error: dbError } = await supabaseClient
            .from('support_conversations')
            .update({
                admin_response: response,
                responded_at: new Date().toISOString(),
                status: 'responded',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (dbError) {
            throw dbError;
        }

        // Send webhook to Make.com
        if (ADMIN_CONFIG.supportWebhookUrl !== 'MAKE_WEBHOOK_URL_HERE') {
            try {
                await fetch(ADMIN_CONFIG.supportWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'admin_response',
                        conversation_id: id,
                        visitor_email: conversation.email,
                        visitor_name: conversation.name,
                        admin_response: response,
                        original_question: conversation.visitor_message,
                        protocol_name: conversation.protocol_name
                    })
                });
            } catch (webhookErr) {
                console.warn('Webhook error (non-critical):', webhookErr);
            }
        }

        showToast('Response sent successfully', 'success');

        // Reload conversations
        await loadSupportConversations();

    } catch (err) {
        console.error('Send reply error:', err);
        showToast('Failed to send response', 'error');
    } finally {
        if (sendBtn) {
            sendBtn.classList.remove('btn-loading');
            sendBtn.disabled = false;
        }
    }
}

async function updateConversationStatus(id, newStatus) {
    const conversation = supportConversations.find(c => c.id === id);

    if (!conversation) {
        showToast('Conversation not found', 'error');
        return;
    }

    try {
        // Update database
        const { error: dbError } = await supabaseClient
            .from('support_conversations')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (dbError) {
            throw dbError;
        }

        // Send webhook to Make.com
        if (ADMIN_CONFIG.supportWebhookUrl !== 'MAKE_WEBHOOK_URL_HERE') {
            try {
                await fetch(ADMIN_CONFIG.supportWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'status_update',
                        conversation_id: id,
                        new_status: newStatus
                    })
                });
            } catch (webhookErr) {
                console.warn('Webhook error (non-critical):', webhookErr);
            }
        }

        showToast(`Status updated to ${formatStatus(newStatus)}`, 'success');

        // Reload conversations
        await loadSupportConversations();

    } catch (err) {
        console.error('Status update error:', err);
        showToast('Failed to update status', 'error');
    }
}

function updateFilterStats() {
    const statsEl = document.getElementById('filter-stats');
    if (!statsEl) return;

    const total = supportConversations.length;
    const pending = supportConversations.filter(c => c.status === 'pending').length;

    statsEl.innerHTML = `<strong>${total}</strong> questions (${pending} pending)`;
}

function scrollToConversation(id) {
    const card = document.querySelector(`.question-card[data-id="${id}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ============================================
// Auto Refresh
// ============================================
function startAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }

    autoRefreshTimer = setInterval(() => {
        loadSupportConversations();
    }, ADMIN_CONFIG.autoRefreshInterval);
}

function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// ============================================
// Utility Functions
// ============================================
function formatStatus(status) {
    const statusMap = {
        'pending': '🟡 PENDING',
        'responded': '🟢 RESPONDED',
        'call_booked': '📞 CALL BOOKED',
        'converted': '✅ CONVERTED',
        'closed': '⬜ CLOSED'
    };
    return statusMap[status] || status;
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// Q&A Sessions Management
// ============================================
async function initializeQATab() {
    await loadHosts();
    await loadSessions();
    setupQAEventListeners();
}

function setupQAEventListeners() {
    // New session button
    const newSessionBtn = document.getElementById('btn-new-session');
    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', showNewSessionForm);
    }

    // Cancel session form
    const cancelSessionBtn = document.getElementById('btn-cancel-session');
    if (cancelSessionBtn) {
        cancelSessionBtn.addEventListener('click', hideSessionForm);
    }

    // Session form submit
    const sessionForm = document.getElementById('session-form');
    if (sessionForm) {
        sessionForm.addEventListener('submit', handleSessionFormSubmit);
    }

    // Session filter for questions
    const sessionFilter = document.getElementById('qa-session-filter');
    if (sessionFilter) {
        sessionFilter.addEventListener('change', (e) => {
            selectedSessionDate = e.target.value;
            if (selectedSessionDate) {
                loadQAQuestions();
            } else {
                renderEmptyQAQuestions();
            }
        });
    }

    // Q&A refresh button
    const qaRefreshBtn = document.getElementById('btn-qa-refresh');
    if (qaRefreshBtn) {
        qaRefreshBtn.addEventListener('click', loadQAQuestions);
    }

    // Q&A auto-refresh toggle
    const qaAutoRefreshToggle = document.getElementById('qa-auto-refresh');
    if (qaAutoRefreshToggle) {
        qaAutoRefreshToggle.addEventListener('change', (e) => {
            qaAutoRefreshEnabled = e.target.checked;
            if (qaAutoRefreshEnabled) {
                qaAutoRefreshTimer = setInterval(loadQAQuestions, ADMIN_CONFIG.autoRefreshInterval);
            } else {
                if (qaAutoRefreshTimer) clearInterval(qaAutoRefreshTimer);
            }
        });
    }
}

async function loadHosts() {
    try {
        // Load all practitioners who can be hosts
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, name, email, credentials, bio, specializations')
            .eq('role', 'practitioner')
            .order('name');

        if (error) {
            console.error('Error loading hosts:', error);
            return;
        }

        hosts = data || [];

        // Populate host dropdown
        const hostSelect = document.getElementById('session-host');
        if (hostSelect) {
            hostSelect.innerHTML = hosts.map(h =>
                `<option value="${h.id}">${escapeHtml(h.name || h.email)}${h.credentials ? ` (${escapeHtml(h.credentials)})` : ''}</option>`
            ).join('');
        }
    } catch (err) {
        console.error('Load hosts error:', err);
    }
}

async function loadSessions() {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Loading sessions...</p>
        </div>
    `;

    try {
        const { data, error } = await supabaseClient
            .from('live_qa_sessions')
            .select('*')
            .order('session_date', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error loading sessions:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Error loading sessions</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
            return;
        }

        qaSessions = data || [];
        renderSessions();
        populateSessionFilter();

    } catch (err) {
        console.error('Load sessions error:', err);
    }
}

function renderSessions() {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    if (qaSessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No sessions yet</h3>
                <p>Create your first live Q&A session using the button above.</p>
            </div>
        `;
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = qaSessions.map(session => {
        const isUpcoming = session.session_date >= today && session.status === 'scheduled';
        const statusClass = session.status === 'scheduled' && isUpcoming ? 'upcoming' : session.status;
        const dateFormatted = new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Find host name
        const host = hosts.find(h => h.id === session.host_id);
        const hostName = host ? (host.name || host.email) : 'Unknown';

        return `
            <div class="session-card ${statusClass}" data-id="${session.id}">
                <div class="session-card-left">
                    <div class="session-date-time">
                        <span class="date">${dateFormatted}</span>
                        <span>${session.session_time || ''} ${session.timezone || ''}</span>
                        <span class="session-status-badge ${session.status}">${session.status}</span>
                    </div>
                    <div class="session-topic">${escapeHtml(session.topic || 'No topic set')}</div>
                    <div class="session-host">Host: ${escapeHtml(hostName)}</div>
                </div>
                <div class="session-card-right">
                    <button class="btn-icon btn-edit-session" data-id="${session.id}" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete-session" data-id="${session.id}" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.btn-edit-session').forEach(btn => {
        btn.addEventListener('click', () => editSession(btn.dataset.id));
    });

    document.querySelectorAll('.btn-delete-session').forEach(btn => {
        btn.addEventListener('click', () => deleteSession(btn.dataset.id));
    });
}

function populateSessionFilter() {
    const sessionFilter = document.getElementById('qa-session-filter');
    if (!sessionFilter) return;

    const options = qaSessions.map(s => {
        const dateFormatted = new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        return `<option value="${s.session_date}">${dateFormatted} - ${escapeHtml(s.topic || 'No topic')}</option>`;
    });

    sessionFilter.innerHTML = '<option value="">Select a session...</option>' + options.join('');

    // Auto-select first session if available
    if (qaSessions.length > 0 && !selectedSessionDate) {
        selectedSessionDate = qaSessions[0].session_date;
        sessionFilter.value = selectedSessionDate;
        loadQAQuestions();
    }
}

function showNewSessionForm() {
    document.getElementById('session-form-title').textContent = 'Create New Session';
    document.getElementById('session-id').value = '';
    document.getElementById('session-form').reset();

    // Set default date to next Thursday
    const nextThursday = getNextThursday();
    document.getElementById('session-date').value = nextThursday;
    document.getElementById('session-time').value = '16:00';
    document.getElementById('session-timezone').value = 'GMT';

    document.getElementById('session-form-container').style.display = 'block';
}

function getNextThursday() {
    const today = new Date();
    const day = today.getDay();
    const daysUntilThursday = (4 - day + 7) % 7 || 7;
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday.toISOString().split('T')[0];
}

function hideSessionForm() {
    document.getElementById('session-form-container').style.display = 'none';
    document.getElementById('session-form').reset();
}

function editSession(sessionId) {
    const session = qaSessions.find(s => s.id === sessionId);
    if (!session) return;

    document.getElementById('session-form-title').textContent = 'Edit Session';
    document.getElementById('session-id').value = session.id;
    document.getElementById('session-date').value = session.session_date || '';
    document.getElementById('session-time').value = session.session_time || '';
    document.getElementById('session-timezone').value = session.timezone || 'GMT';
    document.getElementById('session-topic').value = session.topic || '';
    document.getElementById('session-zoom-link').value = session.zoom_link || '';
    document.getElementById('session-host').value = session.host_id || '';
    document.getElementById('session-status').value = session.status || 'scheduled';
    document.getElementById('session-recording').value = session.recording_url || '';
    document.getElementById('session-notes').value = session.notes || '';

    document.getElementById('session-form-container').style.display = 'block';
}

async function handleSessionFormSubmit(e) {
    e.preventDefault();

    const sessionId = document.getElementById('session-id').value;
    const sessionData = {
        session_date: document.getElementById('session-date').value,
        session_time: document.getElementById('session-time').value,
        timezone: document.getElementById('session-timezone').value,
        topic: document.getElementById('session-topic').value,
        zoom_link: document.getElementById('session-zoom-link').value || null,
        host_id: document.getElementById('session-host').value || null,
        status: document.getElementById('session-status').value,
        recording_url: document.getElementById('session-recording').value || null,
        notes: document.getElementById('session-notes').value || null,
        updated_at: new Date().toISOString()
    };

    const saveBtn = document.getElementById('btn-save-session');
    saveBtn.classList.add('btn-loading');
    saveBtn.disabled = true;

    try {
        let error;

        if (sessionId) {
            // Update existing session
            const result = await supabaseClient
                .from('live_qa_sessions')
                .update(sessionData)
                .eq('id', sessionId);
            error = result.error;
        } else {
            // Create new session
            sessionData.created_at = new Date().toISOString();
            const result = await supabaseClient
                .from('live_qa_sessions')
                .insert(sessionData);
            error = result.error;
        }

        if (error) {
            throw error;
        }

        showToast(sessionId ? 'Session updated' : 'Session created', 'success');
        hideSessionForm();
        await loadSessions();

    } catch (err) {
        console.error('Save session error:', err);
        showToast('Failed to save session: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        saveBtn.classList.remove('btn-loading');
        saveBtn.disabled = false;
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('live_qa_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;

        showToast('Session deleted', 'success');
        await loadSessions();

    } catch (err) {
        console.error('Delete session error:', err);
        showToast('Failed to delete session', 'error');
    }
}

// ============================================
// Q&A Questions Management
// ============================================
async function loadQAQuestions() {
    if (!selectedSessionDate) return;

    const container = document.getElementById('qa-questions-list');
    const refreshBtn = document.getElementById('btn-qa-refresh');

    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        const { data, error } = await supabaseClient
            .from('qa_questions')
            .select('*')
            .eq('session_date', selectedSessionDate)
            .order('status', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading questions:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Error loading questions</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
            return;
        }

        qaQuestions = data || [];
        renderQAQuestions();
        updateQAStats();

    } catch (err) {
        console.error('Load questions error:', err);
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

function renderQAQuestions() {
    const container = document.getElementById('qa-questions-list');
    if (!container) return;

    if (qaQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No questions yet</h3>
                <p>Questions will appear here when members submit them for this session.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = qaQuestions.map(q => {
        const protocolName = PROTOCOL_NAMES[q.protocol_type] || 'Unknown';
        const timeFormatted = formatTimeAgo(q.created_at);
        const userName = q.user_name || 'Anonymous';

        const actionButtons = q.status === 'pending' ? `
            <button class="btn-answered" onclick="markQAQuestion('${q.id}', 'answered')">Mark Answered</button>
            <button class="btn-skip" onclick="markQAQuestion('${q.id}', 'skipped')">Skip</button>
        ` : '';

        return `
            <div class="qa-question-card ${q.status}">
                <div class="qa-question-header">
                    <div class="qa-question-user">
                        <span class="qa-question-user-name">${escapeHtml(userName)}</span>
                        <span class="qa-question-protocol">${protocolName}</span>
                    </div>
                    <span class="qa-question-status ${q.status}">${q.status}</span>
                </div>
                <div class="qa-question-text">${escapeHtml(q.question)}</div>
                <div class="qa-question-footer">
                    <span class="qa-question-time">Submitted ${timeFormatted}</span>
                    <div class="qa-question-actions">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderEmptyQAQuestions() {
    const container = document.getElementById('qa-questions-list');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>Select a session</h3>
                <p>Choose a session from the dropdown above to view submitted questions.</p>
            </div>
        `;
    }
}

function updateQAStats() {
    const statsEl = document.getElementById('qa-filter-stats');
    if (!statsEl) return;

    const total = qaQuestions.length;
    const pending = qaQuestions.filter(q => q.status === 'pending').length;

    statsEl.innerHTML = `<strong>${total}</strong> questions (${pending} pending)`;
}

// Global function for onclick handlers
async function markQAQuestion(questionId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('qa_questions')
            .update({ status: newStatus })
            .eq('id', questionId);

        if (error) throw error;

        showToast(`Question marked as ${newStatus}`, 'success');
        await loadQAQuestions();

    } catch (err) {
        console.error('Update question error:', err);
        showToast('Failed to update question', 'error');
    }
}
