// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents with customizable categories and data sources
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.3.1');

    // ---- Configuration Management ----
    const CONFIG_KEY = 'ninjacat-seer-tags-config';
    
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

    function saveConfig(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
            console.log('[NinjaCat Seer Tags] Configuration saved');
            return true;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving config:', error);
            return false;
        }
    }

    let config = loadConfig();

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

    function getTagsForText(text) {
        const tags = [];
        const lowerText = (text || '').toLowerCase();
        
        for (const [key, words] of Object.entries(config.patterns)) {
            const category = config.categories[key];
            if (!category || !category.enabled) continue;
            
            if (words.some(word => lowerText.includes(word))) {
                tags.push(category);
            }
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
                    if (card.querySelector('.seer-tags')) {
                        return;
                    }

                    const txt = card.innerText || '';
                    const tags = getTagsForText(txt);
                    const sources = detectDataSources(card);

                    card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));
                    card.setAttribute('data-seer-datasources', sources.join(','));

                    if (!card.dataset.originalDisplay) {
                        const computed = getComputedStyle(card).display || '';
                        card.dataset.originalDisplay = computed === 'none' ? '' : computed;
                    }

                    if (tags.length > 0) {
                        const tagDiv = document.createElement('div');
                        tagDiv.className = 'seer-tags';
                        tagDiv.style.cssText = 'margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;';
                        tags.forEach(tag => {
                            const badge = document.createElement('span');
                            badge.style.cssText = 'margin-right:5px;';
                            badge.innerHTML = `${tag.icon} <span style="background:${tag.color};color:#fff;padding:2px 7px;border-radius:6px;font-size:12px;font-weight:500;">${tag.name}</span>`;
                            tagDiv.appendChild(badge);
                        });

                        let insertionTarget = card.querySelector('[data-automation-id*="agent-name"], [data-testid*="agent-name"], div.flex.items-center > div > div > p');
                        if (!insertionTarget && card.tagName === 'TR') {
                            insertionTarget = card.querySelector('td');
                        }
                        if (insertionTarget && insertionTarget.parentElement) {
                            insertionTarget.parentElement.appendChild(tagDiv);
                        } else {
                            card.appendChild(tagDiv);
                        }
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

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        labelEl.style.cssText = 'font-size:12px;font-weight:700;color:#4B5563;margin-right:6px;min-width:90px;';
        row.appendChild(labelEl);

        Object.entries(configMap).forEach(([key, item]) => {
            const btn = document.createElement('button');
            btn.innerHTML = `${item.icon} ${item.name}`;
            btn.className = type === 'category' ? 'seer-filter-btn' : 'seer-source-btn';
            btn.setAttribute('data-tag', item.name);
            btn.setAttribute('data-color', item.color);
            btn.style.cssText = `
                background:${item.color};
                color:#fff;
                border:none;
                border-radius:6px;
                padding:5px 10px;
                font-size:12px;
                font-weight:600;
                cursor:pointer;
                transition:all 0.2s;
            `;

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
        row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:4px;';

        const hint = document.createElement('span');
        hint.textContent = 'Tip: hold Ctrl/Cmd to multi-select divisions or sources.';
        hint.style.cssText = 'font-size:11px;color:#6B7280;flex:1;';

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

    // ---- Settings Modal (categories only) ----
    function openSettingsModal() {
        try {
            const existing = document.getElementById('seer-settings-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'seer-settings-modal';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;';

            const modal = document.createElement('div');
            modal.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:800px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);';
            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0;font-size:24px;font-weight:700;">⚙️ Division Settings</h2>
                <p style="margin:0 0 16px 0;color:#6B7280;">Toggle categories, customize colors, and edit keyword patterns.</p>
                <div style="margin-bottom:16px;display:flex;gap:8px;">
                    <button id="seer-select-all" style="flex:1;background:#10B981;color:white;border:none;border-radius:6px;padding:8px;font-weight:600;cursor:pointer;">✓ Select All</button>
                    <button id="seer-deselect-all" style="flex:1;background:#EF4444;color:white;border:none;border-radius:6px;padding:8px;font-weight:600;cursor:pointer;">✗ Deselect All</button>
                </div>
                <div id="seer-category-list" style="margin-bottom:24px;"></div>
                <div style="padding-top:24px;border-top:1px solid #E5E7EB;display:flex;gap:12px;">
                    <button id="seer-save-settings" style="flex:1;background:#3B82F6;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">💾 Save & Apply</button>
                    <button id="seer-reset-defaults" style="flex:1;background:#6B7280;color:white;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">↺ Reset to Defaults</button>
                    <button id="seer-cancel-settings" style="flex:1;background:#E5E7EB;color:#111;border:none;border-radius:8px;padding:12px;font-weight:600;cursor:pointer;">✕ Cancel</button>
                </div>
            `;

            const list = modal.querySelector('#seer-category-list');
            Object.entries(config.categories).forEach(([key, category]) => {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'display:flex;flex-direction:column;padding:16px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:12px;background:#F9FAFB;';

                const header = document.createElement('div');
                header.style.cssText = 'display:flex;align-items:center;margin-bottom:12px;';
                header.innerHTML = `
                    <input type="checkbox" id="toggle-${key}" class="category-toggle" ${category.enabled ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer;">
                    <span style="margin-left:12px;font-size:20px;">${category.icon}</span>
                    <strong style="margin-left:8px;flex:1;font-size:16px;">${category.name}</strong>
                    <input type="color" id="color-${key}" value="${category.color}" style="width:50px;height:30px;border:none;border-radius:4px;cursor:pointer;margin-right:8px;">
                `;

                const patternsRow = document.createElement('div');
                patternsRow.innerHTML = `
                    <label style="display:block;margin-bottom:4px;font-size:12px;font-weight:600;color:#6B7280;">Keyword Patterns (comma-separated):</label>
                    <textarea id="patterns-${key}" rows="2" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:4px;font-size:12px;font-family:monospace;">${config.patterns[key]?.join(', ') || ''}</textarea>
                `;

                wrapper.appendChild(header);
                wrapper.appendChild(patternsRow);
                list.appendChild(wrapper);
            });

            modal.querySelector('#seer-select-all').onclick = () => {
                document.querySelectorAll('.category-toggle').forEach(cb => cb.checked = true);
            };
            modal.querySelector('#seer-deselect-all').onclick = () => {
                document.querySelectorAll('.category-toggle').forEach(cb => cb.checked = false);
            };
            modal.querySelector('#seer-save-settings').onclick = () => {
                saveSettings();
                overlay.remove();
                refreshPage();
            };
            modal.querySelector('#seer-reset-defaults').onclick = () => {
                if (confirm('Reset all settings to defaults?')) {
                    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    saveConfig(config);
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

    function saveSettings() {
        try {
            Object.keys(config.categories).forEach(key => {
                const toggle = document.getElementById(`toggle-${key}`);
                const colorInput = document.getElementById(`color-${key}`);
                const patternsInput = document.getElementById(`patterns-${key}`);

                if (toggle) config.categories[key].enabled = toggle.checked;
                if (colorInput) config.categories[key].color = colorInput.value;
                if (patternsInput) {
                    const patterns = patternsInput.value.split(',').map(p => p.trim()).filter(Boolean);
                    config.patterns[key] = patterns;
                }
            });
            saveConfig(config);
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving settings:', error);
        }
    }

    function refreshPage() {
        document.querySelectorAll('.seer-tags').forEach(el => el.remove());
        const bar = document.getElementById('seer-tag-bar');
        if (bar) bar.remove();
        setTimeout(runAll, 500);
    }

    // ---- Utilities ----
    function darkenColor(hex, factor = 0.85) {
        try {
            if (!hex || !hex.startsWith('#')) return hex;
            const num = parseInt(hex.slice(1), 16);
            let r = (num >> 16) & 255;
            let g = (num >> 8) & 255;
            let b = num & 255;
            r = Math.floor(r * factor);
            g = Math.floor(g * factor);
            b = Math.floor(b * factor);
            return `rgb(${r},${g},${b})`;
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in darkenColor:', error);
            return hex;
        }
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
