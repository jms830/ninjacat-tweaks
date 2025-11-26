// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents (works with dynamic SPA)
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

    console.log('[NinjaCat Seer Tags] Script loaded v1.0.0');

    // ---- 1. Define Seer Categories and Patterns ----
    const categories = {
        seo:        { name: 'SEO', color: '#F59E0B', icon: '🔍' },
        pdm:        { name: 'PDM', color: '#3B82F6', icon: '💸' },
        analytics:  { name: 'Analytics', color: '#10B981', icon: '📈' },
        cre:        { name: 'Creative', color: '#EC4899', icon: '🎨' },
        ops:        { name: 'Ops', color: '#6B7280', icon: '🛠️' },
        ce:         { name: 'CE', color: '#8B5CF6', icon: '🤝' },
        pm:         { name: 'PM', color: '#F97316', icon: '📅' }
    };

    const patterns = {
        seo:       ['seo', 'keyword', 'organic', 'serp', 'search intent', 'landing page', 'content gap', 'people also ask'],
        pdm:       ['paid', 'ppc', 'ad copy', 'budget', 'google ads', 'media mix', 'campaign', 'spend', 'paid search'],
        analytics: ['analytics', 'anomalie', 'ga4', 'seer signals', 'bq', 'report', 'data', 'insights'],
        cre:       ['creative', 'design', 'logo', 'fatigue', 'tiktok', 'unique content'],
        ops:       ['calendar', 'ops', 'taxonomy', 'operation', 'process', 'admin'],
        ce:        ['client', 'call prep', 'engagement'],
        pm:        ['project', 'timeline', 'manage', 'schedule']
    };

    // Debounce timer for MutationObserver
    let debounceTimer = null;

    // ---- 2. Utility: Get tags for text ----
    function getTagsForText(text) {
        const tags = [];
        const lowerText = (text || '').toLowerCase();
        
        for (const [key, words] of Object.entries(patterns)) {
            if (words.some(word => lowerText.includes(word))) {
                tags.push(categories[key]);
            }
        }
        return tags;
    }

    // ---- 3. Auto-expand: Click "Show All" if present ----
    function expandShowAll() {
        try {
            const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');
            
            // Check if button exists and is visible (offsetParent !== null means visible)
            if (showAllBtn && showAllBtn.offsetParent !== null) {
                console.log('[NinjaCat Seer Tags] Clicking "Show All" button');
                showAllBtn.click();
            }
        } catch (error) {
            console.error('[NinjaCat Seer Tags] Error in expandShowAll:', error);
        }
    }

    // ---- 4. Tag agent cards and add data attribute ----
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

    // ---- 5. Add Tag Filter Bar (if not present) ----
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

            // Create buttons for each division
            Object.values(categories).forEach(tag => {
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

    // ---- 6. Filtering logic ----
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

    // ---- 7. Utility: Darken hex color (for hover) ----
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

    // ---- 8. Core logic: expand, tag, add filter ----
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

    // ---- 9. Observe for SPA changes and re-run core logic ----
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

    // ---- 10. Start everything! ----
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeAndRun);
    } else {
        // DOM already loaded
        observeAndRun();
    }

})();
