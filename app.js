// Gut Healing Academy - Member Portal
// Complete Dashboard Application
// Version: 3.0.1 - ACTUAL FIX - No const declarations anywhere - 2025-01-18

// ============================================
// CONFIGURATION - NO const declarations to prevent redeclaration errors
// ============================================
window.SUPABASE_URL = window.SUPABASE_URL || 'https://mwabljnngygkmahjgvps.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjQ3MzgsImV4cCI6MjA4MTEwMDczOH0.rbZYj1aXui_xZ0qkg7QONdHppnJghT2r0ycZwtr3a-E';

// Initialize Supabase client safely (only once) - NO const!
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
// Use window.supabaseClient directly instead of const supabase
var supabase = window.supabaseClient;

// ============================================
// PROTOCOL CONFIGURATIONS
// ============================================
var PROTOCOLS = {
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

// ============================================
// TRIAL ACCESS GATING CONFIGURATION (Future Implementation)
// ============================================
// This defines what content is accessible during trial vs paid membership
// The $1 trial model gives 7 days of limited access to build engagement
//
// ACCESS_LEVELS configuration:
//
// TRIAL_ACCESS (first 7 days after signup):
// - protocol: 'full'         - Show complete protocol (not week-gated, just "Your Protocol" as ongoing guidance)
// - tracking: 'full'         - Full daily tracking access (this creates investment and habit)
// - liveQA: 'view_only'      - Can see session info and RSVP, but note: "Live participation available with active membership"
// - pastRecordings: 'limited' - 1 recording unlocked, others show lock icon with "Unlock with membership"
// - messageExpert: 'preview'  - See practitioner profile, but messaging disabled with "Messaging available with active membership"
// - learningMaterial: 'titles_only' - Show titles only, content locked with upgrade CTA
//
// PAID_ACCESS (active subscription):
// - protocol: 'full'
// - tracking: 'full'
// - liveQA: 'full'
// - pastRecordings: 'full'
// - messageExpert: 'full'
// - learningMaterial: 'full'
//
// Implementation Notes:
// - Check user subscription status via currentMember.status
// - Status values: 'lead', 'trial', 'active', 'trial_expired', 'cancelled'
// - Trial period is 7 days from trial_start_date
// - When implementing, check each feature area and apply appropriate gating
// - Use existing locked-message pattern (lock icon + upgrade CTA) for consistency
//
// TODO: Implement actual gating logic in applyAccessControls() function
// TODO: Add trial-specific messaging for each gated feature
// TODO: Track trial engagement metrics to optimize conversion
// ============================================

// Protocol content placeholders (Week 1)
var PROTOCOL_CONTENT = {
    1: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Slow down, de-gas, support digestion</p>

            <div class="protocol-day">
                <h5>Day 1-2: Foundation</h5>
                <ul>
                    <li>Start each meal with 3 deep breaths</li>
                    <li>Chew each bite 20-30 times</li>
                    <li>Put fork down between bites</li>
                    <li>No drinking during meals (only small sips)</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why the 20-Minute Meal Rule Matters</h6>
                        <p>Fast eating causes two problems that directly lead to bloating:</p>
                        <p><strong>1. Air swallowing (aerophagia):</strong> When you eat quickly, you gulp air with every bite. This air gets trapped in your digestive system and has to go somewhere—usually causing that uncomfortable distended feeling.</p>
                        <p><strong>2. Incomplete chewing:</strong> Large food particles are harder for your stomach to break down. When food isn't properly broken down, it ferments in your gut, producing gas.</p>
                        <p>This single change often produces noticeable results within 2-3 days.</p>

                        <h6>How to Actually Do It</h6>
                        <p>Use a timer on your phone—it feels awkward at first, but you're retraining years of rushed eating habits. Put your fork down between bites. Really taste your food.</p>
                        <p>If 20 minutes feels impossible, start with 15 and work up. The goal is progress, not perfection.</p>

                        <h6>What You Might Notice</h6>
                        <p>By Day 2, many people report feeling "fuller faster" and having less post-meal discomfort. This is your digestion starting to work properly.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Digestive Support</h5>
                <ul>
                    <li>Apple cider vinegar: 1 tbsp in water before meals</li>
                    <li>Ginger tea between meals</li>
                    <li>10-minute walk after lunch and dinner</li>
                    <li><span class="warning-text">⚠️ If you have reflux, skip ACV—use ginger tea instead</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why Pre-Meal Primers Work</h6>
                        <p>Your stomach needs to be "ready" to digest. Bitter and acidic foods before meals send a signal to your body: "Food is coming—start producing digestive enzymes."</p>
                        <p>Apple cider vinegar (ACV) is acidic and stimulates stomach acid production. For people with LOW stomach acid (common as we age), this can dramatically improve digestion.</p>
                        <p><strong class="warning-text">⚠️ IMPORTANT:</strong> If you have reflux, heartburn, or GERD, ACV may make it worse. Use ginger tea or lemon water instead—they stimulate digestion without the acidity.</p>

                        <h6>Why Walking Helps</h6>
                        <p>A 10-minute walk after meals isn't exercise—it's movement that helps food move through your system. Sitting or lying down after eating slows everything down and can trap gas.</p>
                        <p>You don't need to power walk. A gentle stroll is perfect. This is especially helpful after your largest meal of the day.</p>

                        <h6>The 4-Hour Spacing Rule</h6>
                        <p>Your gut has a "cleaning wave" called the Migrating Motor Complex (MMC) that sweeps debris through your system. It only works when you're NOT eating.</p>
                        <p>Every time you snack—even a small bite—you reset the clock. Aim for 4 hours between meals with only water, plain tea, or black coffee in between.</p>
                        <p>If you have diabetes or feel shaky between meals, modify this—message our expert team for guidance.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Optimize</h5>
                <ul>
                    <li>Identify your 3 worst bloating triggers</li>
                    <li>Try fennel or peppermint tea after meals</li>
                    <li>Evening: gentle belly massage (clockwise)</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Finding Your Personal Triggers</h6>
                        <p>By now you have 4-5 days of tracking data. Look for patterns:</p>
                        <ul>
                            <li>Which meals caused the worst bloating?</li>
                            <li>Any specific foods that appeared on your worst days?</li>
                            <li>Time of day patterns?</li>
                        </ul>
                        <p><strong>The most common triggers we see:</strong></p>
                        <ul>
                            <li>Onion and garlic (including powders)</li>
                            <li>Wheat/bread/pasta</li>
                            <li>Beans/legumes</li>
                            <li>Dairy (milk, soft cheese, ice cream)</li>
                            <li>Carbonated drinks</li>
                        </ul>
                        <p>You don't need to eliminate everything—just identify YOUR top 3 triggers.</p>

                        <h6>Why Belly Massage Works</h6>
                        <p>A gentle clockwise massage follows the direction of your digestive tract. It can help move trapped gas and stimulate bowel movements.</p>
                        <p><strong>How to do it:</strong></p>
                        <ul>
                            <li>Lie down or sit comfortably</li>
                            <li>Use light-medium pressure</li>
                            <li>Start at your right hip, move up, across, and down to your left hip</li>
                            <li>Repeat for 2-3 minutes</li>
                            <li>Best done before bed or when bloated</li>
                        </ul>

                        <h6>Fennel & Peppermint Tea</h6>
                        <p>Both have natural carminative (anti-gas) properties. Fennel relaxes the smooth muscles in your digestive tract, allowing trapped gas to pass. Peppermint has a similar effect.</p>
                        <p>Drink after meals when you're prone to bloating, or when you feel symptoms coming on.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>The 20-minute meal:</strong> Set a timer. Your meal should take at least 20 minutes.</p>
                <p><strong>The bloat journal:</strong> Note which foods cause bloating within 2 hours.</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>Bloating may reduce 20-40% (not gone, but noticeably better)</li>
                    <li>Pants fitting better by evening</li>
                    <li>At least 2-3 days where you "forgot" about bloating</li>
                </ul>
                <p>You won't be bloat-free. But if you see ANY positive change, the protocol is working and Week 2 will build on it.</p>
            </div>
        </div>
    `,
    2: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Hydrate, move, establish routine</p>

            <div class="protocol-day">
                <h5>Day 1-2: Foundation</h5>
                <ul>
                    <li>16oz warm water immediately on waking</li>
                    <li>Breakfast within 1 hour of waking</li>
                    <li>Sit on toilet 5-10 min after breakfast (even without urge)</li>
                    <li>Use footstool to elevate knees above hips</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why Warm Water on Waking</h6>
                        <p>Warm water on an empty stomach triggers your gastrocolic reflex—your body's natural "wake up" signal to your bowels. It's like an internal alarm clock for your digestive system.</p>
                        <p>Cold water works too, but warm water is gentler and may be more effective for some people. The key is consistency: same time, every day, before anything else.</p>

                        <h6>The Bathroom Routine Matters</h6>
                        <p>Your body learns patterns. By sitting on the toilet at the same time every day—even without an urge—you're training your colon to expect a bowel movement.</p>
                        <p>Why after breakfast? Eating triggers the gastrocolic reflex (your gut's "move things along" response). Combining this with your morning water creates a powerful signal.</p>

                        <h6>Proper Positioning</h6>
                        <p>The modern toilet puts your body in the wrong position for elimination. When your knees are below your hips, your puborectalis muscle creates a kink in your rectum—like a bent garden hose.</p>
                        <p>Elevating your feet with a stool (even a stack of books) brings your knees above your hips, straightening that "hose" and making elimination much easier.</p>
                        <p>The difference can be dramatic for people who strain.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Fiber + Movement</h5>
                <ul>
                    <li>Add 1 tbsp ground flaxseed to breakfast</li>
                    <li>20-30 min walking daily</li>
                    <li>Increase water to half body weight in ounces</li>
                    <li><span class="warning-text">⚠️ Increase fiber slowly every 2-3 days if tolerated</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Soluble vs Insoluble Fiber</h6>
                        <p>There are two types of fiber, and for constipation, you need to start with the right one:</p>
                        <p><strong>SOLUBLE fiber</strong> (oatmeal, flaxseed, chia seeds, sweet potato) absorbs water and forms a gel. It makes stool softer and easier to pass.</p>
                        <p><strong>INSOLUBLE fiber</strong> (raw vegetables, wheat bran, popcorn) adds bulk but doesn't absorb water. If you're dehydrated or already backed up, it can make constipation WORSE.</p>
                        <p>Start with soluble fiber only. Add insoluble fiber later, once things are moving.</p>
                        <p><strong class="warning-text">⚠️ IMPORTANT:</strong> Increase fiber slowly—every 2-3 days, not all at once. Too much too fast causes gas, bloating, and can worsen constipation.</p>

                        <h6>Why Movement Matters</h6>
                        <p>Physical activity stimulates peristalsis—the wave-like contractions that move food through your intestines. Sitting all day slows everything down.</p>
                        <p>You don't need intense exercise. A 20-30 minute walk is enough. After meals is ideal timing because you're combining movement with your gastrocolic reflex.</p>
                        <p><strong>Bonus moves that help:</strong></p>
                        <ul>
                            <li>Deep squats (hold for 30 seconds)</li>
                            <li>Knee-to-chest stretches (lying on back)</li>
                            <li>Abdominal massage (clockwise circles)</li>
                        </ul>

                        <h6>Hydration is Non-Negotiable</h6>
                        <p>Fiber needs water to work. Without adequate hydration, fiber can actually make constipation worse—it becomes a dry, hard mass.</p>
                        <p>Target: Half your body weight in ounces. If you weigh 160 lbs, aim for 80oz (about 2.4 liters). Keep a water bottle with you and refill it throughout the day.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Optimize</h5>
                <ul>
                    <li>Magnesium citrate 200-400mg at bedtime if needed</li>
                    <li>Knee-to-chest stretches before bed</li>
                    <li>Clockwise abdominal massage</li>
                    <li><span class="warning-text">⚠️ Check with doctor if kidney issues before using magnesium</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why Magnesium Helps</h6>
                        <p>Magnesium citrate works two ways:</p>
                        <p><strong>1. Osmotic effect:</strong> It draws water into your intestines, softening stool</p>
                        <p><strong>2. Muscle relaxation:</strong> It relaxes the smooth muscles of your colon, making it easier to go</p>
                        <p>Start with 200mg at bedtime. If no effect after 2 nights, increase to 400mg. Some people need up to 600mg, but start low.</p>
                        <p><strong class="warning-text">⚠️ CAUTION:</strong> If you have kidney disease or take medications that affect fluid balance (diuretics, blood pressure meds), check with your doctor before using magnesium supplements.</p>

                        <h6>Timing Matters</h6>
                        <p>Take magnesium at bedtime so it works overnight. You'll often notice the effect in the morning—ideally aligning with your bathroom routine.</p>
                        <p>If magnesium causes loose stools, reduce the dose. You're looking for soft, easy-to-pass stool (Bristol Type 3-4), not diarrhea.</p>

                        <h6>What If It's Not Working?</h6>
                        <p>If you've been consistent with all interventions for 7 days and haven't seen improvement:</p>
                        <ul>
                            <li>Message our expert team—you may need protocol adjustment</li>
                            <li>Consider if you're truly hydrated (check urine color—pale yellow is good)</li>
                            <li>Stress can lock up your gut—Protocol 6 techniques may help</li>
                        </ul>
                        <p>Progress isn't always linear. Even one more bowel movement per week than before is meaningful.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Morning water ritual:</strong> 16oz warm water before anything else</p>
                <p><strong>Toilet timing:</strong> Same time every day, 5-10 min sit after breakfast</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>Aim for 5+ bathroom visits this week (up from 2-3)</li>
                    <li>Stool moving from Type 1-2 toward Type 3-4</li>
                    <li>Less straining, more natural urge</li>
                </ul>
                <p>You probably won't be "regular" by Day 7. We're resetting habits that took years to develop. If you go even ONE more time than usual, that's real progress.</p>
            </div>
        </div>
    `,
    3: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Calm, bind, reduce triggers</p>

            <div class="protocol-day">
                <h5>Day 1-2: Eliminate Triggers</h5>
                <ul>
                    <li>Remove: coffee, alcohol, energy drinks, carbonated drinks</li>
                    <li>Sip water throughout day (not large amounts at once)</li>
                    <li>Add pinch of salt to water for electrolytes</li>
                    <li><span class="warning-text">⚠️ Expect caffeine withdrawal (headache 2-3 days)</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why These Drinks Are Problems</h6>
                        <p><strong>COFFEE (including decaf):</strong> Caffeine and other compounds in coffee directly stimulate gut contractions. Even decaf can be a trigger—it's not just the caffeine.</p>
                        <p><strong>ALCOHOL:</strong> Irritates your gut lining and speeds up transit time. Even small amounts can trigger a flare.</p>
                        <p><strong>CARBONATED DRINKS:</strong> The bubbles create gas and can irritate an already-sensitive gut.</p>
                        <p><strong>HIGH FRUCTOSE DRINKS (fruit juice, regular soda):</strong> Fructose is poorly absorbed by many people with IBS-D, pulling water into the intestines.</p>

                        <h6>Caffeine Withdrawal is Real</h6>
                        <p>If you're a regular coffee drinker, expect withdrawal symptoms for 2-3 days:</p>
                        <ul>
                            <li>Headache (this is the main one)</li>
                            <li>Fatigue</li>
                            <li>Irritability</li>
                            <li>Difficulty concentrating</li>
                        </ul>
                        <p>This is temporary. Stay hydrated and know that pushing through these few days is worth it to identify if caffeine is a major trigger.</p>

                        <h6>Hydration with Diarrhea</h6>
                        <p>It seems counterintuitive, but you NEED to hydrate even though you're having diarrhea. You're losing fluids and electrolytes.</p>
                        <ul>
                            <li>Sip water throughout the day (large amounts at once can trigger urgency)</li>
                            <li>Add a pinch of salt to water, or drink bone broth</li>
                            <li>Avoid very cold drinks—room temperature is gentler</li>
                        </ul>
                        <p>Watch for signs of dehydration: dark urine, dizziness, dry mouth. If these occur, increase your fluids.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Add Binding Foods</h5>
                <ul>
                    <li>Include 2+ servings daily: white rice, ripe banana, oatmeal, cooked carrots</li>
                    <li>Avoid: dairy, fatty foods, raw vegetables, sugar alcohols</li>
                    <li>Eat 5-6 small meals (opposite of bloating protocol)</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>The BRAT+ Approach</h6>
                        <p>BRAT (Bananas, Rice, Applesauce, Toast) has been used for decades to manage diarrhea. We expand it to BRAT+:</p>
                        <ul>
                            <li>White rice (not brown—less fiber)</li>
                            <li>Ripe bananas</li>
                            <li>Cooked carrots</li>
                            <li>Oatmeal (plain, not flavored)</li>
                            <li>Potatoes without skin</li>
                            <li>Plain toast or crackers</li>
                        </ul>
                        <p>These foods are "binding"—they absorb water in your intestines and add bulk to loose stools.</p>

                        <h6>Foods to Avoid For Now</h6>
                        <ul>
                            <li><strong>DAIRY:</strong> Lactose is hard to digest when your gut is irritated</li>
                            <li><strong>FATTY/FRIED FOODS:</strong> Fat slows stomach emptying but speeds up colon transit—bad combo</li>
                            <li><strong>RAW VEGETABLES:</strong> Hard to digest, can worsen symptoms</li>
                            <li><strong>SUGAR ALCOHOLS:</strong> Check labels for sorbitol, xylitol, maltitol—these are notorious for causing diarrhea</li>
                            <li><strong>SPICY FOODS:</strong> Irritate the gut lining</li>
                        </ul>

                        <h6>Why Smaller, More Frequent Meals?</h6>
                        <p><strong class="warning-text">⚠️ This is OPPOSITE of the bloating protocol!</strong></p>
                        <p>For IBS-D, large meals overwhelm your system. They trigger strong gastrocolic reflex contractions—the "gotta go NOW" feeling.</p>
                        <p>Eat 5-6 small meals instead of 3 large ones. Each meal should fit in your two cupped hands. Eat slowly and stop before you feel full.</p>
                        <p>You're reducing the load on your system with each meal.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Calm Your System</h5>
                <ul>
                    <li>4-7-8 breathing: 2x daily (inhale 4, hold 7, exhale 8)</li>
                    <li>Cold water splash on face for 30 seconds</li>
                    <li>Optional: Saccharomyces boulardii 250mg daily</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>The Gut-Brain Connection in IBS-D</h6>
                        <p>Your gut and brain are directly connected via the vagus nerve. When you're anxious or stressed, your gut goes into "emergency mode"—rushing everything through.</p>
                        <p>This is why IBS-D often comes with:</p>
                        <ul>
                            <li>Anxiety about bathroom access</li>
                            <li>Symptoms before stressful events</li>
                            <li>The "nervous stomach" feeling</li>
                        </ul>
                        <p>Calming your nervous system calms your gut.</p>

                        <h6>Vagus Nerve Exercises</h6>
                        <p><strong>4-7-8 Breathing:</strong> Inhale for 4 counts, hold for 7, exhale for 8. The long exhale activates your parasympathetic nervous system ("rest and digest"). Do 4 cycles, twice daily.</p>
                        <p><strong>Cold water on face:</strong> Triggers the "dive reflex"—an automatic calming response. Splash cold water on your face for 30 seconds, or hold ice cubes.</p>
                        <p><strong>Gargling:</strong> Vigorously gargle water for 30-60 seconds. The vagus nerve runs through your throat—gargling stimulates it.</p>
                        <p>These aren't woo-woo—they're evidence-based techniques used in clinical settings.</p>

                        <h6>Saccharomyces Boulardii</h6>
                        <p>S. boulardii is a beneficial yeast (not bacteria) that's been specifically studied for diarrhea. Unlike bacterial probiotics, it:</p>
                        <ul>
                            <li>Survives stomach acid well</li>
                            <li>Doesn't get affected by antibiotics</li>
                            <li>Has good evidence for IBS-D specifically</li>
                        </ul>
                        <p>Start with 250mg daily with food. Can increase to 500mg if tolerated. It's well-tolerated because it's yeast-based rather than bacterial.</p>
                        <p>Available at most pharmacies and health food stores.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Small frequent meals:</strong> Each meal fits in cupped hands</p>
                <p><strong>Vagus nerve calming:</strong> 4-7-8 breathing shifts you to "rest and digest"</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>Bathroom visits reduced (from 5-6/day toward 3-4/day)</li>
                    <li>Fewer "emergency" rushes</li>
                    <li>Stool firming up toward Type 4-5</li>
                </ul>
                <p>IBS-D often involves anxiety that feeds symptoms. Even small improvements break this cycle. If you had ONE day where you felt more in control, that's meaningful progress.</p>
            </div>
        </div>
    `,
    4: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Stabilize, find patterns</p>

            <div class="protocol-day">
                <h5>Day 1-2: Establish Consistency</h5>
                <ul>
                    <li>Same wake time daily (even weekends)</li>
                    <li>Meals at fixed times (±30 min)</li>
                    <li>Track: C (constipation) / D (diarrhea) / M (mixed) / N (normal)</li>
                    <li>Stop eating 3 hours before bed</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why Consistency is Your #1 Intervention</h6>
                        <p>IBS-M is the most frustrating pattern because you never know what to expect. One day you can't go, the next you can't stop.</p>
                        <p>Your gut has its own circadian rhythm—an internal clock. When you eat irregularly, sleep erratically, or constantly change your routine, you confuse this clock.</p>
                        <p>Consistent inputs → more predictable outputs.</p>
                        <p>This is why timing matters more for IBS-M than any other pattern.</p>

                        <h6>The C/D/M/N Tracking System</h6>
                        <p>Every day, log your predominant pattern:</p>
                        <ul>
                            <li><strong>C</strong> = Constipation (hard/infrequent stools)</li>
                            <li><strong>D</strong> = Diarrhea (loose/frequent stools)</li>
                            <li><strong>M</strong> = Mixed (both in same day)</li>
                            <li><strong>N</strong> = Normal (comfortable, formed stool)</li>
                        </ul>
                        <p>After 7 days, you'll see patterns you can't see day-to-day. Maybe stress days are always D days. Maybe weekends (different routine) are C days.</p>
                        <p>This data is gold for Protocol refinement.</p>

                        <h6>The 3-Hour Rule Before Bed</h6>
                        <p>Eating too close to bedtime:</p>
                        <ul>
                            <li>Disrupts your gut's overnight "rest and repair" time</li>
                            <li>Can worsen reflux</li>
                            <li>May contribute to morning urgency or discomfort</li>
                        </ul>
                        <p>Give your gut a 3-hour break before sleep. If you need something, stick to water or herbal tea.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Middle Ground Foods</h5>
                <ul>
                    <li>Stick to: eggs, white rice, potatoes, lean protein, cooked vegetables</li>
                    <li>Avoid: raw vegetables, beans, dairy, fried foods</li>
                    <li>Keep portions moderate (not too large)</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>The "Safe" Foundation Foods</h6>
                        <p>These foods are unlikely to trigger either constipation OR diarrhea:</p>
                        <p><strong>✅ SAFE:</strong></p>
                        <ul>
                            <li>Eggs (any style)</li>
                            <li>White rice</li>
                            <li>Potatoes (with or without skin)</li>
                            <li>Lean chicken or fish</li>
                            <li>Cooked carrots, zucchini, green beans</li>
                            <li>Ripe banana (1 per day max)</li>
                            <li>Oatmeal (small serving)</li>
                        </ul>
                        <p><strong>❌ AVOID FOR NOW:</strong></p>
                        <ul>
                            <li>Raw vegetables and salads (hard to digest)</li>
                            <li>Beans and lentils (high fermentation)</li>
                            <li>Dairy products (common trigger)</li>
                            <li>Fried or very fatty foods (unpredictable effect)</li>
                            <li>Spicy foods (gut irritant)</li>
                            <li>Large portions of anything (overwhelms system)</li>
                        </ul>

                        <h6>Why "Middle Ground"?</h6>
                        <p>Extreme foods trigger extreme responses:</p>
                        <ul>
                            <li>Very high fiber → may cause D if your gut is sensitive</li>
                            <li>Very low fiber → may cause C</li>
                            <li>Very fatty → may cause D</li>
                            <li>Large meals → may cause D</li>
                        </ul>
                        <p>By eating from the middle, you're stabilizing your system. Once stable, we'll carefully reintroduce foods to see what YOUR gut can handle.</p>
                        <p>This isn't forever—it's a reset.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: State-Based Adjustments</h5>
                <ul>
                    <li>IF mostly C days: add flaxseed, more water, post-meal walks</li>
                    <li>IF mostly D days: add binding foods, vagus breathing 3x daily</li>
                    <li>IF mostly N days: document exactly what you ate—this is your template</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Reading Your Data</h6>
                        <p>Look at your C/D/M/N pattern from Days 1-4. What's the trend?</p>

                        <p><strong>IF MOSTLY C (CONSTIPATION) DAYS:</strong></p>
                        <p>Your system is sluggish. Add:</p>
                        <ul>
                            <li>1 tablespoon ground flaxseed to breakfast</li>
                            <li>2 extra cups of water</li>
                            <li>10-minute walks after each meal</li>
                            <li>Consider psyllium husk supplement</li>
                        </ul>

                        <p><strong>IF MOSTLY D (DIARRHEA) DAYS:</strong></p>
                        <p>Your system is overactive. Add:</p>
                        <ul>
                            <li>Extra binding foods (more rice, banana)</li>
                            <li>Remove any raw fruits or vegetables</li>
                            <li>Vagus nerve breathing 3x daily (not just 2x)</li>
                            <li>Consider S. boulardii if not already taking</li>
                        </ul>

                        <p><strong>IF MIXED OR MOSTLY N (NORMAL) DAYS:</strong></p>
                        <p>You're finding stability. DON'T CHANGE ANYTHING.</p>
                        <ul>
                            <li>Document exactly what you ate</li>
                            <li>Note your meal times</li>
                            <li>Record your sleep and stress levels</li>
                            <li>This is your TEMPLATE for what works</li>
                        </ul>

                        <h6>Why Week 1 is About Data</h6>
                        <p>IBS-M doesn't have a one-size-fits-all solution. Your triggers are unique. Week 1 is about:</p>
                        <ul>
                            <li>Stabilizing with consistency and safe foods</li>
                            <li>Collecting data on your patterns</li>
                            <li>Making targeted adjustments based on YOUR data</li>
                        </ul>
                        <p>If you can identify even ONE trigger or have ONE more normal day, that's valuable progress we build on in Week 2.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Pattern tracking:</strong> Your C/D/M/N log reveals triggers you can't see otherwise</p>
                <p><strong>Consistency IS the intervention:</strong> Predictable inputs → predictable outputs</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>More "N" days in Days 5-7 than Days 1-4</li>
                    <li>Less extreme swings (maybe still not normal, but not as bad)</li>
                    <li>Starting to see patterns in your triggers</li>
                </ul>
                <p>IBS-M is the hardest pattern to stabilize. Week 1 is about gathering data and finding stability. Even one more normal day is progress.</p>
            </div>
        </div>
    `,
    5: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Protect MMC, prevent relapse</p>

            <div class="protocol-day">
                <h5>Day 1-2: Protect Your MMC</h5>
                <ul>
                    <li>Only 3 meals/day (no snacks, period)</li>
                    <li>4-5 hours between meals</li>
                    <li>12-14 hour overnight fast</li>
                    <li>Only water between meals</li>
                    <li><span class="warning-text">⚠️ If diabetic, modify spacing—message expert first</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>What is the MMC and Why Does It Matter?</h6>
                        <p>The Migrating Motor Complex (MMC) is your gut's "cleaning wave"—a series of contractions that sweep bacteria and debris out of your small intestine.</p>
                        <p>In many cases, SIBO happens when this cleaning wave doesn't work properly. Bacteria that should be swept into the large intestine instead accumulate in the small intestine, causing symptoms.</p>
                        <p>The MMC only activates in a fasting state. Every time you eat—even a small snack—you turn it off for 90+ minutes.</p>

                        <h6>Why Meal Spacing is Non-Negotiable</h6>
                        <p>For post-SIBO recovery, protecting your MMC is THE most important intervention. This means:</p>
                        <ul>
                            <li>Only 3 meals per day (no snacks, period)</li>
                            <li>Minimum 4-5 hours between meals</li>
                            <li>12-14 hour overnight fast</li>
                            <li>Between meals: ONLY water (plain, nothing added)</li>
                        </ul>
                        <p>Yes, this is strict. But every snack resets your cleaning wave. For post-SIBO, this is where relapses often start.</p>

                        <h6 class="warning-text">⚠️ Important Exceptions</h6>
                        <p>If you have diabetes (especially on insulin or sulfonylureas), strict meal spacing can be dangerous. Message our expert team for modified guidance.</p>
                        <p>If you have a history of eating disorders, restrictive eating patterns can be triggering. Please work with your mental health provider alongside this protocol.</p>
                        <p>If you feel shaky, light-headed, or unwell between meals, don't push through—eat something and message us.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Low Fermentation Foods</h5>
                <ul>
                    <li>Allowed: eggs, chicken, fish, white rice, potatoes, cooked zucchini/carrots</li>
                    <li>Avoid: onion, garlic, beans, wheat, apples, regular dairy</li>
                    <li>Add vagus exercises: 4-7-8 breathing, gargling, humming</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why Low Fermentation Matters Post-SIBO</h6>
                        <p>After SIBO treatment, your gut is in a vulnerable state. The goal is to:</p>
                        <ul>
                            <li>Starve any remaining bacteria</li>
                            <li>Give your gut lining time to heal</li>
                            <li>Allow your MMC to re-establish normal function</li>
                        </ul>
                        <p>High-fermentation foods feed bacteria. Even "healthy" foods like garlic, onions, and beans can be problematic right now.</p>

                        <p><strong>ALLOWED FOODS:</strong></p>
                        <ul>
                            <li>Eggs, chicken, fish, beef, firm tofu</li>
                            <li>White rice, potatoes</li>
                            <li>Gluten-free bread (small amounts)</li>
                            <li>Cooked zucchini, carrots, spinach</li>
                            <li>Strawberries, blueberries, oranges (1 serving/day max)</li>
                            <li>Hard cheese, lactose-free dairy only</li>
                        </ul>

                        <p><strong>AVOID COMPLETELY:</strong></p>
                        <ul>
                            <li>Onion, garlic, leeks (high in fermentable sugars)</li>
                            <li>Beans, lentils, chickpeas (major bacterial food)</li>
                            <li>Wheat, rye, barley (fructans)</li>
                            <li>Apples, pears, stone fruits (high fructose)</li>
                            <li>Regular dairy—milk, soft cheese, yogurt (lactose)</li>
                            <li>Sugar alcohols (check labels)</li>
                        </ul>

                        <h6>Why Vagus Nerve Exercises?</h6>
                        <p>Your vagus nerve controls MMC function. Stimulating it can help restore normal motility:</p>
                        <ul>
                            <li>4-7-8 breathing (2x daily)</li>
                            <li>Gargling vigorously for 30-60 seconds</li>
                            <li>Humming for 2-3 minutes</li>
                        </ul>
                        <p>These exercises support your gut's cleaning wave.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Gentle Prebiotic</h5>
                <ul>
                    <li>If stable, introduce PHGG:</li>
                    <li>Day 5: ½ tsp once daily</li>
                    <li>Day 6: ½ tsp twice daily</li>
                    <li>Day 7: 1 tsp once daily</li>
                    <li>Ginger tea between meals to support motility</li>
                    <li><span class="warning-text">⚠️ If symptoms return, stop PHGG and return to Days 1-4</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>What is PHGG?</h6>
                        <p>Partially Hydrolyzed Guar Gum (PHGG) is a prebiotic fiber that's been specifically studied for post-SIBO recovery.</p>
                        <p>Unlike other prebiotics (like inulin or FOS), PHGG:</p>
                        <ul>
                            <li>Ferments slowly (less gas and bloating)</li>
                            <li>Is well-tolerated by most people</li>
                            <li>Feeds beneficial bacteria without causing SIBO flares</li>
                        </ul>
                        <p>It's a "gentle" way to start rebuilding your gut microbiome.</p>

                        <h6>The Slow Introduction Schedule</h6>
                        <ul>
                            <li><strong>Day 5:</strong> ½ teaspoon in water, once daily (with a meal)</li>
                            <li><strong>Day 6:</strong> ½ teaspoon, twice daily</li>
                            <li><strong>Day 7:</strong> 1 teaspoon, once daily</li>
                        </ul>
                        <p>Mix with water and drink with food. If you notice increased bloating, gas, or symptom return, STOP and go back to the Days 1-4 protocol. You may need more time before introducing prebiotics.</p>

                        <h6>Ginger as Prokinetic Support</h6>
                        <p>Ginger has natural prokinetic properties—it helps stimulate gut motility and supports MMC function.</p>
                        <p>Drink ginger tea between meals (not with meals, which would break your fast). Fresh ginger steeped in hot water is ideal, but ginger tea bags work too.</p>

                        <h6>What Success Looks Like for Post-SIBO</h6>
                        <p>Your goal this week is PREVENTION, not symptom improvement. If you had SIBO symptoms before treatment, success means:</p>
                        <ul>
                            <li>Symptoms remain "None" or "Mild" all 7 days</li>
                            <li>No return of the bloating/discomfort you had before</li>
                            <li>Meal spacing feels manageable</li>
                        </ul>
                        <p>You're rebuilding a healthy gut environment. This takes time, but it starts with these foundational habits.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Meal spacing is non-negotiable:</strong> Every snack turns off your MMC for 90+ min</p>
                <p><strong>Ginger tea:</strong> Between meals to support motility</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>Symptoms remain "None" or "Mild" all 7 days</li>
                    <li>Meal spacing feels manageable (not fighting hunger)</li>
                    <li>You're preventing relapse, not just managing</li>
                </ul>
                <p>If you get through Week 1 without significant symptom return, that's a major win. You're rebuilding—this takes time but starts with these habits.</p>
            </div>
        </div>
    `,
    6: `
        <!-- Safety Disclaimer -->
        <div class="protocol-accordion safety-disclaimer">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">⚠️ Important Safety Information</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <p>This programme is educational and not a substitute for medical advice.</p>
                    <p><strong>Stop and seek medical advice if you have:</strong></p>
                    <ul>
                        <li>Blood in stool or black/tarry stools</li>
                        <li>Unexplained weight loss</li>
                        <li>Fever or persistent vomiting</li>
                        <li>Severe or worsening pain</li>
                        <li>Symptoms waking you at night</li>
                    </ul>
                    <p>If you have diabetes, kidney disease, or a history of eating disorders, some protocol steps may need modification—message our expert team before starting.</p>
                </div>
            </div>
        </div>

        <!-- Bristol Stool Chart -->
        <div class="protocol-accordion bristol-chart-accordion">
            <div class="protocol-accordion-header">
                <h5 class="protocol-accordion-title">📊 Bristol Stool Chart Reference</h5>
                <span class="protocol-accordion-icon">▼</span>
            </div>
            <div class="protocol-accordion-content">
                <div class="protocol-accordion-content-inner">
                    <img src="assets/bristol-stool-chart.png" alt="Bristol Stool Chart" class="bristol-chart-image">
                    <div class="bristol-chart-summary">
                        <p><strong>Use this when tracking your bowel movements:</strong></p>
                        <p><strong>Type 1-2:</strong> Hard, lumpy, difficult to pass → Constipation</p>
                        <p><strong>Type 3-4:</strong> Smooth, sausage-shaped, easy to pass → IDEAL (your goal)</p>
                        <p><strong>Type 5-6:</strong> Soft, mushy, loose → Trending toward diarrhea</p>
                        <p><strong>Type 7:</strong> Watery, no solid pieces → Diarrhea</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Protocol Introduction -->
        <div class="protocol-intro">
            <p>This protocol was selected for you based on your quiz answers. Follow the day-by-day actions and track your progress.</p>
            <p>If your symptoms change or you need a different approach, use the Message Expert tab—our team will review your history and adjust your protocol.</p>
        </div>

        <div class="protocol-week">
            <h4>Your Daily Protocol Steps</h4>
            <p class="protocol-focus">Focus: Calm nervous system, break the stress-gut cycle</p>

            <div class="protocol-day">
                <h5>Day 1-2: Find Your Pattern</h5>
                <ul>
                    <li>Track 3x daily: stress level (1-10) + gut symptoms (1-10)</li>
                    <li>Note what happened in past 2-3 hours</li>
                    <li>Look for: Does stress spike BEFORE or DURING gut symptoms?</li>
                    <li><span class="warning-text">⚠️ If you have diagnosed anxiety/depression, coordinate with your mental health provider</span></li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>The Gut-Brain Axis is Real</h6>
                        <p>Your gut has more nerve cells than your spinal cord—it's often called your "second brain." The vagus nerve creates a direct communication highway between your gut and your brain.</p>
                        <p>This means:</p>
                        <ul>
                            <li>Stress, anxiety, and emotions directly affect your gut</li>
                            <li>Gut problems can affect your mood and mental state</li>
                            <li>It's a two-way street</li>
                        </ul>
                        <p>Your symptoms are REAL and PHYSICAL—even when they're triggered by stress. This isn't "all in your head."</p>

                        <h6>Why Detailed Tracking?</h6>
                        <p>Most people say "stress affects my gut" but don't realize HOW directly connected they are. By tracking both stress and symptoms on the same 1-10 scale, you'll see patterns:</p>
                        <ul>
                            <li>Does stress spike BEFORE symptoms? (stress → gut)</li>
                            <li>Do symptoms come WITH stress? (simultaneous)</li>
                            <li>Is there a delay? (stress in morning → symptoms in afternoon)</li>
                        </ul>
                        <p>Track 3x daily: morning, afternoon, evening. Note what happened in the past 2-3 hours and what you ate.</p>

                        <h6 class="warning-text">⚠️ For Those with Diagnosed Anxiety/Depression</h6>
                        <p>This protocol works alongside mental health treatment, not instead of it. Please:</p>
                        <ul>
                            <li>Continue any medications as prescribed</li>
                            <li>Inform your mental health provider about this program</li>
                            <li>Use our Message Expert feature if you need guidance on integration</li>
                        </ul>
                        <p>The vagus nerve techniques we teach are evidence-based and used in clinical mental health settings.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 3-4: Vagus Nerve Toolkit</h5>
                <ul>
                    <li>Choose 2-3 practices, do 2x daily:</li>
                    <li>4-7-8 breathing (inhale 4, hold 7, exhale 8)</li>
                    <li>Cold water on face 30 seconds</li>
                    <li>Humming for 2-3 minutes</li>
                    <li>Gargling vigorously 30-60 seconds</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>How Vagus Nerve Activation Works</h6>
                        <p>Your autonomic nervous system has two modes:</p>
                        <p><strong>SYMPATHETIC ("fight or flight"):</strong> Heart races, digestion stops, everything tenses up. This is where your gut goes haywire.</p>
                        <p><strong>PARASYMPATHETIC ("rest and digest"):</strong> Heart slows, digestion activates, muscles relax. This is where healing happens.</p>
                        <p>The vagus nerve is the main pathway to your parasympathetic system. By stimulating it, you can manually shift from stress mode to calm mode.</p>

                        <h6>The Techniques Explained</h6>
                        <p><strong>4-7-8 BREATHING:</strong> The long exhale (8 counts) is key—it activates the parasympathetic response. Inhale for 4, hold for 7, exhale for 8. Do 4 cycles.</p>
                        <p><strong>COLD WATER ON FACE:</strong> Triggers the "dive reflex"—an automatic calming response that slows heart rate and activates the vagus nerve. 30 seconds of cold water on your face, or hold ice cubes.</p>
                        <p><strong>HUMMING/CHANTING:</strong> The vagus nerve runs through your throat. Vibration from humming directly stimulates it. Hum deeply for 2-3 minutes—you might feel tingling in your chest.</p>
                        <p><strong>GARGLING:</strong> Vigorous gargling also stimulates the vagus nerve through your throat. Gargle water for 30-60 seconds, 2x daily.</p>

                        <h6>Finding What Works for You</h6>
                        <p>Try all four techniques, then stick with 2-3 that feel most effective for you. Some people respond better to breath work, others to cold exposure. There's no wrong answer.</p>
                        <p>Do your chosen techniques twice daily—morning and evening—even when you're not stressed. You're building a skill.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-day">
                <h5>Day 5-7: Pre-Meal Ritual + Stress Interception</h5>
                <ul>
                    <li>Before every meal: stop screens → sit → 3 deep breaths → look at food → eat slowly</li>
                    <li>When stress rises: notice → pause 60 sec → 4 rounds 4-7-8 breathing → hand on stomach</li>
                </ul>

                <button class="learn-more-toggle">
                    <span>▼</span>
                    <span class="learn-more-toggle-text">Learn more about why this works</span>
                </button>

                <div class="learn-more-content">
                    <div class="learn-more-content-inner">
                        <h6>Why a Pre-Meal Ritual?</h6>
                        <p>Eating while stressed shuts down your digestion. Your body is in "fight or flight" mode—it's not prioritizing breaking down food.</p>
                        <p>The pre-meal ritual takes 2-3 minutes and shifts your nervous system BEFORE you put food in your body:</p>
                        <ul>
                            <li>Stop all screens (phone, TV, computer)</li>
                            <li>Sit at a table (not standing, not in the car)</li>
                            <li>Take 3 deep breaths (4-7-8 pattern)</li>
                            <li>Look at your food and smell it</li>
                            <li>Begin eating slowly</li>
                        </ul>
                        <p>This simple routine tells your body: "We're safe. It's time to digest."</p>

                        <h6>The Stress Interception Technique</h6>
                        <p>There's a LAG between stress and gut symptoms—usually 30 minutes to 2 hours. If you catch stress early and calm your nervous system, you can prevent the gut symptoms from escalating.</p>
                        <p>When you notice stress rising:</p>
                        <ul>
                            <li><strong>NOTICE</strong> the feeling (name it: "I'm getting stressed")</li>
                            <li><strong>PAUSE</strong> for 60 seconds (don't react to anything)</li>
                            <li><strong>DO</strong> 4 rounds of 4-7-8 breathing</li>
                            <li><strong>PLACE</strong> your hand on your stomach</li>
                            <li><strong>RESUME</strong> what you were doing</li>
                        </ul>
                        <p>The hand on stomach is grounding—it brings your attention to your gut and creates a physical anchor.</p>

                        <h6>Building the Skill</h6>
                        <p>This week you're building a skill that compounds over time. Your gut-brain connection developed over years—it won't fully rewire in 7 days.</p>
                        <p>But if you're starting to SEE the stress-symptom pattern and you've interrupted it even once, you're on the right path. Each successful interception builds your capacity for the next one.</p>
                    </div>
                </div>
            </div>

            <div class="protocol-tips">
                <h5>Key Interventions</h5>
                <p><strong>Stress-symptom tracking:</strong> You can't change what you can't see</p>
                <p><strong>Pre-meal calming:</strong> Eating while stressed shuts down digestion</p>
            </div>

            <div class="what-to-expect">
                <h5>What to Expect by Day 7</h5>
                <ul>
                    <li>The gap between stress and gut symptoms widens</li>
                    <li>Vagus practices become habit, not effort</li>
                    <li>At least 1-2 moments where you "caught" stress before it triggered symptoms</li>
                </ul>
                <p>Your gut-brain connection took years to develop. If you're starting to SEE the pattern and you've interrupted it even once, that's meaningful progress.</p>
            </div>
        </div>
    `
};

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let currentMember = null;
let currentPractitioner = null; // Assigned practitioner info
let isRouting = false; // Prevent double routing from auth events
let authProcessed = false; // Track if we've already handled auth for this page load
let attachedFiles = []; // Files to be uploaded with message
let allMessages = []; // Store all messages for search/filter
let showHighlightedOnly = false; // Filter to show only highlighted messages
let highlightedMessages = new Set(); // Store highlighted message IDs (in localStorage)

// Constants
var MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
var ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
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
        authProcessed = false;
        isRouting = false;
        showView('login-view');
    } catch (err) {
        console.error('Sign out error:', err);
        currentUser = null;
        currentMember = null;
        authProcessed = false;
        isRouting = false;
        showView('login-view');
    }
}

// Email/Password Sign In
async function signInWithEmail(email, password) {
    try {
        showView('loading-view');

        var { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Email sign in error:', error.message);
            showView('login-view');

            // Provide user-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
                showToast('Invalid email or password. Please try again.');
            } else if (error.message.includes('Email not confirmed')) {
                showToast('Please check your email and confirm your account first.');
            } else {
                showToast('Sign in failed: ' + error.message);
            }
            return;
        }

        if (data.session) {
            console.log('Email sign in successful');
            await checkUserStatusAndRoute(data.user, data.session.access_token);
        }
    } catch (err) {
        console.error('Sign in error:', err);
        showView('login-view');
        showToast('Sign in failed. Please try again.');
    }
}

// Forgot Password - Send Reset Email
async function sendPasswordResetEmail(email) {
    try {
        var { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) {
            console.error('Password reset error:', error.message);
            showToast('Failed to send reset email. Please try again.');
            return false;
        }

        return true;
    } catch (err) {
        console.error('Password reset error:', err);
        showToast('Failed to send reset email. Please try again.');
        return false;
    }
}

// Initialize Email Login Form
function initializeEmailLogin() {
    var emailLoginForm = document.getElementById('email-login-form');
    var forgotPasswordLink = document.getElementById('forgot-password-link');
    var forgotPasswordModal = document.getElementById('forgot-password-modal');
    var closeForgotModal = document.getElementById('close-forgot-modal');
    var forgotPasswordForm = document.getElementById('forgot-password-form');
    var forgotFormSection = document.getElementById('forgot-form-section');
    var forgotSuccessSection = document.getElementById('forgot-success-section');

    // Email login form submission
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = document.getElementById('login-email').value.trim();
            var password = document.getElementById('login-password').value;

            if (!email || !password) {
                showToast('Please enter both email and password.');
                return;
            }

            signInWithEmail(email, password);
        });
    }

    // Forgot password link click
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Pre-fill email if already entered
            var loginEmail = document.getElementById('login-email').value.trim();
            if (loginEmail) {
                document.getElementById('forgot-email').value = loginEmail;
            }
            forgotPasswordModal.classList.remove('hidden');
        });
    }

    // Close forgot password modal
    if (closeForgotModal) {
        closeForgotModal.addEventListener('click', function() {
            forgotPasswordModal.classList.add('hidden');
            // Reset modal state
            forgotFormSection.classList.remove('hidden');
            forgotSuccessSection.classList.add('hidden');
            document.getElementById('forgot-email').value = '';
        });
    }

    // Close modal on overlay click
    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', function(e) {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.classList.add('hidden');
                forgotFormSection.classList.remove('hidden');
                forgotSuccessSection.classList.add('hidden');
            }
        });
    }

    // Forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var email = document.getElementById('forgot-email').value.trim();

            if (!email) {
                showToast('Please enter your email address.');
                return;
            }

            var sendBtn = document.getElementById('send-reset-btn');
            var originalText = sendBtn.textContent;
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;

            var success = await sendPasswordResetEmail(email);

            sendBtn.textContent = originalText;
            sendBtn.disabled = false;

            if (success) {
                forgotFormSection.classList.add('hidden');
                forgotSuccessSection.classList.remove('hidden');
            }
        });
    }
}

// ============================================
// USER STATUS ROUTING - THE CORE BUSINESS LOGIC
// ============================================
async function checkUserStatusAndRoute(user, accessToken) {
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
                    'Authorization': `Bearer ${accessToken}`,
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
                authProcessed = false;
                showView('login-view');
                return;
            }
            error = fetchError;
        }

        if (error) {
            console.error('Database error:', error);
            showToast('Error connecting to database. Please try again.');
            authProcessed = false;
            showView('login-view');
            return;
        }

        if (!member) {
            // Email NOT found - show "take quiz first" page
            console.log('User not found in database - needs to take quiz');
            showView('not-found-view');
            return;
        }

        // Check if user selected Practitioners login - redirect to practitioner dashboard
        // This check happens BEFORE quiz check so practitioners can bypass quiz requirement
        const loginType = localStorage.getItem('loginType');
        if (loginType === 'practitioners') {
            console.log('Practitioner login detected, redirecting to practitioner dashboard...');
            localStorage.removeItem('loginType');
            window.location.href = 'practitioner.html';
            return;
        }

        // Check if user has completed the quiz (has a protocol assigned)
        // The trigger creates users on Google sign-in, but without quiz data
        if (!member.protocol) {
            console.log('User exists but has not completed quiz - needs to take quiz');
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

        // IMPORTANT: Block non-payers
        // Users with status='lead' or NULL should NOT have portal access
        // They need to pay first to get 'trial' or 'active' status
        if (!member.status || member.status === 'lead') {
            console.log('User is a lead (non-payer) - redirecting to offer page');
            // Sign them out first
            await supabase.auth.signOut();
            currentUser = null;
            currentMember = null;
            // Redirect to the offer page
            window.location.href = 'https://www.guthealingacademy.com/offer/';
            return;
        }

        // Handle cancelled users - redirect to offer page to resubscribe
        if (member.status === 'cancelled') {
            console.log('User membership is cancelled - redirecting to offer page');
            // Sign them out first
            await supabase.auth.signOut();
            currentUser = null;
            currentMember = null;
            // Redirect to the offer page
            window.location.href = 'https://www.guthealingacademy.com/offer/';
            return;
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
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ last_login_at: new Date().toISOString() })
            }).catch(err => console.warn('Failed to update last login:', err));
        }

        // Step 3: Route based on final status
        console.log('Final status for routing:', updatedStatus);
        switch (updatedStatus) {
            case 'trial':
            case 'active':
                // Paying users - full/limited dashboard access
                initializeDashboard();
                break;
            case 'trial_expired':
                // Trial expired users get limited dashboard access with upgrade prompts
                initializeDashboard();
                break;
            default:
                // Any other status (lead, cancelled, etc.) - redirect to offer page
                // This is a safety fallback - should have been caught earlier
                console.log('Unexpected status:', updatedStatus, '- redirecting to offer page');
                await supabase.auth.signOut();
                currentUser = null;
                currentMember = null;
                window.location.href = 'https://www.guthealingacademy.com/offer/';
        }

    } catch (err) {
        console.error('Error checking user status:', err);
        showToast('Error loading your account. Please try again.');
        // Reset authProcessed so user can retry without refreshing the page
        authProcessed = false;
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

    // Check if user selected Practitioners login - redirect to practitioner dashboard
    const loginType = localStorage.getItem('loginType');
    if (loginType === 'practitioners') {
        console.log('Practitioner login detected, redirecting to practitioner dashboard...');
        // Clear the loginType so they don't get stuck in a redirect loop
        localStorage.removeItem('loginType');
        window.location.href = 'practitioner.html';
        return;
    }

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

    // Show trial expired banner if trial has expired
    if (currentMember?.status === 'trial_expired') {
        const trialExpiredBanner = document.getElementById('trial-expired-banner');
        if (trialExpiredBanner) {
            trialExpiredBanner.classList.remove('hidden');
        }
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

    // Initialize Q&A session (host info and RSVP)
    initializeQASession();

    // Apply access controls based on user status
    applyAccessControls();

    console.log('Dashboard initialized successfully');
}

// ============================================
// UPGRADE LINK CONFIGURATION
// ============================================
// All upgrade buttons now link to: https://www.guthealingacademy.com/upgrade/
// Links are hardcoded in HTML for simplicity

// ============================================
// ACCESS CONTROL SYSTEM
// ============================================
function applyAccessControls() {
    console.log('Applying access controls for status:', currentMember?.status);

    const userStatus = currentMember?.status;

    // Learning Materials controls
    const learningOverlay = document.getElementById('learning-locked-overlay');
    const learningContent = document.getElementById('learning-content');

    // Q&A Session controls
    const qnaJoinSection = document.getElementById('qna-join-section');
    const qnaLockedMessage = document.getElementById('qna-locked-message');
    const qnaQuestionSection = document.getElementById('qa-question-section');
    const qnaQuestionLocked = document.getElementById('qa-question-locked');
    const qnaBenefitsList = document.querySelector('.qna-benefits-list');

    // Message Expert controls
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const messageComposeSection = document.getElementById('message-compose-section');
    const messageComposeLocked = document.getElementById('message-compose-locked');

    if (userStatus === 'active' || userStatus === 'trial') {
        // Active (paid) and Trial users - Full access to everything
        // Trial users now get full access during their trial period

        // Learning Materials: UNLOCKED
        if (learningOverlay) learningOverlay.classList.add('hidden');
        if (learningContent) learningContent.classList.remove('locked');

        // Q&A: Fully accessible + Question submission enabled
        if (qnaJoinSection) qnaJoinSection.classList.remove('hidden');
        if (qnaLockedMessage) qnaLockedMessage.classList.add('hidden');
        if (qnaQuestionSection) qnaQuestionSection.classList.remove('locked');
        if (qnaQuestionLocked) qnaQuestionLocked.classList.add('hidden');

        // Messages: Fully accessible
        if (messageComposeSection) messageComposeSection.classList.remove('locked');
        if (messageComposeLocked) messageComposeLocked.classList.add('hidden');
        if (messageInput) messageInput.disabled = false;
        if (sendMessageBtn) {
            sendMessageBtn.disabled = false;
            sendMessageBtn.classList.remove('btn-disabled');
        }
        if (attachFileBtn) attachFileBtn.disabled = false;

        console.log('Access:', userStatus === 'trial' ? 'Trial' : 'Active', '- Full access to all features');

    } else if (userStatus === 'trial_expired' || !userStatus || userStatus === 'lead') {
        // Trial expired or no status - Restricted access
        // Can see: Today's tracking + Current protocol + Message history
        // Locked: Q&A, Learning Materials, Sending Messages

        // Learning Materials: LOCKED
        if (learningOverlay) learningOverlay.classList.remove('hidden');
        if (learningContent) learningContent.classList.add('locked');

        // Q&A: Show info but lock join button
        if (qnaJoinSection) qnaJoinSection.classList.add('hidden');
        if (qnaLockedMessage) qnaLockedMessage.classList.remove('hidden');
        if (qnaQuestionLocked) qnaQuestionLocked.classList.remove('hidden');

        // Messages: LOCKED - show upgrade overlay
        if (messageComposeLocked) messageComposeLocked.classList.remove('hidden');
        if (messageComposeSection) messageComposeSection.classList.add('locked');
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Upgrade your membership to send messages';
        }
        if (sendMessageBtn) {
            sendMessageBtn.disabled = true;
            sendMessageBtn.classList.add('btn-disabled');
        }
        if (attachFileBtn) {
            attachFileBtn.disabled = true;
        }

        console.log('Access: Trial Expired - Limited access (today\'s tracking + protocol + message history only)');
    }
}

// ============================================
// LIVE Q&A SESSION HOST & RSVP SYSTEM
// ============================================

// Configuration for current Q&A session
var QA_SESSION_CONFIG = {
    date: '2025-01-23',  // Current session date (YYYY-MM-DD format)
    hostId: 'abcaa567-8e12-4038-a300-9fc8c24d785a',  // Rebecca Taylor's user ID
    baseRsvpCount: 7,  // Starting count so early users don't see empty state
    // Default host info (used when database profile is incomplete)
    defaultHost: {
        name: 'Rebecca Taylor',
        credentials: 'RNutr, Registered Clinical Nutritionist',
        bio: 'Rebecca specialises in gut health and digestive wellness, helping clients overcome bloating, IBS, and other digestive issues through evidence-based nutrition strategies.',
        avatar_url: null,  // Will trigger ui-avatars fallback
        specializations: ['bloating', 'ibs_d', 'ibs_c', 'food_sensitivity']
    }
};

// Load Q&A session host information
async function loadQASessionHost() {
    // Get DOM elements
    var hostCard = document.getElementById('qna-host-card');
    var hostAvatar = document.getElementById('qna-host-avatar');
    var hostName = document.getElementById('qna-host-name');
    var hostCredentials = document.getElementById('qna-host-credentials');
    var hostBio = document.getElementById('qna-host-bio');
    var hostSpecializations = document.getElementById('qna-host-specializations');
    var hostSpecializationsList = document.getElementById('qna-host-specializations-list');

    if (!hostCard) return;

    // Start with default values
    var displayHost = { ...QA_SESSION_CONFIG.defaultHost };

    try {
        // Try to fetch host practitioner details from users table
        var { data: host, error } = await supabase
            .from('users')
            .select('id, name, avatar_url, credentials, bio, specializations')
            .eq('id', QA_SESSION_CONFIG.hostId)
            .maybeSingle();

        if (!error && host) {
            // Override defaults with any database values that exist
            if (host.name) displayHost.name = host.name;
            if (host.avatar_url) displayHost.avatar_url = host.avatar_url;
            if (host.credentials) displayHost.credentials = host.credentials;
            if (host.bio) displayHost.bio = host.bio;
            if (host.specializations && host.specializations.length > 0) {
                displayHost.specializations = host.specializations;
            }
        }
    } catch (error) {
        console.log('Error fetching Q&A host, using defaults:', error);
    }

    // Set avatar - use default placeholder if no image
    var avatarUrl = displayHost.avatar_url;
    if (!avatarUrl || avatarUrl.includes('placeholder')) {
        // Use a nice default avatar with initials
        avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayHost.name) + '&background=6B9080&color=fff&size=128&font-size=0.4';
    }
    if (hostAvatar) hostAvatar.src = avatarUrl;

    // Set name
    if (hostName) hostName.textContent = displayHost.name;

    // Set credentials
    if (hostCredentials) {
        hostCredentials.textContent = displayHost.credentials;
        hostCredentials.style.display = 'block';
    }

    // Set bio
    if (hostBio) {
        hostBio.textContent = displayHost.bio;
        hostBio.style.display = 'block';
    }

    // Set specializations
    if (hostSpecializations && hostSpecializationsList && displayHost.specializations.length > 0) {
        hostSpecializations.classList.remove('hidden');
        hostSpecializationsList.innerHTML = displayHost.specializations.map(function(spec) {
            var readableSpec = formatSpecialization(spec);
            return '<span class="specialization-tag">' + readableSpec + '</span>';
        }).join('');
    }

    console.log('Q&A session host loaded:', displayHost.name);
}

// Load RSVP count for current session
async function loadRSVPCount() {
    try {
        var { count, error } = await supabase
            .from('live_qa_rsvps')
            .select('*', { count: 'exact', head: true })
            .eq('session_date', QA_SESSION_CONFIG.date);

        if (error) {
            console.log('Error fetching RSVP count:', error);
            return;
        }

        // Add base count to actual count
        var totalCount = (count || 0) + QA_SESSION_CONFIG.baseRsvpCount;

        var countElement = document.getElementById('qna-rsvp-number');
        if (countElement) {
            countElement.textContent = totalCount;
        }

        console.log('RSVP count loaded:', totalCount);
    } catch (error) {
        console.log('Error loading RSVP count:', error);
    }
}

// Check if current user has already RSVP'd
async function checkUserRSVP() {
    if (!currentMember) return false;

    try {
        var { data, error } = await supabase
            .from('live_qa_rsvps')
            .select('id')
            .eq('session_date', QA_SESSION_CONFIG.date)
            .eq('user_id', currentMember.id)
            .maybeSingle();

        if (error) {
            console.log('Error checking user RSVP:', error);
            return false;
        }

        if (data) {
            // User has already RSVP'd - show confirmed state
            showRSVPConfirmedState();
            return true;
        }

        return false;
    } catch (error) {
        console.log('Error checking user RSVP:', error);
        return false;
    }
}

// Show the confirmed RSVP state
function showRSVPConfirmedState() {
    var rsvpBtn = document.getElementById('qna-rsvp-btn');
    var rsvpBtnConfirmed = document.getElementById('qna-rsvp-btn-confirmed');

    if (rsvpBtn) rsvpBtn.classList.add('hidden');
    if (rsvpBtnConfirmed) rsvpBtnConfirmed.classList.remove('hidden');
}

// Handle RSVP button click
async function handleRSVPClick() {
    if (!currentMember) {
        console.log('User not logged in');
        return;
    }

    var rsvpBtn = document.getElementById('qna-rsvp-btn');
    var countElement = document.getElementById('qna-rsvp-number');

    // Optimistic UI update - immediately show confirmed state
    showRSVPConfirmedState();

    // Increment displayed count immediately
    if (countElement) {
        var currentCount = parseInt(countElement.textContent) || QA_SESSION_CONFIG.baseRsvpCount;
        countElement.textContent = currentCount + 1;
    }

    // Insert RSVP in background
    try {
        var { error } = await supabase
            .from('live_qa_rsvps')
            .insert({
                session_date: QA_SESSION_CONFIG.date,
                user_id: currentMember.id
            });

        if (error) {
            // If error is duplicate key, user already RSVP'd - no visible change needed
            if (error.code === '23505') {
                console.log('User already RSVP\'d (duplicate prevented)');
            } else {
                console.log('Error inserting RSVP:', error);
                // Could revert UI here, but better UX to leave it as confirmed
            }
        } else {
            console.log('RSVP saved successfully');
        }
    } catch (error) {
        console.log('Error saving RSVP:', error);
    }
}

// Initialize Q&A session features
async function initializeQASession() {
    // Load host information
    await loadQASessionHost();

    // Load RSVP count
    await loadRSVPCount();

    // Check if user already RSVP'd
    await checkUserRSVP();

    // Set up RSVP button click handler
    var rsvpBtn = document.getElementById('qna-rsvp-btn');
    if (rsvpBtn) {
        rsvpBtn.addEventListener('click', handleRSVPClick);
    }

    // Initialize question submission system
    initializeQAQuestions();

    console.log('Q&A session initialized');
}

// ============================================
// Q&A QUESTION SUBMISSION SYSTEM
// ============================================

// Initialize question submission form
function initializeQAQuestions() {
    var questionInput = document.getElementById('qa-question-input');
    var charCounter = document.getElementById('qa-char-counter');
    var submitBtn = document.getElementById('qa-submit-btn');

    if (!questionInput || !submitBtn) return;

    // Character counter
    questionInput.addEventListener('input', function() {
        var length = this.value.length;
        charCounter.textContent = length + '/500';

        // Update counter color
        charCounter.classList.remove('warning', 'error');
        if (length >= 450) {
            charCounter.classList.add('error');
        } else if (length >= 400) {
            charCounter.classList.add('warning');
        }

        // Enable/disable submit button
        submitBtn.disabled = length === 0 || length > 500;
    });

    // Submit button click handler
    submitBtn.addEventListener('click', submitQuestion);

    // Load user's existing questions for this session
    loadUserQuestions();
}

// Load user's questions for the current session
async function loadUserQuestions() {
    if (!currentMember) return;

    try {
        var { data: questions, error } = await supabase
            .from('qa_questions')
            .select('*')
            .eq('user_id', currentMember.id)
            .eq('session_date', QA_SESSION_CONFIG.date)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Error loading user questions:', error);
            return;
        }

        renderUserQuestions(questions || []);
    } catch (error) {
        console.log('Error loading user questions:', error);
    }
}

// Render user's submitted questions
function renderUserQuestions(questions) {
    var container = document.getElementById('qa-my-questions');
    var list = document.getElementById('qa-my-questions-list');

    if (!container || !list) return;

    if (questions.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    list.innerHTML = questions.map(function(q) {
        var statusClass = q.status;
        var statusLabel = q.status.charAt(0).toUpperCase() + q.status.slice(1);
        var timeAgo = formatTimeAgo(new Date(q.created_at));

        // Only show delete button for pending questions
        var deleteBtn = q.status === 'pending'
            ? '<button class="btn-delete-question" onclick="deleteQuestion(\'' + q.id + '\')" title="Delete question">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
              '</svg></button>'
            : '';

        return '<div class="qa-question-item">' +
            '<p class="qa-question-text">' + escapeHtml(q.question) + '</p>' +
            '<div class="qa-question-meta">' +
            '<span class="qa-question-status ' + statusClass + '">' + statusLabel + '</span>' +
            '<span>' + timeAgo + '</span>' +
            '</div>' +
            deleteBtn +
            '</div>';
    }).join('');
}

// Submit a new question
async function submitQuestion() {
    var questionInput = document.getElementById('qa-question-input');
    var submitBtn = document.getElementById('qa-submit-btn');

    if (!currentMember || !questionInput) return;

    var questionText = questionInput.value.trim();
    if (!questionText || questionText.length > 500) return;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        var { data, error } = await supabase
            .from('qa_questions')
            .insert({
                user_id: currentMember.id,
                user_email: currentMember.email,
                user_name: currentMember.name,
                protocol_type: currentMember.protocol,
                question: questionText,
                session_date: QA_SESSION_CONFIG.date,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.log('Error submitting question:', error);
            showToast('Failed to submit question. Please try again.', 'error');
            submitBtn.textContent = 'Submit Question';
            submitBtn.disabled = false;
            return;
        }

        // Clear the form
        questionInput.value = '';
        document.getElementById('qa-char-counter').textContent = '0/500';
        submitBtn.textContent = 'Submit Question';

        // Reload questions list
        loadUserQuestions();

        showToast('Question submitted successfully!', 'success');
        console.log('Question submitted:', data.id);

    } catch (error) {
        console.log('Error submitting question:', error);
        showToast('Failed to submit question. Please try again.', 'error');
        submitBtn.textContent = 'Submit Question';
        submitBtn.disabled = false;
    }
}

// Delete a pending question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        var { error } = await supabase
            .from('qa_questions')
            .delete()
            .eq('id', questionId)
            .eq('user_id', currentMember.id)
            .eq('status', 'pending');

        if (error) {
            console.log('Error deleting question:', error);
            showToast('Failed to delete question.', 'error');
            return;
        }

        // Reload questions list
        loadUserQuestions();
        showToast('Question deleted.', 'success');

    } catch (error) {
        console.log('Error deleting question:', error);
        showToast('Failed to delete question.', 'error');
    }
}

// Helper: Format time ago
function formatTimeAgo(date) {
    var seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';

    return date.toLocaleDateString();
}

// Helper: Escape HTML for safe rendering
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// TAB NAVIGATION
// ============================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Remove active from all
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.add('hidden'));

            // Add active to clicked
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');

            // Mark expert messages as read when viewing Messages tab
            if (tabId === 'messages') {
                await markExpertMessagesAsRead();
                // Scroll to bottom of messages
                setTimeout(() => {
                    var messagesList = document.getElementById('messages-list');
                    if (messagesList) {
                        messagesList.scrollTop = messagesList.scrollHeight;
                    }
                }, 100);
            }

            // Load feedback data when viewing Feedback tab
            if (tabId === 'feedback') {
                loadSuggestions();
                loadMySubmissions();
            }
        });
    });

    // Initialize feedback handlers
    initFeedback();
}

async function markExpertMessagesAsRead() {
    if (!currentMember) return;

    // Get unread expert messages
    const unreadExpertMessages = allMessages.filter(msg =>
        msg.sender_type === 'practitioner' && !msg.member_read_at
    );

    if (unreadExpertMessages.length === 0) return;

    // Mark them as read
    const messageIds = unreadExpertMessages.map(msg => msg.id);
    const { error } = await supabase
        .from('messages')
        .update({ member_read_at: new Date().toISOString() })
        .in('id', messageIds);

    if (!error) {
        // Update local messages array
        allMessages.forEach(msg => {
            if (messageIds.includes(msg.id)) {
                msg.member_read_at = new Date().toISOString();
            }
        });

        // Update badge
        updateExpertMessagesBadge();
    }
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

    const userStatus = currentMember.status;
    let dateFilter;

    // Trial expired users only see today's tracking
    if (userStatus === 'trial_expired' || userStatus === 'lead') {
        const today = new Date().toISOString().split('T')[0];
        dateFilter = today;
    } else {
        // Active and trial users see last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter = sevenDaysAgo.toISOString().split('T')[0];
    }

    let query = supabase
        .from('tracking_logs')
        .select('*')
        .eq('user_id', currentMember.id);

    // Apply date filter based on user status
    if (userStatus === 'trial_expired' || userStatus === 'lead') {
        query = query.eq('date', dateFilter);  // Only today
    } else {
        query = query.gte('date', dateFilter);  // Last 7 days
    }

    const { data: entries, error } = await query.order('date', { ascending: false });

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

// Protocol subtitle mapping based on protocol_type
var PROTOCOL_SUBTITLES = {
    1: 'Bloating-Dominant Protocol',
    2: 'Constipation-Dominant Protocol (IBS-C)',
    3: 'Diarrhea-Dominant Protocol (IBS-D)',
    4: 'Mixed Pattern Protocol (IBS-M)',
    5: 'Post-SIBO Recovery Protocol',
    6: 'Gut-Brain Connection Protocol'
};

// Protocol focus text mapping
var PROTOCOL_FOCUS_TEXT = {
    1: 'Focus: Reduce triggers, improve digestion pace, calm bloating patterns',
    2: 'Focus: Hydration, fiber balance, morning routines',
    3: 'Focus: Calm, bind, reduce triggers',
    4: 'Focus: Stabilize patterns, meal timing, symptom balance',
    5: 'Focus: Meal spacing, MMC support, prevent recurrence',
    6: 'Focus: Nervous system regulation, stress-gut connection'
};

function loadProtocolContent(protocol) {
    const content = PROTOCOL_CONTENT[protocol] || '<p>Protocol content coming soon...</p>';
    document.getElementById('protocol-content').innerHTML = content;

    // Update protocol header with personalized language
    var titleEl = document.getElementById('protocol-title');
    var subtitleEl = document.getElementById('protocol-subtitle');
    var focusEl = document.getElementById('protocol-focus');

    if (titleEl) {
        titleEl.textContent = 'Your Personalized Gut Protocol';
    }

    if (subtitleEl) {
        subtitleEl.textContent = PROTOCOL_SUBTITLES[protocol] || 'Your Protocol';
    }

    if (focusEl) {
        focusEl.textContent = PROTOCOL_FOCUS_TEXT[protocol] || '';
    }

    // Initialize accordion functionality
    initializeProtocolAccordions();

    // Show recovery path section with appropriate content
    showRecoveryPathSection();
}

// Initialize accordion expand/collapse functionality
function initializeProtocolAccordions() {
    // Initialize main accordions (Safety Disclaimer, Bristol Chart)
    const accordions = document.querySelectorAll('.protocol-accordion-header');
    accordions.forEach(header => {
        // Remove existing listeners to prevent duplicates
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', function() {
            const accordion = this.parentElement;
            accordion.classList.toggle('active');
        });
    });

    // Initialize "Learn More" toggles
    const learnMoreToggles = document.querySelectorAll('.learn-more-toggle');
    learnMoreToggles.forEach(toggle => {
        // Remove existing listeners to prevent duplicates
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);

        newToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content && content.classList.contains('learn-more-content')) {
                content.classList.toggle('active');
            }
        });
    });
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
    } else if (currentMember?.status === 'trial_expired' || currentMember?.status === 'lead') {
        // Trial expired users: show upgrade card to encourage conversion
        trialCard.classList.remove('hidden');
        paidCard.classList.add('hidden');

        const upgradeBtn = document.getElementById('locked-pathway-upgrade-btn');
        if (upgradeBtn && !upgradeBtn.dataset.listenerAdded) {
            upgradeBtn.addEventListener('click', () => {
                console.log('Recovery path upgrade button clicked (trial expired)');
            });
            upgradeBtn.dataset.listenerAdded = 'true';
        }
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

    // Update expert messages badge
    updateExpertMessagesBadge();

    // Load practitioner info if not already loaded
    if (!currentPractitioner) {
        await loadPractitionerInfo();
    }

    // Render messages
    renderMessages(allMessages);
}

async function loadPractitionerInfo() {
    if (!currentMember) return;

    try {
        // Fetch practitioner assignment (use maybeSingle instead of single to avoid errors)
        const { data: assignment, error: assignmentError } = await supabase
            .from('patient_assignments')
            .select('practitioner_id')
            .eq('patient_id', currentMember.id)
            .eq('status', 'active')
            .maybeSingle();

        if (assignmentError) {
            console.log('Error fetching practitioner assignment:', assignmentError);
            currentPractitioner = null;
            updatePractitionerHeader();
            return;
        }

        if (!assignment) {
            // No practitioner assigned - this is normal for trial users
            currentPractitioner = null;
            updatePractitionerHeader();
            return;
        }

        // Fetch practitioner details including bio and specializations
        const { data: practitioner, error: practitionerError } = await supabase
            .from('users')
            .select('id, name, avatar_url, credentials, bio, specializations')
            .eq('id', assignment.practitioner_id)
            .maybeSingle();

        if (practitionerError) {
            console.log('Error fetching practitioner details:', practitionerError);
            currentPractitioner = null;
            updatePractitionerHeader();
            return;
        }

        currentPractitioner = practitioner;
        updatePractitionerHeader();
    } catch (error) {
        console.log('Error in loadPractitionerInfo:', error);
        currentPractitioner = null;
        updatePractitionerHeader();
    }
}

function updatePractitionerHeader() {
    // Update the expandable practitioner card in Message Expert tab
    const practitionerCard = document.getElementById('practitioner-card');
    const avatar = document.getElementById('practitioner-avatar');
    const name = document.getElementById('practitioner-name');
    const credentials = document.getElementById('practitioner-credentials');
    const bio = document.getElementById('practitioner-bio');
    const specializationsContainer = document.getElementById('practitioner-specializations');
    const specializationsList = document.getElementById('practitioner-specializations-list');
    const title = document.getElementById('message-panel-title');
    const intro = document.getElementById('message-panel-intro');

    if (!practitionerCard) return;

    if (currentPractitioner) {
        // Show the practitioner card
        practitionerCard.classList.remove('hidden');

        // Set avatar with fallback
        const avatarUrl = currentPractitioner.avatar_url || 'https://via.placeholder.com/80?text=' + encodeURIComponent((currentPractitioner.name || 'P').charAt(0));
        if (avatar) avatar.src = avatarUrl;

        // Set name
        if (name) name.textContent = currentPractitioner.name || 'Your Practitioner';

        // Set credentials (hide if none)
        if (credentials) {
            if (currentPractitioner.credentials) {
                credentials.textContent = currentPractitioner.credentials;
                credentials.style.display = 'block';
            } else {
                credentials.style.display = 'none';
            }
        }

        // Set bio with fallback
        if (bio) {
            bio.textContent = currentPractitioner.bio || 'Your dedicated gut health practitioner.';
        }

        // Set specializations
        if (specializationsContainer && specializationsList) {
            const specializations = currentPractitioner.specializations || [];
            if (specializations.length > 0) {
                specializationsContainer.style.display = 'block';
                specializationsList.innerHTML = specializations.map(spec => {
                    // Convert snake_case to readable format
                    const readableSpec = formatSpecialization(spec);
                    return `<span class="specialization-tag">${readableSpec}</span>`;
                }).join('');
            } else {
                specializationsContainer.style.display = 'none';
            }
        }

        // Hide the old panel title and intro
        if (title) title.style.display = 'none';
        if (intro) intro.style.display = 'none';
    } else {
        // No practitioner assigned, hide the card
        practitionerCard.classList.add('hidden');
        if (title) title.style.display = 'block';
        if (intro) intro.style.display = 'block';
    }

    // Also update the Protocol tab practitioner card
    updateProtocolPractitionerCard();
}

function formatSpecialization(spec) {
    // Convert snake_case to readable format
    const specializations = {
        'bloating': 'Bloating-Dominant',
        'ibs_c': 'IBS-C',
        'ibs_d': 'IBS-D',
        'ibs_m': 'IBS-M',
        'post_sibo': 'Post-SIBO Recovery',
        'gut_brain': 'Gut-Brain Connection',
        'food_sensitivity': 'Food Sensitivity',
        'leaky_gut': 'Leaky Gut',
        'dysbiosis': 'Dysbiosis'
    };
    return specializations[spec] || spec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function togglePractitionerCard() {
    const card = document.getElementById('practitioner-card');
    const expandedSection = document.getElementById('practitioner-card-expanded');

    if (!card || !expandedSection) return;

    const isExpanded = card.classList.contains('expanded');

    if (isExpanded) {
        // Collapse
        card.classList.remove('expanded');
        expandedSection.classList.add('hidden');
    } else {
        // Expand
        card.classList.add('expanded');
        expandedSection.classList.remove('hidden');
    }
}

function updateProtocolPractitionerCard() {
    const card = document.getElementById('protocol-practitioner-card');
    const avatar = document.getElementById('protocol-practitioner-avatar');
    const name = document.getElementById('protocol-practitioner-name');
    const credentials = document.getElementById('protocol-practitioner-credentials');
    const introText = document.getElementById('protocol-practitioner-intro');
    const messageBtn = document.getElementById('message-practitioner-btn');
    const messageBtnText = document.getElementById('message-practitioner-btn-text');

    if (!card) return;

    if (currentPractitioner) {
        // Show the card
        card.classList.remove('hidden');

        // Set avatar with fallback
        const avatarUrl = currentPractitioner.avatar_url || 'https://via.placeholder.com/80?text=' + encodeURIComponent((currentPractitioner.name || 'P').charAt(0));
        if (avatar) avatar.src = avatarUrl;

        // Set name
        if (name) name.textContent = currentPractitioner.name || 'Your Practitioner';

        // Set credentials (hide if none)
        if (credentials) {
            if (currentPractitioner.credentials) {
                credentials.textContent = currentPractitioner.credentials;
                credentials.style.display = 'block';
            } else {
                credentials.style.display = 'none';
            }
        }

        // Set intro text - use bio or default message
        if (introText) {
            const defaultIntro = "I've designed this protocol based on your symptoms and goals. Message me anytime if you have questions.";
            introText.textContent = currentPractitioner.bio ? `"${currentPractitioner.bio}"` : `"${defaultIntro}"`;
        }

        // Update button text with practitioner's first name
        if (messageBtnText && currentPractitioner.name) {
            const firstName = currentPractitioner.name.split(' ')[0];
            messageBtnText.textContent = `Message ${firstName}`;
        }
    } else {
        // No practitioner assigned, hide the card
        card.classList.add('hidden');
    }
}

function updateExpertMessagesBadge() {
    const badge = document.getElementById('expert-messages-badge');
    if (!badge) return;

    // Hide badge if no practitioner is assigned (trial users, etc)
    if (!currentPractitioner) {
        badge.textContent = '';
        badge.classList.add('hidden');
        return;
    }

    // Count unread messages from practitioners
    const unreadExpertMessages = allMessages.filter(msg =>
        msg.sender_type === 'practitioner' && !msg.member_read_at
    ).length;

    if (unreadExpertMessages > 0) {
        badge.textContent = unreadExpertMessages;
        badge.classList.remove('hidden');
    } else {
        badge.textContent = '';
        badge.classList.add('hidden');
    }
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

        const senderName = isExpert
            ? (currentPractitioner ? currentPractitioner.name : 'Gut Health Expert')
            : 'You';

        html += `
            <div class="message ${isExpert ? 'message-expert' : 'message-member'} ${isHighlighted ? 'highlighted' : ''}" data-id="${msg.id}">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
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

    // Check if this is an OAuth callback (has code or error in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasOAuthCallback = urlParams.has('code') || urlParams.has('error') ||
                             hashParams.has('access_token') || hashParams.has('error');

    if (hasOAuthCallback) {
        console.log('OAuth callback detected, processing...');

        // If we have a code parameter, explicitly exchange it for a session (PKCE flow)
        const code = urlParams.get('code');
        if (code) {
            console.log('Exchanging OAuth code for session...');
            try {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error('OAuth code exchange failed:', error.message);
                    showToast('Sign in failed. Please try again.');
                    showView('login-view');
                    // Clean up URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return;
                }
                console.log('OAuth code exchange successful');
                // onAuthStateChange will handle the rest
            } catch (err) {
                console.error('OAuth code exchange error:', err);
                showToast('Sign in failed. Please try again.');
                showView('login-view');
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            }
        }

        // Set a timeout fallback in case OAuth processing fails silently
        setTimeout(() => {
            if (!authProcessed && !isRouting) {
                console.log('OAuth callback timeout - showing login');
                showView('login-view');
            }
        }, 10000); // 10 second timeout for OAuth processing
        return;
    }

    try {
        // Add timeout to prevent hanging on slow network
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
        ]).catch(err => {
            console.warn('Session check timed out or failed, showing login:', err.message);
            showView('login-view');
            return { data: { session: null }, error: err };
        });

        if (error) {
            console.error('Session error:', error.message);
            showView('login-view');
            return;
        }

        // If no session exists, show login immediately
        if (!session) {
            console.log('No session found, showing login');
            showView('login-view');
        } else {
            // Session exists - onAuthStateChange should handle routing
            // But add a safety timeout in case it doesn't fire
            setTimeout(function() {
                var loadingView = document.getElementById('loading-view');
                if (loadingView && !loadingView.classList.contains('hidden') && !isRouting) {
                    console.warn('Safety timeout: still on loading view after 8s with valid session, retrying...');
                    authProcessed = false;
                    isRouting = false;
                    // Try to manually trigger routing with the existing session
                    supabase.auth.getSession().then(function(result) {
                        if (result.data.session && !authProcessed) {
                            authProcessed = true;
                            checkUserStatusAndRoute(result.data.session.user, result.data.session.access_token);
                        } else if (!result.data.session) {
                            showView('login-view');
                        }
                    }).catch(function(err) {
                        console.error('Safety timeout session check failed:', err);
                        showView('login-view');
                    });
                }
            }, 8000);
        }
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
        // Allow re-routing if we're stuck on loading view (e.g., after BFCache restore or token refresh)
        var loadingView = document.getElementById('loading-view');
        var isStuckOnLoading = loadingView && !loadingView.classList.contains('hidden');

        // Skip if already processed or currently routing, UNLESS stuck on loading
        if ((authProcessed || isRouting) && !isStuckOnLoading) {
            console.log('Auth already processed or routing in progress, skipping...');
            return;
        }

        // If stuck on loading with a valid session, reset flags and re-process
        if (isStuckOnLoading && authProcessed) {
            console.log('Detected stuck loading state, allowing re-processing for event:', event);
            authProcessed = false;
            isRouting = false;
        }

        if (!authProcessed && !isRouting) {
            authProcessed = true;
            await checkUserStatusAndRoute(session.user, session.access_token);
        }
    }
});

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize badge as hidden on page load
    const badge = document.getElementById('expert-messages-badge');
    if (badge) {
        badge.textContent = '';
        badge.classList.add('hidden');
    }

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

    // Practitioner card toggle (expand/collapse) in Message Expert tab
    const practitionerCardToggle = document.getElementById('practitioner-card-toggle');
    if (practitionerCardToggle) {
        practitionerCardToggle.addEventListener('click', togglePractitionerCard);
    }

    // Message Practitioner button in Protocol tab - navigate to Message Expert tab
    const messagePractitionerBtn = document.getElementById('message-practitioner-btn');
    if (messagePractitionerBtn) {
        messagePractitionerBtn.addEventListener('click', () => {
            // Find and click the Message Expert tab button
            const messagesTabBtn = document.querySelector('[data-tab="messages"]');
            if (messagesTabBtn) {
                messagesTabBtn.click();
            }
        });
    }

    // Initialize Login Page Features
    initLoginPageFeatures();

    // Initialize
    checkSession();
});

