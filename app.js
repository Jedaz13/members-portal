// Gut Healing Academy - Member Portal
// Complete Dashboard Application

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://mwabljnngygkmahjgvps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjQ3MzgsImV4cCI6MjA4MTEwMDczOH0.rbZYj1aXui_xZ0qkg7QONdHppnJghT2r0ycZwtr3a-E';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// PROTOCOL CONFIGURATIONS
// ============================================
const PROTOCOLS = {
    1: {
        name: 'Bloating-Dominant Protocol',
        shortName: 'Bloating Protocol',
        whyTrack: 'Tracking your belly scores helps identify trigger foods and times. Many people notice patterns with specific meals or times of day. This data helps us refine your protocol.',
        fields: [
            { id: 'morning_belly_score', label: 'Morning belly score', type: 'slider', min: 1, max: 10, description: '1 = flat & comfortable, 10 = extremely bloated' },
            { id: 'evening_bloating_score', label: 'Evening bloating score', type: 'slider', min: 1, max: 10, description: '1 = flat & comfortable, 10 = extremely bloated' },
            { id: 'meal_pace_maintained', label: 'Meal pace maintained?', type: 'radio', options: ['Yes', 'Mostly', 'No'], description: 'Did you eat slowly and chew thoroughly?' }
        ]
    },
    2: {
        name: 'Constipation-Dominant Protocol (IBS-C)',
        shortName: 'IBS-C Protocol',
        whyTrack: 'Tracking bowel movements and hydration reveals what\'s working. Constipation often improves with consistent morning routines. Your data shows if interventions are effective.',
        fields: [
            { id: 'had_bowel_movement', label: 'Had bowel movement today?', type: 'radio', options: ['Yes', 'No'] },
            { id: 'stool_appearance', label: 'Stool appearance', type: 'select', options: ['Hard pellets', 'Formed & smooth', 'Soft', 'Watery'], description: 'Select the closest match' },
            { id: 'morning_water_done', label: 'Morning water routine done?', type: 'radio', options: ['Yes', 'No'], description: 'Did you drink warm water upon waking?' }
        ]
    },
    3: {
        name: 'Diarrhea-Dominant Protocol (IBS-D)',
        shortName: 'IBS-D Protocol',
        whyTrack: 'Tracking frequency and urgency helps identify triggers and progress. Many IBS-D sufferers see patterns with stress or specific foods. Your data guides protocol adjustments.',
        fields: [
            { id: 'bathroom_visits', label: 'Bathroom visits today', type: 'number', min: 0, max: 20, description: 'Number of bowel movements' },
            { id: 'stool_consistency', label: 'Stool consistency (worst today)', type: 'select', options: ['Hard', 'Formed', 'Soft', 'Watery'] },
            { id: 'urgency_episodes', label: 'Urgency episodes', type: 'number', min: 0, max: 20, description: 'Times you felt urgent need' }
        ]
    },
    4: {
        name: 'Mixed Pattern Protocol (IBS-M)',
        shortName: 'IBS-M Protocol',
        whyTrack: 'Mixed IBS alternates unpredictably. Tracking your daily pattern reveals cycles and triggers. This helps predict and prevent symptom swings.',
        fields: [
            { id: 'todays_pattern', label: 'Today\'s pattern', type: 'radio', options: ['C (Constipation)', 'D (Diarrhea)', 'N (Normal)'], description: 'What was dominant today?' },
            { id: 'stool_consistency', label: 'Stool consistency', type: 'select', options: ['Hard', 'Formed', 'Soft', 'Watery'] },
            { id: 'meals_on_schedule', label: 'Meals on schedule?', type: 'radio', options: ['Yes', 'Mostly', 'No'], description: 'Did you eat at regular times?' }
        ]
    },
    5: {
        name: 'Post-SIBO Recovery Protocol',
        shortName: 'Post-SIBO Protocol',
        whyTrack: 'SIBO can recur if meal spacing isn\'t maintained. Tracking helps catch early warning signs and ensures you\'re protecting your migrating motor complex.',
        fields: [
            { id: 'symptom_return', label: 'Symptom return?', type: 'radio', options: ['None', 'Mild', 'Moderate', 'Significant'], description: 'Any old symptoms coming back?' },
            { id: 'meal_spacing_maintained', label: 'Meal spacing maintained?', type: 'radio', options: ['Yes', 'No'], description: '4-5 hours between meals' },
            { id: 'overnight_fast_hours', label: 'Overnight fast hours', type: 'number', min: 8, max: 16, description: 'Hours between dinner and breakfast' }
        ]
    },
    6: {
        name: 'Gut-Brain Dominant Protocol',
        shortName: 'Gut-Brain Protocol',
        whyTrack: 'The gut-brain connection is powerful. Tracking both stress and symptoms reveals their relationship. Many find their gut follows their nervous system within 24-48 hours.',
        fields: [
            { id: 'highest_stress_level', label: 'Highest stress level today', type: 'slider', min: 1, max: 10, description: '1 = completely calm, 10 = extremely stressed' },
            { id: 'worst_gut_symptom', label: 'Worst gut symptom today', type: 'slider', min: 1, max: 10, description: '1 = no symptoms, 10 = severe' },
            { id: 'vagus_practice_done', label: 'Vagus nerve practice done?', type: 'radio', options: ['Yes 2x', 'Yes 1x', 'No'], description: 'Cold water, humming, or breathing' }
        ]
    }
};

