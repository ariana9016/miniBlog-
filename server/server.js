const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser - must be before routes so JSON bodies are parsed
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static folders
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const auth = require('./routes/auth');
const posts = require('./routes/posts');
const users = require('./routes/users');
const uploads = require('./routes/uploads');
const follow = require('./routes/follow');
const bookmarks = require('./routes/bookmarks');
const admin = require('./routes/admin');
const events = require('./routes/events');
const friends = require('./routes/friendRoutes');
const messages = require('./routes/messageRoutes');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/posts', posts);
app.use('/api/users', users);
app.use('/api/uploads', uploads);
app.use('/api/follow', follow);
app.use('/api/bookmarks', bookmarks);
app.use('/api/admin', admin);
app.use('/api/events', events);
app.use('/api/friends', friends);
app.use('/api/messages', messages);

// Error handler
app.use(errorHandler);

// Socket.IO connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      // Send to receiver if online
      io.to(receiverSocketId).emit('receive_message', {
        senderId: socket.userId,
        message,
        timestamp: new Date()
      });
    }
    
    // Send confirmation back to sender
    socket.emit('message_sent', {
      receiverId,
      message,
      timestamp: new Date()
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        senderId: socket.userId
      });
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', {
        senderId: socket.userId
      });
    }
  });

  // Handle friend request notifications
  socket.on('friend_request_sent', (data) => {
    const { receiverId } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('friend_request_received', {
        senderId: socket.userId,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});
