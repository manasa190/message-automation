console.log("LinkedIn Automation: Enterprise Content script loaded successfully!");
document.body.setAttribute('data-extension-id', chrome.runtime.id);

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomSleep = (min, max) => sleep(Math.floor(Math.random() * (max - min + 1)) + min);

// State
let isRunning = false;
let connectionsSent = 0;
let messagesSent = 0;
let followsSent = 0;
let results = [];
let MAX_ACTIONS = 30; // Total actions limit
let keywords = [
    '"AI integration" OR "digital transformation"',
    '"generative AI" OR "business operations"',
    '"implementing machine learning" OR "AI consultant"',
    '"predictive analytics" OR "enterprise data"',
    '"AI solutions" OR "reduce costs"',
    '"cloud migration" OR "cloud architecture"',
    '"AWS consulting" OR "Azure architect"',
    '"DevOps automation" OR "managed IT services"',
    '"cybersecurity solutions" OR "database optimization"',
    '"infrastructure as a service" OR "enterprise"',
    '"Looking for developers" OR "need tech help"',
    '"hire app developer" OR "hiring full stack"',
    '"outsourcing development" OR "IT consulting"',
    '"tech staff augmentation" OR "hiring IT contractors"',
    '"need CTO" OR "looking for tech partner"',
    '"software engineering team" OR "scale"',
    '"Marketing automation" OR "ad performance"',
    '"digital marketing agency" OR "brand strategy"',
    '"hiring growth marketer" OR "PPC expert needed"',
    '"ecommerce growth" OR "conversion rate optimization"',
    '"B2B lead generation" OR "marketing team"',
    '"influencer marketing campaign" OR "social media ambassador"',
    '"creator economy" OR "brand partnerships"',
    '"Growing startup" OR "scaling product"',
    '"digital agency" OR "seeking tech partner"',
    '"startup funding" OR "hiring engineers"',
    '"tech modernization" OR "enterprise"',
    '"seeking technology partner" OR "IT vendor"'
];
let currentKeywordIndex = 0;
let retryCount = 0;
const MAX_RETRIES = 5;

let config = { templates: "", apiKey: "", limit: 30, softTouch: false };

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.state) {
        const oldState = changes.state.oldValue || {};
        const newState = changes.state.newValue || {};

        isRunning = newState.isRunning || false;
        connectionsSent = newState.connectionsSent || 0;
        messagesSent = newState.messagesSent || 0;
        followsSent = newState.followsSent || 0;
        results = newState.results || [];
        currentKeywordIndex = newState.currentKeywordIndex || 0;
        if (newState.keywords) keywords = newState.keywords;

        updatePanel();

        // If it was just toggled ON from the popup
        if (isRunning && !oldState.isRunning) {
            runAutomation();
        } else if (!isRunning && oldState.isRunning) {
            stopAutomation();
        }
    }
});

// Load state from local storage so that automation persists across page reloads
async function loadState() {
    return new Promise(resolve => {
        chrome.storage.local.get(['state', 'config'], function (res) {
            if (res.state) {
                isRunning = res.state.isRunning || false;
                connectionsSent = res.state.connectionsSent || 0;
                messagesSent = res.state.messagesSent || 0;
                followsSent = res.state.followsSent || 0;
                results = res.state.results || [];
                currentKeywordIndex = res.state.currentKeywordIndex || 0;
                if (res.state.keywords) keywords = res.state.keywords;
            }
            if (res.config) {
                config = res.config;
                MAX_ACTIONS = config.limit || 30;
            }
            resolve();
        });
    });
}

// Save state to local storage
async function saveState() {
    return new Promise(resolve => {
        chrome.storage.local.set({
            state: {
                isRunning,
                connectionsSent,
                messagesSent,
                followsSent,
                results,
                currentKeywordIndex,
                keywords
            }
        }, resolve);
    });
}

// Get Personalized Message
async function getMessageTemplate(firstName, title) {
    // 1. OpenAI Personalization
    if (config.apiKey && config.apiKey.trim() !== '') {
        try {
            updatePanel("Generating AI message...");
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    action: 'generateAI',
                    firstName: firstName,
                    title: title,
                    apiKey: config.apiKey
                }, resolve);
            });
            if (response && response.message) {
                return { msg: response.message, type: "AI Generated" };
            }
        } catch (e) { console.error("AI Gen Failed:", e); }
    }

    // 2. A/B Testing Templates
    if (config.templates && config.templates.trim().length > 0) {
        let templates = config.templates.split('///').map(t => t.trim()).filter(t => t.length > 0);
        if (templates.length > 0) {
            const randomIndex = Math.floor(Math.random() * templates.length);
            let msg = templates[randomIndex];
            msg = msg.replace(/{firstName}/g, firstName).replace(/{title}/g, title);
            return { msg: msg, type: `A/B Template ${randomIndex + 1}` };
        }
    }

    // 3. Ultimate fallback
    return { msg: `Hi ${firstName}, at Flare Technologies we help enterprises scale with AI, cloud architecture, and marketing. Let's connect!`, type: "Fallback" };
}

