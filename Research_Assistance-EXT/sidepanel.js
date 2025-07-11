const API_BASE_URL = 'http://localhost:8080/api/auth';
const FILES_API_URL = 'http://localhost:8080/api/files';
const RESEARCH_API_URL = 'http://localhost:8080/api/research';
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('researchUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showMainApp();
    } else {
        resetUI();
    }
    setupEventListeners();
});

function resetUI() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('researchPage').classList.add('hidden');
    document.getElementById('historyPage').classList.add('hidden');
    clearForms();
    hideAlert();
}

function clearForms() {
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

function setupEventListeners() {
    // Auth listeners
    document.getElementById('showRegister').addEventListener('click', showRegisterForm);
    document.getElementById('showLogin').addEventListener('click', showLoginForm);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Main app listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('summarizeCard').addEventListener('click', summarizeText);
    document.getElementById('similarCard').addEventListener('click', findSimilarResearch);
    document.getElementById('researchHereCard').addEventListener('click', showResearchPage);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    
    // Research page listeners
    document.getElementById('backBtn').addEventListener('click', showMainApp);
    document.getElementById('browseBtn').addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllHistory);

    
    // Drag and drop
    const uploadCard = document.getElementById('uploadCard');
    uploadCard.addEventListener('dragover', handleDragOver);
    uploadCard.addEventListener('dragleave', handleDragLeave);
    uploadCard.addEventListener('drop', handleDrop);

    document.getElementById('historyResults').addEventListener('click', (e) => {
        const row = e.target.closest('.history-row');
        if (!row) return;
        
        const id = row.dataset.id;
        const action = e.target.closest('[data-action]')?.dataset.action;
        
        if (action === 'delete') {
            deleteHistoryItem(id);
        } 
        else if (action === 'toggle') {
            toggleHistoryDetails(row);
        }
        else if (action === 'view-result') {
            // Get the actual result from the data attribute
            const result = row.dataset.result;
            const filename = row.querySelector('.history-filename').textContent;
            showFullResult(id, result, filename);
        }
        else if (action === 'download') {
            const result = row.dataset.result;
            const filename = row.querySelector('.history-filename').textContent;
            downloadResult(filename, result);
        }
    });

    // History listeners
    document.getElementById('historyBtn').addEventListener('click', showHistoryPage);
    document.getElementById('backFromHistoryBtn').addEventListener('click', () => {
        document.getElementById('historyPage').classList.remove('show');
        document.getElementById('researchPage').classList.add('show');
    });

    const historySearch = document.getElementById('historySearch');
    if (historySearch) {
        historySearch.addEventListener('input', (e) => {
            loadResearchHistory(e.target.value);
        });
    }
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    hideAlert();
}

function showLoginForm() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    hideAlert();
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        return showAlert('Please fill in all fields', 'error');
    }

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
            showAlert('Welcome back! 🎉', 'success');
            setTimeout(showMainApp, 1000);
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (err) {
        showAlert('Network error. Please try again.', 'error');
    }
    showLoading(false);
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !username || !password) {
        return showAlert('Please fill in all fields', 'error');
    }
    if (password.length < 6) {
        return showAlert('Password must be at least 6 characters', 'error');
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });
        
        const data = await response.json();
        if (data.success) {
            showAlert('Account created successfully! Please sign in. ✅', 'success');
            setTimeout(() => {
                showLoginForm();
                document.getElementById('registerForm').reset();
            }, 1500);
        } else {
            showAlert(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        showAlert('Network error. Please try again.', 'error');
    }
    showLoading(false);
}

