// Constants for configuration
const CONFIG = {
    CACHE_DURATION: 3600000, // 1 hour in milliseconds
    MAX_CACHE_ITEMS: 100,
    API_ENDPOINTS: {
        PAGESPEED: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
        MOBILE_FRIENDLY: 'https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run'
    }
};

// Cache management
let analysisCache = new Map();

// Initialize extension
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === 'install') {
        await initializeExtension();
    } else if (reason === 'update') {
        await handleUpdate();
    }
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Use async handler for messages
    handleMessage(request, sender).then(sendResponse);
    return true; // Will respond asynchronously
});

// Tab event listeners
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        handleTabUpdate(tabId, tab);
    }
});

// Main message handler
async function handleMessage(request, sender) {
    switch (request.action) {
        case 'analyzeUrl':
            return await analyzePage(request.url);
        case 'getCachedAnalysis':
            return getCachedAnalysis(request.url);
        case 'clearCache':
            return clearAnalysisCache();
        case 'getSettings':
            return await getExtensionSettings();
        case 'updateSettings':
            return await updateSettings(request.settings);
        default:
            throw new Error(`Unknown action: ${request.action}`);
    }
}

// Initialize extension settings and data
async function initializeExtension() {
    try {
        // Set default settings
        await chrome.storage.sync.set({
            settings: {
                autoAnalyze: true,
                notificationsEnabled: true,
                customRules: [],
                apiKeys: {},
                analysisDepth: 'standard'
            }
        });

        // Create context menu items
        createContextMenus();

        console.log('Extension initialized successfully');
    } catch (error) {
        console.error('Failed to initialize extension:', error);
    }
}

// Handle extension updates
async function handleUpdate() {
    try {
        // Perform any necessary data migrations
        await migrateData();
        
        // Update context menus
        await chrome.contextMenus.removeAll();
        createContextMenus();

        console.log('Extension updated successfully');
    } catch (error) {
        console.error('Failed to handle update:', error);
    }
}

// Create context menu items
function createContextMenus() {
    chrome.contextMenus.create({
        id: 'analyzePage',
        title: 'Analyze This Page',
        contexts: ['page', 'link']
    });

    chrome.contextMenus.create({
        id: 'comparePages',
        title: 'Compare with Current Page',
        contexts: ['link']
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzePage') {
        const url = info.linkUrl || info.pageUrl;
        analyzePage(url);
    } else if (info.menuItemId === 'comparePages') {
        comparePages(tab.url, info.linkUrl);
    }
});

// Main page analysis function
async function analyzePage(url) {
    try {
        // Check cache first
        const cachedResult = getCachedAnalysis(url);
        if (cachedResult) {
            return cachedResult;
        }

        // Perform various analyses
        const [
            basicAnalysis,
            technicalData,
            performanceData,
            securityData
        ] = await Promise.all([
            performBasicAnalysis(url),
            analyzeTechnicalAspects(url),
            analyzePerformance(url),
            analyzeSecurity(url)
        ]);

        // Combine results
        const result = {
            url,
            timestamp: Date.now(),
            basic: basicAnalysis,
            technical: technicalData,
            performance: performanceData,
            security: securityData
        };

        // Cache the result
        cacheAnalysis(url, result);

        return result;
    } catch (error) {
        console.error('Analysis failed:', error);
        throw error;
    }
}

// Cache management functions
function cacheAnalysis(url, data) {
    // Remove oldest items if cache is full
    if (analysisCache.size >= CONFIG.MAX_CACHE_ITEMS) {
        const oldestKey = analysisCache.keys().next().value;
        analysisCache.delete(oldestKey);
    }

    analysisCache.set(url, {
        data,
        timestamp: Date.now()
    });
}

function getCachedAnalysis(url) {
    const cached = analysisCache.get(url);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CONFIG.CACHE_DURATION) {
        analysisCache.delete(url);
        return null;
    }

    return cached.data;
}

function clearAnalysisCache() {
    analysisCache.clear();
    return true;
}

// Analysis helper functions
async function performBasicAnalysis(url) {
    // Implementation of basic SEO analysis
    return {
        title: await extractPageTitle(url),
        metaTags: await analyzeMetaTags(url),
        headers: await analyzeHeaders(url),
        links: await analyzeLinks(url),
        images: await analyzeImages(url)
    };
}

async function analyzeTechnicalAspects(url) {
    // Implementation of technical analysis
    return {
        mobileFriendly: await checkMobileFriendliness(url),
        speed: await checkPageSpeed(url),
        structured: await analyzeStructuredData(url),
        accessibility: await checkAccessibility(url)
    };
}

async function analyzePerformance(url) {
    // Implementation of performance analysis
    return {
        loadTime: await measureLoadTime(url),
        resourceUsage: await analyzeResources(url),
        optimization: await checkOptimization(url)
    };
}

async function analyzeSecurity(url) {
    // Implementation of security analysis
    return {
        ssl: await checkSSL(url),
        headers: await analyzeSecurityHeaders(url),
        vulnerabilities: await checkVulnerabilities(url)
    };
}

// Settings management
async function getExtensionSettings() {
    try {
        const { settings } = await chrome.storage.sync.get('settings');
        return settings;
    } catch (error) {
        console.error('Failed to get settings:', error);
        throw error;
    }
}

async function updateSettings(newSettings) {
    try {
        await chrome.storage.sync.set({ settings: newSettings });
        return true;
    } catch (error) {
        console.error('Failed to update settings:', error);
        throw error;
    }
}

// Data migration helper
async function migrateData() {
    // Implementation of data migration logic
    const { oldData } = await chrome.storage.sync.get('oldData');
    if (oldData) {
        // Perform migration
        await chrome.storage.sync.remove('oldData');
    }
}

// Error handling
function handleError(error) {
    console.error('Extension error:', error);
    // Implement error reporting logic here
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzePage,
        getCachedAnalysis,
        clearAnalysisCache,
        CONFIG
    };
}