// Inject the floating panel into the page
function injectPanel() {
    if (document.getElementById('li-auto-panel')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'li-auto-panel';
    panel.style.cssText = `
    position: fixed;
    right: 20px;
    top: 80px;
    width: 360px;
    background-color: #F6CBC0; /* Pastel pink panel */
    color: #333;
    z-index: 9999999;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
  `;

    panel.innerHTML = `
    <h3 style="margin-top:0; border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 18px;">Flare Enterprise Bot</h3>
    <div style="display:flex; gap:10px; margin-bottom: 15px;">
        <button id="auto-stop-btn" style="flex:1; padding:8px; border:none; border-radius:5px; background:#D6ABA0; color:#333; font-weight:bold; cursor:pointer;">Stop Campaign</button>
    </div>
    <div style="font-size: 13px; line-height: 1.6;">
      <div><strong>Keyword:</strong> <span id="auto-keyword">None</span></div>
      <div><strong>Actions:</strong> <span id="auto-total">0</span>/${MAX_ACTIONS}</div>
      <div style="margin-top:5px; font-size:11px; color:#333;"><strong>Status:</strong> <span id="auto-status">Idle</span></div>
    </div>
    <div style="margin-top: 15px; max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); border-radius: 5px; padding: 10px;">
      <strong style="font-size: 12px;">Recent CRM Leads:</strong>
      <div id="auto-results" style="margin-top: 5px; font-size: 11px;"></div>
    </div>
  `;

    document.body.appendChild(panel);

    document.getElementById('auto-stop-btn').addEventListener('click', stopAutomation);
}

// Update panel display
function updatePanel(status = null) {
    const keywordEl = document.getElementById('auto-keyword');
    const totalEl = document.getElementById('auto-total');
    const resultsEl = document.getElementById('auto-results');
    const statusEl = document.getElementById('auto-status');

    const totalActions = connectionsSent + messagesSent + followsSent;

    if (keywordEl) keywordEl.textContent = isRunning ? (keywords[currentKeywordIndex] || "None") : 'Stopped';
    if (totalEl) totalEl.textContent = totalActions;
    if (statusEl && status) statusEl.textContent = status;

    if (resultsEl) {
        resultsEl.innerHTML = results.slice(-10).reverse().map(r =>
            `<div style="margin: 3px 0; padding: 3px; background: rgba(255,255,255,0.1); border-radius: 3px;">
        ${r.icon} ${r.name}<br><small style="opacity:0.8;">${r.title.substring(0, 30)}...</small><br><small style="color:#a8dcd1;">${r.template || 'AI Generated'}</small>
      </div>`
        ).join('');
    }
}

// Navigate to search URL
async function navigateToSearch(keyword) {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://www.linkedin.com/search/results/people/?keywords=${encodedKeyword}`;
    console.log(`Navigating to: ${url}`);
    await saveState();
    window.location.href = url;
}

// Find all profile cards with action buttons
function findPeopleWithActions() {
    const people = [];
    const cards = document.querySelectorAll('.entity-result, [class*="search-result"], li.reusable-search__result-container');

    cards.forEach(card => {
        if (card.hasAttribute('data-auto-processed')) return;

        try {
            const isVisible = (el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
            };

            const findVisibleBtn = (selectorOrFn) => {
                if (typeof selectorOrFn === 'string') {
                    const els = Array.from(card.querySelectorAll(selectorOrFn));
                    return els.find(el => isVisible(el));
                } else {
                    const els = Array.from(card.querySelectorAll('button, a, [role="button"]'));
                    return els.find(el => selectorOrFn(el) && isVisible(el));
                }
            };

            const connectBtn = findVisibleBtn('button[aria-label*="Invite" i]') ||
                findVisibleBtn('button[aria-label*="Connect" i]') ||
                findVisibleBtn(b => b.tagName === 'BUTTON' && (b.innerText || '').trim().toLowerCase() === 'connect' && !(b.getAttribute('aria-label') || '').includes('Connected'));

            const messageBtn = findVisibleBtn('button[aria-label*="Message" i]') ||
                findVisibleBtn('a[aria-label*="Message" i]') ||
                findVisibleBtn(b => (b.innerText || '').trim().toLowerCase().includes('message') && !b.innerText.toLowerCase().includes('connection'));

            const profileLink = card.querySelector('a[href*="/in/"]');

            const connectValid = connectBtn && !connectBtn.disabled;
            const messageValid = messageBtn && (!messageBtn.disabled || messageBtn.tagName === 'A');

            if (connectValid || messageValid) {
                people.push({
                    card,
                    connectBtn: connectValid ? connectBtn : null,
                    messageBtn: messageValid ? messageBtn : null,
                    profileLink: profileLink
                });
            } else {
                if (!findVisibleBtn('button, a, [role="button"]')) {
                    card.setAttribute('data-auto-processed', 'true');
                }
            }
        } catch (e) { console.error("Error processing card:", e); }
    });

    return people;
}

// Extract name
function extractName(card) {
    try {
        const nameEl = card.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
            card.querySelector('.entity-result__title-line a');
        if (nameEl && nameEl.innerText !== 'LinkedIn Member') return nameEl.innerText.trim();
        return 'LinkedIn Member';
    } catch (e) { return 'LinkedIn Member'; }
}

// Extract job title
function extractJobTitle(card) {
    try {
        const titleEl = card.querySelector('.entity-result__primary-subtitle') || card.querySelector('.entity-result__summary');
        if (titleEl) return titleEl.innerText.trim();
        return 'N/A';
    } catch (e) { return 'N/A'; }
}

// Write React Input
function triggerReactInput(element, value) {
    if (!element) return;

    element.focus();

    // Method 1: React native value setters (for <textarea> or <input>)
    if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        if (element.tagName === "INPUT") {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        }

        const prototypeValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
        if (prototypeValueSetter && prototypeValueSetter !== nativeInputValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
        } else {
            element.value = value;
        }

        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    } else {
        // Method 2: contenteditable for Lexical / Draft.js
        element.focus();

        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);

        if (!document.execCommand('insertText', false, value)) {
            element.textContent = value;
        }

        // Modern editors (Lexical) intercept paste events to populate state
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', value);
        const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: dataTransfer,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(pasteEvent);

        // Trigger generic input observers
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

        // Trigger React debounce keyboard listeners with a simulated space at the end
        const keyOpts = { key: ' ', code: 'Space', charCode: 32, keyCode: 32, bubbles: true, cancelable: true };
        element.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
        element.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
        element.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
    }
}

