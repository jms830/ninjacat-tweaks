// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents with customizable categories, data sources, manual tagging, and import/export
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.4.0');

    // ---- Configuration Management ----
    const CONFIG_KEY = 'ninjacat-seer-tags-config';
    const AGENT_TAGS_KEY = 'ninjacat-seer-agent-tags';
    
    const DEFAULT_CONFIG = {
        categories: {
            ana:     { name: 'ANA', color: '#10B981', icon: '📈', enabled: true },
            pdm:     { name: 'PDM', color: '#3B82F6', icon: '💸', enabled: true },
            seo:     { name: 'SEO', color: '#F59E0B', icon: '🔍', enabled: true },
            ce:      { name: 'CE', color: '#8B5CF6', icon: '🤝', enabled: true },
            ops:     { name: 'OPS', color: '#6B7280', icon: '🛠️', enabled: true },
            wip:     { name: 'WIP', color: '#EF4444', icon: '🚧', enabled: true },
            dnu:     { name: 'DNU', color: '#DC2626', icon: '⛔', enabled: true },
            prod:    { name: 'PROD', color: '#059669', icon: '✅', enabled: true },
            client:  { name: 'CLIENT', color: '#7C3AED', icon: '👤', enabled: true },
            utility: { name: 'UTILITY', color: '#64748B', icon: '🔧', enabled: true }
        },
        patterns: {
            ana:     ['[ana]', 'analytics', 'ga4', 'event drop', 'anomalie', 'drop-off', 'gsc'],
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

    const DATA_SOURCES = {
        ga: {
            name: 'Google Analytics',
            color: '#F97316',
            icon: '📊',
            patterns: ['google analytics', 'ga4', 'ga 4', 'ga ', 'analytics']
        },
        gsc: {
            name: 'Google Search Console',
            color: '#0EA5E9',
            icon: '🔎',
            patterns: ['search console', 'gsc']
        },
        sheets: {
            name: 'Google Sheets',
            color: '#22C55E',
            icon: '📄',
            patterns: ['google sheets', 'gsheets', 'sheet', 'spreadsheet']
        },
        meta: {
            name: 'Meta Ads',
            color: '#2563EB',
            icon: '📘',
            patterns: ['meta ads', 'facebook ads', 'meta']
        },
        googleAds: {
            name: 'Google Ads',
            color: '#FACC15',
            icon: '💰',
            patterns: ['google ads', 'googlead', 'adwords']
        }
    };

    const DEFAULT_ICONS = ['📈', '💸', '🔍', '🤝', '🛠️', '🚧', '⛔', '✅', '👤', '🔧', '📊', '🎯', '💡', '🔔', '📁', '🏷️', '⚡', '🌟', '📋', '🎨'];

    function loadConfig() {
        try {
            const saved = localStorage.getItem(CONFIG_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('[NinjaCat Seer Tags] Loaded saved configuration');
                return parsed;
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading config:', error);
        }
        console.log('[NinjaCat Seer Tags] Using default configuration');
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    function saveConfig(cfg) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
            console.log('[NinjaCat Seer Tags] Configuration saved');
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving config:', error);
            return false;
        }
    }

    function loadAgentTags() {
        try {
            const saved = localStorage.getItem(AGENT_TAGS_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error loading agent tags:', error);
        }
        return {};
    }

    function saveAgentTags(tags) {
        try {
            localStorage.setItem(AGENT_TAGS_KEY, JSON.stringify(tags));
            console.log('[NinjaCat Seer Tags] Agent tags saved');
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving agent tags:', error);
            return false;
        }
    }

    let config = loadConfig();
    let agentTags = loadAgentTags(); // { "Agent Name": ["TAG1", "TAG2"], ... }

    // State
    let debounceTimer = null;
    let activeRowSelector = null;
    let activeCategoryFilters = [];
    let activeSourceFilters = [];

    // ---- Helper: Locate table rows ----
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

        if (log) {
            console.warn('[NinjaCat Seer Tags] No agent rows found. Selectors tried:', selectors);
        }
        return [];
    }

    // ---- Helper: Extract agent name from row ----
    function getAgentName(card) {
        // Try various selectors to find agent name
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
                if (text && text.length > 0 && text.length < 200) {
                    return text;
                }
            }
        }
        
        // Fallback: get first meaningful text
        const firstText = card.innerText?.split('\n')[0]?.trim();
        return firstText || null;
    }

    // ---- Helper: Extract data source labels ----
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
        Object.entries(DATA_SOURCES).forEach(([key, source]) => {
            if (source.patterns.some(pattern => textBlob.includes(pattern))) {
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
                    tags.push({ ...category, isManual: false });
                    addedNames.add(category.name);
                }
            }
        }
        
        // Manual tags for this agent
        if (agentName && agentTags[agentName]) {
            agentTags[agentName].forEach(tagName => {
                if (!addedNames.has(tagName)) {
                    // Find the category config for this tag
                    const catEntry = Object.entries(config.categories).find(([k, c]) => c.name === tagName);
                    if (catEntry) {
                        tags.push({ ...catEntry[1], isManual: true });
                        addedNames.add(tagName);
                    }
                }
            });
        }
        
        return tags;
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

    // ---- Tagging logic ----
    function tagAgentCards() {
        try {
            const agentCards = getAgentRows();
            if (agentCards.length === 0) {
                console.log('[NinjaCat Seer Tags] No agent cards found');
                return;
            }

            console.log(`[NinjaCat Seer Tags] Tagging ${agentCards.length} agent cards`);
            
            agentCards.forEach((card, index) => {
                try {
                    // Remove existing tags to refresh
                    const existingTags = card.querySelector('.seer-tags');
                    if (existingTags) existingTags.remove();
                    
                    const existingTagBtn = card.querySelector('.seer-tag-agent-btn');
                    if (existingTagBtn) existingTagBtn.remove();

                    const txt = card.innerText || '';
                    const agentName = getAgentName(card);
                    const tags = getTagsForText(txt, agentName);
                    const sources = detectDataSources(card);

                    card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));
                    card.setAttribute('data-seer-datasources', sources.join(','));
                    if (agentName) {
                        card.setAttribute('data-seer-agent-name', agentName);
                    }

                    if (!card.dataset.originalDisplay) {
                        const computed = getComputedStyle(card).display || '';
                        card.dataset.originalDisplay = computed === 'none' ? '' : computed;
                    }

                    // Create tag display and tag button container
                    const tagContainer = document.createElement('div');
                    tagContainer.className = 'seer-tags';
                    tagContainer.style.cssText = 'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
                    
                    // Add tag badges
                    tags.forEach(tag => {
                        const badge = document.createElement('span');
                        badge.style.cssText = 'display:inline-flex;align-items:center;gap:2px;';
                        const manualIndicator = tag.isManual ? ' *' : '';
                        badge.innerHTML = `${tag.icon} <span style="background:${tag.color};color:#fff;padding:2px 7px;border-radius:6px;font-size:12px;font-weight:500;">${tag.name}${manualIndicator}</span>`;
                        tagContainer.appendChild(badge);
                    });
                    
                    // Add "Tag" button
                    if (agentName) {
                        const tagBtn = document.createElement('button');
                        tagBtn.className = 'seer-tag-agent-btn';
                        tagBtn.innerHTML = '🏷️';
                        tagBtn.title = 'Manage tags for this agent';
                        tagBtn.style.cssText = 'background:#E5E7EB;border:none;border-radius:4px;padding:2px 6px;font-size:14px;cursor:pointer;margin-left:4px;opacity:0.7;transition:opacity 0.2s;';
                        tagBtn.onmouseenter = () => tagBtn.style.opacity = '1';
                        tagBtn.onmouseleave = () => tagBtn.style.opacity = '0.7';
                        tagBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openAgentTagModal(agentName);
                        };
                        tagContainer.appendChild(tagBtn);
                    }

                    let insertionTarget = card.querySelector('[data-automation-id*="agent-name"], [data-testid*="agent-name"], div.flex.items-center > div > div > p');
                    if (!insertionTarget && card.tagName === 'TR') {
                        insertionTarget = card.querySelector('td');
                    }
                    if (insertionTarget && insertionTarget.parentElement) {
                        insertionTarget.parentElement.appendChild(tagContainer);
                    } else {
                        card.appendChild(tagContainer);
                    }
                } catch (cardError) {
                    console.error(`[NinjaCat Seer Tags] Error tagging card ${index}:`, cardError);
                }
            });

            if (activeCategoryFilters.length > 0 || activeSourceFilters.length > 0) {
                applyFilters();
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in tagAgentCards:', error);
        }
    }

    // ---- Agent Tag Modal ----
    function openAgentTagModal(agentName) {
        try {
            const existing = document.getElementById('seer-agent-tag-modal');
            if (existing) existing.remove();

            const currentTags = agentTags[agentName] || [];
            const availableTags = Object.values(config.categories).filter(c => c.enabled).map(c => c.name);

            const overlay = document.createElement('div');
            overlay.id = 'seer-agent-tag-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10001;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);';
            
            let tagsHtml = availableTags.map(tagName => {
                const isSelected = currentTags.includes(tagName);
                const cat = Object.values(config.categories).find(c => c.name === tagName);
                return `
                    <label style="display:flex;align-items:center;padding:8px 12px;border-radius:6px;cursor:pointer;transition:background 0.2s;${isSelected ? 'background:#E0F2FE;' : ''}" 
                           onmouseenter="this.style.background='#F3F4F6'" onmouseleave="this.style.background='${isSelected ? '#E0F2FE' : ''}'">
                        <input type="checkbox" class="agent-tag-checkbox" value="${tagName}" ${isSelected ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
                        <span style="margin-left:10px;font-size:18px;">${cat?.icon || '🏷️'}</span>
                        <span style="margin-left:8px;font-weight:500;">${tagName}</span>
                    </label>
                `;
            }).join('');

            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;">🏷️ Tag Agent</h2>
                <p style="margin:0 0 4px 0;color:#374151;font-weight:600;">${agentName}</p>
                <p style="margin:0 0 16px 0;color:#6B7280;font-size:14px;">Select divisions to manually assign to this agent.</p>
                <div style="max-height:300px;overflow-y:auto;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:16px;">
                    ${tagsHtml || '<p style="padding:16px;color:#6B7280;">No divisions available. Add divisions in Settings.</p>'}
                </div>
                <div style="display:flex;gap:12px;">
                    <button id="seer-save-agent-tags" style="flex:1;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">💾 Save</button>
                    <button id="seer-clear-agent-tags" style="flex:1;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">🗑️ Clear All</button>
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
                return;
            }

            const bar = document.createElement('div');
            bar.id = 'seer-tag-bar';
            bar.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-bottom:16px;padding:12px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;';

            const categoryRow = createFilterRow('Divisions', config.categories, 'category');
            const sourceRow = createFilterRow('Data Sources', DATA_SOURCES, 'source');
            const controlsRow = createControlRow();

            bar.appendChild(categoryRow);
            bar.appendChild(sourceRow);
            bar.appendChild(controlsRow);

            let inserted = false;
            const allAgentsHeader = Array.from(document.querySelectorAll('h2, h3, div')).find(el => el.textContent.trim() === 'All Agents');
            if (allAgentsHeader && allAgentsHeader.parentElement) {
                allAgentsHeader.parentElement.insertBefore(bar, allAgentsHeader.nextSibling);
                inserted = true;
            }

            if (!inserted) {
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
                if (searchInput) {
                    let container = searchInput.parentElement;
                    while (container && container.parentElement && !container.classList.contains('flex')) {
                        container = container.parentElement;
                        if (container.classList.contains('gap-4')) break;
                    }
                    if (container && container.parentElement) {
                        container.parentElement.insertBefore(bar, container.nextSibling);
                        inserted = true;
                    }
                }
            }

            if (!inserted) {
                const main = document.querySelector('.flex.flex-col.gap-4');
                if (main && main.parentNode) {
                    main.parentNode.insertBefore(bar, main);
                    inserted = true;
                }
            }

            if (!inserted) {
                const contentArea = document.querySelector('main, [role="main"], .content');
                if (contentArea && contentArea.firstChild) {
                    contentArea.insertBefore(bar, contentArea.firstChild);
                } else {
                    document.body.insertBefore(bar, document.body.firstChild);
                }
            }

            updateButtonStates();
            console.log('[NinjaCat Seer Tags] Filter bar inserted');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in addTagFilterBar:', error);
        }
    }

    function createFilterRow(label, configMap, type) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
        row.className = type === 'category' ? 'seer-category-row' : 'seer-source-row';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:12px;font-weight:700;color:#4B5563;margin-right:6px;min-width:90px;';
        row.appendChild(labelEl);

        Object.entries(configMap).forEach(([key, item]) => {
            if (type === 'category' && !item.enabled) return;
            
            const btn = document.createElement('button');
            btn.innerHTML = `${item.icon} ${item.name}`;
            btn.className = type === 'category' ? 'seer-filter-btn' : 'seer-source-btn';
            btn.setAttribute('data-tag', item.name);
            btn.setAttribute('data-color', item.color);
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

        return row;
    }

    function createControlRow() {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap;';

        const hint = document.createElement('span');
        hint.textContent = 'Tip: Ctrl/Cmd+click to multi-select. Click 🏷️ on any agent to manually tag it.';
        hint.style.cssText = 'font-size:11px;color:#6B7280;flex:1;min-width:200px;';

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '↺ Reset';
        resetBtn.className = 'seer-reset-btn';
        resetBtn.style.cssText = 'background:#E5E7EB;color:#374151;border:none;border-radius:6px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;';
        resetBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCategorySelection(null, false, true);
            handleSourceSelection(null, false, true);
        };

        const settingsBtn = document.createElement('button');
        settingsBtn.innerHTML = '⚙️ Settings';
        settingsBtn.style.cssText = 'background:#4B5563;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;';
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        };

        row.appendChild(hint);
        row.appendChild(resetBtn);
        row.appendChild(settingsBtn);
        return row;
    }

    // ---- Filtering UX ----
    function handleCategorySelection(name, multi = false, forceReset = false) {
        if (forceReset || name === null) {
            activeCategoryFilters = [];
        } else if (multi) {
            activeCategoryFilters = toggleValue(activeCategoryFilters, name);
        } else {
            activeCategoryFilters = activeCategoryFilters.length === 1 && activeCategoryFilters[0] === name
                ? []
                : [name];
        }
        applyFilters();
    }

    function handleSourceSelection(name, multi = false, forceReset = false) {
        if (forceReset || name === null) {
            activeSourceFilters = [];
        } else if (multi) {
            activeSourceFilters = toggleValue(activeSourceFilters, name);
        } else {
            activeSourceFilters = activeSourceFilters.length === 1 && activeSourceFilters[0] === name
                ? []
                : [name];
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
                const tags = tagAttr.split(',').map(t => t.trim()).filter(Boolean);
                const sources = sourceAttr.split(',').map(t => t.trim()).filter(Boolean);

                const matchesCategory = catFilters.length === 0 || catFilters.some(tag => tags.includes(tag));
                const matchesSource = sourceFilters.length === 0 || sourceFilters.some(src => sources.includes(src));
                const shouldShow = matchesCategory && matchesSource;

                const baseDisplay = row.dataset.originalDisplay || (row.tagName === 'TR' ? 'table-row' : '');
                row.style.display = shouldShow ? baseDisplay : 'none';
                if (shouldShow) visible++;
            });

            console.log(`[NinjaCat Seer Tags] Filters applied. Visible rows: ${visible}/${rows.length}`);
            updateButtonStates();
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error applying filters:', error);
        }
    }

    function updateButtonStates() {
        const activeCats = new Set(activeCategoryFilters);
        const activeSources = new Set(activeSourceFilters);

        document.querySelectorAll('.seer-filter-btn').forEach(btn => {
            const tag = btn.getAttribute('data-tag');
            const active = activeCats.has(tag);
            btn.style.opacity = activeCats.size === 0 || active ? '1' : '0.6';
            btn.style.boxShadow = active ? '0 0 0 3px #111827' : '';
            btn.style.transform = active ? 'scale(1.05)' : 'scale(1)';
        });

        document.querySelectorAll('.seer-source-btn').forEach(btn => {
            const tag = btn.getAttribute('data-tag');
            const active = activeSources.has(tag);
            btn.style.opacity = activeSources.size === 0 || active ? '1' : '0.6';
            btn.style.boxShadow = active ? '0 0 0 3px #111827' : '';
            btn.style.transform = active ? 'scale(1.05)' : 'scale(1)';
        });

        const resetBtn = document.querySelector('.seer-reset-btn');
        if (resetBtn) {
            if (activeCategoryFilters.length === 0 && activeSourceFilters.length === 0) {
                resetBtn.style.boxShadow = '0 0 0 2px #3B82F6';
                resetBtn.style.background = '#D1D5DB';
            } else {
                resetBtn.style.boxShadow = '';
                resetBtn.style.background = '#E5E7EB';
            }
        }
    }

    // ---- Settings Modal with full CRUD ----
    function openSettingsModal() {
        try {
            const existing = document.getElementById('seer-settings-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-settings-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:900px;width:95%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);';
            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;">⚙️ Settings</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;">Manage divisions, patterns, and import/export your configuration.</p>
                
                <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                    <button id="seer-add-division" style="background:#10B981;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">+ Add Division</button>
                    <button id="seer-select-all" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✓ Enable All</button>
                    <button id="seer-deselect-all" style="background:#6B7280;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">✗ Disable All</button>
                    <button id="seer-export-config" style="background:#3B82F6;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">📤 Export</button>
                    <button id="seer-import-config" style="background:#8B5CF6;color:white;border:none;border-radius:6px;padding:8px 16px;font-weight:600;cursor:pointer;">📥 Import</button>
                </div>
                
                <div id="seer-category-list" style="margin-bottom:24px;"></div>
                
                <div style="padding-top:16px;border-top:1px solid #E5E7EB;display:flex;gap:12px;flex-wrap:wrap;">
                    <button id="seer-save-settings" style="flex:1;min-width:150px;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">💾 Save & Apply</button>
                    <button id="seer-reset-defaults" style="flex:1;min-width:150px;background:#EF4444;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">↺ Reset to Defaults</button>
                    <button id="seer-cancel-settings" style="flex:1;min-width:150px;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✕ Cancel</button>
                </div>
            `;

            renderCategoryList(modal.querySelector('#seer-category-list'));

            // Add Division
            modal.querySelector('#seer-add-division').onclick = () => {
                const newKey = 'custom_' + Date.now();
                config.categories[newKey] = {
                    name: 'NEW',
                    color: '#6B7280',
                    icon: '🏷️',
                    enabled: true
                };
                config.patterns[newKey] = ['[new]'];
                renderCategoryList(modal.querySelector('#seer-category-list'));
            };

            modal.querySelector('#seer-select-all').onclick = () => {
                modal.querySelectorAll('.category-toggle').forEach(cb => cb.checked = true);
            };
            modal.querySelector('#seer-deselect-all').onclick = () => {
                modal.querySelectorAll('.category-toggle').forEach(cb => cb.checked = false);
            };
            
            // Export
            modal.querySelector('#seer-export-config').onclick = () => {
                exportConfig();
            };
            
            // Import
            modal.querySelector('#seer-import-config').onclick = () => {
                importConfig(overlay);
            };

            modal.querySelector('#seer-save-settings').onclick = () => {
                saveSettingsFromModal(modal);
                overlay.remove();
                refreshPage();
            };
            modal.querySelector('#seer-reset-defaults').onclick = () => {
                if (confirm('Reset all settings to defaults? This will also clear all manual agent tags.')) {
                    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    agentTags = {};
                    saveConfig(config);
                    saveAgentTags(agentTags);
                    overlay.remove();
                    refreshPage();
                }
            };
            modal.querySelector('#seer-cancel-settings').onclick = () => overlay.remove();
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening settings:', error);
        }
    }

    function renderCategoryList(container) {
        container.innerHTML = '';
        
        Object.entries(config.categories).forEach(([key, category]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'seer-category-item';
            wrapper.setAttribute('data-key', key);
            wrapper.style.cssText = 'display:flex;flex-direction:column;padding:16px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:12px;background:#F9FAFB;';

            const header = document.createElement('div');
            header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;';
            
            // Checkbox
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.className = 'category-toggle';
            toggle.checked = category.enabled;
            toggle.style.cssText = 'width:20px;height:20px;cursor:pointer;';
            
            // Icon selector
            const iconSelect = document.createElement('select');
            iconSelect.className = 'category-icon';
            iconSelect.style.cssText = 'font-size:18px;padding:4px;border:1px solid #D1D5DB;border-radius:4px;cursor:pointer;';
            DEFAULT_ICONS.forEach(icon => {
                const opt = document.createElement('option');
                opt.value = icon;
                opt.textContent = icon;
                if (icon === category.icon) opt.selected = true;
                iconSelect.appendChild(opt);
            });
            // Add current icon if not in defaults
            if (!DEFAULT_ICONS.includes(category.icon)) {
                const opt = document.createElement('option');
                opt.value = category.icon;
                opt.textContent = category.icon;
                opt.selected = true;
                iconSelect.appendChild(opt);
            }
            
            // Name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'category-name';
            nameInput.value = category.name;
            nameInput.style.cssText = 'flex:1;min-width:100px;padding:6px 10px;border:1px solid #D1D5DB;border-radius:4px;font-weight:600;font-size:14px;';
            
            // Color picker
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'category-color';
            colorInput.value = category.color;
            colorInput.style.cssText = 'width:50px;height:32px;border:none;border-radius:4px;cursor:pointer;';
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete this division';
            deleteBtn.style.cssText = 'background:#FEE2E2;border:none;border-radius:4px;padding:6px 10px;cursor:pointer;font-size:16px;';
            deleteBtn.onclick = () => {
                if (confirm(`Delete division "${category.name}"?`)) {
                    delete config.categories[key];
                    delete config.patterns[key];
                    wrapper.remove();
                }
            };

            header.appendChild(toggle);
            header.appendChild(iconSelect);
            header.appendChild(nameInput);
            header.appendChild(colorInput);
            header.appendChild(deleteBtn);

            // Patterns textarea
            const patternsRow = document.createElement('div');
            const patternsLabel = document.createElement('label');
            patternsLabel.textContent = 'Keyword Patterns (comma-separated):';
            patternsLabel.style.cssText = 'display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:#6B7280;';
            
            const patternsInput = document.createElement('textarea');
            patternsInput.className = 'category-patterns';
            patternsInput.rows = 2;
            patternsInput.value = config.patterns[key]?.join(', ') || '';
            patternsInput.style.cssText = 'width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:4px;font-size:12px;font-family:monospace;box-sizing:border-box;';
            
            patternsRow.appendChild(patternsLabel);
            patternsRow.appendChild(patternsInput);

            wrapper.appendChild(header);
            wrapper.appendChild(patternsRow);
            container.appendChild(wrapper);
        });
    }

    function saveSettingsFromModal(modal) {
        try {
            const newCategories = {};
            const newPatterns = {};
            
            modal.querySelectorAll('.seer-category-item').forEach(item => {
                const key = item.getAttribute('data-key');
                const toggle = item.querySelector('.category-toggle');
                const iconSelect = item.querySelector('.category-icon');
                const nameInput = item.querySelector('.category-name');
                const colorInput = item.querySelector('.category-color');
                const patternsInput = item.querySelector('.category-patterns');
                
                const name = nameInput?.value?.trim() || 'UNNAMED';
                
                newCategories[key] = {
                    name: name,
                    color: colorInput?.value || '#6B7280',
                    icon: iconSelect?.value || '🏷️',
                    enabled: toggle?.checked ?? true
                };
                
                newPatterns[key] = patternsInput?.value?.split(',').map(p => p.trim()).filter(Boolean) || [];
            });
            
            config.categories = newCategories;
            config.patterns = newPatterns;
            saveConfig(config);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving settings:', error);
        }
    }

    // ---- Import/Export ----
    function exportConfig() {
        try {
            const exportData = {
                version: '1.4.0',
                exportedAt: new Date().toISOString(),
                config: config,
                agentTags: agentTags
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ninjacat-seer-tags-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('[NinjaCat Seer Tags] Configuration exported');
            alert('Configuration exported successfully!');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error exporting config:', error);
            alert('Error exporting configuration: ' + error.message);
        }
    }

    function importConfig(settingsOverlay) {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importData = JSON.parse(event.target.result);
                        
                        // Validate structure
                        if (!importData.config || !importData.config.categories) {
                            throw new Error('Invalid configuration file format');
                        }
                        
                        // Confirm import
                        const categoryCount = Object.keys(importData.config.categories).length;
                        const tagCount = Object.keys(importData.agentTags || {}).length;
                        
                        if (confirm(`Import configuration?\n\n• ${categoryCount} divisions\n• ${tagCount} agent tag assignments\n\nThis will replace your current settings.`)) {
                            config = importData.config;
                            agentTags = importData.agentTags || {};
                            
                            saveConfig(config);
                            saveAgentTags(agentTags);
                            
                            console.log('[NinjaCat Seer Tags] Configuration imported');
                            alert('Configuration imported successfully!');
                            
                            if (settingsOverlay) settingsOverlay.remove();
                            refreshPage();
                        }
                    } catch (parseError) {
                        console.error('[NinjaCat Seer Tags] Error parsing import file:', parseError);
                        alert('Error importing configuration: ' + parseError.message);
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error initiating import:', error);
            alert('Error importing configuration: ' + error.message);
        }
    }

    function refreshPage() {
        document.querySelectorAll('.seer-tags').forEach(el => el.remove());
        document.querySelectorAll('.seer-tag-agent-btn').forEach(el => el.remove());
        const bar = document.getElementById('seer-tag-bar');
        if (bar) bar.remove();
        setTimeout(runAll, 500);
    }

    function runAll() {
        try {
            expandShowAll();
            tagAgentCards();
            addTagFilterBar();
            applyFilters();
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
                console.log('[NinjaCat Seer Tags] DOM changed, re-running logic');
                runAll();
            }, 1000);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[NinjaCat Seer Tags] MutationObserver started');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeAndRun);
    } else {
        observeAndRun();
    }

})();
