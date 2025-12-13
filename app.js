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
let isRouting = false; // Prevent double routing from auth events
let authProcessed = false; // Track if we've already handled auth for this page load
let attachedFiles = []; // Files to be uploaded with message
let allMessages = []; // Store all messages for search/filter
let showHighlightedOnly = false; // Filter to show only highlighted messages
let highlightedMessages = new Set(); // Store highlighted message IDs (in localStorage)

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                             'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'text/plain'];

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
    // Prevent double routing from multiple auth events
    if (isRouting) {
        console.log('Already routing, skipping...');
        return;
    }
    isRouting = true;

    showView('loading-view');
    currentUser = user;

    console.log('Checking user status for:', user.email);

    try {
        // Step 1: Check if email exists in users table
        console.log('Starting user lookup query...');
        console.log('User email:', user.email);

        // Use direct fetch to bypass Supabase client blocking issue
        // Don't call supabase.auth.getSession() as it also hangs
        const startTime = Date.now();
        // Use ilike for case-insensitive email matching
        const fetchUrl = `${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(user.email)}&select=*`;
        console.log('Fetching:', fetchUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let member = null;
        let error = null;

        try {
            const response = await fetch(fetchUrl, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const endTime = Date.now();
            console.log(`Fetch completed in ${endTime - startTime}ms, status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                member = data && data.length > 0 ? data[0] : null;
                console.log('Fetched member:', member);
            } else {
                const errorText = await response.text();
                console.error('Fetch error:', response.status, errorText);
                error = { message: errorText, status: response.status };
            }
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('Fetch failed:', fetchError);
            if (fetchError.name === 'AbortError') {
                showToast('Connection timeout. Please try again.');
                showView('login-view');
                return;
            }
            error = fetchError;
        }

        if (error) {
            console.error('Database error:', error);
            showToast('Error connecting to database. Please try again.');
            showView('login-view');
            return;
        }

        if (!member) {
            // Email NOT found - show "take quiz first" page
            console.log('User not found in database - needs to take quiz');
            showView('not-found-view');
            return;
        }

        // Step 1b: Link the auth ID to the user record if different
        // This syncs the Supabase auth ID with the quiz-created user record
        if (member.id !== user.id) {
            console.log('Linking auth ID to user record...');
            const { error: linkError } = await supabase
                .from('users')
                .update({
                    id: user.id,
                    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || member.avatar_url,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || member.name
                })
                .eq('email', user.email);

            if (linkError) {
                console.warn('Could not link auth ID:', linkError);
                // Continue anyway - we can still use the record
            } else {
                member.id = user.id;
                console.log('Auth ID linked successfully');
            }
        }

        currentMember = member;
        console.log('Current member:', currentMember);

        // Step 2: Handle status-based routing
        // Default to 'lead' if status is null/undefined
        let updatedStatus = member.status || 'lead';
        console.log('Current status:', updatedStatus);

        // If status is "lead" or null, upgrade to "trial"
        if (!member.status || member.status === 'lead') {
            console.log('Upgrading user from lead to trial...');
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    status: 'trial',
                    trial_start_date: new Date().toISOString(),
                    last_login_at: new Date().toISOString()
                })
                .eq('email', user.email);

            if (updateError) {
                console.error('Error upgrading to trial:', updateError);
            } else {
                updatedStatus = 'trial';
                currentMember.status = 'trial';
                currentMember.trial_start_date = new Date().toISOString();
                console.log('User upgraded from lead to trial');
            }
        }

        // If status is "trial", check if expired
        if (updatedStatus === 'trial' && currentMember.trial_start_date) {
            const trialStart = new Date(currentMember.trial_start_date);
            const now = new Date();
            const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
            console.log('Trial days passed:', daysPassed);

            if (daysPassed >= 7) {
                // Trial has expired
                const { error: expireError } = await supabase
                    .from('users')
                    .update({
                        status: 'trial_expired',
                        last_login_at: new Date().toISOString()
                    })
                    .eq('email', user.email);

                if (!expireError) {
                    updatedStatus = 'trial_expired';
                    currentMember.status = 'trial_expired';
                    console.log('Trial expired');
                }
            }
        }

        // Update last login for active users (non-blocking, fire and forget)
        if (updatedStatus === 'trial' || updatedStatus === 'active') {
            // Don't await - let it run in background to avoid Supabase client blocking
            fetch(`${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(user.email)}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ last_login_at: new Date().toISOString() })
            }).catch(err => console.warn('Failed to update last login:', err));
        }

        // Step 3: Route based on final status
        console.log('Final status for routing:', updatedStatus);
        switch (updatedStatus) {
            case 'trial_expired':
                showView('trial-expired-view');
                break;
            case 'trial':
            case 'active':
                initializeDashboard();
                break;
            case 'lead':
                // If still lead (update failed), try dashboard anyway
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
    } finally {
        isRouting = false;
    }
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
function initializeDashboard() {
    console.log('Initializing dashboard...');
    console.log('Current member data:', currentMember);

    showView('dashboard-view');

    // Set welcome message
    const name = currentMember?.name || currentUser?.user_metadata?.full_name || 'Member';
    document.getElementById('dashboard-welcome').textContent = `Welcome, ${name}!`;

    // Set protocol - default to 1 if not set
    const protocol = currentMember?.protocol || 1;
    const protocolInfo = PROTOCOLS[protocol];

    if (protocolInfo) {
        document.getElementById('dashboard-protocol').textContent = `Your Protocol: ${protocolInfo.name}`;
    } else {
        document.getElementById('dashboard-protocol').textContent = 'Your Protocol: General Gut Health';
    }

    console.log('Protocol:', protocol);

    // Show trial banner if on trial
    if (currentMember?.status === 'trial') {
        const trialStart = currentMember.trial_start_date
            ? new Date(currentMember.trial_start_date)
            : new Date();
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

    // Initialize file upload
    initializeFileUpload();

    // Initialize message search
    initializeMessageSearch();

    console.log('Dashboard initialized successfully');
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
    entries.forEach((entry, index) => {
        const date = new Date(entry.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Create a summary based on protocol
        const summary = createEntrySummary(entry.tracking_data, protocol);
        const hasNotes = entry.notes && entry.notes.trim().length > 0;

        html += `
            <div class="history-item ${hasNotes ? 'has-notes' : ''}">
                <div class="history-main">
                    <div class="history-date">${date}</div>
                    <div class="history-summary">${summary}</div>
                    ${hasNotes ? `<button class="notes-toggle" data-index="${index}" aria-label="Toggle notes">
                        <span class="toggle-icon">▼</span>
                    </button>` : ''}
                </div>
                ${hasNotes ? `<div class="history-notes hidden" id="notes-${index}">
                    <div class="notes-content">${escapeHtml(entry.notes)}</div>
                </div>` : ''}
            </div>
        `;
    });

    historyList.innerHTML = html;

    // Add click handlers for notes toggles
    historyList.querySelectorAll('.notes-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            const notesDiv = document.getElementById(`notes-${index}`);
            const icon = e.currentTarget.querySelector('.toggle-icon');

            if (notesDiv.classList.contains('hidden')) {
                notesDiv.classList.remove('hidden');
                icon.textContent = '▲';
            } else {
                notesDiv.classList.add('hidden');
                icon.textContent = '▼';
            }
        });
    });
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

    // Show recovery path section with appropriate content
    showRecoveryPathSection();
}