// Handle Connect button
async function handleConnect(connectBtn, name, firstName, title) {
    try {
        console.log(`[Connect] Clicking connect for ${firstName}...`);
        connectBtn.click();
        await sleep(2500);

        let modal = document.querySelector('[role="dialog"]') || document.querySelector('.artdeco-modal') || document.body;

        // Handle possible "How do you know this person?" modal
        const otherBtn = Array.from(modal.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('other'));
        if (otherBtn) {
            console.log(`[Connect] Answering 'Other' to connection prompt...`);
            otherBtn.click();
            await sleep(1000);
            const subConnectBtn = Array.from(modal.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'connect');
            if (subConnectBtn) subConnectBtn.click();
            await sleep(1500);
            modal = document.querySelector('[role="dialog"]') || document.querySelector('.artdeco-modal') || document.body;
        }

        const addNoteBtn = modal.querySelector('button[aria-label="Add a note"]') ||
            Array.from(modal.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('add a note') || (b.innerText || '').toLowerCase().includes('add note'));

        let generatedMessage = "Fallback";

        if (addNoteBtn) {
            console.log(`[Connect] Adding a note...`);
            addNoteBtn.click();
            await sleep(1500);

            const textarea = modal.querySelector('textarea[name="message"], textarea#custom-message') || modal.querySelector('textarea');
            if (textarea) {
                const messageData = await getMessageTemplate(firstName, title);
                generatedMessage = messageData.type;
                textarea.focus();

                triggerReactInput(textarea, messageData.msg);
                await sleep(1500);

                const sendBtn = modal.querySelector('button[aria-label*="Send invitation"], button[aria-label*="Send"]') ||
                    Array.from(modal.querySelectorAll('button')).find(b => {
                        const t = (b.innerText || '').trim().toLowerCase();
                        return (t.includes('send') && !t.includes('without')) || t === 'send';
                    });

                if (sendBtn) {
                    sendBtn.removeAttribute('disabled');
                    sendBtn.click();
                    // Additional safety
                    const mouseEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                    sendBtn.dispatchEvent(mouseEvent);

                    // NEW FALLBACK: Press enter on the button
                    sendBtn.focus();
                    sendBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));

                    connectionsSent++;
                    console.log(`[Connect] Note sent successfully.`);
                    return { status: 'connected_with_note', template: generatedMessage };
                } else {
                    console.log(`[Connect] Warning: Could not find 'Send' button after typing note.`);
                }
            } else {
                console.log(`[Connect] Warning: Could not find textarea for note.`);
            }
        } else {
            console.log(`[Connect] No 'Add a note' button. Trying to send directly...`);
            const sendBtn = Array.from(modal.querySelectorAll('button')).find(b => {
                const t = (b.innerText || '').toLowerCase();
                return t === 'send' || t === 'send now' || t.includes('send without a note') || t === 'connect';
            });
            if (sendBtn) {
                sendBtn.click();

                sendBtn.focus();
                sendBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));

                connectionsSent++;
                console.log(`[Connect] Sent direct connection.`);
                return { status: 'connected', template: 'No Note Option' };
            }
        }

        console.log(`[Connect] Failure trying to find final action buttons. Dismissing modal...`);
        const closeBtn = modal.querySelector('button[aria-label="Dismiss"]') ||
            Array.from(modal.querySelectorAll('button')).find(b => !!b.querySelector('[data-test-icon="close-medium"]'));
        if (closeBtn) closeBtn.click();
        return null;
    } catch (e) {
        console.error("Error connecting:", e);
        return null;
    }
}

