document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['researchNotes'], function(result) {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        } 
    });

    document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
    document.getElementById('similarBtn').addEventListener('click', findSimilarResearch); // New binding
});


async function summarizeText() {
    showResult("🕐 Processing...");
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('⚠️ Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'summarise' })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'));
    } catch (error) {
        showResult('❌ Error: ' + error.message);
    }
}


function saveNotes() {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, function () {
        showResult('✅ Notes saved');
    });
}


// ✅ New Feature: Similar Research
async function findSimilarResearch() {
    showResult("🔎 Searching similar research...");
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('⚠️ Please select some text first');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation: 'similar' }) // <-- Key change
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'));
    } catch (error) {
        showResult('❌ Error: ' + error.message);
    }
}


function showResult(content) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="result-item">
            <div class="result-content">${content}</div>
        </div>
        <button id="clearResultsBtn">Clear</button>
    `;

    document.getElementById('clearResultsBtn').addEventListener('click', () => {
        resultsDiv.innerHTML = '';
    });
}

