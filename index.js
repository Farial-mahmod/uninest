const express = require('express');
const path = require('path');
const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.URI;

const conn = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Init gfs and GridFSBucket
let gfs;
let gridFSBucket;

conn.once('open', () => {
  // Initialize GridFSBucket
  gridFSBucket = new GridFSBucket(conn.db, {
    bucketName: 'media'
  });
  
  gfs = conn.db.collection('media.files');
  console.log('MongoDB Connected & GridFS Initialized');
});

//
app.get('/api/shareholder/aurora', async (req, res) => {
  try {
    const db = conn.useDb('aurora');
    const collection = db.collection('shareholder');

    const doc = await collection.findOne(
      { "shareholder.project": "aurora" },
      { projection: { shareholder: 1, _id: 0 } }
    );

    if (!doc || !doc.shareholder || doc.shareholder.length === 0) {
      return res.status(404).json({ message: 'No shareholders found' });
    }

    res.json(doc.shareholder);
  } catch (error) {
    console.error('Error fetching shareholders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//
app.post('/api/shareholder/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('shareholder');

    const {
      id,
      project: bodyProject,
      name,
      flat_number,
      email,
      mobile,
      password,
      total_installments,
      installment_amount
    } = req.body;

    if (!id || !name || !flat_number || !mobile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // -------- AUTO GENERATE PAYMENTS ARRAY --------
    const payments = Array.from(
      { length: Number(total_installments) },
      (_, i) => ({
        installment_number: i + 1,
        amount_paid: 0,
        payment_date: "",
        status: "due"
      })
    );

    const newShareholder = {
      id,
      project: bodyProject || project,
      name,
      flat_number,
      email,
      mobile,
      password,
      total_installments: Number(total_installments),
      installment_amount: Number(installment_amount),
      payments
    };

    const result = await collection.updateOne(
      { "shareholder.project": project },
      { $push: { shareholder: newShareholder } }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: 'Project document not found' });
    }

    res.status(201).json({
      success: true,
      message: 'Shareholder added',
      data: newShareholder
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//
app.post('/api/payment/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('shareholder');

    const {
      shareholderId,
      installment_number,
      amount_paid,
      payment_date
    } = req.body;

    const result = await collection.updateOne(
      {}, // 🔑 match the project document only
      {
        $set: {
          "shareholder.$[sh].payments.$[p].amount_paid": Number(amount_paid),
          "shareholder.$[sh].payments.$[p].payment_date": payment_date,
          "shareholder.$[sh].payments.$[p].status": "Paid"
        }
      },
      {
        arrayFilters: [
          { "sh.id": shareholderId },
          { "p.installment_number": Number(installment_number) }
        ]
      }
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ message: 'Payment not updated' });
    }

    res.json({ success: true, message: 'Payment recorded' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Create storage engine using the factory function pattern
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}_${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'media',
        metadata: {
          uploadDate: new Date(),
          contentType: file.mimetype,
          originalName: file.originalname,
          uploader: req.body.uploader || 'anonymous',
          project: req.body.project || 'default',
          description: req.body.description || '',
          mediaType: file.mimetype.startsWith('image/') ? 'image' : 
                    file.mimetype.startsWith('video/') ? 'video' : 'other'
        }
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Upload endpoint
app.post('/api/upload', (req, res, next) => {
  console.log('🔥 Upload hit');
  next();
},
  upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      id: req.file.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.contentType,
      uploadDate: req.file.uploadDate || new Date(),
      size: req.file.size,
      metadata: req.file.metadata || {},
      url: `/api/files/${req.file.filename}`
    };

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileData
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// Get all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await gfs.find().toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'No files found' });
    }

    res.json({ 
      success: true, 
      count: files.length, 
      files: files.map(file => ({
        ...file,
        url: `/api/files/${file.filename}`
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single file by filename
app.get('/api/files/:filename', async (req, res) => {
  try {
    const file = await gfs.findOne({ filename: req.params.filename });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is an image or video
    if (file.contentType.startsWith('image/') || file.contentType.startsWith('video/')) {
      res.set('Content-Type', file.contentType);
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);
    } else {
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    }

    const downloadStream = gridFSBucket.openDownloadStreamByName(file.filename);
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      res.status(404).json({ error: 'File not found' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    await gridFSBucket.delete(fileId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files by project
app.get('/api/files/project/:project', async (req, res) => {
  try {
    const files = await gfs.find({ 
      'metadata.project': req.params.project 
    }).toArray();
    
    res.json({ 
      success: true, 
      count: files.length, 
      files: files.map(file => ({
        ...file,
        url: `/api/files/${file.filename}`
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file metadata by ID
app.get('/api/files/metadata/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const file = await gfs.findOne({ _id: fileId });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//
// GET costs for a project
app.get('/api/costs/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase(); // Fix: Extract project first
    const db = conn.useDb(project);
    const collection = db.collection('cost');

    // Find the document for this project
    const doc = await collection.findOne(
      { "project": project },
      { projection: { cost: 1, _id: 0 } }
    );

    if (!doc || !doc.cost || doc.cost.length === 0) {
      return res.status(404).json({ message: 'No costs found for this project' });
    }

    res.json(doc);
  } catch (error) {
    console.error('Error fetching costs:', error);
    res.status(500).json({ error: 'Failed to fetch costs' });
  }
});

// POST new cost/voucher
app.post('/api/costs/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('cost');
    
    const {
      material,
      date,
      description,
      brand,
      amount,
      voucher_link
    } = req.body;

    if (!material || !date || !description || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newCost = {
      material,
      date,
      description,
      brand: brand || '',
      amount: Number(amount),
      voucher_link: voucher_link || ''
    };

    // Check if project document exists
    const projectExists = await collection.findOne({ project });
    
    if (!projectExists) {
      // Create new project document with first cost
      const result = await collection.insertOne({
        project,
        cost: [newCost],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Cost added to new project',
        insertedId: result.insertedId
      });
    } else {
      // Add to existing project's cost array
      const result = await collection.updateOne(
        { project },
        {
          $push: { cost: newCost },
          $set: { updated_at: new Date() }
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Cost added to existing project',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding cost:', error);
    res.status(500).json({ error: 'Failed to add cost' });
  }
});

// milestone
// GET milestones for a project (matching your JSON structure)
app.get('/api/milestones/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('milestone'); // Collection name is 'milestone'

    // Find milestones for this project
    const doc = await collection.findOne(
      { "project": project },
      { projection: { milestone: 1, _id: 0 } } // Get milestone array
    );

    if (!doc || !doc.milestone || doc.milestone.length === 0) {
      return res.status(404).json({ message: 'No milestones found' });
    }

    res.json(doc);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// POST new milestone (matching your JSON structure)
app.post('/api/milestones/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('milestone'); // Collection name is 'milestone'
    
    const {
      description,
      planned_date,
      completion_date,
      status,
      note
    } = req.body;

    // Validate required fields
    if (!description || !planned_date) {
      return res.status(400).json({ error: 'Description and planned date are required' });
    }

    const newMilestone = {
      description: description.trim(),
      planned_date,
      completion_date: completion_date || '',
      status: status || 'Planned',
      note: note || '',
      created_at: new Date()
    };

    // Check if project document exists
    const projectExists = await collection.findOne({ project });
    
    if (!projectExists) {
      // Create new project document with first milestone
      const result = await collection.insertOne({
        project,
        milestone: [newMilestone],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Milestone added to new project',
        insertedId: result.insertedId
      });
    } else {
      // Add to existing project's milestone array
      const result = await collection.updateOne(
        { project },
        {
          $push: { milestone: newMilestone },
          $set: { updated_at: new Date() }
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Milestone added to existing project',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
});

//
// PUT (update) a specific milestone
app.put('/api/milestones/:project/:index', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const index = parseInt(req.params.index);
    const db = conn.useDb(project);
    const collection = db.collection('milestone');
    
    const {
      description,
      planned_date,
      completion_date,
      status,
      note
    } = req.body;

    // Validate required fields
    if (!description || !planned_date) {
      return res.status(400).json({ error: 'Description and planned date are required' });
    }

    // Find the project document
    const projectDoc = await collection.findOne({ project });
    
    if (!projectDoc || !projectDoc.milestone || index >= projectDoc.milestone.length) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Prepare updated milestone
    const updatedMilestone = {
      description: description.trim(),
      planned_date,
      completion_date: completion_date || '',
      status: status || 'Planned',
      note: note || '',
      updated_at: new Date()
    };

    // Update the specific milestone in the array
    const updatePath = `milestone.${index}`;
    const result = await collection.updateOne(
      { project },
      {
        $set: {
          [updatePath]: updatedMilestone,
          updated_at: new Date()
        }
      }
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ error: 'Failed to update milestone' });
    }

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});
// Mock data for the financial transparency module
const financialData = {
  title: "Transparent Financial Breakdown",
  subtitle: "Clear, auditable records for your share",
  outstandingBalance: "8,50,000",
  nextDueDate: {
    date: "10-01-2026",
    installment: "6th Construction Installment"
  },
  paymentSchedule: {
    title: "Payment Schedule",
    subtitle: "Full agreed-upon payment timeline",
    items: [
      {
        name: "Land Share Cost",
        date: "2023-01-15",
        amount: "৳5,00,000",
        status: "pending"
      },
      {
        name: "1st Construction Installment",
        date: "2023-03-01",
        amount: "৳5,00,000",
        status: "pending"
      },
      {
        name: "2nd Construction Installment",
        date: "2023-06-01",
        amount: "৳3,00,000",
        status: "pending"
      },
      {
        name: "3rd Construction Installment",
        date: "2023-09-01",
        amount: "৳4,00,000",
        status: "pending"
      },
      {
        name: "4th Construction Installment",
        date: "2024-01-01",
        amount: "৳4,00,000",
        status: "pending"
      }
    ]
  },
  rdcLog: {
    title: "Completed Payments",
    subtitle: "All payments made by you",
    items: [
      {
        name: "5th Construction Installment",
        date: "2024-05-28",
        scheduledAmount: "৳4,00,000",
        paidAmount: "৳4,00,000",
        status: "completed"
      },
      {
        name: "4th Construction Installment",
        date: "2024-01-05",
        scheduledAmount: "৳4,00,000",
        paidAmount: "৳4,00,000",
        status: "completed"
      },
      {
        name: "3rd Construction Installment",
        date: "2023-09-02",
        scheduledAmount: "৳4,00,000",
        paidAmount: "৳4,00,000",
        status: "completed"
      },
      {
        name: "2nd Construction Installment",
        date: "2023-06-01",
        scheduledAmount: "৳3,00,000",
        paidAmount: "৳3,00,000",
        status: "completed"
      }
    ]
  },
  // NEW: Project Cost Breakdown Data
  projectCostBreakdown: {
    title: "Project Cost Breakdown",
    subtitle: "Transparent view of construction expenditure",
    activeTab: "cost-overview",
    tabs: [
      { id: "cost-overview", name: "Cost Overview", active: true },
      { id: "voucher-verification", name: "Voucher Verification", active: false }
    ],
    costOverview: {
      totalProjectedCost: "৳1,50,00,000",
      actualExpenditure: "৳92,50,000",
      categories: [
        {
          name: "Steel/Rebar",
          spent: "৳28,50,000",
          budget: "৳30,00,000",
          percentage: "95.0",
          color: "#4299e1"
        },
        {
          name: "Cement/Aggregate",
          spent: "৳21,00,000",
          budget: "৳25,00,000",
          percentage: "84.0",
          color: "#48bb78"
        },
        {
          name: "Labor & Manpower",
          spent: "৳25,00,000",
          budget: "৳40,00,000",
          percentage: "62.5",
          color: "#ed8936"
        },
        {
          name: "Finishing Materials",
          spent: "৳12,00,000",
          budget: "৳35,00,000",
          percentage: "34.3",
          color: "#9f7aea"
        }
      ]
    },
    vouchers: {
      title: "Voucher Verification",
      subtitle: "View scanned copies of vendor invoices for major purchases",
      items: [
        {
          title: "Steel Rebar - 5th Floor Slab",
          vendor: "Jindal Steel Suppliers",
          voucherNo: "VCH-2024-089",
          date: "2024-05-15",
          amount: "৳4,25,000",
          invoiceUrl: "https://bulletin.miamioh.edu/engineering-computing/quantum-computing-bsqc/quantum-computing-bsqc.pdf"
        },
        {
          title: "Cement - 50 bags Premium Grade",
          vendor: "Ultratech Cement Dealers",
          voucherNo: "VCH-2024-078",
          date: "2024-04-28",
          amount: "৳1,85,000",
          invoiceUrl: "https://bulletin.miamioh.edu/engineering-computing/quantum-computing-bsqc/quantum-computing-bsqc.pdf"
        },
        {
          title: "Labor Payment - April 2024",
          vendor: "Construction Workforce",
          voucherNo: "VCH-2024-065",
          date: "2024-04-10",
          amount: "৳3,20,000",
          invoiceUrl: "https://bulletin.miamioh.edu/engineering-computing/quantum-computing-bsqc/quantum-computing-bsqc.pdf"
        }
      ]
    }
  }
};

const constructionProgress = {
  title: "Construction Progress",
  subtitle: "Visual, transparent project milestones",
  timeline: [
    {
      title: "Land Clearance & Preparation",
      startDate: "March 2023",
      endDate: "April 2023",
      status: "completed",
      label: "Completed"
    },
    {
      title: "Foundation & Piling Completion",
      startDate: "May 2023",
      endDate: "July 2023",
      status: "completed",
      label: "Completed"
    },
    {
      title: "Brick Work & Plaster",
      startDate: "Nov 2023",
      endDate: "Jan 2024",
      status: "in-progress",
      label: "Ongoing",
      note: "Material delivery delayed due to weather"
    },
    {
      title: "Electrical & Plumbing",
      startDate: "Feb 2024",
      endDate: "Mar 2024",
      status: "upcoming",
      label: "Upcoming"
    }
  ],
  media: [
    {
      title: "Foundation work",
      category: "Foundation",
      thumbnail: "/images/1.png"
    },
    {
      title: "Column casting",
      category: "Structure",
      thumbnail: "/images/2.png"
    },
    {
      title: "Electrical wiring",
      category: "Walls",
      thumbnail: "/images/3.png"
    }
  ]
};

// Routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.render('index', {
    activeTab: 'financial-transparency',
    financialData,
    constructionProgress,
    customizationData
  });
});

// AJAX tab loading
app.get('/tabs/:tabName', (req, res) => {
  const { tabName } = req.params;

  const responseData = {
    activeTab: tabName,
    financialData: tabName === 'financial-transparency' ? financialData : null,
    constructionProgress: tabName === 'construction-progress' ? constructionProgress : null,
    customizationData: tabName === 'customization' ? customizationData : null
  };

  res.json(responseData);
});

// Route to handle cost breakdown tab switching
app.get('/cost-tabs/:tabId', (req, res) => {
  const { tabId } = req.params;
  
  financialData.projectCostBreakdown.tabs.forEach(tab => {
    tab.active = (tab.id === tabId);
  });
  financialData.projectCostBreakdown.activeTab = tabId;
  
  res.json({
    success: true,
    activeTab: tabId,
    costBreakdown: financialData.projectCostBreakdown
  });
});

const customizationData = {
  title: "Customization & Choice",
  subtitle: "Personalize your finishing materials",
  yourSelection: {
    title: "Your Selection",
    subtitle: "Customized customization choice",
    items: [
      {
        name: "Room Tile",
        value: "Premium Korean Tile",
        brand: "Kujata",
        upgradeCost: "৳15,000",
        image: "/images/tile2.PNG"
      }
    ]
  },
  customizationOptions: {
    title: "Customization Options",
    subtitle: "Select finishing materials for your floor",
    categories: [
      {
        name: "Room Tile",
        window: "01-01-2026 to 31-01-2026",
        windowStatus: "open",
        options: [
          {
            name: "Standard Korean Tile",
            brand: "Ceres",
            surface: "Carpet",
            upgradeCost: null,
            selected: false,
            image: "/images/tile1.PNG"
          },
          {
            name: "Premium Korean Tile",
            brand: "Kujata",
            surface: "Acrylic",
            upgradeCost: "৳15,000",
            selected: true,
            image: "/images/tile2.PNG"
          },
          {
            name: "Wooden Finish Tile",
            brand: "Ceres",
            surface: "Wood",
            upgradeCost: "৳50,000",
            selected: false,
            image: "/images/tile3.PNG"
          }
        ]
      }
    ],
    notice: "The selection window for this category is open. Make your choice before the deadline."
  }
};

// Update the /customization/update route
app.get('/customization/update', (req, res) => {
  const { category, optionIndex } = req.query;
  
  const categoryIndex = customizationData.customizationOptions.categories
    .findIndex(cat => cat.name.toLowerCase().replace(/ /g, '-') === category);
  
  if (categoryIndex >= 0 && optionIndex >= 0) {
    const cat = customizationData.customizationOptions.categories[categoryIndex];
    
    cat.options.forEach(opt => {
      opt.selected = false;
    });
    
    if (optionIndex >= 0 && optionIndex < cat.options.length) {
      const selectedOption = cat.options[optionIndex];
      selectedOption.selected = true;
      
      if (category === 'room-tile') {
        customizationData.yourSelection.items[0] = {
          name: "Room Tile",
          value: selectedOption.name,
          brand: selectedOption.brand,
          upgradeCost: selectedOption.upgradeCost,
          image: selectedOption.image || null
        };
      }
    }
  }
  
  res.json({
    success: true,
    customizationData
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});