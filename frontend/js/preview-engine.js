class PreviewEngine {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.history = []; // array of node ids
        this.selectedOptions = {}; // nodeId -> { text, branchText }
        this.currentNodeId = null;
        this.greetingText = "Welcome! Let's help you find the best insurance plan for your needs.";
        
        this.loadFlow();
        this.initEvents();
    }
    
    initEvents() {
        document.getElementById('restartFlowBtn').addEventListener('click', () => this.startFlow());
        document.getElementById('prevQuestionBtn').addEventListener('click', () => this.goBack());
        const pubBtn = document.getElementById('publishFlowBtn');
        if(pubBtn) pubBtn.addEventListener('click', () => this.publishFlow());
    }

    async publishFlow() {
        const btn = document.getElementById('publishFlowBtn');
        const originalText = btn.innerText;
        btn.innerText = 'Publishing...';
        btn.disabled = true;
        
        try {
            const draft = localStorage.getItem('draft_flow');
            if(draft) {
                const data = JSON.parse(draft);
                await api.post('/admin/recommendations.php', data);
                btn.innerText = 'Published!';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        } catch(e) {
            console.error(e);
            alert('Failed to publish flow. Check console.');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    async loadFlow() {
        try {
            const draft = localStorage.getItem('draft_flow');
            if(draft) {
                const data = JSON.parse(draft);
                this.nodes = data.nodes || [];
                this.edges = data.edges || [];
                if(data.greeting) this.greetingText = data.greeting;
                this.startFlow();
            } else {
                this.renderBotMessage("No draft flow found. Go back to builder and click Preview Flow.");
            }
        } catch(e) {
            console.error('Failed to load draft', e);
        }
    }
    
    startFlow() {
        this.history = [];
        this.selectedOptions = {};
        document.getElementById('chatMessagesArea').innerHTML = '';
        
        // 1. Render greeting
        this.renderBotMessage(this.greetingText);
        
        // Find first node connected to greeting
        const firstEdge = this.edges.find(e => e.fromNode === 'greeting');
        if(firstEdge) {
            this.currentNodeId = firstEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else if(this.nodes.length > 0) {
            // Fallback to node_1 or first node
            this.currentNodeId = this.nodes[0].id;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            this.renderBotMessage("No flow has been configured yet.");
        }
        this.updateAnalytics();
    }
    
    goBack() {
        if(this.history.length <= 1) return;
        
        // Remove current node from history
        const removedNodeId = this.history.pop();
        delete this.selectedOptions[removedNodeId];
        
        // Get previous node
        this.currentNodeId = this.history[this.history.length - 1];
        
        // Re-render chat
        this.rebuildChatFromHistory();
    }

    rebuildChatFromHistory() {
        document.getElementById('chatMessagesArea').innerHTML = '';
        this.renderBotMessage(this.greetingText);
        
        for(let i=0; i<this.history.length; i++) {
            const nId = this.history[i];
            const node = this.nodes.find(n => n.id === nId);
            if(!node) continue;
            
            this.renderBotMessage(node.text);
            
            // If it's the last node, render options. Otherwise render the user's choice.
            if(i === this.history.length - 1) {
                this.renderOptions(node);
            } else {
                const choice = this.selectedOptions[nId];
                if(choice) this.renderUserMessage(choice.text);
            }
        }
        this.updateAnalytics();
    }
    
    renderCurrentNode() {
        const node = this.nodes.find(n => n.id === this.currentNodeId);
        if(!node) return;
        
        const typingId = this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator(typingId);
            this.renderBotMessage(node.text);
            this.renderOptions(node);
            this.updateAnalytics();
        }, 600);
    }
    
    renderBotMessage(text) {
        const area = document.getElementById('chatMessagesArea');
        const html = `
            <div class="chat-row bot-row">
                <div class="chat-bot-icon"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble bot-bubble">${text}</div>
            </div>
        `;
        area.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
    }
    
    renderUserMessage(text) {
        const area = document.getElementById('chatMessagesArea');
        const html = `
            <div class="chat-row user-row">
                <div class="chat-bubble user-bubble">${text}</div>
            </div>
        `;
        area.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
    }
    
    renderOptions(node) {
        const area = document.getElementById('chatMessagesArea');
        let optionsHtml = '';
        
        if(node.type === 'radio' || node.type === 'checkbox') {
            const opts = node.options.map(opt => `
                <button class="chat-option-pill ${opt.color ? 'color-'+opt.color : ''}" onclick="window.previewEngine.selectOption('${node.id}', '${opt.id}', '${opt.text.replace(/'/g,"\\'")}', '${node.title.replace(/'/g,"\\'")}')">${opt.text}</button>
            `).join('');
            optionsHtml = `<div class="chat-options-container" id="opts_${node.id}">${opts}</div>`;
        } else if (node.type === 'dropdown') {
            const opts = node.options.map(opt => `<option value="${opt.id}">${opt.text}</option>`).join('');
            optionsHtml = `
                <div class="chat-options-container" id="opts_${node.id}">
                    <select class="chat-dropdown" onchange="window.previewEngine.selectOption('${node.id}', this.value, this.options[this.selectedIndex].text, '${node.title.replace(/'/g,"\\'")}')">
                        <option value="" disabled selected>Select an option ^</option>
                        ${opts}
                    </select>
                </div>
            `;
        } else if (node.type === 'text') {
            optionsHtml = `
                <div class="chat-options-container" id="opts_${node.id}" style="width: 100%; max-width: 300px;">
                    <input type="text" class="chat-text-input" placeholder="Type your answer..." id="text_${node.id}">
                    <button class="btn btn-purple-small" style="margin-top:0.5rem;" onclick="window.previewEngine.selectOption('${node.id}', 'default_text_opt', document.getElementById('text_${node.id}').value, '${node.title.replace(/'/g,"\\'")}')">Send</button>
                </div>
            `;
        }
        
        if(optionsHtml) {
            area.insertAdjacentHTML('beforeend', optionsHtml);
            this.scrollToBottom();
        }
    }
    
    selectOption(nodeId, optionId, optionText, branchTitle) {
        if(!optionText) return;
        
        // Disable existing options
        const container = document.getElementById(`opts_${nodeId}`);
        if(container) container.style.pointerEvents = 'none';
        
        this.renderUserMessage(optionText);
        this.selectedOptions[nodeId] = { text: optionText, branch: branchTitle };
        
        // Find next node
        const nextEdge = this.edges.find(e => e.fromNode === nodeId && e.fromOption === optionId);
        if(nextEdge) {
            this.currentNodeId = nextEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            const typingId = this.showTypingIndicator();
            setTimeout(() => {
                this.removeTypingIndicator(typingId);
                this.renderBotMessage("Thank you! That's all the information we need. We are generating your recommendation.");
                this.updateAnalytics();
            }, 600);
        }
        this.updateAnalytics();
    }
    
    showTypingIndicator() {
        const id = 'typing_' + Date.now();
        const area = document.getElementById('chatMessagesArea');
        const html = `
            <div class="chat-row bot-row" id="${id}">
                <div class="chat-bot-icon"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble bot-bubble typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        area.insertAdjacentHTML('beforeend', html);
        this.scrollToBottom();
        return id;
    }
    
    removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }
    
    scrollToBottom() {
        const area = document.getElementById('chatMessagesArea');
        area.scrollTop = area.scrollHeight;
    }
    
    updateAnalytics() {
        document.getElementById('analyticsCompleted').innerText = Math.max(0, this.history.length - 1);
        document.getElementById('analyticsCurrentId').innerText = '#' + (this.currentNodeId || 'END');
        
        // Build Branch Path
        const branchParts = [];
        const answersList = [];
        
        this.history.forEach(nId => {
            const opt = this.selectedOptions[nId];
            if(opt) {
                branchParts.push(opt.branch || opt.text);
                answersList.push(`${opt.branch ? opt.branch + ' > ' : ''}${opt.text}`);
            }
        });
        
        if(branchParts.length === 0) {
            document.getElementById('analyticsBranch').innerText = 'Start';
        } else {
            document.getElementById('analyticsBranch').innerText = branchParts.join(' > ');
        }
        
        if(answersList.length === 0) {
            document.getElementById('analyticsAnswers').innerHTML = '<em>None</em>';
        } else {
            document.getElementById('analyticsAnswers').innerHTML = answersList.join('<br>');
        }
        
        document.getElementById('flowProgressText').innerText = `Question ${this.history.length} of ${this.nodes.length}`;
        const pct = this.nodes.length > 0 ? (this.history.length / this.nodes.length) * 100 : 0;
        document.getElementById('flowProgressFill').style.width = Math.min(100, pct) + '%';
        
        document.getElementById('prevQuestionBtn').disabled = this.history.length <= 1;
    }
}
