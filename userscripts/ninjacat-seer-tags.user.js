// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents with customizable categories
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.2.1');

    // ---- Configuration Management ----
    const CONFIG_KEY = 'ninjacat-seer-tags-config';
    
    // Default configuration based on agent analysis
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
            ops:      ['[ops]', 'taxonomy', 'operation', 'process', 'admin', 'calendar'],
            wip:     ['[wip]', '[lydia wip]', '[taylor', '[wil wip]', 'testing', 'test version'],
            dnu:     ['[dnu]', '[do not use]', '[donotuse]', 'sandbox'],
            prod:    ['[prod]'],
            client:  ['[paychex]', '[rightway]', '[veolia]', '[chewy]', '[brightstar]', '[pandadoc]', '[trex]'],
            utility: ['[utility]', 'assistant', 'helper', 'api', 'connector', 'builder', 'retriever', 'extractor', 'scraper']
        }
    };

    // Load configuration from localStorage or use defaults
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

    // Save configuration to localStorage
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

    // Current configuration
    let config = loadConfig();

    // Debounce timer for MutationObserver
    let debounceTimer = null;

    // Remember which selector is currently being used for rows
    let activeRowSelector = null;

    // ---- Utility: Locate agent rows ----
    function getAgentRows(log = true) {
        const selectors = [
            '[data-automation-id^="data-table-row"]',
            '[data-automation-id*="agents-table-row"]',
            '[data-testid^="agents-table-row"]',
            'div[data-automation-id*="table-row"]',
            'div[data-testid*="table-row"]',
            'div[data-testid*="agent-row"]',
            'table tbody tr',
            '[role="row"][data-row-key]',
            'div[role="row"]'
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

    // ---- Utility: Get tags for text ----
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

    // ---- Auto-expand: Click "Show All" if present ----
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

    // ---- Tag agent cards and add data attribute ----
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
                    // Prevent duplicate tagging
                    if (card.querySelector('.seer-tags')) {
                        return;
                    }

                    // Use name/description for tagging
                    const txt = card.innerText || '';

                    // Find all tags
                    const tags = getTagsForText(txt);

                    // Save tags as data attribute for filtering
                    card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));

                    // Remember original display style for filtering
                    if (!card.dataset.originalDisplay) {
                        const computed = getComputedStyle(card).display || '';
                        card.dataset.originalDisplay = computed === 'none' ? '' : computed;
                    }

                    // Add visible tag badges if tags exist
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

                        // Try to insert badges below agent name or first column
                        let insertionTarget = card.querySelector('[data-automation-id*="agent-name"], [data-testid*="agent-name"], div.flex.items-center > div > div > p');

                        if (!insertionTarget && card.tagName === 'TR') {
                            insertionTarget = card.querySelector('td');
                        }

                        if (insertionTarget && insertionTarget.parentElement) {
                            insertionTarget.parentElement.appendChild(tagDiv);
                        } else {
                            // Fallback: append to card if specific selector fails
                            card.appendChild(tagDiv);
                        }
                    }
                } catch (cardError) {
                    console.error(`[NinjaCat Seer Tags] Error tagging card ${index}:`, cardError);
                }
            });
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in tagAgentCards:', error);
        }
    }

    // ---- Add Tag Filter Bar (if not present) ----
    function addTagFilterBar() {
        try {
            // Only add once
            if (document.getElementById('seer-tag-bar')) {
                return;
            }

            console.log('[NinjaCat Seer Tags] Creating filter bar');

            const bar = document.createElement('div');
            bar.id = 'seer-tag-bar';
            bar.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;padding:12px;background:#F9FAFB;border-radius:8px;border:1px solid #E5E7EB;';

            // Create buttons for each enabled category
            Object.entries(config.categories).forEach(([key, tag]) => {
                if (!tag.enabled) return;
                
                const btn = document.createElement('button');
                btn.innerHTML = `${tag.icon} ${tag.name}`;
                btn.className = 'seer-filter-btn';
                btn.style.cssText = `
                    background:${tag.color};
                    color:#fff;
                    border:none;
                    border-radius:6px;
                    padding:6px 12px;
                    font-size:13px;
                    font-weight:600;
                    cursor:pointer;
                    transition:all 0.2s;
                `;
                btn.setAttribute('data-tag', tag.name);
                btn.setAttribute('data-color', tag.color);
                
                // Hover effects
                btn.onmouseenter = function() {
                    this.style.background = darkenColor(tag.color, 0.85);
                    this.style.transform = 'scale(1.05)';
                };
                btn.onmouseleave = function() {
                    this.style.background = tag.color;
                    this.style.transform = 'scale(1)';
                };
                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[NinjaCat Seer Tags] Button clicked:', tag.name);
                    filterByTag(tag.name);
                };
                
                bar.appendChild(btn);
            });

            // Reset button
            const reset = document.createElement('button');
            reset.textContent = '↺ Reset';
            reset.className = 'seer-reset-btn';
            reset.style.cssText = `
                background:#E5E7EB;
                color:#374151;
                border:none;
                border-radius:6px;
                padding:6px 12px;
                font-size:13px;
                font-weight:600;
                cursor:pointer;
                transition:all 0.2s;
            `;
            reset.onmouseenter = function() {
                this.style.background = '#D1D5DB';
            };
            reset.onmouseleave = function() {
                this.style.background = '#E5E7EB';
            };
            reset.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[NinjaCat Seer Tags] Reset clicked');
                filterByTag(null);
            };
            bar.appendChild(reset);

            // Settings button
            const settingsBtn = document.createElement('button');
            settingsBtn.innerHTML = '⚙️ Settings';
            settingsBtn.style.cssText = `
                margin-left:auto;
                background:#4B5563;
                color:#fff;
                border:none;
                border-radius:6px;
                padding:6px 12px;
                font-size:13px;
                font-weight:600;
                cursor:pointer;
                transition:all 0.2s;
            `;
            settingsBtn.onmouseenter = function() {
                this.style.background = '#374151';
            };
            settingsBtn.onmouseleave = function() {
                this.style.background = '#4B5563';
            };
            settingsBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                openSettingsModal();
            };
            bar.appendChild(settingsBtn);

            // Try multiple insertion strategies to find the best spot
            let inserted = false;

            // Strategy 1: Find "All Agents" section header
            const allAgentsHeader = Array.from(document.querySelectorAll('h2, h3, div')).find(el => 
                el.textContent.trim() === 'All Agents'
            );
            
            if (allAgentsHeader && allAgentsHeader.parentElement) {
                console.log('[NinjaCat Seer Tags] Found All Agents header, inserting after it');
                allAgentsHeader.parentElement.insertBefore(bar, allAgentsHeader.nextSibling);
                inserted = true;
            }

            // Strategy 2: Find search input and insert after its container
            if (!inserted) {
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
                if (searchInput) {
                    // Find the parent container (usually a few levels up)
                    let container = searchInput.parentElement;
                    while (container && !container.classList.contains('flex') && container.parentElement) {
                        container = container.parentElement;
                        if (container.tagName === 'DIV' && container.classList.length > 2) break;
                    }
                    if (container && container.parentElement) {
                        console.log('[NinjaCat Seer Tags] Found search container, inserting after it');
                        container.parentElement.insertBefore(bar, container.nextSibling);
                        inserted = true;
                    }
                }
            }

            // Strategy 3: Look for the main content area with flex layout
            if (!inserted) {
                const main = document.querySelector('.flex.flex-col.gap-4');
                if (main && main.parentNode) {
                    console.log('[NinjaCat Seer Tags] Found main flex container, inserting before it');
                    main.parentNode.insertBefore(bar, main);
                    inserted = true;
                }
            }

            // Fallback: Insert near the top of the content area
            if (!inserted) {
                console.log('[NinjaCat Seer Tags] Using fallback insertion');
                const contentArea = document.querySelector('main, [role="main"], .content');
                if (contentArea && contentArea.firstChild) {
                    contentArea.insertBefore(bar, contentArea.firstChild);
                    inserted = true;
                } else {
                    document.body.insertBefore(bar, document.body.firstChild);
                }
            }

            if (inserted) {
                console.log('[NinjaCat Seer Tags] Filter bar inserted successfully');
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in addTagFilterBar:', error);
        }
    }

    // ---- Filtering logic ----
    function filterByTag(tagName) {
        try {
            console.log(`[NinjaCat Seer Tags] Filtering by: ${tagName || 'Reset'}`);
            
            const agentCards = getAgentRows(false);
            console.log(`[NinjaCat Seer Tags] Found ${agentCards.length} agent cards to filter`);
            
            let visibleCount = 0;
            agentCards.forEach(card => {
                try {
                    const tagsAttr = card.getAttribute('data-seer-tags') || '';
                    const tags = tagsAttr.split(',').map(t => t.trim()).filter(t => t);
                    
                    // Show if no filter OR tag matches
                    const shouldShow = !tagName || tags.includes(tagName);
                    const originalDisplay = card.dataset.originalDisplay || '';
                    
                    if (shouldShow) {
                        card.style.display = originalDisplay || (card.tagName === 'TR' ? 'table-row' : '');
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                    
                    console.log(`[NinjaCat Seer Tags] Card tags: [${tags.join(', ')}], Show: ${shouldShow}`);
                } catch (cardError) {
                    console.error('[NinjaCat Seer Tags] Error filtering card:', cardError);
                }
            });

            console.log(`[NinjaCat Seer Tags] Filtering complete: ${visibleCount}/${agentCards.length} visible`);

            // Update button styling
            const filterBtns = document.querySelectorAll('.seer-filter-btn');
            const resetBtn = document.querySelector('.seer-reset-btn');
            
            filterBtns.forEach(btn => {
                const btnTag = btn.getAttribute('data-tag');
                const btnColor = btn.getAttribute('data-color');
                
                if (tagName && btnTag === tagName) {
                    btn.style.boxShadow = '0 0 0 3px #000';
                    btn.style.transform = 'scale(1.05)';
                } else {
                    btn.style.boxShadow = '';
                    btn.style.transform = 'scale(1)';
                }
            });

            if (resetBtn) {
                if (!tagName) {
                    resetBtn.style.boxShadow = '0 0 0 2px #3B82F6';
                    resetBtn.style.background = '#D1D5DB';
                } else {
                    resetBtn.style.boxShadow = '';
                    resetBtn.style.background = '#E5E7EB';
                }
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in filterByTag:', error);
        }
    }

    // ---- Settings Modal ----
    function openSettingsModal() {
        try {
            // Remove existing modal if present
            const existingModal = document.getElementById('seer-settings-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'seer-settings-modal';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            // Create modal content
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 800px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            `;

            // Modal HTML
            modal.innerHTML = `
                <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:700;">⚙️ Category Settings</h2>
                <p style="margin:0 0 16px 0; color:#6B7280;">Toggle categories, customize colors, and manage keyword patterns</p>
                
                <div style="margin-bottom:16px; display:flex; gap:8px;">
                    <button id="seer-select-all" style="flex:1; background:#10B981; color:white; border:none; border-radius:6px; padding:8px; font-weight:600; cursor:pointer;">
                        ✓ Select All
                    </button>
                    <button id="seer-deselect-all" style="flex:1; background:#EF4444; color:white; border:none; border-radius:6px; padding:8px; font-weight:600; cursor:pointer;">
                        ✗ Deselect All
                    </button>
                </div>
                
                <div id="seer-category-list" style="margin-bottom:24px;"></div>
                
                <div style="padding-top:24px; border-top:1px solid #E5E7EB; display:flex; gap:12px;">
                    <button id="seer-save-settings" style="flex:1; background:#3B82F6; color:white; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        💾 Save & Apply
                    </button>
                    <button id="seer-reset-defaults" style="flex:1; background:#6B7280; color:white; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        ↺ Reset to Defaults
                    </button>
                    <button id="seer-cancel-settings" style="flex:1; background:#E5E7EB; color:#111; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        ✕ Cancel
                    </button>
                </div>
            `;

            // Populate category list
            const categoryList = modal.querySelector('#seer-category-list');
            Object.entries(config.categories).forEach(([key, category]) => {
                const categoryRow = document.createElement('div');
                categoryRow.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    padding: 16px;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    background: #F9FAFB;
                `;

                const headerRow = document.createElement('div');
                headerRow.style.cssText = 'display: flex; align-items: center; margin-bottom: 12px;';
                
                headerRow.innerHTML = `
                    <input type="checkbox" id="toggle-${key}" class="category-toggle" ${category.enabled ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
                    <span style="margin-left:12px; font-size:20px;">${category.icon}</span>
                    <strong style="margin-left:8px; flex:1; font-size:16px;">${category.name}</strong>
                    <input type="color" id="color-${key}" value="${category.color}" style="width:50px; height:30px; border:none; border-radius:4px; cursor:pointer; margin-right:8px;">
                `;

                const patternsRow = document.createElement('div');
                patternsRow.style.cssText = 'margin-top:8px;';
                patternsRow.innerHTML = `
                    <label style="display:block; margin-bottom:4px; font-size:12px; font-weight:600; color:#6B7280;">
                        Keyword Patterns (comma-separated):
                    </label>
                    <textarea id="patterns-${key}" rows="2" style="width:100%; padding:8px; border:1px solid #D1D5DB; border-radius:4px; font-size:12px; font-family:monospace;">${config.patterns[key]?.join(', ') || ''}</textarea>
                `;

                categoryRow.appendChild(headerRow);
                categoryRow.appendChild(patternsRow);
                categoryList.appendChild(categoryRow);
            });

            // Event handlers
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
                if (confirm('Reset all settings to defaults? This cannot be undone.')) {
                    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                    saveConfig(config);
                    overlay.remove();
                    refreshPage();
                }
            };

            modal.querySelector('#seer-cancel-settings').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            };

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            console.log('[NinjaCat Seer Tags] Settings modal opened');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error opening settings:', error);
        }
    }

    // Save settings from modal
    function saveSettings() {
        try {
            Object.keys(config.categories).forEach(key => {
                const toggle = document.getElementById(`toggle-${key}`);
                const colorInput = document.getElementById(`color-${key}`);
                const patternsInput = document.getElementById(`patterns-${key}`);

                if (toggle) {
                    config.categories[key].enabled = toggle.checked;
                }
                if (colorInput) {
                    config.categories[key].color = colorInput.value;
                }
                if (patternsInput) {
                    const patterns = patternsInput.value
                        .split(',')
                        .map(p => p.trim())
                        .filter(p => p.length > 0);
                    config.patterns[key] = patterns;
                }
            });

            saveConfig(config);
            console.log('[NinjaCat Seer Tags] Settings saved successfully');
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error saving settings:', error);
        }
    }

    // Refresh the page to apply changes
    function refreshPage() {
        // Remove existing tags and filter bar
        document.querySelectorAll('.seer-tags').forEach(el => el.remove());
        const bar = document.getElementById('seer-tag-bar');
        if (bar) bar.remove();

        // Re-run tagging logic
        setTimeout(runAll, 500);
    }

    // ---- Utility: Darken hex color (for hover) ----
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

    // ---- Core logic: expand, tag, add filter ----
    function runAll() {
        try {
            console.log('[NinjaCat Seer Tags] Running main logic');
            expandShowAll();
            tagAgentCards();
            addTagFilterBar();
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in runAll:', error);
        }
    }

    // ---- Observe for SPA changes and re-run core logic ----
    function observeAndRun() {
        // Initial run after DOM is ready
        console.log('[NinjaCat Seer Tags] Initial run scheduled');
        setTimeout(runAll, 1500);

        // Observe body for content changes (SPA navigation)
        const observer = new MutationObserver(() => {
            // Clear existing timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            // Debounce: wait for DOM to settle before re-running
            debounceTimer = setTimeout(() => {
                console.log('[NinjaCat Seer Tags] DOM changed, re-running logic');
                runAll();
            }, 1000);
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        console.log('[NinjaCat Seer Tags] MutationObserver started');
    }

    // ---- Start everything! ----
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeAndRun);
    } else {
        // DOM already loaded
        observeAndRun();
    }

})();