function showRecoveryPathSection() {
    const recoveryPathSection = document.getElementById('recovery-path-section');
    const trialCard = document.getElementById('trial-upgrade-card');
    const paidCard = document.getElementById('paid-milestone-card');

    if (!recoveryPathSection || !trialCard || !paidCard) return;

    // Always show the recovery path section (for both trial and paid users)
    recoveryPathSection.classList.remove('hidden');

    if (currentMember?.status === 'trial') {
        // Trial user: show upgrade card, hide milestone card
        trialCard.classList.remove('hidden');
        paidCard.classList.add('hidden');

        // Track upgrade button clicks (add listener if not already added)
        const upgradeBtn = document.getElementById('locked-pathway-upgrade-btn');
        if (upgradeBtn && !upgradeBtn.dataset.listenerAdded) {
            upgradeBtn.addEventListener('click', () => {
                console.log('Recovery path upgrade button clicked');
                // TODO: Add analytics tracking here
                // e.g., trackEvent('upgrade_click', { source: 'recovery_path' });
            });
            upgradeBtn.dataset.listenerAdded = 'true';
        }
    } else if (currentMember?.status === 'active') {
        // Paid user: hide upgrade card, show milestone card
        trialCard.classList.add('hidden');
        paidCard.classList.remove('hidden');

        // TODO: Future enhancement - populate milestone checkboxes based on actual user data
        // For now, all milestones are unchecked (static)
        // Example future logic:
        // - Check "Complete 7 days of tracking" when user has 7+ tracking entries
        // - Check other milestones based on practitioner reviews, etc.
    } else {
        // Unknown status: hide both cards
        trialCard.classList.add('hidden');
        paidCard.classList.add('hidden');
    }
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

    if (error) {
        console.error('Error loading messages:', error);
        allMessages = [];
    } else {
        allMessages = messages || [];
    }

    // Update highlighted button visibility
    updateHighlightedButton();

    // Render messages
    renderMessages(allMessages);
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    const sendBtn = document.getElementById('send-message-btn');

    if (!message && attachedFiles.length === 0) {
        showToast('Please enter a message or attach a file');
        return;
    }

    // Disable button while sending
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    try {
        // Upload files if any
        let uploadedFiles = [];
        if (attachedFiles.length > 0) {
            showToast('Uploading files...');
            for (const file of attachedFiles) {
                try {
                    const uploadedFile = await uploadFile(file);
                    uploadedFiles.push(uploadedFile);
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    showToast(`Failed to upload ${file.name}`);
                }
            }
        }

        // Send message with attachments
        const { error } = await supabase
            .from('messages')
            .insert({
                user_id: currentMember.id,
                sender_type: 'member',
                sender_email: currentMember.email,
                message_text: message || '(File attachment)',
                attachments: uploadedFiles.length > 0 ? uploadedFiles : null
            });

        if (error) {
            console.error('Error sending message:', error);
            showToast('Error sending message. Please try again.');
        } else {
            input.value = '';
            attachedFiles = [];
            updateAttachedFilesUI();
            showToast('Message sent!');
            loadMessages();
        }
    } catch (err) {
        console.error('Error sending message:', err);
        showToast('Error sending message. Please try again.');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Message';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// FILE ATTACHMENT FUNCTIONS
// ============================================
function initializeFileUpload() {
    const fileInput = document.getElementById('file-input');
    const attachBtn = document.getElementById('attach-file-btn');

    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showToast(`File "${file.name}" is too large. Max size is 20MB.`);
            return;
        }

        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|gif|webp|doc|docx|txt)$/i)) {
            showToast(`File type not allowed: ${file.name}`);
            return;
        }

        // Check for duplicates
        if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
            showToast(`File "${file.name}" is already attached.`);
            return;
        }

        attachedFiles.push(file);
    });

    updateAttachedFilesUI();
    e.target.value = ''; // Reset input
}

