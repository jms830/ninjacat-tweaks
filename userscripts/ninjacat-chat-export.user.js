// ==UserScript==
// @name         NinjaCat Chat Export
// @namespace    http://tampermonkey.net/
// @version      2.0.1
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

    console.log('[NinjaCat Chat Export] Script loaded v2.0.1');

    let exportButtonAdded = false;

    // ---- Print Styles ----
    // These CSS rules hide sidebars and expand chat area when printing
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
        }
    `;

    // ---- Initialize ----
    function init() {
        // Inject print styles immediately
        injectPrintStyles();

        const checkInterval = setInterval(() => {
            const chatContainer = document.querySelector('#assistants-ui');
            const messagesContainer = document.querySelector('.conversationMessagesContainer');

            if (chatContainer && !exportButtonAdded) {
                addExportControls();
                exportButtonAdded = true;
                clearInterval(checkInterval);
            }
        }, 1000);

        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    function injectPrintStyles() {
        const styleEl = document.createElement('style');
        styleEl.id = 'ninjacat-print-styles';
        styleEl.textContent = printStyles;
        document.head.appendChild(styleEl);
        console.log('[NinjaCat Chat Export] Print styles injected');
    }

    function addExportControls() {
        // Find the header area with the back button
        const backButton = document.querySelector('.flex.text-blue-100.items-center');
        if (!backButton || !backButton.parentElement) {
            console.log('[NinjaCat Chat Export] Could not find header area');
            return;
        }

        // Create controls container
        const controls = document.createElement('div');
        controls.id = 'ninjacat-export-controls';
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 16px;
            padding: 8px 0;
        `;

        // PDF Export button
        const pdfBtn = createButton('📄 Print PDF', 'Print chat to PDF (hides sidebars)', '#3B82F6', exportToPDF);

        // Markdown Export button
        const mdBtn = createButton('📝 Markdown', 'Export chat as Markdown text', '#10B981', exportToMarkdown);

        // Expand All button
        const expandBtn = createButton('▼ Expand All', 'Expand all task sections', '#6B7280', () => toggleAllTasks(true));

        // Collapse All button
        const collapseBtn = createButton('▲ Collapse All', 'Collapse all task sections', '#6B7280', () => toggleAllTasks(false));

        controls.appendChild(pdfBtn);
        controls.appendChild(mdBtn);
        controls.appendChild(createSeparator());
        controls.appendChild(expandBtn);
        controls.appendChild(collapseBtn);

        // Insert after the back button
        backButton.parentElement.insertBefore(controls, backButton.nextSibling);
        console.log('[NinjaCat Chat Export] Export controls added');
    }

    function createButton(text, title, bgColor, onClick) {
        const btn = document.createElement('button');
        btn.innerHTML = text;
        btn.title = title;
        btn.style.cssText = `
            background: ${bgColor};
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            white-space: nowrap;
        `;
        btn.onmouseenter = () => btn.style.opacity = '0.8';
        btn.onmouseleave = () => btn.style.opacity = '1';
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

    // ---- Toggle Tasks ----
    function toggleAllTasks(expand) {
        // Find all task dropdown toggles
        // They have the data-is-collapsed attribute on an SVG
        const toggles = document.querySelectorAll('[data-is-collapsed]');
        
        toggles.forEach(toggle => {
            const isCollapsed = toggle.getAttribute('data-is-collapsed') === 'true';
            
            // Click to toggle if state doesn't match desired state
            if ((expand && isCollapsed) || (!expand && !isCollapsed)) {
                // Find the clickable parent (the flex container with cursor-pointer)
                const clickTarget = toggle.closest('.cursor-pointer');
                if (clickTarget) {
                    clickTarget.click();
                }
            }
        });

        console.log(`[NinjaCat Chat Export] ${expand ? 'Expanded' : 'Collapsed'} all tasks`);
    }

    // ---- PDF Export (Print) ----
    function exportToPDF() {
        console.log('[NinjaCat Chat Export] Starting PDF export (print)...');
        
        // Simply trigger the browser's print dialog
        // The injected CSS will handle hiding sidebars
        window.print();
    }

    // ---- Markdown Export ----
    function exportToMarkdown() {
        console.log('[NinjaCat Chat Export] Starting Markdown export...');

        // Get agent info
        const agentName = document.querySelector('h2')?.textContent?.trim() || 'NinjaCat Chat';
        const agentDescription = document.querySelector('.text-sm.text-grey-70.text-center')?.textContent?.trim() || '';

        // Build markdown content
        let markdown = `# ${agentName}\n\n`;
        if (agentDescription) {
            markdown += `> ${agentDescription}\n\n`;
        }
        markdown += `*Exported: ${new Date().toLocaleString()}*\n\n---\n\n`;

        // Get all messages from the conversation container
        const messagesContainer = document.querySelector('.conversationMessagesContainer');
        if (!messagesContainer) {
            alert('No conversation found to export.');
            return;
        }

        // Find user messages (they have self-end class and bg-grey-10)
        const userMessages = messagesContainer.querySelectorAll('.self-end .whitespace-pre-wrap');
        
        // Find assistant messages (styled-chat-message that are NOT in self-end)
        const assistantMessages = messagesContainer.querySelectorAll('.styled-chat-message');

        // Get all message elements in order by walking the DOM
        const allMessageElements = messagesContainer.querySelectorAll('[index]');
        
        allMessageElements.forEach(el => {
            const index = el.getAttribute('index');
            const isUserMessage = el.classList.contains('self-end') || el.closest('.self-end');
            
            if (isUserMessage) {
                // User message
                const text = el.querySelector('.whitespace-pre-wrap')?.textContent?.trim() || el.textContent?.trim();
                if (text) {
                    markdown += `## You\n\n${text}\n\n`;
                }
            } else {
                // Assistant message
                const styledMessage = el.querySelector('.styled-chat-message') || el;
                const messageContent = extractMarkdownContent(styledMessage);
                if (messageContent) {
                    markdown += `## Agent\n\n${messageContent}\n\n`;
                }
            }
        });

        // Also capture any images
        const images = messagesContainer.querySelectorAll('img[src*="ai-service"]');
        if (images.length > 0) {
            markdown += `\n---\n\n### Images in conversation\n\n`;
            images.forEach((img, i) => {
                markdown += `![Image ${i + 1}](${img.src})\n\n`;
            });
        }

        // Download the markdown file
        downloadFile(`${sanitizeFilename(agentName)}-chat.md`, markdown, 'text/markdown');
    }

    function extractMarkdownContent(element) {
        if (!element) return '';
        
        let content = '';
        
        // Clone the element to manipulate without affecting the page
        const clone = element.cloneNode(true);
        
        // Convert headers
        clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            const level = parseInt(h.tagName[1]);
            const prefix = '#'.repeat(level + 1); // Add 1 since we use ## for roles
            h.textContent = `${prefix} ${h.textContent}\n`;
        });

        // Convert code blocks
        clone.querySelectorAll('pre, code').forEach(code => {
            if (code.tagName === 'PRE') {
                code.textContent = `\n\`\`\`\n${code.textContent}\n\`\`\`\n`;
            } else {
                code.textContent = `\`${code.textContent}\``;
            }
        });

        // Convert lists
        clone.querySelectorAll('ul li').forEach(li => {
            li.textContent = `- ${li.textContent}\n`;
        });
        clone.querySelectorAll('ol li').forEach((li, i) => {
            li.textContent = `${i + 1}. ${li.textContent}\n`;
        });

        // Convert bold/strong
        clone.querySelectorAll('strong, b').forEach(el => {
            el.textContent = `**${el.textContent}**`;
        });

        // Convert italic/em
        clone.querySelectorAll('em, i').forEach(el => {
            el.textContent = `*${el.textContent}*`;
        });

        // Convert links
        clone.querySelectorAll('a').forEach(a => {
            a.textContent = `[${a.textContent}](${a.href})`;
        });

        content = clone.textContent?.trim() || '';
        
        // Clean up extra whitespace
        content = content.replace(/\n{3,}/g, '\n\n');
        
        return content;
    }

    function sanitizeFilename(name) {
        return name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').substring(0, 50);
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
