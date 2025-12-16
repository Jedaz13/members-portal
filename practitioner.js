// Gut Healing Academy - Practitioner Dashboard
// Complete Practitioner Application

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://mwabljnngygkmahjgvps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjQ3MzgsImV4cCI6MjA4MTEwMDczOH0.rbZYj1aXui_xZ0qkg7QONdHppnJghT2r0ycZwtr3a-E';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentPatients = [];
let currentUnassigned = [];
let currentAlerts = [];
let selectedPatient = null;
let realTimeSubscriptions = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf': return '📄';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp': return '🖼️';
        case 'doc':
        case 'docx': return '📝';
        case 'txt': return '📃';
        default: return '📎';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

// ============================================
// AUTHENTICATION
// ============================================
async function initAuth() {
    showView('loading-view');

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        await handleAuthSuccess(session);
    } else {
        showView('login-view');
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await handleAuthSuccess(session);
        } else if (event === 'SIGNED_OUT') {
            handleSignOut();
        }
    });
}

async function handleAuthSuccess(session) {
    // Update last login time
    await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', session.user.id);

    // Fetch user data including role
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error || !user) {
        console.error('Error fetching user:', error);
        showView('access-denied-view');
        return;
    }

    // Check if user is a practitioner
    if (user.role !== 'practitioner') {
        showView('access-denied-view');
        return;
    }

    currentUser = user;
    await loadDashboard();
}

async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/practitioner.html'
        }
    });

    if (error) {
        console.error('Error signing in:', error);
        showToast('Error signing in. Please try again.');
    }
}

async function signOut() {
    try {
        // Show loading view immediately
        showView('loading-view');

        // Clean up real-time subscriptions
        realTimeSubscriptions.forEach(sub => {
            try {
                sub.unsubscribe();
            } catch (e) {
                console.warn('Error unsubscribing:', e);
            }
        });
        realTimeSubscriptions = [];

        // Sign out from Supabase
        await supabase.auth.signOut();

        // Clean up state
        handleSignOut();
    } catch (err) {
        console.error('Sign out error:', err);
        // Still show login view even if there's an error
        handleSignOut();
    }
}

function handleSignOut() {
    currentUser = null;
    currentPatients = [];
    currentUnassigned = [];
    currentAlerts = [];
    selectedPatient = null;
    showView('login-view');
}

// ============================================
// DASHBOARD LOADING
// ============================================
async function loadDashboard() {
    showView('dashboard-view');

    // Update UI with practitioner info
    document.getElementById('practitioner-name').textContent = currentUser.name || 'Practitioner';

    // Load all tabs data
    await Promise.all([
        loadMyPatients(),
        loadUnassignedPatients(),
        loadAlerts(),
        loadProfile()
    ]);

    // Set up real-time subscriptions
    setupRealTimeSubscriptions();
}

// ============================================
// MY PATIENTS TAB
// ============================================
async function loadMyPatients() {
    const { data, error } = await supabase
        .from('practitioner_patient_summary')
        .select('*')
        .eq('practitioner_id', currentUser.id);

    if (error) {
        console.error('Error loading patients:', error);
        showToast('Error loading patients');
        return;
    }

    currentPatients = data || [];
    updatePatientsCount();
    renderPatientsList();
}

