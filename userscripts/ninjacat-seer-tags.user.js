// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      2.3.0
// @description  Seer division tags, filtering, manual tagging, team sharing, and full customization for NinjaCat agents
// @author       NinjaCat Tweaks
// @match        https://app.ninjacat.io/agency/data/agents*
// @match        https://app.mymarketingreports.com/agency/data/agents*
// @grant        none
// @run-at       document-end
// @homepage     https://github.com/jms830/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.meta.js
// @downloadURL  https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Only run on the agents LIST page, not on individual agent/chat pages
    // Chat URLs look like: /agents/UUID/chat/UUID
    // List URL looks like: /agents or /agents?query=...
    const path = window.location.pathname;
    if (path.includes('/chat/') || /\/agents\/[a-f0-9-]{36}/i.test(path)) {
        console.log('[NinjaCat Seer Tags] Skipping - this is a chat/agent detail page');
        return;
    }

    console.log('[NinjaCat Seer Tags] Script loaded v2.3.0');

    // ---- Storage Keys ----
    const CONFIG_KEY = 'ninjacat-seer-tags-config';
    const AGENT_TAGS_KEY = 'ninjacat-seer-agent-tags';
    const FILTER_STATE_KEY = 'ninjacat-seer-filter-state'; // persists filters, excludes, sort/group
    const DATA_SOURCES_KEY = 'ninjacat-seer-data-sources';
    // MY_NAME_KEY removed - now using native NinjaCat "My Agents" filter
    
    // ---- Default Configuration ----
    const DEFAULT_CONFIG = {
        categories: {
            ana:     { name: 'ANA', color: '#10B981', icon: '📈', enabled: true, order: 0 },
            pdm:     { name: 'PDM', color: '#3B82F6', icon: '💸', enabled: true, order: 1 },
            seo:     { name: 'SEO', color: '#F59E0B', icon: '🔍', enabled: true, order: 2 },
            ce:      { name: 'CE', color: '#8B5CF6', icon: '🤝', enabled: true, order: 3 },
            ops:     { name: 'OPS', color: '#6B7280', icon: '🛠️', enabled: true, order: 4 },
            wip:     { name: 'WIP', color: '#EF4444', icon: '🚧', enabled: true, order: 5 },
            dnu:     { name: 'DNU', color: '#DC2626', icon: '⛔', enabled: true, order: 6 },
            prod:    { name: 'PROD', color: '#059669', icon: '✅', enabled: true, order: 7 },
            client:  { name: 'CLIENT', color: '#7C3AED', icon: '👤', enabled: true, order: 8 },
            utility: { name: 'UTILITY', color: '#64748B', icon: '🔧', enabled: true, order: 9 }
        },
        patterns: {
            ana:     ['[ana]', 'analytics', 'ga4', 'event drop', 'anomalie', 'drop-off', '[garman]', '[brice]', '[john l]', 'by garman', 'by brice', 'by john l'],
            pdm:     ['[pdm]', 'paid', 'ppc', 'ad copy', 'google ads', 'meta ads', 'campaign', 'spend', 'budget', '[britt]', 'by britt'],
            seo:     ['[seo]', 'keyword', 'organic', 'serp', 'search intent', 'landing page', 'content', 'backlink', 'rankings', '[teresa]', 'by teresa'],
            ce:      ['[ce', 'client', 'call prep', 'qbr', 'engagement', 'horizon', '[hanna]', '[lauren]', 'by hanna', 'by lauren'],
            ops:     ['[ops]', 'taxonomy', 'operation', 'process', 'admin', 'calendar', '[scott]', 'by scott'],
            wip:     ['[wip]', 'wip]', 'testing', 'test version'],
            dnu:     ['[dnu]', '[do not use]', '[donotuse]', 'sandbox'],
            prod:    ['[prod]', '[lydia]', '[claire]', '[tracy]', 'by lydia', 'by claire', 'by tracy'],
            client:  ['[paychex]', '[rightway]', '[veolia]', '[chewy]', '[brightstar]', '[pandadoc]', '[trex]'],
            utility: ['[utility]', 'assistant', 'helper', 'api', 'connector', 'builder', 'retriever', 'extractor', 'scraper']
        }
    };

    const DEFAULT_DATA_SOURCES = {
        ga: { name: 'Google Analytics', color: '#F97316', icon: '📊', patterns: ['google analytics', 'ga4', 'ga 4', 'analytics'], enabled: true, order: 0 },
        gsc: { name: 'Google Search Console', color: '#0EA5E9', icon: '🔎', patterns: ['search console', 'gsc'], enabled: true, order: 1 },
        sheets: { name: 'Google Sheets', color: '#22C55E', icon: '📄', patterns: ['google sheets', 'gsheets', 'sheet', 'spreadsheet'], enabled: true, order: 2 },
        meta: { name: 'Meta Ads', color: '#2563EB', icon: '📘', patterns: ['meta ads', 'facebook ads', 'meta'], enabled: true, order: 3 },
        googleAds: { name: 'Google Ads', color: '#FACC15', icon: '💰', patterns: ['google ads', 'googlead', 'adwords'], enabled: true, order: 4 }
    };

    const DEFAULT_ICONS = ['📈', '💸', '🔍', '🤝', '🛠️', '🚧', '⛔', '✅', '👤', '🔧', '📊', '🎯', '💡', '🔔', '📁', '🏷️', '⚡', '🌟', '📋', '🎨', '🔎', '📄', '📘', '💰', '🚀', '💎', '🔥', '❄️', '🌈', '🎪'];

    // ---- Storage Functions ----
    function loadConfig() {
        try {
            const saved = localStorage.getItem(CONFIG_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure order property exists
                Object.keys(parsed.categories || {}).forEach((k, i) => {
                    if (parsed.categories[k].order === undefined) parsed.categories[k].order = i;
                });
                return parsed;
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading config:', error);
        }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function saveConfig(cfg) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving config:', error);
            return false;
        }
    }

    function loadDataSources() {
        try {
            const saved = localStorage.getItem(DATA_SOURCES_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach((k, i) => {
                    if (parsed[k].order === undefined) parsed[k].order = i;
                    if (parsed[k].enabled === undefined) parsed[k].enabled = true;
                });
                return parsed;
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading data sources:', error);
        }
        return JSON.parse(JSON.stringify(DEFAULT_DATA_SOURCES));
    }

    function saveDataSources(sources) {
        try {
            localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(sources));
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving data sources:', error);
            return false;
        }
    }

    function loadAgentTags() {
        try {
            const saved = localStorage.getItem(AGENT_TAGS_KEY);
            if (saved) return JSON.parse(saved);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading agent tags:', error);
        }
        return {};
    }

    function saveAgentTags(tags) {
        try {
            localStorage.setItem(AGENT_TAGS_KEY, JSON.stringify(tags));
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving agent tags:', error);
            return false;
        }
    }

    function loadFilterState() {
        try {
            const saved = localStorage.getItem(FILTER_STATE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading filter state:', error);
        }
        return { categories: [], sources: [], showUntagged: false, excludedOwners: [] };
    }

    function saveFilterState() {
        try {
            localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
                categories: activeCategoryFilters,
                sources: activeSourceFilters,
                showUntagged: showUntaggedOnly,
                sort: currentSort,
                groupBy: currentGroupBy,
                dataSourcesCollapsed: dataSourcesCollapsed,
                excludedCategories: excludedCategories,
                excludedOwners: excludedOwners,
                timeFilter: timeFilter
            }));
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving filter state:', error);
        }
    }

    // ---- State ----
    let config = loadConfig();
    let dataSources = loadDataSources();
    let agentTags = loadAgentTags();
    const savedFilterState = loadFilterState();
    
    let debounceTimer = null;
    let activeRowSelector = null;
    let activeCategoryFilters = savedFilterState.categories || [];
    let activeSourceFilters = savedFilterState.sources || [];
    let showUntaggedOnly = savedFilterState.showUntagged || false;
    let currentFilterStats = { visible: 0, total: 0 };
    let currentSort = savedFilterState.sort || { field: 'name', direction: 'asc' };
    let currentGroupBy = savedFilterState.groupBy || 'none';
    let dataSourcesCollapsed = savedFilterState.dataSourcesCollapsed || false;
    let excludedCategories = savedFilterState.excludedCategories || [];
    let excludedOwners = savedFilterState.excludedOwners || [];
    let timeFilter = savedFilterState.timeFilter || 'all';
    
    // Track which agents we've already processed to prevent flashing
    // Key: agent name, Value: { element: WeakRef, lastTagged: timestamp }
    const taggedAgentsCache = new Map();
    let isTaggingInProgress = false;
    
    // Debug logging utility
    const DEBUG = localStorage.getItem('seer-debug') === 'true';
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[NinjaCat Seer Tags DEBUG]', ...args);
        }
    }
    // Enable debug mode by running in console: localStorage.setItem('seer-debug', 'true'); location.reload();

    // ---- Global Keyboard Handler ----
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = ['seer-settings-modal', 'seer-agent-tag-modal', 'seer-share-modal', 'seer-suggest-pattern-modal'];
            modals.forEach(id => {
                const modal = document.getElementById(id);
                if (modal) modal.remove();
            });
        }
    });

    // ---- Helper Functions ----
    function getAgentRows(log = true) {
        const selectors = [
            '[data-automation-id^="data-table-row"]',
            '[data-automation-id*="agents-table-row"]',
            '[data-testid^="agents-table-row"]',
            '[data-testid*="agent-row"]',
            'table tbody tr',
            '[role="row"][data-row-key]',
            'div[role="row"][data-row-key]'
        ];

        for (const sel of selectors) {
            const nodes = document.querySelectorAll(sel);
            if (nodes.length > 0) {
                if (log && activeRowSelector !== sel) {
                    console.log(`[NinjaCat Seer Tags] Using row selector "${sel}" → ${nodes.length} matches`);
                }
                activeRowSelector = sel;
                return Array.from(nodes);
            }
        }
        return [];
    }

    function getAgentName(card) {
        const nameSelectors = [
            '[data-automation-id*="agent-name"]',
            '[data-testid*="agent-name"]',
            'td:first-child a',
            'td:first-child',
            'div.flex.items-center > div > div > p',
            'a[href*="/agents/"]'
        ];
        
        for (const sel of nameSelectors) {
            const el = card.querySelector(sel);
            if (el) {
                const text = el.textContent?.trim();
                if (text && text.length > 0 && text.length < 200) return text;
            }
        }
        return card.innerText?.split('\n')[0]?.trim() || null;
    }

    function getSortedCategories() {
        return Object.entries(config.categories)
            .filter(([k, v]) => v.enabled)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    }

    function getSortedDataSources() {
        return Object.entries(dataSources)
            .filter(([k, v]) => v.enabled)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
    }

    function detectDataSources(card) {
        const found = new Set();
        const candidates = card.querySelectorAll('img, svg, [data-tooltip-content], [aria-label], [title], span');
        const texts = [];

        candidates.forEach(el => {
            ['data-tooltip-content', 'aria-label', 'title', 'alt'].forEach(attr => {
                const value = el.getAttribute && el.getAttribute(attr);
                if (value) texts.push(value);
            });
            if (el.textContent) texts.push(el.textContent);
        });

        const textBlob = texts.join(' ').toLowerCase();
        Object.entries(dataSources).forEach(([key, source]) => {
            if (source.enabled && source.patterns.some(pattern => textBlob.includes(pattern.toLowerCase()))) {
                found.add(source.name);
            }
        });

        return Array.from(found);
    }

    function getTagsForText(text, agentName) {
        const tags = [];
        const lowerText = (text || '').toLowerCase();
        const addedNames = new Set();
        
        // Pattern-based tags
        for (const [key, words] of Object.entries(config.patterns)) {
            const category = config.categories[key];
            if (!category || !category.enabled) continue;
            
            if (words.some(word => lowerText.includes(word.toLowerCase()))) {
                if (!addedNames.has(category.name)) {
                    tags.push({ ...category, key, isManual: false });
                    addedNames.add(category.name);
                }
            }
        }
        
        // Manual tags for this agent
        if (agentName && agentTags[agentName]) {
            agentTags[agentName].forEach(tagName => {
                if (!addedNames.has(tagName)) {
                    const catEntry = Object.entries(config.categories).find(([k, c]) => c.name === tagName);
                    if (catEntry) {
                        tags.push({ ...catEntry[1], key: catEntry[0], isManual: true });
                        addedNames.add(tagName);
                    }
                }
            });
        }
        
        return tags;
    }

    function getAgentsUsingTag(tagName) {
        return Object.entries(agentTags).filter(([agent, tags]) => tags.includes(tagName)).map(([agent]) => agent);
    }

    function extractDateFromRow(row) {
        const text = row.textContent || '';
        
        // Match patterns like "Nov 6, 2025", "Sep 23, 2025", "Yesterday", "Today", "6 days ago"
        const monthDayYear = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/i);
        if (monthDayYear) {
            const dateStr = `${monthDayYear[1]} ${monthDayYear[2]}, ${monthDayYear[3]}`;
            const timestamp = new Date(dateStr).getTime();
            return { timestamp, text: dateStr };
        }
        
        // Match "Yesterday" or "Today"
        const now = new Date();
        if (/\bYesterday\b/i.test(text)) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return { timestamp: yesterday.getTime(), text: 'Yesterday' };
        }
        if (/\bToday\b/i.test(text)) {
            return { timestamp: now.getTime(), text: 'Today' };
        }
        
        // Match "X days ago"
        const daysAgo = text.match(/(\d+)\s*days?\s*ago/i);
        if (daysAgo) {
            const d = new Date(now);
            d.setDate(d.getDate() - parseInt(daysAgo[1]));
            return { timestamp: d.getTime(), text: `${daysAgo[1]} days ago` };
        }
        
        return { timestamp: 0, text: '' };
    }

    function extractOwnerFromRow(row) {
        const text = row.textContent || '';
        
        // Match "by [Name]" pattern for actual owner name
        const byMatch = text.match(/\bby\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (byMatch) {
            return byMatch[1].trim();
        }
        
        return null;
    }

    // My Agents detection removed - now using native NinjaCat "My Agents" Access filter

    // ---- Pagination control (configurable items per page) ----
    const ITEMS_PER_PAGE_KEY = 'ninjacat-seer-items-per-page';
    
    function loadItemsPerPage() {
        try {
            const saved = localStorage.getItem(ITEMS_PER_PAGE_KEY);
            if (saved) return parseInt(saved) || 0; // 0 = don't auto-change
        } catch (e) {}
        return 0; // Default: don't auto-change pagination
    }
    
    function saveItemsPerPage(value) {
        try {
            localStorage.setItem(ITEMS_PER_PAGE_KEY, value.toString());
        } catch (e) {}
    }
    
    function setItemsPerPage() {
        try {
            const itemsPerPage = loadItemsPerPage();
            if (itemsPerPage === 0) return; // Don't auto-change
            
            // Look for pagination dropdown/buttons
            const paginationSelectors = [
                '[data-automation-id="data-table-pagination-page-size"]',
                '[data-automation-id*="page-size"]',
                'select[aria-label*="per page"]',
                'select[aria-label*="rows"]',
                '.pagination select'
            ];
            
            for (const sel of paginationSelectors) {
                const el = document.querySelector(sel);
                if (el && el.tagName === 'SELECT') {
                    // Find option closest to desired value
                    const options = Array.from(el.options);
                    let bestOption = null;
                    
                    if (itemsPerPage >= 999) {
                        // Look for "All" or highest value
                        bestOption = options.find(o => o.text.toLowerCase().includes('all')) ||
                                    options[options.length - 1];
                    } else {
                        bestOption = options.find(o => parseInt(o.value) === itemsPerPage) ||
                                    options.find(o => parseInt(o.value) >= itemsPerPage);
                    }
                    
                    if (bestOption && el.value !== bestOption.value) {
                        console.log(`[NinjaCat Seer Tags] Setting items per page to: ${bestOption.text}`);
                        el.value = bestOption.value;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    return;
                }
            }
            
            // Fallback: If user wants "All" (999+), try clicking Show All button
            if (itemsPerPage >= 999) {
                const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');
                if (showAllBtn && showAllBtn.offsetParent !== null) {
                    console.log('[NinjaCat Seer Tags] Clicking "Show All" button');
                    showAllBtn.click();
                }
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in setItemsPerPage:', error);
        }
    }

    // ---- Tagging Logic ----
    function tagAgentCards() {
        try {
            // Prevent re-entry while tagging is in progress
            if (isTaggingInProgress) {
                debugLog('Tagging already in progress, skipping');
                return;
            }
            isTaggingInProgress = true;
            
            const agentCards = getAgentRows();
            if (agentCards.length === 0) {
                isTaggingInProgress = false;
                return;
            }

            // Check which cards need tagging:
            // 1. Cards that don't have our tag container
            // 2. Cards whose agent name isn't in our cache with a matching element
            const cardsToProcess = agentCards.filter(card => {
                // If the card already has our tags container, skip it
                if (card.querySelector('.seer-tags')) {
                    return false;
                }
                
                // Get agent name and check cache
                const agentName = getAgentName(card);
                if (!agentName) return true; // No name, needs processing
                
                // Check if we've tagged this agent before
                const cached = taggedAgentsCache.get(agentName);
                if (!cached) return true; // Not in cache, needs processing
                
                // Check if the cached element is still the same DOM node
                const cachedElement = cached.elementRef?.deref?.();
                if (cachedElement === card) {
                    return false; // Same element, already tagged
                }
                
                // Different element (Vue/React re-rendered), needs re-processing
                return true;
            });
            
            if (cardsToProcess.length === 0) {
                // All cards already tagged, just apply filters
                applyFilters();
                isTaggingInProgress = false;
                return;
            }
            
            console.log(`[NinjaCat Seer Tags] Tagging ${cardsToProcess.length} agent cards (${agentCards.length} total)`);
            
            cardsToProcess.forEach((card, index) => {
                try {
                    const txt = card.innerText || '';
                    const agentName = getAgentName(card);
                    
                    // Remove any existing seer elements (for re-rendered nodes)
                    card.querySelector('.seer-tags')?.remove();
                    card.querySelector('.seer-tag-agent-btn')?.remove();
                    card.querySelector('.seer-suggest-btn')?.remove();

                    const tags = getTagsForText(txt, agentName);
                    const sources = detectDataSources(card);
                    const dateInfo = extractDateFromRow(card);
                    const ownerInfo = extractOwnerFromRow(card);
                    
                    // Set data attributes for filtering
                    card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));
                    card.setAttribute('data-seer-datasources', sources.join(','));
                    card.setAttribute('data-seer-has-tags', tags.length > 0 ? 'true' : 'false');
                    if (agentName) card.setAttribute('data-seer-agent-name', agentName);
                    if (dateInfo.timestamp) card.setAttribute('data-seer-date', dateInfo.timestamp);
                    if (dateInfo.text) card.setAttribute('data-seer-date-text', dateInfo.text);
                    if (ownerInfo) card.setAttribute('data-seer-owner', ownerInfo);

                    if (!card.dataset.originalDisplay) {
                        const computed = getComputedStyle(card).display || '';
                        card.dataset.originalDisplay = computed === 'none' ? '' : computed;
                    }

                    // Create tag container
                    const tagContainer = document.createElement('div');
                    tagContainer.className = 'seer-tags';
                    tagContainer.style.cssText = 'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
                    
                    // Add tag badges with improved manual indicator
                    tags.forEach(tag => {
                        const badge = document.createElement('span');
                        badge.style.cssText = 'display:inline-flex;align-items:center;gap:2px;';
                        
                        if (tag.isManual) {
                            // Manual tags: dashed border, slightly different style
                            badge.innerHTML = `${tag.icon} <span style="background:${tag.color};color:#fff;padding:2px 7px;border-radius:6px;font-size:12px;font-weight:500;border:2px dashed rgba(255,255,255,0.5);" title="Manually tagged">${tag.name}</span>`;
                        } else {
                            badge.innerHTML = `${tag.icon} <span style="background:${tag.color};color:#fff;padding:2px 7px;border-radius:6px;font-size:12px;font-weight:500;">${tag.name}</span>`;
                        }
                        tagContainer.appendChild(badge);
                    });
                    
                    // Add buttons
                    if (agentName) {
                        // Tag button
                        const tagBtn = document.createElement('button');
                        tagBtn.className = 'seer-tag-agent-btn';
                        tagBtn.innerHTML = '🏷️';
                        tagBtn.title = 'Manage tags for this agent';
                        tagBtn.style.cssText = 'background:#E5E7EB;border:none;border-radius:4px;padding:2px 6px;font-size:14px;cursor:pointer;opacity:0.7;transition:opacity 0.2s;';
                        tagBtn.onmouseenter = () => tagBtn.style.opacity = '1';
                        tagBtn.onmouseleave = () => tagBtn.style.opacity = '0.7';
                        tagBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openAgentTagModal(agentName); };
                        tagContainer.appendChild(tagBtn);
                        
                        // Suggest pattern button (for untagged or to add patterns)
                        const suggestBtn = document.createElement('button');
                        suggestBtn.className = 'seer-suggest-btn';
                        suggestBtn.innerHTML = '➕';
                        suggestBtn.title = 'Suggest a pattern to auto-tag agents like this';
                        suggestBtn.style.cssText = 'background:#DBEAFE;border:none;border-radius:4px;padding:2px 6px;font-size:14px;cursor:pointer;opacity:0.7;transition:opacity 0.2s;';
                        suggestBtn.onmouseenter = () => suggestBtn.style.opacity = '1';
                        suggestBtn.onmouseleave = () => suggestBtn.style.opacity = '0.7';
                        suggestBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openSuggestPatternModal(agentName); };
                        tagContainer.appendChild(suggestBtn);
                        
                        // Update cache with WeakRef to this element
                        taggedAgentsCache.set(agentName, {
                            elementRef: new WeakRef(card),
                            lastTagged: Date.now()
                        });
                    }

                    let insertionTarget = card.querySelector('[data-automation-id*="agent-name"], [data-testid*="agent-name"], div.flex.items-center > div > div > p');
                    if (!insertionTarget && card.tagName === 'TR') insertionTarget = card.querySelector('td');
                    if (insertionTarget && insertionTarget.parentElement) {
                        insertionTarget.parentElement.appendChild(tagContainer);
                    } else {
                        card.appendChild(tagContainer);
                    }
                } catch (cardError) {
                    console.error(`[NinjaCat Seer Tags] Error tagging card ${index}:`, cardError);
                }
            });

            applyFilters();
            // Update owners dropdown after tagging completes
            setTimeout(() => updateOwnersDropdown(), 100);
            
            isTaggingInProgress = false;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in tagAgentCards:', error);
            isTaggingInProgress = false;
        }
    }

    // ---- Suggest Pattern Modal ----
    function openSuggestPatternModal(agentName) {
        try {
            document.getElementById('seer-suggest-pattern-modal')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-suggest-pattern-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';
            
            // Extract potential keywords from agent name
            const words = agentName.toLowerCase().match(/\[([^\]]+)\]|\b\w{3,}\b/g) || [];
            const suggestions = [...new Set(words)].slice(0, 8);
            
            const categoryOptions = getSortedCategories().map(([key, cat]) => 
                `<option value="${key}">${cat.icon} ${cat.name}</option>`
            ).join('');

            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">➕ Add Pattern</h2>
                <p style="margin:0 0 4px 0;color:#374151;font-weight:600;">${agentName}</p>
                <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">Add a keyword pattern to auto-tag agents like this one.</p>
                
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:#6B7280;">Pattern to add:</label>
                    <input type="text" id="seer-new-pattern" placeholder="e.g., [keyword] or phrase" style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box;">
                    ${suggestions.length > 0 ? `
                        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                            <span style="font-size:11px;color:#6B7280;">Suggestions:</span>
                            ${suggestions.map(s => `<button class="seer-suggestion-btn" style="background:#E5E7EB;border:none;border-radius:4px;padding:2px 8px;font-size:12px;cursor:pointer;">${s}</button>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-bottom:16px;">
                    <label style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:#6B7280;">Add to filter:</label>
                    <select id="seer-pattern-category" style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;">
                        ${categoryOptions}
                    </select>
                </div>
                
                <div style="display:flex;gap:12px;">
                    <button id="seer-add-pattern-btn" style="flex:1;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">Add Pattern</button>
                    <button id="seer-cancel-pattern-btn" style="flex:1;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">Cancel</button>
                </div>
            `;

            // Wire up suggestion clicks
            modal.querySelectorAll('.seer-suggestion-btn').forEach(btn => {
                btn.onclick = () => {
                    modal.querySelector('#seer-new-pattern').value = btn.textContent;
                };
            });

            modal.querySelector('#seer-add-pattern-btn').onclick = () => {
                const pattern = modal.querySelector('#seer-new-pattern').value.trim().toLowerCase();
                const categoryKey = modal.querySelector('#seer-pattern-category').value;
                
                if (!pattern) {
                    alert('Please enter a pattern');
                    return;
                }
                
                if (!config.patterns[categoryKey]) {
                    config.patterns[categoryKey] = [];
                }
                
                if (!config.patterns[categoryKey].includes(pattern)) {
                    config.patterns[categoryKey].push(pattern);
                    saveConfig(config);
                    overlay.remove();
                    refreshPage();
                    alert(`Pattern "${pattern}" added to ${config.categories[categoryKey].name}!`);
                } else {
                    alert('This pattern already exists in that filter.');
                }
            };

            modal.querySelector('#seer-cancel-pattern-btn').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening suggest pattern modal:', error);
        }
    }

    // ---- Agent Tag Modal ----
    function openAgentTagModal(agentName) {
        try {
            document.getElementById('seer-agent-tag-modal')?.remove();

            const currentTags = agentTags[agentName] || [];
            const availableTags = getSortedCategories().map(([k, c]) => c.name);

            const overlay = document.createElement('div');
            overlay.id = 'seer-agent-tag-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';
            
            let tagsHtml = availableTags.map(tagName => {
                const isSelected = currentTags.includes(tagName);
                const cat = Object.values(config.categories).find(c => c.name === tagName);
                return `
                    <label style="display:flex;align-items:center;padding:8px 12px;border-radius:6px;cursor:pointer;transition:background 0.2s;${isSelected ? 'background:#E0F2FE;' : ''}">
                        <input type="checkbox" class="agent-tag-checkbox" value="${tagName}" ${isSelected ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                        <span style="margin-left:10px;font-size:18px;">${cat?.icon || '🏷️'}</span>
                        <span style="margin-left:8px;font-weight:500;">${tagName}</span>
                    </label>
                `;
            }).join('');

            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">🏷️ Tag Agent</h2>
                <p style="margin:0 0 4px 0;color:#374151;font-weight:600;">${agentName}</p>
                <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">Select filters to manually assign. These show with a dashed border.</p>
                <div style="max-height:300px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:16px;">
                    ${tagsHtml || '<p style="padding:16px;color:#6B7280;">No filters available.</p>'}
                </div>
                <div style="display:flex;gap:12px;">
                    <button id="seer-save-agent-tags" style="flex:1;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">💾 Save</button>
                    <button id="seer-clear-agent-tags" style="flex:1;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">🗑️ Clear</button>
                    <button id="seer-cancel-agent-tags" style="flex:1;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✕ Cancel</button>
                </div>
            `;

            modal.querySelector('#seer-save-agent-tags').onclick = () => {
                const selected = Array.from(modal.querySelectorAll('.agent-tag-checkbox:checked')).map(cb => cb.value);
                if (selected.length > 0) {
                    agentTags[agentName] = selected;
                } else {
                    delete agentTags[agentName];
                }
                saveAgentTags(agentTags);
                overlay.remove();
                refreshPage();
            };
            
            modal.querySelector('#seer-clear-agent-tags').onclick = () => {
                delete agentTags[agentName];
                saveAgentTags(agentTags);
                overlay.remove();
                refreshPage();
            };
            
            modal.querySelector('#seer-cancel-agent-tags').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening agent tag modal:', error);
        }
    }

    // ---- Combined Tags Dropdown (Show + Hide) ----
    function createTagsDropdown() {
        const wrapper = document.createElement('div');
        wrapper.className = 'seer-multiselect';
        wrapper.id = 'seer-tags-combined';
        wrapper.style.cssText = 'position:relative;display:inline-block;';

        const categories = getSortedCategories();
        const showCount = activeCategoryFilters.length + (showUntaggedOnly ? 1 : 0);
        const hideCount = excludedCategories.length;
        const totalActive = showCount + hideCount;
        
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'seer-multiselect-btn';
        const displayLabel = totalActive > 0 ? `Tags (${totalActive})` : 'Tags';
        button.innerHTML = `${displayLabel} <span style="margin-left:4px;font-size:10px;">▼</span>`;
        
        // Color based on state: blue for show, red for hide, purple for both
        let bgColor = '#fff', textColor = '#374151', borderColor = '#D1D5DB';
        if (showCount > 0 && hideCount > 0) {
            bgColor = '#7C3AED'; textColor = '#fff'; borderColor = '#7C3AED'; // purple for both
        } else if (hideCount > 0) {
            bgColor = '#EF4444'; textColor = '#fff'; borderColor = '#EF4444'; // red for hide
        } else if (showCount > 0) {
            bgColor = '#3B82F6'; textColor = '#fff'; borderColor = '#3B82F6'; // blue for show
        }
        button.style.cssText = `background:${bgColor};color:${textColor};border:1px solid ${borderColor};border-radius:6px;padding:6px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;min-width:80px;text-align:left;`;

        const dropdown = document.createElement('div');
        dropdown.className = 'seer-multiselect-dropdown';
        dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;min-width:260px;max-height:400px;overflow-y:auto;background:white;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10002;margin-top:4px;';

        function renderDropdown() {
            dropdown.innerHTML = '';
            
            // Search input
            const searchWrapper = document.createElement('div');
            searchWrapper.style.cssText = 'padding:8px;border-bottom:1px solid #E5E7EB;position:sticky;top:0;background:white;z-index:1;';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search tags...';
            searchInput.style.cssText = 'width:100%;padding:6px 8px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;box-sizing:border-box;';
            searchInput.onclick = (e) => e.stopPropagation();
            searchWrapper.appendChild(searchInput);
            dropdown.appendChild(searchWrapper);

            // SHOW section
            const showSection = document.createElement('div');
            showSection.style.cssText = 'border-bottom:1px solid #E5E7EB;';
            
            const showHeader = document.createElement('div');
            showHeader.style.cssText = 'padding:8px 12px;background:#F0FDF4;font-size:11px;font-weight:600;color:#166534;display:flex;justify-content:space-between;align-items:center;';
            showHeader.innerHTML = '<span>✓ SHOW ONLY</span>';
            
            const showActions = document.createElement('div');
            showActions.style.cssText = 'display:flex;gap:4px;';
            const showAllBtn = document.createElement('button');
            showAllBtn.textContent = 'All';
            showAllBtn.style.cssText = 'padding:2px 6px;border:1px solid #BBF7D0;border-radius:3px;font-size:10px;cursor:pointer;background:white;';
            showAllBtn.onclick = (e) => {
                e.stopPropagation();
                activeCategoryFilters = categories.map(([k, c]) => c.name);
                showUntaggedOnly = false;
                applyFilters();
                renderDropdown();
                updateButton();
            };
            const showNoneBtn = document.createElement('button');
            showNoneBtn.textContent = 'None';
            showNoneBtn.style.cssText = 'padding:2px 6px;border:1px solid #BBF7D0;border-radius:3px;font-size:10px;cursor:pointer;background:white;';
            showNoneBtn.onclick = (e) => {
                e.stopPropagation();
                activeCategoryFilters = [];
                showUntaggedOnly = false;
                applyFilters();
                renderDropdown();
                updateButton();
            };
            showActions.appendChild(showAllBtn);
            showActions.appendChild(showNoneBtn);
            showHeader.appendChild(showActions);
            showSection.appendChild(showHeader);

            const showList = document.createElement('div');
            showList.style.cssText = 'padding:4px 0;';
            
            // Add Untagged option
            const untaggedEl = createTagOption('❓', 'Untagged', '#9CA3AF', showUntaggedOnly, (checked) => {
                showUntaggedOnly = checked;
                if (checked) activeCategoryFilters = [];
                applyFilters();
                renderDropdown();
                updateButton();
            }, searchInput);
            showList.appendChild(untaggedEl);
            
            categories.forEach(([key, cat]) => {
                const isSelected = activeCategoryFilters.includes(cat.name);
                const optEl = createTagOption(cat.icon, cat.name, cat.color, isSelected, (checked) => {
                    if (checked) {
                        activeCategoryFilters = [...activeCategoryFilters, cat.name];
                        showUntaggedOnly = false;
                    } else {
                        activeCategoryFilters = activeCategoryFilters.filter(f => f !== cat.name);
                    }
                    applyFilters();
                    renderDropdown();
                    updateButton();
                }, searchInput);
                showList.appendChild(optEl);
            });
            showSection.appendChild(showList);
            dropdown.appendChild(showSection);

            // HIDE section
            const hideSection = document.createElement('div');
            
            const hideHeader = document.createElement('div');
            hideHeader.style.cssText = 'padding:8px 12px;background:#FEF2F2;font-size:11px;font-weight:600;color:#991B1B;display:flex;justify-content:space-between;align-items:center;';
            hideHeader.innerHTML = '<span>🚫 HIDE</span>';
            
            const hideActions = document.createElement('div');
            hideActions.style.cssText = 'display:flex;gap:4px;';
            const hideNoneBtn = document.createElement('button');
            hideNoneBtn.textContent = 'None';
            hideNoneBtn.style.cssText = 'padding:2px 6px;border:1px solid #FECACA;border-radius:3px;font-size:10px;cursor:pointer;background:white;';
            hideNoneBtn.onclick = (e) => {
                e.stopPropagation();
                excludedCategories = [];
                applyFilters();
                renderDropdown();
                updateButton();
            };
            hideActions.appendChild(hideNoneBtn);
            hideHeader.appendChild(hideActions);
            hideSection.appendChild(hideHeader);

            const hideList = document.createElement('div');
            hideList.style.cssText = 'padding:4px 0;';
            
            categories.forEach(([key, cat]) => {
                const isExcluded = excludedCategories.includes(cat.name);
                const optEl = createTagOption(cat.icon, cat.name, cat.color, isExcluded, (checked) => {
                    if (checked) {
                        excludedCategories = [...excludedCategories, cat.name];
                    } else {
                        excludedCategories = excludedCategories.filter(f => f !== cat.name);
                    }
                    applyFilters();
                    renderDropdown();
                    updateButton();
                }, searchInput, true);
                hideList.appendChild(optEl);
            });
            hideSection.appendChild(hideList);
            dropdown.appendChild(hideSection);

            // Filter on search
            searchInput.oninput = () => {
                const filter = searchInput.value.toLowerCase();
                showList.querySelectorAll('.seer-tag-option').forEach(el => {
                    const label = el.getAttribute('data-label').toLowerCase();
                    el.style.display = label.includes(filter) ? 'flex' : 'none';
                });
                hideList.querySelectorAll('.seer-tag-option').forEach(el => {
                    const label = el.getAttribute('data-label').toLowerCase();
                    el.style.display = label.includes(filter) ? 'flex' : 'none';
                });
            };
        }

        function createTagOption(icon, label, color, isChecked, onChange, searchInput, isHide = false) {
            const optionEl = document.createElement('label');
            optionEl.className = 'seer-tag-option';
            optionEl.setAttribute('data-label', label);
            const bgChecked = isHide ? '#FEE2E2' : '#EFF6FF';
            optionEl.style.cssText = `display:flex;align-items:center;padding:6px 12px;cursor:pointer;transition:background 0.1s;gap:8px;${isChecked ? `background:${bgChecked};` : ''}`;
            optionEl.onmouseenter = () => optionEl.style.background = isChecked ? (isHide ? '#FECACA' : '#DBEAFE') : '#F9FAFB';
            optionEl.onmouseleave = () => optionEl.style.background = isChecked ? bgChecked : '';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isChecked;
            checkbox.style.cssText = 'width:14px;height:14px;cursor:pointer;flex-shrink:0;';
            checkbox.onclick = (e) => e.stopPropagation();
            checkbox.onchange = () => onChange(checkbox.checked);

            const iconSpan = document.createElement('span');
            iconSpan.textContent = icon;
            iconSpan.style.cssText = 'font-size:14px;flex-shrink:0;';

            const colorDot = document.createElement('span');
            colorDot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;`;

            const labelText = document.createElement('span');
            labelText.textContent = label;
            labelText.style.cssText = 'font-size:12px;flex:1;';

            optionEl.appendChild(checkbox);
            optionEl.appendChild(colorDot);
            optionEl.appendChild(iconSpan);
            optionEl.appendChild(labelText);
            return optionEl;
        }

        function updateButton() {
            const showCount = activeCategoryFilters.length + (showUntaggedOnly ? 1 : 0);
            const hideCount = excludedCategories.length;
            const totalActive = showCount + hideCount;
            const displayLabel = totalActive > 0 ? `Tags (${totalActive})` : 'Tags';
            button.innerHTML = `${displayLabel} <span style="margin-left:4px;font-size:10px;">▼</span>`;
            
            let bgColor = '#fff', textColor = '#374151', borderColor = '#D1D5DB';
            if (showCount > 0 && hideCount > 0) {
                bgColor = '#7C3AED'; textColor = '#fff'; borderColor = '#7C3AED';
            } else if (hideCount > 0) {
                bgColor = '#EF4444'; textColor = '#fff'; borderColor = '#EF4444';
            } else if (showCount > 0) {
                bgColor = '#3B82F6'; textColor = '#fff'; borderColor = '#3B82F6';
            }
            button.style.background = bgColor;
            button.style.color = textColor;
            button.style.borderColor = borderColor;
            
            updateActiveFiltersDisplay();
        }

        renderDropdown();

        // Toggle dropdown
        let isOpen = false;
        button.onclick = (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            dropdown.style.display = isOpen ? 'block' : 'none';
            if (isOpen) {
                dropdown.querySelector('input')?.focus();
                document.querySelectorAll('.seer-multiselect-dropdown').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });
            }
        };

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
                isOpen = false;
            }
        });

        wrapper.appendChild(button);
        wrapper.appendChild(dropdown);
        return wrapper;
    }

    // ---- Multi-Select Dropdown Component ----
    function createMultiSelect(id, label, options, selectedValues, onChange, opts = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'seer-multiselect';
        wrapper.style.cssText = 'position:relative;display:inline-block;';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'seer-multiselect-btn';
        const count = selectedValues.length;
        const displayLabel = count > 0 ? `${label} (${count})` : label;
        button.innerHTML = `${displayLabel} <span style="margin-left:4px;font-size:10px;">▼</span>`;
        button.style.cssText = `background:${count > 0 ? '#3B82F6' : '#fff'};color:${count > 0 ? '#fff' : '#374151'};border:1px solid ${count > 0 ? '#3B82F6' : '#D1D5DB'};border-radius:6px;padding:6px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;min-width:100px;text-align:left;`;

        const dropdown = document.createElement('div');
        dropdown.className = 'seer-multiselect-dropdown';
        dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:0;min-width:200px;max-height:280px;overflow-y:auto;background:white;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10002;margin-top:4px;';

        // Search input
        const searchWrapper = document.createElement('div');
        searchWrapper.style.cssText = 'padding:8px;border-bottom:1px solid #E5E7EB;position:sticky;top:0;background:white;';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = `Search ${label.toLowerCase()}...`;
        searchInput.style.cssText = 'width:100%;padding:6px 8px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;box-sizing:border-box;';
        searchInput.onclick = (e) => e.stopPropagation();
        searchWrapper.appendChild(searchInput);
        dropdown.appendChild(searchWrapper);

        // Options list
        const optionsList = document.createElement('div');
        optionsList.className = 'seer-multiselect-options';
        optionsList.style.cssText = 'padding:4px 0;';

        function renderOptions(filter = '') {
            optionsList.innerHTML = '';
            const filterLower = filter.toLowerCase();
            
            // Add "Select All" / "Clear All" row
            const actionsRow = document.createElement('div');
            actionsRow.style.cssText = 'display:flex;gap:8px;padding:4px 8px 8px 8px;border-bottom:1px solid #E5E7EB;margin-bottom:4px;';
            const selectAllBtn = document.createElement('button');
            selectAllBtn.textContent = 'All';
            selectAllBtn.style.cssText = 'flex:1;padding:4px;border:1px solid #D1D5DB;border-radius:4px;font-size:11px;cursor:pointer;background:#F3F4F6;';
            selectAllBtn.onclick = (e) => {
                e.stopPropagation();
                const allValues = options.map(o => o.value);
                onChange(allValues);
                updateDropdown();
            };
            const clearAllBtn = document.createElement('button');
            clearAllBtn.textContent = 'None';
            clearAllBtn.style.cssText = 'flex:1;padding:4px;border:1px solid #D1D5DB;border-radius:4px;font-size:11px;cursor:pointer;background:#F3F4F6;';
            clearAllBtn.onclick = (e) => {
                e.stopPropagation();
                onChange([]);
                updateDropdown();
            };
            actionsRow.appendChild(selectAllBtn);
            actionsRow.appendChild(clearAllBtn);
            optionsList.appendChild(actionsRow);

            options.forEach(opt => {
                if (filter && !opt.label.toLowerCase().includes(filterLower)) return;
                
                const optionEl = document.createElement('label');
                optionEl.style.cssText = `display:flex;align-items:center;padding:6px 12px;cursor:pointer;transition:background 0.1s;gap:8px;${selectedValues.includes(opt.value) ? 'background:#EFF6FF;' : ''}`;
                optionEl.onmouseenter = () => optionEl.style.background = selectedValues.includes(opt.value) ? '#DBEAFE' : '#F9FAFB';
                optionEl.onmouseleave = () => optionEl.style.background = selectedValues.includes(opt.value) ? '#EFF6FF' : '';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = selectedValues.includes(opt.value);
                checkbox.style.cssText = 'width:14px;height:14px;cursor:pointer;flex-shrink:0;';
                checkbox.onclick = (e) => e.stopPropagation();
                checkbox.onchange = () => {
                    let newValues;
                    if (checkbox.checked) {
                        newValues = [...selectedValues, opt.value];
                    } else {
                        newValues = selectedValues.filter(v => v !== opt.value);
                    }
                    onChange(newValues);
                    updateDropdown();
                };

                const icon = document.createElement('span');
                icon.textContent = opt.icon || '';
                icon.style.cssText = 'font-size:14px;flex-shrink:0;';

                const labelText = document.createElement('span');
                labelText.textContent = opt.label;
                labelText.style.cssText = 'font-size:12px;flex:1;';

                if (opt.color) {
                    const colorDot = document.createElement('span');
                    colorDot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${opt.color};flex-shrink:0;`;
                    optionEl.appendChild(checkbox);
                    optionEl.appendChild(colorDot);
                    if (opt.icon) optionEl.appendChild(icon);
                    optionEl.appendChild(labelText);
                } else {
                    optionEl.appendChild(checkbox);
                    if (opt.icon) optionEl.appendChild(icon);
                    optionEl.appendChild(labelText);
                }

                optionsList.appendChild(optionEl);
            });

            if (optionsList.children.length === 1) {
                const noResults = document.createElement('div');
                noResults.textContent = 'No matches';
                noResults.style.cssText = 'padding:12px;color:#9CA3AF;font-size:12px;text-align:center;';
                optionsList.appendChild(noResults);
            }
        }

        function updateDropdown() {
            const newCount = selectedValues.length;
            const newLabel = newCount > 0 ? `${label} (${newCount})` : label;
            button.innerHTML = `${newLabel} <span style="margin-left:4px;font-size:10px;">▼</span>`;
            button.style.background = newCount > 0 ? '#3B82F6' : '#fff';
            button.style.color = newCount > 0 ? '#fff' : '#374151';
            button.style.borderColor = newCount > 0 ? '#3B82F6' : '#D1D5DB';
            renderOptions(searchInput.value);
        }

        searchInput.oninput = () => renderOptions(searchInput.value);
        renderOptions();

        dropdown.appendChild(optionsList);

        // Toggle dropdown
        let isOpen = false;
        button.onclick = (e) => {
            e.stopPropagation();
            isOpen = !isOpen;
            dropdown.style.display = isOpen ? 'block' : 'none';
            if (isOpen) {
                searchInput.focus();
                // Close other dropdowns
                document.querySelectorAll('.seer-multiselect-dropdown').forEach(d => {
                    if (d !== dropdown) d.style.display = 'none';
                });
            }
        };

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
                isOpen = false;
            }
        });

        wrapper.appendChild(button);
        wrapper.appendChild(dropdown);
        wrapper._update = updateDropdown;
        wrapper._getSelected = () => selectedValues;
        
        return wrapper;
    }

    // ---- Filter Bar UI ----
    function addTagFilterBar() {
        try {
            if (document.getElementById('seer-tag-bar')) {
                updateFilterCount();
                updateActiveFiltersDisplay();
                return;
            }

            const bar = document.createElement('div');
            bar.id = 'seer-tag-bar';
            bar.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-bottom:12px;padding:10px 12px;background:#FAFAFA;border-radius:8px;border:1px solid #E5E7EB;';

            // Row 1: Count + Active chips + Clear + Settings
            const headerRow = document.createElement('div');
            headerRow.id = 'seer-header-row';
            headerRow.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:28px;';

            const countEl = document.createElement('span');
            countEl.id = 'seer-filter-count';
            countEl.style.cssText = 'font-size:13px;font-weight:600;color:#374151;margin-right:4px;';
            countEl.textContent = 'Loading...';

            const chipsContainer = document.createElement('div');
            chipsContainer.id = 'seer-active-chips';
            chipsContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;flex:1;align-items:center;';

            const spacer = document.createElement('div');
            spacer.style.cssText = 'flex:1;';

            const clearBtn = document.createElement('button');
            clearBtn.id = 'seer-clear-btn';
            clearBtn.innerHTML = '✕ Clear';
            clearBtn.style.cssText = 'display:none;background:#EF4444;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:11px;font-weight:500;cursor:pointer;';
            clearBtn.onclick = () => {
                activeCategoryFilters = [];
                activeSourceFilters = [];
                excludedCategories = [];
                excludedOwners = [];
                showUntaggedOnly = false;
                timeFilter = 'all';
                applyFilters();
                refreshFilterBar();
            };

            const settingsBtn = document.createElement('button');
            settingsBtn.innerHTML = '⚙️';
            settingsBtn.title = 'Settings';
            settingsBtn.style.cssText = 'background:#6B7280;color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:12px;cursor:pointer;';
            settingsBtn.onclick = (e) => { e.stopPropagation(); openSettingsModal(); };

            headerRow.appendChild(countEl);
            headerRow.appendChild(chipsContainer);
            headerRow.appendChild(clearBtn);
            headerRow.appendChild(settingsBtn);

            // Row 2: Compact filter dropdowns
            const filtersRow = document.createElement('div');
            filtersRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';

            // Combined Tags dropdown (Show + Hide)
            const tagsSelect = createTagsDropdown();

            // Data Sources multi-select
            const sourceOptions = getSortedDataSources().map(([key, src]) => ({
                value: src.name,
                label: src.name,
                icon: src.icon,
                color: src.color
            }));
            const sourcesSelect = createMultiSelect('seer-sources-select', 'Sources', sourceOptions,
                activeSourceFilters,
                (values) => {
                    activeSourceFilters = values;
                    applyFilters();
                    updateActiveFiltersDisplay();
                }
            );
            sourcesSelect.id = 'seer-sources-multiselect';

            // Hide Users multi-select (populated dynamically)
            const hideUsersSelect = createMultiSelect('seer-hide-users-select', 'Hide Users', [],
                excludedOwners,
                (values) => {
                    excludedOwners = values;
                    applyFilters();
                    updateActiveFiltersDisplay();
                }
            );
            hideUsersSelect.id = 'seer-hide-users-multiselect';
            hideUsersSelect.style.display = 'none'; // Hidden until owners detected

            // Time filter (simple select)
            const timeSelect = document.createElement('select');
            timeSelect.id = 'seer-time-filter';
            timeSelect.style.cssText = 'padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;cursor:pointer;background:white;';
            timeSelect.innerHTML = `
                <option value="all" ${timeFilter === 'all' ? 'selected' : ''}>All time</option>
                <option value="today" ${timeFilter === 'today' ? 'selected' : ''}>Today</option>
                <option value="week" ${timeFilter === 'week' ? 'selected' : ''}>Last 7 days</option>
                <option value="month" ${timeFilter === 'month' ? 'selected' : ''}>Last 30 days</option>
                <option value="quarter" ${timeFilter === 'quarter' ? 'selected' : ''}>Last 90 days</option>
            `;
            timeSelect.onchange = () => {
                timeFilter = timeSelect.value;
                applyFilters();
                updateActiveFiltersDisplay();
            };

            // Sort select
            const sortSelect = document.createElement('select');
            sortSelect.id = 'seer-sort-select';
            sortSelect.style.cssText = 'padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;cursor:pointer;background:white;';
            sortSelect.innerHTML = `
                <option value="name-asc" ${currentSort.field === 'name' && currentSort.direction === 'asc' ? 'selected' : ''}>A-Z</option>
                <option value="name-desc" ${currentSort.field === 'name' && currentSort.direction === 'desc' ? 'selected' : ''}>Z-A</option>
                <option value="date-desc" ${currentSort.field === 'date' && currentSort.direction === 'desc' ? 'selected' : ''}>Newest</option>
                <option value="date-asc" ${currentSort.field === 'date' && currentSort.direction === 'asc' ? 'selected' : ''}>Oldest</option>
            `;
            sortSelect.onchange = () => {
                const [field, direction] = sortSelect.value.split('-');
                currentSort = { field, direction };
                applySortAndGroup();
                saveFilterState();
            };

            // Group select
            const groupSelect = document.createElement('select');
            groupSelect.id = 'seer-group-select';
            groupSelect.style.cssText = 'padding:6px 8px;border:1px solid #D1D5DB;border-radius:6px;font-size:12px;cursor:pointer;background:white;';
            groupSelect.innerHTML = `
                <option value="none" ${currentGroupBy === 'none' ? 'selected' : ''}>No grouping</option>
                <option value="tag" ${currentGroupBy === 'tag' ? 'selected' : ''}>By Tag</option>
                <option value="source" ${currentGroupBy === 'source' ? 'selected' : ''}>By Source</option>
                <option value="owner" ${currentGroupBy === 'owner' ? 'selected' : ''}>By Owner</option>
            `;
            groupSelect.onchange = () => {
                currentGroupBy = groupSelect.value;
                applySortAndGroup();
                saveFilterState();
            };

            filtersRow.appendChild(tagsSelect);
            filtersRow.appendChild(sourcesSelect);
            filtersRow.appendChild(hideUsersSelect);
            filtersRow.appendChild(timeSelect);
            filtersRow.appendChild(sortSelect);
            filtersRow.appendChild(groupSelect);

            bar.appendChild(headerRow);
            bar.appendChild(filtersRow);

            // Insert bar
            insertFilterBar(bar);

            updateActiveFiltersDisplay();
            
            // Add collapsible sections and My Agents button
            setTimeout(() => {
                addCollapsibleFavorites();
                addMyAgentsButton();
                addCollapsibleAllAgents();
            }, 500);
            
            console.log('[NinjaCat Seer Tags] Compact filter bar inserted');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in addTagFilterBar:', error);
        }
    }

    // ---- Collapsible Section Helper ----
    function makeCollapsible(headerEl, storageKey, contentFinder) {
        if (!headerEl || headerEl.querySelector('.seer-collapse-btn')) return;
        
        // Load saved state
        const savedState = localStorage.getItem(storageKey);
        let isCollapsed = savedState === 'true';
        
        // Style the header to be clickable
        const originalStyle = headerEl.getAttribute('style') || '';
        headerEl.style.cssText = originalStyle + ';cursor:pointer;user-select:none;display:flex;align-items:center;gap:8px;';
        
        // Add collapse indicator
        const collapseBtn = document.createElement('span');
        collapseBtn.className = 'seer-collapse-btn';
        collapseBtn.textContent = isCollapsed ? '▶' : '▼';
        collapseBtn.style.cssText = 'font-size:12px;color:#6B7280;transition:transform 0.2s;flex-shrink:0;';
        headerEl.insertBefore(collapseBtn, headerEl.firstChild);
        
        // Find content to collapse
        const content = contentFinder(headerEl);
        
        if (content) {
            // Apply initial state
            if (isCollapsed) {
                content.style.display = 'none';
            }
            
            // Toggle on click
            headerEl.onclick = (e) => {
                e.stopPropagation();
                isCollapsed = !isCollapsed;
                collapseBtn.textContent = isCollapsed ? '▶' : '▼';
                content.style.display = isCollapsed ? 'none' : '';
                localStorage.setItem(storageKey, isCollapsed.toString());
            };
        }
    }

    // ---- Collapsible Favorites Section ----
    function addCollapsibleFavorites() {
        const favoritesHeader = Array.from(document.querySelectorAll('h2, h3, div')).find(el => 
            el.textContent.trim() === 'Favorites' && !el.querySelector('.seer-collapse-btn')
        );
        
        if (!favoritesHeader) return;
        
        makeCollapsible(favoritesHeader, 'seer-favorites-collapsed', (header) => {
            // Find the favorites content (cards container after header)
            let content = header.nextElementSibling;
            while (content && !content.querySelector('[class*="grid"], [class*="flex"]')) {
                content = content.nextElementSibling;
            }
            if (!content) {
                content = header.parentElement?.nextElementSibling;
            }
            return content;
        });
    }
    
    // ---- Collapsible All Agents Section ----
    function addCollapsibleAllAgents() {
        const allAgentsHeader = Array.from(document.querySelectorAll('h2, h3, div')).find(el => 
            el.textContent.trim() === 'All Agents' && !el.querySelector('.seer-collapse-btn')
        );
        
        if (!allAgentsHeader) return;
        
        makeCollapsible(allAgentsHeader, 'seer-all-agents-collapsed', (header) => {
            // Find the table/list container after the header
            // It might be a table, or a div with rows
            let content = header.nextElementSibling;
            
            // Skip the filter bar if it's between header and table
            while (content && content.id === 'seer-tag-bar') {
                content = content.nextElementSibling;
            }
            
            // Look for table or row container
            if (!content) {
                content = header.parentElement?.querySelector('table, [role="table"], [data-automation-id*="table"]');
            }
            
            return content;
        });
    }

    // ---- My Agents Quick Filter (uses native NinjaCat Access dropdown) ----
    
    /**
     * Finds the Access dropdown by looking for a vue-select that contains "Access:" text
     */
    function findAccessDropdown() {
        // Look for all vue-select elements
        const vueSelects = document.querySelectorAll('.vue-select');
        
        for (const dropdown of vueSelects) {
            // Check if this dropdown has "Access:" label
            const headerText = dropdown.querySelector('.vue-select-header')?.textContent || '';
            if (headerText.includes('Access:')) {
                return dropdown;
            }
        }
        
        // Fallback: look for vue-select near search bar (usually in same row)
        const searchBar = document.querySelector('[data-automation-id="search-bar"]');
        if (searchBar) {
            const row = searchBar.closest('.flex.gap-4');
            if (row) {
                const dropdown = row.querySelector('.vue-select');
                if (dropdown) return dropdown;
            }
        }
        
        // Last fallback: first vue-select
        return document.querySelector('.vue-select');
    }
    
    function clickNativeAccessFilter(optionText) {
        try {
            const accessDropdown = findAccessDropdown();
            if (!accessDropdown) {
                console.log('[NinjaCat Seer Tags] Access dropdown not found');
                return false;
            }
            
            // Click to open dropdown
            const header = accessDropdown.querySelector('.vue-select-header');
            if (header) {
                header.click();
                console.log('[NinjaCat Seer Tags] Clicked Access dropdown header');
            }
            
            // Wait for dropdown to open, then click the option
            setTimeout(() => {
                // The dropdown might be inside the vue-select or appended to body
                let options = accessDropdown.querySelectorAll('.vue-dropdown-item');
                
                // If no options found, check for dropdown in body (Vue sometimes portals dropdowns)
                if (options.length === 0) {
                    const dropdown = accessDropdown.querySelector('.vue-dropdown');
                    if (dropdown) {
                        options = dropdown.querySelectorAll('.vue-dropdown-item');
                    }
                }
                
                console.log(`[NinjaCat Seer Tags] Found ${options.length} dropdown options`);
                
                for (const opt of options) {
                    const text = opt.textContent?.trim();
                    if (text === optionText) {
                        opt.click();
                        console.log(`[NinjaCat Seer Tags] Clicked Access filter: ${optionText}`);
                        return;
                    }
                }
                console.log(`[NinjaCat Seer Tags] Option "${optionText}" not found in Access dropdown`);
            }, 150);
            
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error clicking native Access filter:', error);
            return false;
        }
    }
    
    function getCurrentAccessFilter() {
        try {
            const accessDropdown = findAccessDropdown();
            if (!accessDropdown) return 'All Agents';
            
            // Look for selected text in the header
            const selectedText = accessDropdown.querySelector('.vue-select-header .truncate p');
            if (selectedText?.textContent) {
                return selectedText.textContent.trim();
            }
            
            // Fallback: look for highlighted/selected item in dropdown
            const selectedItem = accessDropdown.querySelector('.vue-dropdown-item.selected');
            if (selectedItem?.textContent) {
                return selectedItem.textContent.trim();
            }
            
            return 'All Agents';
        } catch (e) {
            console.error('[NinjaCat Seer Tags] Error getting current Access filter:', e);
            return 'All Agents';
        }
    }
    
    function addMyAgentsButton() {
        // Don't add if already exists
        if (document.getElementById('seer-my-agents-btn')) return;
        
        const filtersRow = document.querySelector('#seer-tag-bar > div:last-child');
        if (!filtersRow) return;
        
        const currentAccess = getCurrentAccessFilter();
        const isMyAgentsActive = currentAccess === 'My Agents';
        
        const myAgentsBtn = document.createElement('button');
        myAgentsBtn.id = 'seer-my-agents-btn';
        myAgentsBtn.innerHTML = '⭐ My Agents';
        myAgentsBtn.title = 'Quick filter to show only your agents';
        myAgentsBtn.style.cssText = `background:${isMyAgentsActive ? '#F59E0B' : '#FEFCE8'};color:${isMyAgentsActive ? '#fff' : '#854D0E'};border:1px solid ${isMyAgentsActive ? '#F59E0B' : '#FEF08A'};border-radius:6px;padding:6px 12px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;`;
        
        myAgentsBtn.onclick = () => {
            if (getCurrentAccessFilter() === 'My Agents') {
                clickNativeAccessFilter('All Agents');
            } else {
                clickNativeAccessFilter('My Agents');
            }
            // Update button state after a delay
            setTimeout(() => {
                const isActive = getCurrentAccessFilter() === 'My Agents';
                myAgentsBtn.style.background = isActive ? '#F59E0B' : '#FEFCE8';
                myAgentsBtn.style.color = isActive ? '#fff' : '#854D0E';
                myAgentsBtn.style.borderColor = isActive ? '#F59E0B' : '#FEF08A';
            }, 300);
        };
        
        // Insert at the beginning of filters row
        filtersRow.insertBefore(myAgentsBtn, filtersRow.firstChild);
    }

    function insertFilterBar(bar) {
        let inserted = false;
        const allAgentsHeader = Array.from(document.querySelectorAll('h2, h3, div')).find(el => el.textContent.trim() === 'All Agents');
        if (allAgentsHeader?.parentElement) {
            allAgentsHeader.parentElement.insertBefore(bar, allAgentsHeader.nextSibling);
            inserted = true;
        }

        if (!inserted) {
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
            if (searchInput) {
                let container = searchInput.parentElement;
                while (container?.parentElement && !container.classList.contains('flex')) {
                    container = container.parentElement;
                    if (container.classList.contains('gap-4')) break;
                }
                if (container?.parentElement) {
                    container.parentElement.insertBefore(bar, container.nextSibling);
                    inserted = true;
                }
            }
        }

        if (!inserted) {
            const main = document.querySelector('.flex.flex-col.gap-4');
            if (main?.parentNode) {
                main.parentNode.insertBefore(bar, main);
                inserted = true;
            }
        }

        if (!inserted) {
            const contentArea = document.querySelector('main, [role="main"], .content');
            if (contentArea?.firstChild) {
                contentArea.insertBefore(bar, contentArea.firstChild);
            } else {
                document.body.insertBefore(bar, document.body.firstChild);
            }
        }
    }

    function refreshFilterBar() {
        document.getElementById('seer-tag-bar')?.remove();
        addTagFilterBar();
    }

    function updateOwnersDropdown() {
        const ownersWrapper = document.getElementById('seer-hide-users-multiselect');
        if (!ownersWrapper) return;

        const ownersSet = new Set();
        getAgentRows(false).forEach(row => {
            const owner = row.getAttribute('data-seer-owner');
            if (owner) ownersSet.add(owner);
        });

        if (ownersSet.size === 0) {
            ownersWrapper.style.display = 'none';
            return;
        }

        ownersWrapper.style.display = 'inline-block';
        const owners = Array.from(ownersSet).sort();
        
        // Recreate the dropdown with new options
        const ownerOptions = owners.map(name => ({
            value: name,
            label: name,
            icon: '👤'
        }));

        const newOwnersSelect = createMultiSelect('seer-hide-users-select', 'Hide Users', ownerOptions,
            excludedOwners,
            (values) => {
                excludedOwners = values;
                applyFilters();
                updateActiveFiltersDisplay();
            }
        );
        newOwnersSelect.id = 'seer-hide-users-multiselect';
        
        // Style as red when active
        if (excludedOwners.length > 0) {
            const btn = newOwnersSelect.querySelector('.seer-multiselect-btn');
            btn.style.background = '#EF4444';
            btn.style.borderColor = '#EF4444';
            btn.style.color = '#fff';
        }

        ownersWrapper.replaceWith(newOwnersSelect);
    }

    // ---- Exclude Users Modal ----
    function openExcludeUsersModal() {
        try {
            document.getElementById('seer-exclude-users-modal')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-exclude-users-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';

            // collect owners from page
            const ownersSet = new Set();
            getAgentRows(false).forEach(row => {
                const owner = row.getAttribute('data-seer-owner');
                if (owner) ownersSet.add(owner);
            });
            const owners = Array.from(ownersSet).sort((a,b)=>a.localeCompare(b));

            let checkboxesHtml = owners.map(name => {
                const isExcluded = excludedOwners.includes(name);
                return `
                    <label style="display:flex;align-items:center;padding:8px 12px;border-radius:6px;cursor:pointer;transition:background 0.2s;${isExcluded ? 'background:#FEE2E2;' : ''}">
                        <input type="checkbox" class="exclude-user-checkbox" value="${name}" ${isExcluded ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                        <span style="margin-left:10px;font-size:18px;">👤</span>
                        <span style="margin-left:8px;font-weight:500;">${name}</span>
                    </label>
                `;
            }).join('');

            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">🙈 Hide Users</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">Select owners/users to hide from the list.</p>
                <div style="max-height:300px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:12px;">
                    ${checkboxesHtml || '<p style="padding:16px;color:#6B7280;">No owners detected on this page.</p>'}
                </div>
                <div style="display:flex;gap:12px;">
                    <button id="seer-apply-exclude-users" style="flex:1;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">🙈 Apply</button>
                    <button id="seer-clear-exclude-users" style="flex:1;background:#10B981;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✓ Show All</button>
                    <button id="seer-cancel-exclude-users" style="flex:1;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">Cancel</button>
                </div>
            `;

            modal.querySelector('#seer-apply-exclude-users').onclick = () => {
                excludedOwners = Array.from(modal.querySelectorAll('.exclude-user-checkbox:checked')).map(cb => cb.value);
                overlay.remove();
                updateExcludeButton();
                applyFilters();
            };

            modal.querySelector('#seer-clear-exclude-users').onclick = () => {
                excludedOwners = [];
                overlay.remove();
                updateExcludeButton();
                applyFilters();
            };

            modal.querySelector('#seer-cancel-exclude-users').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening exclude users modal:', error);
        }
    }

    // ---- Exclude Tags Modal ----
    function openExcludeModal() {
        try {
            document.getElementById('seer-exclude-modal')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-exclude-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;';

            const categories = getSortedCategories();
            let checkboxesHtml = categories.map(([key, cat]) => {
                const isExcluded = excludedCategories.includes(cat.name);
                return `
                    <label style="display:flex;align-items:center;padding:8px 12px;border-radius:6px;cursor:pointer;transition:background 0.2s;${isExcluded ? 'background:#FEE2E2;' : ''}">
                        <input type="checkbox" class="exclude-tag-checkbox" value="${cat.name}" ${isExcluded ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                        <span style="margin-left:10px;font-size:18px;">${cat.icon}</span>
                        <span style="margin-left:8px;font-weight:500;background:${cat.color};color:white;padding:2px 8px;border-radius:4px;">${cat.name}</span>
                    </label>
                `;
            }).join('');

            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">🚫 Hide Tags</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">Select tags to <strong>exclude</strong> from the list. Agents with these tags will be hidden.</p>
                <div style="max-height:300px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:16px;">
                    ${checkboxesHtml || '<p style="padding:16px;color:#6B7280;">No tags available.</p>'}
                </div>
                <div style="display:flex;gap:12px;">
                    <button id="seer-apply-exclude" style="flex:1;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">🚫 Apply</button>
                    <button id="seer-clear-exclude" style="flex:1;background:#10B981;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✓ Show All</button>
                    <button id="seer-cancel-exclude" style="flex:1;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">Cancel</button>
                </div>
            `;

            modal.querySelector('#seer-apply-exclude').onclick = () => {
                excludedCategories = Array.from(modal.querySelectorAll('.exclude-tag-checkbox:checked')).map(cb => cb.value);
                overlay.remove();
                updateExcludeButton();
                applyFilters();
            };

            modal.querySelector('#seer-clear-exclude').onclick = () => {
                excludedCategories = [];
                overlay.remove();
                updateExcludeButton();
                applyFilters();
            };

            modal.querySelector('#seer-cancel-exclude').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening exclude modal:', error);
        }
    }

    function updateExcludeButton() {
        // No longer needed with multi-select dropdowns - handled by refreshFilterBar
    }

    function updateActiveFiltersDisplay() {
        const chipsContainer = document.getElementById('seer-active-chips');
        const clearBtn = document.getElementById('seer-clear-btn');
        
        if (!chipsContainer) return;
        
        const totalActive = activeCategoryFilters.length + activeSourceFilters.length + 
            (showUntaggedOnly ? 1 : 0) + excludedCategories.length + excludedOwners.length + (timeFilter !== 'all' ? 1 : 0);
        
        // Update clear button visibility
        if (clearBtn) {
            clearBtn.style.display = totalActive > 0 ? 'inline-block' : 'none';
        }
        
        // Build compact active filter chips
        chipsContainer.innerHTML = '';
        
        if (totalActive === 0) return;
        
        // Category chips (compact)
        activeCategoryFilters.forEach(name => {
            const cat = Object.values(config.categories).find(c => c.name === name);
            if (cat) {
                chipsContainer.appendChild(createCompactChip(name, cat.color, cat.icon, 'category'));
            }
        });
        
        // Source chips
        activeSourceFilters.forEach(name => {
            const src = Object.values(dataSources).find(s => s.name === name);
            if (src) {
                chipsContainer.appendChild(createCompactChip(name, src.color, src.icon, 'source'));
            }
        });
        
        // Untagged chip
        if (showUntaggedOnly) {
            chipsContainer.appendChild(createCompactChip('Untagged', '#9CA3AF', '❓', 'untagged'));
        }
        
        // Excluded tags (show as single summary chip)
        if (excludedCategories.length > 0) {
            chipsContainer.appendChild(createCompactChip(`-${excludedCategories.length} tags`, '#EF4444', '🚫', 'excluded'));
        }
        
        // Excluded users
        if (excludedOwners.length > 0) {
            chipsContainer.appendChild(createCompactChip(`-${excludedOwners.length} users`, '#EF4444', '🙈', 'excluded_users'));
        }
        
        // Time filter chip
        if (timeFilter !== 'all') {
            const timeLabels = { today: 'Today', week: '7d', month: '30d', quarter: '90d' };
            chipsContainer.appendChild(createCompactChip(timeLabels[timeFilter], '#6366F1', '📅', 'time'));
        }

        saveFilterState();
    }

    function createCompactChip(label, color, icon, type) {
        const chip = document.createElement('span');
        chip.style.cssText = `display:inline-flex;align-items:center;gap:3px;background:${color};color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:500;cursor:pointer;transition:opacity 0.15s;`;
        chip.title = `Click to remove: ${label}`;
        
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        iconSpan.style.cssText = 'font-size:10px;';
        
        const text = document.createElement('span');
        text.textContent = label;
        
        const removeX = document.createElement('span');
        removeX.textContent = '×';
        removeX.style.cssText = 'font-size:12px;font-weight:700;margin-left:2px;opacity:0.7;';
        
        chip.onmouseenter = () => chip.style.opacity = '0.8';
        chip.onmouseleave = () => chip.style.opacity = '1';
        
        chip.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (type === 'category') {
                activeCategoryFilters = activeCategoryFilters.filter(f => f !== label);
            } else if (type === 'source') {
                activeSourceFilters = activeSourceFilters.filter(f => f !== label);
            } else if (type === 'untagged') {
                showUntaggedOnly = false;
            } else if (type === 'excluded') {
                excludedCategories = [];
            } else if (type === 'excluded_users') {
                excludedOwners = [];
            } else if (type === 'time') {
                timeFilter = 'all';
                const timeSelect = document.getElementById('seer-time-filter');
                if (timeSelect) timeSelect.value = 'all';
            }
            applyFilters();
            refreshFilterBar();
        };
        
        chip.appendChild(iconSpan);
        chip.appendChild(text);
        chip.appendChild(removeX);
        return chip;
    }

    // ---- Filtering ----
    function handleCategorySelection(name, multi = false) {
        showUntaggedOnly = false;
        if (multi) {
            activeCategoryFilters = toggleValue(activeCategoryFilters, name);
        } else {
            activeCategoryFilters = activeCategoryFilters.length === 1 && activeCategoryFilters[0] === name ? [] : [name];
        }
        applyFilters();
    }

    function handleSourceSelection(name, multi = false) {
        showUntaggedOnly = false;
        if (multi) {
            activeSourceFilters = toggleValue(activeSourceFilters, name);
        } else {
            activeSourceFilters = activeSourceFilters.length === 1 && activeSourceFilters[0] === name ? [] : [name];
        }
        applyFilters();
    }

    function toggleValue(arr, value) {
        return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    }

    function applyFilters() {
        try {
            const rows = getAgentRows(false);
            const catFilters = activeCategoryFilters.slice();
            const sourceFilters = activeSourceFilters.slice();
            const timeThreshold = getTimeThreshold();

            let visible = 0;
            rows.forEach(row => {
                const tagAttr = row.getAttribute('data-seer-tags') || '';
                const sourceAttr = row.getAttribute('data-seer-datasources') || '';
                const hasTags = row.getAttribute('data-seer-has-tags') === 'true';
                const tags = tagAttr.split(',').map(t => t.trim()).filter(Boolean);
                const sources = sourceAttr.split(',').map(t => t.trim()).filter(Boolean);
                const rowDate = parseInt(row.getAttribute('data-seer-date') || '0');

                let shouldShow = true;
                
                // Check excluded tags first
                if (excludedCategories.length > 0 && excludedCategories.some(exc => tags.includes(exc))) {
                    shouldShow = false;
                }
                // Check time filter
                else if (timeThreshold > 0 && rowDate > 0 && rowDate < timeThreshold) {
                    shouldShow = false;
                }
                // Check excluded owners/users
                else if (excludedOwners.length > 0) {
                    const owner = row.getAttribute('data-seer-owner') || '';
                    if (owner && excludedOwners.includes(owner)) {
                        shouldShow = false;
                    }
                }
                else if (showUntaggedOnly) {
                    shouldShow = !hasTags;
                } else {
                    const matchesCategory = catFilters.length === 0 || catFilters.some(tag => tags.includes(tag));
                    const matchesSource = sourceFilters.length === 0 || sourceFilters.some(src => sources.includes(src));
                    shouldShow = matchesCategory && matchesSource;
                }

                const baseDisplay = row.dataset.originalDisplay || (row.tagName === 'TR' ? 'table-row' : '');
                row.style.display = shouldShow ? baseDisplay : 'none';
                if (shouldShow) visible++;
            });

            currentFilterStats = { visible, total: rows.length };
            updateFilterCount();
            updateActiveFiltersDisplay();
            applySortAndGroup();
            saveFilterState();
            
            console.log(`[NinjaCat Seer Tags] Filters applied. Visible: ${visible}/${rows.length}`);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error applying filters:', error);
        }
    }

    function getTimeThreshold() {
        const now = Date.now();
        switch (timeFilter) {
            case 'today':
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return today.getTime();
            case 'week':
                return now - (7 * 24 * 60 * 60 * 1000);
            case 'month':
                return now - (30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return now - (90 * 24 * 60 * 60 * 1000);
            default:
                return 0;
        }
    }

    // ---- Sort and Group ----
    function applySortAndGroup() {
        try {
            const rows = getAgentRows(false);
            if (rows.length === 0) return;

            // Remove existing group headers
            document.querySelectorAll('.seer-group-header').forEach(h => h.remove());

            // Get visible rows only
            const visibleRows = rows.filter(r => r.style.display !== 'none');
            if (visibleRows.length === 0) return;

            // Sort rows
            const sortedRows = sortRows(visibleRows);

            // Group rows if needed
            if (currentGroupBy !== 'none') {
                applyGrouping(sortedRows);
            } else {
                // Just reorder rows without grouping
                const parent = sortedRows[0].parentElement;
                if (parent) {
                    sortedRows.forEach(row => parent.appendChild(row));
                }
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in applySortAndGroup:', error);
        }
    }

    function sortRows(rows) {
        return [...rows].sort((a, b) => {
            let valueA, valueB;

            switch (currentSort.field) {
                case 'name':
                    valueA = (a.getAttribute('data-seer-agent-name') || '').toLowerCase();
                    valueB = (b.getAttribute('data-seer-agent-name') || '').toLowerCase();
                    break;
                case 'date':
                    // Try to find date from the row content
                    valueA = extractDate(a);
                    valueB = extractDate(b);
                    break;
                case 'tags':
                    valueA = (a.getAttribute('data-seer-tags') || '').split(',').filter(Boolean).length;
                    valueB = (b.getAttribute('data-seer-tags') || '').split(',').filter(Boolean).length;
                    break;
                default:
                    valueA = '';
                    valueB = '';
            }

            let comparison = 0;
            if (typeof valueA === 'string') {
                comparison = valueA.localeCompare(valueB);
            } else {
                comparison = valueA - valueB;
            }

            return currentSort.direction === 'desc' ? -comparison : comparison;
        });
    }

    function extractDate(row) {
        // Try to find a date in the row (look for common date patterns)
        const text = row.textContent || '';
        const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{4}-\d{2}-\d{2})|(\w+ \d{1,2}, \d{4})/);
        if (dateMatch) {
            return new Date(dateMatch[0]).getTime() || 0;
        }
        // Look for relative dates like "2 days ago"
        const relativeMatch = text.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/i);
        if (relativeMatch) {
            const num = parseInt(relativeMatch[1]);
            const unit = relativeMatch[2].toLowerCase();
            const now = Date.now();
            const multipliers = { minute: 60000, hour: 3600000, day: 86400000, week: 604800000, month: 2592000000 };
            return now - (num * (multipliers[unit] || 86400000));
        }
        return 0;
    }

    function applyGrouping(sortedRows) {
        const groups = new Map();

        sortedRows.forEach(row => {
            let groupKey = 'Other';

            switch (currentGroupBy) {
                case 'tag':
                    const tags = (row.getAttribute('data-seer-tags') || '').split(',').filter(Boolean);
                    groupKey = tags[0] || 'Untagged';
                    break;
                case 'source':
                    const sources = (row.getAttribute('data-seer-datasources') || '').split(',').filter(Boolean);
                    groupKey = sources[0] || 'No Data Source';
                    break;
                case 'owner':
                    groupKey = extractOwner(row) || 'Unknown';
                    break;
            }

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(row);
        });

        // Sort group keys
        const sortedGroups = [...groups.entries()].sort((a, b) => {
            if (a[0] === 'Other' || a[0] === 'Untagged' || a[0] === 'No Data Source' || a[0] === 'Unknown') return 1;
            if (b[0] === 'Other' || b[0] === 'Untagged' || b[0] === 'No Data Source' || b[0] === 'Unknown') return -1;
            return a[0].localeCompare(b[0]);
        });

        // Insert group headers and reorder rows
        const parent = sortedRows[0].parentElement;
        if (!parent) return;

        sortedGroups.forEach(([groupName, groupRows]) => {
            // Create group header
            const header = createGroupHeader(groupName, groupRows.length);
            parent.appendChild(header);

            // Add rows for this group
            groupRows.forEach(row => parent.appendChild(row));
        });
    }

    function extractOwner(row) {
        // Try to find owner/user info in the row
        // Look for common patterns like email, username columns, or avatar tooltips
        const tooltips = row.querySelectorAll('[title], [data-tooltip-content], [aria-label]');
        for (const el of tooltips) {
            const text = el.getAttribute('title') || el.getAttribute('data-tooltip-content') || el.getAttribute('aria-label') || '';
            if (text.includes('@') || text.toLowerCase().includes('created by') || text.toLowerCase().includes('owner')) {
                // Extract email or name
                const emailMatch = text.match(/[\w.-]+@[\w.-]+/);
                if (emailMatch) return emailMatch[0].split('@')[0]; // Return username part
                const nameMatch = text.match(/(?:created by|owner:?)\s*(.+)/i);
                if (nameMatch) return nameMatch[1].trim();
            }
        }
        
        // Try to find in row cells
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            // Assume 3rd column might be owner/access
            const accessCell = cells[2];
            if (accessCell) {
                const text = accessCell.textContent.trim();
                if (text && text.length < 50) return text;
            }
        }
        
        return null;
    }

    function createGroupHeader(name, count) {
        const header = document.createElement('div');
        header.className = 'seer-group-header';
        header.style.cssText = 'padding:12px 16px;background:linear-gradient(to right, #E0E7FF, #F3F4F6);border-radius:6px;margin:12px 0 8px 0;font-weight:700;font-size:13px;color:#4338CA;display:flex;align-items:center;justify-content:space-between;';
        
        // Get color for tag/source groups
        let color = '#4338CA';
        let icon = '📁';
        
        if (currentGroupBy === 'tag') {
            const cat = Object.values(config.categories).find(c => c.name === name);
            if (cat) {
                color = cat.color;
                icon = cat.icon;
            }
        } else if (currentGroupBy === 'source') {
            const src = Object.values(dataSources).find(s => s.name === name);
            if (src) {
                color = src.color;
                icon = src.icon;
            }
        } else if (currentGroupBy === 'owner') {
            icon = '👤';
        }
        
        header.innerHTML = `
            <span style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">${icon}</span>
                <span style="color:${color};">${name}</span>
            </span>
            <span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:11px;">${count}</span>
        `;
        
        return header;
    }

    function updateFilterCount() {
        const countEl = document.getElementById('seer-filter-count');
        if (countEl) {
            const { visible, total } = currentFilterStats;
            const hasFilters = activeCategoryFilters.length > 0 || activeSourceFilters.length > 0 || showUntaggedOnly || excludedCategories.length > 0 || excludedOwners.length > 0 || timeFilter !== 'all';
            
            if (hasFilters) {
                countEl.textContent = `Showing ${visible} of ${total} agents`;
                countEl.style.color = '#3B82F6';
            } else {
                countEl.textContent = `${total} agents`;
                countEl.style.color = '#374151';
            }
        }
    }

    // updateButtonStates removed - replaced by multi-select dropdowns

    // ---- Import/Export ----
    function exportConfigToFile() {
        try {
            const exportData = {
                version: '1.5.0',
                exportedAt: new Date().toISOString(),
                config: config,
                dataSources: dataSources,
                agentTags: agentTags
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ninjacat-seer-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Configuration exported!');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error exporting config:', error);
            alert('Error exporting: ' + error.message);
        }
    }

    function importConfigFromFile(parentOverlay) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (!data.config?.categories) throw new Error('Invalid format');
                    
                    const catCount = Object.keys(data.config.categories).length;
                    const srcCount = Object.keys(data.dataSources || {}).length;
                    const tagCount = Object.keys(data.agentTags || {}).length;
                    
                    if (confirm(`Import configuration?\n\n• ${catCount} filters\n• ${srcCount} data sources\n• ${tagCount} agent tags\n\nThis will replace your current settings.`)) {
                        config = data.config;
                        dataSources = data.dataSources || DEFAULT_DATA_SOURCES;
                        agentTags = data.agentTags || {};
                        saveConfig(config);
                        saveDataSources(dataSources);
                        saveAgentTags(agentTags);
                        if (parentOverlay) parentOverlay.remove();
                        refreshPage();
                        alert('Configuration imported!');
                    }
                } catch (e) {
                    alert('Error importing: ' + e.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // ---- Settings Modal ----
    function openSettingsModal() {
        try {
            document.getElementById('seer-settings-modal')?.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-settings-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:900px;width:95%;max-height:90vh;overflow-y:auto;';
            
            const currentItemsPerPage = loadItemsPerPage();
            
            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;">⚙️ Settings</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;">Configure your preferences, filters, and data sources.</p>
                
                <!-- Tabs - General first for better UX -->
                <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #E5E7EB;">
                    <button class="seer-tab-btn" data-tab="general" style="padding:10px 20px;border:none;background:#3B82F6;color:white;border-radius:6px 6px 0 0;font-weight:600;cursor:pointer;">⚙️ General</button>
                    <button class="seer-tab-btn" data-tab="filters" style="padding:10px 20px;border:none;background:#E5E7EB;color:#374151;border-radius:6px 6px 0 0;font-weight:600;cursor:pointer;">🏷️ Tags</button>
                    <button class="seer-tab-btn" data-tab="sources" style="padding:10px 20px;border:none;background:#E5E7EB;color:#374151;border-radius:6px 6px 0 0;font-weight:600;cursor:pointer;">📊 Sources</button>
                </div>
                
                <!-- General Tab (shown first) -->
                <div id="seer-tab-general" class="seer-tab-content">
                    <!-- My Agents Info -->
                    <div style="padding:16px;background:#FEFCE8;border-radius:8px;border:1px solid #FEF08A;margin-bottom:12px;">
                        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#854D0E;">⭐ My Agents</h3>
                        <p style="margin:0;color:#713F12;font-size:13px;">
                            Use the <strong>⭐ My Agents</strong> button in the filter bar to quickly toggle NinjaCat's native "My Agents" filter.
                            This shows only agents you own.
                        </p>
                    </div>
                    
                    <!-- Pagination -->
                    <div style="padding:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;margin-bottom:12px;">
                        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;">📄 Pagination</h3>
                        <p style="margin:0 0 12px 0;color:#6B7280;font-size:13px;">
                            Set how many agents to show per page. Default: don't change (faster loading).
                        </p>
                        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                            <label style="font-size:13px;font-weight:500;">Items per page:</label>
                            <select id="seer-items-per-page" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;cursor:pointer;">
                                <option value="0" ${currentItemsPerPage === 0 ? 'selected' : ''}>Don't change (default)</option>
                                <option value="10" ${currentItemsPerPage === 10 ? 'selected' : ''}>10</option>
                                <option value="20" ${currentItemsPerPage === 20 ? 'selected' : ''}>20</option>
                                <option value="50" ${currentItemsPerPage === 50 ? 'selected' : ''}>50</option>
                                <option value="100" ${currentItemsPerPage === 100 ? 'selected' : ''}>100</option>
                                <option value="999" ${currentItemsPerPage >= 999 ? 'selected' : ''}>Show All (slow)</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Sections -->
                    <div style="padding:16px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;">
                        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;">📊 Collapsible Sections</h3>
                        <p style="margin:0 0 12px 0;color:#6B7280;font-size:13px;">
                            Click section headers (Favorites, My Agents, All Agents) to collapse/expand.
                        </p>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button id="seer-collapse-all" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:500;cursor:pointer;">Collapse All</button>
                            <button id="seer-expand-all" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:12px;font-weight:500;cursor:pointer;">Expand All</button>
                        </div>
                    </div>
                </div>
                
                <!-- Tags Tab -->
                <div id="seer-tab-filters" class="seer-tab-content" style="display:none;">
                    <div style="margin-bottom:12px;">
                        <input type="text" id="seer-settings-search" placeholder="Search tags..." style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box;">
                    </div>
                    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                        <button id="seer-add-filter" style="background:#10B981;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">+ Add Tag</button>
                        <button id="seer-enable-all-filters" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✓ Enable All</button>
                        <button id="seer-disable-all-filters" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✗ Disable All</button>
                    </div>
                    <div id="seer-filter-list"></div>
                </div>
                
                <!-- Data Sources Tab -->
                <div id="seer-tab-sources" class="seer-tab-content" style="display:none;">
                    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                        <button id="seer-add-source" style="background:#10B981;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">+ Add Source</button>
                        <button id="seer-enable-all-sources" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✓ Enable All</button>
                        <button id="seer-disable-all-sources" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✗ Disable All</button>
                    </div>
                    <div id="seer-source-list"></div>
                </div>
                
                <div style="padding-top:16px;border-top:1px solid #E5E7EB;display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
                    <button id="seer-save-settings" style="flex:1;min-width:120px;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">💾 Save</button>
                    <button id="seer-reset-defaults" style="flex:1;min-width:120px;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">↺ Reset All</button>
                    <button id="seer-cancel-settings" style="flex:1;min-width:120px;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✕ Cancel</button>
                </div>
                
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button id="seer-export-config" style="flex:1;min-width:120px;background:#8B5CF6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">📤 Export Config</button>
                    <button id="seer-import-config" style="flex:1;min-width:120px;background:#8B5CF6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">📥 Import Config</button>
                </div>
            `;

            // Render lists
            renderFilterList(modal.querySelector('#seer-filter-list'));
            renderSourceList(modal.querySelector('#seer-source-list'));

            // Tab switching
            modal.querySelectorAll('.seer-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    modal.querySelectorAll('.seer-tab-btn').forEach(b => {
                        b.style.background = '#E5E7EB';
                        b.style.color = '#374151';
                    });
                    btn.style.background = '#3B82F6';
                    btn.style.color = 'white';
                    
                    modal.querySelectorAll('.seer-tab-content').forEach(c => c.style.display = 'none');
                    modal.querySelector(`#seer-tab-${btn.dataset.tab}`).style.display = 'block';
                };
            });

            // Search
            modal.querySelector('#seer-settings-search').oninput = (e) => {
                const query = e.target.value.toLowerCase();
                modal.querySelectorAll('.seer-settings-item').forEach(item => {
                    const name = item.querySelector('.item-name')?.value?.toLowerCase() || '';
                    const patterns = item.querySelector('.item-patterns')?.value?.toLowerCase() || '';
                    item.style.display = (name.includes(query) || patterns.includes(query)) ? '' : 'none';
                });
            };

            // Add filter
            modal.querySelector('#seer-add-filter').onclick = () => {
                const newKey = 'custom_' + Date.now();
                const maxOrder = Math.max(0, ...Object.values(config.categories).map(c => c.order || 0));
                config.categories[newKey] = { name: 'NEW', color: '#6B7280', icon: '🏷️', enabled: true, order: maxOrder + 1 };
                config.patterns[newKey] = ['[new]'];
                renderFilterList(modal.querySelector('#seer-filter-list'));
            };

            // Add source
            modal.querySelector('#seer-add-source').onclick = () => {
                const newKey = 'source_' + Date.now();
                const maxOrder = Math.max(0, ...Object.values(dataSources).map(s => s.order || 0));
                dataSources[newKey] = { name: 'New Source', color: '#6B7280', icon: '📊', patterns: ['keyword'], enabled: true, order: maxOrder + 1 };
                renderSourceList(modal.querySelector('#seer-source-list'));
            };

            // Enable/disable all
            modal.querySelector('#seer-enable-all-filters').onclick = () => modal.querySelectorAll('#seer-filter-list .item-toggle').forEach(cb => cb.checked = true);
            modal.querySelector('#seer-disable-all-filters').onclick = () => modal.querySelectorAll('#seer-filter-list .item-toggle').forEach(cb => cb.checked = false);
            modal.querySelector('#seer-enable-all-sources').onclick = () => modal.querySelectorAll('#seer-source-list .item-toggle').forEach(cb => cb.checked = true);
            modal.querySelector('#seer-disable-all-sources').onclick = () => modal.querySelectorAll('#seer-source-list .item-toggle').forEach(cb => cb.checked = false);

            // Save
            modal.querySelector('#seer-save-settings').onclick = () => {
                saveSettingsFromModal(modal);
                overlay.remove();
                refreshPage();
            };

            // Reset
            modal.querySelector('#seer-reset-defaults').onclick = () => {
                if (confirm('Reset ALL settings to defaults? This clears filters, data sources, and agent tags.')) {
                    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    dataSources = JSON.parse(JSON.stringify(DEFAULT_DATA_SOURCES));
                    agentTags = {};
                    saveConfig(config);
                    saveDataSources(dataSources);
                    saveAgentTags(agentTags);
                    overlay.remove();
                    refreshPage();
                }
            };

            modal.querySelector('#seer-cancel-settings').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            // Export/Import
            modal.querySelector('#seer-export-config').onclick = () => exportConfigToFile();
            modal.querySelector('#seer-import-config').onclick = () => importConfigFromFile(overlay);
            
            // Items per page
            modal.querySelector('#seer-items-per-page').onchange = (e) => {
                saveItemsPerPage(parseInt(e.target.value));
            };
            
            // Collapse/Expand all
            modal.querySelector('#seer-collapse-all').onclick = () => {
                localStorage.setItem('seer-favorites-collapsed', 'true');
                localStorage.setItem('seer-my-agents-collapsed', 'true');
                localStorage.setItem('seer-all-agents-collapsed', 'true');
                overlay.remove();
                refreshPage();
            };
            modal.querySelector('#seer-expand-all').onclick = () => {
                localStorage.setItem('seer-favorites-collapsed', 'false');
                localStorage.setItem('seer-my-agents-collapsed', 'false');
                localStorage.setItem('seer-all-agents-collapsed', 'false');
                overlay.remove();
                refreshPage();
            };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Setup drag and drop
            setupDragAndDrop(modal.querySelector('#seer-filter-list'), 'filter');
            setupDragAndDrop(modal.querySelector('#seer-source-list'), 'source');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening settings:', error);
        }
    }

    function renderFilterList(container) {
        container.innerHTML = '';
        
        const sorted = Object.entries(config.categories).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
        
        sorted.forEach(([key, cat]) => {
            const item = createSettingsItem(key, cat, config.patterns[key] || [], 'filter');
            container.appendChild(item);
        });
    }

    function renderSourceList(container) {
        container.innerHTML = '';
        
        const sorted = Object.entries(dataSources).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
        
        sorted.forEach(([key, src]) => {
            const item = createSettingsItem(key, src, src.patterns || [], 'source');
            container.appendChild(item);
        });
    }

    function createSettingsItem(key, item, patterns, type) {
        const wrapper = document.createElement('div');
        wrapper.className = 'seer-settings-item';
        wrapper.setAttribute('data-key', key);
        wrapper.setAttribute('data-type', type);
        wrapper.draggable = true;
        wrapper.style.cssText = 'display:flex;flex-direction:column;padding:12px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:8px;background:#F9FAFB;cursor:move;';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;';
        
        // Drag handle
        const handle = document.createElement('span');
        handle.innerHTML = '⋮⋮';
        handle.style.cssText = 'color:#9CA3AF;cursor:move;font-size:16px;';
        
        // Toggle
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.className = 'item-toggle';
        toggle.checked = item.enabled !== false;
        toggle.style.cssText = 'width:18px;height:18px;cursor:pointer;';
        
        // Icon
        const iconSelect = document.createElement('select');
        iconSelect.className = 'item-icon';
        iconSelect.style.cssText = 'font-size:16px;padding:4px;border:1px solid #D1D5DB;border-radius:4px;cursor:pointer;';
        DEFAULT_ICONS.forEach(icon => {
            const opt = document.createElement('option');
            opt.value = icon;
            opt.textContent = icon;
            if (icon === item.icon) opt.selected = true;
            iconSelect.appendChild(opt);
        });
        if (!DEFAULT_ICONS.includes(item.icon)) {
            const opt = document.createElement('option');
            opt.value = item.icon;
            opt.textContent = item.icon;
            opt.selected = true;
            iconSelect.appendChild(opt);
        }
        
        // Name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'item-name';
        nameInput.value = item.name;
        nameInput.style.cssText = 'flex:1;min-width:80px;padding:6px 10px;border:1px solid #D1D5DB;border-radius:4px;font-weight:600;font-size:13px;';
        
        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'item-color';
        colorInput.value = item.color;
        colorInput.style.cssText = 'width:40px;height:28px;border:none;border-radius:4px;cursor:pointer;';
        
        // Delete
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.style.cssText = 'background:#FEE2E2;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:14px;';
        deleteBtn.onclick = () => {
            const name = item.name;
            const usedBy = type === 'filter' ? getAgentsUsingTag(name) : [];
            
            let msg = `Delete "${name}"?`;
            if (usedBy.length > 0) {
                msg += `\n\n⚠️ Warning: ${usedBy.length} agent(s) have this tag manually assigned. Their tags will be removed.`;
            }
            
            if (confirm(msg)) {
                if (type === 'filter') {
                    delete config.categories[key];
                    delete config.patterns[key];
                    // Clean up agent tags
                    Object.keys(agentTags).forEach(agent => {
                        agentTags[agent] = agentTags[agent].filter(t => t !== name);
                        if (agentTags[agent].length === 0) delete agentTags[agent];
                    });
                    saveAgentTags(agentTags);
                } else {
                    delete dataSources[key];
                }
                wrapper.remove();
            }
        };

        header.appendChild(handle);
        header.appendChild(toggle);
        header.appendChild(iconSelect);
        header.appendChild(nameInput);
        header.appendChild(colorInput);
        header.appendChild(deleteBtn);

        // Patterns
        const patternsRow = document.createElement('div');
        const patternsLabel = document.createElement('label');
        patternsLabel.textContent = 'Patterns (comma-separated):';
        patternsLabel.style.cssText = 'display:block;margin-bottom:4px;font-size:11px;font-weight:600;color:#6B7280;';
        
        const patternsInput = document.createElement('textarea');
        patternsInput.className = 'item-patterns';
        patternsInput.rows = 1;
        patternsInput.value = patterns.join(', ');
        patternsInput.style.cssText = 'width:100%;padding:6px;border:1px solid #D1D5DB;border-radius:4px;font-size:11px;font-family:monospace;box-sizing:border-box;resize:none;';
        
        patternsRow.appendChild(patternsLabel);
        patternsRow.appendChild(patternsInput);

        wrapper.appendChild(header);
        wrapper.appendChild(patternsRow);
        
        return wrapper;
    }

    function setupDragAndDrop(container, type) {
        let draggedItem = null;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('seer-settings-item')) {
                draggedItem = e.target;
                e.target.style.opacity = '0.5';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('seer-settings-item')) {
                e.target.style.opacity = '1';
                draggedItem = null;
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            }
        });
    }

    function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.seer-settings-item:not([style*="opacity: 0.5"])')];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function saveSettingsFromModal(modal) {
        try {
            // Save filters
            const newCategories = {};
            const newPatterns = {};
            
            modal.querySelectorAll('#seer-filter-list .seer-settings-item').forEach((item, index) => {
                const key = item.getAttribute('data-key');
                newCategories[key] = {
                    name: item.querySelector('.item-name')?.value?.trim() || 'UNNAMED',
                    color: item.querySelector('.item-color')?.value || '#6B7280',
                    icon: item.querySelector('.item-icon')?.value || '🏷️',
                    enabled: item.querySelector('.item-toggle')?.checked ?? true,
                    order: index
                };
                newPatterns[key] = item.querySelector('.item-patterns')?.value?.split(',').map(p => p.trim()).filter(Boolean) || [];
            });
            
            config.categories = newCategories;
            config.patterns = newPatterns;
            saveConfig(config);

            // Save data sources
            const newSources = {};
            
            modal.querySelectorAll('#seer-source-list .seer-settings-item').forEach((item, index) => {
                const key = item.getAttribute('data-key');
                newSources[key] = {
                    name: item.querySelector('.item-name')?.value?.trim() || 'UNNAMED',
                    color: item.querySelector('.item-color')?.value || '#6B7280',
                    icon: item.querySelector('.item-icon')?.value || '📊',
                    patterns: item.querySelector('.item-patterns')?.value?.split(',').map(p => p.trim()).filter(Boolean) || [],
                    enabled: item.querySelector('.item-toggle')?.checked ?? true,
                    order: index
                };
            });
            
            dataSources = newSources;
            saveDataSources(dataSources);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving settings:', error);
        }
    }

    // ---- Refresh & Run ----
    function refreshPage() {
        // Clear tagged markers so cards will be re-processed
        document.querySelectorAll('[data-seer-tagged]').forEach(el => el.removeAttribute('data-seer-tagged'));
        document.querySelectorAll('.seer-tags, .seer-tag-agent-btn, .seer-suggest-btn').forEach(el => el.remove());
        document.getElementById('seer-tag-bar')?.remove();
        document.getElementById('seer-my-agents-btn')?.remove();
        setTimeout(runAll, 300);
    }

    function runAll() {
        try {
            setItemsPerPage(); // Configurable, default is don't change
            tagAgentCards();
            addTagFilterBar();
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in runAll:', error);
        }
    }

    function observeAndRun() {
        console.log('[NinjaCat Seer Tags] Initial run scheduled');
        setTimeout(runAll, 1500);

        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                console.log('[NinjaCat Seer Tags] DOM changed, re-running');
                runAll();
            }, 1000);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeAndRun);
    } else {
        observeAndRun();
    }

})();