// Protocol content placeholders (Week 1)
const PROTOCOL_CONTENT = {
    1: `
        <div class="protocol-week">
            <h4>Week 1: Bloating-Dominant Protocol</h4>
            <p class="protocol-focus">Focus: Slow down, de-gas, support digestion</p>

            <div class="protocol-day">
                <h5>Day 1-2: Foundation</h5>
                <ul>
                    <li>Start each meal with 3 deep breaths</li>
                    <li>Chew each bite 20-30 times</li>
                    <li>Put fork down between bites</li>
                    <li>No drinking during meals (only small sips)</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Digestive Support</h5>
                <ul>
                    <li>Apple cider vinegar: 1 tbsp in water before meals</li>
                    <li>Ginger tea between meals</li>
                    <li>10-minute walk after lunch and dinner</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Optimize</h5>
                <ul>
                    <li>Identify your 3 worst bloating triggers</li>
                    <li>Try fennel or peppermint tea after meals</li>
                    <li>Evening: gentle belly massage (clockwise)</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The 20-minute meal:</strong> Set a timer. Your meal should take at least 20 minutes.</p>
                <p><strong>The bloat journal:</strong> Note which foods cause bloating within 2 hours.</p>
            </div>
        </div>
    `,
    2: `
        <div class="protocol-week">
            <h4>Week 1: Constipation Protocol (IBS-C)</h4>
            <p class="protocol-focus">Focus: Hydration, movement, morning routine</p>

            <div class="protocol-day">
                <h5>Day 1-2: Morning Routine</h5>
                <ul>
                    <li>Wake up: Drink 16oz warm water with lemon</li>
                    <li>Wait 20-30 minutes before eating</li>
                    <li>Sit on toilet same time each morning (even if nothing happens)</li>
                    <li>Feet elevated on stool (squatty potty position)</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Movement & Fiber</h5>
                <ul>
                    <li>Morning: 5-minute walk or gentle stretching</li>
                    <li>Add 1 tbsp ground flaxseed to breakfast</li>
                    <li>Drink 8 glasses of water throughout day</li>
                    <li>Evening: gentle abdominal massage</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Build Consistency</h5>
                <ul>
                    <li>Keep morning routine non-negotiable</li>
                    <li>Add prunes or kiwi to daily diet</li>
                    <li>Magnesium citrate before bed (start with 200mg)</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The morning ritual:</strong> Warm water → Wait → Toilet time. Same time daily.</p>
                <p><strong>Position matters:</strong> Knees above hips, lean forward slightly, relax.</p>
            </div>
        </div>
    `,
    3: `
        <div class="protocol-week">
            <h4>Week 1: Diarrhea Protocol (IBS-D)</h4>
            <p class="protocol-focus">Focus: Calm the gut, bind loose stools, reduce triggers</p>

            <div class="protocol-day">
                <h5>Day 1-2: Emergency Calm</h5>
                <ul>
                    <li>Remove common triggers: caffeine, dairy, fried foods</li>
                    <li>Eat smaller, more frequent meals</li>
                    <li>Start each meal with 5 slow breaths</li>
                    <li>Avoid ice-cold drinks</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Binding Foods</h5>
                <ul>
                    <li>BRAT-style foods: banana, rice, applesauce, toast</li>
                    <li>Cooked vegetables only (no raw for now)</li>
                    <li>Add soluble fiber: oatmeal, peeled potatoes</li>
                    <li>Bone broth between meals</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Nervous System Support</h5>
                <ul>
                    <li>10-minute rest after meals (no rushing)</li>
                    <li>Chamomile or ginger tea</li>
                    <li>Identify stress-symptom connection</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The calm before eating:</strong> 5 breaths activates "rest and digest" mode.</p>
                <p><strong>Temperature matters:</strong> Room temperature or warm foods are gentler.</p>
            </div>
        </div>
    `,
    4: `
        <div class="protocol-week">
            <h4>Week 1: Mixed IBS Protocol (IBS-M)</h4>
            <p class="protocol-focus">Focus: Stabilize with routine, balance fiber, track patterns</p>

            <div class="protocol-day">
                <h5>Day 1-2: Establish Rhythm</h5>
                <ul>
                    <li>Eat at the same times daily (±30 minutes)</li>
                    <li>3 meals, minimize snacking</li>
                    <li>Morning warm water ritual</li>
                    <li>Start tracking: C day, D day, or Normal day</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Balance Approach</h5>
                <ul>
                    <li>On C days: Extra water, gentle movement, warm foods</li>
                    <li>On D days: Binding foods, rest, no caffeine</li>
                    <li>Avoid extreme fiber changes</li>
                    <li>Keep food simple and consistent</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Identify Your Triggers</h5>
                <ul>
                    <li>What happened 24-48 hours before a swing?</li>
                    <li>Note stress, sleep, food changes</li>
                    <li>Look for your personal pattern</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Consistency is king:</strong> Mixed IBS hates surprises. Same times, same foods.</p>
                <p><strong>Don't overcorrect:</strong> A C day doesn't mean load up on fiber (may trigger D).</p>
            </div>
        </div>
    `,
    5: `
        <div class="protocol-week">
            <h4>Week 1: Post-SIBO Recovery Protocol</h4>
            <p class="protocol-focus">Focus: Protect the MMC, prevent relapse, rebuild</p>

            <div class="protocol-day">
                <h5>Day 1-2: Meal Spacing Foundation</h5>
                <ul>
                    <li>4-5 hours between meals (critical!)</li>
                    <li>No snacking - let your MMC work</li>
                    <li>12-14 hour overnight fast</li>
                    <li>Only water, black coffee, or plain tea between meals</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Gentle Prokinetics</h5>
                <ul>
                    <li>Ginger tea or capsule before meals</li>
                    <li>10-minute walk after each meal</li>
                    <li>Stay upright for 2 hours after dinner</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Monitor & Maintain</h5>
                <ul>
                    <li>Track any symptom return immediately</li>
                    <li>Slowly expand food variety (one new food/day)</li>
                    <li>Continue meal spacing long-term</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The MMC rule:</strong> Your migrating motor complex (gut's cleaning wave) only works when fasting. Snacking stops it.</p>
                <p><strong>Early warning signs:</strong> Bloating after meals, old symptoms returning = act fast.</p>
            </div>
        </div>
    `,
    6: `
        <div class="protocol-week">
            <h4>Week 1: Gut-Brain Protocol</h4>
            <p class="protocol-focus">Focus: Calm the nervous system, heal the gut-brain axis</p>

            <div class="protocol-day">
                <h5>Day 1-2: Vagus Nerve Basics</h5>
                <ul>
                    <li>Morning: Splash cold water on face (30 seconds)</li>
                    <li>3 times daily: 5 slow, deep belly breaths</li>
                    <li>Before meals: 3 breaths to shift to "rest & digest"</li>
                    <li>Evening: Humming or gargling for 30 seconds</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Stress-Gut Connection</h5>
                <ul>
                    <li>Track: Stress level vs. gut symptoms (notice the lag)</li>
                    <li>Add: 5-minute morning meditation or quiet time</li>
                    <li>Identify your top 3 stress triggers</li>
                </ul>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Build Your Toolkit</h5>
                <ul>
                    <li>Choose 2 vagus practices that feel good to you</li>
                    <li>Practice them consistently (morning & evening)</li>
                    <li>Notice: How long after stress do gut symptoms appear?</li>
                </ul>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The 24-48 hour rule:</strong> Stress today often shows up in your gut tomorrow. Track the connection.</p>
                <p><strong>Vagus activation:</strong> Cold water, humming, gargling, slow breathing - all stimulate the vagus nerve and calm your gut.</p>
            </div>
        </div>
    `
};

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let currentMember = null;

