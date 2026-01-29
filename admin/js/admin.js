/**
 * Admin Console - Gut Healing Academy
 * Handles authentication, tab navigation, and support queue management
 */

// ============================================
// Configuration
// ============================================
const ADMIN_CONFIG = {
    supportWebhookUrl: 'https://hook.eu1.make.com/lk1drwd5cr6fjcjj6hejxsy8o3kkxv9z',
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
    if (tabParam && ['support', 'qa', 'quiz-analytics', 'members', 'settings'].includes(tabParam)) {
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
    } else if (tabId === 'quiz-analytics') {
        initializeQuizAnalytics();
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

// ============================================
// Quiz Analytics Dashboard
// ============================================

// Quiz Analytics State
let quizDateRange = 'today';
let quizStartDate = null;
let quizEndDate = null;
let quizFunnelData = [];
let quizDailyData = [];
let quizActiveSessionsData = [];
let quizActiveSessionsTimer = null;
let quizTableSortColumn = 'screen_index';
let quizTableSortDirection = 'asc';

// Chart instances
let funnelChart = null;
let trendsChart = null;
let primaryComplaintChart = null;
let stressConnectionChart = null;
let lifeImpactChart = null;

// Screen reference data for Quiz-4
const QUIZ_SCREENS = [
    { index: 0, id: 'future_vision', name: 'Future Vision', phase: 'YOUR GOALS' },
    { index: 1, id: 'timeline', name: 'Timeline', phase: 'YOUR GOALS' },
    { index: 2, id: 'primary_complaint', name: 'Primary Complaint', phase: 'YOUR GOALS' },
    { index: 3, id: 'duration', name: 'Duration', phase: 'YOUR GOALS' },
    { index: 4, id: 'validation_duration', name: 'Duration Validation', phase: 'YOUR GOALS' },
    { index: 5, id: 'bm_relief', name: 'BM Relief', phase: 'YOUR SYMPTOMS' },
    { index: 6, id: 'flare_frequency', name: 'Flare Frequency', phase: 'YOUR SYMPTOMS' },
    { index: 7, id: 'stool_changes', name: 'Stool Changes', phase: 'YOUR SYMPTOMS' },
    { index: 8, id: 'progress_validation', name: 'Progress Validation', phase: 'YOUR SYMPTOMS' },
    { index: 9, id: 'treatments_tried', name: 'Treatments Tried', phase: 'YOUR SYMPTOMS' },
    { index: 10, id: 'diagnosis_history', name: 'Diagnosis History', phase: 'YOUR SYMPTOMS' },
    { index: 11, id: 'name_capture', name: 'Name Capture', phase: 'YOUR SYMPTOMS' },
    { index: 12, id: 'why_different', name: 'Why Different', phase: 'WHY THIS WORKS' },
    { index: 13, id: 'testimonial', name: 'Testimonial', phase: 'WHY THIS WORKS' },
    { index: 14, id: 'knowledge_intro', name: 'Knowledge Intro', phase: 'QUICK GUT CHECK' },
    { index: 15, id: 'knowledge_eating_speed', name: 'Eating Speed', phase: 'QUICK GUT CHECK' },
    { index: 16, id: 'knowledge_eating_response', name: 'Eating Response', phase: 'QUICK GUT CHECK' },
    { index: 17, id: 'knowledge_fodmap', name: 'FODMAP', phase: 'QUICK GUT CHECK' },
    { index: 18, id: 'knowledge_fodmap_response', name: 'FODMAP Response', phase: 'QUICK GUT CHECK' },
    { index: 19, id: 'stress_connection', name: 'Stress Connection', phase: 'YOUR PROFILE' },
    { index: 20, id: 'stress_validation', name: 'Stress Validation', phase: 'YOUR PROFILE' },
    { index: 21, id: 'safety_blood', name: 'Safety Blood', phase: 'FINAL QUESTIONS' },
    { index: 22, id: 'safety_weight', name: 'Safety Weight', phase: 'FINAL QUESTIONS' },
    { index: 23, id: 'life_impact', name: 'Life Impact', phase: 'YOUR RESULTS' },
    { index: 24, id: 'email_capture', name: 'Email Capture', phase: 'YOUR RESULTS' },
    { index: 25, id: 'vision_optional', name: 'Vision Optional', phase: 'YOUR RESULTS' },
    { index: 26, id: 'loading_sequence', name: 'Loading Sequence', phase: 'YOUR RESULTS' },
    { index: 27, id: 'results_page', name: 'Results Page', phase: 'YOUR RESULTS' }
];

// Phase colors for charts
const PHASE_COLORS = {
    'YOUR GOALS': '#6B9080',
    'YOUR SYMPTOMS': '#A4C3B2',
    'WHY THIS WORKS': '#CCE3DE',
    'QUICK GUT CHECK': '#F9C74F',
    'YOUR PROFILE': '#F8961E',
    'FINAL QUESTIONS': '#F3722C',
    'YOUR RESULTS': '#90BE6D'
};

// ============================================
// Quiz Analytics Initialization
// ============================================
async function initializeQuizAnalytics() {
    setupQuizAnalyticsEventListeners();
    await loadAllQuizData();
    startActiveSessionsRefresh();
}

function setupQuizAnalyticsEventListeners() {
    // Date range buttons
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const range = btn.dataset.range;
            if (range === 'custom') {
                document.getElementById('custom-date-range').style.display = 'flex';
            } else {
                document.getElementById('custom-date-range').style.display = 'none';
                quizDateRange = range;
                loadAllQuizData();
            }
        });
    });

    // Custom date apply button
    const applyDatesBtn = document.getElementById('btn-apply-dates');
    if (applyDatesBtn) {
        applyDatesBtn.addEventListener('click', () => {
            quizStartDate = document.getElementById('quiz-start-date').value;
            quizEndDate = document.getElementById('quiz-end-date').value;
            if (quizStartDate && quizEndDate) {
                quizDateRange = 'custom';
                loadAllQuizData();
            } else {
                showToast('Please select both start and end dates', 'warning');
            }
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('btn-quiz-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadAllQuizData());
    }

    // Table sorting
    document.querySelectorAll('#screen-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (quizTableSortColumn === column) {
                quizTableSortDirection = quizTableSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                quizTableSortColumn = column;
                quizTableSortDirection = 'asc';
            }
            renderScreenTable();
        });
    });

    // Auto-refresh toggle for active sessions
    const quizAutoRefreshToggle = document.getElementById('quiz-auto-refresh');
    if (quizAutoRefreshToggle) {
        quizAutoRefreshToggle.addEventListener('change', (e) => {
            toggleQuizAutoRefresh(e.target.checked);
        });
    }
}