// Handle Message button
async function handleMessage(messageBtn, name, firstName, title) {
    try {
        console.log(`[Message] Clicking message for ${firstName}...`);
        messageBtn.click();
        await sleep(3500);

        let overlays = document.querySelectorAll('.msg-overlay-conversation-bubble');
        let activeOverlay = overlays[overlays.length - 1] || document;

        let messageBox = activeOverlay.querySelector('.msg-form__contenteditable[contenteditable="true"]') ||
            activeOverlay.querySelector('.msg-form__msg-content-container [contenteditable="true"]');

        let generatedMessage = "Fallback";

        if (!messageBox) {
            messageBox = Array.from(activeOverlay.querySelectorAll('[contenteditable="true"]'))
                .find(el => (el.getAttribute('aria-label') || '').toLowerCase().includes('message'));
        }

        if (messageBox) {
            console.log(`[Message] Message box found. Generating AI output...`);
            const messageData = await getMessageTemplate(firstName, title);
            generatedMessage = messageData.type;

            messageBox.focus();
            triggerReactInput(messageBox, messageData.msg);
            await sleep(2000);

            const sendBtn = activeOverlay.querySelector('button.msg-form__send-button') ||
                activeOverlay.querySelector('button[type="submit"]') ||
                Array.from(activeOverlay.querySelectorAll('button')).find(b => {
                    const t = (b.innerText || '').trim().toLowerCase();
                    return t === 'send' || t === 'send now';
                });

            if (sendBtn) {
                sendBtn.removeAttribute('disabled');
                sendBtn.click();

                // Secondary check: Did it really send? If disabled is still active, React blocked it.
                // Let's forcibly click with a mouse event
                const mouseEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                sendBtn.dispatchEvent(mouseEvent);

                messagesSent++;
                console.log(`[Message] Sent successfully.`);
                await sleep(1500);

                const closeBtns = activeOverlay.querySelectorAll('button[aria-label="Dismiss"], .msg-overlay-bubble-header__control--close-btn');
                if (closeBtns.length > 0) closeBtns[0].click();

                return { status: 'messaged', template: generatedMessage };
            } else {
                console.log(`[Message] Warning: Could not find Send button. Trying Enter key.`);
                // Send by pressing Enter as a fallback
                const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13 });
                messageBox.dispatchEvent(enterEvent);
                messagesSent++;
                await sleep(1500);

                const closeBtns = activeOverlay.querySelectorAll('button[aria-label="Dismiss"], .msg-overlay-bubble-header__control--close-btn');
                if (closeBtns.length > 0) closeBtns[0].click();

                return { status: 'messaged', template: generatedMessage + " (Enter Key)" };
            }
        } else {
            console.log(`[Message] Warning: Could not find contenteditable message box.`);
        }

        const closeBtns = activeOverlay.querySelectorAll('button[aria-label="Dismiss"], .msg-overlay-bubble-header__control--close-btn');
        if (closeBtns.length > 0) closeBtns[0].click();
        return null;
    } catch (e) {
        const closeBtns = document.querySelectorAll('button[aria-label="Dismiss"], .msg-overlay-bubble-header__control--close-btn');
        if (closeBtns.length > 0) closeBtns[0].click();
        console.error("Error messaging:", e);
        return null;
    }
}

