const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
const PORT = 3000;

// IMPORTANT: Now we are securely getting the API key from Render's environment variables.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client with the API key
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware to parse JSON bodies from POST requests
app.use(express.json());

// Frontend HTML and JavaScript content
const frontendContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PeachGPT</title>
    <meta name="description" content="your personal AI assistant "
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #e5e7eb;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            color: #1f2937;
        }
        a{
        color: #fff ;
        text-decoration: none ;
       } 
        .container {
            display: flex;
            width: 100%;
            height: 100vh;
            overflow: hidden;
        }
        .sidebar {
            width: 256px; /* 64 Tailwind */
            background-color: #1f2937;
            color: white;
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            z-index: 50;
        }
        .sidebar.open {
            transform: translateX(0);
        }
        @media (min-width: 768px) {
            .sidebar {
                transform: translateX(0);
                position: static;
            }
        }
        .sidebar-item {
            display: block;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: background-color 0.2s;
            color:white:
            text-decoration:none;
        }
        .sidebar-item:hover {
            background-color: #374151;
        }
        .main-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            background-color: white;
            border-radius: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin: 1rem;
            position: relative;
        }
        .page {
            display: none;
            flex-grow: 1;
            overflow-y: auto;
            padding: 2rem;
        }
        .page.active {
            display: flex;
            flex-direction: column;
        }
        .chat-header, .page-header {
            background-color: white ;
            color: black ;
            padding: 1rem;
            text-align: center;
            font-weight: bold;
            font-size: 1.25rem;
            border-top-left-radius: 1.5rem;
            border-top-right-radius: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .page-header {
            position: absolute;
            top: 1rem;
            left: 1rem;
            right: 1rem;
            border-radius: 1.5rem 1.5rem 0 0;
        }
        .menu-toggle {
            background: none;
            border: none;
            color: black ;
            font-size: 1.5rem;
            cursor: pointer;
            display: block;
        }
        @media (min-width: 768px) {
            .menu-toggle {
                display: none;
            }
        }
        .chat-box {
            flex-grow: 1;
            overflow-y: auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .message {
            max-width: 80%;
            padding: 0.75rem 1rem;
            border-radius: 1.5rem;
            line-height: 1.4;
        }
        .user-message {
            background-color: #d1e7dd;
            align-self: flex-end;
            border-bottom-right-radius: 0.25rem;
        }
        .ai-message {
            background-color: #e2e8f0;
            align-self: flex-start;
            border-bottom-left-radius: 0.25rem;
        }
        .input-container {
            padding: 1rem;
            border-top: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .input-wrapper {
            display: flex;
            gap: 0.5rem;
        }
        .input-wrapper input {
            flex-grow: 1;
            padding: 0.75rem 1rem;
            border-radius: 1.5rem;
            border: 1px solid #d1d5db;
            outline: none;
            transition: all 0.2s;
        }
        .input-wrapper input:focus {
            border-color: #4b5563;
            box-shadow: 0 0 0 2px rgba(75, 85, 99, 0.2);
        }
        .input-wrapper button {
            padding: 0.75rem 1.5rem;
            background-color: #4b5563;
            color: white;
            border-radius: 1.5rem;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        .input-wrapper button:hover {
            background-color: #1f2937;
        }
        .disclaimer {
            text-align: center;
            font-size: 0.75rem;
            color: #6b7280;
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Sidebar -->
    <nav id="sidebar" class="sidebar">
        <div class="text-xl font-bold mb-4">Peach GPT</div>
        <a href="#chat-page" class="sidebar-item active">Chat</a>
        <a href="#about-page" class="sidebar-item">About Us</a>
        <a href="#contact-page" class="sidebar-item">Contact</a>
        <a href="#terms-page" class="sidebar-item">Terms of Service</a>
    </nav>
    
    <!-- Main Content -->
    <div class="main-content">
        <!-- Chat Page -->
        <div id="chat-page" class="page active">
            <div class="chat-header">
                <button id="menu-toggle" class="menu-toggle md:hidden">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="flex-grow text-center">Peach GPT</div>
            </div>
            
            <div id="chat-box" class="chat-box">
                <div class="message ai-message">Hi there! I'm Peach GPT, and I'm here to help. What can I assist you with today?</div>
            </div>
            
            <div class="input-container">
                <div class="input-wrapper">
                    <input type="text" id="user-input" placeholder="Ask Peach GPT...">
                    <button id="send-button">Send</button>
                </div>
                <small class="disclaimer">AI can make mistakes. Please consider checking the information before acting.</small>
            </div>
        </div>

        <!-- About Page -->
        <div id="about-page" class="page">
            <div class="page-header">
                <button id="menu-toggle-about" class="menu-toggle md:hidden">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="flex-grow text-center">About Us</div>
            </div>
            <h1 class="text-3xl font-bold mb-4">About Peach GPT</h1>
            <p class="mb-4">Welcome to Peach GPT, your personal AI assistant designed to provide clear, concise, and human-friendly support. We believe in a professional yet approachable interaction.</p>
            <p class="mb-4">Peach GPT is built to assist with a wide range of tasks, from drafting emails to answering complex questions, all while maintaining a conversational and helpful tone.</p>
            <p>Our mission is to make AI accessible and easy to use for everyone, empowering you to work smarter and faster.</p>
        </div>

        <!-- Contact Page -->
        <div id="contact-page" class="page">
            <div class="page-header">
                <button id="menu-toggle-contact" class="menu-toggle md:hidden">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="flex-grow text-center">Contact Us</div>
            </div>
            <h1 class="text-3xl font-bold mb-4">Contact Us</h1>
            <p class="mb-4">If you have any questions, feedback, or inquiries, feel free to reach out to us.</p>
            <h2 class="text-xl font-semibold mb-2 mt-4">Email</h2>
            <p class="mb-4">You can contact us directly at <a href="mailto:muhdajauro@gmail.com" class="text-blue-500 hover:underline">**muhdajauro@gmail.com**</a>.</p>
            <p>We appreciate your feedback and will get back to you as soon as possible.</p>
        </div>

        <!-- Terms Page -->
        <div id="terms-page" class="page">
            <div class="page-header">
                <button id="menu-toggle-terms" class="menu-toggle md:hidden">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="flex-grow text-center">Terms of Service</div>
            </div>
            <h1 class="text-3xl font-bold mb-4">Terms of Service</h1>
            <h2 class="text-xl font-semibold mb-2 mt-4">Disclaimer of Liability</h2>
            <p class="mb-4">Peach GPT is provided for informational and entertainment purposes only. The information provided by the AI is generated based on a vast dataset and may not be accurate, complete, or up-to-date. By using this service, you agree that we are not responsible for any direct or indirect damages, losses, or costs arising from your use of the AI.</p>
            <h2 class="text-xl font-semibold mb-2 mt-4">AI Accuracy and Mistakes</h2>
            <p>You acknowledge that AI models, including Peach GPT, can make mistakes. We recommend verifying important information and not relying solely on the AI for critical decisions.</p>
        </div>
    </div>
</div>

<script>
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    
    // Get all page elements
    const pages = document.querySelectorAll('.page');
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-item');

    const chatHistory = [
        { role: "system", content: "You are Peach GPT, a friendly, professional, and humanized AI assistant. Your answers should be helpful, kind, and slightly conversational. Avoid being overly formal or robotic. 
        if ask 'who created you?' or similar, respond:'i was created by muhammad aminu jauro' " }
    ];

    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        chatHistory.push({ role: "user", content: message });
        appendMessage(message, 'user-message');
        userInput.value = '';

        const loadingMessage = appendMessage('...', 'ai-message');

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatHistory })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || \`API error: \${response.status}\`);
            }

            const data = await response.json();
            const aiMessage = data.content.trim();

            loadingMessage.textContent = aiMessage;
            chatHistory.push({ role: "assistant", content: aiMessage });
            chatBox.scrollTop = chatBox.scrollHeight;

        } catch (error) {
            console.error('Error:', error);
            loadingMessage.textContent = "Oops! Something went wrong. Please try again.";
        }
    }

    function appendMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Function to show a specific page and hide others
    function showPage(pageId) {
        pages.forEach(page => {
            if ('#' + page.id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        sidebar.classList.remove('open');
    }

    // Add click listeners to all sidebar links for single-page navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Prevents the browser from navigating to a new page
            const pageId = link.getAttribute('href');
            showPage(pageId);
        });
    });

    // Sidebar toggle logic for mobile
    document.querySelectorAll('.menu-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    });

    // Logic to hide the sidebar when clicking anywhere on the screen (for mobile)
    document.addEventListener('click', (event) => {
        const isMobile = window.innerWidth < 768;
        const isSidebarOpen = sidebar.classList.contains('open');
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickInsideToggle = Array.from(document.querySelectorAll('.menu-toggle')).some(toggle => toggle.contains(event.target));

        if (isMobile && isSidebarOpen && !isClickInsideSidebar && !isClickInsideToggle) {
            sidebar.classList.remove('open');
        }
    });
</script>

</body>
</html>
`;

// Route to serve the frontend
app.get('/', (req, res) => {
    res.send(frontendContent);
});

// Route to handle chat requests
app.post('/chat', async (req, res) => {
    const { chatHistory } = req.body;
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: chatHistory,
        });

        const aiResponse = completion.choices[0].message.content;
        res.json({ content: aiResponse });

    } catch (error) {
        console.error("Error from OpenAI API:", error);
        res.status(500).json({ error: "Failed to get a response from the AI." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});




