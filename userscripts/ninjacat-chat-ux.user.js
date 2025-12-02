// ==UserScript==
// @name         NinjaCat Chat UX Enhancements
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Multi-file drag-drop, message queue, always-unlocked input, and error recovery for NinjaCat chat
// @author       NinjaCat Tweaks
// @match        https://app.ninjacat.io/*
// @match        https://app.mymarketingreports.com/*
// @grant        none
// @run-at       document-end
// @homepage     https://github.com/jms830/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-ux.meta.js
// @downloadURL  https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-ux.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Only run on chat pages (URLs containing /chat/ or agent detail pages)
    const path = window.location.pathname;
    if (!path.includes('/chat/') && !path.includes('/agents/')) {
        return;
    }

    console.log('[NinjaCat Chat UX] Script loaded v1.0.0');

    // ---- Configuration ----
    const CONFIG = {
        MAX_QUEUE_SIZE: 3,
        ACCEPTED_FILE_TYPES: ['.csv', '.png', '.jpg', '.jpeg', '.pdf', '.txt', '.md', '.json'],
        DEBUG: localStorage.getItem('ninjacat-chat-debug') === 'true'
    };

    // ---- State ----
    let messageQueue = [];
    let isAgentProcessing = false;
    let queuePaused = false;
    let dropZoneVisible = false;
    let observer = null;

    // ---- Debug Logging ----
    function debugLog(...args) {
        if (CONFIG.DEBUG) {
            console.log('[NinjaCat Chat UX DEBUG]', ...args);
        }
    }

    // ---- DOM Selectors ----
    const SELECTORS = {
        chatTextarea: '#autoselect-experience',
        fileInput: 'input[type="file"].hidden',
        inputContainer: '.border.rounded-3xl.bg-white',
        inputWrapper: '.min-w-\\[200px\\].max-w-\\[840px\\]',
        attachIcon: '.flex.items-center > svg:first-of-type',
        sendButton: '.rounded-full.bg-blue-5',
        messagesContainer: '.conversationMessagesContainer, [class*="conversation"], [class*="messages"]'
    };

    // ---- Utility Functions ----
    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function getTextarea() {
        return $(SELECTORS.chatTextarea);
    }

    function getFileInput() {
        return $(SELECTORS.fileInput);
    }

    function getInputContainer() {
        // Try multiple approaches to find the input container
        const textarea = getTextarea();
        if (textarea) {
            // Walk up to find the rounded border container
            let el = textarea.parentElement;
            while (el) {
                if (el.classList.contains('rounded-3xl') || 
                    el.className.includes('rounded-3xl')) {
                    return el;
                }
                el = el.parentElement;
            }
        }
        return $(SELECTORS.inputContainer);
    }

    function getInputWrapper() {
        const textarea = getTextarea();
        if (textarea) {
            let el = textarea.parentElement;
            while (el) {
                const style = el.getAttribute('class') || '';
                if (style.includes('min-w-[200px]') || style.includes('max-w-[840px]')) {
                    return el;
                }
                el = el.parentElement;
            }
        }
        return null;
    }

    // ---- Styles ----
    function injectStyles() {
        if (document.getElementById('ninjacat-chat-ux-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'ninjacat-chat-ux-styles';
        styles.textContent = `
            /* Drop Zone Overlay */
            .nc-drop-zone {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(59, 130, 246, 0.15);
                border: 4px dashed #3B82F6;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                pointer-events: none;
                transition: opacity 0.2s ease;
            }
            
            .nc-drop-zone.visible {
                display: flex;
                pointer-events: auto;
            }
            
            .nc-drop-zone-content {
                background: white;
                padding: 32px 48px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                text-align: center;
            }
            
            .nc-drop-zone-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            .nc-drop-zone-text {
                font-size: 18px;
                font-weight: 600;
                color: #1F2937;
                margin-bottom: 8px;
            }
            
            .nc-drop-zone-hint {
                font-size: 14px;
                color: #6B7280;
            }
            
            /* Message Queue UI */
            .nc-queue-container {
                margin-top: 8px;
                padding: 0 20px;
            }
            
            .nc-queue-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: #FEF3C7;
                border-radius: 8px 8px 0 0;
                border: 1px solid #FCD34D;
                border-bottom: none;
            }
            
            .nc-queue-title {
                font-size: 12px;
                font-weight: 600;
                color: #92400E;
            }
            
            .nc-queue-actions {
                display: flex;
                gap: 8px;
            }
            
            .nc-queue-btn {
                padding: 4px 8px;
                font-size: 11px;
                border-radius: 4px;
                cursor: pointer;
                border: none;
                font-weight: 500;
            }
            
            .nc-queue-btn-resume {
                background: #10B981;
                color: white;
            }
            
            .nc-queue-btn-clear {
                background: #EF4444;
                color: white;
            }
            
            .nc-queue-list {
                border: 1px solid #FCD34D;
                border-radius: 0 0 8px 8px;
                overflow: hidden;
            }
            
            .nc-queue-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: #FFFBEB;
                border-bottom: 1px solid #FEF3C7;
                gap: 8px;
            }
            
            .nc-queue-item:last-child {
                border-bottom: none;
            }
            
            .nc-queue-item-number {
                width: 20px;
                height: 20px;
                background: #F59E0B;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .nc-queue-item-text {
                flex: 1;
                font-size: 13px;
                color: #374151;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .nc-queue-item-actions {
                display: flex;
                gap: 4px;
                flex-shrink: 0;
            }
            
            .nc-queue-item-btn {
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 3px;
                cursor: pointer;
                border: 1px solid #D1D5DB;
                background: white;
            }
            
            .nc-queue-item-btn:hover {
                background: #F3F4F6;
            }
            
            /* File count badge */
            .nc-file-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                background: #3B82F6;
                color: white;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 5px;
                border-radius: 8px;
                min-width: 14px;
                text-align: center;
            }
            
            /* Status indicator */
            .nc-status-indicator {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                margin-left: 8px;
            }
            
            .nc-status-processing {
                background: #DBEAFE;
                color: #1E40AF;
            }
            
            .nc-status-error {
                background: #FEE2E2;
                color: #991B1B;
            }
            
            .nc-status-queued {
                background: #FEF3C7;
                color: #92400E;
            }
            
            /* Toast notifications */
            .nc-toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: #1F2937;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .nc-toast.visible {
                opacity: 1;
            }
            
            .nc-toast.error {
                background: #DC2626;
            }
            
            .nc-toast.success {
                background: #059669;
            }
        `;
        document.head.appendChild(styles);
    }

    // ---- Toast Notifications ----
    let toastTimeout = null;
    function showToast(message, type = 'info') {
        let toast = document.getElementById('nc-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'nc-toast';
            toast.className = 'nc-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.className = `nc-toast ${type}`;
        
        // Clear existing timeout
        if (toastTimeout) clearTimeout(toastTimeout);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
        // Hide after delay
        toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    // ---- Drop Zone ----
    function createDropZone() {
        if (document.getElementById('nc-drop-zone')) return;

        const dropZone = document.createElement('div');
        dropZone.id = 'nc-drop-zone';
        dropZone.className = 'nc-drop-zone';
        dropZone.innerHTML = `
            <div class="nc-drop-zone-content">
                <div class="nc-drop-zone-icon">📎</div>
                <div class="nc-drop-zone-text">Drop files here</div>
                <div class="nc-drop-zone-hint">Supports: ${CONFIG.ACCEPTED_FILE_TYPES.join(', ')}</div>
            </div>
        `;
        document.body.appendChild(dropZone);

        // Handle drop
        dropZone.addEventListener('drop', handleDrop);
        dropZone.addEventListener('dragover', (e) => e.preventDefault());
        dropZone.addEventListener('dragleave', (e) => {
            // Only hide if leaving the drop zone entirely
            if (e.relatedTarget === null || !dropZone.contains(e.relatedTarget)) {
                hideDropZone();
            }
        });

        return dropZone;
    }

    function showDropZone() {
        const dropZone = document.getElementById('nc-drop-zone') || createDropZone();
        dropZone.classList.add('visible');
        dropZoneVisible = true;
    }

    function hideDropZone() {
        const dropZone = document.getElementById('nc-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('visible');
        }
        dropZoneVisible = false;
    }

    function handleDrop(e) {
        e.preventDefault();
        hideDropZone();

        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length === 0) return;

        debugLog('Dropped files:', files.map(f => f.name));

        // Filter valid files
        const validFiles = files.filter(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            return CONFIG.ACCEPTED_FILE_TYPES.includes(ext);
        });

        const invalidCount = files.length - validFiles.length;
        if (invalidCount > 0) {
            showToast(`${invalidCount} file(s) rejected - unsupported type`, 'error');
        }

        if (validFiles.length === 0) return;

        // Attach files to the hidden file input
        attachFilesToInput(validFiles);
        showToast(`${validFiles.length} file(s) attached`, 'success');
    }

    function attachFilesToInput(files) {
        const fileInput = getFileInput();
        if (!fileInput) {
            console.error('[NinjaCat Chat UX] File input not found');
            showToast('Could not attach files - input not found', 'error');
            return;
        }

        // Create a DataTransfer to set files on input
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        debugLog('Files attached to input:', fileInput.files.length);
    }

    // ---- Drag Events on Document ----
    let dragCounter = 0;

    function setupDragListeners() {
        document.addEventListener('dragenter', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                dragCounter++;
                showDropZone();
            }
        });

        document.addEventListener('dragleave', (e) => {
            dragCounter--;
            if (dragCounter === 0) {
                hideDropZone();
            }
        });

        document.addEventListener('dragover', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            dragCounter = 0;
            // Drop is handled by dropZone if visible
            if (!dropZoneVisible) {
                e.preventDefault();
            }
        });
    }

    // ---- Always Unlocked Input ----
    function ensureInputUnlocked() {
        const textarea = getTextarea();
        if (!textarea) return;

        // Remove disabled attribute if present
        if (textarea.disabled) {
            textarea.disabled = false;
            debugLog('Unlocked textarea (was disabled)');
        }

        // Remove readonly if present
        if (textarea.readOnly) {
            textarea.readOnly = false;
            debugLog('Unlocked textarea (was readonly)');
        }

        // Check for any disabling classes and remove them
        if (textarea.classList.contains('disabled') || 
            textarea.classList.contains('cursor-not-allowed')) {
            textarea.classList.remove('disabled', 'cursor-not-allowed');
            debugLog('Removed disabling classes from textarea');
        }
    }

    // ---- Agent Processing Detection ----
    function detectAgentProcessing() {
        // Look for common indicators that agent is processing
        // This may need adjustment based on actual NinjaCat UI
        const indicators = [
            // Loading spinners
            '.animate-spin',
            '[class*="loading"]',
            '[class*="spinner"]',
            // Processing text
            '[class*="processing"]',
            // Disabled send button
            'button[disabled] svg[class*="arrow"]'
        ];

        for (const selector of indicators) {
            const el = $(selector);
            if (el && el.offsetParent !== null) {
                return true;
            }
        }

        // Check if textarea is disabled by the app
        const textarea = getTextarea();
        if (textarea?.disabled) {
            return true;
        }

        return false;
    }

    function updateAgentState() {
        const wasProcessing = isAgentProcessing;
        isAgentProcessing = detectAgentProcessing();

        if (wasProcessing && !isAgentProcessing) {
            debugLog('Agent finished processing');
            onAgentComplete();
        } else if (!wasProcessing && isAgentProcessing) {
            debugLog('Agent started processing');
        }

        // Always ensure input is unlocked
        ensureInputUnlocked();
    }

    function onAgentComplete() {
        // If queue is not paused and has items, send next message
        if (!queuePaused && messageQueue.length > 0) {
            const nextMessage = messageQueue.shift();
            sendMessage(nextMessage);
            updateQueueUI();
        }
    }

    // ---- Message Queue ----
    function addToQueue(message) {
        if (messageQueue.length >= CONFIG.MAX_QUEUE_SIZE) {
            showToast(`Queue full (max ${CONFIG.MAX_QUEUE_SIZE} messages)`, 'error');
            return false;
        }

        messageQueue.push(message);
        updateQueueUI();
        showToast(`Message queued (${messageQueue.length}/${CONFIG.MAX_QUEUE_SIZE})`, 'info');
        return true;
    }

    function removeFromQueue(index) {
        if (index >= 0 && index < messageQueue.length) {
            messageQueue.splice(index, 1);
            updateQueueUI();
        }
    }

    function clearQueue() {
        messageQueue = [];
        queuePaused = false;
        updateQueueUI();
        showToast('Queue cleared', 'info');
    }

    function pauseQueue() {
        queuePaused = true;
        updateQueueUI();
    }

    function resumeQueue() {
        queuePaused = false;
        if (!isAgentProcessing && messageQueue.length > 0) {
            const nextMessage = messageQueue.shift();
            sendMessage(nextMessage);
        }
        updateQueueUI();
    }

    function sendMessage(text) {
        const textarea = getTextarea();
        if (!textarea) {
            console.error('[NinjaCat Chat UX] Cannot send - textarea not found');
            return;
        }

        // Set textarea value
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Find and click send button
        // The send button is the blue circle with arrow
        const sendBtn = document.querySelector('.rounded-full.bg-blue-5, .rounded-full[class*="bg-blue"]');
        if (sendBtn) {
            sendBtn.click();
            debugLog('Message sent:', text.substring(0, 50) + '...');
        } else {
            // Fallback: simulate Enter key
            textarea.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            }));
        }
    }

    // ---- Queue UI ----
    function updateQueueUI() {
        let container = document.getElementById('nc-queue-container');
        
        if (messageQueue.length === 0) {
            if (container) container.remove();
            return;
        }

        const wrapper = getInputWrapper();
        if (!wrapper) return;

        if (!container) {
            container = document.createElement('div');
            container.id = 'nc-queue-container';
            container.className = 'nc-queue-container';
            wrapper.parentElement?.insertBefore(container, wrapper.nextSibling);
        }

        const pausedClass = queuePaused ? 'paused' : '';
        container.innerHTML = `
            <div class="nc-queue-header ${pausedClass}">
                <span class="nc-queue-title">
                    ${queuePaused ? '⏸️ Queue Paused' : '⏳ Pending Messages'} (${messageQueue.length})
                </span>
                <div class="nc-queue-actions">
                    ${queuePaused ? 
                        '<button class="nc-queue-btn nc-queue-btn-resume" onclick="window._ncResumeQueue()">▶️ Resume</button>' : 
                        ''}
                    <button class="nc-queue-btn nc-queue-btn-clear" onclick="window._ncClearQueue()">Clear All</button>
                </div>
            </div>
            <div class="nc-queue-list">
                ${messageQueue.map((msg, i) => `
                    <div class="nc-queue-item">
                        <span class="nc-queue-item-number">${i + 1}</span>
                        <span class="nc-queue-item-text" title="${escapeHtml(msg)}">${escapeHtml(truncate(msg, 60))}</span>
                        <div class="nc-queue-item-actions">
                            <button class="nc-queue-item-btn" onclick="window._ncEditQueueItem(${i})">Edit</button>
                            <button class="nc-queue-item-btn" onclick="window._ncRemoveQueueItem(${i})">×</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function editQueueItem(index) {
        const msg = messageQueue[index];
        const newMsg = prompt('Edit message:', msg);
        if (newMsg !== null && newMsg.trim()) {
            messageQueue[index] = newMsg.trim();
            updateQueueUI();
        }
    }

    // Expose functions to window for onclick handlers
    window._ncClearQueue = clearQueue;
    window._ncResumeQueue = resumeQueue;
    window._ncRemoveQueueItem = removeFromQueue;
    window._ncEditQueueItem = editQueueItem;

    // ---- Input Interception ----
    function setupInputInterception() {
        const textarea = getTextarea();
        if (!textarea || textarea.dataset.ncIntercepted) return;

        textarea.dataset.ncIntercepted = 'true';

        // Intercept Enter key
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const text = textarea.value.trim();
                if (!text) return;

                if (isAgentProcessing) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (addToQueue(text)) {
                        textarea.value = '';
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
                // If not processing, let the default behavior happen
            }
        }, true);

        debugLog('Input interception setup complete');
    }

    // ---- Error Detection ----
    function detectError() {
        // Look for error messages in the chat
        const errorIndicators = [
            '[class*="error"]',
            '[class*="failed"]',
            '.text-red-500',
            '.text-red-600'
        ];

        // Check for recent error messages
        const messages = $$(SELECTORS.messagesContainer + ' > *');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            for (const selector of errorIndicators) {
                if (lastMessage.querySelector(selector)) {
                    return true;
                }
            }
            // Check text content for error keywords
            const text = lastMessage.textContent?.toLowerCase() || '';
            if (text.includes('error') || text.includes('failed') || text.includes('something went wrong')) {
                return true;
            }
        }

        return false;
    }

    function onErrorDetected() {
        debugLog('Error detected - pausing queue');
        pauseQueue();
        ensureInputUnlocked();
        showToast('Error detected - queue paused. Input unlocked.', 'error');
    }

    // ---- Utility Functions ----
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // ---- MutationObserver ----
    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            // Check for input state changes
            updateAgentState();

            // Re-setup input interception if textarea was re-rendered
            const textarea = getTextarea();
            if (textarea && !textarea.dataset.ncIntercepted) {
                setupInputInterception();
            }

            // Check for errors
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Small delay to let DOM settle
                    setTimeout(() => {
                        if (detectError()) {
                            onErrorDetected();
                        }
                    }, 100);
                    break;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'readonly', 'class']
        });

        debugLog('MutationObserver started');
    }

    // ---- Initialization ----
    function init() {
        console.log('[NinjaCat Chat UX] Initializing...');

        injectStyles();
        createDropZone();
        setupDragListeners();
        setupInputInterception();
        setupObserver();

        // Initial state check
        updateAgentState();

        console.log('[NinjaCat Chat UX] Initialization complete');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Small delay to ensure NinjaCat's Vue app has rendered
        setTimeout(init, 500);
    }

    // Re-init on SPA navigation
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            if (lastPath.includes('/chat/') || lastPath.includes('/agents/')) {
                console.log('[NinjaCat Chat UX] SPA navigation detected - re-initializing');
                setTimeout(init, 500);
            }
        }
    }, 1000);

})();
