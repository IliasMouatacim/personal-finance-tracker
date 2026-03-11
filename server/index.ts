import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import connectDB from './src/db';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'financetracker_jwt_secret_dev_key_2026';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: (origin, callback) => {
    const allowed = CORS_ORIGIN.split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ── Auth middleware ───────────────────────────────────────────────────────────

interface AuthRequest extends Request {
  userId?: string;
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

// ── Start server after DB connects ────────────────────────────────────────────

connectDB().then(db => {
  const users = db.collection('users');
  const transactions = db.collection('transactions');

  // Create indexes
  users.createIndex({ email: 1 }, { unique: true });
  transactions.createIndex({ userId: 1, date: -1 });

  // ── Health Check ─────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // ── Auth Routes ──────────────────────────────────────────────────────────────

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const result = await users.insertOne({ email, password: hashed, createdAt: new Date() });
    const token = jwt.sign({ userId: result.insertedId.toString() }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, email });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = await users.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password as string);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: user.email });
  });

  // ── Transaction Routes ───────────────────────────────────────────────────────

  app.get('/api/transactions', authenticate, async (req: AuthRequest, res: Response) => {
    const list = await transactions
      .find({ userId: req.userId })
      .sort({ date: -1 })
      .toArray();
    res.json(list);
  });

  app.post('/api/transactions', authenticate, async (req: AuthRequest, res: Response) => {
    const { description, amount, type, category, date } = req.body;
    if (!description || !amount || !type) {
      res.status(400).json({ error: 'Description, amount, and type are required.' });
      return;
    }
    if (!['income', 'expense'].includes(type)) {
      res.status(400).json({ error: 'Type must be "income" or "expense".' });
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number.' });
      return;
    }
    const doc = {
      userId: req.userId,
      description: String(description).trim(),
      amount: parsed,
      type,
      category: category || 'Other',
      date: date ? new Date(date) : new Date(),
      createdAt: new Date(),
    };
    const result = await transactions.insertOne(doc);
    const created = await transactions.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  });

  app.delete('/api/transactions/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid transaction ID.' });
      return;
    }
    const result = await transactions.deleteOne({ _id: new ObjectId(id), userId: req.userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Transaction not found.' });
      return;
    }
    res.json({ message: 'Transaction deleted.' });
  });

  // ── CSV Export ───────────────────────────────────────────────────────────────

  app.get('/api/transactions/export', authenticate, async (req: AuthRequest, res: Response) => {
    const list = await transactions
      .find({ userId: req.userId })
      .sort({ date: -1 })
      .toArray();

    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = 'Date,Description,Category,Type,Amount\n';
    const rows = list.map(t => {
      const d = new Date(t.date as Date).toLocaleDateString('en-US');
      return `${d},${escape(t.description)},${escape(t.category)},${t.type},${(t.amount as number).toFixed(2)}`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(header + rows.join('\n'));
  });

  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});
