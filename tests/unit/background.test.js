import { jest } from '@jest/globals';

// Mock chrome API
global.chrome = {
    runtime: {
        onInstalled: {
            addListener: jest.fn()
        },
        onMessage: {
            addListener: jest.fn()
        },
        sendMessage: jest.fn()
    },
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn()
        }
    },
    tabs: {
        query: jest.fn(),
        onUpdated: {
            addListener: jest.fn()
        }
    },
    contextMenus: {
        create: jest.fn(),
        removeAll: jest.fn(),
        onClicked: {
            addListener: jest.fn()
        }
    }
};

// Import the background service worker
const {
    analyzePage,
    getCachedAnalysis,
    clearAnalysisCache,
    CONFIG
} = require('../../src/background/background');

describe('Background Service Worker', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Reset cache
        clearAnalysisCache();
    });

    describe('Installation Handler', () => {
        test('should initialize extension on fresh install', async () => {
            // Trigger install event
            const installListener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
            await installListener({ reason: 'install' });

            // Check if default settings were set
            expect(chrome.storage.sync.set).toHaveBeenCalledWith(
                expect.objectContaining({
                    settings: expect.any(Object)
                })
            );

            // Verify context menus were created
            expect(chrome.contextMenus.create).toHaveBeenCalledTimes(2);
        });

        test('should handle update events', async () => {
            // Trigger update event
            const installListener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
            await installListener({ reason: 'update' });

            // Check if data migration was attempted
            expect(chrome.storage.sync.get).toHaveBeenCalledWith('oldData');
            expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
        });
    });

    describe('Page Analysis', () => {
        const mockUrl = 'https://example.com';
        const mockAnalysisResult = {
            url: mockUrl,
            timestamp: Date.now(),
            score: 85
        };

        test('should analyze page and cache results', async () => {
            // Mock API responses
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ data: 'test' })
                })
            );

            const result = await analyzePage(mockUrl);

            expect(result).toBeDefined();
            expect(result.url).toBe(mockUrl);
            
            // Check if result was cached
            const cachedResult = getCachedAnalysis(mockUrl);
            expect(cachedResult).toBeDefined();
        });

        test('should return cached results if available and fresh', async () => {
            // Manually add item to cache
            const cache = new Map();
            cache.set(mockUrl, {
                data: mockAnalysisResult,
                timestamp: Date.now()
            });

            const result = await analyzePage(mockUrl);
            expect(result).toEqual(mockAnalysisResult);
            expect(fetch).not.toHaveBeenCalled();
        });

        test('should ignore expired cache entries', async () => {
            // Add expired cache entry
            const cache = new Map();
            cache.set(mockUrl, {
                data: mockAnalysisResult,
                timestamp: Date.now() - (CONFIG.CACHE_DURATION + 1000)
            });

            const result = await analyzePage(mockUrl);
            expect(result).not.toEqual(mockAnalysisResult);
            expect(fetch).toHaveBeenCalled();
        });
    });

    describe('Cache Management', () => {
        test('should respect maximum cache size', async () => {
            // Fill cache beyond limit
            for (let i = 0; i < CONFIG.MAX_CACHE_ITEMS + 5; i++) {
                await analyzePage(`https://example.com/page${i}`);
            }

            // Check if cache size is maintained
            const cacheSize = Array.from(getCachedAnalysis()).length;
            expect(cacheSize).toBeLessThanOrEqual(CONFIG.MAX_CACHE_ITEMS);
        });

        test('should clear cache on demand', () => {
            // Add some items to cache
            const cache = new Map();
            cache.set('test1', { data: 'data1', timestamp: Date.now() });
            cache.set('test2', { data: 'data2', timestamp: Date.now() });

            clearAnalysisCache();
            expect(Array.from(getCachedAnalysis()).length).toBe(0);
        });
    });

    describe('Message Handling', () => {
        test('should handle analysis requests', async () => {
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
            
            const response = await messageListener({
                action: 'analyzeUrl',
                url: 'https://example.com'
            });

            expect(response).toBeDefined();
            expect(response.url).toBe('https://example.com');
        });

        test('should handle cache retrieval requests', async () => {
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
            
            // First, analyze a page to cache it
            await analyzePage('https://example.com');

            // Then request cached data
            const response = await messageListener({
                action: 'getCachedAnalysis',
                url: 'https://example.com'
            });

            expect(response).toBeDefined();
            expect(response.url).toBe('https://example.com');
        });

        test('should handle settings requests', async () => {
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
            
            chrome.storage.sync.get.mockResolvedValueOnce({
                settings: { testSetting: true }
            });

            const response = await messageListener({
                action: 'getSettings'
            });

            expect(response).toBeDefined();
            expect(response.testSetting).toBe(true);
        });

        test('should handle invalid requests', async () => {
            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
            
            await expect(messageListener({
                action: 'invalidAction'
            })).rejects.toThrow('Unknown action: invalidAction');
        });
    });

    describe('Context Menu Integration', () => {
        test('should handle context menu clicks', () => {
            const menuListener = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
            
            // Test "Analyze Page" menu item
            menuListener({
                menuItemId: 'analyzePage',
                pageUrl: 'https://example.com'
            });

            expect(analyzePage).toHaveBeenCalledWith('https://example.com');

            // Test "Compare Pages" menu item
            menuListener({
                menuItemId: 'comparePages',
                linkUrl: 'https://example.com/page2',
                pageUrl: 'https://example.com/page1'
            });

            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'comparePages'
                })
            );
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

            await expect(analyzePage('https://example.com')).rejects.toThrow('Network error');
        });

        test('should handle API errors', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 429,
                    statusText: 'Too Many Requests'
                })
            );

            await expect(analyzePage('https://example.com')).rejects.toThrow('API request failed');
        });

        test('should handle storage errors', async () => {
            chrome.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));

            const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
            
            await expect(messageListener({
                action: 'updateSettings',
                settings: { test: true }
            })).rejects.toThrow('Storage error');
        });
    });

    describe('Performance Optimization', () => {
        test('should throttle API requests', async () => {
            const startTime = Date.now();
            
            // Make multiple concurrent requests
            await Promise.all([
                analyzePage('https://example.com/1'),
                analyzePage('https://example.com/2'),
                analyzePage('https://example.com/3')
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Verify that requests were throttled
            expect(duration).toBeGreaterThanOrEqual(CONFIG.API_THROTTLE * 2);
        });

        test('should clean up old cache entries', async () => {
            // Add some old cache entries
            const cache = new Map();
            cache.set('old1', {
                data: 'data1',
                timestamp: Date.now() - (CONFIG.CACHE_DURATION * 2)
            });
            cache.set('old2', {
                data: 'data2',
                timestamp: Date.now() - (CONFIG.CACHE_DURATION * 2)
            });

            // Trigger cache cleanup
            await analyzePage('https://example.com');

            // Verify old entries were removed
            expect(getCachedAnalysis('old1')).toBeNull();
            expect(getCachedAnalysis('old2')).toBeNull();
        });
    });
});