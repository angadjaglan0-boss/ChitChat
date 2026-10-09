# 💬 ChitChat - The Ultimate iOS-Style Web Chat

ChitChat is a blazingly fast, full-stack real-time chat application built with a stunning **iOS Glassmorphism** aesthetic. It brings the premium feel of Apple's iMessage to the web, complete with WebRTC Voice Calls, Location Sharing, and animated Apple GIFs.

Built to win hackathons. 🏆

---

## ✨ Features

- **📱 iOS iMessage UI:** Beautifully crafted chat bubbles, `backdrop-blur` glass panels, and a buttery-smooth animated gradient background.
- **📞 WebRTC Voice Calls:** Real-time peer-to-peer audio calling with a custom, glowing incoming call modal and live audio waveform visualizations.
- **👥 Group Chats:** Create groups with multiple friends. The app seamlessly handles WebSocket broadcasting and renders sender names natively in the chat.
- **📍 Location Sharing:** Instantly and securely share your exact GPS coordinates via a generated Google Maps link directly in the chat.
- **🍎 Apple GIFs:** A custom-built, lightning-fast GIF picker pre-loaded with iconic Apple and Memoji GIFs.
- **🤖 ChitChat AI:** An integrated AI bot that automatically responds to your messages when you need someone to talk to.
- **🔐 Secure & Fast:** Configured with advanced Vite proxying and Cloudflare Tunnels for secure local network testing and deployment.

---

## 🛠️ Tech Stack

**Frontend:**
- **React 18** (Vite)
- **Tailwind CSS** (Glassmorphism + Complex UI Layouts)
- **Framer Motion** (60FPS Spring Animations & Shared Layout Transitions)
- **Zustand** (Global State Management)

**Backend:**
- **Node.js & Express**
- **Socket.IO** (Real-time Messaging & WebRTC Signaling)
- **SQLite3** (Persistent Relational Database)
- **Multer** (File & Image Uploads)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/chitchat.git
   cd chitchat/chat-app
   \`\`\`

2. **Start the Backend:**
   Open your terminal and run:
   \`\`\`bash
   cd server
   npm install
   node index.js
   \`\`\`
   *The backend server will start on `http://localhost:4000`.*

3. **Start the Frontend:**
   Open a **new** terminal window and run:
   \`\`\`bash
   cd client
   npm install
   npm run dev -- --host
   \`\`\`
   *The stunning frontend will start on `http://localhost:5173`.*

---

## 📸 Screenshots

*(Hackathon Tip: Take screenshots of your beautiful Login screen, Group Chat modal, and Voice Call UI and place them here!)*

---

## 🏗️ Deployment
To deploy this full-stack application online using **Vercel** and **Render**, follow the included deployment guide.

---

*Built with ❤️ during the Hackathon.*