// ============================================
// Date Range Helpers
// ============================================
function getDateRange() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (quizDateRange) {
        case 'today':
            return { start: today, end: today };
        case '7d':
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            return { start: sevenDaysAgo.toISOString().split('T')[0], end: today };
        case '30d':
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
            return { start: thirtyDaysAgo.toISOString().split('T')[0], end: today };
        case 'custom':
            return { start: quizStartDate, end: quizEndDate };
        default:
            return { start: today, end: today };
    }
}

// ============================================
// Data Loading Functions
// ============================================
async function loadAllQuizData() {
    const refreshBtn = document.getElementById('btn-quiz-refresh');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        await Promise.all([
            loadQuizOverviewStats(),
            loadQuizFunnelData(),
            loadQuizDailyStats(),
            loadQuizActiveSessions(),
            loadAnswerDistributions()
        ]);
    } catch (err) {
        console.error('Error loading quiz data:', err);
        showToast('Failed to load some quiz data', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

async function loadQuizOverviewStats() {
    const { start, end } = getDateRange();
    const startDate = `${start}T00:00:00.000Z`;
    const endDate = `${end}T23:59:59.999Z`;

    try {
        // Get quiz starts
        const { data: startsData, error: startsError } = await supabaseClient
            .from('quiz_events')
            .select('session_id', { count: 'exact', head: true })
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'quiz_start')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Get email captures
        const { data: emailsData, count: emailCount, error: emailsError } = await supabaseClient
            .from('quiz_events')
            .select('session_id', { count: 'exact', head: true })
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'email_capture')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Get completions
        const { data: completionsData, count: completionCount, error: completionsError } = await supabaseClient
            .from('quiz_events')
            .select('session_id', { count: 'exact', head: true })
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'quiz_complete')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Get unique sessions for starts count
        const { data: uniqueStarts, error: uniqueStartsError } = await supabaseClient
            .from('quiz_events')
            .select('session_id')
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'quiz_start')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        const totalStarts = uniqueStarts ? uniqueStarts.length : 0;
        const emailCaptures = emailCount || 0;
        const completions = completionCount || 0;

        // Calculate rates
        const emailRate = totalStarts > 0 ? ((emailCaptures / totalStarts) * 100).toFixed(1) : 0;
        const completionRate = totalStarts > 0 ? ((completions / totalStarts) * 100).toFixed(1) : 0;

        // Get average completion time
        const { data: completionTimes, error: timesError } = await supabaseClient
            .from('quiz_events')
            .select('time_since_start_seconds')
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'quiz_complete')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .not('time_since_start_seconds', 'is', null);

        let avgTime = '--';
        if (completionTimes && completionTimes.length > 0) {
            const totalTime = completionTimes.reduce((sum, e) => sum + (e.time_since_start_seconds || 0), 0);
            const avgSeconds = totalTime / completionTimes.length;
            avgTime = formatDuration(avgSeconds);
        }

        // Update UI
        document.getElementById('stat-total-starts').textContent = totalStarts.toLocaleString();
        document.getElementById('stat-email-captures').textContent = emailCaptures.toLocaleString();
        document.getElementById('stat-email-rate').textContent = `${emailRate}% rate`;
        document.getElementById('stat-completions').textContent = completions.toLocaleString();
        document.getElementById('stat-completion-rate').textContent = `${completionRate}% rate`;
        document.getElementById('stat-avg-time').textContent = avgTime;

    } catch (err) {
        console.error('Error loading overview stats:', err);
    }
}