function showMainApp() {
    if (!currentUser) return;

    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('researchPage').classList.add('hidden');
    document.getElementById('historyPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    document.getElementById('welcomeMessage').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    
    loadUserNotes();
}

function showResearchPage() {
    if (!currentUser) {
        showResult('Please login to access research features', 'error');
        return;
    }
    
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('historyPage').classList.add('hidden');
    document.getElementById('researchPage').classList.remove('hidden');
    document.getElementById('researchPage').classList.add('show');
    
    // Reset the file input and status
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadStatus').style.display = 'none';
    document.getElementById('uploadCard').classList.remove('dragover');
    
    // Show default message
    document.getElementById('researchResultsContent').innerHTML = `
        <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            Upload a file to see analysis results here
        </div>
    `;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('researchUser');
        currentUser = null;
        resetUI();
    }
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

function loadUserNotes() {
    if (!currentUser) return;
    const key = `researchNotes_${currentUser.id}`;
    chrome.storage.local.get([key], (result) => {
        if (result[key]) {
            document.getElementById('notes').value = result[key];
        }
    });
}

function saveNotes() {
    if (!currentUser) return showResult('❌ Please log in first', 'error');
    const notes = document.getElementById('notes').value;
    const key = `researchNotes_${currentUser.id}`;
    chrome.storage.local.set({ [key]: notes }, () => {
        showResult('✅ Notes saved successfully!', 'success');
    });
}

function showResult(content, type = 'info') {
    const resultsEl = document.getElementById('results');
    const contentEl = document.getElementById('resultsContent');
    
    resultsEl.classList.remove('hidden');
    resultsEl.classList.add('show');
    
    contentEl.innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
        <button class="clear-btn" id="clearResultsBtn">Clear Results</button>
    `;
    
    document.getElementById('clearResultsBtn').addEventListener('click', () => {
        resultsEl.classList.remove('show');
        setTimeout(() => {
            contentEl.innerHTML = '';
            resultsEl.classList.add('hidden');
        }, 300);
    });
}

async function summarizeText() {
    if (!currentUser) return showResult('❌ Please log in first', 'error');
    
    showResult("🕐 Processing your request...", 'info');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) return showResult('⚠️ Please select some text first', 'warning');

        const response = await fetch(`${RESEARCH_API_URL}/process`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': currentUser.id 
            },
            body: JSON.stringify({ 
                content: result, 
                operation: 'summarise' 
            })
        });

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'), 'success');
    } catch (err) {
        showResult(`❌ Error: ${err.message}`, 'error');
    }
}

async function findSimilarResearch() {
    if (!currentUser) return showResult('❌ Please log in first', 'error');
    
    showResult("🔍 Searching for similar research...", 'info');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) return showResult('⚠️ Please select some text first', 'warning');

        const response = await fetch(`${RESEARCH_API_URL}/process`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-User-ID': currentUser.id 
            },
            body: JSON.stringify({ 
                content: result, 
                operation: 'similar' 
            })
        });

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'), 'success');
    } catch (err) {
        showResult(`❌ Error: ${err.message}`, 'error');
    }
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadCard').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadCard').classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadCard').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        handleFileUpload();
    }
}

function handleFileSelect() {
    if (document.getElementById('fileInput').files.length > 0) {
        handleFileUpload();
    }
}

async function handleFileUpload() {
    if (!currentUser) {
        showResearchResult('❌ Please log in first', 'error');
        return;
    }

    const fileInput = document.getElementById('fileInput');
    const operation = document.getElementById('operationSelect').value;
    const statusEl = document.getElementById('uploadStatus');

    if (!fileInput.files.length) {
        showResearchResult('⚠️ Please select a file first', 'warning');
        return;
    }

    const file = fileInput.files[0];
    statusEl.textContent = `🕐 Processing ${file.name}...`;
    statusEl.className = 'status-indicator processing';
    statusEl.style.display = 'block';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('operation', operation);

        const response = await fetch(`${FILES_API_URL}/upload`, {
            method: 'POST',
            headers: {
                'X-User-ID': currentUser.id
            },
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            showResearchResult(
                `✅ <strong>${file.name}</strong> processed successfully:<br><br>${result.result}`,
                'success',
                result.fileId, // pass fileId
                file.name       // pass fileName
            );
            statusEl.textContent = '✔️ Processing complete!';
            statusEl.className = 'status-indicator success';
        } else {
            showResearchResult(`❌ Error: ${result.message}`, 'error');
            statusEl.textContent = '❌ Processing failed';
            statusEl.className = 'status-indicator error';
        }
    } catch (err) {
        showResearchResult('❌ Network error. Please try again.', 'error');
        statusEl.textContent = '❌ Processing failed';
        statusEl.className = 'status-indicator error';
    }
}


function showResearchResult(content, type = 'info', fileId = null, fileName = '') {
    const contentEl = document.getElementById('researchResultsContent');
    const rendered = window.marked ? marked.parse(content) : content;

    contentEl.innerHTML = `
        <div class="result-item">
            <div class="result-content">${rendered}</div>
            <div class="result-actions">
                <button class="action-btn chat-btn" id="chatWithPdfBtn" ${fileId ? '' : 'disabled'}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6-.097 1.016-.417 2.13-.771 2.966-.079.186.074.394.273.362 2.256-.37 3.597-.938 4.18-1.234A9.06 9.06 0 0 0 8 15z"/>
                    </svg>
                    Chat with this PDF
                </button>
                <button class="clear-btn" id="clearResearchResultsBtn">Clear Results</button>
            </div>
        </div>
    `;

    if (fileId) {
        const chatBtn = document.getElementById('chatWithPdfBtn');
        chatBtn.addEventListener('click', () => {
            showPdfChatModal(fileId, fileName);
        });
    }

    document.getElementById('clearResearchResultsBtn').addEventListener('click', () => {
        contentEl.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                Upload a file to see analysis results here
            </div>
        `;
    });
}


