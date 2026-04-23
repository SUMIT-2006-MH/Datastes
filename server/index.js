require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Dataset = require('./models/Dataset');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforprodatasets'; // Use env var in production

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve frontend client static files
app.use(express.static(path.join(__dirname, '../client')));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/datasets-pro', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
  createHardcodedAdmin();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Create hardcoded admin
async function createHardcodedAdmin() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Hardcoded admin created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Middleware to verify JWT and attach user
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// Middleware to verify Admin role
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Requires admin privileges' });
  }
  next();
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'admin') return res.status(400).json({ message: 'Cannot register as admin' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role: 'user' });
    await newUser.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ 
      token, 
      user: { id: user._id, username: user.username, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Dataset Routes ---
app.get('/api/datasets', async (req, res) => {
  try {
    const datasets = await Dataset.find().populate('creator', 'username');
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/datasets', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'A file must be uploaded' });
    }

    // Format size nicely
    const bytes = req.file.size;
    const megabytes = bytes / (1024 * 1024);
    const size = megabytes > 1 ? `${megabytes.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;

    const newDataset = new Dataset({
      title,
      description,
      size,
      fileName: req.file.originalname,
      filePath: req.file.path,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      creator: req.userId
    });
    await newDataset.save();
    const populated = await newDataset.populate('creator', 'username');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/datasets/:id', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const datasetId = req.params.id;
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

    if (dataset.creator.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, tags } = req.body;
    dataset.title = title || dataset.title;
    dataset.description = description || dataset.description;
    
    if (tags) dataset.tags = tags.split(',').map(tag => tag.trim());

    if (req.file) {
      // Remove old file if it exists
      if (dataset.filePath && fs.existsSync(dataset.filePath)) {
        fs.unlinkSync(dataset.filePath);
      }
      const bytes = req.file.size;
      const megabytes = bytes / (1024 * 1024);
      dataset.size = megabytes > 1 ? `${megabytes.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
      dataset.fileName = req.file.originalname;
      dataset.filePath = req.file.path;
    }

    await dataset.save();
    const populated = await dataset.populate('creator', 'username');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/datasets/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const datasetId = req.params.id;
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) return res.status(404).json({ message: 'Dataset not found' });

    // Remove file from disk
    if (dataset.filePath && fs.existsSync(dataset.filePath)) {
      fs.unlinkSync(dataset.filePath);
    }

    await Dataset.findByIdAndDelete(datasetId);
    res.status(200).json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Admin Routes ---
app.get('/api/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });

    // Delete user and their datasets
    const userDatasets = await Dataset.find({ creator: userId });
    for (const d of userDatasets) {
      if (d.filePath && fs.existsSync(d.filePath)) {
        fs.unlinkSync(d.filePath);
      }
    }
    await Dataset.deleteMany({ creator: userId });
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: 'User and their datasets deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Catch-all route to serve frontend for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
