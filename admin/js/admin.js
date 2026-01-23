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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMzU1MDAsImV4cCI6MjA1MTkxMTUwMH0.04xC9JWKSGrwCYBYqekHU0Rgy_X8pXRqgFIuWGZMUzI';

// Initialize Supabase client (using different name to avoid conflict with SDK global)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        const { data: userData, error: userError } = await supabase
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
        const { data, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking admin access:', error);
            return false;
        }

        return data?.is_admin === true;
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
        // Q&A tab content is static or embedded
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
        const { data, error } = await supabase
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
        const { error: dbError } = await supabase
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
        const { error: dbError } = await supabase
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