// History Page Functions
function showHistoryPage() {
    if (!currentUser) {
        showResult('Please login to view research history', 'error');
        return;
    }

    document.getElementById('researchPage').classList.remove('show');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('historyPage').classList.remove('hidden');
    document.getElementById('historyPage').classList.add('show');
    loadResearchHistory();
}

async function loadResearchHistory(query = '') {
    const historyResults = document.getElementById('historyResults');
    historyResults.innerHTML = '<div class="loading-history">Loading history...</div>';
    
    try {
        const response = await fetch(`${FILES_API_URL}/search-history?${query ? `query=${encodeURIComponent(query)}` : ''}`, {
            headers: { 'X-User-ID': currentUser.id }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.history.length > 0) {
                // In the loadResearchHistory function, update the history row HTML:
                historyResults.innerHTML = data.history.map(item => `
                    <div class="history-row" data-id="${item.id}" data-result="${escapeQuotes(item.analysisResult || '')}">
                        <div class="history-main-row">
                            <div class="history-delete-btn" data-action="delete">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 5.883 16h4.234a2 2 0 0 0 1.992-1.84L12.962 3.5H13.5a.5.5 0 0 0 0-1H11Z"/>
                                </svg>
                            </div>
                            <div class="history-content" data-action="toggle">
                                <div class="history-main-info">
                                    <div class="history-filename" title="${item.fileName}">${item.fileName}</div>
                                    <div class="history-meta">
                                        <span class="history-date">${formatDate(item.createdAt)}</span>
                                        <span class="history-operation">${item.operation.replace('_', ' ')}</span>
                                        ${item.fileSize ? `<span class="history-size">${formatFileSize(item.fileSize)}</span>` : ''}
                                    </div>
                                </div>
                                <div class="history-chevron">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div class="history-details" style="display: none;">
                            <div class="history-actions">
                                <button class="action-btn see-result-btn" data-action="view-result">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                    </svg>
                                    See Result
                                </button>
                                <button class="action-btn download-btn" data-action="download">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                    </svg>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                historyResults.innerHTML = '<div class="history-empty">No research history found</div>';
            }
        } else {
            historyResults.innerHTML = `<div class="alert error">${data.message || 'Error loading history'}</div>`;
        }
    } catch (err) {
        historyResults.innerHTML = `<div class="alert error">Network error: ${err.message}</div>`;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function toggleHistoryDetails(row) {
    const detailsEl = row.querySelector('.history-details');
    const chevron = row.querySelector('.history-chevron svg');
    
    if (detailsEl.style.display === 'none' || !detailsEl.style.display) {
        detailsEl.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    } else {
        detailsEl.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    }
}

function showFullResult(id, result, filename) {
    const decodedResult = result ? result.replace(/&quot;/g, '"') : 'No result available';
    
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Analysis Result - ${filename || 'Untitled'}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="result-tabs">
                    <button class="tab-btn active" data-tab="result">Result</button>
                    <button class="tab-btn" data-tab="chat">Chat with PDF</button>
                </div>
                
                <div class="tab-content active" id="resultTab">
                    <div class="result-text">${decodedResult || 'No result available'}</div>
                </div>
                
                <div class="tab-content" id="chatTab">
                    <div class="chat-container">
                        <div class="chat-messages" id="chatMessages"></div>
                        <div class="chat-input">
                            <input type="text" id="chatQuestion" placeholder="Ask a question about this PDF...">
                            <button id="sendQuestionBtn">Ask</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn primary" id="downloadFromModalBtn">Download</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Tab switching
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}Tab`).classList.add('active');
        });
    });
    
    // Chat functionality
    const chatMessages = modal.querySelector('#chatMessages');
    const chatQuestion = modal.querySelector('#chatQuestion');
    const sendQuestionBtn = modal.querySelector('#sendQuestionBtn');
    
    sendQuestionBtn.addEventListener('click', async () => {
        const question = chatQuestion.value.trim();
        if (!question) return;
        
        // Add user question to chat
        chatMessages.innerHTML += `
            <div class="message user">
                <div class="message-content">${question}</div>
            </div>
        `;
        
        chatQuestion.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show loading indicator
        chatMessages.innerHTML += `
            <div class="message assistant loading">
                <div class="message-content">Thinking...</div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Get answer from backend
        const answer = await chatWithPdf(id, question);
        
        // Remove loading indicator and add answer
        document.querySelector('.message.assistant.loading')?.remove();
        chatMessages.innerHTML += `
            <div class="message assistant">
                <div class="message-content">${answer.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // Allow pressing Enter to send question
    chatQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendQuestionBtn.click();
        }
    });
    
    // Close modal when clicking X or outside
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // Download button functionality
    modal.querySelector('#downloadFromModalBtn').addEventListener('click', () => {
        downloadResult(filename || 'result', decodedResult);
    });
}


