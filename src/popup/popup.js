import { StorageService } from '../services/storage.js';
import { createRuleElement } from './components/ruleElement.js';
import { validateRule } from '../utils/validation.js';

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

function setupEventListeners() {
    document.getElementById('blockForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('rulesList').addEventListener('click', handleRuleDelete);
    
    // Handle blocking mode switching
    const modeInputs = document.querySelectorAll('input[name="blockingMode"]');
    modeInputs.forEach(input => {
        input.addEventListener('change', handleModeChange);
    });
}

function handleModeChange(e) {
    const timeRangeInputs = document.getElementById('timeRangeInputs');
    const dailyLimitInputs = document.getElementById('dailyLimitInputs');
    
    if (e.target.value === 'timeRange') {
        timeRangeInputs.classList.remove('hidden');
        dailyLimitInputs.classList.add('hidden');
        // Clear daily limit input
        document.getElementById('dailyTimeLimit').value = '';
    } else {
        timeRangeInputs.classList.add('hidden');
        dailyLimitInputs.classList.remove('hidden');
        // Clear time range inputs
        document.getElementById('startTime').value = '';
        document.getElementById('endTime').value = '';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const blockingMode = document.querySelector('input[name="blockingMode"]:checked').value;
    
    const rule = {
        websiteUrl: document.getElementById('websiteUrl').value,
        redirectUrl: document.getElementById('redirectUrl').value || 'https://www.google.com'
    };

    // Add relevant time restriction based on mode
    if (blockingMode === 'timeRange') {
        rule.startTime = document.getElementById('startTime').value;
        rule.endTime = document.getElementById('endTime').value;
    } else {
        rule.dailyTimeLimit = document.getElementById('dailyTimeLimit').value;
    }

    const validationError = validateRule(rule);
    if (validationError) {
        alert(validationError);
        return;
    }

    await StorageService.saveRule(rule);
    await loadRules();
    e.target.reset();
    
    // Reset to default time range mode
    document.querySelector('input[value="timeRange"]').checked = true;
    handleModeChange({ target: { value: 'timeRange' } });
}

async function handleRuleDelete(e) {
    if (e.target.closest('.btn-delete')) {
        const ruleId = e.target.closest('.rule-item').dataset.id;
        await StorageService.deleteRule(ruleId);
        await loadRules();
    }
}