// ============================================
// BACK-FORWARD CACHE & TAB RECOVERY
// ============================================

// Handle BFCache restoration (back/forward button navigation)
// When the browser restores a page from BFCache, DOMContentLoaded does NOT fire.
// This causes the dashboard to get stuck on "Loading your dashboard..." because
// authProcessed is still true from the previous session, blocking onAuthStateChange.
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log('Page restored from BFCache, re-initializing session...');
        // Reset auth state flags so onAuthStateChange can process again
        authProcessed = false;
        isRouting = false;
        // Re-check the session from scratch
        checkSession();
    }
});

// Handle tab visibility changes (e.g., switching back to tab after extended period)
// This catches cases where the token may have expired while the tab was hidden
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Only recover if we're stuck on loading view
        var loadingView = document.getElementById('loading-view');
        if (loadingView && !loadingView.classList.contains('hidden')) {
            console.log('Tab became visible while loading view is showing, checking session...');
            // Give a brief moment for any in-progress auth to complete
            setTimeout(function() {
                var stillLoading = !document.getElementById('loading-view').classList.contains('hidden');
                if (stillLoading && !isRouting) {
                    console.log('Still stuck on loading after tab restore, resetting...');
                    authProcessed = false;
                    isRouting = false;
                    checkSession();
                }
            }, 1500);
        }
    }
});

