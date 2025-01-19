import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

// Mock chrome API
global.chrome = {
    runtime: {
        getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
        sendMessage: jest.fn(),
        openOptionsPage: jest.fn()
    },
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn()
        }
    }
};

// Import SettingsManager
const SettingsManager = require('../../src/options/options').SettingsManager;

describe('Settings Manager', () => {
    let settingsManager;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup default storage mock response
        chrome.storage.sync.get.mockResolvedValue({
            settings: {
                general: {
                    theme: 'light',
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
            }
        });

        // Initialize settings manager
        settingsManager = new SettingsManager();
    });

    describe('Initialization', () => {
        test('should load settings correctly on init', async () => {
            await settingsManager.init();
            
            expect(chrome.storage.sync.get).toHaveBeenCalledWith('settings');
            expect(document.getElementById('theme').value).toBe('light');
            expect(document.getElementById('autoAnalyze').checked).toBe(true);
        });

        test('should handle initialization errors', async () => {
            chrome.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
            
            await settingsManager.init();
            
            expect(document.querySelector('.error-message')).toBeVisible();
            // Should fall back to default settings
            expect(settingsManager.currentSettings).toEqual(settingsManager.defaultSettings);
        });
    });

    describe('Settings Navigation', () => {
        test('should switch tabs correctly', async () => {
            await settingsManager.init();
            
            const tabs = document.querySelectorAll('.nav-item');
            tabs.forEach(tab => {
                fireEvent.click(tab);
                
                const tabId = tab.dataset.tab;
                expect(tab).toHaveClass('active');
                expect(document.getElementById(tabId)).toHaveClass('active');
            });
        });
    });

    describe('Form Handling', () => {
        test('should detect form changes', async () => {
            await settingsManager.init();
            
            const themeSelect = document.getElementById('theme');
            fireEvent.change(themeSelect, { target: { value: 'dark' } });
            
            expect(settingsManager.hasChanges).toBe(true);
            expect(document.getElementById('saveSettings').disabled).toBe(false);
        });

        test('should save settings correctly', async () => {
            await settingsManager.init();
            
            // Make some changes
            const themeSelect = document.getElementById('theme');
            fireEvent.change(themeSelect, { target: { value: 'dark' } });
            
            const saveButton = document.getElementById('saveSettings');
            fireEvent.click(saveButton);
            
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({
                settings: expect.objectContaining({
                    general: expect.objectContaining({
                        theme: 'dark'
                    })
                })
            });
        });

        test('should handle save errors', async () => {
            await settingsManager.init();
            
            chrome.storage.sync.set.mockRejectedValueOnce(new Error('Save failed'));
            
            const saveButton = document.getElementById('saveSettings');
            fireEvent.click(saveButton);
            
            expect(document.querySelector('.error-message')).toBeVisible();
        });
    });

    describe('Custom Rules Management', () => {
        test('should add new rule correctly', async () => {
            await settingsManager.init();
            
            const addRuleButton = document.getElementById('addRule');
            fireEvent.click(addRuleButton);
            
            const rulesList = document.getElementById('rulesList');
            expect(rulesList.children.length).toBe(1);
        });

        test('should delete rule correctly', async () => {
            await settingsManager.init();
            
            // Add a rule first
            const addRuleButton = document.getElementById('addRule');
            fireEvent.click(addRuleButton);
            
            // Delete the rule
            const deleteButton = document.querySelector('.delete-rule');
            fireEvent.click(deleteButton);
            
            const rulesList = document.getElementById('rulesList');
            expect(rulesList.children.length).toBe(0);
        });

        test('should edit rule correctly', async () => {
            await settingsManager.init();
            
            // Add a rule
            const addRuleButton = document.getElementById('addRule');
            fireEvent.click(addRuleButton);
            
            // Edit the rule
            const ruleNameInput = document.querySelector('.rule-name');
            fireEvent.change(ruleNameInput, { target: { value: 'Test Rule' } });
            
            expect(settingsManager.hasChanges).toBe(true);
            expect(ruleNameInput.value).toBe('Test Rule');
        });
    });

    describe('Import/Export', () => {
        test('should export settings correctly', async () => {
            await settingsManager.init();
            
            // Mock URL.createObjectURL and URL.revokeObjectURL
            const mockObjectUrl = 'blob:test';
            global.URL.createObjectURL = jest.fn().mockReturnValue(mockObjectUrl);
            global.URL.revokeObjectURL = jest.fn();
            
            const exportButton = document.getElementById('exportSettings');
            fireEvent.click(exportButton);
            
            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });

        test('should import settings correctly', async () => {
            await settingsManager.init();
            
            const importedSettings = {
                settings: {
                    general: {
                        theme: 'dark'
                    }
                },
                version: '1.0.0',
                exportDate: new Date().toISOString()
            };
            
            const file = new File(
                [JSON.stringify(importedSettings)],
                'settings.json',
                { type: 'application/json' }
            );
            
            const input = document.getElementById('importFile');
            Object.defineProperty(input, 'files', {
                value: [file]
            });
            
            fireEvent.change(input);
            
            const importButton = document.getElementById('importSettings');
            fireEvent.click(importButton);
            
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({
                settings: expect.objectContaining({
                    general: expect.objectContaining({
                        theme: 'dark'
                    })
                })
            });
        });

        test('should validate imported settings', async () => {
            await settingsManager.init();
            
            const invalidSettings = {
                invalid: 'data'
            };
            
            const file = new File(
                [JSON.stringify(invalidSettings)],
                'settings.json',
                { type: 'application/json' }
            );
            
            const input = document.getElementById('importFile');
            Object.defineProperty(input, 'files', {
                value: [file]
            });
            
            fireEvent.change(input);
            
            const importButton = document.getElementById('importSettings');
            fireEvent.click(importButton);
            
            expect(document.querySelector('.error-message')).toBeVisible();
        });
    });

    describe('API Key Management', () => {
        test('should toggle API key visibility', async () => {
            await settingsManager.init();
            
            const apiKeyInput = document.getElementById('googleApiKey');
            const toggleButton = apiKeyInput.nextElementSibling;
            
            fireEvent.click(toggleButton);
            expect(apiKeyInput.type).toBe('text');
            
            fireEvent.click(toggleButton);
            expect(apiKeyInput.type).toBe('password');
        });

        test('should save API keys securely', async () => {
            await settingsManager.init();
            
            const apiKeyInput = document.getElementById('googleApiKey');
            fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
            
            const saveButton = document.getElementById('saveSettings');
            fireEvent.click(saveButton);
            
            expect(chrome.storage.sync.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    settings: expect.objectContaining({
                        api: expect.objectContaining({
                            googleApiKey: 'test-api-key'
                        })
                    })
                })
            );
        });
    });

    describe('Reset Functionality', () => {
        test('should reset settings to defaults', async () => {
            await settingsManager.init();
            
            const resetButton = document.getElementById('resetSettings');
            fireEvent.click(resetButton);
            
            // Confirm reset
            const confirmButton = document.getElementById('confirmDialog');
            fireEvent.click(confirmButton);
            
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({
                settings: settingsManager.defaultSettings
            });
        });

        test('should cancel reset when declined', async () => {
            await settingsManager.init();
            
            const resetButton = document.getElementById('resetSettings');
            fireEvent.click(resetButton);
            
            // Cancel reset
            const cancelButton = document.getElementById('cancelDialog');
            fireEvent.click(cancelButton);
            
            expect(chrome.storage.sync.set).not.toHaveBeenCalled();
        });
    });
});