function updatePatientsCount() {
    const count = currentPatients.length;
    const badge = document.getElementById('patients-count');
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderPatientsList() {
    const container = document.getElementById('patients-list');

    // Apply filters
    const protocolFilter = document.getElementById('filter-protocol').value;
    const attentionFilter = document.getElementById('filter-attention').value;
    const sortBy = document.getElementById('sort-by').value;

    let filteredPatients = [...currentPatients];

    // Apply protocol filter
    if (protocolFilter) {
        filteredPatients = filteredPatients.filter(p => p.protocol == protocolFilter);
    }

    // Apply attention filter
    if (attentionFilter === 'needs_attention') {
        filteredPatients = filteredPatients.filter(p => {
            const daysSinceLogin = p.last_login_at ?
                Math.floor((new Date() - new Date(p.last_login_at)) / (1000 * 60 * 60 * 24)) : 999;
            return daysSinceLogin >= 3 || p.unread_messages > 0;
        });
    }

    // Sort patients
    filteredPatients.sort((a, b) => {
        if (sortBy === 'name') {
            return (a.patient_name || '').localeCompare(b.patient_name || '');
        } else if (sortBy === 'days_in_program') {
            return (b.days_in_program || 0) - (a.days_in_program || 0);
        } else { // last_active
            return new Date(b.last_login_at || 0) - new Date(a.last_login_at || 0);
        }
    });

    if (filteredPatients.length === 0) {
        container.innerHTML = '<p class="empty-state">No patients found. Check the Unassigned tab to claim your first patient.</p>';
        return;
    }

    container.innerHTML = `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>Patient Name</th>
                    <th>Protocol</th>
                    <th>Days in Program</th>
                    <th>Last Active</th>
                    <th>Unread</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPatients.map(patient => {
                    const daysSinceLogin = patient.last_login_at ?
                        Math.floor((new Date() - new Date(patient.last_login_at)) / (1000 * 60 * 60 * 24)) : null;
                    const needsAttention = daysSinceLogin >= 3 || patient.unread_messages > 0;

                    return `
                        <tr>
                            <td class="patient-name-cell">${patient.patient_name || 'Unknown'}</td>
                            <td><span class="patient-protocol-badge">${patient.protocol_name || 'N/A'}</span></td>
                            <td>${patient.days_in_program || 0}</td>
                            <td class="last-active-text ${needsAttention ? 'needs-attention' : ''}">
                                ${formatDate(patient.last_login_at)}
                            </td>
                            <td>
                                ${patient.unread_messages > 0 ?
                                    `<span class="unread-badge">${patient.unread_messages}</span>` :
                                    '0'}
                            </td>
                            <td>
                                <span class="patient-status-badge ${patient.assignment_status}">${patient.assignment_status}</span>
                            </td>
                            <td>
                                <button class="btn-view" data-action="view-patient" data-patient-id="${patient.patient_id}">View</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// ============================================
// UNASSIGNED PATIENTS TAB
// ============================================
async function loadUnassignedPatients() {
    const { data, error } = await supabase
        .from('unassigned_patients')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading unassigned patients:', error);
        showToast('Error loading unassigned patients');
        return;
    }

    currentUnassigned = data || [];
    updateUnassignedCount();
    renderUnassignedList();
}

function updateUnassignedCount() {
    const count = currentUnassigned.length;
    const badge = document.getElementById('unassigned-count');
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderUnassignedList() {
    const container = document.getElementById('unassigned-list');

    if (currentUnassigned.length === 0) {
        container.innerHTML = '<p class="empty-state">No unassigned patients at the moment.</p>';
        return;
    }

    container.innerHTML = currentUnassigned.map(patient => `
        <div class="unassigned-card">
            <div class="unassigned-card-header">
                <div>
                    <h4 class="unassigned-card-title">${patient.name || 'New Patient'}</h4>
                    <span class="unassigned-badge">New</span>
                </div>
            </div>

            <div class="unassigned-card-meta">
                <div class="unassigned-card-meta-item">
                    <strong>Protocol:</strong> ${patient.protocol_name || 'N/A'}
                </div>
                <div class="unassigned-card-meta-item">
                    <strong>Primary Complaint:</strong> ${patient.primary_complaint || 'N/A'}
                </div>
                <div class="unassigned-card-meta-item">
                    <strong>Signed up:</strong> ${formatTime(patient.created_at)}
                </div>
                ${patient.unread_messages > 0 ? `
                    <div class="unassigned-card-meta-item">
                        <strong>Has ${patient.unread_messages} unread message(s)</strong>
                    </div>
                ` : ''}
            </div>

            <div id="quiz-${patient.id}" class="quiz-answers hidden">
                <h4>Quiz Responses</h4>
                <div class="quiz-answers-list">
                    ${patient.primary_complaint ? `<div class="quiz-answer-item"><strong>Primary Complaint:</strong> ${patient.primary_complaint}</div>` : ''}
                    ${patient.symptom_frequency ? `<div class="quiz-answer-item"><strong>Symptom Frequency:</strong> ${patient.symptom_frequency}</div>` : ''}
                    ${patient.duration ? `<div class="quiz-answer-item"><strong>Duration:</strong> ${patient.duration}</div>` : ''}
                    ${patient.diagnoses && patient.diagnoses.length ? `<div class="quiz-answer-item"><strong>Previous Diagnoses:</strong> ${patient.diagnoses.join(', ')}</div>` : ''}
                    ${patient.treatments_tried && patient.treatments_tried.length ? `<div class="quiz-answer-item"><strong>Treatments Tried:</strong> ${patient.treatments_tried.join(', ')}</div>` : ''}
                    ${patient.stress_connection ? `<div class="quiz-answer-item"><strong>Stress Connection:</strong> ${patient.stress_connection}</div>` : ''}
                    ${patient.has_stress_component !== null && patient.has_stress_component !== undefined ? `<div class="quiz-answer-item"><strong>Has Stress Component:</strong> ${patient.has_stress_component ? 'Yes' : 'No'}</div>` : ''}
                    ${!patient.primary_complaint && !patient.symptom_frequency && !patient.duration && (!patient.diagnoses || !patient.diagnoses.length) && (!patient.treatments_tried || !patient.treatments_tried.length) && !patient.stress_connection ? '<p class="empty-state">No quiz data available for this patient.</p>' : ''}
                </div>
            </div>

            <div class="unassigned-card-actions">
                <button class="btn-view-quiz" data-action="toggle-quiz" data-patient-id="${patient.id}">View Quiz Answers</button>
                <button class="btn-claim" data-action="claim-patient" data-patient-id="${patient.id}" data-patient-name="${patient.name}">Claim Patient</button>
            </div>
        </div>
    `).join('');
}

function toggleQuizAnswers(patientId, button) {
    const quizDiv = document.getElementById(`quiz-${patientId}`);
    if (!quizDiv) return;

    const isHidden = quizDiv.classList.contains('hidden');
    quizDiv.classList.toggle('hidden');

    // Update button text
    if (button) {
        button.textContent = isHidden ? 'Hide Quiz Answers' : 'View Quiz Answers';
    }
}

// ============================================
// CLAIM PATIENT FUNCTIONALITY
// ============================================
let patientToClaim = null;

function showClaimModal(patientId, patientName) {
    patientToClaim = patientId;
    document.getElementById('claim-patient-name').textContent = patientName;
    document.getElementById('claim-modal').classList.remove('hidden');
}

function hideClaimModal() {
    patientToClaim = null;
    document.getElementById('claim-modal').classList.add('hidden');
}

async function claimPatient() {
    if (!patientToClaim) return;

    try {
        const { data, error } = await supabase.rpc('claim_patient', {
            p_patient_id: patientToClaim,
            p_practitioner_id: currentUser.id
        });

        if (error) throw error;

        if (data && data.success) {
            showToast(`Successfully claimed ${data.patient_name}!`);
            hideClaimModal();

            // Reload both tabs
            await loadMyPatients();
            await loadUnassignedPatients();
        } else {
            showToast(data.error || 'Failed to claim patient');
        }
    } catch (error) {
        console.error('Error claiming patient:', error);
        showToast('Error claiming patient');
    }
}

// ============================================
// ALERTS TAB
// ============================================
async function loadAlerts() {
    const filterValue = document.getElementById('filter-alerts')?.value || 'unresolved';

    let query = supabase
        .from('practitioner_alerts')
        .select('*, users!practitioner_alerts_patient_id_fkey(name)')
        .eq('practitioner_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (filterValue === 'unresolved') {
        query = query.is('resolved_at', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading alerts:', error);
        showToast('Error loading alerts');
        return;
    }

    currentAlerts = data || [];
    updateAlertsCount();
    renderAlertsList();
}

function updateAlertsCount() {
    const unresolvedCount = currentAlerts.filter(a => !a.resolved_at).length;
    const badge = document.getElementById('alerts-count');
    if (unresolvedCount > 0) {
        badge.textContent = unresolvedCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderAlertsList() {
    const container = document.getElementById('alerts-list');

    if (currentAlerts.length === 0) {
        container.innerHTML = '<p class="empty-state">No alerts at the moment. You\'re all caught up!</p>';
        return;
    }

    const alertIcons = {
        symptom_spike: '🔴',
        no_login: '🟡',
        unread_message: '💬',
        needs_review: '📋'
    };

    container.innerHTML = currentAlerts.map(alert => `
        <div class="alert-card ${alert.priority}">
            <div class="alert-card-header">
                <div class="alert-icon-title">
                    <span class="alert-icon">${alertIcons[alert.alert_type] || '⚠️'}</span>
                    <div>
                        <h4 class="alert-title">${alert.title}</h4>
                        <p class="alert-description">${alert.description}</p>
                    </div>
                </div>
                <span class="alert-priority ${alert.priority}">${alert.priority}</span>
            </div>

            <p class="alert-time">${formatTime(alert.created_at)}</p>

            ${!alert.resolved_at ? `
                <div class="alert-actions">
                    <button class="btn-view" data-action="view-patient" data-patient-id="${alert.patient_id}">View Patient</button>
                    <button class="btn-resolve" data-action="resolve-alert" data-alert-id="${alert.id}">Mark Resolved</button>
                </div>
            ` : `
                <p class="alert-time">Resolved ${formatTime(alert.resolved_at)}</p>
            `}
        </div>
    `).join('');
}

async function resolveAlert(alertId) {
    try {
        const { data, error } = await supabase.rpc('resolve_alert', {
            p_alert_id: alertId,
            p_resolved_by: currentUser.id
        });

        if (error) throw error;

        showToast('Alert marked as resolved');
        await loadAlerts();
    } catch (error) {
        console.error('Error resolving alert:', error);
        showToast('Error resolving alert');
    }
}

// ============================================
// MY PROFILE TAB
// ============================================
async function loadProfile() {
    // Populate form with current user data
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-credentials').value = currentUser.credentials || '';
    document.getElementById('profile-bio').value = currentUser.bio || '';
    document.getElementById('profile-status').value = currentUser.practitioner_status || 'available';

    // Set specializations checkboxes
    const specializations = currentUser.specializations || [];
    document.querySelectorAll('.specialization-checkbox').forEach(checkbox => {
        checkbox.checked = specializations.includes(checkbox.value);
    });

    // Set referral link
    const referralCode = currentUser.referral_code || '';
    const referralLink = referralCode ?
        `https://guthealingacademy.com/quiz?ref=${referralCode}` :
        'No referral code set';
    document.getElementById('referral-link').value = referralLink;
}

async function saveProfile(event) {
    event.preventDefault();

    const name = document.getElementById('profile-name').value;
    const credentials = document.getElementById('profile-credentials').value;
    const bio = document.getElementById('profile-bio').value;
    const status = document.getElementById('profile-status').value;

    const specializations = Array.from(document.querySelectorAll('.specialization-checkbox:checked'))
        .map(cb => cb.value);

    try {
        const { error } = await supabase
            .from('users')
            .update({
                name,
                credentials,
                bio,
                specializations,
                practitioner_status: status
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Update currentUser
        currentUser = {
            ...currentUser,
            name,
            credentials,
            bio,
            specializations,
            practitioner_status: status
        };

        showToast('Profile updated successfully');
        document.getElementById('practitioner-name').textContent = name;
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Error saving profile');
    }
}

function copyReferralLink() {
    const input = document.getElementById('referral-link');
    input.select();
    document.execCommand('copy');
    showToast('Referral link copied to clipboard!');
}

// ============================================
// PATIENT DETAIL VIEW
// ============================================
async function viewPatient(patientId) {
    selectedPatient = null;

    // Load patient data
    const { data: patient, error: patientError } = await supabase
        .from('users')
        .select('*')
        .eq('id', patientId)
        .single();

    if (patientError || !patient) {
        showToast('Error loading patient details');
        return;
    }

    // Load assignment data
    const { data: assignment } = await supabase
        .from('patient_assignments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('practitioner_id', currentUser.id)
        .single();

    selectedPatient = { ...patient, assignment };

    // Update modal header
    document.getElementById('patient-detail-name').textContent = patient.name || 'Unknown';
    document.getElementById('patient-detail-protocol').textContent = patient.protocol_name || 'N/A';

    const daysInProgram = assignment ?
        Math.floor((new Date() - new Date(assignment.assigned_at)) / (1000 * 60 * 60 * 24)) : 0;
    document.getElementById('patient-detail-days').textContent = `Day ${daysInProgram}`;

    const statusBadge = document.getElementById('patient-detail-status');
    statusBadge.textContent = assignment?.status || 'N/A';
    statusBadge.className = `patient-status-badge ${assignment?.status || ''}`;

    // Show modal
    document.getElementById('patient-detail-modal').classList.remove('hidden');

    // Load overview tab by default
    loadPatientOverview();
}

function closePatientDetail() {
    selectedPatient = null;
    document.getElementById('patient-detail-modal').classList.add('hidden');
}

async function loadPatientOverview() {
    if (!selectedPatient) return;

    const container = document.getElementById('patient-overview-content');

    // Load tracking compliance
    const { data: trackingLogs } = await supabase
        .from('tracking_logs')
        .select('date')
        .eq('user_id', selectedPatient.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const trackingCount = trackingLogs?.length || 0;

    // Get unread message count
    const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', selectedPatient.id)
        .eq('sender_type', 'member')
        .is('read_at', null);

    // Get latest tracking entry
    const { data: latestTracking } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('user_id', selectedPatient.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

    container.innerHTML = `
        <div class="overview-section">
            <h4>Quick Stats</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Last Login</div>
                    <div class="stat-value" style="font-size: 16px;">${formatDate(selectedPatient.last_login_at)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Tracking Compliance (7 days)</div>
                    <div class="stat-value">${trackingCount}/7</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Unread Messages</div>
                    <div class="stat-value">${unreadCount || 0}</div>
                </div>
            </div>
        </div>

        <div class="overview-section">
            <h4>Latest Symptoms</h4>
            ${latestTracking ? `
                <div class="info-list">
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${new Date(latestTracking.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div class="info-item" style="display: block;">
                        <div class="info-label" style="margin-bottom: 12px;">Tracking Data</div>
                        <div class="info-value">${formatTrackingData(latestTracking.tracking_data)}</div>
                    </div>
                    ${latestTracking.notes ? `
                        <div class="info-item">
                            <div class="info-label">Notes</div>
                            <div class="info-value">${escapeHtml(latestTracking.notes)}</div>
                        </div>
                    ` : ''}
                </div>
            ` : '<p class="empty-state">No tracking entries yet.</p>'}
        </div>

        <div class="overview-section">
            <div class="quiz-answers-expandable" style="margin-top: 0; padding-top: 0; border-top: none;">
                <button class="btn-expand-quiz" id="expand-full-quiz-btn">
                    <span id="expand-quiz-icon">▼</span>
                    View Full Quiz Answers
                </button>
                <div id="full-quiz-answers" class="full-quiz-answers hidden">
                    <div class="quiz-answers-list">
                        ${selectedPatient.primary_complaint ? `<div class="quiz-answer-item"><strong>Primary Complaint:</strong> ${escapeHtml(selectedPatient.primary_complaint)}</div>` : ''}
                        ${selectedPatient.symptom_frequency ? `<div class="quiz-answer-item"><strong>Symptom Frequency:</strong> ${escapeHtml(selectedPatient.symptom_frequency)}</div>` : ''}
                        ${selectedPatient.duration ? `<div class="quiz-answer-item"><strong>Duration:</strong> ${escapeHtml(selectedPatient.duration)}</div>` : ''}
                        ${selectedPatient.diagnoses && selectedPatient.diagnoses.length ? `<div class="quiz-answer-item"><strong>Previous Diagnoses:</strong> ${selectedPatient.diagnoses.map(d => escapeHtml(d)).join(', ')}</div>` : ''}
                        ${selectedPatient.treatments_tried && selectedPatient.treatments_tried.length ? `<div class="quiz-answer-item"><strong>Treatments Tried:</strong> ${selectedPatient.treatments_tried.map(t => escapeHtml(t)).join(', ')}</div>` : ''}
                        ${selectedPatient.stress_connection ? `<div class="quiz-answer-item"><strong>Stress Connection:</strong> ${escapeHtml(selectedPatient.stress_connection)}</div>` : ''}
                        ${selectedPatient.has_stress_component !== null && selectedPatient.has_stress_component !== undefined ? `<div class="quiz-answer-item"><strong>Has Stress Component:</strong> ${selectedPatient.has_stress_component ? 'Yes' : 'No'}</div>` : ''}
                        ${selectedPatient.dietary_restrictions ? `<div class="quiz-answer-item"><strong>Dietary Restrictions:</strong> ${escapeHtml(selectedPatient.dietary_restrictions)}</div>` : ''}
                        ${selectedPatient.current_medications ? `<div class="quiz-answer-item"><strong>Current Medications:</strong> ${escapeHtml(selectedPatient.current_medications)}</div>` : ''}
                        ${selectedPatient.worst_symptoms ? `<div class="quiz-answer-item"><strong>Worst Symptoms:</strong> ${escapeHtml(selectedPatient.worst_symptoms)}</div>` : ''}
                        ${!selectedPatient.primary_complaint && !selectedPatient.symptom_frequency && !selectedPatient.duration ? '<p class="text-muted">No quiz data available.</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add event listener for expand button
    const expandBtn = document.getElementById('expand-full-quiz-btn');
    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            const fullQuiz = document.getElementById('full-quiz-answers');
            const icon = document.getElementById('expand-quiz-icon');
            const isHidden = fullQuiz.classList.contains('hidden');

            fullQuiz.classList.toggle('hidden');
            icon.textContent = isHidden ? '▲' : '▼';
            expandBtn.innerHTML = `<span id="expand-quiz-icon">${isHidden ? '▲' : '▼'}</span> ${isHidden ? 'Hide' : 'View'} Full Quiz Answers`;
        });
    }
}

function formatTrackingData(data) {
    if (!data) return '<span class="text-muted">No data</span>';

    const entries = Object.entries(data).map(([key, value]) => {
        // Format the key to be more readable
        const formattedKey = key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return `<div class="tracking-data-item">
            <span class="tracking-data-label">${formattedKey}:</span>
            <span class="tracking-data-value">${value}</span>
        </div>`;
    });

    return `<div class="tracking-data-grid">${entries.join('')}</div>`;
}

async function loadPatientTracking() {
    if (!selectedPatient) return;

    const container = document.getElementById('patient-tracking-content');

    const { data: trackingLogs, error } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('user_id', selectedPatient.id)
        .order('date', { ascending: false })
        .limit(30);

    if (error || !trackingLogs || trackingLogs.length === 0) {
        container.innerHTML = '<p class="empty-state">No tracking history yet.</p>';
        return;
    }

    container.innerHTML = `
        <div class="tracking-chart">
            <h4>Tracking History (Last 30 Days)</h4>
            <table class="tracking-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Tracking Data</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${trackingLogs.map(log => `
                        <tr>
                            <td style="white-space: nowrap;">${new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td>${formatTrackingData(log.tracking_data)}</td>
                            <td style="max-width: 200px;">${log.notes ? escapeHtml(log.notes) : '<span class="text-muted">-</span>'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadPatientMessages() {
    if (!selectedPatient) return;

    const container = document.getElementById('patient-messages-list');

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', selectedPatient.id)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = '<p class="empty-state">Error loading messages.</p>';
        return;
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<p class="empty-state">No messages yet. Start the conversation below!</p>';
        return;
    }

    // Mark messages as read
    await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', selectedPatient.id)
        .is('read_at', null);

    container.innerHTML = messages.reverse().map(msg => {
        // Parse attachments if they exist
        let attachmentsHtml = '';
        if (msg.attachments && msg.attachments.length > 0) {
            attachmentsHtml = `
                <div class="message-attachments">
                    ${msg.attachments.map(att => `
                        <a href="${att.url}" target="_blank" class="message-attachment">
                            <span class="attachment-icon">${getFileIcon(att.name)}</span>
                            <span>${escapeHtml(att.name)}</span>
                        </a>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="message-item ${msg.sender_type === 'practitioner' ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="message-sender">${msg.sender_type === 'practitioner' ? 'You' : selectedPatient.name}</span>
                    <span class="message-time">${formatTime(msg.created_at)}</span>
                </div>
                <div class="message-body">${msg.message_text}</div>
                ${attachmentsHtml}
            </div>
        `;
    }).join('');

    // Update badge
    const badge = document.getElementById('patient-messages-badge');
    badge.classList.add('hidden');
}

async function sendPatientMessage() {
    if (!selectedPatient) return;

    const input = document.getElementById('patient-message-input');
    const message = input.value.trim();

    if (!message) return;

    try {
        const { error } = await supabase
            .from('messages')
            .insert({
                user_id: selectedPatient.id,
                sender_type: 'practitioner',
                sender_email: currentUser.email,
                message_text: message,
                practitioner_id: currentUser.id
            });

        if (error) throw error;

        input.value = '';
        showToast('Message sent');
        await loadPatientMessages();
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error sending message');
    }
}

async function loadPatientProtocol() {
    if (!selectedPatient) return;

    const container = document.getElementById('patient-protocol-content');

    container.innerHTML = `
        <div class="overview-section">
            <h4>Current Protocol</h4>
            <div class="info-list">
                <div class="info-item">
                    <div class="info-label">Protocol Name</div>
                    <div class="info-value">${selectedPatient.protocol_name || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Protocol Number</div>
                    <div class="info-value">${selectedPatient.protocol || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Stress Component</div>
                    <div class="info-value">${selectedPatient.has_stress_component ? 'Yes' : 'No'}</div>
                </div>
            </div>
            <p style="margin-top: 20px; color: var(--text-light); font-size: 14px;">
                Protocol modification features coming soon. Contact admin to adjust patient protocols.
            </p>
        </div>
    `;
}

async function loadPatientNotes() {
    if (!selectedPatient) return;

    const textarea = document.getElementById('patient-notes-textarea');
    textarea.value = selectedPatient.assignment?.practitioner_notes || '';
}

async function savePatientNotes() {
    if (!selectedPatient || !selectedPatient.assignment) return;

    const notes = document.getElementById('patient-notes-textarea').value;

    try {
        const { error } = await supabase
            .from('patient_assignments')
            .update({ practitioner_notes: notes })
            .eq('patient_id', selectedPatient.id)
            .eq('practitioner_id', currentUser.id);

        if (error) throw error;

        selectedPatient.assignment.practitioner_notes = notes;
        showToast('Notes saved successfully');
    } catch (error) {
        console.error('Error saving notes:', error);
        showToast('Error saving notes');
    }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================
function setupRealTimeSubscriptions() {
    // Subscribe to new messages
    const messagesSub = supabase
        .channel('practitioner-messages')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_type=eq.member`
            },
            async (payload) => {
                // Check if this message is for one of my patients
                const isMyPatient = currentPatients.some(p => p.patient_id === payload.new.user_id);
                if (isMyPatient) {
                    showToast('New message from patient');
                    await loadMyPatients();

                    // If viewing this patient's messages, reload them
                    if (selectedPatient && selectedPatient.id === payload.new.user_id) {
                        await loadPatientMessages();
                    }
                }
            }
        )
        .subscribe();

    realTimeSubscriptions.push(messagesSub);

    // Subscribe to new unassigned patients
    const unassignedSub = supabase
        .channel('unassigned-patients')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'users'
            },
            async () => {
                await loadUnassignedPatients();
            }
        )
        .subscribe();

    realTimeSubscriptions.push(unassignedSub);

    // Subscribe to alerts
    const alertsSub = supabase
        .channel('practitioner-alerts')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'practitioner_alerts',
                filter: `practitioner_id=eq.${currentUser.id}`
            },
            async (payload) => {
                showToast('New alert');
                await loadAlerts();
            }
        )
        .subscribe();

    realTimeSubscriptions.push(alertsSub);
}

// ============================================
// TAB NAVIGATION
// ============================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.add('hidden');
        panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`tab-${tabName}`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('active');
    }

    // Load data for the tab if needed
    if (tabName === 'alerts') {
        loadAlerts();
    }
}

function switchPatientTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.patient-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.patientTab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab panels
    document.querySelectorAll('.patient-tab-panel').forEach(panel => {
        panel.classList.add('hidden');
        panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`patient-tab-${tabName}`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('active');
    }

    // Load data for the tab
    if (tabName === 'overview') {
        loadPatientOverview();
    } else if (tabName === 'tracking') {
        loadPatientTracking();
    } else if (tabName === 'messages') {
        loadPatientMessages();
    } else if (tabName === 'protocol') {
        loadPatientProtocol();
    } else if (tabName === 'notes') {
        loadPatientNotes();
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Auth buttons
    document.getElementById('google-login-btn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('dashboard-logout')?.addEventListener('click', signOut);
    document.getElementById('access-denied-logout')?.addEventListener('click', signOut);

    // Event delegation for dynamically generated buttons
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const patientId = target.dataset.patientId;
        const alertId = target.dataset.alertId;
        const patientName = target.dataset.patientName;

        switch (action) {
            case 'view-patient':
                if (patientId) viewPatient(patientId);
                break;
            case 'toggle-quiz':
                if (patientId) toggleQuizAnswers(patientId, target);
                break;
            case 'claim-patient':
                if (patientId && patientName) showClaimModal(patientId, patientName);
                break;
            case 'resolve-alert':
                if (alertId) resolveAlert(alertId);
                break;
        }
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Patient detail tab navigation
    document.querySelectorAll('.patient-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPatientTab(btn.dataset.patientTab));
    });

    // Filters
    document.getElementById('filter-protocol')?.addEventListener('change', renderPatientsList);
    document.getElementById('filter-attention')?.addEventListener('change', renderPatientsList);
    document.getElementById('sort-by')?.addEventListener('change', renderPatientsList);
    document.getElementById('filter-alerts')?.addEventListener('change', loadAlerts);

    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', saveProfile);
    document.getElementById('copy-referral-btn')?.addEventListener('click', copyReferralLink);

    // Claim modal
    document.getElementById('cancel-claim-btn')?.addEventListener('click', hideClaimModal);
    document.getElementById('confirm-claim-btn')?.addEventListener('click', claimPatient);
    document.querySelectorAll('#claim-modal .modal-close').forEach(btn => {
        btn.addEventListener('click', hideClaimModal);
    });
    document.querySelector('#claim-modal .modal-overlay')?.addEventListener('click', hideClaimModal);

    // Patient detail modal
    document.getElementById('close-patient-detail')?.addEventListener('click', closePatientDetail);
    document.querySelectorAll('#patient-detail-modal .modal-close').forEach(btn => {
        btn.addEventListener('click', closePatientDetail);
    });
    document.querySelector('#patient-detail-modal .modal-overlay')?.addEventListener('click', closePatientDetail);

    // Patient messages
    document.getElementById('send-patient-message-btn')?.addEventListener('click', sendPatientMessage);
    document.getElementById('patient-message-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPatientMessage();
        }
    });

    // Save patient notes
    document.getElementById('save-notes-btn')?.addEventListener('click', savePatientNotes);

    // Initialize auth
    initAuth();
});
