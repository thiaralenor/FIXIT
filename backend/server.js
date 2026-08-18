const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploads statically
const uploadsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve production frontend dist if available
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// File storage path for persistent state
const DATA_FILE = path.join(__dirname, 'data', 'problems.json');

// Default initial seeded problems matching UI design
const initialProblems = [
  {
    id: 'prob-1',
    title: 'Large potholes on Molyko road',
    description: 'Deep potholes making it hard for vehicles to pass. Causes traffic congestion during peak hours.',
    status: 'PENDING',
    category: 'Roads & Potholes',
    location: 'Molyko, Buea',
    locationType: 'manual',
    landmarkDetails: 'Near Molyko market, beside the blue building',
    latitude: 4.156,
    longitude: 9.241,
    time: '2 hours ago',
    timestamp: Date.now() - 2 * 3600 * 1000,
    media: [
      { type: 'image', url: '/uploads/potholes_molyko.jpg' }
    ],
    reporter: { name: 'Nora Smith', role: 'Citizen', avatar: 'NS' },
    bookmarked: false,
    upvotes: 28,
    views: 142,
    comments: [
      { id: 'c1', name: 'John Doe', text: 'This has been causing bad traffic every evening!', time: '1 hour ago' }
    ],
    timeline: [
      { date: '2 hours ago', status: 'PENDING', text: 'Report submitted by Nora Smith' }
    ],
    assignedOrg: null,
    timeframe: null
  },
  {
    id: 'prob-2',
    title: 'Water leak near Mile 17 Junction',
    description: 'Clean water has been leaking for days from a main broken pipe on the sidewalk.',
    status: 'ONGOING',
    category: 'Water & Sanitation',
    location: 'Mile 17, Buea',
    locationType: 'current',
    landmarkDetails: 'Near the main junction taxi park',
    latitude: 4.162,
    longitude: 9.278,
    time: '1 day ago',
    timestamp: Date.now() - 24 * 3600 * 1000,
    media: [
      { type: 'image', url: '/uploads/water_leak_mile17.jpg' }
    ],
    reporter: { name: 'Samuel T.', role: 'Citizen', avatar: 'ST' },
    bookmarked: true,
    upvotes: 45,
    views: 215,
    comments: [
      { id: 'c2', name: 'Buea Water Authority', text: 'Work team dispatched. Expected fix in 2 weeks.', time: '12 hours ago' }
    ],
    timeline: [
      { date: '1 day ago', status: 'PENDING', text: 'Report submitted by Samuel T.' },
      { date: '12 hours ago', status: 'ONGOING', text: 'Project added by Buea Municipal Council (Timeframe: 2 weeks)' }
    ],
    assignedOrg: 'Buea Municipal Council',
    timeframe: '2 weeks (Target completion: Sep 02, 2026)'
  },
  {
    id: 'prob-3',
    title: 'Garbage not collected',
    description: 'Garbage has not been collected in this area for over a week. Smells bad and poses health risk.',
    status: 'PENDING',
    category: 'Waste Management',
    location: 'Bonduma, Buea',
    locationType: 'manual',
    landmarkDetails: 'Opposite Bonduma main gate',
    latitude: 4.148,
    longitude: 9.235,
    time: '1 day ago',
    timestamp: Date.now() - 26 * 3600 * 1000,
    media: [
      { type: 'image', url: '/uploads/garbage_bonduma.jpg' }
    ],
    reporter: { name: 'Nora Smith', role: 'Citizen', avatar: 'NS' },
    bookmarked: false,
    upvotes: 19,
    views: 89,
    comments: [],
    timeline: [
      { date: '1 day ago', status: 'PENDING', text: 'Report submitted by Nora Smith' }
    ],
    assignedOrg: null,
    timeframe: null
  },
  {
    id: 'prob-4',
    title: 'Broken street light',
    description: 'Street light not working for more than a week, creating dark hazardous spots at night.',
    status: 'COMPLETED',
    category: 'Street Lighting',
    location: 'Muea, Buea',
    locationType: 'manual',
    landmarkDetails: 'Along Muea market highway road',
    latitude: 4.168,
    longitude: 9.301,
    time: '3 days ago',
    timestamp: Date.now() - 72 * 3600 * 1000,
    media: [
      { type: 'image', url: '/uploads/street_light_muea.jpg' }
    ],
    reporter: { name: 'Alice M.', role: 'Citizen', avatar: 'AM' },
    bookmarked: true,
    upvotes: 62,
    views: 310,
    comments: [
      { id: 'c3', name: 'Public Works Dept', text: 'New LED luminaire installed and tested successfully.', time: '1 day ago' }
    ],
    timeline: [
      { date: '3 days ago', status: 'PENDING', text: 'Report submitted by Alice M.' },
      { date: '2 days ago', status: 'ONGOING', text: 'Project added by Public Works Dept' },
      { date: '1 day ago', status: 'COMPLETED', text: 'Execution finished & marked completed.' }
    ],
    assignedOrg: 'Public Works Dept',
    timeframe: 'Completed on Aug 17, 2026'
  }
];

// Base stats matching screenshot background metrics plus additions
let statsOffset = {
  total: 124,   // Base offset so 124 + 4 items = 128 total
  pending: 30,  // 30 + 2 pending = 32
  ongoing: 17,  // 17 + 1 ongoing = 18
  completed: 77 // 77 + 1 completed = 78
};

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadProblems() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading JSON store:', e);
    }
  }
  saveProblems(initialProblems);
  return initialProblems;
}

function saveProblems(problems) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(problems, null, 2));
  } catch (e) {
    console.error('Error writing JSON store:', e);
  }
}