// Process one person
async function processPerson(person) {
    try {
        person.card.setAttribute('data-auto-processed', 'true');
        const name = extractName(person.card);

        // Skip hidden profiles to prevent "Hi LinkedIn" messages
        if (name === 'LinkedIn Member' || name.startsWith('LinkedIn')) {
            console.log("Skipping hidden profile...");
            return false;
        }

        const title = extractJobTitle(person.card);
        const firstNameRaw = name.split(/[\s\n]+/)[0];
        const firstName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();

        // SOFT TOUCH FEATURE
        if (config.softTouch && person.profileLink) {
            updatePanel(`Soft Touch: Viewing ${firstName}'s profile...`);
            console.log(`Soft Touch: Hovering/Focusing profile for ${firstName}`);
            person.card.scrollIntoView({ behavior: "smooth", block: "center" });
            person.profileLink.focus();

            // Wait to simulate reading the profile snippet
            await randomSleep(4000, 7000);
        }

        updatePanel(`Working on ${firstName}...`);
        const actions = [];
        let icon = '';
        let strategyUsed = '';

        if (person.connectBtn) {
            const result = await handleConnect(person.connectBtn, name, firstName, title);
            if (result) {
                actions.push('Connected');
                strategyUsed = result.template;
                icon = 'Connect';
                await sleep(2000);
            }
        } else if (person.messageBtn) {
            const result = await handleMessage(person.messageBtn, name, firstName, title);
            if (result) {
                actions.push('Messaged');
                strategyUsed = result.template;
                icon = 'Message';
            }
        }

        if (actions.length > 0) {
            await randomSleep(5000, 8000); // Human delay
            results.push({ name, title, icon, action: actions.join(' + '), template: strategyUsed });
            updatePanel(`${actions.join(' + ')}`);
            return true;
        }

        return false;
    } catch (e) {
        updatePanel('Error, trying next...');
        return false;
    }
}

// Process all visible people
async function processPeople() {
    const people = findPeopleWithActions();

    if (people.length === 0) {
        retryCount++;

        if (retryCount >= MAX_RETRIES) {
            const nextBtn = document.querySelector('button[aria-label="Next"]') ||
                document.querySelector('.artdeco-pagination__button--next') ||
                Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Next');

            if (nextBtn && !nextBtn.disabled) {
                updatePanel('Moving to next page...');
                retryCount = 0;
                await saveState();
                nextBtn.click();
                await sleep(5000);
                return;
            }

            retryCount = 0;
            currentKeywordIndex++;

            if (currentKeywordIndex < keywords.length) {
                updatePanel('Moving to next keyword...');
                await sleep(2000);
                await navigateToSearch(keywords[currentKeywordIndex]);
                return;
            } else {
                await stopAutomation();
                alert(`Enterprise Campaign Complete!\nLeads recorded: ${results.length}. Export from UI.`);
                return;
            }
        }

        updatePanel(`Searching... (${retryCount}/${MAX_RETRIES})`);
        window.scrollBy(0, 800);
        await sleep(3000);
        return;
    }

    retryCount = 0;

    for (const person of people) {
        const totalActions = connectionsSent + messagesSent + followsSent;
        if (!isRunning || totalActions >= MAX_ACTIONS) break;

        const acted = await processPerson(person);
        if (acted) await saveState();
        updatePanel();
    }
}

// Main loop
async function runAutomation() {
    updatePanel('Starting...');

    if (!window.location.href.includes('/search/results/')) {
        updatePanel('Navigating to search...');
        await navigateToSearch(keywords[currentKeywordIndex]);
        return;
    }

    await sleep(5000);
    updatePanel('Scraping opportunities...');

    while (isRunning && (connectionsSent + messagesSent + followsSent) < MAX_ACTIONS) {
        await processPeople();
        const totalActions = connectionsSent + messagesSent + followsSent;
        if (totalActions >= MAX_ACTIONS) {
            await stopAutomation();
            alert(`Enterprise Campaign Complete!\nLeads recorded: ${results.length}. Export from the UI Dashboard.`);
            break;
        }
        await sleep(2000);
    }
}

// Stop
async function stopAutomation() {
    isRunning = false;
    await saveState();
    updatePanel('Stopped');
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'stop') {
        stopAutomation();
        sendResponse({ status: 'stopped' });
    }
    return true;
});

// Boot script
setTimeout(async () => {
    await loadState();
    injectPanel();
    updatePanel();
    if (isRunning) {
        runAutomation();
    }
}, 2000);
