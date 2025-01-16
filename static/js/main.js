// Theme handling
function toggleTheme() {
    const body = document.body;
    const themeToggleIcon = document.querySelector('.theme-toggle .material-icons');
    const currentTheme = body.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        body.removeAttribute('data-theme');
        themeToggleIcon.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeToggleIcon.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeToggleIcon = document.querySelector('.theme-toggle .material-icons');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleIcon.textContent = 'light_mode';
    }
});

function showHistory() {
    document.getElementById('historySidebar').classList.add('active');
    loadChatHistory();
}

function hideHistory() {
    document.getElementById('historySidebar').classList.remove('active');
}

async function clearChat() {
    try {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        const initialMessage = document.createElement('div');
        initialMessage.className = 'message bot-message';
        initialMessage.innerHTML = '<div class="message-content">Hello! How can I assist you today? 👋</div>';
        messagesContainer.appendChild(initialMessage);
        
        await axios.post('/clear-history');
        
        const historyContent = document.getElementById('historyContent');
        if (historyContent) {
            historyContent.innerHTML = '';
        }
        
    } catch (error) {
        console.error('Error clearing chat:', error);
        addMessageToChat('bot', {
            type: 'text',
            content: { message: 'Sorry, I encountered an error while clearing the chat. Please try again.' }
        });
    }
}

async function sendMessage() {
    const inputElement = document.getElementById('user-input');
    const message = inputElement.value.trim();
    
    if (!message) return;

    inputElement.disabled = true;
    document.getElementById('send-button').disabled = true;
    document.getElementById('loading').style.display = 'flex';

    addMessageToChat('user', { type: 'text', content: { message } });
    inputElement.value = '';

    try {
        const response = await axios.post('/chat', {
            user_input: message
        });

        const { response_type, content, generation_time } = response.data;
        addMessageToChat('bot', { type: response_type, content }, generation_time);
        
        loadChatHistory();
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('bot', {
            type: 'text',
            content: { message: 'Sorry, I encountered an error. Please try again.' }
        });
    } finally {
        inputElement.disabled = false;
        document.getElementById('send-button').disabled = false;
        document.getElementById('loading').style.display = 'none';
        inputElement.focus();
    }
}

// function addMessageToChat(role, messageData, generationTime = null) {
//     const messagesContainer = document.getElementById('chat-messages');
//     const messageDiv = document.createElement('div');
//     messageDiv.className = `message ${role}-message`;
    
//     if (messageData.type === 'text') {
//         const contentDiv = document.createElement('div');
//         contentDiv.className = 'message-content';
//         contentDiv.textContent = messageData.content.message;
//         messageDiv.appendChild(contentDiv);
//     }
//     else if (messageData.type === 'code') {
//         if (messageData.content.explanation) {
//             const explanationDiv = document.createElement('div');
//             explanationDiv.className = 'code-explanation';
//             explanationDiv.textContent = messageData.content.explanation;
//             messageDiv.appendChild(explanationDiv);
//         }
        
//         const codeContainer = document.createElement('div');
//         codeContainer.className = 'code-container';
        
//         const codeHeader = document.createElement('div');
//         codeHeader.className = 'code-header';
//         codeHeader.textContent = messageData.content.language || 'text';
        
//         const codeBlock = document.createElement('pre');
//         const codeContent = document.createElement('code');
//         codeContent.className = `language-${messageData.content.language || 'text'}`;
//         codeContent.textContent = messageData.content.code;
        
//         codeBlock.appendChild(codeContent);
//         codeContainer.appendChild(codeHeader);
//         codeContainer.appendChild(codeBlock);
//         messageDiv.appendChild(codeContainer);
//     }
    
//     if (role === 'bot' && generationTime !== null) {
//         const timeDiv = document.createElement('div');
//         timeDiv.className = 'generation-time';
//         timeDiv.textContent = `Response generated in ${generationTime}s`;
//         messageDiv.appendChild(timeDiv);
//     }
    
//     messagesContainer.appendChild(messageDiv);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;

//     if (messageData.type === 'code' && window.hljs) {
//         messageDiv.querySelectorAll('pre code').forEach((block) => {
//             hljs.highlightElement(block);
//         });
//     }
// }

function formatCodeMessage(messageDiv, codeContent,language = 'text') {
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    
    // Add language header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'code-header';
    headerDiv.textContent = language || 'text';  // Fallback to 'text' if no language specified
    codeContainer.appendChild(headerDiv);
    
    // Add code content with proper formatting
    const preElement = document.createElement('pre');
    const codeElement = document.createElement('code');
    codeElement.className = `language-${language || 'text'}`;
    
    // Ensure proper indentation and formatting
    const formattedCode = codeContent.trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    codeElement.innerHTML = formattedCode;
    preElement.appendChild(codeElement);
    codeContainer.appendChild(preElement);
    
    messageDiv.appendChild(codeContainer);
    
    // Initialize syntax highlighting
    if (window.hljs) {
        hljs.highlightElement(codeElement);
    }
}

// Update the addMessageToChat function to include this section:
function addMessageToChat(role, messageData, generationTime = null) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    if (messageData.type === 'code') {
        // Add explanation if present
        if (messageData.content.explanation) {
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'code-explanation';
            explanationDiv.textContent = messageData.content.explanation;
            messageDiv.appendChild(explanationDiv);
        }
        
        // Format and add the code
        formatCodeMessage(messageDiv, messageData.content.code, messageData.content.language);
    } else {
        // Handle regular text messages
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = messageData.content.message;
        messageDiv.appendChild(contentDiv);
    }
    
    // Add generation time for bot messages
    if (role === 'bot' && generationTime !== null) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'generation-time';
        timeDiv.textContent = `Response generated in ${generationTime}s`;
        messageDiv.appendChild(timeDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadChatHistory() {
    try {
        const response = await axios.get('/chat-history');
        const historyContent = document.getElementById('historyContent');
        historyContent.innerHTML = '';

        const userMessages = response.data.filter(message => message.role === 'user');
        
        if (userMessages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'history-empty';
            emptyMessage.textContent = 'No previous messages';
            historyContent.appendChild(emptyMessage);
            return;
        }

        userMessages.forEach((message) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'history-item';
            
            //const timestamp = new Date().toLocaleTimeString();
            // Use the message's timestamp if available, otherwise fallback to current time
            const timestamp = message.timestamp 
            ? new Date(message.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString();
        
            messageDiv.innerHTML = `
                <span class="history-timestamp">${timestamp}</span>
                <p class="history-text">${message.content}</p>
            `;
            
            messageDiv.onclick = () => {
                document.getElementById('user-input').value = message.content;
                hideHistory();
            };
            
            historyContent.appendChild(messageDiv);
        });
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// Event Listeners
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

const input = document.getElementById('user-input');
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user-input').focus();
});