// ============================================
// LOGIN PAGE FEATURES
// ============================================

function initLoginPageFeatures() {
    // Initialize slideshow
    initSlideshow();

    // Initialize toggle switch
    initToggleSwitch();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize email/password login form
    initializeEmailLogin();
}

// Slideshow functionality
function initSlideshow() {
    const slidesContainer = document.querySelector('.slideshow-slides');
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slideshow-dots .dot');

    if (!slidesContainer || slides.length === 0) return;

    let currentIndex = 0;
    let slideInterval;
    let isPaused = false;

    // Fisher-Yates shuffle for random order
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Create shuffled order for slides
    const slideOrder = shuffleArray([...Array(slides.length).keys()]);

    // Start from random position in the shuffled order
    let orderIndex = Math.floor(Math.random() * slideOrder.length);
    currentIndex = slideOrder[orderIndex];

    // Show specific slide
    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Show selected slide
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;

        // Update orderIndex to match
        orderIndex = slideOrder.indexOf(index);
    }

    // Go to next slide in shuffled order
    function nextSlide() {
        orderIndex = (orderIndex + 1) % slideOrder.length;
        showSlide(slideOrder[orderIndex]);
    }

    // Start auto-rotation
    function startAutoRotation() {
        if (slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            if (!isPaused) {
                nextSlide();
            }
        }, 5000); // 5 seconds
    }

    // Initialize first slide
    showSlide(currentIndex);

    // Start auto-rotation
    startAutoRotation();

    // Pause on hover
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', () => {
            isPaused = true;
        });

        slideshowContainer.addEventListener('mouseleave', () => {
            isPaused = false;
        });
    }

    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            // Reset auto-rotation timer when manually navigating
            startAutoRotation();
        });
    });
}

