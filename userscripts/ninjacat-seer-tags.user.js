// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.1.0
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.1.0');

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
        return DEFAULT_CONFIG;
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
            const agentCards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
            
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

                        // Try to insert badges below agent name
                        const nameDiv = card.querySelector('div.flex.items-center > div > div > p');
                        if (nameDiv && nameDiv.parentElement) {
                            nameDiv.parentElement.appendChild(tagDiv);
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
            bar.style.cssText = 'display:flex;gap:12px;margin:18px 0 12px 0;flex-wrap:wrap;align-items:center;';

            // Create buttons for each enabled category
            Object.entries(config.categories).forEach(([key, tag]) => {
                if (!tag.enabled) return;
                
                const btn = document.createElement('button');
                btn.innerHTML = `${tag.icon} ${tag.name}`;
                btn.style.cssText = `
                    background:${tag.color};
                    color:#fff;
                    border:none;
                    border-radius:9px;
                    padding:7px 15px;
                    font-size:15px;
                    font-weight:600;
                    letter-spacing:0.5px;
                    cursor:pointer;
                    transition:background 0.2s;
                `;
                btn.setAttribute('data-tag', tag.name);
                
                // Hover effects
                btn.onmouseenter = () => btn.style.background = darkenColor(tag.color, 0.85);
                btn.onmouseleave = () => btn.style.background = tag.color;
                btn.onclick = () => filterByTag(tag.name);
                
                bar.appendChild(btn);
            });

            // Settings button
            const settingsBtn = document.createElement('button');
            settingsBtn.innerHTML = '⚙️ Settings';
            settingsBtn.style.cssText = `
                margin-left:auto;
                background:#4B5563;
                color:#fff;
                border:none;
                border-radius:7px;
                padding:7px 16px;
                font-size:15px;
                font-weight:600;
                cursor:pointer;
            `;
            settingsBtn.onclick = openSettingsModal;
            bar.appendChild(settingsBtn);

            // Reset button
            const reset = document.createElement('button');
            reset.textContent = 'Reset';
            reset.style.cssText = `
                margin-left:12px;
                background:#E5E7EB;
                color:#111;
                border:none;
                border-radius:7px;
                padding:7px 16px;
                font-size:15px;
                font-weight:600;
                cursor:pointer;
            `;
            reset.onclick = () => filterByTag(null);
            bar.appendChild(reset);

            // Insert filter bar above agent list
            const main = document.querySelector('.flex.flex-col.gap-4');
            if (main && main.parentNode) {
                main.parentNode.insertBefore(bar, main);
                console.log('[NinjaCat Seer Tags] Filter bar inserted');
            } else {
                // Fallback: insert at beginning of body
                console.log('[NinjaCat Seer Tags] Main container not found, using fallback insertion');
                document.body.insertBefore(bar, document.body.firstChild);
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in addTagFilterBar:', error);
        }
    }

    // ---- Filtering logic ----
    function filterByTag(tagName) {
        try {
            console.log(`[NinjaCat Seer Tags] Filtering by: ${tagName || 'Reset'}`);
            
            const agentCards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
            
            agentCards.forEach(card => {
                try {
                    const tagsAttr = card.getAttribute('data-seer-tags') || '';
                    const tags = tagsAttr.split(',').filter(t => t.trim());
                    
                    // Show if no filter OR tag matches
                    const shouldShow = !tagName || tags.includes(tagName);
                    card.style.display = shouldShow ? '' : 'none';
                } catch (cardError) {
                    console.error('[NinjaCat Seer Tags] Error filtering card:', cardError);
                }
            });

            // Update button styling
            const bar = document.getElementById('seer-tag-bar');
            if (bar) {
                Array.from(bar.querySelectorAll('button')).forEach(btn => {
                    if (!tagName && btn.textContent === 'Reset') {
                        btn.style.boxShadow = '0 0 0 2px #3B82F6';
                    } else if (tagName && btn.textContent.includes(tagName)) {
                        btn.style.boxShadow = '0 0 0 3px #000';
                    } else {
                        btn.style.boxShadow = '';
                    }
                });
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
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
            `;

            // Modal HTML
            modal.innerHTML = `
                <h2 style="margin:0 0 16px 0; font-size:24px; font-weight:700;">⚙️ Category Settings</h2>
                <p style="margin:0 0 24px 0; color:#6B7280;">Toggle categories, customize colors, and manage patterns</p>
                
                <div id="seer-category-list"></div>
                
                <div style="margin-top:24px; padding-top:24px; border-top:1px solid #E5E7EB; display:flex; gap:12px;">
                    <button id="seer-save-settings" style="flex:1; background:#3B82F6; color:white; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        Save & Apply
                    </button>
                    <button id="seer-reset-defaults" style="flex:1; background:#6B7280; color:white; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        Reset to Defaults
                    </button>
                    <button id="seer-cancel-settings" style="flex:1; background:#E5E7EB; color:#111; border:none; border-radius:8px; padding:12px; font-weight:600; cursor:pointer;">
                        Cancel
                    </button>
                </div>
            `;

            // Populate category list
            const categoryList = modal.querySelector('#seer-category-list');
            Object.entries(config.categories).forEach(([key, category]) => {
                const categoryRow = document.createElement('div');
                categoryRow.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    border: 1px solid #E5E7EB;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    background: #F9FAFB;
                `;

                categoryRow.innerHTML = `
                    <input type="checkbox" id="toggle-${key}" ${category.enabled ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
                    <span style="margin-left:12px; font-size:20px;">${category.icon}</span>
                    <strong style="margin-left:8px; flex:1; font-size:16px;">${category.name}</strong>
                    <input type="color" id="color-${key}" value="${category.color}" style="width:50px; height:30px; border:none; border-radius:4px; cursor:pointer;">
                    <span style="margin-left:8px; font-size:12px; color:#6B7280;">${config.patterns[key]?.length || 0} patterns</span>
                `;

                categoryList.appendChild(categoryRow);
            });

            // Event handlers
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

                if (toggle) {
                    config.categories[key].enabled = toggle.checked;
                }
                if (colorInput) {
                    config.categories[key].color = colorInput.value;
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