async function loadQuizFunnelData() {
    const { start, end } = getDateRange();
    const startDate = `${start}T00:00:00.000Z`;
    const endDate = `${end}T23:59:59.999Z`;

    try {
        // Try to use quiz_funnel_stats view (has avg_time_seconds)
        let { data: funnelStats, error: statsError } = await supabaseClient
            .from('quiz_funnel_stats')
            .select('*')
            .eq('quiz_source', 'quiz-4')
            .gte('date', start)
            .lte('date', end)
            .order('screen_index');

        let funnelData = [];

        if (!statsError && funnelStats && funnelStats.length > 0) {
            // Aggregate data across dates and calculate drop-off
            funnelData = aggregateFunnelStats(funnelStats);
        } else {
            // Fall back to quiz_dropoff_analysis or raw events
            let { data: dropoffData, error: dropoffError } = await supabaseClient
                .from('quiz_dropoff_analysis')
                .select('*')
                .eq('quiz_source', 'quiz-4')
                .order('screen_index');

            if (!dropoffError && dropoffData && dropoffData.length > 0) {
                funnelData = dropoffData;
            } else {
                console.log('Calculating funnel from raw events...');
                funnelData = await calculateFunnelFromEvents(startDate, endDate);
            }
        }

        quizFunnelData = funnelData || [];
        renderFunnelChart();
        renderScreenTable();

    } catch (err) {
        console.error('Error loading funnel data:', err);
        quizFunnelData = [];
        renderFunnelChart();
        renderScreenTable();
    }
}