// Toggle switch functionality
function initToggleSwitch() {
    const toggleContainer = document.querySelector('.login-toggle');
    const toggleMembers = document.getElementById('toggle-members');
    const togglePractitioners = document.getElementById('toggle-practitioners');
    const loginDescription = document.getElementById('login-description');

    if (!toggleContainer || !toggleMembers || !togglePractitioners) return;

    // Check URL parameter first (for redirects from homepage)
    // Usage: ?type=members or ?type=practitioners
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');

    // Priority: URL param > localStorage > default ('members')
    let loginType;
    if (urlType === 'members' || urlType === 'practitioners') {
        loginType = urlType;
    } else {
        loginType = localStorage.getItem('loginType') || 'members';
    }

    // Set initial state
    updateToggleState(loginType);

    function updateToggleState(type) {
        loginType = type;
        localStorage.setItem('loginType', type);

        if (type === 'members') {
            toggleMembers.classList.add('active');
            togglePractitioners.classList.remove('active');
            toggleContainer.removeAttribute('data-active');
            if (loginDescription) {
                loginDescription.textContent = 'Sign in to access your personalized gut healing dashboard';
            }
        } else {
            togglePractitioners.classList.add('active');
            toggleMembers.classList.remove('active');
            toggleContainer.setAttribute('data-active', 'practitioners');
            if (loginDescription) {
                loginDescription.textContent = 'Sign in to access your practitioner dashboard';
            }
        }
    }

    toggleMembers.addEventListener('click', () => updateToggleState('members'));
    togglePractitioners.addEventListener('click', () => updateToggleState('practitioners'));
}

