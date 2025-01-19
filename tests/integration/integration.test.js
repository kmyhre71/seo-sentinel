import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

// Import test utilities
const { testUtils } = global;

// Import main components
const SEOAnalyzer = require('../../src/content/content').SEOAnalyzer;
const PopupManager = require('../../src/popup/popup').PopupManager;
const SettingsManager = require('../../src/options/options').SettingsManager;
const { analyzePage, getCachedAnalysis } = require('../../src/background/background');

describe('SEO Sentinel Integration Tests', () => {
    let analyzer;
    let popupManager;
    let settingsManager;
    let mockTab;

    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock DOM
        testUtils.createMockDom();

        // Setup mock tab
        mockTab = {
            id: 1,
            url: 'https://example.com',
            title: 'Example Domain'
        };

        // Initialize components
        analyzer = new SEOAnalyzer();
        popupManager = new PopupManager();
        settingsManager = new SettingsManager();

        // Setup chrome storage with default settings
        testUtils.mockChromeStorage({
            settings: testUtils.createMockSettings()
        });

        // Mock chrome.tabs.query response
        chrome.tabs.query.mockResolvedValue([mockTab]);

        // Initialize components
        await settingsManager.init();
        await popupManager.init();
    });

    describe('End-to-End Analysis Flow', () => {
        test('should perform complete analysis flow', async () => {
            // Mock page content
            document.body.innerHTML = `
                <html>
                    <head>
                        <title>Test Page</title>
                        <meta name="description" content="Test description">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body>
                        <h1>Main Heading</h1>
                        <p>Test content with some keywords.</p>
                        <a href="https://example.com/internal">Internal Link</a>
                        <a href="https://external.com">External Link</a>
                        <img src="test.jpg" alt="Test Image">
                    </body>
                </html>
            `;

            // Trigger analysis
            const analysisResult = await testUtils.simulateMessage({
                action: 'analyzePage',
                tabId: mockTab.id
            });

            // Verify analysis results
            expect(analysisResult).toBeDefined();
            expect(analysisResult.seoScore).toBeGreaterThan(0);
            expect(analysisResult.metaTags.valid).toBeGreaterThan(0);
            expect(analysisResult.links.internal).toHaveLength(1);
            expect(analysisResult.links.external).toHaveLength(1);

            // Verify popup updates
            await popupManager.updateUI(analysisResult);
            expect(document.getElementById('seoScore').textContent)
                .toBe(analysisResult.seoScore.toString());
        });

        test('should handle analysis with custom rules', async () => {
            // Add custom rule through settings
            const customRule = {
                name: 'Custom Keyword Check',
                condition: {
                    type: 'regex',
                    value: 'important|keyword'
                },
                action: {
                    type: 'warning',
                    value: 'Missing important keywords'
                }
            };

            await settingsManager.saveSettings({
                ...testUtils.createMockSettings(),
                rules: [customRule]
            });

            // Mock page content without keywords
            document.body.innerHTML = `
                <html>
                    <head>
                        <title>Test Page</title>
                    </head>
                    <body>
                        <h1>Main Heading</h1>
                        <p>Test content without target phrases.</p>
                    </body>
                </html>
            `;

            // Trigger analysis
            const analysisResult = await testUtils.simulateMessage({
                action: 'analyzePage',
                tabId: mockTab.id
            });

            // Verify custom rule was applied
            expect(analysisResult.customRules).toBeDefined();
            expect(analysisResult.customRules[0].triggered).toBe(true);
            expect(analysisResult.customRules[0].message)
                .toBe('Missing important keywords');
        });
    });

    describe('Settings Integration', () => {
        test('should apply settings across components', async () => {
            // Update settings
            const newSettings = {
                ...testUtils.createMockSettings(),
                analysis: {
                    depth: 'deep',
                    maxPages: 20,
                    components: {
                        metaTags: true,
                        links: true,
                        images: true,
                        performance: true
                    }
                }
            };

            await settingsManager.saveSettings(newSettings);

            // Trigger analysis
            const analysisResult = await testUtils.simulateMessage({
                action: 'analyzePage',
                tabId: mockTab.id
            });

            // Verify analysis depth was applied
            expect(analysisResult.analysisDepth).toBe('deep');
            expect(analysisResult.performance).toBeDefined();
            expect(analysisResult.images).toBeDefined();
        });

        test('should handle theme changes', async () => {
            // Change theme setting
            await settingsManager.saveSettings({
                ...testUtils.createMockSettings(),
                general: {
                    theme: 'dark',
                    fontSize: 'medium',
                    autoAnalyze: true,
                    contextMenu: true
                }
            });

            // Verify theme application
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
            expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
        });
    });

    describe('Cache Integration', () => {
        test('should properly cache and retrieve analysis results', async () => {
            // Perform initial analysis
            const initialResult = await analyzePage(mockTab.url);

            // Verify result was cached
            const cachedResult = getCachedAnalysis(mockTab.url);
            expect(cachedResult).toBeDefined();
            expect(cachedResult.url).toBe(mockTab.url);
            expect(cachedResult.timestamp).toBeDefined();

            // Verify popup uses cached results
            await popupManager.init();
            expect(document.getElementById('seoScore').textContent)
                .toBe(initialResult.seoScore.toString());
        });

        test('should respect cache settings', async () => {
            // Update cache settings
            await settingsManager.saveSettings({
                ...testUtils.createMockSettings(),
                analysis: {
                    depth: 'standard',
                    maxPages: 10,
                    cacheTimeout: 5 // 5 minutes
                }
            });

            // Perform initial analysis
            const initialResult = await analyzePage(mockTab.url);

            // Fast-forward time by 6 minutes
            jest.advanceTimersByTime(6 * 60 * 1000);

            // Verify cache was invalidated
            const cachedResult = getCachedAnalysis(mockTab.url);
            expect(cachedResult).toBeNull();
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle network errors gracefully', async () => {
            // Mock network failure
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            // Trigger analysis
            const analysisResult = await testUtils.simulateMessage({
                action: 'analyzePage',
                tabId: mockTab.id
            });

            // Verify error handling
            expect(analysisResult.error).toBeDefined();
            expect(analysisResult.partial).toBe(true);

            // Verify popup shows error state
            await popupManager.updateUI(analysisResult);
            expect(document.querySelector('.error-message')).toBeVisible();
        });

        test('should handle invalid settings gracefully', async () => {
            // Attempt to save invalid settings
            const invalidSettings = {
                invalid: 'data'
            };

            // Verify error handling in settings manager
            await expect(settingsManager.saveSettings(invalidSettings))
                .rejects.toThrow();

            // Verify previous settings remain intact
            const currentSettings = await settingsManager.getSettings();
            expect(currentSettings).toEqual(testUtils.createMockSettings());
        });
    });

    describe('Performance Integration', () => {
        test('should handle concurrent analysis requests', async () => {
            // Setup performance monitoring
            const startTime = performance.now();

            // Trigger multiple concurrent analyses
            const results = await Promise.all([
                analyzePage('https://example.com/page1'),
                analyzePage('https://example.com/page2'),
                analyzePage('https://example.com/page3')
            ]);

            const endTime = performance.now();

            // Verify all analyses completed
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.error).toBeUndefined();
            });

            // Verify throttling was applied
            const duration = endTime - startTime;
            expect(duration).toBeGreaterThan(100); // Minimum throttle time
        });

        test('should optimize resource usage', async () => {
            // Mock performance API
            const performanceData = testUtils.mockPerformanceData();

            // Perform analysis
            const analysisResult = await analyzePage(mockTab.url);

            // Verify resource usage
            expect(analysisResult.performance).toBeDefined();
            expect(analysisResult.performance.timing).toBeDefined();
            expect(performanceData.getEntriesByType).toHaveBeenCalled();
        });
    });

    describe('UI Integration', () => {
        test('should update UI components consistently', async () => {
            // Perform analysis
            const analysisResult = await analyzePage(mockTab.url);

            // Update popup UI
            await popupManager.updateUI(analysisResult);

            // Verify all UI components are updated
            expect(document.getElementById('seoScore').textContent)
                .toBe(analysisResult.seoScore.toString());
            expect(document.getElementById('metaStatus').textContent)
                .toBe(`${analysisResult.metaTags.valid}/${analysisResult.metaTags.total}`);
            expect(document.getElementById('linkStatus').textContent)
                .not.toBe('Checking...');
        });

        test('should handle UI state transitions', async () => {
            // Start analysis
            popupManager.showLoading();
            expect(document.querySelector('.loading-indicator')).toBeVisible();

            // Complete analysis
            const analysisResult = await analyzePage(mockTab.url);
            await popupManager.updateUI(analysisResult);
            expect(document.querySelector('.loading-indicator')).not.toBeVisible();

            // Switch tabs
            const linksTab = document.querySelector('[data-tab="links"]');
            fireEvent.click(linksTab);
            expect(document.getElementById('links')).toHaveClass('active');
        });
    });
});