// ============================================
// VIEW MANAGEMENT
// ============================================
function hideAllViews() {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
}

function showView(viewId) {
    hideAllViews();
    document.getElementById(viewId).classList.remove('hidden');
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ============================================
// AUTHENTICATION
// ============================================
async function signInWithGoogle() {
    try {
        showView('loading-view');

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Sign in error:', error.message);
            showView('login-view');
            showToast('Sign in failed. Please try again.');
        }
    } catch (err) {
        console.error('Sign in error:', err);
        showView('login-view');
        showToast('Sign in failed. Please try again.');
    }
}

async function signOut() {
    try {
        showView('loading-view');
        await supabase.auth.signOut();
        currentUser = null;
        currentMember = null;
        showView('login-view');
    } catch (err) {
        console.error('Sign out error:', err);
        showView('login-view');
    }
}

// ============================================
// USER STATUS ROUTING - THE CORE BUSINESS LOGIC
// ============================================
async function checkUserStatusAndRoute(user) {
    showView('loading-view');
    currentUser = user;

    try {
        // Step 1: Check if email exists in users table
        const { data: member, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (error || !member) {
            // Email NOT found - show "take quiz first" page
            console.log('User not found in database - needs to take quiz');
            showView('not-found-view');
            return;
        }

        currentMember = member;

        // Step 2: Handle status-based routing
        let updatedStatus = member.status;

        // If status is "lead", upgrade to "trial"
        if (member.status === 'lead') {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    status: 'trial',
                    trial_start_date: new Date().toISOString(),
                    last_login_at: new Date().toISOString()
                })
                .eq('id', member.id);

            if (!updateError) {
                updatedStatus = 'trial';
                currentMember.status = 'trial';
                currentMember.trial_start_date = new Date().toISOString();
                console.log('User upgraded from lead to trial');
            }
        }

        // If status is "trial", check if expired
        if (updatedStatus === 'trial' && member.trial_start_date) {
            const trialStart = new Date(member.trial_start_date);
            const now = new Date();
            const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));

            if (daysPassed >= 7) {
                // Trial has expired
                const { error: expireError } = await supabase
                    .from('users')
                    .update({
                        status: 'trial_expired',
                        last_login_at: new Date().toISOString()
                    })
                    .eq('id', member.id);

                if (!expireError) {
                    updatedStatus = 'trial_expired';
                    currentMember.status = 'trial_expired';
                    console.log('Trial expired');
                }
            }
        }

        // Update last login for all other cases
        if (updatedStatus !== 'lead') {
            await supabase
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', member.id);
        }

        // Step 3: Route based on final status
        switch (updatedStatus) {
            case 'trial_expired':
                showView('trial-expired-view');
                break;
            case 'trial':
            case 'active':
                initializeDashboard();
                break;
            default:
                // Any other status (cancelled, etc.) - show trial expired for now
                showView('trial-expired-view');
        }

    } catch (err) {
        console.error('Error checking user status:', err);
        showToast('Error loading your account. Please try again.');
        showView('login-view');
    }
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
function initializeDashboard() {
    showView('dashboard-view');

    // Set welcome message
    const name = currentMember.name || currentUser.user_metadata?.full_name || 'Member';
    document.getElementById('dashboard-welcome').textContent = `Welcome, ${name}!`;

    // Set protocol name
    const protocol = currentMember.protocol || 1;
    const protocolInfo = PROTOCOLS[protocol];
    document.getElementById('dashboard-protocol').textContent = `Your Protocol: ${protocolInfo.name}`;

    // Show trial banner if on trial
    if (currentMember.status === 'trial' && currentMember.trial_start_date) {
        const trialStart = new Date(currentMember.trial_start_date);
        const now = new Date();
        const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 7 - daysPassed);

        document.getElementById('trial-days').textContent = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
        document.getElementById('trial-banner').classList.remove('hidden');
    }

    // Initialize tabs
    initializeTabs();

    // Load tracking form
    loadTrackingForm(protocol);

    // Load protocol content
    loadProtocolContent(protocol);

    // Load messages
    loadMessages();

    // Load tracking history
    loadTrackingHistory();
}