// Mobile menu functionality
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('mobile-menu-close');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !closeBtn || !mobileMenu) return;

    function openMenu() {
        mobileMenu.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.add('hidden');
        document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);

    // Close menu when clicking overlay (outside menu content)
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMenu();
        }
    });

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ============================================
// FEEDBACK & FEATURE REQUESTS SYSTEM
// ============================================

// Feedback module state
var feedbackState = {
    currentSort: 'votes',
    currentStatusFilter: '',
    screenshotFile: null,
    suggestions: [],
    mySubmissions: []
};

// Initialize feedback functionality
function initFeedback() {
    // Only run if feedback tab exists
    if (!document.getElementById('tab-feedback')) return;

    // Character counters
    var titleInput = document.getElementById('feedback-title');
    var descInput = document.getElementById('feedback-description');
    var titleCounter = document.getElementById('title-char-count');
    var descCounter = document.getElementById('desc-char-count');

    if (titleInput && titleCounter) {
        titleInput.addEventListener('input', function() {
            titleCounter.textContent = this.value.length;
        });
    }

    if (descInput && descCounter) {
        descInput.addEventListener('input', function() {
            descCounter.textContent = this.value.length;
        });
    }

    // Type dropdown - show/hide public option
    var typeSelect = document.getElementById('feedback-type');
    var publicOption = document.getElementById('public-option');

    if (typeSelect && publicOption) {
        typeSelect.addEventListener('change', function() {
            if (this.value === 'feature') {
                publicOption.classList.remove('hidden');
            } else {
                publicOption.classList.add('hidden');
                document.getElementById('feedback-public').checked = false;
            }
        });
    }

    // Screenshot upload
    var screenshotInput = document.getElementById('feedback-screenshot');
    var uploadBtn = document.getElementById('upload-screenshot-btn');
    var screenshotPreview = document.getElementById('screenshot-preview');
    var screenshotImg = document.getElementById('screenshot-img');
    var removeBtn = document.getElementById('remove-screenshot-btn');

    if (uploadBtn && screenshotInput) {
        uploadBtn.addEventListener('click', function() {
            screenshotInput.click();
        });

        screenshotInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Screenshot must be less than 5MB');
                return;
            }

            // Validate file type
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                showToast('Only PNG and JPG images are allowed');
                return;
            }

            feedbackState.screenshotFile = file;

            // Show preview
            var reader = new FileReader();
            reader.onload = function(e) {
                screenshotImg.src = e.target.result;
                screenshotPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            feedbackState.screenshotFile = null;
            screenshotInput.value = '';
            screenshotPreview.classList.add('hidden');
        });
    }

    // Form submission
    var feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }

    // Sort filter buttons
    var filterBtns = document.querySelectorAll('.suggestions-filters .filter-btn');
    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            feedbackState.currentSort = this.dataset.sort;
            renderSuggestions();
        });
    });

    // Status filter dropdown
    var statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            feedbackState.currentStatusFilter = this.value;
            renderSuggestions();
        });
    }

    // Load initial data
    loadSuggestions();
    loadMySubmissions();
}

