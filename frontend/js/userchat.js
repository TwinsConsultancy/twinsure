class UserChatEngine {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.history = [];
        this.selectedOptions = {};
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
            // Unauthenticated public API
            const response = await fetch(`${BASE_URL}/public/recommendation_flow.php`);
            if(!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            this.nodes = data.nodes || [];
            this.edges = data.edges || [];
            if(data.greeting) this.greetingText = data.greeting;
            
            this.startFlow();
        } catch(e) {
            console.error('Failed to load flow', e);
            this.renderBotMessage("Sorry, the recommendation engine is currently unavailable.");
        }
    }
    
    startFlow() {
        this.history = [];
        this.selectedOptions = {};
        document.getElementById('chatMessagesArea').innerHTML = '';
        
        this.renderBotMessage(this.greetingText);
        
        const firstEdge = this.edges.find(e => e.fromNode === 'greeting');
        if(firstEdge) {
            this.currentNodeId = firstEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else if(this.nodes.length > 0) {
            this.currentNodeId = this.nodes[0].id;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            this.renderBotMessage("No recommendations are available at this time.");
        }
        this.updateProgress();
    }
    
    goBack() {
        if(this.history.length <= 1) return;
        const removedNodeId = this.history.pop();
        delete this.selectedOptions[removedNodeId];
        this.currentNodeId = this.history[this.history.length - 1];
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
            
            if(i === this.history.length - 1) {
                this.renderOptions(node);
            } else {
                const choice = this.selectedOptions[nId];
                if(choice) this.renderUserMessage(choice.text);
            }
        }
        this.updateProgress();
    }
    
    renderCurrentNode() {
        const node = this.nodes.find(n => n.id === this.currentNodeId);
        if(!node) return;
        
        const typingId = this.showTypingIndicator();
        setTimeout(() => {
            this.removeTypingIndicator(typingId);
            this.renderBotMessage(node.text);
            this.renderOptions(node);
            this.updateProgress();
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
        ChatInputs.render(node, this, 'userChat');
    }
    
    selectOption(nodeId, optionId, optionText) {
        if(!optionText) return;
        
        const container = document.getElementById(`opts_${nodeId}`);
        if(container) container.style.pointerEvents = 'none';
        
        this.renderUserMessage(optionText);
        this.selectedOptions[nodeId] = { text: optionText };
        
        const nextEdge = this.edges.find(e => e.fromNode === nodeId && e.fromOption === optionId);
        if(nextEdge) {
            this.currentNodeId = nextEdge.toNode;
            this.history.push(this.currentNodeId);
            this.renderCurrentNode();
        } else {
            const typingId = this.showTypingIndicator();
            setTimeout(() => {
                this.removeTypingIndicator(typingId);
                this.renderBotMessage("Thank you! Based on your answers, our agents will review and contact you with the best tailored recommendation soon.");
                this.updateProgress();
            }, 600);
        }
        this.updateProgress();
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
    
    updateProgress() {
        const pct = this.nodes.length > 0 ? (this.history.length / this.nodes.length) * 100 : 0;
        document.getElementById('flowProgressFill').style.width = Math.min(100, pct) + '%';
        document.getElementById('prevQuestionBtn').disabled = this.history.length <= 1;
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.userChat = new UserChatEngine();
});
