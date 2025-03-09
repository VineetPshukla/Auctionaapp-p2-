import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect('mongodb://127.0.0.1:27017/admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Auction Schema & Model
const auctionSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String, required: true },
  startingBid: { type: Number, required: true },
  openingBid: { type: Number, required: true },
  closingBid: { type: Number, required: true },
  closingTime: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const Auction = mongoose.model('Auction', auctionSchema);

// Signup Route
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Signin Route
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Received Signin Request:', { username, password });

    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Signin Successful:', { userId: user._id });

    res.json({ token, username });
  } catch (error) {
    console.error('Signin Server Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Protected Route Example
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

// Auction Post Route (Fixed)
app.post('/auction', authMiddleware, async (req, res) => {
  try {
    const { itemName, description, startingBid, openingBid, closingBid, closingTime } = req.body;

    // Validate input
    if (!itemName || !description || !startingBid || !openingBid || !closingBid || !closingTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newAuction = new Auction({
      itemName,
      description,
      startingBid,
      openingBid,
      closingBid,
      closingTime,
      userId: req.user.userId, // Fix: Use `req.user.userId` instead of `req.user.id`
    });

    await newAuction.save();
    res.status(201).json({ message: 'Auction created successfully', auction: newAuction });
  } catch (error) {
    console.error('Error posting auction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.json(auctions);
  } catch (error) {
    console.error('❌ Error fetching auctions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
