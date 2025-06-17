const API_BASE_URL = 'http://localhost:8080/api/auth';
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('researchUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
    } else {
        resetUI();
    }
    setupAuthListeners();
});

// Show login page and clear forms
function resetUI() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    hideAlert();
}

// Auth screen toggle and login/register handling
function setupAuthListeners() {
    document.getElementById('showRegister').addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        hideAlert();
    });

    document.getElementById('showLogin').addEventListener('click', () => {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        hideAlert();
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) return showAlert('Please fill in all fields', 'error');

        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('researchUser', JSON.stringify(data.user));
                currentUser = data.user;
                showAlert('Login successful!', 'success');
                setTimeout(showMainApp, 1000);
            } else {
                showAlert(data.message || 'Login failed', 'error');
            }
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        }
        showLoading(false);
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        if (!name || !username || !password)
            return showAlert('Please fill in all fields', 'error');
        if (password.length < 6)
            return showAlert('Password must be at least 6 characters', 'error');

        showLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password })
            });
            const data = await response.json();
            if (data.success) {
                showAlert('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    document.getElementById('registerForm').classList.add('hidden');
                    document.getElementById('loginForm').classList.remove('hidden');
                    document.getElementById('registerForm').reset();
                }, 1500);
            } else {
                showAlert(data.message || 'Registration failed', 'error');
            }
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        }
        showLoading(false);
    });
}

function showMainApp() {
    if (!currentUser) return;

    // Prevent rendering twice
    if (!document.getElementById('mainApp')) {
        renderMainApp();
    }

    document.getElementById('loginScreen')?.remove();
    document.getElementById('welcomeMessage').textContent = `Welcome, ${currentUser.name}!`;
    loadUserNotes();
}

function renderMainApp() {
    const html = `
        <div class="container" id="mainApp">
            <div class="header">
                <h2>Research Assistant</h2>
                <div class="user-info">
                    <span id="welcomeMessage">Welcome!</span>
                    <button id="logoutBtn" class="logout-btn">Logout</button>
                </div>
            </div>
            <div class="actions">
                <button id="summarizeBtn">Summarize</button>
                <button id="similarBtn">Similar Research</button>
            </div>
            <div class="notes">
                <h3>Research Notes</h3>
                <textarea id="notes" placeholder="Take notes here"></textarea>
                <button id="saveNotesBtn">Save Notes</button>
            </div>
            <div id="results"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    setupMainAppListeners();
}

function setupMainAppListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('summarizeBtn')?.addEventListener('click', summarizeText);
    document.getElementById('similarBtn')?.addEventListener('click', findSimilarResearch);
    document.getElementById('saveNotesBtn')?.addEventListener('click', saveNotes);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('researchUser');
        currentUser = null;
        location.reload(); // reload to reset UI
    }
}

function loadUserNotes() {
    if (!currentUser) return;
    const key = `researchNotes_${currentUser.id}`;
    chrome.storage.local.get([key], (result) => {
        if (result[key]) {
            document.getElementById('notes').value = result[key];
        }
    });
}

function showAlert(msg, type) {
    const el = document.getElementById('loginAlert');
    el.textContent = msg;
    el.className = `alert ${type}`;
    el.style.display = 'block';
}
function hideAlert() {
    document.getElementById('loginAlert').style.display = 'none';
}
function showLoading(state) {
    document.getElementById('loginLoading').style.display = state ? 'block' : 'none';
    document.getElementById('loginBtn').disabled = state;
    document.getElementById('registerBtn').disabled = state;
}

function showResult(content) {
    const el = document.getElementById('results');
    el.innerHTML = `
        <div class="result-item"><div class="result-content">${content}</div></div>
        <button id="clearResultsBtn">Clear</button>`;
    document.getElementById('clearResultsBtn').addEventListener('click', () => {
        el.innerHTML = '';
    });
}

async function summarizeText() {
    if (!currentUser) return showResult('❌ Please log in first');
    showResult("🕐 Processing...");
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) return showResult('⚠️ Please select some text first');

        const res = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
            body: JSON.stringify({ content: result, operation: 'summarise' })
        });

        const text = await res.text();
        showResult(text.replace(/\n/g, '<br>'));
    } catch (err) {
        showResult('❌ Error: ' + err.message);
    }
}

function saveNotes() {
    if (!currentUser) return showResult('❌ Please log in first');
    const notes = document.getElementById('notes').value;
    const key = `researchNotes_${currentUser.id}`;
    chrome.storage.local.set({ [key]: notes }, () => {
        showResult('✅ Notes saved');
    });
}

async function findSimilarResearch() {
    if (!currentUser) return showResult('❌ Please log in first');
    showResult("🔎 Searching similar research...");
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) return showResult('⚠️ Please select some text first');

        const res = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-ID': currentUser.id },
            body: JSON.stringify({ content: result, operation: 'similar' })
        });

        const text = await res.text();
        showResult(text.replace(/\n/g, '<br>'));
    } catch (err) {
        showResult('❌ Error: ' + err.message);
    }
}