// Aggregate quiz_funnel_stats data across dates
function aggregateFunnelStats(stats) {
    // Group by screen_index
    const screenData = {};
    let totalStarts = 0;

    stats.forEach(row => {
        const idx = row.screen_index;
        if (!screenData[idx]) {
            screenData[idx] = {
                screen_index: idx,
                screen_id: row.screen_id,
                screen_name: row.screen_name,
                phase_name: row.phase_name,
                total_sessions: 0,
                total_time: 0,
                time_count: 0
            };
        }
        screenData[idx].total_sessions += row.unique_sessions || 0;
        if (row.avg_time_seconds && row.avg_time_seconds > 0) {
            screenData[idx].total_time += row.avg_time_seconds * (row.unique_sessions || 1);
            screenData[idx].time_count += row.unique_sessions || 1;
        }
        // Track total starts from screen 0
        if (idx === 0) {
            totalStarts += row.unique_sessions || 0;
        }
    });

    // Convert to array and calculate metrics
    const result = [];
    let prevSessions = totalStarts;

    QUIZ_SCREENS.forEach(screen => {
        const data = screenData[screen.index];
        const sessionsReached = data ? data.total_sessions : 0;
        const pctOfStarts = totalStarts > 0 ? (sessionsReached / totalStarts * 100) : 0;
        const dropoff = prevSessions > 0 ? ((prevSessions - sessionsReached) / prevSessions * 100) : 0;
        const avgTime = data && data.time_count > 0 ? data.total_time / data.time_count : 0;

        result.push({
            screen_index: screen.index,
            screen_id: data?.screen_id || screen.id,
            screen_name: data?.screen_name || screen.name,
            phase_name: data?.phase_name || screen.phase,
            sessions_reached: sessionsReached,
            pct_of_starts: pctOfStarts,
            dropoff_pct: screen.index === 0 ? 0 : dropoff,
            avg_time: avgTime
        });

        prevSessions = sessionsReached;
    });

    return result;
}

async function calculateFunnelFromEvents(startDate, endDate) {
    // Get screen_view events with created_at for time calculation - limit to 10000 rows
    const { data: screenViews, error } = await supabaseClient
        .from('quiz_events')
        .select('screen_index, screen_id, screen_name, phase_name, session_id, time_on_screen_seconds, created_at')
        .eq('quiz_source', 'quiz-4')
        .eq('event_type', 'screen_view')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('session_id')
        .order('created_at')
        .limit(10000);

    if (error || !screenViews) {
        console.error('Error fetching screen views:', error);
        return [];
    }

    // Get total starts for percentage calculation
    const { data: starts } = await supabaseClient
        .from('quiz_events')
        .select('session_id')
        .eq('quiz_source', 'quiz-4')
        .eq('event_type', 'quiz_start')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const totalStarts = starts ? new Set(starts.map(s => s.session_id)).size : 0;

    // Calculate time on screen from consecutive events
    // Group events by session first
    const sessionEvents = {};
    screenViews.forEach(event => {
        if (!sessionEvents[event.session_id]) {
            sessionEvents[event.session_id] = [];
        }
        sessionEvents[event.session_id].push(event);
    });

    // Calculate time spent on each screen by looking at time until next screen
    const screenTimes = {}; // { screen_index: [time1, time2, ...] }
    Object.values(sessionEvents).forEach(events => {
        // Sort by created_at just in case
        events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        for (let i = 0; i < events.length; i++) {
            const currentEvent = events[i];
            const screenIndex = currentEvent.screen_index;

            if (!screenTimes[screenIndex]) {
                screenTimes[screenIndex] = [];
            }

            // If time_on_screen_seconds is available, use it
            if (currentEvent.time_on_screen_seconds && currentEvent.time_on_screen_seconds > 0) {
                screenTimes[screenIndex].push(currentEvent.time_on_screen_seconds);
            } else if (i < events.length - 1) {
                // Calculate time from next screen view
                const nextEvent = events[i + 1];
                const timeDiff = (new Date(nextEvent.created_at) - new Date(currentEvent.created_at)) / 1000;
                // Only include reasonable times (0-300 seconds = 5 minutes max)
                if (timeDiff > 0 && timeDiff <= 300) {
                    screenTimes[screenIndex].push(timeDiff);
                }
            }
        }
    });

    // Group by screen for session counting
    const screenStats = {};
    screenViews.forEach(event => {
        const key = event.screen_index;
        if (!screenStats[key]) {
            screenStats[key] = {
                screen_index: event.screen_index,
                screen_id: event.screen_id,
                screen_name: event.screen_name,
                phase_name: event.phase_name,
                sessions: new Set()
            };
        }
        screenStats[key].sessions.add(event.session_id);
    });

    // Convert to array and calculate metrics
    const result = [];
    let prevSessions = totalStarts;

    QUIZ_SCREENS.forEach(screen => {
        const stats = screenStats[screen.index];
        const sessionsReached = stats ? stats.sessions.size : 0;
        const pctOfStarts = totalStarts > 0 ? (sessionsReached / totalStarts * 100) : 0;
        const dropoff = prevSessions > 0 ? ((prevSessions - sessionsReached) / prevSessions * 100) : 0;

        // Calculate avg time from the screenTimes array
        const times = screenTimes[screen.index] || [];
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

        result.push({
            screen_index: screen.index,
            screen_id: stats?.screen_id || screen.id,
            screen_name: stats?.screen_name || screen.name,
            phase_name: stats?.phase_name || screen.phase,
            sessions_reached: sessionsReached,
            pct_of_starts: pctOfStarts,
            dropoff_pct: screen.index === 0 ? 0 : dropoff,
            avg_time: avgTime
        });

        prevSessions = sessionsReached;
    });

    return result;
}

