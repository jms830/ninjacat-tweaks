// ==UserScript==
// @name         NinjaCat Chat Export
// @namespace    http://tampermonkey.net/
// @version      2.6.0
// @description  Export NinjaCat agent chats to PDF (print) or Markdown, with expand/collapse controls
// @author       NinjaCat Tweaks
// @match        https://app.ninjacat.io/agency/data/agents/*/chat/*
// @match        https://app.mymarketingreports.com/agency/data/agents/*/chat/*
// @grant        none
// @run-at       document-end
// @homepage     https://github.com/jms830/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-export.meta.js
// @downloadURL  https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-export.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('[NinjaCat Chat Export] Script loaded v2.6.0');

    let exportButtonAdded = false;
    let printEnhancementsAdded = false;

    // ---- Print Styles ----
    // Goal: Preserve original layout as much as possible, only hide sidebars and add header
    const printStyles = `
        @media print {
            /* ============================================
               HIDE SIDEBARS AND NON-CONTENT ELEMENTS
               ============================================ */
            
            /* Hide left sidebar */
            .njc-main-menu {
                display: none !important;
            }

            /* Hide right sidebar (agent info panel) */
            .flex.flex-col.min-w-\\[320px\\].w-\\[320px\\] {
                display: none !important;
            }

            /* Hide the back button / header navigation */
            .flex.text-blue-100.items-center.py-\\[15px\\] {
                display: none !important;
            }

            /* Hide the message input area at bottom */
            .flex.flex-col.relative.max-w-\\[840px\\] {
                display: none !important;
            }

            /* Hide our export controls */
            #ninjacat-export-controls {
                display: none !important;
            }

            /* Hide hover buttons (edit, copy) */
            .flex.justify-end .opacity-0 {
                display: none !important;
            }

            /* Hide download/expand buttons on images */
            .absolute.right-4.bottom-6 {
                display: none !important;
            }

            /* ============================================
               LAYOUT: Expand chat to full width
               ============================================ */
            
            .flex.h-screen.ml-auto.w-\\[95\\%\\] {
                width: 100% !important;
                margin-left: 0 !important;
                height: auto !important;
                max-height: none !important;
            }

            .max-h-screen.flex.flex-col.flex-grow {
                padding: 0 20px !important;
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
            }

            /* Remove scroll constraints to show full chat */
            .overflow-y-auto,
            .overflow-auto,
            .conversationMessagesContainer {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
            }

            .conversationMessagesContainer {
                max-width: 100% !important;
                padding: 0 !important;
            }

            .max-w-\\[840px\\] {
                max-width: 100% !important;
            }

            .h-screen {
                height: auto !important;
                max-height: none !important;
            }

            .flex-grow {
                flex-grow: 0 !important;
            }

            #assistants-ui,
            #assistants-ui > div,
            #assistants-ui .flex {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
            }

            .njc-body {
                padding: 0 !important;
                margin: 0 !important;
            }

            .no-print-padding {
                padding: 0 !important;
            }

            /* ============================================
               PAGE SETTINGS
               ============================================ */
            @page {
                margin: 0.5in;
                size: auto;
            }

            /* ============================================
               IMAGES
               ============================================ */
            img {
                max-width: 100% !important;
                page-break-inside: avoid;
            }

            .styled-chat-message {
                page-break-inside: avoid;
            }

            /* ============================================
               PRINT HEADER
               ============================================ */
            #ninjacat-print-header {
                display: block !important;
                padding: 20px 0 !important;
                margin: 0 0 20px 0 !important;
                border-bottom: 2px solid #3B82F6 !important;
            }

            /* ============================================
               USER MESSAGE LABELS (print only)
               ============================================ */
            .ninjacat-user-label {
                display: block !important;
                margin-top: 24px !important;
            }

            .ninjacat-agent-label {
                display: block !important;
                margin-top: 24px !important;
            }

            /* ============================================
               LINKS - Make them blue
               ============================================ */
            a, a:visited {
                color: #2563EB !important;
                text-decoration: underline !important;
            }

            /* ============================================
               TASK COMPLETED SECTION - Keep original style
               but ensure it's not inside user message box
               ============================================ */
            
            /* Hide the collapse arrow icon */
            [data-is-collapsed] {
                display: none !important;
            }

            /* Ensure tasks completed stays visible and separate */
            .cursor-pointer {
                margin-top: 8px !important;
            }
        }

        /* ============================================
           SCREEN STYLES - Hide print-only elements
           ============================================ */
        #ninjacat-print-header {
            display: none;
        }

        .ninjacat-user-label,
        .ninjacat-agent-label {
            display: none;
        }
    `;

    // ---- Initialize ----
    function init() {
        injectPrintStyles();
        setupKeyboardShortcuts();

        const checkInterval = setInterval(() => {
            const chatContainer = document.querySelector('#assistants-ui');

            if (chatContainer && !exportButtonAdded) {
                addExportControls();
                exportButtonAdded = true;
                clearInterval(checkInterval);
            }
        }, 1000);

        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    function injectPrintStyles() {
        const styleEl = document.createElement('style');
        styleEl.id = 'ninjacat-print-styles';
        styleEl.textContent = printStyles;
        document.head.appendChild(styleEl);
        console.log('[NinjaCat Chat Export] Print styles injected');
    }

    // ---- Add Print Enhancements (labels, header) ----
    function addPrintEnhancements() {
        if (printEnhancementsAdded) {
            updatePrintHeader();
            return;
        }

        const messagesContainer = document.querySelector('.conversationMessagesContainer');
        if (!messagesContainer) {
            console.log('[NinjaCat Chat Export] No messages container found');
            return;
        }

        addPrintHeader(messagesContainer);
        addMessageLabels(messagesContainer);

        printEnhancementsAdded = true;
        console.log('[NinjaCat Chat Export] Print enhancements added');
    }

    function addPrintHeader(container) {
        const existing = document.getElementById('ninjacat-print-header');
        if (existing) existing.remove();

        const agentName = getAgentName();
        const agentDescription = getAgentDescription();
        const exportDate = new Date().toLocaleString();

        const header = document.createElement('div');
        header.id = 'ninjacat-print-header';
        header.innerHTML = `
            <div style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 6px;">
                ${escapeHTML(agentName)}
            </div>
            ${agentDescription ? `<div style="font-size: 13px; color: #6B7280; margin-bottom: 8px;">${escapeHTML(agentDescription)}</div>` : ''}
            <div style="font-size: 11px; color: #9CA3AF;">
                Exported: ${exportDate}
            </div>
        `;

        container.insertBefore(header, container.firstChild);
    }

    function updatePrintHeader() {
        const header = document.getElementById('ninjacat-print-header');
        if (header) {
            const exportDate = new Date().toLocaleString();
            const dateEl = header.querySelector('div:last-child');
            if (dateEl) {
                dateEl.textContent = `Exported: ${exportDate}`;
            }
        }
    }

    function addMessageLabels(container) {
        const allMessageElements = container.querySelectorAll('[index]');

        allMessageElements.forEach((el) => {
            if (el.querySelector('.ninjacat-user-label, .ninjacat-agent-label')) return;

            const isUserMessage = el.classList.contains('self-end') || el.closest('.self-end');

            if (isUserMessage) {
                // Add label BEFORE the message element (not inside)
                const existingLabel = el.parentElement?.querySelector('.ninjacat-user-label');
                if (!existingLabel) {
                    const label = document.createElement('div');
                    label.className = 'ninjacat-user-label';
                    label.style.cssText = `
                        font-size: 11px;
                        font-weight: 700;
                        color: #3B82F6;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: none;
                    `;
                    label.textContent = '● YOU';
                    el.parentElement?.insertBefore(label, el);
                }
            } else {
                // Add label before agent message blocks
                const styledMessage = el.querySelector('.styled-chat-message');
                if (styledMessage) {
                    const parent = styledMessage.closest('[index]') || styledMessage.parentElement;
                    const existingLabel = parent?.parentElement?.querySelector(`.ninjacat-agent-label[data-for-index="${el.getAttribute('index')}"]`);
                    if (!existingLabel && parent?.parentElement) {
                        const label = document.createElement('div');
                        label.className = 'ninjacat-agent-label';
                        label.dataset.forIndex = el.getAttribute('index');
                        label.style.cssText = `
                            font-size: 11px;
                            font-weight: 700;
                            color: #059669;
                            margin-bottom: 4px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            display: none;
                        `;
                        label.textContent = '● AGENT';
                        parent.parentElement.insertBefore(label, parent);
                    }
                }
            }
        });
    }

    // ---- Export Controls (Floating Menu) ----
    function addExportControls() {
        const chatContainer = document.querySelector('#assistants-ui');
        if (!chatContainer) {
            console.log('[NinjaCat Chat Export] Could not find chat container');
            return;
        }

        // Create floating button container
        const container = document.createElement('div');
        container.id = 'ninjacat-export-controls';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 340px;
            z-index: 9999;
        `;

        // Create main trigger button (icon)
        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ninjacat-export-trigger';
        triggerBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
        `;
        triggerBtn.title = 'Export Chat';
        triggerBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3B82F6;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s;
        `;
        triggerBtn.onmouseenter = () => { triggerBtn.style.transform = 'scale(1.05)'; };
        triggerBtn.onmouseleave = () => { triggerBtn.style.transform = 'scale(1)'; };

        // Create dropdown menu
        const dropdown = document.createElement('div');
        dropdown.id = 'ninjacat-export-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 45px;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            min-width: 180px;
            display: none;
            overflow: hidden;
        `;

        // Menu items
        const menuItems = [
            { icon: '📄', text: 'Print PDF', shortcut: '', action: handlePDFExport, id: 'ninjacat-pdf-btn' },
            { icon: '📝', text: 'Markdown', shortcut: 'Ctrl+Shift+M', action: handleMarkdownExport, id: 'ninjacat-md-btn' },
            { icon: '📋', text: 'Copy Text', shortcut: 'Ctrl+Shift+C', action: handleCopyToClipboard, id: 'ninjacat-copy-btn' },
            { type: 'divider' },
            { icon: '▼', text: 'Expand All', shortcut: '', action: () => handleExpandAll(dropdown), id: 'ninjacat-expand-btn' },
            { icon: '▲', text: 'Collapse All', shortcut: '', action: () => handleCollapseAll(dropdown), id: 'ninjacat-collapse-btn' },
        ];

        menuItems.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.style.cssText = 'height: 1px; background: #E5E7EB; margin: 4px 0;';
                dropdown.appendChild(divider);
                return;
            }

            const menuItem = document.createElement('button');
            menuItem.id = item.id;
            menuItem.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 14px;
                border: none;
                background: transparent;
                cursor: pointer;
                font-size: 13px;
                color: #374151;
                text-align: left;
                transition: background 0.15s;
            `;
            menuItem.innerHTML = `
                <span style="margin-right: 10px; font-size: 14px;">${item.icon}</span>
                <span style="flex: 1;">${item.text}</span>
                ${item.shortcut ? `<span style="font-size: 10px; color: #9CA3AF;">${item.shortcut}</span>` : ''}
            `;
            menuItem.onmouseenter = () => { menuItem.style.background = '#F3F4F6'; };
            menuItem.onmouseleave = () => { menuItem.style.background = 'transparent'; };
            menuItem.onclick = (e) => {
                e.stopPropagation();
                item.action();
                // Close dropdown after action (except for expand/collapse which show feedback)
                if (!item.id.includes('expand') && !item.id.includes('collapse')) {
                    dropdown.style.display = 'none';
                }
            };
            dropdown.appendChild(menuItem);
        });

        // Toggle dropdown on click
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        };

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        container.appendChild(triggerBtn);
        container.appendChild(dropdown);
        document.body.appendChild(container);

        console.log('[NinjaCat Chat Export] Export controls added (floating menu)');
    }

    function handleExpandAll(dropdown) {
        const btn = document.getElementById('ninjacat-expand-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span style="margin-right: 10px; font-size: 14px;">⏳</span><span style="flex: 1;">Expanding...</span>`;
        
        toggleAllTasks(true);
        
        setTimeout(() => {
            btn.innerHTML = `<span style="margin-right: 10px; font-size: 14px;">✓</span><span style="flex: 1;">Expanded!</span>`;
            setTimeout(() => {
                btn.innerHTML = originalText;
                dropdown.style.display = 'none';
            }, 1000);
        }, 500);
    }

    function handleCollapseAll(dropdown) {
        const btn = document.getElementById('ninjacat-collapse-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span style="margin-right: 10px; font-size: 14px;">⏳</span><span style="flex: 1;">Collapsing...</span>`;
        
        toggleAllTasks(false);
        
        setTimeout(() => {
            btn.innerHTML = `<span style="margin-right: 10px; font-size: 14px;">✓</span><span style="flex: 1;">Collapsed!</span>`;
            setTimeout(() => {
                btn.innerHTML = originalText;
                dropdown.style.display = 'none';
            }, 1000);
        }, 500);
    }

    // ---- Keyboard Shortcuts ----
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                handleMarkdownExport();
            }
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                handleCopyToClipboard();
            }
        });
        console.log('[NinjaCat Chat Export] Keyboard shortcuts registered (Ctrl+Shift+M, Ctrl+Shift+C)');
    }

    // ---- Toggle Tasks ----
    function toggleAllTasks(expand) {
        let totalToggled = 0;

        // Method 1: Toggle elements with data-is-collapsed attribute
        function toggleDataCollapsed() {
            const toggles = document.querySelectorAll('[data-is-collapsed]');
            let toggledCount = 0;

            toggles.forEach(toggle => {
                const isCollapsed = toggle.getAttribute('data-is-collapsed') === 'true';

                if ((expand && isCollapsed) || (!expand && !isCollapsed)) {
                    const clickTarget = toggle.closest('.cursor-pointer');
                    if (clickTarget) {
                        clickTarget.click();
                        toggledCount++;
                    }
                }
            });

            return toggledCount;
        }

        // Method 2: Toggle overflow-hidden elements (subtasks within Tasks Completed)
        // These use height:0 when collapsed, height:auto when expanded
        function toggleOverflowHidden() {
            const overflowElements = document.querySelectorAll('.overflow-hidden');
            let toggledCount = 0;

            overflowElements.forEach(el => {
                const computedHeight = el.style.height;
                const isCollapsed = computedHeight === '0px' || computedHeight === '0';
                const isExpanded = computedHeight === 'auto' || (computedHeight && parseInt(computedHeight) > 0);

                // Find the clickable toggle - usually a sibling or parent with cursor-pointer
                // Look for previous sibling first (common pattern: header then content)
                let clickTarget = el.previousElementSibling;
                if (!clickTarget || !clickTarget.classList.contains('cursor-pointer')) {
                    // Try parent's cursor-pointer
                    clickTarget = el.closest('.cursor-pointer');
                }
                if (!clickTarget) {
                    // Look for cursor-pointer within the parent
                    const parent = el.parentElement;
                    if (parent) {
                        clickTarget = parent.querySelector('.cursor-pointer');
                    }
                }

                if (clickTarget) {
                    if ((expand && isCollapsed) || (!expand && isExpanded)) {
                        clickTarget.click();
                        toggledCount++;
                    }
                }
            });

            return toggledCount;
        }

        // Method 3: Toggle elements with display:none style (code blocks, query tabs)
        // Find clickable elements near hidden content
        function toggleDisplayNone() {
            let toggledCount = 0;
            
            // Look for tab-like interfaces with aria-selected
            const tabs = document.querySelectorAll('[aria-selected="false"].cursor-pointer');
            tabs.forEach(tab => {
                if (expand) {
                    // Click inactive tabs to reveal their content
                    tab.click();
                    toggledCount++;
                }
            });

            return toggledCount;
        }

        // Combined toggle function
        function doToggle() {
            const count1 = toggleDataCollapsed();
            const count2 = toggleOverflowHidden();
            const count3 = toggleDisplayNone();
            return count1 + count2 + count3;
        }

        // First pass - expand top-level items
        totalToggled += doToggle();

        // Multiple passes with delays to catch nested items that appear after expansion
        const runPass = (passNum, delay) => {
            setTimeout(() => {
                const count = doToggle();
                if (count > 0) {
                    console.log(`[NinjaCat Chat Export] Pass ${passNum}: ${expand ? 'Expanded' : 'Collapsed'} ${count} additional sections`);
                    totalToggled += count;
                    
                    // Continue if we found more items (up to 5 passes)
                    if (passNum < 5) {
                        runPass(passNum + 1, 200);
                    }
                }
            }, delay);
        };

        // Start additional passes
        runPass(2, 200);

        console.log(`[NinjaCat Chat Export] ${expand ? 'Expanded' : 'Collapsed'} ${totalToggled} task sections (checking for nested...)`);
        return totalToggled;
    }

    // ---- Handlers ----
    function handlePDFExport() {
        addPrintEnhancements();
        setTimeout(() => {
            window.print();
        }, 150);
    }

    function handleMarkdownExport() {
        try {
            exportToMarkdown();
            console.log('[NinjaCat Chat Export] Markdown exported');
        } catch (e) {
            console.error('[NinjaCat Chat Export] Markdown export error:', e);
            alert('Export failed. Check console for details.');
        }
    }

    function handleCopyToClipboard() {
        try {
            copyToClipboard();
            // Show brief visual feedback
            const trigger = document.getElementById('ninjacat-export-trigger');
            if (trigger) {
                trigger.style.background = '#10B981';
                setTimeout(() => { trigger.style.background = '#3B82F6'; }, 1000);
            }
        } catch (e) {
            console.error('[NinjaCat Chat Export] Copy error:', e);
            alert('Copy failed. Check console for details.');
        }
    }

    // ---- Helper Functions ----
    function getAgentName() {
        return document.querySelector('h2')?.textContent?.trim() || 'NinjaCat Chat';
    }

    function getAgentDescription() {
        return document.querySelector('.text-sm.text-grey-70.text-center')?.textContent?.trim() || '';
    }

    function getFormattedDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function sanitizeFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').substring(0, 50);
    }

    // ---- Copy to Clipboard ----
    function copyToClipboard() {
        const agentName = getAgentName();
        const agentDescription = getAgentDescription();
        const exportDate = new Date().toLocaleString();

        let text = `${agentName}\n`;
        if (agentDescription) {
            text += `${agentDescription}\n`;
        }
        text += `Exported: ${exportDate}\n`;
        text += `${'─'.repeat(50)}\n\n`;

        const messagesContainer = document.querySelector('.conversationMessagesContainer');
        if (!messagesContainer) {
            throw new Error('No conversation found');
        }

        const allMessageElements = messagesContainer.querySelectorAll('[index]');

        allMessageElements.forEach(el => {
            const isUserMessage = el.classList.contains('self-end') || el.closest('.self-end');

            if (isUserMessage) {
                const msgText = el.querySelector('.whitespace-pre-wrap')?.textContent?.trim() || el.textContent?.trim();
                if (msgText) {
                    text += `YOU:\n${msgText}\n\n`;
                }
            } else {
                const styledMessage = el.querySelector('.styled-chat-message') || el;
                const msgText = styledMessage.textContent?.trim();
                if (msgText) {
                    text += `AGENT:\n${msgText}\n\n`;
                }
            }
        });

        navigator.clipboard.writeText(text);
        console.log('[NinjaCat Chat Export] Copied to clipboard');
    }

    // ---- Markdown Export ----
    function exportToMarkdown() {
        const agentName = getAgentName();
        const agentDescription = getAgentDescription();
        const exportDate = new Date().toLocaleString();
        const fileDate = getFormattedDate();

        let markdown = `# ${agentName}\n\n`;
        if (agentDescription) {
            markdown += `> ${agentDescription}\n\n`;
        }
        markdown += `*Exported: ${exportDate}*\n\n---\n\n`;

        const messagesContainer = document.querySelector('.conversationMessagesContainer');
        if (!messagesContainer) {
            alert('No conversation found to export.');
            return;
        }

        const allMessageElements = messagesContainer.querySelectorAll('[index]');

        allMessageElements.forEach(el => {
            const isUserMessage = el.classList.contains('self-end') || el.closest('.self-end');

            if (isUserMessage) {
                const text = el.querySelector('.whitespace-pre-wrap')?.textContent?.trim() || el.textContent?.trim();
                if (text) {
                    markdown += `## You\n\n${text}\n\n---\n\n`;
                }
            } else {
                // Get main message content
                const styledMessage = el.querySelector('.styled-chat-message');
                let messageContent = '';
                
                if (styledMessage) {
                    messageContent = extractMarkdownContent(styledMessage);
                }

                // Also capture expanded task/subtask content
                // Look for overflow-hidden elements that are expanded (height: auto)
                const expandedSections = el.querySelectorAll('.overflow-hidden');
                expandedSections.forEach(section => {
                    const style = section.getAttribute('style') || '';
                    const isExpanded = style.includes('height: auto') || style.includes('overflow: visible');
                    if (isExpanded) {
                        // Check if this content is already in styledMessage
                        if (!styledMessage || !styledMessage.contains(section)) {
                            const sectionContent = extractMarkdownContent(section);
                            if (sectionContent && sectionContent.trim()) {
                                messageContent += '\n\n' + sectionContent;
                            }
                        }
                    }
                });

                // Also look for task content boxes (bg-blue-2 styled boxes)
                const taskBoxes = el.querySelectorAll('.bg-blue-2');
                taskBoxes.forEach(box => {
                    if (!styledMessage || !styledMessage.contains(box)) {
                        const boxContent = extractMarkdownContent(box);
                        if (boxContent && boxContent.trim()) {
                            messageContent += '\n\n**Task Output:**\n' + boxContent;
                        }
                    }
                });

                if (messageContent && messageContent.trim()) {
                    markdown += `## Agent\n\n${messageContent.trim()}\n\n---\n\n`;
                }
            }
        });

        const images = messagesContainer.querySelectorAll('img[src*="ai-service"]');
        if (images.length > 0) {
            markdown += `\n### Images in conversation\n\n`;
            images.forEach((img, i) => {
                markdown += `![Image ${i + 1}](${img.src})\n\n`;
            });
        }

        const filename = `${sanitizeFilename(agentName)}-${fileDate}-chat.md`;
        downloadFile(filename, markdown, 'text/markdown');
    }

    function extractMarkdownContent(element) {
        if (!element) return '';

        const clone = element.cloneNode(true);

        // Remove our injected labels
        clone.querySelectorAll('.ninjacat-agent-label, .ninjacat-user-label').forEach(el => el.remove());

        // Remove UI elements that shouldn't be in export
        clone.querySelectorAll('.tableModifiers, .table-pagination').forEach(el => el.remove());
        clone.querySelectorAll('[data-automation-id="search-bar"]').forEach(el => el.closest('.flex')?.remove());

        // Convert tables to Markdown FIRST (before other processing)
        clone.querySelectorAll('table').forEach(table => {
            const mdTable = convertTableToMarkdown(table);
            const placeholder = document.createElement('div');
            placeholder.textContent = mdTable;
            table.replaceWith(placeholder);
        });

        // Convert headers
        clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            const level = parseInt(h.tagName[1]);
            const prefix = '#'.repeat(level + 1);
            h.textContent = `\n${prefix} ${h.textContent.trim()}\n`;
        });

        // Convert code blocks - handle PRE first to avoid double processing
        clone.querySelectorAll('pre').forEach(pre => {
            const codeEl = pre.querySelector('code');
            const codeText = codeEl ? codeEl.textContent : pre.textContent;
            // Try to detect language from class
            const langClass = (codeEl?.className || pre.className || '').match(/language-(\w+)/);
            const lang = langClass ? langClass[1] : '';
            pre.textContent = `\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n`;
        });

        // Convert inline code (but not ones inside pre that we already processed)
        clone.querySelectorAll('code').forEach(code => {
            if (!code.closest('pre')) {
                code.textContent = `\`${code.textContent}\``;
            }
        });

        // Convert lists
        clone.querySelectorAll('ul').forEach(ul => {
            ul.querySelectorAll(':scope > li').forEach(li => {
                const indent = getListIndent(li);
                li.innerHTML = `${indent}- ${li.innerHTML}`;
            });
        });
        clone.querySelectorAll('ol').forEach(ol => {
            ol.querySelectorAll(':scope > li').forEach((li, i) => {
                const indent = getListIndent(li);
                li.innerHTML = `${indent}${i + 1}. ${li.innerHTML}`;
            });
        });

        // Convert text formatting
        clone.querySelectorAll('strong, b').forEach(el => {
            el.textContent = `**${el.textContent}**`;
        });

        clone.querySelectorAll('em, i').forEach(el => {
            // Skip if it's an icon
            if (!el.closest('svg') && !el.querySelector('svg')) {
                el.textContent = `*${el.textContent}*`;
            }
        });

        // Convert links
        clone.querySelectorAll('a').forEach(a => {
            const href = a.href;
            const text = a.textContent.trim();
            if (href && text && !href.startsWith('javascript:')) {
                a.textContent = `[${text}](${href})`;
            }
        });

        // Get final text content
        let content = clone.textContent?.trim() || '';
        
        // Clean up excessive whitespace
        content = content.replace(/\n{3,}/g, '\n\n');
        content = content.replace(/[ \t]+\n/g, '\n'); // Remove trailing spaces
        
        return content;
    }

    // Helper: Convert HTML table to Markdown table
    function convertTableToMarkdown(table) {
        const rows = [];
        const headerRow = table.querySelector('thead tr');
        const bodyRows = table.querySelectorAll('tbody tr');

        // Extract headers
        if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
                cell.textContent.trim().replace(/\|/g, '\\|')
            );
            if (headers.length > 0) {
                rows.push(`| ${headers.join(' | ')} |`);
                rows.push(`| ${headers.map(() => '---').join(' | ')} |`);
            }
        }

        // Extract body rows
        bodyRows.forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('td, th')).map(cell => 
                cell.textContent.trim().replace(/\|/g, '\\|')
            );
            if (cells.length > 0) {
                rows.push(`| ${cells.join(' | ')} |`);
            }
        });

        return rows.length > 0 ? '\n' + rows.join('\n') + '\n' : '';
    }

    // Helper: Get indentation for nested list items
    function getListIndent(li) {
        let depth = 0;
        let parent = li.parentElement;
        while (parent) {
            if (parent.tagName === 'UL' || parent.tagName === 'OL') {
                depth++;
            }
            parent = parent.parentElement;
        }
        return '  '.repeat(Math.max(0, depth - 1));
    }

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`[NinjaCat Chat Export] Downloaded: ${filename}`);
    }

    // ---- Start ----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