// ============================================
// TAB NAVIGATION
// ============================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.add('hidden'));

            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
        });
    });
}

// ============================================
// TAB 1: TRACKING FORMS
// ============================================
function loadTrackingForm(protocol) {
    const protocolInfo = PROTOCOLS[protocol];
    const form = document.getElementById('tracking-form');

    // Set why track text
    document.getElementById('why-track-text').textContent = protocolInfo.whyTrack;

    // Build form HTML
    let formHTML = '';

    protocolInfo.fields.forEach(field => {
        formHTML += `<div class="form-group">`;
        formHTML += `<label for="${field.id}">${field.label}</label>`;

        if (field.description) {
            formHTML += `<p class="field-description">${field.description}</p>`;
        }

        switch (field.type) {
            case 'slider':
                formHTML += `
                    <div class="slider-container">
                        <input type="range" id="${field.id}" name="${field.id}"
                               min="${field.min}" max="${field.max}" value="${Math.floor((field.min + field.max) / 2)}"
                               class="slider">
                        <div class="slider-labels">
                            <span>${field.min}</span>
                            <span class="slider-value" id="${field.id}-value">${Math.floor((field.min + field.max) / 2)}</span>
                            <span>${field.max}</span>
                        </div>
                    </div>
                `;
                break;

            case 'radio':
                formHTML += `<div class="radio-group">`;
                field.options.forEach((opt, idx) => {
                    formHTML += `
                        <label class="radio-label">
                            <input type="radio" name="${field.id}" value="${opt}" ${idx === 0 ? 'checked' : ''}>
                            <span class="radio-text">${opt}</span>
                        </label>
                    `;
                });
                formHTML += `</div>`;
                break;

            case 'select':
                formHTML += `<select id="${field.id}" name="${field.id}" class="form-select">`;
                field.options.forEach(opt => {
                    formHTML += `<option value="${opt}">${opt}</option>`;
                });
                formHTML += `</select>`;
                break;

            case 'number':
                formHTML += `
                    <input type="number" id="${field.id}" name="${field.id}"
                           min="${field.min}" max="${field.max}" value="${field.min}"
                           class="form-input form-input-number">
                `;
                break;
        }

        formHTML += `</div>`;
    });

    // Add notes field (common to all protocols)
    formHTML += `
        <div class="form-group">
            <label for="notes">Notes (optional)</label>
            <textarea id="notes" name="notes" rows="3"
                      placeholder="Any additional observations, triggers, or notes..."
                      class="form-textarea"></textarea>
        </div>
        <button type="submit" class="btn-primary btn-submit">Save Today's Tracking</button>
    `;

    form.innerHTML = formHTML;

    // Add slider value update listeners
    protocolInfo.fields.filter(f => f.type === 'slider').forEach(field => {
        const slider = document.getElementById(field.id);
        const valueDisplay = document.getElementById(`${field.id}-value`);
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value;
        });
    });

    // Add form submit handler
    form.addEventListener('submit', handleTrackingSubmit);

    // Check if already submitted today
    checkTodaysEntry();
}

