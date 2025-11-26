// ==UserScript==
// @name         NinjaCat Chat Export to PDF
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Export NinjaCat agent chats to clean PDF format, including tool calls
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

    console.log('[NinjaCat Chat Export] Script loaded v1.0.0');

    let exportButtonAdded = false;

    // Wait for chat to load, then add export button
    function init() {
        const checkInterval = setInterval(() => {
            // Look for the chat container or header area
            const chatHeader = document.querySelector('.flex.text-blue-100.items-center');
            const chatContainer = document.querySelector('#assistants-ui');
            
            if (chatContainer && !exportButtonAdded) {
                addExportButton();
                exportButtonAdded = true;
                clearInterval(checkInterval);
            }
        }, 1000);

        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }

    function addExportButton() {
        // Find a good place to add the button - near the back arrow
        const backButton = document.querySelector('.flex.text-blue-100.items-center');
        if (!backButton || !backButton.parentElement) {
            console.log('[NinjaCat Chat Export] Could not find header area');
            return;
        }

        const exportBtn = document.createElement('button');
        exportBtn.id = 'ninjacat-export-pdf';
        exportBtn.innerHTML = '📄 Export PDF';
        exportBtn.title = 'Export this chat to a clean PDF';
        exportBtn.style.cssText = `
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            margin-left: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
        `;
        exportBtn.onmouseenter = () => exportBtn.style.background = '#2563EB';
        exportBtn.onmouseleave = () => exportBtn.style.background = '#3B82F6';
        exportBtn.onclick = exportToPDF;

        // Insert after the back button
        backButton.parentElement.appendChild(exportBtn);
        console.log('[NinjaCat Chat Export] Export button added');
    }

    function exportToPDF() {
        console.log('[NinjaCat Chat Export] Starting export...');
        
        // Get agent info
        const agentName = document.querySelector('h2')?.textContent?.trim() || 'NinjaCat Chat';
        const agentDescription = document.querySelector('.text-sm.text-grey-70')?.textContent?.trim() || '';
        
        // Get chat messages
        const messages = extractMessages();
        
        if (messages.length === 0) {
            alert('No messages found to export. Make sure you have an active conversation.');
            return;
        }

        // Generate clean HTML for PDF
        const html = generatePrintHTML(agentName, agentDescription, messages);
        
        // Open in new window and trigger print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    }

    function extractMessages() {
        const messages = [];
        
        // Try multiple selectors to find message containers
        const messageSelectors = [
            '.conversationMessagesContainer > div',
            '[class*="message"]',
            '.overflow-y-auto > div > div'
        ];

        let messageElements = [];
        for (const selector of messageSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                messageElements = Array.from(elements);
                console.log(`[NinjaCat Chat Export] Found ${elements.length} elements with selector: ${selector}`);
                break;
            }
        }

        // If we couldn't find messages with specific selectors, try to find them in the chat area
        if (messageElements.length === 0) {
            const chatArea = document.querySelector('.conversationMessagesContainer') || 
                           document.querySelector('.overflow-y-auto.mt-auto');
            if (chatArea) {
                messageElements = Array.from(chatArea.children);
            }
        }

        // Parse each message
        messageElements.forEach((el, index) => {
            const text = el.innerText?.trim();
            if (!text || text.length < 2) return;

            // Try to determine if this is user or assistant message
            // Usually user messages are on the right, assistant on left
            const isUser = el.classList.contains('ml-auto') || 
                          el.querySelector('[class*="ml-auto"]') ||
                          el.style?.marginLeft === 'auto';
            
            // Check for tool calls (usually have specific styling or icons)
            const isToolCall = el.innerText?.includes('Tool:') ||
                              el.querySelector('[class*="tool"]') ||
                              el.querySelector('svg[class*="tool"]');

            // Check for code blocks
            const codeBlocks = el.querySelectorAll('pre, code, [class*="code"]');
            const hasCode = codeBlocks.length > 0;

            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: text,
                isToolCall: isToolCall,
                hasCode: hasCode,
                index: index
            });
        });

        // If we still don't have messages, try a more aggressive approach
        if (messages.length === 0) {
            const allText = document.querySelector('#assistants-ui')?.innerText || '';
            if (allText.length > 100) {
                // Split by common patterns
                const parts = allText.split(/(?=You:|Assistant:|User:|\n\n)/);
                parts.forEach((part, i) => {
                    const trimmed = part.trim();
                    if (trimmed.length > 10) {
                        messages.push({
                            role: trimmed.startsWith('You:') ? 'user' : 'assistant',
                            content: trimmed.replace(/^(You:|Assistant:|User:)\s*/, ''),
                            isToolCall: false,
                            hasCode: false,
                            index: i
                        });
                    }
                });
            }
        }

        console.log(`[NinjaCat Chat Export] Extracted ${messages.length} messages`);
        return messages;
    }

    function generatePrintHTML(agentName, agentDescription, messages) {
        const timestamp = new Date().toLocaleString();
        
        const messageHTML = messages.map(msg => {
            const roleLabel = msg.role === 'user' ? 'You' : 'Agent';
            const roleColor = msg.role === 'user' ? '#3B82F6' : '#10B981';
            const bgColor = msg.role === 'user' ? '#EFF6FF' : '#F0FDF4';
            const toolBadge = msg.isToolCall ? '<span style="background:#F59E0B;color:white;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:8px;">Tool Call</span>' : '';
            
            // Escape HTML and preserve formatting
            let content = escapeHTML(msg.content);
            // Convert code blocks
            content = content.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre style="background:#1F2937;color:#F9FAFB;padding:12px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:12px;margin:8px 0;">$2</pre>');
            // Convert inline code
            content = content.replace(/`([^`]+)`/g, '<code style="background:#E5E7EB;padding:2px 4px;border-radius:3px;font-family:monospace;font-size:13px;">$1</code>');
            // Convert newlines
            content = content.replace(/\n/g, '<br>');
            
            return `
                <div style="margin-bottom:20px;page-break-inside:avoid;">
                    <div style="font-weight:600;color:${roleColor};margin-bottom:6px;font-size:14px;">
                        ${roleLabel}${toolBadge}
                    </div>
                    <div style="background:${bgColor};padding:12px 16px;border-radius:8px;border-left:4px solid ${roleColor};line-height:1.6;">
                        ${content}
                    </div>
                </div>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHTML(agentName)} - Chat Export</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #1F2937;
            line-height: 1.5;
        }
        @media print {
            body {
                padding: 20px;
            }
            .no-print {
                display: none !important;
            }
        }
        h1 {
            font-size: 24px;
            margin: 0 0 8px 0;
            color: #111827;
        }
        .description {
            color: #6B7280;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .timestamp {
            color: #9CA3AF;
            font-size: 12px;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid #E5E7EB;
        }
        .messages {
            margin-top: 24px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        @page {
            margin: 1cm;
        }
    </style>
</head>
<body>
    <h1>${escapeHTML(agentName)}</h1>
    ${agentDescription ? `<div class="description">${escapeHTML(agentDescription)}</div>` : ''}
    <div class="timestamp">Exported: ${timestamp}</div>
    
    <button class="no-print" onclick="window.print()" style="background:#3B82F6;color:white;border:none;border-radius:6px;padding:10px 20px;font-weight:600;cursor:pointer;margin-bottom:24px;">
        Print / Save as PDF
    </button>
    
    <div class="messages">
        ${messageHTML}
    </div>
    
    <div class="timestamp" style="margin-top:32px;padding-top:16px;border-top:1px solid #E5E7EB;border-bottom:none;">
        Generated by NinjaCat Chat Export
    </div>
</body>
</html>
        `;
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

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
