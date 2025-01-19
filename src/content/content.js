// Main content script for SEO Sentinel
class SEOAnalyzer {
    constructor() {
        this.cache = new Map();
        this.initializeMessageListener();
    }

    // Initialize message listener for communication with popup and background
    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzePage') {
                const analysis = this.analyzeCurrentPage();
                sendResponse(analysis);
            }
            return true; // Will respond asynchronously
        });
    }

    // Main analysis function
    analyzeCurrentPage() {
        return {
            url: window.location.href,
            timestamp: Date.now(),
            seoScore: this.calculateOverallScore(),
            metaTags: this.analyzeMetaTags(),
            links: this.analyzeLinks(),
            performance: this.analyzePerformance(),
            onPage: {
                title: this.analyzeTitle(),
                description: this.analyzeDescription(),
                headers: this.analyzeHeaders(),
                content: this.analyzeContent()
            },
            technical: {
                mobile: this.analyzeMobileFriendliness(),
                speed: this.analyzePageSpeed(),
                ssl: this.analyzeSSL(),
                robots: this.analyzeRobots()
            }
        };
    }

    // Meta Tags Analysis
    analyzeMetaTags() {
        const metaTags = document.getElementsByTagName('meta');
        const analysis = {
            valid: 0,
            total: metaTags.length,
            missing: [],
            issues: []
        };

        // Check for essential meta tags
        const essentialTags = ['description', 'viewport', 'robots'];
        const foundTags = new Set();

        Array.from(metaTags).forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');

            if (name && content) {
                foundTags.add(name.toLowerCase());
                if (this.isValidMetaTag(name, content)) {
                    analysis.valid++;
                } else {
                    analysis.issues.push({
                        tag: name,
                        content: content,
                        issue: 'Invalid content'
                    });
                }
            }
        });

        // Check for missing essential tags
        essentialTags.forEach(tag => {
            if (!foundTags.has(tag)) {
                analysis.missing.push(tag);
            }
        });

        return analysis;
    }

    // Link Analysis
    analyzeLinks() {
        const links = document.getElementsByTagName('a');
        const analysis = {
            total: links.length,
            internal: [],
            external: [],
            broken: []
        };

        Array.from(links).forEach(link => {
            const href = link.href;
            const text = link.textContent.trim();
            
            if (!href) {
                analysis.broken.push({
                    text: text,
                    error: 'Missing href attribute'
                });
                return;
            }

            try {
                const url = new URL(href);
                if (url.hostname === window.location.hostname) {
                    analysis.internal.push({
                        url: href,
                        text: text,
                        nofollow: link.rel.includes('nofollow')
                    });
                } else {
                    analysis.external.push({
                        url: href,
                        text: text,
                        nofollow: link.rel.includes('nofollow')
                    });
                }
            } catch (e) {
                analysis.broken.push({
                    url: href,
                    text: text,
                    error: 'Invalid URL'
                });
            }
        });

        return analysis;
    }

    // Title Analysis
    analyzeTitle() {
        const title = document.title;
        const titleTag = document.querySelector('title');
        
        return {
            text: title,
            length: title.length,
            exists: !!titleTag,
            issues: this.analyzeTitleIssues(title)
        };
    }

    analyzeTitleIssues(title) {
        const issues = [];
        
        if (title.length < 30) {
            issues.push('Title is too short (min: 30 characters)');
        } else if (title.length > 60) {
            issues.push('Title is too long (max: 60 characters)');
        }

        if (title.includes('|') && title.split('|').length > 2) {
            issues.push('Too many title separators');
        }

        return issues;
    }

    // Description Analysis
    analyzeDescription() {
        const metaDesc = document.querySelector('meta[name="description"]');
        const description = metaDesc ? metaDesc.getAttribute('content') : '';

        return {
            text: description,
            length: description.length,
            exists: !!metaDesc,
            issues: this.analyzeDescriptionIssues(description)
        };
    }

    analyzeDescriptionIssues(description) {
        const issues = [];

        if (!description) {
            issues.push('Missing meta description');
        } else {
            if (description.length < 120) {
                issues.push('Description is too short (min: 120 characters)');
            } else if (description.length > 155) {
                issues.push('Description is too long (max: 155 characters)');
            }
        }

        return issues;
    }

    // Headers Analysis
    analyzeHeaders() {
        const headers = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach(heading => {
            headers.push({
                level: parseInt(heading.tagName[1]),
                text: heading.textContent.trim(),
                length: heading.textContent.trim().length
            });
        });

        return {
            headers: headers,
            issues: this.analyzeHeaderIssues(headers)
        };
    }

    analyzeHeaderIssues(headers) {
        const issues = [];
        const h1Count = headers.filter(h => h.level === 1).length;

        if (h1Count === 0) {
            issues.push('Missing H1 tag');
        } else if (h1Count > 1) {
            issues.push('Multiple H1 tags found');
        }

        // Check header hierarchy
        let prevLevel = 0;
        headers.forEach(header => {
            if (header.level - prevLevel > 1) {
                issues.push(`Skipped heading level: H${prevLevel} to H${header.level}`);
            }
            prevLevel = header.level;
        });

        return issues;
    }

    // Content Analysis
    analyzeContent() {
        const mainContent = this.getMainContent();
        const text = mainContent.textContent.trim();
        const words = text.split(/\s+/);

        return {
            wordCount: words.length,
            keywordDensity: this.calculateKeywordDensity(text),
            readabilityScore: this.calculateReadabilityScore(text),
            paragraphs: this.analyzeParagraphs(mainContent),
            images: this.analyzeContentImages(mainContent)
        };
    }

    getMainContent() {
        // Try to find main content area using common selectors
        const selectors = [
            'main',
            'article',
            '#content',
            '.content',
            '.post-content',
            '.entry-content'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        // Fallback to body if no main content area found
        return document.body;
    }

    calculateKeywordDensity(text) {
        // Implementation of keyword density calculation
        // This would need to be expanded based on target keywords
        return 0;
    }

    calculateReadabilityScore(text) {
        // Basic Flesch-Kincaid readability score implementation
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        const syllables = this.countSyllables(text);

        const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
        return Math.round(score * 10) / 10;
    }

    countSyllables(text) {
        // Basic syllable counting implementation
        return text.split(/[aeiou]+/i).length - 1;
    }

    analyzeParagraphs(element) {
        const paragraphs = element.getElementsByTagName('p');
        return Array.from(paragraphs).map(p => ({
            text: p.textContent.trim(),
            length: p.textContent.trim().length,
            wordsCount: p.textContent.trim().split(/\s+/).length
        }));
    }

    analyzeContentImages(element) {
        const images = element.getElementsByTagName('img');
        return Array.from(images).map(img => ({
            src: img.src,
            alt: img.alt,
            hasAlt: !!img.alt,
            dimensions: {
                width: img.width,
                height: img.height
            }
        }));
    }

    // Technical Analysis
    analyzeMobileFriendliness() {
        return {
            viewport: !!document.querySelector('meta[name="viewport"]'),
            textSize: this.checkTextSize(),
            tapTargets: this.checkTapTargets(),
            status: 'success',
            message: 'Page appears to be mobile-friendly'
        };
    }

    checkTextSize() {
        const bodyFontSize = window.getComputedStyle(document.body).fontSize;
        return parseInt(bodyFontSize) >= 16;
    }

    checkTapTargets() {
        const links = document.getElementsByTagName('a');
        const buttons = document.getElementsByTagName('button');
        let smallTargets = 0;

        [...links, ...buttons].forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 48 || rect.height < 48) {
                smallTargets++;
            }
        });

        return {
            total: links.length + buttons.length,
            smallTargets: smallTargets
        };
    }

    // Performance Analysis
    analyzePerformance() {
        const performance = window.performance;
        if (!performance) {
            return {
                score: 0,
                message: 'Performance API not available'
            };
        }

        const timing = performance.timing;
        return {
            score: this.calculatePerformanceScore(timing),
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: this.getFirstPaintTime()
        };
    }

    calculatePerformanceScore(timing) {
        // Implementation of performance score calculation
        return 85; // Placeholder
    }

    getFirstPaintTime() {
        const paint = performance.getEntriesByType('paint');
        const firstPaint = paint.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    // Overall Score Calculation
    calculateOverallScore() {
        const weights = {
            metaTags: 0.2,
            content: 0.3,
            technical: 0.25,
            links: 0.15,
            performance: 0.1
        };

        const scores = {
            metaTags: this.calculateMetaTagsScore(),
            content: this.calculateContentScore(),
            technical: this.calculateTechnicalScore(),
            links: this.calculateLinksScore(),
            performance: this.calculatePerformanceScore()
        };

        let totalScore = 0;
        for (const [key, weight] of Object.entries(weights)) {
            totalScore += scores[key] * weight;
        }

        return Math.round(totalScore);
    }

    // Helper Methods
    isValidMetaTag(name, content) {
        // Implementation of meta tag validation
        return content.length > 0;
    }

    // Additional helper methods for score calculations
    calculateMetaTagsScore() { return 85; } // Placeholder
    calculateContentScore() { return 90; } // Placeholder
    calculateTechnicalScore() { return 85; } // Placeholder
    calculateLinksScore() { return 80; } // Placeholder
}

// Initialize the analyzer
const seoAnalyzer = new SEOAnalyzer();