const API_URL = '/api/chat'; // Update to use local endpoint

// Custom responses
const CUSTOM_RESPONSES = {
    'who are you': [
        "I'm an AI assistant created by Raju Startup, dedicated to providing intelligent and helpful solutions.",
        "As an AI developed by Raju Startup, my purpose is to assist you with a wide range of tasks and conversations.",
        "Raju Startup's AI assistant here, ready to help you with any questions or challenges you might have."
    ],
    'who created you': [
        "I was developed by the innovative team at Raju Startup, a cutting-edge AI technology company.",
        "Raju Startup is my creator - a forward-thinking tech company pushing the boundaries of artificial intelligence.",
        "Created by the brilliant minds at Raju Startup, I'm here to provide top-notch AI assistance."
    ],
    'what is your name': [
        "I'm the Raju Startup AI Assistant. Feel free to call me RajuAI!",
        "My name is RajuAI, proudly developed by Raju Startup.",
        "I'm known as the Raju Startup AI - your intelligent digital companion."
    ]
};

function getRandomResponse(key) {
    const responses = CUSTOM_RESPONSES[key];
    return responses ? responses[Math.floor(Math.random() * responses.length)] : null;
}

function showGenerating() {
    const chatBox = document.getElementById('chat-box');
    const generatingDiv = document.createElement('div');
    generatingDiv.className = 'generating';
    generatingDiv.innerHTML = 'Bot thinking... <div class="dot-animation"></div><div class="dot-animation"></div><div class="dot-animation"></div>';
    chatBox.appendChild(generatingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return generatingDiv;
}

let controller = null; // For AbortController

// Improved typing animation function
async function typeText(element, text) {
    const chunks = text.split(/(?<=[.!?])\s+/); // Split by sentences
    element.textContent = '';
    
    for (let i = 0; i < chunks.length; i++) {
        const chunkDiv = document.createElement('div');
        chunkDiv.className = 'typing-content';
        chunkDiv.textContent = chunks[i] + ' ';
        element.appendChild(chunkDiv);
        
        // Small delay before showing each chunk
        await new Promise(resolve => setTimeout(resolve, 50));
        chunkDiv.classList.add('visible');
        
        // Delay between sentences
        if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}

// Enhanced appendMessage function
async function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    // Add avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `message-avatar ${sender}-avatar`;
    avatarDiv.innerHTML = sender === 'user' ? 
        '<svg stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"></path><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"></circle></svg>' :
        '<svg stroke="currentColor" fill="none" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" stroke-width="2"></path></svg>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    if (sender === 'ai') {
        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C3 1 2 2 2 3v14h2V3h12V1zm3 4H8C7 5 6 6 6 7v14c0 1 1 2 2 2h11c1 0 2-1 2-2V7c0-1-1-2-2-2zm0 16H8V7h11v14z"/></svg>Copy';
        copyButton.onclick = () => {
            navigator.clipboard.writeText(message);
            copyButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C3 1 2 2 2 3v14h2V3h12V1zm3 4H8C7 5 6 6 6 7v14c0 1 1 2 2 2h11c1 0 2-1 2-2V7c0-1-1-2-2-2zm0 16H8V7h11v14z"/></svg>Copy';
            }, 2000);
        };
        contentDiv.appendChild(copyButton);
        
        // Type out the message
        chatBox.appendChild(messageDiv);
        await typeText(contentDiv, message);
        
        // Format after typing
        const formattedContent = formatResponse(message);
        contentDiv.innerHTML = formattedContent;
        
        // Re-add copy button after formatting
        contentDiv.appendChild(copyButton);
    } else {
        contentDiv.textContent = message;
        chatBox.appendChild(messageDiv);
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const inputContainer = document.querySelector('.input-container');
    const stopButton = document.getElementById('stop-generate');
    const message = userInput.value.trim();

    if (message === '' || inputContainer.classList.contains('disabled')) return;

    // Reset previous controller
    if (controller) {
        controller.abort();
    }
    controller = new AbortController();

    inputContainer.classList.add('disabled');
    stopButton.classList.add('visible');
    
    appendMessage('user', message);
    userInput.value = '';

    const generatingElement = showGenerating();

    try {
        let aiResponse;
        const lowerMessage = message.toLowerCase();

        // Check for custom responses
        for (const key of Object.keys(CUSTOM_RESPONSES)) {
            if (lowerMessage.includes(key)) {
                aiResponse = getRandomResponse(key);
                break;
            }
        }

        // If no custom response, use API
        if (!aiResponse) {
            console.log('Sending message to server:', message); // Debug log

            const response = await fetch('http://localhost:3001/api/chat', {  // Make sure URL is correct
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            aiResponse = data.text;
        }

        generatingElement.remove();
        await appendMessage('ai', aiResponse);

    } catch (error) {
        console.error('Client Error:', error);
        // Add user-friendly error message to chat
        appendMessage('AI', 'Sorry, I encountered an error. Please try again.');
    }

    inputContainer.classList.remove('disabled');
    stopButton.classList.remove('visible');
    userInput.focus();
    controller = null;
}

// Add stop generation handler
document.getElementById('stop-generate').addEventListener('click', () => {
    if (controller) {
        controller.abort();
    }
});

// Event listeners
document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-expanding textarea
function initializeTextarea() {
    const textarea = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    textarea.addEventListener('input', function() {
        // Reset height to get the correct scrollHeight
        this.style.height = 'auto';
        
        // Set new height based on content
        const newHeight = Math.min(this.scrollHeight, 200);
        this.style.height = newHeight + 'px';
        
        // Show/hide send button based on content
        sendButton.style.opacity = this.value.trim() ? '1' : '0.6';
    });

    // Handle Shift+Enter for new line
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Add send button handler
document.getElementById('send-button').addEventListener('click', sendMessage);

// Add the missing formatResponse function
function formatResponse(text) {
    // Check if the response contains code blocks
    if (text.includes('```')) {
        return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            language = language || 'plaintext';
            const highlighted = Prism.highlight(code, Prism.languages[language] || Prism.languages.plaintext, language);
            return `<pre class="line-numbers language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
        });
    }
    // Check if it's an email format
    else if (text.toLowerCase().includes('subject:') && text.toLowerCase().includes('dear')) {
        return `<div class="email-format">${text}</div>`;
    }
    // Format as markdown for regular text
    else {
        return marked.parse(text);
    }
}

// Initialize
window.onload = function() {
    initializeTextarea();
};