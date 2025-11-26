// ==UserScript==
// @name         NinjaCat Chat Export
// @namespace    http://tampermonkey.net/
// @version      2.2.0
// @description  Export NinjaCat agent chats to PDF (print) or Markdown, with expand/collapse controls
// @author       NinjaCat Tweaks
// @match        https://app.ninjacat.io/agency/data/agents/*/chat/*
// @match        https://app.mymarketingreports.com/agency/data/agents/*/chat/*
// @grant        none
// @run-at       document-end
// @homepage     https://github.com/jms830/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-chat-export.meta.js
// @downloadURL  https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-chat-export.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('[NinjaCat Chat Export] Script loaded v2.2.0');

    let exportButtonAdded = false;
    let printEnhancementsAdded = false;

    // ---- Print Styles ----
    const printStyles = `
        @media print {
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

            /* Hide the message input area */
            .flex.flex-col.relative.max-w-\\[840px\\] {
                display: none !important;
            }

            /* Expand chat area to full width */
            .flex.h-screen.ml-auto.w-\\[95\\%\\] {
                width: 100% !important;
                margin-left: 0 !important;
                height: auto !important;
                max-height: none !important;
            }

            .max-h-screen.flex.flex-col.flex-grow {
                padding: 0 !important;
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
            }

            /* CRITICAL: Remove scroll constraints to show full chat */
            .overflow-y-auto,
            .overflow-auto,
            .conversationMessagesContainer {
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
            }

            .conversationMessagesContainer {
                max-width: 100% !important;
                padding: 20px !important;
            }

            .max-w-\\[840px\\] {
                max-width: 100% !important;
            }

            /* Remove h-screen constraints */
            .h-screen {
                height: auto !important;
                max-height: none !important;
            }

            /* Ensure flex containers don't constrain height */
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

            /* Ensure images print properly */
            img {
                max-width: 100% !important;
                page-break-inside: avoid;
            }

            /* Keep message blocks together */
            .styled-chat-message {
                page-break-inside: avoid;
            }

            /* Hide hover buttons (edit, copy) */
            .flex.justify-end .opacity-0 {
                display: none !important;
            }

            /* Hide download/expand buttons on images */
            .absolute.right-4.bottom-6 {
                display: none !important;
            }

            /* Remove body padding */
            .njc-body {
                padding: 0 !important;
                margin: 0 !important;
            }

            .no-print-padding {
                padding: 0 !important;
            }

            /* Page settings */
            @page {
                margin: 0.5in;
                size: auto;
            }

            /* Hide our export controls when printing */
            #ninjacat-export-controls {
                display: none !important;
            }

            /* ============================================
               PRINT HEADER - Visible only when printing
               ============================================ */
            #ninjacat-print-header {
                display: block !important;
                padding: 24px 20px !important;
                margin: 0 0 24px 0 !important;
                border-bottom: 3px solid #3B82F6 !important;
                background: #F8FAFC !important;
            }

            /* ============================================
               USER MESSAGE STYLING FOR PRINT
               ============================================ */
            .ninjacat-user-label {
                display: block !important;
            }

            .self-end,
            [class*="self-end"] {
                align-self: flex-start !important;
                max-width: 100% !important;
            }

            .self-end .whitespace-pre-wrap,
            .bg-grey-10 {
                background: #DBEAFE !important;
                border-left: 4px solid #3B82F6 !important;
                padding: 12px 16px !important;
                border-radius: 8px !important;
                margin: 0 !important;
                max-width: 100% !important;
            }

            /* ============================================
               MESSAGE DIVIDERS FOR PRINT
               ============================================ */
            .ninjacat-message-divider {
                display: block !important;
            }

            /* ============================================
               AGENT LABEL STYLING FOR PRINT
               ============================================ */
            .ninjacat-agent-label {
                display: block !important;
            }

            /* ============================================
               HIDE TASK DROPDOWN ARROWS IN PRINT
               ============================================ */
            [data-is-collapsed] {
                display: none !important;
            }

            /* Keep the task count text visible */
            .cursor-pointer .text-blue-100.font-semibold {
                display: inline !important;
            }

            /* ============================================
               TIGHTEN SPACING
               ============================================ */
            .mt-6 {
                margin-top: 16px !important;
            }

            .mb-\\[18px\\] {
                margin-bottom: 12px !important;
            }

            .gap-3 {
                gap: 8px !important;
            }
        }

        /* ============================================
           SCREEN STYLES - Hide print-only elements
           ============================================ */
        #ninjacat-print-header {
            display: none;
        }

        .ninjacat-user-label,
        .ninjacat-agent-label,
        .ninjacat-message-divider {
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

    // ---- Add Print Enhancements (labels, dividers, header) ----
    function addPrintEnhancements() {
        if (printEnhancementsAdded) {
            // Just update the timestamp
            updatePrintHeader();
            return;
        }

        const messagesContainer = document.querySelector('.conversationMessagesContainer');
        if (!messagesContainer) {
            console.log('[NinjaCat Chat Export] No messages container found');
            return;
        }

        // Add print header at the very top
        addPrintHeader(messagesContainer);

        // Add labels and dividers to messages
        addMessageLabels(messagesContainer);

        printEnhancementsAdded = true;
        console.log('[NinjaCat Chat Export] Print enhancements added');
    }

    function addPrintHeader(container) {
        // Remove existing header if any
        const existing = document.getElementById('ninjacat-print-header');
        if (existing) existing.remove();

        const agentName = getAgentName();
        const agentDescription = getAgentDescription();
        const exportDate = new Date().toLocaleString();

        const header = document.createElement('div');
        header.id = 'ninjacat-print-header';
        header.innerHTML = `
            <div style="font-size: 28px; font-weight: 700; color: #1E3A8A; margin-bottom: 8px; line-height: 1.2;">
                ${escapeHTML(agentName)}
            </div>
            ${agentDescription ? `<div style="font-size: 14px; color: #64748B; margin-bottom: 12px;">${escapeHTML(agentDescription)}</div>` : ''}
            <div style="font-size: 12px; color: #94A3B8; font-weight: 500;">
                📅 Exported: ${exportDate}
            </div>
        `;

        // Insert at the very beginning of the container
        container.insertBefore(header, container.firstChild);
    }

    function updatePrintHeader() {
        const header = document.getElementById('ninjacat-print-header');
        if (header) {
            const exportDate = new Date().toLocaleString();
            const dateEl = header.querySelector('div:last-child');
            if (dateEl) {
                dateEl.innerHTML = `📅 Exported: ${exportDate}`;
            }
        }
    }

    function addMessageLabels(container) {
        const allMessageElements = container.querySelectorAll('[index]');
        let lastWasUser = null;

        allMessageElements.forEach((el, idx) => {
            // Skip if already has label
            if (el.querySelector('.ninjacat-user-label, .ninjacat-agent-label')) return;

            const isUserMessage = el.classList.contains('self-end') || el.closest('.self-end');

            // Add divider between different message types (but not before first message)
            if (idx > 0 && lastWasUser !== null && lastWasUser !== isUserMessage) {
                const divider = document.createElement('div');
                divider.className = 'ninjacat-message-divider';
                divider.style.cssText = `
                    height: 1px;
                    background: #E2E8F0;
                    margin: 20px 0;
                    display: none;
                `;
                el.parentElement.insertBefore(divider, el);
            }

            if (isUserMessage) {
                // Add "You" label before user messages
                const label = document.createElement('div');
                label.className = 'ninjacat-user-label';
                label.style.cssText = `
                    font-size: 12px;
                    font-weight: 700;
                    color: #1E40AF;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: none;
                `;
                label.textContent = '💬 You';

                // Find the message content wrapper
                const messageWrapper = el.querySelector('.whitespace-pre-wrap');
                if (messageWrapper && messageWrapper.parentElement) {
                    messageWrapper.parentElement.insertBefore(label, messageWrapper);
                }
            } else {
                // Add "Agent" label before agent messages
                const styledMessage = el.querySelector('.styled-chat-message');
                if (styledMessage && !styledMessage.previousElementSibling?.classList?.contains('ninjacat-agent-label')) {
                    const label = document.createElement('div');
                    label.className = 'ninjacat-agent-label';
                    label.style.cssText = `
                        font-size: 12px;
                        font-weight: 700;
                        color: #047857;
                        margin-bottom: 6px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: none;
                    `;
                    label.textContent = '🤖 Agent';
                    styledMessage.parentElement.insertBefore(label, styledMessage);
                }
            }

            lastWasUser = isUserMessage;
        });
    }

    // ---- Export Controls ----
    function addExportControls() {
        let insertTarget = document.querySelector('.flex.text-blue-100.items-center.py-\\[15px\\]');
        if (!insertTarget) {
            insertTarget = document.querySelector('#assistants-ui .flex.text-blue-100');
        }
        if (!insertTarget) {
            insertTarget = document.querySelector('#assistants-ui > div > div');
        }

        if (!insertTarget || !insertTarget.parentElement) {
            console.log('[NinjaCat Chat Export] Could not find header area');
            return;
        }

        const controls = document.createElement('div');
        controls.id = 'ninjacat-export-controls';
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 16px;
            padding: 8px 0;
            flex-wrap: wrap;
        `;

        const pdfBtn = createButton(
            '📄 Print PDF',
            'Print to PDF (Ctrl+P, then "Save as PDF")\nTip: Use Expand All first to include all tasks',
            '#3B82F6',
            handlePDFExport
        );
        pdfBtn.id = 'ninjacat-pdf-btn';

        const mdBtn = createButton(
            '📝 Markdown',
            'Export as Markdown file (Ctrl+Shift+M)',
            '#10B981',
            handleMarkdownExport
        );
        mdBtn.id = 'ninjacat-md-btn';

        const copyBtn = createButton(
            '📋 Copy',
            'Copy conversation to clipboard as plain text (Ctrl+Shift+C)',
            '#8B5CF6',
            handleCopyToClipboard
        );
        copyBtn.id = 'ninjacat-copy-btn';

        const expandBtn = createButton(
            '▼ Expand All',
            'Expand all task sections before export',
            '#6B7280',
            () => {
                toggleAllTasks(true);
                showButtonFeedback(expandBtn, '✓ Expanded', '#10B981');
            }
        );
        expandBtn.id = 'ninjacat-expand-btn';

        const collapseBtn = createButton(
            '▲ Collapse All',
            'Collapse all task sections',
            '#6B7280',
            () => {
                toggleAllTasks(false);
                showButtonFeedback(collapseBtn, '✓ Collapsed', '#10B981');
            }
        );
        collapseBtn.id = 'ninjacat-collapse-btn';

        controls.appendChild(pdfBtn);
        controls.appendChild(mdBtn);
        controls.appendChild(copyBtn);
        controls.appendChild(createSeparator());
        controls.appendChild(expandBtn);
        controls.appendChild(collapseBtn);

        insertTarget.parentElement.insertBefore(controls, insertTarget.nextSibling);
        console.log('[NinjaCat Chat Export] Export controls added');
    }

    function createButton(text, title, bgColor, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.title = title;
        btn.dataset.originalText = text;
        btn.dataset.originalBg = bgColor;
        btn.style.cssText = `
            background: ${bgColor};
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            min-width: 80px;
        `;
        btn.onmouseenter = () => {
            if (!btn.disabled) btn.style.opacity = '0.85';
        };
        btn.onmouseleave = () => {
            if (!btn.disabled) btn.style.opacity = '1';
        };
        btn.onclick = onClick;
        return btn;
    }

    function createSeparator() {
        const sep = document.createElement('div');
        sep.style.cssText = `
            width: 1px;
            height: 20px;
            background: #E5E7EB;
            margin: 0 4px;
        `;
        return sep;
    }

    // ---- Button Feedback ----
    function showButtonFeedback(btn, text, color, duration = 1500) {
        const originalText = btn.dataset.originalText;
        const originalBg = btn.dataset.originalBg;

        btn.innerHTML = text;
        btn.style.background = color;
        btn.disabled = true;
        btn.style.cursor = 'default';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = originalBg;
            btn.disabled = false;
            btn.style.cursor = 'pointer';
        }, duration);
    }

    function showButtonLoading(btn, text = 'Working...') {
        btn.innerHTML = text;
        btn.disabled = true;
        btn.style.cursor = 'wait';
        btn.style.opacity = '0.7';
    }

    function resetButton(btn) {
        btn.innerHTML = btn.dataset.originalText;
        btn.style.background = btn.dataset.originalBg;
        btn.disabled = false;
        btn.style.cursor = 'pointer';
        btn.style.opacity = '1';
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

        console.log(`[NinjaCat Chat Export] ${expand ? 'Expanded' : 'Collapsed'} ${toggledCount} task sections`);
        return toggledCount;
    }

    // ---- Handlers ----
    function handlePDFExport() {
        const btn = document.getElementById('ninjacat-pdf-btn');
        showButtonLoading(btn, '📄 Preparing...');

        // Add print enhancements (header, labels, dividers)
        addPrintEnhancements();

        // Small delay to let DOM update, then print
        setTimeout(() => {
            resetButton(btn);
            window.print();
        }, 150);
    }

    function handleMarkdownExport() {
        const btn = document.getElementById('ninjacat-md-btn');
        showButtonLoading(btn, '📝 Exporting...');

        setTimeout(() => {
            try {
                exportToMarkdown();
                showButtonFeedback(btn, '✓ Downloaded', '#10B981');
            } catch (e) {
                console.error('[NinjaCat Chat Export] Markdown export error:', e);
                showButtonFeedback(btn, '✗ Error', '#EF4444');
            }
        }, 100);
    }

    function handleCopyToClipboard() {
        const btn = document.getElementById('ninjacat-copy-btn');
        showButtonLoading(btn, '📋 Copying...');

        setTimeout(() => {
            try {
                copyToClipboard();
                showButtonFeedback(btn, '✓ Copied!', '#10B981');
            } catch (e) {
                console.error('[NinjaCat Chat Export] Copy error:', e);
                showButtonFeedback(btn, '✗ Error', '#EF4444');
            }
        }, 100);
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
                    markdown += `## 💬 You\n\n${text}\n\n---\n\n`;
                }
            } else {
                const styledMessage = el.querySelector('.styled-chat-message') || el;
                const messageContent = extractMarkdownContent(styledMessage);
                if (messageContent) {
                    markdown += `## 🤖 Agent\n\n${messageContent}\n\n---\n\n`;
                }
            }
        });

        // Capture images
        const images = messagesContainer.querySelectorAll('img[src*="ai-service"]');
        if (images.length > 0) {
            markdown += `\n### 🖼️ Images in conversation\n\n`;
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

        // Remove any injected labels
        clone.querySelectorAll('.ninjacat-agent-label, .ninjacat-user-label').forEach(el => el.remove());

        clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            const level = parseInt(h.tagName[1]);
            const prefix = '#'.repeat(level + 1);
            h.textContent = `${prefix} ${h.textContent}\n`;
        });

        clone.querySelectorAll('pre, code').forEach(code => {
            if (code.tagName === 'PRE') {
                code.textContent = `\n\`\`\`\n${code.textContent}\n\`\`\`\n`;
            } else {
                code.textContent = `\`${code.textContent}\``;
            }
        });

        clone.querySelectorAll('ul li').forEach(li => {
            li.textContent = `- ${li.textContent}\n`;
        });
        clone.querySelectorAll('ol li').forEach((li, i) => {
            li.textContent = `${i + 1}. ${li.textContent}\n`;
        });

        clone.querySelectorAll('strong, b').forEach(el => {
            el.textContent = `**${el.textContent}**`;
        });

        clone.querySelectorAll('em, i').forEach(el => {
            el.textContent = `*${el.textContent}*`;
        });

        clone.querySelectorAll('a').forEach(a => {
            a.textContent = `[${a.textContent}](${a.href})`;
        });

        let content = clone.textContent?.trim() || '';
        content = content.replace(/\n{3,}/g, '\n\n');

        return content;
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