async function loadQuizDailyStats() {
    const { start, end } = getDateRange();

    try {
        // Try to use the pre-built view
        let { data: dailyData, error } = await supabaseClient
            .from('quiz_daily_stats')
            .select('*')
            .eq('quiz_source', 'quiz-4')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });

        // If view doesn't exist, calculate from raw events
        if (error || !dailyData || dailyData.length === 0) {
            console.log('Calculating daily stats from raw events...');
            dailyData = await calculateDailyStatsFromEvents(start, end);
        }

        quizDailyData = dailyData || [];
        renderTrendsChart();

    } catch (err) {
        console.error('Error loading daily stats:', err);
        quizDailyData = [];
        renderTrendsChart();
    }
}

async function calculateDailyStatsFromEvents(start, end) {
    const startDate = `${start}T00:00:00.000Z`;
    const endDate = `${end}T23:59:59.999Z`;

    // Limit to 5000 events to prevent excessive reads
    const { data: events, error } = await supabaseClient
        .from('quiz_events')
        .select('event_type, session_id, created_at')
        .eq('quiz_source', 'quiz-4')
        .in('event_type', ['quiz_start', 'email_capture', 'quiz_complete'])
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .limit(5000);

    if (error || !events) return [];

    // Group by date
    const dailyStats = {};
    events.forEach(event => {
        const date = event.created_at.split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = {
                date,
                starts: new Set(),
                emails: new Set(),
                completions: new Set()
            };
        }

        if (event.event_type === 'quiz_start') {
            dailyStats[date].starts.add(event.session_id);
        } else if (event.event_type === 'email_capture') {
            dailyStats[date].emails.add(event.session_id);
        } else if (event.event_type === 'quiz_complete') {
            dailyStats[date].completions.add(event.session_id);
        }
    });

    return Object.values(dailyStats).map(d => ({
        date: d.date,
        quiz_starts: d.starts.size,
        email_captures: d.emails.size,
        completions: d.completions.size
    })).sort((a, b) => a.date.localeCompare(b.date));
}

async function loadQuizActiveSessions() {
    try {
        // Try to use the pre-built view
        let { data: activeSessions, error } = await supabaseClient
            .from('quiz_active_sessions')
            .select('*')
            .eq('quiz_source', 'quiz-4')
            .order('last_activity', { ascending: false });

        // If view doesn't exist, calculate manually
        if (error || !activeSessions) {
            console.log('Calculating active sessions from raw events...');
            activeSessions = await calculateActiveSessionsFromEvents();
        }

        quizActiveSessionsData = activeSessions || [];
        renderActiveSessions();

    } catch (err) {
        console.error('Error loading active sessions:', err);
        quizActiveSessionsData = [];
        renderActiveSessions();
    }
}

