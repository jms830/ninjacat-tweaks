// ==UserScript==
// @name         NinjaCat Chat UX Enhancements
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  Multi-file drag-drop, message queue, auto-linkify URLs, and partial response preservation for NinjaCat chat
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

    // Run on chat pages AND agent builder pages
    const path = window.location.pathname;
    if (!path.includes('/chat/') && !path.includes('/agents/')) {
        return;
    }

    console.log('[NinjaCat Chat UX] Script loaded v1.5.1');

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
    let activeDropTarget = null; // Which file input area we're targeting
    let linkifyDebounceTimer = null; // Debounce timer for URL linkification

    // ---- Debug Logging ----
    function debugLog(...args) {
        if (CONFIG.DEBUG) {
            console.log('[NinjaCat Chat UX DEBUG]', ...args);
        }
    }

    // ---- App / Store Helpers ----
    function getAppContext() {
        const app = document.querySelector('#assistants-ui')?.__vue_app__;
        const pinia = app?._context?.provides?.pinia || app?.config?.globalProperties?.$pinia;
        return { app, pinia };
    }

    function getPiniaStores() {
        const { pinia } = getAppContext();
        if (!pinia) return {};
        const storeAccessor = pinia._s?.get ? (name) => pinia._s.get(name) : () => null;
        return {
            pinia,
            conversationStore: storeAccessor('conversation') || pinia.state?.value?.conversation,
            liveChatStore: storeAccessor('live-chat') || storeAccessor('liveChat') || pinia.state?.value?.['live-chat']
        };
    }

    function getCurrentConversationId() {
        const path = window.location.pathname;
        const match = path.match(/[0-9a-fA-F-]{12,}/);
        if (match) return match[0];
        const parts = path.split('/').filter(Boolean);
        return parts[parts.length - 1] || parts[parts.length - 2] || '';
    }

    function generateRequestId() {
        return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
    }

    function instrumentSocket(socket) {
        if (!socket || socket._ncInstrumented) return;
        socket._ncInstrumented = true;
        const origEmit = socket.emit;
        socket.emit = function(event, ...args) {
            if (CONFIG.DEBUG && typeof event === 'string' && event.includes('message')) {
                debugLog('socket.emit', event, args[0]);
            }
            return origEmit.apply(this, [event, ...args]);
        };
        debugLog('Socket instrumentation attached');
    }

    function getLiveSocket() {
        const { liveChatStore } = getPiniaStores();
        let socket = liveChatStore?.socket;
        if (!socket && window.io?.sockets) {
            for (const candidate of Object.values(window.io.sockets)) {
                if (candidate?.connected) {
                    socket = candidate;
                    break;
                }
            }
        }
        if (socket) instrumentSocket(socket);
        return socket;
    }

    // ---- Error Recovery Functions ----
    
    /**
     * Nuclear state reset - clear ALL blocking state to flip NinjaCat back to normal
     */
    function nuclearStateReset() {
        try {
            const { liveChatStore, conversationStore, pinia } = getPiniaStores();
            const conversationId = getCurrentConversationId();
            if (!conversationId) {
                debugLog('No conversation ID for state reset');
                return false;
            }

            let cleared = false;
            debugLog('=== NUCLEAR STATE RESET ===');
            debugLog('Conversation ID:', conversationId);

            // Log current state before clearing
            if (liveChatStore) {
                debugLog('liveChatStore keys:', Object.keys(liveChatStore));
                debugLog('streamingMessages:', liveChatStore.streamingMessages);
            }

            // Clear EVERYTHING in live-chat store that might be blocking
            if (liveChatStore) {
                // streamingMessages
                if (liveChatStore.streamingMessages?.[conversationId]) {
                    debugLog('Clearing streamingMessages[' + conversationId + ']');
                    delete liveChatStore.streamingMessages[conversationId];
                    cleared = true;
                }
                // Clear entire streamingMessages if still blocking
                if (liveChatStore.streamingMessages && Object.keys(liveChatStore.streamingMessages).length > 0) {
                    debugLog('Clearing ALL streamingMessages');
                    for (const key of Object.keys(liveChatStore.streamingMessages)) {
                        delete liveChatStore.streamingMessages[key];
                    }
                    cleared = true;
                }
                // pendingMessages
                if (liveChatStore.pendingMessages?.[conversationId]) {
                    debugLog('Clearing pendingMessages');
                    delete liveChatStore.pendingMessages[conversationId];
                    cleared = true;
                }
                // isStreaming flag
                if (liveChatStore.isStreaming) {
                    debugLog('Clearing isStreaming');
                    liveChatStore.isStreaming = false;
                    cleared = true;
                }
                // isSending flag
                if (liveChatStore.isSending) {
                    debugLog('Clearing isSending');
                    liveChatStore.isSending = false;
                    cleared = true;
                }
                // activeStreams
                if (liveChatStore.activeStreams?.[conversationId]) {
                    debugLog('Clearing activeStreams');
                    delete liveChatStore.activeStreams[conversationId];
                    cleared = true;
                }
                // error
                if (liveChatStore.error) {
                    debugLog('Clearing liveChatStore.error');
                    liveChatStore.error = null;
                    cleared = true;
                }
            }

            // Reset conversation state
            if (conversationStore) {
                debugLog('conversationStore keys:', Object.keys(conversationStore));
                const conv = conversationStore.conversations?.[conversationId];
                if (conv) {
                    debugLog('Conversation state:', conv.state);
                    // Reset state to IDLE regardless of current state
                    if (conv.state && conv.state !== 'IDLE') {
                        debugLog('Resetting state from', conv.state, 'to IDLE');
                        conv.state = 'IDLE';
                        cleared = true;
                    }
                    // Clear error
                    if (conv.error) {
                        debugLog('Clearing conversation.error');
                        conv.error = null;
                        cleared = true;
                    }
                    // Clear generating flags
                    if (conv.isGenerating) {
                        debugLog('Clearing isGenerating');
                        conv.isGenerating = false;
                        cleared = true;
                    }
                    if (conv.generating) {
                        debugLog('Clearing generating');
                        conv.generating = false;
                        cleared = true;
                    }
                    // Clear pending
                    if (conv.pending) {
                        debugLog('Clearing pending');
                        conv.pending = null;
                        cleared = true;
                    }
                }
            }

            // Remove error UI elements from DOM
            const errorButtons = document.querySelectorAll('button');
            for (const btn of errorButtons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('resend') || text.includes('edit last message')) {
                    debugLog('Hiding error button:', text);
                    btn.style.display = 'none';
                }
            }

            debugLog('=== NUCLEAR RESET COMPLETE ===');
            debugLog('Cleared:', cleared);
            return cleared;
        } catch (err) {
            debugLog('Error in nuclear state reset:', err);
            return false;
        }
    }

    // Alias for compatibility
    function clearStaleStreamingState() {
        return nuclearStateReset();
    }
    
    /**
     * Click the native "Resend" button if visible
     */
    function clickResendButton() {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const text = btn.textContent.toLowerCase().trim();
            if (text === 'resend' || text.includes('resend')) {
                debugLog('Found and clicking Resend button');
                btn.click();
                return true;
            }
        }
        debugLog('Resend button not found');
        return false;
    }
    
    /**
     * Click the native "Edit last message" button if visible
     */
    function clickEditLastMessageButton() {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const text = btn.textContent.toLowerCase().trim();
            if (text.includes('edit last message') || text.includes('edit message')) {
                debugLog('Found and clicking Edit last message button');
                btn.click();
                return true;
            }
        }
        debugLog('Edit last message button not found');
        return false;
    }

    /**
     * Use native "Edit last message" flow but inject our new text
     * This is the simplest reliable approach - let NinjaCat handle the complexity
     */
    function editLastMessageWithText(newText) {
        return new Promise((resolve) => {
            // Step 1: Click the Edit button
            if (!clickEditLastMessageButton()) {
                debugLog('Edit button not found');
                resolve(false);
                return;
            }

            // Step 2: Wait for edit textarea to appear
            let attempts = 0;
            const maxAttempts = 20;
            const checkInterval = setInterval(() => {
                attempts++;
                
                // Look for the edit textarea - it's usually a new textarea that appears
                // or the existing one enters an "edit mode"
                const editTextarea = document.querySelector('textarea[placeholder*="Edit"], textarea.editing, [data-editing="true"] textarea');
                const anyTextarea = document.querySelector('#autoselect-experience, textarea');
                
                // Check if we're now in edit mode by looking for a "Save" or "Update" button
                const saveBtn = Array.from(document.querySelectorAll('button')).find(btn => {
                    const t = btn.textContent.toLowerCase();
                    return t.includes('save') || t.includes('update') || t.includes('send');
                });
                
                const targetTextarea = editTextarea || anyTextarea;
                
                if (targetTextarea && saveBtn) {
                    clearInterval(checkInterval);
                    debugLog('Edit mode detected, injecting new text');
                    
                    // Step 3: Inject our new text
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                    nativeSetter.call(targetTextarea, newText);
                    targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Step 4: Click save/send after a brief delay
                    setTimeout(() => {
                        debugLog('Clicking save/send button');
                        saveBtn.click();
                        resolve(true);
                    }, 100);
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    debugLog('Edit mode did not appear after clicking Edit button');
                    resolve(false);
                }
            }, 100);
        });
    }

    function sendViaSocket(messageText, options = {}) {
        const socket = getLiveSocket();
        if (!socket) {
            debugLog('No live socket available for recovery send');
            return false;
        }

        const context = getConversationContext();
        if (!context || !context.conversationId || !context.assistantId) {
            debugLog('Missing context for socket send');
            return false;
        }

        const basePayload = {
            request_id: generateRequestId(),
            conversation_id: context.conversationId,
            assistant_id: context.assistantId,
            message: messageText,
            inputs: []
        };

        const forceResend = options.mode === 'resend';
        const canResend = Boolean(context.lastUserMessageId);
        const shouldResend = forceResend ? canResend : canResend && options.mode !== 'send-only';
        const eventName = shouldResend ? 'resend-user-message' : 'send-user-message';

        if (shouldResend) {
            basePayload.message_id = context.lastUserMessageId;
        }

        try {
            debugLog(`Emitting ${eventName} via socket`, basePayload);
            socket.emit(eventName, basePayload);
            return eventName;
        } catch (err) {
            debugLog(`${eventName} emit failed:`, err);
            return false;
        }
    }

    // ---- Conversation Context Helpers ----
    /**
     * Get Pinia store data needed for error recovery
     * Returns { conversationId, assistantId, lastUserMessageId } or null
     */
    function getConversationContext() {
        try {
            const { conversationStore } = getPiniaStores();
            if (!conversationStore) {
                debugLog('Conversation store not found');
                return null;
            }

            const conversationId = getCurrentConversationId();
            if (!conversationId) {
                debugLog('Could not extract conversation ID');
                return null;
            }

            const conversation = conversationStore.conversations?.[conversationId] || conversationStore.conversation;
            if (!conversation) {
                debugLog('Conversation data not found');
                return null;
            }

            const assistantId = conversation.assistant_id || conversation.assistantId;

            let lastUserMessageId = null;
            const messages = conversation.messages || [];
            for (let i = messages.length - 1; i >= 0; i--) {
                const msg = messages[i];
                if (msg.role === 'user' || msg.type === 'user') {
                    lastUserMessageId = msg.id || msg.message_id;
                    break;
                }
            }

            debugLog('Conversation context:', { conversationId, assistantId, lastUserMessageId });
            return { conversationId, assistantId, lastUserMessageId };
        } catch (err) {
            console.error('[NinjaCat Chat UX] Error getting conversation context:', err);
            return null;
        }
    }

    /**
     * Check if conversation is in an error state that blocks normal sends
     */
    function isConversationInErrorState() {
        try {
            const { conversationStore, liveChatStore } = getPiniaStores();
            const conversationId = getCurrentConversationId();

            if (conversationStore) {
                const conv = conversationStore.conversations?.[conversationId];
                if (conv?.state === 'ERROR') {
                    debugLog('Conversation is in ERROR state');
                    return true;
                }
            }

            if (liveChatStore?.streamingMessages?.[conversationId]) {
                debugLog('streamingMessages has stale entry');
                return true;
            }

            const errorButtons = document.querySelectorAll('button');
            for (const btn of errorButtons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('resend') || text.includes('edit last message')) {
                    debugLog('Error recovery buttons visible');
                    return true;
                }
            }

            return false;
        } catch (err) {
            return false;
        }
    }

    /**
     * Attempt error recovery using multiple strategies:
     * 1. Clear stale Pinia state so normal send works
     * 2. Click native Resend button if visible
     * 3. Click native Edit last message button if visible
     * Returns true if any recovery method succeeded
     */
    function attemptErrorRecovery() {
        debugLog('Attempting error recovery...');
        
        // Strategy 1: Clear stale state first - this often fixes the issue
        const stateCleared = clearStaleStreamingState();
        if (stateCleared) {
            debugLog('Stale state cleared - normal send should work now');
            return 'state_cleared';
        }
        
        // Strategy 2: Click the Resend button if visible
        if (clickResendButton()) {
            return 'resend_clicked';
        }
        
        // Strategy 3: Click Edit last message button
        if (clickEditLastMessageButton()) {
            return 'edit_clicked';
        }
        
        debugLog('No error recovery method succeeded');
        return false;
    }
    // ---- Error State Warning Banner ----
    // Simple yellow warning when in error state to inform user
    
    let errorWarningVisible = false;
    
    /**
     * Show warning banner when in error state
     */
    function showErrorStateWarning() {
        if (document.getElementById('nc-error-state-warning')) return;
        
        const inputWrapper = document.querySelector('.min-w-\\[200px\\].max-w-\\[840px\\]') ||
                            document.querySelector('[class*="input"]')?.closest('div[class*="w-"]');
        
        if (!inputWrapper) return;
        
        const warning = document.createElement('div');
        warning.id = 'nc-error-state-warning';
        warning.className = 'nc-error-state-warning';
        warning.innerHTML = `
            <span class="nc-error-state-warning-icon">⚠️</span>
            <span class="nc-error-state-warning-text">
                <strong>Error state detected</strong>
                <small>Use "Resend" or "Edit last message" buttons above to continue</small>
            </span>
        `;
        
        inputWrapper.parentNode.insertBefore(warning, inputWrapper);
        errorWarningVisible = true;
        debugLog('Error state warning shown');
    }
    
    /**
     * Hide the error state warning
     */
    function hideErrorStateWarning() {
        const warning = document.getElementById('nc-error-state-warning');
        if (warning) {
            warning.remove();
            errorWarningVisible = false;
            debugLog('Error state warning hidden');
        }
    }
    
    /**
     * Update error state UI - call this when state might have changed
     */
    function updateErrorStateUI() {
        const inErrorState = isConversationInErrorState();
        
        if (inErrorState && !errorWarningVisible) {
            showErrorStateWarning();
        } else if (!inErrorState && errorWarningVisible) {
            hideErrorStateWarning();
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
        messagesContainer: '.conversationMessagesContainer, [class*="conversation"], [class*="messages"]',
        // Agent Builder specific
        knowledgeTab: '[data-automation-id="Knowledge"][aria-selected="true"]',
        knowledgeFilesSection: 'h3:contains("Files"), h3',
        addFileButton: '.text-blue-100:contains("Add File"), .cursor-pointer:has(.text-blue-100)'
    };

    // File upload contexts - helps determine which input to use
    const FILE_CONTEXTS = {
        CHAT: 'chat',           // Main chat or test chat
        BUILDER: 'builder',     // Builder chat (left pane)  
        KNOWLEDGE: 'knowledge'  // Knowledge tab file uploads
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

    /**
     * Find all file inputs on the page and return them with context
     */
    function getAllFileInputs() {
        const inputs = [];
        const fileInputs = $$('input[type="file"].hidden');
        
        fileInputs.forEach((input, index) => {
            const context = determineFileInputContext(input);
            inputs.push({ element: input, context, index });
            debugLog(`File input ${index}: context=${context}`);
        });
        
        return inputs;
    }

    /**
     * Determine which context a file input belongs to
     */
    function determineFileInputContext(input) {
        // Check if in Knowledge tab section (look for "Files" header nearby)
        const parent = input.parentElement;
        if (parent) {
            // Knowledge section has h3 "Files" header
            const h3 = parent.querySelector('h3');
            if (h3 && h3.textContent.includes('Files')) {
                return FILE_CONTEXTS.KNOWLEDGE;
            }
            
            // Knowledge section also has "Add File" button
            const addFileText = parent.querySelector('.text-blue-100');
            if (addFileText && addFileText.textContent.includes('Add File')) {
                return FILE_CONTEXTS.KNOWLEDGE;
            }
        }
        
        // Check if associated with a chat textarea
        const container = input.closest('.border.rounded-3xl');
        if (container) {
            const textarea = container.querySelector('#autoselect-experience');
            if (textarea) {
                // Check if this is the builder chat (has "Test" button nearby)
                const testBtn = container.querySelector('[data-tip*="test"], .tooltip');
                if (testBtn) {
                    return FILE_CONTEXTS.BUILDER;
                }
                return FILE_CONTEXTS.CHAT;
            }
        }
        
        // Default to chat
        return FILE_CONTEXTS.CHAT;
    }

    /**
     * Find the best file input to use based on drop location
     */
    function findFileInputNearPoint(x, y) {
        const allInputs = getAllFileInputs();
        if (allInputs.length === 0) return null;
        if (allInputs.length === 1) return allInputs[0].element;
        
        // Check which tab is active (Knowledge vs Create/General)
        const knowledgeTab = $('[data-automation-id="Knowledge"][aria-selected="true"]');
        if (knowledgeTab) {
            // Prefer knowledge file input
            const knowledgeInput = allInputs.find(i => i.context === FILE_CONTEXTS.KNOWLEDGE);
            if (knowledgeInput) {
                debugLog('Knowledge tab active - using knowledge file input');
                return knowledgeInput.element;
            }
        }
        
        // Try to find the closest chat input container to the drop point
        const chatContainers = $$('.border.rounded-3xl');
        let closestContainer = null;
        let closestDistance = Infinity;
        
        chatContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestContainer = container;
            }
        });
        
        if (closestContainer) {
            const input = closestContainer.querySelector('input[type="file"].hidden');
            if (input) {
                debugLog('Found closest file input to drop point');
                return input;
            }
        }
        
        // Fallback to first available
        debugLog('Using first available file input');
        return allInputs[0].element;
    }

    function getInputContainer() {
        const textarea = getTextarea();
        if (textarea) {
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
            
            .nc-drop-zone-context {
                margin-top: 12px;
                font-size: 13px;
                font-weight: 500;
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
            
            /* Error State Warning Banner */
            .nc-error-state-warning {
                margin: 8px 20px;
                padding: 10px 14px;
                background: #FEF3C7;
                border: 1px solid #F59E0B;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 13px;
                color: #92400E;
            }
            
            .nc-error-state-warning-icon {
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .nc-error-state-warning-text {
                flex: 1;
            }
            
            .nc-error-state-warning-text strong {
                display: block;
                margin-bottom: 2px;
            }
            
            .nc-error-state-warning-text small {
                color: #B45309;
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
        
        if (toastTimeout) clearTimeout(toastTimeout);
        
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
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
                <div class="nc-drop-zone-text" id="nc-drop-zone-text">Drop files here</div>
                <div class="nc-drop-zone-hint">Supports: ${CONFIG.ACCEPTED_FILE_TYPES.join(', ')}</div>
                <div class="nc-drop-zone-context" id="nc-drop-zone-context"></div>
            </div>
        `;
        document.body.appendChild(dropZone);

        // Handle drop on the zone itself
        dropZone.addEventListener('drop', handleDrop, true);
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            updateDropZoneContext(e.clientX, e.clientY);
        }, true);
        dropZone.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null || !dropZone.contains(e.relatedTarget)) {
                hideDropZone();
            }
        });

        return dropZone;
    }

    function updateDropZoneContext(x, y) {
        const contextEl = document.getElementById('nc-drop-zone-context');
        if (!contextEl) return;
        
        // Detect what we're hovering over
        const knowledgeTab = $('[data-automation-id="Knowledge"][aria-selected="true"]');
        if (knowledgeTab) {
            contextEl.textContent = 'Will add to Knowledge Files';
            contextEl.style.color = '#059669';
            return;
        }
        
        // Check if we can identify chat areas
        const allInputs = getAllFileInputs();
        if (allInputs.length > 1) {
            contextEl.textContent = 'Drop near the chat you want to attach to';
            contextEl.style.color = '#6B7280';
        } else if (allInputs.length === 1) {
            contextEl.textContent = '';
        } else {
            contextEl.textContent = 'No file upload found on this page';
            contextEl.style.color = '#DC2626';
        }
    }

    function showDropZone() {
        const dropZone = document.getElementById('nc-drop-zone') || createDropZone();
        dropZone.classList.add('visible');
        dropZoneVisible = true;
        debugLog('Drop zone shown');
    }

    function hideDropZone() {
        const dropZone = document.getElementById('nc-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('visible');
        }
        dropZoneVisible = false;
        debugLog('Drop zone hidden');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropX = e.clientX;
        const dropY = e.clientY;
        
        hideDropZone();

        const files = Array.from(e.dataTransfer?.files || []);
        debugLog('Drop event - files:', files.length, files.map(f => f.name), `at (${dropX}, ${dropY})`);
        
        if (files.length === 0) {
            debugLog('No files in drop');
            return;
        }

        // Filter valid files
        const validFiles = files.filter(file => {
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            const isValid = CONFIG.ACCEPTED_FILE_TYPES.includes(ext);
            debugLog(`File ${file.name} ext=${ext} valid=${isValid}`);
            return isValid;
        });

        const invalidCount = files.length - validFiles.length;
        if (invalidCount > 0) {
            showToast(`${invalidCount} file(s) rejected - unsupported type`, 'error');
        }

        if (validFiles.length === 0) {
            debugLog('No valid files after filtering');
            return;
        }

        // Find the best file input based on drop location
        const fileInput = findFileInputNearPoint(dropX, dropY);
        if (fileInput) {
            attachFilesToInput(validFiles, fileInput);
        } else {
            showToast('Could not find file input', 'error');
        }
    }

    function attachFilesToInput(files, targetInput = null) {
        const fileInput = targetInput || getFileInput();
        debugLog('Attaching files to input:', fileInput);
        
        if (!fileInput) {
            console.error('[NinjaCat Chat UX] File input not found');
            showToast('Could not attach files - input not found', 'error');
            return;
        }

        try {
            // Create a DataTransfer to set files on input
            const dataTransfer = new DataTransfer();
            files.forEach(file => {
                dataTransfer.items.add(file);
                debugLog('Added file to DataTransfer:', file.name);
            });
            
            // Set files on the input
            fileInput.files = dataTransfer.files;
            debugLog('Set files on input, count:', fileInput.files.length);
            
            // Dispatch change event - this is what triggers Vue's file handling
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            fileInput.dispatchEvent(changeEvent);
            debugLog('Dispatched change event');
            
            // Also dispatch input event for good measure
            fileInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // For Knowledge tab uploads, we may need to programmatically click
            // the "Add File" button or trigger a specific handler
            const context = determineFileInputContext(fileInput);
            debugLog('File input context:', context);
            
            if (context === FILE_CONTEXTS.KNOWLEDGE) {
                // Try clicking the Add File button to trigger any additional handlers
                const addFileBtn = fileInput.parentElement?.querySelector('.cursor-pointer');
                if (addFileBtn) {
                    debugLog('Found Add File button, may need manual trigger');
                }
            }
            
            // Show success after a brief delay to check
            setTimeout(() => {
                showToast(`${files.length} file(s) attached`, 'success');
                debugLog('Files attachment complete');
            }, 100);
            
        } catch (err) {
            console.error('[NinjaCat Chat UX] Error attaching files:', err);
            showToast('Error attaching files', 'error');
        }
    }

    // ---- Drag Events on Document ----
    let dragCounter = 0;

    function setupDragListeners() {
        // Reset counter on any drop (even if not on our zone)
        document.addEventListener('drop', (e) => {
            dragCounter = 0;
            if (dropZoneVisible) {
                // Let our drop zone handle it
                return;
            }
            // Prevent default browser behavior for drops outside our zone
            e.preventDefault();
        }, true);

        document.addEventListener('dragenter', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                dragCounter++;
                if (dragCounter === 1) {
                    showDropZone();
                }
            }
        }, false);

        document.addEventListener('dragleave', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                dragCounter--;
                if (dragCounter <= 0) {
                    dragCounter = 0;
                    hideDropZone();
                }
            }
        }, false);

        document.addEventListener('dragover', (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault();
            }
        }, false);

        debugLog('Drag listeners setup complete');
    }

    // ---- Always Unlocked Input ----
    function ensureInputUnlocked() {
        const textarea = getTextarea();
        if (!textarea) return;

        // Unlock the textarea itself
        if (textarea.disabled) {
            textarea.disabled = false;
            debugLog('Unlocked textarea (was disabled)');
        }

        if (textarea.readOnly) {
            textarea.readOnly = false;
            debugLog('Unlocked textarea (was readonly)');
        }

        if (textarea.classList.contains('disabled') || 
            textarea.classList.contains('cursor-not-allowed')) {
            textarea.classList.remove('disabled', 'cursor-not-allowed');
            debugLog('Removed disabling classes from textarea');
        }
        
        // IMPORTANT: Also unlock parent containers that may have "disabled" class
        // NinjaCat adds "disabled" class to the parent .flex.items-center container
        let parent = textarea.parentElement;
        while (parent) {
            if (parent.classList.contains('disabled')) {
                parent.classList.remove('disabled');
                debugLog('Removed disabled class from parent:', parent.className);
            }
            // Stop at the main input container
            if (parent.classList.contains('rounded-3xl')) break;
            parent = parent.parentElement;
        }
        
        // Also ensure the send button is enabled
        const sendBtn = findSendButton();
        if (sendBtn) {
            // Remove disabled state and ensure it's clickable
            sendBtn.disabled = false;
            sendBtn.style.pointerEvents = 'auto';
            debugLog('Ensured send button is clickable');
        }
        
        // IMPORTANT: Reset our internal processing flag when we unlock input.
        // This prevents the Enter interceptor from blocking sends after error/cancel.
        if (isAgentProcessing) {
            // Double-check there's no real processing signal before resetting
            const hasSpinner = document.querySelector('.animate-spin, [class*="spinner"], [class*="loading"]');
            const hasStopBtn = document.querySelector('button[class*="stop"], button[class*="cancel"], [data-tip*="Stop"], [data-tip*="Cancel"]');
            if (!hasSpinner && !hasStopBtn) {
                isAgentProcessing = false;
                debugLog('Reset isAgentProcessing to false (no hard signals present)');
            }
        }
    }

    // ---- Agent Processing Detection ----
    function detectAgentProcessing() {
        // Look for indicators that agent is actively processing
        
        // Check for spinning/loading indicators anywhere in the chat area
        const spinners = document.querySelectorAll('.animate-spin, [class*="spinner"], [class*="loading"]');
        for (const spinner of spinners) {
            if (spinner.offsetParent !== null) {
                debugLog('Agent processing detected: spinner found');
                return true;
            }
        }
        
        // Check for "Stop" or "Cancel" button which indicates agent is running
        const stopBtn = document.querySelector('button[class*="stop"], button[class*="cancel"], [data-tip*="Stop"], [data-tip*="Cancel"]');
        if (stopBtn && stopBtn.offsetParent !== null) {
            debugLog('Agent processing detected: stop/cancel button visible');
            return true;
        }
        
        // Check for typing indicator or "thinking" state
        const thinkingIndicators = document.querySelectorAll('[class*="thinking"], [class*="typing"], [class*="generating"]');
        for (const indicator of thinkingIndicators) {
            if (indicator.offsetParent !== null) {
                debugLog('Agent processing detected: thinking indicator');
                return true;
            }
        }

        // NOTE: We intentionally do NOT use send button color (grey vs blue) as a signal.
        // The button can stay grey after errors/cancels even though the agent is idle.
        // Relying on color caused false positives that blocked user input.

        return false;
    }
    
    /**
     * Find the send button - it's the rounded circle with an arrow icon
     */
    function findSendButton() {
        // Look for the send button by its structure: rounded-full with arrow SVG
        const candidates = document.querySelectorAll('.rounded-full');
        for (const el of candidates) {
            // Check if it contains the arrow SVG (path with specific clip-path)
            const svg = el.querySelector('svg');
            if (svg && el.offsetParent !== null) {
                // The send button has a specific size and contains an arrow
                const rect = el.getBoundingClientRect();
                if (rect.width >= 20 && rect.width <= 30 && rect.height >= 20 && rect.height <= 30) {
                    // Check if near a textarea
                    const container = el.closest('.border.rounded-3xl, .flex.items-center');
                    if (container && container.querySelector('#autoselect-experience, textarea')) {
                        return el;
                    }
                }
            }
        }
        
        // Fallback selectors
        return document.querySelector('.rounded-full.bg-blue-5, .rounded-full.bg-blue-100, .rounded-full.bg-grey-5');
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
        debugLog('Message added to queue:', message.substring(0, 30));
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
            return false;
        }

        debugLog('Sending message:', text.substring(0, 50) + '...');

        // Ensure textarea is enabled
        textarea.disabled = false;
        textarea.readOnly = false;

        // Set textarea value using native setter for Vue reactivity
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeInputValueSetter.call(textarea, text);
        
        // Dispatch input event to trigger Vue's v-model
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Also trigger keyup to ensure any listeners pick it up
        textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

        // Give Vue a moment to react, then click send
        setTimeout(() => {
            const sendBtn = findSendButton();
            debugLog('Send button found:', sendBtn);
            
            if (sendBtn) {
                // Make sure button is clickable
                sendBtn.disabled = false;
                sendBtn.click();
                debugLog('Message sent via button click');
            } else {
                // Fallback: simulate Enter key with all necessary properties
                debugLog('No send button found, trying Enter key');
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                textarea.dispatchEvent(enterEvent);
                debugLog('Enter key dispatched');
            }
        }, 100);
        
        return true;
    }
    
    /**
     * Directly trigger a send - bypasses queue, for use after errors/cancellations
     */
    function forceSendCurrentInput() {
        const textarea = getTextarea();
        if (!textarea) return false;
        
        const text = textarea.value.trim();
        if (!text) return false;
        
        debugLog('Force sending current input');
        
        // Clear the textarea first
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeInputValueSetter.call(textarea, '');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Then send the message
        return sendMessage(text);
    }

    // ---- Queue UI ----
    function updateQueueUI() {
        let container = document.getElementById('nc-queue-container');
        
        if (messageQueue.length === 0) {
            if (container) container.remove();
            return;
        }

        const wrapper = getInputWrapper();
        if (!wrapper) {
            debugLog('Could not find input wrapper for queue UI');
            return;
        }

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

    // Expose queue functions for UI onclick handlers
    /** @function _ncClearQueue - Clear all queued messages */
    window._ncClearQueue = clearQueue;
    /** @function _ncResumeQueue - Resume paused queue processing */
    window._ncResumeQueue = resumeQueue;
    /** @function _ncRemoveQueueItem - Remove item from queue by index */
    window._ncRemoveQueueItem = removeFromQueue;
    /** @function _ncEditQueueItem - Edit queued message by index */
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

                debugLog('Enter pressed, isAgentProcessing:', isAgentProcessing);

                if (isAgentProcessing) {
                    // Agent is busy - queue the message
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (addToQueue(text)) {
                        // Clear the textarea
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                        nativeInputValueSetter.call(textarea, '');
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
                // If not processing, let the native handler work
            }
        }, true);

        debugLog('Input interception setup complete');
    }
    
    /**
     * Manually add current input to queue (for testing)
     */
    function manualQueueCurrentInput() {
        const textarea = getTextarea();
        if (!textarea) return false;
        
        const text = textarea.value.trim();
        if (!text) {
            showToast('No message to queue', 'error');
            return false;
        }
        
        if (addToQueue(text)) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            nativeInputValueSetter.call(textarea, '');
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        return false;
    }
    
    // ---- Debug API (continued) ----
    // These functions are exposed for debugging via browser console
    // Enable debug logging: localStorage.setItem('ninjacat-chat-debug', 'true'); location.reload();
    
    /** @function _ncManualQueue - Add current textarea content to message queue */
    window._ncManualQueue = manualQueueCurrentInput;
    /** @function _ncForceSend - Force send current textarea content */
    window._ncForceSend = forceSendCurrentInput;
    /** @function _ncCheckProcessing - Check if agent is currently processing */
    window._ncCheckProcessing = () => {
        const result = detectAgentProcessing();
        console.log('[NinjaCat Chat UX] isAgentProcessing:', result);
        return result;
    };
    /** @function _ncClearState - Clear stale streaming state from Pinia */
    window._ncClearState = clearStaleStreamingState;
    /** @function _ncNuclearReset - Nuclear reset of all blocking state */
    window._ncNuclearReset = nuclearStateReset;
    /** @function _ncIsErrorState - Check if conversation is in error state */
    window._ncIsErrorState = () => {
        const result = isConversationInErrorState();
        console.log('[NinjaCat Chat UX] isConversationInErrorState:', result);
        return result;
    };
    /** @function _ncGetContext - Get conversation context (IDs, last message) */
    window._ncGetContext = () => {
        const ctx = getConversationContext();
        console.log('[NinjaCat Chat UX] Conversation context:', ctx);
        return ctx;
    };
    /** @function _ncSocket - Get live WebSocket connection */
    window._ncSocket = () => {
        const socket = getLiveSocket();
        console.log('[NinjaCat Chat UX] Socket:', socket);
        return socket;
    };
    /** @function _ncClickResend - Click native Resend button */
    window._ncClickResend = clickResendButton;
    /** @function _ncClickEdit - Click native Edit Last Message button */
    window._ncClickEdit = clickEditLastMessageButton;
    /** @function _ncStores - Get Pinia store references */
    window._ncStores = () => {
        const stores = getPiniaStores();
        console.log('[NinjaCat Chat UX] Pinia stores:', stores);
        return stores;
    };
    /** @function _ncDumpState - Dump full Pinia state to console */
    window._ncDumpState = () => {
        const { liveChatStore, conversationStore } = getPiniaStores();
        const conversationId = getCurrentConversationId();
        console.log('=== NinjaCat State Dump ===');
        console.log('Conversation ID:', conversationId);
        if (liveChatStore) {
            console.log('liveChatStore.streamingMessages:', liveChatStore.streamingMessages);
            console.log('liveChatStore.isStreaming:', liveChatStore.isStreaming);
            console.log('liveChatStore.isSending:', liveChatStore.isSending);
            console.log('liveChatStore.error:', liveChatStore.error);
        }
        if (conversationStore) {
            const conv = conversationStore.conversations?.[conversationId];
            console.log('conversation.state:', conv?.state);
            console.log('conversation.error:', conv?.error);
            console.log('conversation.isGenerating:', conv?.isGenerating);
        }
        return { liveChatStore, conversationStore };
    };

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

    // ---- Auto-linkify URLs in Chat Messages ----
    
    /**
     * Convert plain text URLs to clickable links in chat messages
     */
    /**
     * Validate that a string is a proper URL
     * @param {string} urlString - The URL to validate
     * @returns {boolean} - True if valid URL
     */
    function isValidUrl(urlString) {
        try {
            const url = new URL(urlString);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Convert plain text URLs to clickable links in chat messages
     * Called with debouncing from MutationObserver
     */
    function linkifyUrls() {
        // Target chat message containers
        const messages = document.querySelectorAll('.styled-chat-message p, .styled-chat-message strong, .styled-chat-message li');
        
        messages.forEach(el => {
            // Skip if already processed or contains links
            if (el.dataset.ncLinkified || el.querySelector('a')) return;
            
            const text = el.innerHTML;
            // URL regex - matches http(s) URLs
            const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
            
            if (urlRegex.test(text)) {
                el.innerHTML = text.replace(urlRegex, (url) => {
                    // Clean up any trailing punctuation that got captured
                    let cleanUrl = url;
                    let suffix = '';
                    if (/[.,;:!?)}\]>]$/.test(cleanUrl)) {
                        suffix = cleanUrl.slice(-1);
                        cleanUrl = cleanUrl.slice(0, -1);
                    }
                    
                    // Validate URL before creating link
                    if (!isValidUrl(cleanUrl)) {
                        debugLog('Invalid URL skipped:', cleanUrl);
                        return url; // Return original text unchanged
                    }
                    
                    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: underline; word-break: break-all;">${cleanUrl}</a>${suffix}`;
                });
                el.dataset.ncLinkified = 'true';
                debugLog('Linkified URL in:', el.textContent.substring(0, 50));
            }
        });
    }
    
    /**
     * Debounced version of linkifyUrls - prevents excessive calls from MutationObserver
     */
    function linkifyUrlsDebounced() {
        if (linkifyDebounceTimer) {
            clearTimeout(linkifyDebounceTimer);
        }
        linkifyDebounceTimer = setTimeout(linkifyUrls, 100);
    }

    // ---- MutationObserver ----
    function setupObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            // Check for input state changes (throttled)
            updateAgentState();

            // Re-setup input interception if textarea was re-rendered
            const textarea = getTextarea();
            if (textarea && !textarea.dataset.ncIntercepted) {
                setupInputInterception();
            }
            
            // Auto-linkify URLs in new messages (debounced to prevent performance issues)
            linkifyUrlsDebounced();
            
            // Check for error state and show/hide warning
            updateErrorStateUI();
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
        getLiveSocket();

        // Initial state check
        updateAgentState();

        console.log('[NinjaCat Chat UX] Initialization complete');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
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