function updateAttachedFilesUI() {
    const container = document.getElementById('attached-files');

    if (attachedFiles.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = attachedFiles.map((file, index) => `
        <div class="attached-file">
            <span class="attached-file-icon">${getFileIcon(file.name)}</span>
            <span class="attached-file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="attached-file-size">${formatFileSize(file.size)}</span>
            <button class="attached-file-remove" data-index="${index}" title="Remove">×</button>
        </div>
    `).join('');

    // Add remove handlers
    container.querySelectorAll('.attached-file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            attachedFiles.splice(index, 1);
            updateAttachedFilesUI();
        });
    });
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

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadFile(file) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${currentMember.id}/${timestamp}_${safeName}`;

    const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

    if (error) {
        console.error('Upload error:', error);
        throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

    return {
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        url: urlData.publicUrl
    };
}

// ============================================
// MESSAGE SEARCH FUNCTIONS
// ============================================
function initializeMessageSearch() {
    const searchInput = document.getElementById('message-search');
    const clearBtn = document.getElementById('clear-search-btn');
    const highlightedBtn = document.getElementById('show-highlighted-btn');

    // Load highlighted messages from localStorage
    loadHighlightedMessages();

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearBtn.classList.toggle('hidden', !query);
        filterMessages(query);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        filterMessages('');
    });

    highlightedBtn.addEventListener('click', () => {
        showHighlightedOnly = !showHighlightedOnly;
        highlightedBtn.classList.toggle('active', showHighlightedOnly);
        filterMessages(searchInput.value.trim());
    });
}

function loadHighlightedMessages() {
    try {
        const stored = localStorage.getItem('highlightedMessages');
        if (stored) {
            highlightedMessages = new Set(JSON.parse(stored));
        }
    } catch (e) {
        console.error('Error loading highlighted messages:', e);
    }
}

function saveHighlightedMessages() {
    try {
        localStorage.setItem('highlightedMessages', JSON.stringify([...highlightedMessages]));
    } catch (e) {
        console.error('Error saving highlighted messages:', e);
    }
}

function toggleHighlight(messageId) {
    if (highlightedMessages.has(messageId)) {
        highlightedMessages.delete(messageId);
    } else {
        highlightedMessages.add(messageId);
    }
    saveHighlightedMessages();
    updateHighlightedButton();
    renderMessages(allMessages);
}

function updateHighlightedButton() {
    const btn = document.getElementById('show-highlighted-btn');
    btn.classList.toggle('hidden', highlightedMessages.size === 0);
}

function filterMessages(query) {
    let filtered = allMessages;

    // Filter by highlighted if active
    if (showHighlightedOnly) {
        filtered = filtered.filter(msg => highlightedMessages.has(msg.id));
    }

    // Filter by search query
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(msg =>
            msg.message_text.toLowerCase().includes(lowerQuery)
        );
    }

    renderMessages(filtered, query);
}

function highlightSearchTerm(text, query) {
    if (!query) return escapeHtml(text);

    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escapedText.replace(regex, '<span class="search-match">$1</span>');
}

function renderMessages(messages, searchQuery = '') {
    const messagesList = document.getElementById('messages-list');

    if (!messages || messages.length === 0) {
        if (showHighlightedOnly) {
            messagesList.innerHTML = '<p class="messages-empty">No highlighted messages.</p>';
        } else if (searchQuery) {
            messagesList.innerHTML = '<p class="messages-empty">No messages match your search.</p>';
        } else {
            messagesList.innerHTML = '<p class="messages-empty">No messages yet. Send your first message above!</p>';
        }
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
        const isHighlighted = highlightedMessages.has(msg.id);
        const messageText = searchQuery
            ? highlightSearchTerm(msg.message_text, searchQuery)
            : escapeHtml(msg.message_text);

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

        html += `
            <div class="message ${isExpert ? 'message-expert' : 'message-member'} ${isHighlighted ? 'highlighted' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <span class="message-sender">${isExpert ? 'Gut Health Expert' : 'You'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${messageText}</div>
                ${attachmentsHtml}
                <div class="message-actions">
                    <button class="btn-highlight ${isHighlighted ? 'highlighted' : ''}" data-id="${msg.id}" title="${isHighlighted ? 'Remove highlight' : 'Highlight message'}">
                        <svg viewBox="0 0 24 24" fill="${isHighlighted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    messagesList.innerHTML = html;

    // Add highlight button handlers
    messagesList.querySelectorAll('.btn-highlight').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const messageId = e.currentTarget.dataset.id;
            toggleHighlight(messageId);
        });
    });

    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

// ============================================
// SESSION MANAGEMENT
// ============================================
async function checkSession() {
    // Show loading while we wait for auth state to be determined
    showView('loading-view');

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error.message);
            showView('login-view');
            return;
        }

        // If no session exists, show login immediately
        if (!session) {
            console.log('No session found, showing login');
            showView('login-view');
        }
        // If session exists, onAuthStateChange will handle routing
        // No need for fallback - auth state change is reliable
    } catch (err) {
        console.error('Session check error:', err);
        showView('login-view');
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session ? 'with session' : 'no session');

    // Handle sign out
    if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentMember = null;
        isRouting = false;
        authProcessed = false;
        showView('login-view');
        return;
    }

    // Handle valid session events - only process once per page load
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session) {
        // Skip if already processed or currently routing
        if (authProcessed || isRouting) {
            console.log('Auth already processed or routing in progress, skipping...');
            return;
        }
        authProcessed = true;
        await checkUserStatusAndRoute(session.user);
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