// Handle feedback form submission
async function handleFeedbackSubmit(e) {
    e.preventDefault();

    if (!currentMember) {
        showToast('Please sign in to submit feedback');
        return;
    }

    var submitBtn = document.getElementById('submit-feedback-btn');
    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        var type = document.getElementById('feedback-type').value;
        var title = document.getElementById('feedback-title').value.trim();
        var description = document.getElementById('feedback-description').value.trim();
        var isPublic = type === 'feature' && document.getElementById('feedback-public').checked;

        // Upload screenshot if present
        var screenshotUrl = null;
        if (feedbackState.screenshotFile) {
            showToast('Uploading screenshot...');
            screenshotUrl = await uploadFeedbackScreenshot(feedbackState.screenshotFile);
        }

        // Insert feedback
        var { data, error } = await supabase
            .from('feedback')
            .insert({
                user_id: currentMember.id,
                type: type,
                title: title,
                description: description,
                screenshot_url: screenshotUrl,
                is_public: isPublic,
                status: 'submitted'
            })
            .select()
            .single();

        if (error) throw error;

        showToast('Thank you! Your feedback helps us improve.');

        // Clear form
        document.getElementById('feedback-form').reset();
        document.getElementById('title-char-count').textContent = '0';
        document.getElementById('desc-char-count').textContent = '0';
        document.getElementById('public-option').classList.add('hidden');
        document.getElementById('screenshot-preview').classList.add('hidden');
        feedbackState.screenshotFile = null;

        // Reload data
        loadMySubmissions();
        if (isPublic) {
            loadSuggestions();
        }

    } catch (err) {
        console.error('Error submitting feedback:', err);
        showToast('Error submitting feedback. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Upload screenshot to Supabase Storage
async function uploadFeedbackScreenshot(file) {
    var timestamp = Date.now();
    var safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    var filePath = currentMember.id + '/' + timestamp + '_' + safeName;

    var { data, error } = await supabase.storage
        .from('feedback-screenshots')
        .upload(filePath, file);

    if (error) {
        console.error('Screenshot upload error:', error);
        throw error;
    }

    var { data: urlData } = supabase.storage
        .from('feedback-screenshots')
        .getPublicUrl(filePath);

    return urlData.publicUrl;
}

// Load public suggestions
async function loadSuggestions() {
    var listEl = document.getElementById('suggestions-list');
    var emptyEl = document.getElementById('suggestions-empty');

    if (!listEl) return;

    listEl.innerHTML = '<div class="suggestions-loading"><div class="spinner-small"></div><p>Loading suggestions...</p></div>';
    emptyEl.classList.add('hidden');

    try {
        // Fetch public feature requests with vote counts
        var { data: suggestions, error } = await supabase
            .from('feedback')
            .select('*, users!feedback_user_id_fkey(name)')
            .eq('is_public', true)
            .eq('type', 'feature')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch vote counts and user votes
        var { data: votes, error: votesError } = await supabase
            .from('feedback_votes')
            .select('feedback_id, user_id');

        if (votesError) throw votesError;

        // Process suggestions with vote data
        feedbackState.suggestions = suggestions.map(function(s) {
            var feedbackVotes = votes.filter(function(v) { return v.feedback_id === s.id; });
            return {
                ...s,
                vote_count: feedbackVotes.length,
                user_has_voted: currentMember ? feedbackVotes.some(function(v) { return v.user_id === currentMember.id; }) : false,
                user_name: s.users ? s.users.name : 'Member'
            };
        });

        renderSuggestions();

    } catch (err) {
        console.error('Error loading suggestions:', err);
        listEl.innerHTML = '<p class="suggestions-empty">Error loading suggestions. Please refresh.</p>';
    }
}

// Render suggestions based on current filters
function renderSuggestions() {
    var listEl = document.getElementById('suggestions-list');
    var emptyEl = document.getElementById('suggestions-empty');

    if (!listEl) return;

    var filtered = feedbackState.suggestions.slice();

    // Apply status filter
    if (feedbackState.currentStatusFilter) {
        filtered = filtered.filter(function(s) {
            return s.status === feedbackState.currentStatusFilter;
        });
    }

    // Apply sort
    if (feedbackState.currentSort === 'votes') {
        filtered.sort(function(a, b) { return b.vote_count - a.vote_count; });
    } else if (feedbackState.currentSort === 'newest') {
        filtered.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.innerHTML = filtered.map(renderSuggestionCard).join('');

    // Add vote button handlers
    listEl.querySelectorAll('.vote-button').forEach(function(btn) {
        btn.addEventListener('click', function() {
            handleVote(this.dataset.feedbackId);
        });
    });

    // Add read more handlers
    listEl.querySelectorAll('.read-more-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var descEl = this.previousElementSibling;
            descEl.classList.toggle('expanded');
            this.textContent = descEl.classList.contains('expanded') ? 'Show less' : 'Read more';
        });
    });
}

