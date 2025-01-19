// Settings Manager Class
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            general: {
                theme: 'system',
                fontSize: 'medium',
                autoAnalyze: true,
                contextMenu: true
            },
            analysis: {
                depth: 'standard',
                maxPages: 10,
                components: {
                    metaTags: true,
                    links: true,
                    images: true,
                    performance: true
                }
            },
            rules: [],
            api: {
                googleApiKey: '',
                customApiKey: '',
                customEndpoint: ''
            },
            notifications: {
                enabled: true,
                types: {
                    errors: true,
                    warnings: true,
                    updates: true
                }
            }
        };
        this.currentSettings = {};
        this.hasChanges = false;
    }

    // Initialize settings
    async init() {
        try {
            const stored = await chrome.storage.sync.get('settings');
            this.currentSettings = stored.settings || this.defaultSettings;
            this.applySettings();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize settings:', error);
            this.showError('Failed to load settings. Using defaults.');
            this.currentSettings = this.defaultSettings;
        }
    }

    // Apply settings to UI
    applySettings() {
        // General settings
        this.setSelectValue('theme', this.currentSettings.general.theme);
        this.setSelectValue('fontSize', this.currentSettings.general.fontSize);
        this.setCheckboxValue('autoAnalyze', this.currentSettings.general.autoAnalyze);
        this.setCheckboxValue('contextMenu', this.currentSettings.general.contextMenu);

        // Analysis settings
        this.setSelectValue('analysisDepth', this.currentSettings.analysis.depth);
        this.setInputValue('maxPages', this.currentSettings.analysis.maxPages);
        this.setCheckboxValue('checkMetaTags', this.currentSettings.analysis.components.metaTags);
        this.setCheckboxValue('checkLinks', this.currentSettings.analysis.components.links);
        this.setCheckboxValue('checkImages', this.currentSettings.analysis.components.images);
        this.setCheckboxValue('checkPerformance', this.currentSettings.analysis.components.performance);

        // API settings
        this.setInputValue('googleApiKey', this.currentSettings.api.googleApiKey);
        this.setInputValue('customApiKey', this.currentSettings.api.customApiKey);
        this.setInputValue('customEndpoint', this.currentSettings.api.customEndpoint);

        // Notification settings
        this.setCheckboxValue('enableNotifications', this.currentSettings.notifications.enabled);
        this.setCheckboxValue('notifyErrors', this.currentSettings.notifications.types.errors);
        this.setCheckboxValue('notifyWarnings', this.currentSettings.notifications.types.warnings);
        this.setCheckboxValue('notifyUpdates', this.currentSettings.notifications.types.updates);

        // Custom rules
        this.renderRules();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        // Form change detection
        document.querySelectorAll('input, select').forEach(element => {
            element.addEventListener('change', () => this.handleFormChange());
        });

        // Button actions
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancelChanges').addEventListener('click', () => this.cancelChanges());
        document.getElementById('resetSettings').addEventListener('click', () => this.confirmReset());
        document.getElementById('exportSettings').addEventListener('click', () => this.exportSettings());
        document.getElementById('importSettings').addEventListener('click', () => this.importSettings());
        document.getElementById('addRule').addEventListener('click', () => this.addNewRule());

        // Show/Hide password fields
        document.querySelectorAll('.show-hide-key').forEach(button => {
            button.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // File input change
        document.getElementById('importFile').addEventListener('change', (e) => this.handleFileSelect(e));

        // Dialog actions
        document.getElementById('confirmDialog').addEventListener('click', () => this.handleDialogConfirm());
        document.getElementById('cancelDialog').addEventListener('click', () => this.hideDialog());
    }

    // Tab switching
    switchTab(tabId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.toggle('active', section.id === tabId);
        });
    }

    // Form handling
    handleFormChange() {
        this.hasChanges = true;
        document.getElementById('saveSettings').disabled = false;
        document.getElementById('cancelChanges').disabled = false;
    }

    // Settings actions
    async saveSettings() {
        try {
            const newSettings = this.gatherFormData();
            await chrome.storage.sync.set({ settings: newSettings });
            this.currentSettings = newSettings;
            this.hasChanges = false;
            this.showSuccess('Settings saved successfully');
            
            // Update extension state
            await chrome.runtime.sendMessage({ 
                action: 'settingsUpdated', 
                settings: newSettings 
            });
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showError('Failed to save settings');
        }
    }

    async cancelChanges() {
        if (this.hasChanges) {
            this.showConfirmation(
                'Discard changes?',
                'All unsaved changes will be lost.',
                () => {
                    this.applySettings();
                    this.hasChanges = false;
                }
            );
        }
    }

    async resetSettings() {
        try {
            await chrome.storage.sync.set({ settings: this.defaultSettings });
            this.currentSettings = this.defaultSettings;
            this.applySettings();
            this.showSuccess('Settings reset to defaults');
        } catch (error) {
            console.error('Failed to reset settings:', error);
            this.showError('Failed to reset settings');
        }
    }

    // Custom rules management
    addNewRule() {
        const template = document.getElementById('ruleTemplate');
        const rulesList = document.getElementById('rulesList');
        const newRule = template.content.cloneNode(true);
        
        // Add event listeners to the new rule
        this.setupRuleEventListeners(newRule);
        rulesList.appendChild(newRule);
        this.handleFormChange();
    }

    setupRuleEventListeners(ruleElement) {
        const deleteBtn = ruleElement.querySelector('.delete-rule');
        const editBtn = ruleElement.querySelector('.edit-rule');
        
        deleteBtn.addEventListener('click', (e) => this.deleteRule(e));
        editBtn.addEventListener('click', (e) => this.editRule(e));
    }

    deleteRule(event) {
        const ruleItem = event.target.closest('.rule-item');
        this.showConfirmation(
            'Delete Rule?',
            'This action cannot be undone.',
            () => {
                ruleItem.remove();
                this.handleFormChange();
            }
        );
    }

    editRule(event) {
        const ruleItem = event.target.closest('.rule-item');
        // Enable editing of rule fields
        ruleItem.querySelectorAll('input, select').forEach(input => {
            input.disabled = false;
        });
    }

    // Import/Export
    exportSettings() {
        const settings = {
            settings: this.currentSettings,
            exportDate: new Date().toISOString(),
            version: chrome.runtime.getManifest().version
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seo-sentinel-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importSettings() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showError('Please select a file to import');
            return;
        }

        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            
            if (!this.validateImportedSettings(imported)) {
                throw new Error('Invalid settings file');
            }

            this.showConfirmation(
                'Import Settings?',
                'This will override your current settings.',
                async () => {
                    this.currentSettings = imported.settings;
                    await this.saveSettings();
                    this.applySettings();
                }
            );
        } catch (error) {
            console.error('Failed to import settings:', error);
            this.showError('Failed to import settings. Invalid file format.');
        }
    }

    // Helper methods
    setSelectValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    setCheckboxValue(id, checked) {
        const element = document.getElementById(id);
        if (element) element.checked = checked;
    }

    gatherFormData() {
        return {
            general: {
                theme: document.getElementById('theme').value,
                fontSize: document.getElementById('fontSize').value,
                autoAnalyze: document.getElementById('autoAnalyze').checked,
                contextMenu: document.getElementById('contextMenu').checked
            },
            analysis: {
                depth: document.getElementById('analysisDepth').value,
                maxPages: parseInt(document.getElementById('maxPages').value),
                components: {
                    metaTags: document.getElementById('checkMetaTags').checked,
                    links: document.getElementById('checkLinks').checked,
                    images: document.getElementById('checkImages').checked,
                    performance: document.getElementById('checkPerformance').checked
                }
            },
            rules: this.gatherRulesData(),
            api: {
                googleApiKey: document.getElementById('googleApiKey').value,
                customApiKey: document.getElementById('customApiKey').value,
                customEndpoint: document.getElementById('customEndpoint').value
            },
            notifications: {
                enabled: document.getElementById('enableNotifications').checked,
                types: {
                    errors: document.getElementById('notifyErrors').checked,
                    warnings: document.getElementById('notifyWarnings').checked,
                    updates: document.getElementById('notifyUpdates').checked
                }
            }
        };
    }

    gatherRulesData() {
        const rules = [];
        document.querySelectorAll('.rule-item').forEach(ruleElement => {
            rules.push({
                name: ruleElement.querySelector('.rule-name').value,
                condition: {
                    type: ruleElement.querySelector('.condition-type').value,
                    value: ruleElement.querySelector('.condition-value').value
                },
                action: {
                    type: ruleElement.querySelector('.action-type').value,
                    value: ruleElement.querySelector('.action-value').value
                }
            });
        });
        return rules;
    }

    validateImportedSettings(imported) {
        return imported && 
               imported.settings && 
               imported.version && 
               imported.exportDate;
    }

    // UI feedback
    showSuccess(message) {
        // Implementation of success toast/notification
        console.log('Success:', message);
    }

    showError(message) {
        // Implementation of error toast/notification
        console.error('Error:', message);
    }

    showConfirmation(title, message, onConfirm) {
        const dialog = document.getElementById('confirmationDialog');
        const messageElement = document.getElementById('confirmationMessage');
        
        messageElement.textContent = message;
        dialog.classList.add('active');
        
        this.pendingConfirmation = onConfirm;
    }

    hideDialog() {
        const dialog = document.getElementById('confirmationDialog');
        dialog.classList.remove('active');
        this.pendingConfirmation = null;
    }

    handleDialogConfirm() {
        if (this.pendingConfirmation) {
            this.pendingConfirmation();
            this.hideDialog();
        }
    }

    togglePasswordVisibility(event) {
        const button = event.currentTarget;
        const input = button.previousElementSibling;
        const icon = button.querySelector('.material-icons');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
        }
    }
}

// Initialize settings manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const manager = new SettingsManager();
    manager.init();
});