async function checkTodaysEntry() {
    if (!currentMember) return;

    const today = new Date().toISOString().split('T')[0];

    const { data: entry, error } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('user_id', currentMember.id)
        .eq('date', today)
        .single();

    if (entry && !error) {
        // Fill form with existing data
        populateFormWithEntry(entry);

        // Change button text
        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = 'Update Today\'s Tracking';
    }
}

function populateFormWithEntry(entry) {
    const data = entry.tracking_data || {};

    // Fill in each field
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'range') {
                element.value = data[key];
                const valueDisplay = document.getElementById(`${key}-value`);
                if (valueDisplay) valueDisplay.textContent = data[key];
            } else if (element.tagName === 'SELECT' || element.type === 'number') {
                element.value = data[key];
            }
        } else {
            // Check for radio buttons
            const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
            if (radio) radio.checked = true;
        }
    });

    // Fill notes
    if (entry.notes) {
        document.getElementById('notes').value = entry.notes;
    }
}

async function handleTrackingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const protocol = currentMember.protocol || 1;
    const today = new Date().toISOString().split('T')[0];

    // Build tracking data object
    const trackingData = {};
    PROTOCOLS[protocol].fields.forEach(field => {
        const value = formData.get(field.id);
        if (value !== null && value !== '') {
            trackingData[field.id] = field.type === 'number' || field.type === 'slider'
                ? parseInt(value)
                : value;
        }
    });

    const notes = formData.get('notes') || '';

    // Upsert to database
    const { error } = await supabase
        .from('tracking_logs')
        .upsert({
            user_id: currentMember.id,
            date: today,
            protocol_type: protocol,
            tracking_data: trackingData,
            notes: notes
        }, {
            onConflict: 'user_id,date'
        });

    if (error) {
        console.error('Error saving tracking:', error);
        showToast('Error saving. Please try again.');
    } else {
        showToast('Tracking saved successfully!');
        document.querySelector('.btn-submit').textContent = 'Update Today\'s Tracking';
        loadTrackingHistory();
    }
}