let problemsList = loadProblems();

// Calculate total metrics
function getStats() {
  const pendingCount = problemsList.filter(p => p.status === 'PENDING').length;
  const ongoingCount = problemsList.filter(p => p.status === 'ONGOING').length;
  const completedCount = problemsList.filter(p => p.status === 'COMPLETED').length;

  return {
    total: statsOffset.total + problemsList.length,
    pending: statsOffset.pending + pendingCount,
    ongoing: statsOffset.ongoing + ongoingCount,
    completed: statsOffset.completed + completedCount
  };
}

// API Routes

// Get stats
app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

// Get problems list with search & filters
app.get('/api/problems', (req, res) => {
  let { search, category, status, sort, user, myProjectsOnly, myReportsOnly } = req.query;
  let results = [...problemsList];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.location.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'All Categories') {
    results = results.filter(p => p.category === category);
  }

  if (status && status !== 'ALL') {
    results = results.filter(p => p.status === status);
  }

  if (myProjectsOnly === 'true' && user) {
    results = results.filter(p => p.assignedOrg === user || p.timeline.some(t => t.text.includes(user)));
  }

  if (myReportsOnly === 'true' && user) {
    results = results.filter(p => p.reporter.name === user);
  }

  // Sorting
  if (sort === 'oldest') {
    results.sort((a, b) => a.timestamp - b.timestamp);
  } else if (sort === 'most_upvoted') {
    results.sort((a, b) => b.upvotes - a.upvotes);
  } else {
    // Latest default
    results.sort((a, b) => b.timestamp - a.timestamp);
  }

  res.json({
    stats: getStats(),
    problems: results
  });
});

// Get single problem details
app.get('/api/problems/:id', (req, res) => {
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  problem.views = (problem.views || 0) + 1;
  saveProblems(problemsList);
  res.json(problem);
});

// Create new problem report
app.post('/api/problems', (req, res) => {
  const { title, description, category, location, locationType, landmarkDetails, latitude, longitude, media, reporter } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  const newProblem = {
    id: `prob-${Date.now()}`,
    title,
    description: description || '',
    category,
    location: location || 'Buea, Cameroon',
    locationType: locationType || 'manual',
    landmarkDetails: landmarkDetails || '',
    latitude: latitude || 4.156,
    longitude: longitude || 9.241,
    time: 'Just now',
    timestamp: Date.now(),
    media: media || [],
    reporter: reporter || { name: 'Nora Smith', role: 'Citizen', avatar: 'NS' },
    status: 'PENDING',
    bookmarked: false,
    upvotes: 1,
    views: 1,
    comments: [],
    timeline: [
      { date: 'Just now', status: 'PENDING', text: `Report submitted by ${reporter ? reporter.name : 'Nora Smith'}` }
    ],
    assignedOrg: null,
    timeframe: null
  };

  problemsList.unshift(newProblem);
  saveProblems(problemsList);
  res.status(201).json(newProblem);
});

// Toggle bookmark
app.post('/api/problems/:id/bookmark', (req, res) => {
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  problem.bookmarked = !problem.bookmarked;
  saveProblems(problemsList);
  res.json({ id: problem.id, bookmarked: problem.bookmarked });
});

// Upvote
app.post('/api/problems/:id/upvote', (req, res) => {
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  problem.upvotes = (problem.upvotes || 0) + 1;
  saveProblems(problemsList);
  res.json({ id: problem.id, upvotes: problem.upvotes });
});

// Organization: Add to Project List & Set Timeframe -> ONGOING
app.post('/api/problems/:id/add-to-project', (req, res) => {
  const { orgName, timeframe, notes } = req.body;
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  problem.status = 'ONGOING';
  problem.assignedOrg = orgName || 'Buea Municipal Council';
  problem.timeframe = timeframe || '2 weeks';
  problem.timeline.unshift({
    date: 'Just now',
    status: 'ONGOING',
    text: `Added to project list by ${orgName || 'Organization'}. Timeframe: ${timeframe || '2 weeks'}. ${notes ? 'Note: ' + notes : ''}`
  });

  saveProblems(problemsList);
  res.json(problem);
});

// Organization: Mark Completed
app.post('/api/problems/:id/complete', (req, res) => {
  const { orgName, completionNotes, proofMedia } = req.body;
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  problem.status = 'COMPLETED';
  if (proofMedia && proofMedia.length > 0) {
    problem.media.push(...proofMedia);
  }
  problem.timeline.unshift({
    date: 'Just now',
    status: 'COMPLETED',
    text: `Work execution completed by ${orgName || problem.assignedOrg || 'Organization'}. ${completionNotes ? 'Notes: ' + completionNotes : ''}`
  });

  saveProblems(problemsList);
  res.json(problem);
});

// Organization: Remove from Project List
app.delete('/api/problems/:id/project', (req, res) => {
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  problem.status = 'PENDING';
  problem.assignedOrg = null;
  problem.timeframe = null;
  problem.timeline.unshift({
    date: 'Just now',
    status: 'PENDING',
    text: 'Removed from organization project list. Reverted to Pending status.'
  });

  saveProblems(problemsList);
  res.json(problem);
});

// Add comment
app.post('/api/problems/:id/comments', (req, res) => {
  const { name, text } = req.body;
  const problem = problemsList.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const comment = {
    id: `c-${Date.now()}`,
    name: name || 'Anonymous',
    text: text || '',
    time: 'Just now'
  };

  problem.comments.push(comment);
  saveProblems(problemsList);
  res.status(201).json(comment);
});

// SPA catch-all fallback for static dist frontend
if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FIXIT Express Server running on port ${PORT}`);
});