async function calculateActiveSessionsFromEvents() {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentEvents, error } = await supabaseClient
        .from('quiz_events')
        .select('session_id, screen_index, screen_id, screen_name, phase_name, user_email, created_at')
        .eq('quiz_source', 'quiz-4')
        .gte('created_at', thirtyMinsAgo)
        .order('created_at', { ascending: false });

    if (error || !recentEvents) return [];

    // Group by session and get latest event
    const sessions = {};
    recentEvents.forEach(event => {
        if (!sessions[event.session_id]) {
            sessions[event.session_id] = {
                session_id: event.session_id,
                current_screen_index: event.screen_index,
                current_screen_id: event.screen_id,
                current_screen_name: event.screen_name,
                current_phase: event.phase_name,
                has_email: !!event.user_email,
                last_activity: event.created_at,
                started_at: event.created_at
            };
        } else {
            // Update started_at with earliest event
            if (event.created_at < sessions[event.session_id].started_at) {
                sessions[event.session_id].started_at = event.created_at;
            }
            // Check for email
            if (event.user_email) {
                sessions[event.session_id].has_email = true;
            }
        }
    });

    return Object.values(sessions);
}

async function loadAnswerDistributions() {
    const { start, end } = getDateRange();
    const startDate = `${start}T00:00:00.000Z`;
    const endDate = `${end}T23:59:59.999Z`;

    try {
        // Load primary_complaint distribution
        const { data: primaryData } = await supabaseClient
            .from('quiz_events')
            .select('answer_value, answer_text')
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'answer')
            .eq('screen_id', 'primary_complaint')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Load stress_connection distribution
        const { data: stressData } = await supabaseClient
            .from('quiz_events')
            .select('answer_value, answer_text')
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'answer')
            .eq('screen_id', 'stress_connection')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        // Load life_impact distribution
        const { data: impactData } = await supabaseClient
            .from('quiz_events')
            .select('answer_value, answer_text')
            .eq('quiz_source', 'quiz-4')
            .eq('event_type', 'answer')
            .eq('screen_id', 'life_impact')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        renderAnswerChart('chart-primary-complaint', primaryData || [], 'primaryComplaintChart');
        renderAnswerChart('chart-stress-connection', stressData || [], 'stressConnectionChart');
        renderAnswerChart('chart-life-impact', impactData || [], 'lifeImpactChart');

    } catch (err) {
        console.error('Error loading answer distributions:', err);
    }
}

