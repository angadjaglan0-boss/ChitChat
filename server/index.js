import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { get, run, query } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const JWT_SECRET = 'hackathon-secret-key-123'; 

// Multer Config for attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// Initialize AI Bot in DB
async function initAIBot() {
  try {
    const aiBot = await get('SELECT * FROM users WHERE username = ?', ['ChitChat AI']);
    if (!aiBot) {
      const hash = await bcrypt.hash('ai-bot-secure-pwd', 10);
      const avatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=ChitChatAI';
      await run("INSERT INTO users (username, password, avatar, status) VALUES (?, ?, ?, 'online')", 
        ['ChitChat AI', hash, avatar]);
      console.log('AI Bot initialized in database.');
    } else {
      await run("UPDATE users SET status = 'online' WHERE username = 'ChitChat AI'");
    }
  } catch (err) {
    console.error('Failed to init AI bot', err);
  }
}
setTimeout(initAIBot, 1000); // Wait a second for DB to init

// -- File Upload Route --
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// -- Authentication Routes --
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  try {
    const existing = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) return res.status(400).json({ error: 'Username already taken' });
    
    const hash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/micah/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    
    const result = await run('INSERT INTO users (username, password, avatar) VALUES (?, ?, ?)', [username, hash, avatar]);
    
    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET);
    res.json({ token, user: { id: result.lastID, username, avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await query('SELECT id, username, avatar, status FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:userId/:contactId', async (req, res) => {
  const { userId, contactId } = req.params;
  try {
    const messages = await query(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [userId, contactId, contactId, userId]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mock AI Logic
const generateAIResponse = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi')) return "Hello there! I'm ChitChat AI. How can I assist you today?";
  if (lower.includes('hackathon')) return "Hackathons are awesome! I see you're building a great chat app.";
  if (lower.includes('help')) return "I can chat with you, react to your emojis, and even see attachments you send me!";
  if (lower.includes('joke')) return "Why do programmers prefer dark mode? Because light attracts bugs!";
  const responses = [
    "That's really interesting! Tell me more.",
    "I completely agree with you on that.",
    "Fascinating. How did you come up with that?",
    "As an AI, I don't have personal opinions, but that sounds cool!",
    "Wow, mind blown! 🤯",
    "Hmm, let me think about that... Okay, you're right!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// -- WebSocket / Real-time Logic --
const userSockets = new Map(); // map userId to socketId

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.userId = decoded.id;
    next();
  });
});

io.on('connection', async (socket) => {
  const userId = socket.userId;
  userSockets.set(userId, socket.id);
  
  await run("UPDATE users SET status = 'online' WHERE id = ?", [userId]);
  io.emit('userStatusChange', { userId, status: 'online' });

  socket.on('sendMessage', async (data) => {
    const { receiverId, groupId, content, type } = data;
    try {
      if (groupId) {
        const result = await run(
          'INSERT INTO messages (sender_id, group_id, content, type) VALUES (?, ?, ?, ?)',
          [userId, groupId, content, type || 'text']
        );
        const msg = {
          id: result.lastID, sender_id: userId, group_id: groupId, content, type: type || 'text', created_at: new Date().toISOString(), is_read: 0
        };
        
        const members = await query('SELECT user_id FROM group_members WHERE group_id = ?', [groupId]);
        members.forEach(member => {
          const mSocket = userSockets.get(member.user_id);
          if (mSocket) io.to(mSocket).emit('newMessage', msg);
        });
      } else {
        const result = await run(
          'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)',
          [userId, receiverId, content, type || 'text']
        );
        
        const msg = {
          id: result.lastID, sender_id: userId, receiver_id: receiverId, content, type: type || 'text', created_at: new Date().toISOString(), is_read: 0
        };

        socket.emit('newMessage', msg);
        const receiverSocket = userSockets.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('newMessage', msg);
        }

        const receiverUser = await get('SELECT username FROM users WHERE id = ?', [receiverId]);
        if (receiverUser && receiverUser.username === 'ChitChat AI') {
          setTimeout(async () => {
            const aiResponse = generateAIResponse(content);
            const aiResult = await run(
              'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)',
              [receiverId, userId, aiResponse, 'text']
            );
            const aiMsg = {
              id: aiResult.lastID, sender_id: receiverId, receiver_id: userId, content: aiResponse, type: 'text', created_at: new Date().toISOString(), is_read: 0
            };
            socket.emit('newMessage', aiMsg);
          }, 1500 + Math.random() * 2000);
        }
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', async () => {
    userSockets.delete(userId);
    await run("UPDATE users SET status = 'offline' WHERE id = ?", [userId]);
    io.emit('userStatusChange', { userId, status: 'offline' });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// -- Group Routes --
app.post('/api/groups', async (req, res) => {
  const { name, members, createdBy } = req.body;
  try {
    const result = await run('INSERT INTO groups (name, created_by) VALUES (?, ?)', [name, createdBy]);
    const groupId = result.lastID;
    
    for (const userId of members) {
      await run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);
    }
    
    res.json({ id: groupId, name, isGroup: true, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups/:userId', async (req, res) => {
  try {
    const groups = await query(`
      SELECT g.id, g.name, 'https://api.dicebear.com/7.x/initials/svg?seed=' || g.name as avatar, 1 as isGroup 
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `, [req.params.userId]);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/group-messages/:groupId', async (req, res) => {
  try {
    const messages = await query(`
      SELECT m.*, u.username as sender_name 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ?
      ORDER BY m.created_at ASC
    `, [req.params.groupId]);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WebRTC Signaling
io.on('connection', (socket) => {
  socket.on('webrtc_signal', (data) => {
    const receiverSocket = userSockets.get(data.to);
    if (receiverSocket) {
      io.to(receiverSocket).emit('webrtc_signal', { ...data, from: socket.userId });
    }
  });
});

// Serve Frontend in Production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});