// Render a single suggestion card
function renderSuggestionCard(suggestion) {
    var displayName = suggestion.user_name || 'Member';
    var firstName = displayName.split(' ')[0];
    var dateStr = formatFeedbackDate(suggestion.created_at);
    var statusClass = suggestion.status.replace('_', '-');
    var statusLabel = formatStatusLabel(suggestion.status);
    var isLongDesc = suggestion.description.length > 150;

    return '<div class="suggestion-card">' +
        '<button class="vote-button ' + (suggestion.user_has_voted ? 'voted' : '') + '" data-feedback-id="' + suggestion.id + '">' +
            '<span class="vote-arrow">▲</span>' +
            '<span class="vote-count">' + suggestion.vote_count + '</span>' +
        '</button>' +
        '<div class="suggestion-content">' +
            '<h4 class="suggestion-title">' + escapeHtml(suggestion.title) + '</h4>' +
            '<p class="suggestion-description">' + escapeHtml(suggestion.description) + '</p>' +
            (isLongDesc ? '<button class="read-more-btn">Read more</button>' : '') +
            '<div class="suggestion-meta">' +
                '<span class="status-badge ' + suggestion.status + '">' + statusLabel + '</span>' +
                '<span class="suggestion-author">Submitted by ' + escapeHtml(firstName) + '</span>' +
                '<span class="suggestion-date">' + dateStr + '</span>' +
            '</div>' +
        '</div>' +
    '</div>';
}