// ============================================
// Rendering Functions
// ============================================
function renderFunnelChart() {
    const ctx = document.getElementById('funnel-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (funnelChart) {
        funnelChart.destroy();
    }

    if (quizFunnelData.length === 0) {
        ctx.parentElement.innerHTML = '<div class="empty-state"><p>No funnel data available for the selected date range.</p></div>';
        return;
    }

    // Prepare data
    const labels = quizFunnelData.map(d => `${d.screen_index}`);
    const sessionsData = quizFunnelData.map(d => d.sessions_reached);
    const dropoffData = quizFunnelData.map(d => d.dropoff_pct || 0);
    // Use consistent phase colors for bars
    const backgroundColors = quizFunnelData.map(d => PHASE_COLORS[d.phase_name] || '#6B9080');

    // Use border colors to highlight drop-off points
    const borderColors = quizFunnelData.map(d => {
        if (d.dropoff_pct > 20) return '#E07A5F';  // High drop-off - red border
        if (d.dropoff_pct > 10) return '#F8961E';  // Medium drop-off - orange border
        return PHASE_COLORS[d.phase_name] || '#6B9080';  // Normal - same as fill
    });

    // Border width increases for high drop-off
    const borderWidths = quizFunnelData.map(d => {
        if (d.dropoff_pct > 20) return 3;
        if (d.dropoff_pct > 10) return 2;
        return 1;
    });

    funnelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sessions Reached',
                data: sessionsData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: borderWidths,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            const screen = quizFunnelData[idx];
                            return `Screen ${screen.screen_index}: ${screen.screen_name}`;
                        },
                        label: (item) => {
                            const idx = item.dataIndex;
                            const screen = quizFunnelData[idx];
                            return [
                                `Sessions: ${screen.sessions_reached}`,
                                `% of Starts: ${screen.pct_of_starts?.toFixed(1)}%`,
                                `Drop-off: ${screen.dropoff_pct?.toFixed(1)}%`,
                                `Phase: ${screen.phase_name}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Screen Index'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sessions'
                    }
                }
            }
        }
    });

    // Render legend with highest drop-off points
    renderFunnelLegend();
}

function renderFunnelLegend() {
    const legendEl = document.getElementById('funnel-legend');
    if (!legendEl) return;

    // Find top 3 drop-off points
    const sortedByDropoff = [...quizFunnelData]
        .filter(d => d.screen_index > 0)
        .sort((a, b) => (b.dropoff_pct || 0) - (a.dropoff_pct || 0))
        .slice(0, 3);

    if (sortedByDropoff.length === 0) {
        legendEl.innerHTML = '<p class="funnel-legend-note">No significant drop-off points detected.</p>';
        return;
    }

    legendEl.innerHTML = `
        <div class="funnel-legend-title">Highest Drop-off Points:</div>
        <div class="funnel-legend-items">
            ${sortedByDropoff.map(d => `
                <div class="funnel-legend-item ${d.dropoff_pct > 20 ? 'high' : d.dropoff_pct > 10 ? 'medium' : ''}">
                    <span class="legend-screen">Screen ${d.screen_index}: ${d.screen_name}</span>
                    <span class="legend-dropoff">${d.dropoff_pct?.toFixed(1)}% drop-off</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderScreenTable() {
    const tbody = document.getElementById('screen-table-body');
    if (!tbody) return;

    if (quizFunnelData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No data available for the selected date range.</td></tr>';
        return;
    }

    // Sort data
    const sortedData = [...quizFunnelData].sort((a, b) => {
        let aVal = a[quizTableSortColumn];
        let bVal = b[quizTableSortColumn];

        // Handle null/undefined
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Handle numeric vs string
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return quizTableSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return quizTableSortDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    // Update sort arrows
    document.querySelectorAll('#screen-table th.sortable').forEach(th => {
        const arrow = th.querySelector('.sort-arrow');
        if (th.dataset.sort === quizTableSortColumn) {
            arrow.textContent = quizTableSortDirection === 'asc' ? ' ▲' : ' ▼';
            th.classList.add('sorted');
        } else {
            arrow.textContent = '';
            th.classList.remove('sorted');
        }
    });

    tbody.innerHTML = sortedData.map(row => {
        const dropoffClass = row.dropoff_pct > 20 ? 'dropoff-high' : row.dropoff_pct > 10 ? 'dropoff-medium' : '';
        return `
            <tr>
                <td>${row.screen_index}</td>
                <td><code>${escapeHtml(row.screen_id || '')}</code></td>
                <td>${escapeHtml(row.screen_name || '')}</td>
                <td><span class="phase-badge" style="background-color: ${PHASE_COLORS[row.phase_name] || '#ccc'}">${escapeHtml(row.phase_name || '')}</span></td>
                <td>${row.sessions_reached?.toLocaleString() || 0}</td>
                <td>${row.pct_of_starts?.toFixed(1) || 0}%</td>
                <td class="${dropoffClass}">${row.dropoff_pct?.toFixed(1) || 0}%</td>
                <td>${formatDuration(row.avg_time || 0)}</td>
            </tr>
        `;
    }).join('');
}

function renderActiveSessions() {
    const tbody = document.getElementById('active-sessions-body');
    const countEl = document.getElementById('active-count');

    if (!tbody) return;

    const count = quizActiveSessionsData.length;
    if (countEl) countEl.textContent = count;

    if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No active sessions in the last 30 minutes.</td></tr>';
        return;
    }

    tbody.innerHTML = quizActiveSessionsData.map(session => {
        const timeInQuiz = session.started_at
            ? formatDuration((Date.now() - new Date(session.started_at).getTime()) / 1000)
            : '--';

        return `
            <tr>
                <td><code>${escapeHtml(session.session_id?.substring(0, 8) || '')}...</code></td>
                <td>${escapeHtml(session.current_screen_name || `Screen ${session.current_screen_index}`)}</td>
                <td><span class="phase-badge" style="background-color: ${PHASE_COLORS[session.current_phase] || '#ccc'}">${escapeHtml(session.current_phase || '')}</span></td>
                <td>${timeInQuiz}</td>
                <td>
                    <span class="email-indicator ${session.has_email ? 'has-email' : 'no-email'}">
                        ${session.has_email ? '✓' : '✗'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTrendsChart() {
    const ctx = document.getElementById('trends-chart');
    if (!ctx) return;

    // Destroy existing chart
    if (trendsChart) {
        trendsChart.destroy();
    }

    if (quizDailyData.length === 0) {
        ctx.parentElement.innerHTML = '<div class="empty-state"><p>No trend data available for the selected date range.</p></div>';
        return;
    }

    const labels = quizDailyData.map(d => {
        const date = new Date(d.date + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Quiz Starts',
                    data: quizDailyData.map(d => d.quiz_starts || 0),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Email Captures',
                    data: quizDailyData.map(d => d.email_captures || 0),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Completions',
                    data: quizDailyData.map(d => d.completions || 0),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

function renderAnswerChart(canvasId, data, chartVarName) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy existing chart
    if (window[chartVarName]) {
        window[chartVarName].destroy();
    }

    if (!data || data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="empty-state-small"><p>No data</p></div>';
        return;
    }

    // Aggregate answers
    const answerCounts = {};
    data.forEach(d => {
        const key = d.answer_text || d.answer_value || 'Unknown';
        answerCounts[key] = (answerCounts[key] || 0) + 1;
    });

    const labels = Object.keys(answerCounts);
    const values = Object.values(answerCounts);
    const colors = [
        '#6B9080', '#A4C3B2', '#CCE3DE', '#F9C74F', '#F8961E',
        '#F3722C', '#90BE6D', '#43AA8B', '#577590', '#277DA1'
    ];

    window[chartVarName] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const total = values.reduce((a, b) => a + b, 0);
                            const pct = ((item.raw / total) * 100).toFixed(1);
                            return `${item.label}: ${item.raw} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// Active Sessions Auto-Refresh
// ============================================
let quizAutoRefreshEnabled = false;

function startActiveSessionsRefresh() {
    // Don't auto-start - require user opt-in to save on queries
    // User can enable via the checkbox if they want real-time updates
}

function toggleQuizAutoRefresh(enabled) {
    quizAutoRefreshEnabled = enabled;

    if (quizActiveSessionsTimer) {
        clearInterval(quizActiveSessionsTimer);
        quizActiveSessionsTimer = null;
    }

    if (enabled) {
        // Refresh every 60 seconds instead of 30 to reduce query load
        quizActiveSessionsTimer = setInterval(() => {
            const quizPanel = document.getElementById('quiz-analytics-panel');
            if (quizPanel && quizPanel.classList.contains('active')) {
                loadQuizActiveSessions();
            }
        }, 60000); // 60 seconds (was 30)

        // Immediate refresh when enabled
        loadQuizActiveSessions();
    }
}

function stopActiveSessionsRefresh() {
    if (quizActiveSessionsTimer) {
        clearInterval(quizActiveSessionsTimer);
        quizActiveSessionsTimer = null;
    }
}

// ============================================
// Utility Functions for Quiz Analytics
// ============================================
function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0s';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
}
