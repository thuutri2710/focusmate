import { StorageService } from './storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadRules();
    setupEventListeners();
});

async function loadRules() {
    const rules = await StorageService.getRules();
    const rulesList = document.getElementById('rulesList');
    rulesList.innerHTML = '';

    rules.forEach(rule => {
        const ruleElement = createRuleElement(rule);
        rulesList.appendChild(ruleElement);
    });
}

function createRuleElement(rule) {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-gray-50';
    div.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h3 class="font-medium text-gray-900">${rule.websiteUrl}</h3>
                <p class="text-sm text-gray-500">
                    ${rule.startTime} - ${rule.endTime}
                </p>
                <p class="text-sm text-gray-500">
                    Redirects to: ${rule.redirectUrl}
                </p>
            </div>
            <button class="delete-rule text-red-600 hover:text-red-800" data-id="${rule.id}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    `;

    return div;
}

function setupEventListeners() {
    // Form submission
    document.getElementById('blockForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rule = {
            websiteUrl: document.getElementById('websiteUrl').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            redirectUrl: document.getElementById('redirectUrl').value
        };

        await StorageService.saveRule(rule);
        await loadRules();
        e.target.reset();
    });

    // Delete rule
    document.getElementById('rulesList').addEventListener('click', async (e) => {
        if (e.target.closest('.delete-rule')) {
            const ruleId = e.target.closest('.delete-rule').dataset.id;
            await StorageService.deleteRule(ruleId);
            await loadRules();
        }
    });
}