async function loadTrackingHistory() {
    if (!currentMember) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: entries, error } = await supabase
        .from('tracking_logs')
        .select('*')
        .eq('user_id', currentMember.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

    const historyList = document.getElementById('history-list');

    if (error || !entries || entries.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No tracking entries yet. Start tracking today!</p>';
        return;
    }

    const protocol = currentMember.protocol || 1;

    let html = '';
    entries.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Create a summary based on protocol
        const summary = createEntrySummary(entry.tracking_data, protocol);

        html += `
            <div class="history-item">
                <div class="history-date">${date}</div>
                <div class="history-summary">${summary}</div>
            </div>
        `;
    });

    historyList.innerHTML = html;
}

function createEntrySummary(data, protocol) {
    if (!data) return 'No data';

    const summaryParts = [];

    switch (protocol) {
        case 1:
            if (data.morning_belly_score) summaryParts.push(`AM: ${data.morning_belly_score}/10`);
            if (data.evening_bloating_score) summaryParts.push(`PM: ${data.evening_bloating_score}/10`);
            if (data.meal_pace_maintained) summaryParts.push(`Pace: ${data.meal_pace_maintained}`);
            break;
        case 2:
            if (data.had_bowel_movement) summaryParts.push(`BM: ${data.had_bowel_movement}`);
            if (data.stool_appearance) summaryParts.push(data.stool_appearance);
            if (data.morning_water_done) summaryParts.push(`Water: ${data.morning_water_done}`);
            break;
        case 3:
            if (data.bathroom_visits !== undefined) summaryParts.push(`Visits: ${data.bathroom_visits}`);
            if (data.urgency_episodes !== undefined) summaryParts.push(`Urgency: ${data.urgency_episodes}`);
            if (data.stool_consistency) summaryParts.push(data.stool_consistency);
            break;
        case 4:
            if (data.todays_pattern) summaryParts.push(`Pattern: ${data.todays_pattern}`);
            if (data.stool_consistency) summaryParts.push(data.stool_consistency);
            if (data.meals_on_schedule) summaryParts.push(`Schedule: ${data.meals_on_schedule}`);
            break;
        case 5:
            if (data.symptom_return) summaryParts.push(`Symptoms: ${data.symptom_return}`);
            if (data.meal_spacing_maintained) summaryParts.push(`Spacing: ${data.meal_spacing_maintained}`);
            if (data.overnight_fast_hours) summaryParts.push(`Fast: ${data.overnight_fast_hours}h`);
            break;
        case 6:
            if (data.highest_stress_level) summaryParts.push(`Stress: ${data.highest_stress_level}/10`);
            if (data.worst_gut_symptom) summaryParts.push(`Gut: ${data.worst_gut_symptom}/10`);
            if (data.vagus_practice_done) summaryParts.push(`Vagus: ${data.vagus_practice_done}`);
            break;
    }

    return summaryParts.join(' | ') || 'Entry saved';
}