// Handle voting
async function handleVote(feedbackId) {
    if (!currentMember) {
        showToast('Please sign in to vote');
        return;
    }

    var suggestion = feedbackState.suggestions.find(function(s) { return s.id === feedbackId; });
    if (!suggestion) return;

    // Optimistic update
    var voteBtn = document.querySelector('.vote-button[data-feedback-id="' + feedbackId + '"]');
    var countEl = voteBtn.querySelector('.vote-count');

    if (suggestion.user_has_voted) {
        // Remove vote
        suggestion.user_has_voted = false;
        suggestion.vote_count--;
        voteBtn.classList.remove('voted');
        countEl.textContent = suggestion.vote_count;

        try {
            var { error } = await supabase
                .from('feedback_votes')
                .delete()
                .eq('feedback_id', feedbackId)
                .eq('user_id', currentMember.id);

            if (error) throw error;
        } catch (err) {
            // Revert on error
            suggestion.user_has_voted = true;
            suggestion.vote_count++;
            voteBtn.classList.add('voted');
            countEl.textContent = suggestion.vote_count;
            showToast('Error removing vote. Please try again.');
        }
    } else {
        // Add vote
        suggestion.user_has_voted = true;
        suggestion.vote_count++;
        voteBtn.classList.add('voted');
        countEl.textContent = suggestion.vote_count;

        try {
            var { error } = await supabase
                .from('feedback_votes')
                .insert({
                    feedback_id: feedbackId,
                    user_id: currentMember.id
                });

            if (error) throw error;
        } catch (err) {
            // Revert on error
            suggestion.user_has_voted = false;
            suggestion.vote_count--;
            voteBtn.classList.remove('voted');
            countEl.textContent = suggestion.vote_count;
            showToast('Error adding vote. Please try again.');
        }
    }
}

// Load user's own submissions
async function loadMySubmissions() {
    var listEl = document.getElementById('my-submissions-list');
    var emptyEl = document.getElementById('my-submissions-empty');

    if (!listEl || !currentMember) return;

    listEl.innerHTML = '<div class="submissions-loading"><div class="spinner-small"></div><p>Loading your submissions...</p></div>';
    emptyEl.classList.add('hidden');

    try {
        var { data: submissions, error } = await supabase
            .from('feedback')
            .select('*')
            .eq('user_id', currentMember.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get vote counts for public feature requests
        var publicIds = submissions.filter(function(s) { return s.is_public; }).map(function(s) { return s.id; });
        var voteCounts = {};

        if (publicIds.length > 0) {
            var { data: votes } = await supabase
                .from('feedback_votes')
                .select('feedback_id')
                .in('feedback_id', publicIds);

            if (votes) {
                votes.forEach(function(v) {
                    voteCounts[v.feedback_id] = (voteCounts[v.feedback_id] || 0) + 1;
                });
            }
        }

        feedbackState.mySubmissions = submissions.map(function(s) {
            return {
                ...s,
                vote_count: voteCounts[s.id] || 0
            };
        });

        renderMySubmissions();

    } catch (err) {
        console.error('Error loading submissions:', err);
        listEl.innerHTML = '<p class="submissions-empty">Error loading submissions. Please refresh.</p>';
    }
}

// Render user's submissions
function renderMySubmissions() {
    var listEl = document.getElementById('my-submissions-list');
    var emptyEl = document.getElementById('my-submissions-empty');

    if (!listEl) return;

    if (feedbackState.mySubmissions.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.innerHTML = feedbackState.mySubmissions.map(renderSubmissionItem).join('');
}

// Render a single submission item
function renderSubmissionItem(submission) {
    var dateStr = formatFeedbackDate(submission.created_at);
    var statusLabel = formatStatusLabel(submission.status);
    var showVotes = submission.is_public && submission.type === 'feature';

    return '<div class="submission-item">' +
        '<div class="submission-info">' +
            '<div class="submission-title">' + escapeHtml(submission.title) + '</div>' +
            '<div class="submission-date">' + dateStr + '</div>' +
        '</div>' +
        '<div class="submission-badges">' +
            '<span class="type-badge ' + submission.type + '">' + submission.type + '</span>' +
            '<span class="status-badge ' + submission.status + '">' + statusLabel + '</span>' +
            (showVotes ? '<span class="submission-votes"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>' + submission.vote_count + ' votes</span>' : '') +
        '</div>' +
    '</div>';
}

// Format date for display
function formatFeedbackDate(dateStr) {
    var date = new Date(dateStr);
    var now = new Date();
    var diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return diffDays + ' days ago';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format status label for display
function formatStatusLabel(status) {
    var labels = {
        'submitted': 'Submitted',
        'under_review': 'Under Review',
        'planned': 'Planned',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'declined': 'Declined'
    };
    return labels[status] || status;
}
