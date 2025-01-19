import { jest } from '@jest/globals';

// Mock chrome API
global.chrome = {
    runtime: {
        onMessage: {
            addListener: jest.fn()
        },
        sendMessage: jest.fn()
    },
    storage: {
        sync: {
            get: jest.fn(),
            set: jest.fn()
        }
    }
};

// Import the SEO Analyzer class
const SEOAnalyzer = require('../../src/content/content').SEOAnalyzer;

describe('SEOAnalyzer', () => {
    let analyzer;
    let mockDocument;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock document
        mockDocument = {
            title: 'Test Page Title',
            head: document.createElement('head'),
            body: document.createElement('body'),
            getElementsByTagName: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn()
        };

        // Initialize analyzer with mock document
        analyzer = new SEOAnalyzer();
    });

    describe('Meta Tags Analysis', () => {
        test('should correctly analyze meta tags', () => {
            // Setup mock meta tags
            const mockMetaTags = [
                { getAttribute: () => 'description', content: 'A test description' },
                { getAttribute: () => 'keywords', content: 'test, jest, seo' },
                { getAttribute: () => 'viewport', content: 'width=device-width, initial-scale=1' }
            ];

            mockDocument.getElementsByTagName.mockReturnValue(mockMetaTags);

            const result = analyzer.analyzeMetaTags();

            expect(result).toEqual({
                valid: 3,
                total: 3,
                missing: [],
                issues: []
            });
        });

        test('should detect missing meta tags', () => {
            mockDocument.getElementsByTagName.mockReturnValue([]);

            const result = analyzer.analyzeMetaTags();

            expect(result.missing).toContain('description');
            expect(result.missing).toContain('viewport');
        });

        test('should identify invalid meta tags', () => {
            const mockMetaTags = [
                { getAttribute: () => 'description', content: '' }, // Empty content
                { getAttribute: () => 'keywords', content: 'test' }
            ];

            mockDocument.getElementsByTagName.mockReturnValue(mockMetaTags);

            const result = analyzer.analyzeMetaTags();

            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].tag).toBe('description');
        });
    });

    describe('Title Analysis', () => {
        test('should analyze title length correctly', () => {
            const shortTitle = 'Too Short';
            const goodTitle = 'This is a Perfect Length Title for SEO Optimization';
            const longTitle = 'This is an Extremely Long Title That Exceeds the Maximum Length Recommendation for Search Engine Optimization Best Practices';

            // Test short title
            mockDocument.title = shortTitle;
            let result = analyzer.analyzeTitle();
            expect(result.issues).toContain('Title is too short (min: 30 characters)');

            // Test good title
            mockDocument.title = goodTitle;
            result = analyzer.analyzeTitle();
            expect(result.issues).toHaveLength(0);

            // Test long title
            mockDocument.title = longTitle;
            result = analyzer.analyzeTitle();
            expect(result.issues).toContain('Title is too long (max: 60 characters)');
        });

        test('should detect missing title', () => {
            mockDocument.title = '';
            const result = analyzer.analyzeTitle();
            expect(result.issues).toContain('Missing title tag');
        });

        test('should check title separator usage', () => {
            mockDocument.title = 'Part 1 | Part 2 | Part 3 | Part 4';
            const result = analyzer.analyzeTitle();
            expect(result.issues).toContain('Too many title separators');
        });
    });

    describe('Link Analysis', () => {
        test('should analyze internal and external links', () => {
            const mockLinks = [
                { href: 'https://example.com/page1', textContent: 'Internal Link 1', rel: '' },
                { href: 'https://external.com', textContent: 'External Link', rel: 'nofollow' },
                { href: 'https://example.com/page2', textContent: 'Internal Link 2', rel: '' }
            ];

            mockDocument.getElementsByTagName.mockReturnValue(mockLinks);
            global.window = { location: { hostname: 'example.com' } };

            const result = analyzer.analyzeLinks();

            expect(result.internal).toHaveLength(2);
            expect(result.external).toHaveLength(1);
            expect(result.broken).toHaveLength(0);
        });

        test('should detect broken links', () => {
            const mockLinks = [
                { href: '', textContent: 'Broken Link 1' },
                { href: 'invalid-url', textContent: 'Broken Link 2' }
            ];

            mockDocument.getElementsByTagName.mockReturnValue(mockLinks);

            const result = analyzer.analyzeLinks();

            expect(result.broken).toHaveLength(2);
            expect(result.broken[0].error).toBe('Missing href attribute');
        });
    });

    describe('Content Analysis', () => {
        test('should calculate readability score', () => {
            const text = 'This is a simple test sentence. It should be easy to read. No complex words here.';
            const score = analyzer.calculateReadabilityScore(text);
            
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(100);
        });

        test('should count syllables correctly', () => {
            const testCases = [
                { text: 'hello', expected: 2 },
                { text: 'beautiful', expected: 3 },
                { text: 'optimization', expected: 5 }
            ];

            testCases.forEach(({ text, expected }) => {
                const result = analyzer.countSyllables(text);
                expect(result).toBe(expected);
            });
        });
    });

    describe('Performance Analysis', () => {
        test('should analyze page performance', () => {
            global.window.performance = {
                timing: {
                    navigationStart: 1000,
                    loadEventEnd: 2000,
                    domContentLoadedEventEnd: 1500
                },
                getEntriesByType: jest.fn().mockReturnValue([
                    { name: 'first-paint', startTime: 100 }
                ])
            };

            const result = analyzer.analyzePerformance();

            expect(result.loadTime).toBe(1000); // 2000 - 1000
            expect(result.domReady).toBe(500); // 1500 - 1000
            expect(result.firstPaint).toBe(100);
        });
    });

    describe('Overall Score Calculation', () => {
        test('should calculate overall SEO score', () => {
            // Mock individual scoring functions
            analyzer.calculateMetaTagsScore = jest.fn().mockReturnValue(90);
            analyzer.calculateContentScore = jest.fn().mockReturnValue(85);
            analyzer.calculateTechnicalScore = jest.fn().mockReturnValue(95);
            analyzer.calculateLinksScore = jest.fn().mockReturnValue(80);
            analyzer.calculatePerformanceScore = jest.fn().mockReturnValue(75);

            const score = analyzer.calculateOverallScore();

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
            expect(typeof score).toBe('number');
        });
    });

    describe('Mobile Friendliness', () => {
        test('should check viewport meta tag', () => {
            mockDocument.querySelector
                .mockReturnValueOnce(null) // No viewport
                .mockReturnValueOnce({ content: 'width=device-width, initial-scale=1' }); // With viewport

            let result = analyzer.analyzeMobileFriendliness();
            expect(result.viewport).toBe(false);

            result = analyzer.analyzeMobileFriendliness();
            expect(result.viewport).toBe(true);
        });

        test('should check tap targets', () => {
            const mockElements = [
                { getBoundingClientRect: () => ({ width: 30, height: 30 }) }, // Too small
                { getBoundingClientRect: () => ({ width: 48, height: 48 }) }  // Good size
            ];

            mockDocument.getElementsByTagName
                .mockReturnValueOnce([...mockElements]) // Links
                .mockReturnValueOnce([]); // Buttons

            const result = analyzer.checkTapTargets();

            expect(result.smallTargets).toBe(1);
            expect(result.total).toBe(2);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing document elements gracefully', () => {
            mockDocument.getElementsByTagName.mockImplementation(() => {
                throw new Error('DOM Exception');
            });

            const result = analyzer.analyzeCurrentPage();

            expect(result).toBeDefined();
            expect(result.error).toBeDefined();
        });

        test('should handle API errors', () => {
            global.window.performance = undefined;
            const result = analyzer.analyzePerformance();

            expect(result.score).toBe(0);
            expect(result.message).toBe('Performance API not available');
        });
    });
});