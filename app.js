// Gut Healing Academy - Member Portal
// Supabase Authentication

// Initialize Supabase client
const SUPABASE_URL = 'https://mwabljnngygkmahjgvps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13YWJsam5uZ3lna21haGpndnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjQ3MzgsImV4cCI6MjA4MTEwMDczOH0.rbZYj1aXui_xZ0qkg7QONdHppnJghT2r0ycZwtr3a-E';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginSection = document.getElementById('login-section');
const userSection = document.getElementById('user-section');
const loadingSection = document.getElementById('loading-section');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userAvatar = document.getElementById('user-avatar');
const welcomeMessage = document.getElementById('welcome-message');
const userEmail = document.getElementById('user-email');

// Show/Hide Sections
function showLoading() {
    loginSection.classList.add('hidden');
    userSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
}

function showLogin() {
    loadingSection.classList.add('hidden');
    userSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
}

function showUser(user) {
    loadingSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    userSection.classList.remove('hidden');

    // Get user details from metadata
    const metadata = user.user_metadata || {};
    const name = metadata.full_name || metadata.name || 'Member';
    const email = user.email || '';
    const avatar = metadata.avatar_url || metadata.picture || '';

    // Update UI
    welcomeMessage.textContent = `Welcome, ${name}!`;
    userEmail.textContent = email;

    if (avatar) {
        userAvatar.src = avatar;
        userAvatar.style.display = 'block';
    } else {
        // Hide avatar if none available
        userAvatar.style.display = 'none';
    }
}

// Google Sign In
async function signInWithGoogle() {
    try {
        showLoading();

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error('Sign in error:', error.message);
            showLogin();
            alert('Sign in failed. Please try again.');
        }
    } catch (err) {
        console.error('Sign in error:', err);
        showLogin();
        alert('Sign in failed. Please try again.');
    }
}

// Sign Out
async function signOut() {
    try {
        showLoading();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Sign out error:', error.message);
        }

        showLogin();
    } catch (err) {
        console.error('Sign out error:', err);
        showLogin();
    }
}

// Check current session on page load
async function checkSession() {
    showLoading();

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Session error:', error.message);
            showLogin();
            return;
        }

        if (session && session.user) {
            showUser(session.user);
        } else {
            showLogin();
        }
    } catch (err) {
        console.error('Session check error:', err);
        showLogin();
    }
}

// Listen for auth state changes (handles redirect after OAuth)
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN' && session) {
        showUser(session.user);
    } else if (event === 'SIGNED_OUT') {
        showLogin();
    }
});

// Event Listeners
googleLoginBtn.addEventListener('click', signInWithGoogle);
logoutBtn.addEventListener('click', signOut);

// Initialize
checkSession();
