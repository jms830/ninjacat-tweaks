// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.6.0
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.6.0');

    // ---- Storage Keys ----
    const CONFIG_KEY = 'ninjacat-seer-tags-config';
    const AGENT_TAGS_KEY = 'ninjacat-seer-agent-tags';
    const FILTER_STATE_KEY = 'ninjacat-seer-filter-state';
    const DATA_SOURCES_KEY = 'ninjacat-seer-data-sources';
    
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
            ana:     ['[ana]', 'analytics', 'ga4', 'event drop', 'anomalie', 'drop-off'],
            pdm:     ['[pdm]', 'paid', 'ppc', 'ad copy', 'google ads', 'meta ads', 'campaign', 'spend', 'budget'],
            seo:     ['[seo]', 'keyword', 'organic', 'serp', 'search intent', 'landing page', 'content', 'backlink', 'rankings'],
            ce:      ['[ce', 'client', 'call prep', 'qbr', 'engagement', 'horizon'],
            ops:     ['[ops]', 'taxonomy', 'operation', 'process', 'admin', 'calendar'],
            wip:     ['[wip]', '[lydia wip]', '[taylor', '[wil wip]', 'testing', 'test version'],
            dnu:     ['[dnu]', '[do not use]', '[donotuse]', 'sandbox'],
            prod:    ['[prod]'],
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
        return { categories: [], sources: [], showUntagged: false };
    }

    function saveFilterState() {
        try {
            localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
                categories: activeCategoryFilters,
                sources: activeSourceFilters,
                showUntagged: showUntaggedOnly,
                sort: currentSort,
                groupBy: currentGroupBy,
                dataSourcesCollapsed: dataSourcesCollapsed
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

    // ---- Auto-expand pagination ----
    function expandShowAll() {
        try {
            const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');
            if (showAllBtn && showAllBtn.offsetParent !== null) {
                console.log('[NinjaCat Seer Tags] Clicking "Show All" button');
                showAllBtn.click();
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in expandShowAll:', error);
        }
    }

    // ---- Tagging Logic ----
    function tagAgentCards() {
        try {
            const agentCards = getAgentRows();
            if (agentCards.length === 0) return;

            console.log(`[NinjaCat Seer Tags] Tagging ${agentCards.length} agent cards`);
            
            agentCards.forEach((card, index) => {
                try {
                    // Remove existing elements
                    card.querySelector('.seer-tags')?.remove();
                    card.querySelector('.seer-tag-agent-btn')?.remove();
                    card.querySelector('.seer-suggest-btn')?.remove();

                    const txt = card.innerText || '';
                    const agentName = getAgentName(card);
                    const tags = getTagsForText(txt, agentName);
                    const sources = detectDataSources(card);

                    card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));
                    card.setAttribute('data-seer-datasources', sources.join(','));
                    card.setAttribute('data-seer-has-tags', tags.length > 0 ? 'true' : 'false');
                    if (agentName) card.setAttribute('data-seer-agent-name', agentName);

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
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in tagAgentCards:', error);
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

    // ---- Filter Bar UI ----
    function addTagFilterBar() {
        try {
            if (document.getElementById('seer-tag-bar')) {
                updateButtonStates();
                updateFilterCount();
                updateActiveFiltersDisplay();
                return;
            }

            const bar = document.createElement('div');
            bar.id = 'seer-tag-bar';
            bar.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-bottom:16px;padding:12px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;';

            // Header row with count, active filter badge, and controls
            const headerRow = createHeaderRow();
            
            // Active filters chips (shown when filters are active)
            const activeFiltersRow = document.createElement('div');
            activeFiltersRow.id = 'seer-active-filters';
            activeFiltersRow.style.cssText = 'display:none;flex-wrap:wrap;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid #E5E7EB;';
            
            // Category filters row
            const categoryRow = createFilterRow('Filters', config.categories, 'category');
            
            // Data sources row (collapsible)
            const sourceRow = createCollapsibleSourceRow();
            
            // Sort and Group controls
            const sortGroupRow = createSortGroupRow();
            
            // Help row
            const helpRow = createHelpRow();

            bar.appendChild(headerRow);
            bar.appendChild(activeFiltersRow);
            bar.appendChild(categoryRow);
            bar.appendChild(sourceRow);
            bar.appendChild(sortGroupRow);
            bar.appendChild(helpRow);

            // Insert bar
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

            updateButtonStates();
            updateActiveFiltersDisplay();
            console.log('[NinjaCat Seer Tags] Filter bar inserted');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in addTagFilterBar:', error);
        }
    }

    function createHeaderRow() {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;';

        // Agent count
        const countEl = document.createElement('div');
        countEl.id = 'seer-filter-count';
        countEl.style.cssText = 'font-size:14px;font-weight:600;color:#374151;';
        countEl.textContent = 'Loading...';

        // Active filter badge
        const badgeEl = document.createElement('span');
        badgeEl.id = 'seer-filter-badge';
        badgeEl.style.cssText = 'display:none;background:#3B82F6;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;';
        badgeEl.textContent = '0 active';

        // Spacer
        const spacer = document.createElement('div');
        spacer.style.cssText = 'flex:1;';

        // Reset button (hidden when no filters)
        const resetBtn = document.createElement('button');
        resetBtn.id = 'seer-reset-btn';
        resetBtn.innerHTML = '✕ Clear Filters';
        resetBtn.className = 'seer-reset-btn';
        resetBtn.style.cssText = 'display:none;background:#EF4444;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;';
        resetBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            activeCategoryFilters = [];
            activeSourceFilters = [];
            showUntaggedOnly = false;
            applyFilters();
        };

        // Settings button
        const settingsBtn = document.createElement('button');
        settingsBtn.innerHTML = '⚙️';
        settingsBtn.title = 'Settings';
        settingsBtn.style.cssText = 'background:#4B5563;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:14px;cursor:pointer;';
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        };

        row.appendChild(countEl);
        row.appendChild(badgeEl);
        row.appendChild(spacer);
        row.appendChild(resetBtn);
        row.appendChild(settingsBtn);
        return row;
    }

    function createFilterRow(label, configMap, type) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
        row.className = type === 'category' ? 'seer-category-row' : 'seer-source-row';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:12px;font-weight:700;color:#4B5563;margin-right:6px;min-width:70px;';
        row.appendChild(labelEl);

        const entries = type === 'category' ? getSortedCategories() : getSortedDataSources();

        entries.forEach(([key, item]) => {
            const btn = document.createElement('button');
            btn.innerHTML = `${item.icon} ${item.name}`;
            btn.className = type === 'category' ? 'seer-filter-btn' : 'seer-source-btn';
            btn.setAttribute('data-tag', item.name);
            btn.setAttribute('data-color', item.color);
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('role', 'button');
            btn.style.cssText = `background:${item.color};color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;`;

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const multi = e.ctrlKey || e.metaKey || e.shiftKey;
                if (type === 'category') {
                    handleCategorySelection(item.name, multi);
                } else {
                    handleSourceSelection(item.name, multi);
                }
            };

            row.appendChild(btn);
        });

        // Add "Untagged" button for category row
        if (type === 'category') {
            const untaggedBtn = document.createElement('button');
            untaggedBtn.innerHTML = '❓ Untagged';
            untaggedBtn.className = 'seer-untagged-btn';
            untaggedBtn.setAttribute('aria-pressed', 'false');
            untaggedBtn.style.cssText = 'background:#9CA3AF;color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;';
            untaggedBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showUntaggedOnly = !showUntaggedOnly;
                if (showUntaggedOnly) {
                    activeCategoryFilters = [];
                    activeSourceFilters = [];
                }
                applyFilters();
            };
            row.appendChild(untaggedBtn);
        }

        return row;
    }

    function createCollapsibleSourceRow() {
        const wrapper = document.createElement('div');
        wrapper.className = 'seer-source-wrapper';
        
        // Header with collapse toggle
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;';
        header.onclick = () => {
            dataSourcesCollapsed = !dataSourcesCollapsed;
            updateDataSourcesVisibility();
            saveFilterState();
        };
        
        const toggleIcon = document.createElement('span');
        toggleIcon.id = 'seer-source-toggle';
        toggleIcon.textContent = dataSourcesCollapsed ? '▶' : '▼';
        toggleIcon.style.cssText = 'font-size:10px;color:#6B7280;width:12px;';
        
        const labelEl = document.createElement('span');
        labelEl.textContent = 'Data Sources';
        labelEl.style.cssText = 'font-size:12px;font-weight:700;color:#4B5563;';
        
        const countBadge = document.createElement('span');
        countBadge.id = 'seer-source-count-badge';
        countBadge.style.cssText = 'display:none;background:#0EA5E9;color:white;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600;margin-left:4px;';
        
        header.appendChild(toggleIcon);
        header.appendChild(labelEl);
        header.appendChild(countBadge);
        
        // Content (filter buttons)
        const content = document.createElement('div');
        content.id = 'seer-source-content';
        content.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px;margin-left:18px;';
        
        const entries = getSortedDataSources();
        entries.forEach(([key, item]) => {
            const btn = document.createElement('button');
            btn.innerHTML = `${item.icon} ${item.name}`;
            btn.className = 'seer-source-btn';
            btn.setAttribute('data-tag', item.name);
            btn.setAttribute('data-color', item.color);
            btn.setAttribute('aria-pressed', 'false');
            btn.style.cssText = `background:${item.color};color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;`;

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const multi = e.ctrlKey || e.metaKey || e.shiftKey;
                handleSourceSelection(item.name, multi);
            };

            content.appendChild(btn);
        });
        
        wrapper.appendChild(header);
        wrapper.appendChild(content);
        
        // Apply initial collapsed state
        setTimeout(() => updateDataSourcesVisibility(), 0);
        
        return wrapper;
    }

    function updateDataSourcesVisibility() {
        const content = document.getElementById('seer-source-content');
        const toggle = document.getElementById('seer-source-toggle');
        if (content) {
            content.style.display = dataSourcesCollapsed ? 'none' : 'flex';
        }
        if (toggle) {
            toggle.textContent = dataSourcesCollapsed ? '▶' : '▼';
        }
    }

    function createSortGroupRow() {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding-top:8px;border-top:1px solid #E5E7EB;';

        // Sort dropdown
        const sortWrapper = document.createElement('div');
        sortWrapper.style.cssText = 'display:flex;align-items:center;gap:6px;';
        
        const sortLabel = document.createElement('span');
        sortLabel.textContent = 'Sort:';
        sortLabel.style.cssText = 'font-size:12px;font-weight:600;color:#6B7280;';
        
        const sortSelect = document.createElement('select');
        sortSelect.id = 'seer-sort-select';
        sortSelect.style.cssText = 'padding:4px 8px;border:1px solid #D1D5DB;border-radius:4px;font-size:12px;cursor:pointer;background:white;';
        sortSelect.innerHTML = `
            <option value="name-asc" ${currentSort.field === 'name' && currentSort.direction === 'asc' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="name-desc" ${currentSort.field === 'name' && currentSort.direction === 'desc' ? 'selected' : ''}>Name (Z-A)</option>
            <option value="date-desc" ${currentSort.field === 'date' && currentSort.direction === 'desc' ? 'selected' : ''}>Last Edited (Newest)</option>
            <option value="date-asc" ${currentSort.field === 'date' && currentSort.direction === 'asc' ? 'selected' : ''}>Last Edited (Oldest)</option>
            <option value="tags-desc" ${currentSort.field === 'tags' && currentSort.direction === 'desc' ? 'selected' : ''}>Most Tags</option>
            <option value="tags-asc" ${currentSort.field === 'tags' && currentSort.direction === 'asc' ? 'selected' : ''}>Fewest Tags</option>
        `;
        sortSelect.onchange = () => {
            const [field, direction] = sortSelect.value.split('-');
            currentSort = { field, direction };
            applySortAndGroup();
            saveFilterState();
        };
        
        sortWrapper.appendChild(sortLabel);
        sortWrapper.appendChild(sortSelect);

        // Group dropdown
        const groupWrapper = document.createElement('div');
        groupWrapper.style.cssText = 'display:flex;align-items:center;gap:6px;';
        
        const groupLabel = document.createElement('span');
        groupLabel.textContent = 'Group by:';
        groupLabel.style.cssText = 'font-size:12px;font-weight:600;color:#6B7280;';
        
        const groupSelect = document.createElement('select');
        groupSelect.id = 'seer-group-select';
        groupSelect.style.cssText = 'padding:4px 8px;border:1px solid #D1D5DB;border-radius:4px;font-size:12px;cursor:pointer;background:white;';
        groupSelect.innerHTML = `
            <option value="none" ${currentGroupBy === 'none' ? 'selected' : ''}>None</option>
            <option value="tag" ${currentGroupBy === 'tag' ? 'selected' : ''}>Primary Tag</option>
            <option value="source" ${currentGroupBy === 'source' ? 'selected' : ''}>Data Source</option>
            <option value="owner" ${currentGroupBy === 'owner' ? 'selected' : ''}>Owner/User</option>
        `;
        groupSelect.onchange = () => {
            currentGroupBy = groupSelect.value;
            applySortAndGroup();
            saveFilterState();
        };
        
        groupWrapper.appendChild(groupLabel);
        groupWrapper.appendChild(groupSelect);

        row.appendChild(sortWrapper);
        row.appendChild(groupWrapper);
        return row;
    }

    function createHelpRow() {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;padding-top:6px;';

        // Help icon with tooltip
        const helpBtn = document.createElement('button');
        helpBtn.innerHTML = '?';
        helpBtn.title = 'Keyboard shortcuts:\n• Ctrl/Cmd+Click: Multi-select filters\n• Esc: Close modals\n• 🏷️: Tag agent manually\n• ➕: Add auto-tag pattern';
        helpBtn.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#E5E7EB;border:none;font-size:11px;font-weight:700;color:#6B7280;cursor:help;';
        
        const hintText = document.createElement('span');
        hintText.textContent = 'Ctrl+click to multi-select';
        hintText.style.cssText = 'font-size:11px;color:#9CA3AF;';

        row.appendChild(helpBtn);
        row.appendChild(hintText);
        return row;
    }

    function updateActiveFiltersDisplay() {
        const container = document.getElementById('seer-active-filters');
        const badge = document.getElementById('seer-filter-badge');
        const resetBtn = document.getElementById('seer-reset-btn');
        const sourceCountBadge = document.getElementById('seer-source-count-badge');
        
        if (!container) return;
        
        const totalActive = activeCategoryFilters.length + activeSourceFilters.length + (showUntaggedOnly ? 1 : 0);
        
        // Update badge
        if (badge) {
            if (totalActive > 0) {
                badge.style.display = 'inline';
                badge.textContent = `${totalActive} active`;
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Update reset button visibility
        if (resetBtn) {
            resetBtn.style.display = totalActive > 0 ? 'inline-block' : 'none';
        }
        
        // Update source count badge (when collapsed)
        if (sourceCountBadge) {
            if (activeSourceFilters.length > 0 && dataSourcesCollapsed) {
                sourceCountBadge.style.display = 'inline';
                sourceCountBadge.textContent = activeSourceFilters.length;
            } else {
                sourceCountBadge.style.display = 'none';
            }
        }
        
        // Build active filter chips
        container.innerHTML = '';
        if (totalActive === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        
        const label = document.createElement('span');
        label.textContent = 'Active:';
        label.style.cssText = 'font-size:11px;font-weight:600;color:#6B7280;margin-right:4px;';
        container.appendChild(label);
        
        // Category chips
        activeCategoryFilters.forEach(name => {
            const cat = Object.values(config.categories).find(c => c.name === name);
            if (cat) {
                container.appendChild(createFilterChip(name, cat.color, cat.icon, 'category'));
            }
        });
        
        // Source chips
        activeSourceFilters.forEach(name => {
            const src = Object.values(dataSources).find(s => s.name === name);
            if (src) {
                container.appendChild(createFilterChip(name, src.color, src.icon, 'source'));
            }
        });
        
        // Untagged chip
        if (showUntaggedOnly) {
            container.appendChild(createFilterChip('Untagged', '#9CA3AF', '❓', 'untagged'));
        }
    }

    function createFilterChip(name, color, icon, type) {
        const chip = document.createElement('span');
        chip.style.cssText = `display:inline-flex;align-items:center;gap:4px;background:${color};color:white;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:500;`;
        
        const text = document.createElement('span');
        text.textContent = `${icon} ${name}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.title = `Remove ${name} filter`;
        removeBtn.style.cssText = 'background:rgba(255,255,255,0.3);border:none;border-radius:50%;width:14px;height:14px;font-size:12px;line-height:1;cursor:pointer;color:white;padding:0;';
        removeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (type === 'category') {
                activeCategoryFilters = activeCategoryFilters.filter(f => f !== name);
            } else if (type === 'source') {
                activeSourceFilters = activeSourceFilters.filter(f => f !== name);
            } else if (type === 'untagged') {
                showUntaggedOnly = false;
            }
            applyFilters();
        };
        
        chip.appendChild(text);
        chip.appendChild(removeBtn);
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

            let visible = 0;
            rows.forEach(row => {
                const tagAttr = row.getAttribute('data-seer-tags') || '';
                const sourceAttr = row.getAttribute('data-seer-datasources') || '';
                const hasTags = row.getAttribute('data-seer-has-tags') === 'true';
                const tags = tagAttr.split(',').map(t => t.trim()).filter(Boolean);
                const sources = sourceAttr.split(',').map(t => t.trim()).filter(Boolean);

                let shouldShow = true;
                
                if (showUntaggedOnly) {
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
            updateButtonStates();
            updateActiveFiltersDisplay();
            applySortAndGroup();
            saveFilterState();
            
            console.log(`[NinjaCat Seer Tags] Filters applied. Visible: ${visible}/${rows.length}`);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error applying filters:', error);
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
            const hasFilters = activeCategoryFilters.length > 0 || activeSourceFilters.length > 0 || showUntaggedOnly;
            
            if (hasFilters) {
                countEl.textContent = `Showing ${visible} of ${total} agents`;
                countEl.style.color = '#3B82F6';
            } else {
                countEl.textContent = `${total} agents`;
                countEl.style.color = '#374151';
            }
        }
    }

    function updateButtonStates() {
        const activeCats = new Set(activeCategoryFilters);
        const activeSources = new Set(activeSourceFilters);

        document.querySelectorAll('.seer-filter-btn').forEach(btn => {
            const tag = btn.getAttribute('data-tag');
            const active = activeCats.has(tag);
            btn.style.opacity = (activeCats.size === 0 && !showUntaggedOnly) || active ? '1' : '0.5';
            btn.style.boxShadow = active ? '0 0 0 3px #111827' : '';
            btn.style.transform = active ? 'scale(1.05)' : 'scale(1)';
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        document.querySelectorAll('.seer-source-btn').forEach(btn => {
            const tag = btn.getAttribute('data-tag');
            const active = activeSources.has(tag);
            btn.style.opacity = (activeSources.size === 0 && !showUntaggedOnly) || active ? '1' : '0.5';
            btn.style.boxShadow = active ? '0 0 0 3px #111827' : '';
            btn.style.transform = active ? 'scale(1.05)' : 'scale(1)';
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        const untaggedBtn = document.querySelector('.seer-untagged-btn');
        if (untaggedBtn) {
            untaggedBtn.style.opacity = showUntaggedOnly ? '1' : '0.7';
            untaggedBtn.style.boxShadow = showUntaggedOnly ? '0 0 0 3px #111827' : '';
            untaggedBtn.style.transform = showUntaggedOnly ? 'scale(1.05)' : 'scale(1)';
            untaggedBtn.setAttribute('aria-pressed', showUntaggedOnly ? 'true' : 'false');
        }
    }

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
            
            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;">⚙️ Settings</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;">Customize filters, data sources, and manage your configuration.</p>
                
                <!-- Search box -->
                <div style="margin-bottom:16px;">
                    <input type="text" id="seer-settings-search" placeholder="Search filters..." style="width:100%;padding:10px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box;">
                </div>
                
                <!-- Tabs -->
                <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid #E5E7EB;">
                    <button class="seer-tab-btn" data-tab="filters" style="padding:10px 20px;border:none;background:#3B82F6;color:white;border-radius:6px 6px 0 0;font-weight:600;cursor:pointer;">Filters</button>
                    <button class="seer-tab-btn" data-tab="sources" style="padding:10px 20px;border:none;background:#E5E7EB;color:#374151;border-radius:6px 6px 0 0;font-weight:600;cursor:pointer;">Data Sources</button>
                </div>
                
                <!-- Filters Tab -->
                <div id="seer-tab-filters" class="seer-tab-content">
                    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                        <button id="seer-add-filter" style="background:#10B981;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">+ Add Filter</button>
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
        document.querySelectorAll('.seer-tags, .seer-tag-agent-btn, .seer-suggest-btn').forEach(el => el.remove());
        document.getElementById('seer-tag-bar')?.remove();
        setTimeout(runAll, 300);
    }

    function runAll() {
        try {
            expandShowAll();
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
