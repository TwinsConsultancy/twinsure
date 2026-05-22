class UserChatEngine {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.history = [];
        this.selectedOptions = {}; // nodeId -> { text, question }
        this.currentNodeId = null;
        this.greetingText = "Welcome! Let's help you find the best insurance plan for your needs.";

        this.loadFlow();
        this.initEvents();
    }

    initEvents() {
        document.getElementById('restartFlowBtn').addEventListener('click', () => this.startFlow());
        document.getElementById('prevQuestionBtn').addEventListener('click', () => this.goBack());
    }

    async loadFlow() {
        try {
            const response = await fetch(`${BASE_URL}/public/recommendation_flow.php`);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            this.nodes = data.nodes || [];
            this.edges = data.edges || [];
            if (data.greeting) this.greetingText = data.greeting;
            this.startFlow();
        } catch (e) {
            console.error('Failed to load flow', e);
            this.renderBotMessage("Sorry, the recommendation engine is currently unavailable. Please try again later.");
        }
    }

    startFlow() {
        this.history = [];
        this.selectedOptions = {};
        document.getElementById('chatMessagesArea').innerHTML = '';

        this.renderBotMessage(this.greetingText);

        const firstEdge = this.edges.find(e => e.fromNode === 'greeting');
        if (firstEdge) {
            this.currentNodeId = firstEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else if (this.nodes.length > 0) {
            this.currentNodeId = this.nodes[0].id;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            this.renderBotMessage("No recommendations are configured yet.");
        }
        this.updateProgress();
    }

    goBack() {
        if (this.history.length <= 1) return;
        const removed = this.history.pop();
        delete this.selectedOptions[removed];
        this.currentNodeId = this.history[this.history.length - 1];
        this.rebuildChatFromHistory();
    }

    rebuildChatFromHistory() {
        document.getElementById('chatMessagesArea').innerHTML = '';
        this.renderBotMessage(this.greetingText);
        for (let i = 0; i < this.history.length; i++) {
            const nId = this.history[i];
            const node = this.nodes.find(n => n.id === nId);
            if (!node) continue;
            this.renderBotMessage(node.text);
            if (i === this.history.length - 1) {
                this.renderOptions(node);
            } else {
                const choice = this.selectedOptions[nId];
                if (choice) this.renderUserMessage(choice.text);
            }
        }
        this.updateProgress();
    }

    renderCurrentNode() {
        const node = this.nodes.find(n => n.id === this.currentNodeId);
        if (!node) return;
        const tid = this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator(tid);
            this.renderBotMessage(node.text);
            this.renderOptions(node);
            this.updateProgress();
        }, 600);
    }

    renderBotMessage(text) {
        const area = document.getElementById('chatMessagesArea');
        area.insertAdjacentHTML('beforeend', `
            <div class="chat-row bot-row">
                <div class="chat-bot-icon" style="background:#04122d; border-color:var(--accent-gold, #fdc500);"><i class="fas fa-user-astronaut" style="color:#ffd500;"></i></div>
                <div class="chat-bubble bot-bubble">${text}</div>
            </div>`);
        this.scrollToBottom();
    }

    renderUserMessage(text) {
        const area = document.getElementById('chatMessagesArea');
        area.insertAdjacentHTML('beforeend', `
            <div class="chat-row user-row" style="margin-bottom: 0.2rem;">
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.2rem;">
                    <div class="chat-bubble user-bubble">${text}</div>
                    <span style="font-size:0.68rem; color:rgba(255,255,255,0.4); margin-right: 0.2rem;">Delivered</span>
                </div>
            </div>`);
        this.scrollToBottom();
    }

    renderOptions(node) {
        ChatInputs.render(node, this, 'userChat');
    }

    selectOption(nodeId, optionId, optionText) {
        if (!optionText) return;

        const container = document.getElementById(`opts_${nodeId}`);
        if (container) { container.style.pointerEvents = 'none'; container.style.opacity = '0.7'; }

        this.renderUserMessage(optionText);

        // Record answer with the question text for summary
        const node = this.nodes.find(n => n.id === nodeId);
        this.selectedOptions[nodeId] = {
            text: optionText,
            question: node?.text || node?.title || ''
        };

        const nextEdge = this.edges.find(e => e.fromNode === nodeId && e.fromOption === optionId);
        if (nextEdge) {
            this.currentNodeId = nextEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            // End of flow — show completion modal
            const tid = this.showTypingIndicator();
            setTimeout(() => {
                this.removeTypingIndicator(tid);
                this.renderBotMessage("Great! You've completed the questionnaire. Please fill in your details so our agent can get back to you with a personalised recommendation.");
                this.updateProgress();
                setTimeout(() => this.showLeadModal(), 800);
            }, 700);
        }
        this.updateProgress();
    }

    /* ═══════════════════════════ LEAD CAPTURE MODAL ═══════════════════════════ */

    showLeadModal() {
        // Build Q&A summary rows
        const summaryRows = this.history.map(nId => {
            const opt = this.selectedOptions[nId];
            if (!opt) return '';
            return `
            <div class="lead-summary-row">
                <div class="lead-summary-q"><i class="fas fa-question-circle"></i> ${opt.question || 'Question'}</div>
                <div class="lead-summary-a"><i class="fas fa-check-circle"></i> ${opt.text}</div>
            </div>`;
        }).filter(Boolean).join('');

        const modal = document.getElementById('leadModal');
        document.getElementById('leadSummaryBody').innerHTML = summaryRows;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('leadModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    async submitLead() {
        const name  = document.getElementById('leadName').value.trim();
        const phone = document.getElementById('leadPhone').value.trim();
        const email = document.getElementById('leadEmail').value.trim();
        const agree = document.getElementById('leadAgree').checked;

        // Validate
        let hasError = false;
        const setErr = (id, msg) => { document.getElementById(id).textContent = msg; hasError = true; };
        const clrErr = (id)      => { document.getElementById(id).textContent = ''; };

        clrErr('errName'); clrErr('errPhone'); clrErr('errEmail'); clrErr('errAgree');

        if (!name)                          setErr('errName', 'Full name is required.');
        if (!/^\d{10}$/.test(phone))        setErr('errPhone', 'Enter a valid 10-digit phone number.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setErr('errEmail', 'Enter a valid email address.');
        if (!agree)                         setErr('errAgree', 'Please agree to continue.');

        if (hasError) return;

        // Collect callback slots
        const slot1Date = document.getElementById('slot1Date').value;
        const slot1Time = document.getElementById('slot1Time').value;
        const slot2Date = document.getElementById('slot2Date').value;
        const slot2Time = document.getElementById('slot2Time').value;
        const callbackSlots = [];

        if (slot1Date && slot1Time) callbackSlots.push({ date: slot1Date, time: slot1Time, label: 'Slot 1' });
        if (slot2Date && slot2Time) {
            // Validate 30-min gap if same date
            if (slot1Date && slot2Date === slot1Date) {
                const t1 = slot1Time.split(':').map(Number);
                const t2 = slot2Time.split(':').map(Number);
                const mins1 = t1[0] * 60 + t1[1];
                const mins2 = t2[0] * 60 + t2[1];
                if (Math.abs(mins2 - mins1) < 30) {
                    setErr('errAgree', 'Slot 2 must be at least 30 minutes after Slot 1.');
                    return;
                }
            }
            callbackSlots.push({ date: slot2Date, time: slot2Time, label: 'Slot 2' });
        }

        // Build answers array
        const answers = this.history.map(nId => {
            const opt = this.selectedOptions[nId];
            const node = this.nodes.find(n => n.id === nId);
            if (!opt) return null;
            return { question: opt.question || node?.title || nId, answer: opt.text };
        }).filter(Boolean);

        const btn = document.getElementById('leadSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

        try {
            const res = await fetch(`${BASE_URL}/public/submit_lead.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, answers, callbackSlots })
            });
            const data = await res.json();
            if (data.success) {
                this.showSuccessScreen();
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Confirm & Submit';
                document.getElementById('errAgree').textContent = data.error || 'Submission failed. Please try again.';
            }
        } catch (e) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Confirm & Submit';
            document.getElementById('errAgree').textContent = 'Network error. Please check your connection and try again.';
        }
    }

    showSuccessScreen() {
        document.getElementById('leadModalBody').style.display = 'none';
        document.getElementById('leadSuccessBody').style.display = 'flex';
    }

    /* ════════════ UTILITIES ════════════ */

    showTypingIndicator() {
        const id = 'typing_' + Date.now();
        document.getElementById('chatMessagesArea').insertAdjacentHTML('beforeend', `
            <div class="chat-row bot-row" id="${id}">
                <div class="chat-bot-icon"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble bot-bubble typing-indicator">
                    <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                </div>
            </div>`);
        this.scrollToBottom();
        return id;
    }

    removeTypingIndicator(id) { document.getElementById(id)?.remove(); }

    scrollToBottom() {
        const a = document.getElementById('chatMessagesArea');
        a.scrollTop = a.scrollHeight;
    }

    updateProgress() {
        const pct = this.nodes.length > 0 ? (this.history.length / this.nodes.length) * 100 : 0;
        document.getElementById('flowProgressFill').style.width = Math.min(100, pct) + '%';
        document.getElementById('prevQuestionBtn').disabled = this.history.length <= 1;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.userChat = new UserChatEngine();
});