// ============================================
// TAB 2: PROTOCOL CONTENT
// ============================================
function loadProtocolContent(protocol) {
    const content = PROTOCOL_CONTENT[protocol] || '<p>Protocol content coming soon...</p>';
    document.getElementById('protocol-content').innerHTML = content;
    document.getElementById('protocol-title').textContent = `Week 1: ${PROTOCOLS[protocol].shortName}`;
}

// ============================================
// TAB 3: MESSAGING
// ============================================
async function loadMessages() {
    if (!currentMember) return;

    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', currentMember.id)
        .order('created_at', { ascending: true });

    const messagesList = document.getElementById('messages-list');

    if (error || !messages || messages.length === 0) {
        messagesList.innerHTML = '<p class="messages-empty">No messages yet. Send your first message above!</p>';
        return;
    }

    let html = '';
    messages.forEach(msg => {
        const time = new Date(msg.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const isExpert = msg.sender_type === 'practitioner';

        html += `
            <div class="message ${isExpert ? 'message-expert' : 'message-member'}">
                <div class="message-header">
                    <span class="message-sender">${isExpert ? 'Gut Health Expert' : 'You'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.message_text)}</div>
            </div>
        `;
    });

    messagesList.innerHTML = html;

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) {
        showToast('Please enter a message');
        return;
    }

    const { error } = await supabase
        .from('messages')
        .insert({
            user_id: currentMember.id,
            sender_type: 'member',
            sender_email: currentMember.email,
            message_text: message
        });

    if (error) {
        console.error('Error sending message:', error);
        showToast('Error sending message. Please try again.');
    } else {
        input.value = '';
        showToast('Message sent!');
        loadMessages();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// SESSION MANAGEMENT
// ============================================
async function checkSession() {
    showView('loading-view');

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error.message);
            showView('login-view');
            return;
        }

        if (session && session.user) {
            await checkUserStatusAndRoute(session.user);
        } else {
            showView('login-view');
        }
    } catch (err) {
        console.error('Session check error:', err);
        showView('login-view');
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN' && session) {
        await checkUserStatusAndRoute(session.user);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentMember = null;
        showView('login-view');
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Login button
    document.getElementById('google-login-btn').addEventListener('click', signInWithGoogle);

    // Logout buttons (multiple views have them)
    document.getElementById('dashboard-logout').addEventListener('click', signOut);
    document.getElementById('not-found-logout').addEventListener('click', signOut);
    document.getElementById('trial-expired-logout').addEventListener('click', signOut);

    // Send message button
    document.getElementById('send-message-btn').addEventListener('click', sendMessage);

    // Allow Enter to send message (Shift+Enter for new line)
    document.getElementById('message-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize
    checkSession();
});