function downloadResult(filename, result) {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.split('.')[0]}_analysis.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this history item?')) {
        return;
    }
    
    try {
        const response = await fetch(`${FILES_API_URL}/delete/${id}`, {
            method: 'DELETE',
            headers: { 'X-User-ID': currentUser.id }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.querySelector(`.history-row[data-id="${id}"]`).remove();
            showHistoryAlert('Item deleted successfully', 'success');
            
            // Reload history to reflect changes
            loadResearchHistory(document.getElementById('historySearch').value);
        } else {
            showHistoryAlert(data.message || 'Failed to delete item', 'error');
        }
    } catch (err) {
        showHistoryAlert('Network error. Please try again.', 'error');
    }
}

function showHistoryAlert(message, type) {
    const alertEl = document.createElement('div');
    alertEl.className = `history-alert ${type}`;
    alertEl.textContent = message;
    
    const historyPage = document.getElementById('historyPage');
    historyPage.insertBefore(alertEl, historyPage.firstChild);
    
    setTimeout(() => {
        alertEl.remove();
    }, 3000);
}

function escapeQuotes(str) {
    return str.replace(/`/g, '\\`').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
}

function escapeQuotes(str) {
    return str ? str.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
}
async function clearAllHistory() {
    if (!confirm('Are you sure you want to delete ALL your research history? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${FILES_API_URL}/delete-all`, {
            method: 'DELETE',
            headers: { 'X-User-ID': currentUser.id }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('historyResults').innerHTML = '<div class="history-empty">No research history found</div>';
            showHistoryAlert('All history cleared successfully', 'success');
        } else {
            showHistoryAlert(data.message || 'Failed to clear history', 'error');
        }
    } catch (err) {
        showHistoryAlert('Network error. Please try again.', 'error');
    }
}

async function chatWithPdf(id, question) {
    if (!currentUser) {
        showResearchResult('❌ Please log in first', 'error');
        return;
    }

    if (!question || question.trim() === '') {
        showResearchResult('⚠️ Please enter a question', 'warning');
        return;
    }

    try {
        const response = await fetch(`${FILES_API_URL}/chat/${id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-User-ID': currentUser.id 
            },
            body: `question=${encodeURIComponent(question)}`
        });

        const data = await response.json();
        
        if (data.success) {
            return data.answer;
        } else {
            return `Error: ${data.message}`;
        }
    } catch (err) {
        return `Network error: ${err.message}`;
    }
}

function showPdfChatModal(fileId, fileName) {
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Chat with ${fileName}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages"></div>
                    <div class="chat-input">
                        <input type="text" id="chatQuestion" placeholder="Ask a question about this PDF...">
                        <button id="sendQuestionBtn">Ask</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Chat functionality
    const chatMessages = modal.querySelector('#chatMessages');
    const chatQuestion = modal.querySelector('#chatQuestion');
    const sendQuestionBtn = modal.querySelector('#sendQuestionBtn');
    
    sendQuestionBtn.addEventListener('click', async () => {
        const question = chatQuestion.value.trim();
        if (!question) return;
        
        // Add user question to chat
        chatMessages.innerHTML += `
            <div class="message user">
                <div class="message-content">${question}</div>
            </div>
        `;
        
        chatQuestion.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show loading indicator
        chatMessages.innerHTML += `
            <div class="message assistant loading">
                <div class="message-content">Thinking...</div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Get answer from backend
        const answer = await chatWithPdf(fileId, question);
        
        // Remove loading indicator and add answer
        document.querySelector('.message.assistant.loading')?.remove();
        chatMessages.innerHTML += `
            <div class="message assistant">
                <div class="message-content">${answer.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    
    // Allow pressing Enter to send question
    chatQuestion.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendQuestionBtn.click();
        }
    });
    
    // Close modal when clicking X or outside
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}