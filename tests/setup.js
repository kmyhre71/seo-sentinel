// Jest setup file
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock chrome API
global.chrome = {
    runtime: {
        getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
        sendMessage: jest.fn(),
        onMessage: {
            addListener: jest.fn()
        },
        onInstalled: {
            addListener: jest.fn()
        }
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

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        })
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock fetch API
global.fetch = jest.fn();

// Create test utilities
global.testUtils = {
    // Create mock HTML structure
    createMockDom: () => {
        document.body.innerHTML = `
            <div class="container">
                <header>
                    <div class="logo">
                        <img src="../../assets/icons/icon48.png" alt="SEO Sentinel Logo">
                        <h1>SEO Sentinel</h1>
                    </div>
                    <div class="actions">
                        <button id="settingsBtn" class="icon-button">
                            <span class="material-icons">settings</span>
                        </button>
                    </div>
                </header>
                <main>
                    <div id="content"></div>
                </main>
            </div>
        `;
    },

    // Create mock analysis data
    createMockAnalysisData: (overrides = {}) => ({
        url: 'https://example.com',
        timestamp: Date.now(),
        seoScore: 85,
        metaTags: {
            valid: 8,
            total: 10,
            missing: [],
            issues: []
        },
        links: {
            internal: [],
            external: [],
            broken: []
        },
        onPage: {
            title: {
                text: 'Test Page',
                length: 9,
                issues: []
            },
            description: {
                text: 'Test description',
                length: 15,
                issues: []
            },
            headers: {
                h1Count: 1,
                structure: []
            },
            content: {
                wordCount: 500,
                readabilityScore: 65
            }
        },
        technical: {
            mobile: { status: 'success' },
            speed: { score: 90 },
            ssl: { valid: true },
            robots: { status: 'ok' }
        },
        ...overrides
    }),

    // Create mock settings data
    createMockSettings: (overrides = {}) => ({
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
        },
        ...overrides
    }),

    // Simulate chrome storage
    mockChromeStorage: (initialData = {}) => {
        const storage = { ...initialData };
        chrome.storage.sync.get.mockImplementation((key, callback) => {
            if (typeof key === 'string') {
                return Promise.resolve({ [key]: storage[key] });
            }
            if (Array.isArray(key)) {
                const result = {};
                key.forEach(k => {
                    result[k] = storage[k];
                });
                return Promise.resolve(result);
            }
            return Promise.resolve(storage);
        });

        chrome.storage.sync.set.mockImplementation((data, callback) => {
            Object.assign(storage, data);
            return Promise.resolve();
        });

        return storage;
    },

    // Wait for promises to resolve
    flushPromises: () => new Promise(resolve => setImmediate(resolve)),

    // Simulate tab updates
    simulateTabUpdate: (tabId, changeInfo, tab) => {
        const listeners = chrome.tabs.onUpdated.addListener.mock.calls;
        listeners.forEach(([listener]) => {
            listener(tabId, changeInfo, tab);
        });
    },

    // Simulate messages
    simulateMessage: async (message) => {
        const listeners = chrome.runtime.onMessage.addListener.mock.calls;
        const responses = await Promise.all(
            listeners.map(([listener]) => listener(message))
        );
        return responses[0];
    },

    // Create mock file
    createMockFile: (content, name = 'test.json', type = 'application/json') => {
        return new File([JSON.stringify(content)], name, { type });
    },

    // Simulate file selection
    simulateFileSelection: (input, file) => {
        Object.defineProperty(input, 'files', {
            value: [file],
            writable: true
        });
        fireEvent.change(input);
    },

    // Mock performance data
    mockPerformanceData: () => {
        const performanceData = {
            timing: {
                navigationStart: Date.now() - 1000,
                loadEventEnd: Date.now(),
                domContentLoadedEventEnd: Date.now() - 500
            },
            getEntriesByType: jest.fn().mockReturnValue([
                { name: 'first-paint', startTime: 100 }
            ])
        };

        Object.defineProperty(window, 'performance', {
            value: performanceData,
            writable: true
        });

        return performanceData;
    },

    // Create mock DOM elements for testing
    createMockElements: () => {
        return {
            createMetaTag: (name, content) => {
                const meta = document.createElement('meta');
                meta.setAttribute('name', name);
                meta.setAttribute('content', content);
                return meta;
            },
            createLink: (href, text, rel = '') => {
                const link = document.createElement('a');
                link.href = href;
                link.textContent = text;
                link.rel = rel;
                return link;
            },
            createHeader: (level, text) => {
                const header = document.createElement(`h${level}`);
                header.textContent = text;
                return header;
            }
        };
    }
};

// Global test configuration
beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Reset document body
    document.body.innerHTML = '';
    
    // Reset chrome storage mock
    testUtils.mockChromeStorage();
});

// Global error handler
window.onerror = (msg, url, line, col, error) => {
    console.error('Error in test:', { msg, url, line, col, error });
};

// Console error wrapper
const originalError = console.error;
console.error = (...args) => {
    originalError(...args);
    throw new Error('Console error in test');
};