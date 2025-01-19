import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { fireEvent } from '@testing-library/dom';

// Mock chrome API
global.chrome = {
    runtime: {
        sendMessage: jest.fn(),
        getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
    },
    tabs: {
        query: jest.fn()
    }
};

// Setup DOM for popup
document.body.innerHTML = `
    <div class="container">
        <header>
            <div class="logo">
                <img src="../../src/icons/icon48.png" alt="SEO Sentinel Logo">
                <h1>SEO Sentinel</h1>
            </div>
            <div class="actions">
                <button id="settingsBtn" class="icon-button">
                    <span class="material-icons">settings</span>
                </button>
            </div>
        </header>

        <nav class="tabs">
            <button class="tab active" data-tab="overview">Overview</button>
            <button class="tab" data-tab="onpage">On-Page SEO</button>
            <button class="tab" data-tab="links">Links</button>
            <button class="tab" data-tab="technical">Technical</button>
        </nav>

        <main>
            <section id="overview" class="tab-content active">
                <div id="seoScore">0</div>
                <div id="metaStatus">Checking...</div>
                <div id="linkStatus">Checking...</div>
                <div id="perfStatus">Checking...</div>
            </section>
            <section id="onpage" class="tab-content">
                <div id="titleAnalysis"></div>
                <div id="metaDescAnalysis"></div>
                <div id="headersAnalysis"></div>
                <div id="contentAnalysis"></div>
            </section>
            <section id="links" class="tab-content">
                <div id="linksList"></div>
            </section>
            <section id="technical" class="tab-content">
                <div id="technicalChecks"></div>
            </section>
        </main>

        <footer>
            <button id="generateReport">Generate Report</button>
            <button id="exportData">Export Data</button>
        </footer>
    </div>
`;

// Import popup functionality
const PopupManager = require('../../src/popup/popup');

describe('Popup Interface', () => {
    let popupManager;
    let mockAnalysisData;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Initialize mock analysis data
        mockAnalysisData = {
            seoScore: 85,
            metaTags: {
                valid: 8,
                total: 10,
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
            }
        };

        // Mock tab query response
        chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }]);

        // Mock message response
        chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            if (message.action === 'analyzePage') {
                return Promise.resolve(mockAnalysisData);
            }
            return Promise.resolve(null);
        });

        // Initialize popup manager
        popupManager = new PopupManager();
    });

    describe('Initialization', () => {
        test('should initialize popup correctly', async () => {
            await popupManager.init();
            
            expect(chrome.tabs.query).toHaveBeenCalledWith({
                active: true,
                currentWindow: true
            });
            
            expect(document.getElementById('seoScore').textContent).toBe('85');
            expect(document.querySelector('.tab.active')).toHaveAttribute('data-tab', 'overview');
        });

        test('should handle initialization errors gracefully', async () => {
            chrome.tabs.query.mockRejectedValueOnce(new Error('Tab query failed'));
            
            await popupManager.init();
            
            expect(document.getElementById('seoScore').textContent).toBe('0');
            expect(document.getElementById('metaStatus').textContent).toBe('Error loading data');
        });
    });

    describe('Tab Navigation', () => {
        test('should switch tabs correctly', () => {
            const tabs = document.querySelectorAll('.tab');
            
            tabs.forEach(tab => {
                fireEvent.click(tab);
                
                const targetId = tab.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                
                expect(tab).toHaveClass('active');
                expect(targetContent).toHaveClass('active');
            });
        });

        test('should load tab content on demand', async () => {
            const onPageTab = document.querySelector('[data-tab="onpage"]');
            fireEvent.click(onPageTab);
            
            expect(document.getElementById('titleAnalysis')).toBeVisible();
            expect(document.getElementById('metaDescAnalysis')).toBeVisible();
        });
    });

    describe('Data Display', () => {
        test('should display SEO score correctly', async () => {
            await popupManager.updateUI(mockAnalysisData);
            
            expect(document.getElementById('seoScore').textContent).toBe('85');
        });

        test('should display meta tags status', async () => {
            await popupManager.updateUI(mockAnalysisData);
            
            expect(document.getElementById('metaStatus').textContent).toBe('8/10');
        });

        test('should display link analysis', async () => {
            mockAnalysisData.links.internal = [{ url: 'test1.html', text: 'Test 1' }];
            mockAnalysisData.links.external = [{ url: 'https://test.com', text: 'Test 2' }];
            
            await popupManager.updateUI(mockAnalysisData);
            
            const linksList = document.getElementById('linksList');
            expect(linksList.innerHTML).toContain('test1.html');
            expect(linksList.innerHTML).toContain('https://test.com');
        });
    });

    describe('Report Generation', () => {
        test('should generate report correctly', async () => {
            const generateBtn = document.getElementById('generateReport');
            fireEvent.click(generateBtn);
            
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'generateReport',
                data: expect.any(Object)
            });
        });

        test('should handle report generation errors', async () => {
            chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Report generation failed'));
            
            const generateBtn = document.getElementById('generateReport');
            fireEvent.click(generateBtn);
            
            // Verify error handling UI updates
            expect(document.querySelector('.error-message')).toBeVisible();
        });
    });

    describe('Data Export', () => {
        test('should export data correctly', async () => {
            const exportBtn = document.getElementById('exportData');
            fireEvent.click(exportBtn);
            
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'exportData',
                data: expect.any(Object)
            });
        });

        test('should handle export errors', async () => {
            chrome.runtime.sendMessage.mockRejectedValueOnce(new Error('Export failed'));
            
            const exportBtn = document.getElementById('exportData');
            fireEvent.click(exportBtn);
            
            // Verify error handling UI updates
            expect(document.querySelector('.error-message')).toBeVisible();
        });
    });

    describe('Settings Navigation', () => {
        test('should open settings page', () => {
            const settingsBtn = document.getElementById('settingsBtn');
            fireEvent.click(settingsBtn);
            
            expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
                action: 'openSettings'
            });
        });
    });

    describe('UI Updates', () => {
        test('should update analysis results in real-time', async () => {
            // Simulate new analysis data
            const newData = {
                ...mockAnalysisData,
                seoScore: 90,
                metaTags: {
                    valid: 10,
                    total: 10,
                    issues: []
                }
            };
            
            await popupManager.updateUI(newData);
            
            expect(document.getElementById('seoScore').textContent).toBe('90');
            expect(document.getElementById('metaStatus').textContent).toBe('10/10');
        });

        test('should highlight issues correctly', async () => {
            mockAnalysisData.onPage.title.issues = ['Title is too short'];
            
            await popupManager.updateUI(mockAnalysisData);
            
            const titleAnalysis = document.getElementById('titleAnalysis');
            expect(titleAnalysis).toHaveClass('has-issues');
            expect(titleAnalysis.innerHTML).toContain('Title is too short');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing data gracefully', async () => {
            await popupManager.updateUI(null);
            
            expect(document.getElementById('seoScore').textContent).toBe('0');
            expect(document.getElementById('metaStatus').textContent).toBe('Error loading data');
        });

        test('should handle partial data updates', async () => {
            const partialData = {
                seoScore: 75
                // Missing other data
            };
            
            await popupManager.updateUI(partialData);
            
            expect(document.getElementById('seoScore').textContent).toBe('75');
            expect(document.getElementById('metaStatus').textContent).toBe('N/A');
        });
    });
});