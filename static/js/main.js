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

function formatCodeMessage(messageDiv, codeContent, language = 'text') {
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-container';
    
    // Create header container
    const headerDiv = document.createElement('div');
    headerDiv.className = 'code-header';
    headerDiv.style.display = 'flex';
    headerDiv.style.justifyContent = 'space-between';
    headerDiv.style.alignItems = 'center';
    
    const languageSpan = document.createElement('span');
    const languageMap = {
        'python': 'Python',
        'py': 'Python',
        'javascript': 'JavaScript',
        'js': 'JavaScript',
        'java': 'Java',
        'cpp': 'C++',
        'c++': 'C++',
        'c': 'C',
        'csharp': 'C#',
        'cs': 'C#',
        'html': 'HTML',
        'css': 'CSS',
        'sql': 'SQL',
        'php': 'PHP',
        'ruby': 'Ruby',
        'rb': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'typescript': 'TypeScript',
        'ts': 'TypeScript'
    };
    
    // Preserve exact case and special characters for C++ and C#
    const normalizedLang = language.toLowerCase();
    languageSpan.textContent = languageMap[normalizedLang] || language;
    
    // Special handling for C++ to ensure it's displayed correctly
    if (normalizedLang === 'cpp' || normalizedLang === 'c++') {
        languageSpan.textContent = 'C++';
    }
    
    headerDiv.appendChild(languageSpan);
    
    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'code-header-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '8px';
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'code-button';
    copyButton.innerHTML = '<i class="material-icons" style="font-size: 16px;">content_copy</i>';
    copyButton.title = 'Copy code';
    copyButton.onclick = async () => {
        try {
            await navigator.clipboard.writeText(codeContent);
            copyButton.innerHTML = '<i class="material-icons" style="font-size: 16px;">check</i>';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="material-icons" style="font-size: 16px;">content_copy</i>';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };
    
    // Download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'code-button';
    downloadButton.innerHTML = '<i class="material-icons" style="font-size: 16px;">download</i>';
    downloadButton.title = 'Download code';
    downloadButton.onclick = () => {
        const blob = new Blob([codeContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = language.toLowerCase() === 'python' ? 'py' : 
                         language.toLowerCase() === 'javascript' ? 'js' :
                         language.toLowerCase() === 'java' ? 'java' :
                         language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++' ? 'cpp' :
                         'txt';
        a.download = `code.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    buttonsContainer.appendChild(copyButton);
    buttonsContainer.appendChild(downloadButton);
    headerDiv.appendChild(buttonsContainer);
    codeContainer.appendChild(headerDiv);
    
    // Add code content
    const preElement = document.createElement('pre');
    const codeElement = document.createElement('code');
    //codeElement.className = `language-${language.toLowerCase()}`;

    // Handle language class for syntax highlighting
    let highlightLanguage = language.toLowerCase();
    if (highlightLanguage === 'c++' || highlightLanguage === 'cpp') {
        highlightLanguage = 'cpp';
    }
    codeElement.className = `language-${highlightLanguage}`;
    
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

//Worked for some cases failed for some cases
// function addMessageToChat(role, messageData, generationTime = null) {
//     const messagesContainer = document.getElementById('chat-messages');
//     const messageDiv = document.createElement('div');
//     messageDiv.className = `message ${role}-message`;
    
//     if (messageData.type === 'code') {
//         // Extract code and explanation from the content
//         const fullContent = messageData.content.code
        
//         // Find the code block with language identifier
//         const codeMatch = fullContent.match(/```([\w+#]+)?\s*([\s\S]*?)```/);
        
//         if (codeMatch) {
//             // Extract language and code
//             const language = codeMatch[1] || 'text'; // Language identifier
//             const code = codeMatch[2].trim(); // The actual code
            
//             // Get content before the first code block
//             const beforeCode = fullContent.substring(0, fullContent.indexOf('```')).trim();
//             if (beforeCode) {
//                 const beforeExplanationDiv = document.createElement('div');
//                 beforeExplanationDiv.className = 'message-content';
//                 beforeExplanationDiv.textContent = beforeCode;
//                 messageDiv.appendChild(beforeExplanationDiv);
//             }
            
//             // Format and add the code block with the correct language
//             formatCodeMessage(messageDiv, code, language);
            
//             // Get content after the last code block
//             const afterLastBacktick = fullContent.substring(fullContent.lastIndexOf('```') + 3).trim();
//             if (afterLastBacktick) {
//                 const afterExplanationDiv = document.createElement('div');
//                 afterExplanationDiv.className = 'message-content';
//                 afterExplanationDiv.textContent = afterLastBacktick;
//                 messageDiv.appendChild(afterExplanationDiv);
//             }
//         }
//     }
//     else {
//         const contentDiv = document.createElement('div');
//         contentDiv.className = 'message-content';
//         contentDiv.textContent = messageData.content.message;
//         messageDiv.appendChild(contentDiv);
//     }
    
//     if (role === 'bot' && generationTime !== null) {
//         const timeDiv = document.createElement('div');
//         timeDiv.className = 'generation-time';
//         timeDiv.textContent = `Response generated in ${generationTime}s`;
//         messageDiv.appendChild(timeDiv);
//     }
    
//     messagesContainer.appendChild(messageDiv);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
// }

function addMessageToChat(role, messageData, generationTime = null) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    // Handle different message types
    if (messageData.type === 'code') {
        // Ensure content exists and handle both string and object formats
        const fullContent = typeof messageData.content === 'string' 
            ? messageData.content 
            : messageData.content.code || '';
        
        // More robust code block detection
        const codeBlockRegex = /```([\w+#]*)\s*([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;
        let hasCodeBlock = false;
        
        while ((match = codeBlockRegex.exec(fullContent)) !== null) {
            hasCodeBlock = true;
            
            // Add any text before the code block
            const beforeText = fullContent.substring(lastIndex, match.index).trim();
            if (beforeText) {
                const textDiv = document.createElement('div');
                textDiv.className = 'message-content';
                textDiv.textContent = beforeText;
                messageDiv.appendChild(textDiv);
            }
            
            // Add the code block
            const language = match[1] || 'text';
            const code = match[2].trim();
            if (code) {
                formatCodeMessage(messageDiv, code, language);
            }
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add any remaining text after the last code block
        const remainingText = fullContent.substring(lastIndex).trim();
        if (remainingText) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-content';
            textDiv.textContent = remainingText;
            messageDiv.appendChild(textDiv);
        }
        
        // Handle case where no code blocks were found
        if (!hasCodeBlock && fullContent.trim()) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-content';
            textDiv.textContent = fullContent;
            messageDiv.appendChild(textDiv);
        }
    }
    else {
        // Handle regular text messages
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = messageData.content.message || messageData.content || '';
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