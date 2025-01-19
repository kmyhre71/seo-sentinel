// Utility functions
const $ = (selector) => document.querySelector(selector);
const $ = (selector) => document.querySelectorAll(selector);

// State management
let currentTab = 'overview';
let pageData = null;

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
    initializeTabs();
    initializeButtons();
    await analyzePage();
    updateUI();
});

// Tab management
function initializeTabs() {
    const tabs = $('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            $('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            $(`#${currentTab}`).classList.add('active');
            
            // Update content for the selected tab
            updateTabContent(currentTab);
        });
    });
}

// Button initialization
function initializeButtons() {
    $('#settingsBtn').addEventListener('click', openSettings);
    $('#generateReport').addEventListener('click', generateReport);
    $('#exportData').addEventListener('click', exportData);
}

// Page analysis
async function analyzePage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get page data from content script
        const response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'analyzePage' 
        });
        
        pageData = response;
        return response;
    } catch (error) {
        console.error('Error analyzing page:', error);
        showError('Failed to analyze page. Please refresh and try again.');
    }
}

// UI updates
function updateUI() {
    if (!pageData) return;
    
    updateOverview();
    updateOnPageSEO();
    updateLinks();
    updateTechnical();
}

function updateOverview() {
    const { seoScore, metaTags, links, performance } = pageData;
    
    // Update SEO score
    $('#seoScore').textContent = seoScore;
    
    // Update quick stats
    $('#metaStatus').textContent = `${metaTags.valid}/${metaTags.total}`;
    $('#linkStatus').textContent = `${links.valid}/${links.total}`;
    $('#perfStatus').textContent = `${performance.score}%`;
}

function updateOnPageSEO() {
    const { title, description, headers, content } = pageData.onPage;
    
    // Title analysis
    const titleAnalysis = analyzeTitleTag(title);
    $('#titleAnalysis').innerHTML = `
        <div class="${titleAnalysis.status}">
            <h4>Length: ${title.length} characters ${titleAnalysis.lengthOk ? '✓' : '⚠'}</h4>
            <p>${titleAnalysis.message}</p>
        </div>
    `;
    
    // Meta description analysis
    const descAnalysis = analyzeMetaDescription(description);
    $('#metaDescAnalysis').innerHTML = `
        <div class="${descAnalysis.status}">
            <h4>Length: ${description.length} characters ${descAnalysis.lengthOk ? '✓' : '⚠'}</h4>
            <p>${descAnalysis.message}</p>
        </div>
    `;
    
    // Headers analysis
    $('#headersAnalysis').innerHTML = generateHeadersAnalysis(headers);
    
    // Content analysis
    $('#contentAnalysis').innerHTML = generateContentAnalysis(content);
}

function updateLinks() {
    const { internal, external, broken } = pageData.links;
    
    // Update counts
    $('#internalLinksCount').textContent = internal.length;
    $('#externalLinksCount').textContent = external.length;
    $('#brokenLinksCount').textContent = broken.length;
    
    // Generate links list
    const linksList = $('#linksList');
    linksList.innerHTML = generateLinksReport(internal, external, broken);
}

function updateTechnical() {
    const { mobile, speed, ssl, robots } = pageData.technical;
    
    // Update technical checks
    $('#mobileFriendly').innerHTML = generateTechnicalCheck('Mobile Friendly', mobile);
    $('#pageSpeed').innerHTML = generateTechnicalCheck('Page Speed', speed);
    $('#sslStatus').innerHTML = generateTechnicalCheck('SSL Status', ssl);
    $('#robotsTxt').innerHTML = generateTechnicalCheck('Robots.txt', robots);
}

// Analysis helper functions
function analyzeTitleTag(title) {
    const minLength = 30;
    const maxLength = 60;
    const length = title.length;
    
    if (length < minLength) {
        return {
            status: 'warning',
            lengthOk: false,
            message: `Title tag is too short. Add ${minLength - length} more characters.`
        };
    } else if (length > maxLength) {
        return {
            status: 'warning',
            lengthOk: false,
            message: `Title tag is too long. Remove ${length - maxLength} characters.`
        };
    }
    
    return {
        status: 'success',
        lengthOk: true,
        message: 'Title tag length is optimal.'
    };
}

function analyzeMetaDescription(description) {
    const minLength = 120;
    const maxLength = 155;
    const length = description.length;
    
    if (length < minLength) {
        return {
            status: 'warning',
            lengthOk: false,
            message: `Meta description is too short. Add ${minLength - length} more characters.`
        };
    } else if (length > maxLength) {
        return {
            status: 'warning',
            lengthOk: false,
            message: `Meta description is too long. Remove ${length - maxLength} characters.`
        };
    }
    
    return {
        status: 'success',
        lengthOk: true,
        message: 'Meta description length is optimal.'
    };
}

function generateHeadersAnalysis(headers) {
    let html = '<div class="headers-analysis">';
    
    // Check for H1
    const h1Count = headers.filter(h => h.level === 1).length;
    html += `
        <div class="${h1Count === 1 ? 'success' : 'error'}">
            <p>H1 Tags: ${h1Count} ${h1Count === 1 ? '✓' : '⚠'}</p>
        </div>
    `;
    
    // Headers hierarchy
    html += '<div class="headers-hierarchy">';
    headers.forEach(header => {
        html += `
            <div class="header-item level-${header.level}">
                <span>H${header.level}</span>
                <p>${header.text}</p>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

function generateContentAnalysis(content) {
    return `
        <div class="content-stats">
            <p>Word count: ${content.wordCount}</p>
            <p>Keyword density: ${content.keywordDensity}%</p>
            <p>Readability score: ${content.readabilityScore}</p>
        </div>
    `;
}

function generateLinksReport(internal, external, broken) {
    let html = '<div class="links-report">';
    
    // Broken links section
    if (broken.length > 0) {
        html += `
            <div class="error-links">
                <h4>⚠ Broken Links</h4>
                ${broken.map(link => `
                    <div class="link-item broken">
                        <p>${link.url}</p>
                        <span>Error: ${link.error}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Internal links section
    html += `
        <div class="internal-links">
            <h4>Internal Links</h4>
            ${internal.map(link => `
                <div class="link-item">
                    <p>${link.text}</p>
                    <span>${link.url}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    return html;
}

function generateTechnicalCheck(name, data) {
    return `
        <div class="technical-check ${data.status}">
            <div class="check-header">
                <span class="material-icons">
                    ${data.status === 'success' ? 'check_circle' : 'warning'}
                </span>
                <h4>${name}</h4>
            </div>
            <p>${data.message}</p>
        </div>
    `;
}

// Action handlers
function openSettings() {
    chrome.runtime.openOptionsPage();
}

async function generateReport() {
    try {
        const report = await createReport(pageData);
        downloadFile('seo-report.html', report, 'text/html');
    } catch (error) {
        showError('Failed to generate report. Please try again.');
    }
}

async function exportData() {
    try {
        const data = JSON.stringify(pageData, null, 2);
        downloadFile('seo-data.json', data, 'application/json');
    } catch (error) {
        showError('Failed to export data. Please try again.');
    }
}

// Helper functions
function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showError(message) {
    // Implementation of error messaging system
    console.error(message);
    // You could add a UI element to show errors to users
}

// Create detailed HTML report
async function createReport(data) {
    // Implementation of report generation
    // This would create a detailed HTML report with all the analysis data
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>SEO Report - ${data.url}</title>
                <!-- Add styles here -->
            </head>
            <body>
                <h1>SEO Analysis Report</h1>
                <!-- Add report content here -->
            </body>
        </html>
    `;
}