const express = require('express');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'assets')));
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
app.use(cors());
// Update CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS to all routes
app.use(cors(corsOptions));
app.use(express.json());
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
let storage;
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Middleware
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  store: new (require('express-session').MemoryStore)(),
  cookie: {
    secure: false, 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, 
    sameSite: 'lax', 
    path: '/', 
  }
}));

const mongoURI = process.env.URI;

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
console.log('Environment:', isProduction ? 'Production/Vercel' : 'Development');

// Global connection promise to reuse across serverless functions
let connectionPromise = null;

// Global connection variable
// Global connection variable
let cachedConnection = null;
let gfs;
let gridFSBucket;

// Connection function
async function connectToDatabase() {
  if (cachedConnection && cachedConnection.readyState === 1) {
    console.log('Using existing database connection');
    return cachedConnection;
  }

  console.log('Creating new database connection...');
  
  try {
    const conn = mongoose.createConnection(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      waitQueueTimeoutMS: 5000
    });

    await new Promise((resolve, reject) => {
      conn.once('open', () => {
        console.log('MongoDB Connected Successfully');
        cachedConnection = conn;
        
        // Initialize GridFSBucket
        gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
          bucketName: 'media'
        });
        gfs = conn.db.collection('media.files');
        
        resolve(conn);
      });
      
      conn.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        reject(err);
      });
    });

    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Get connection function - DECLARE ONLY ONCE
const getConnection = () => cachedConnection;

// Ensure connection helper
async function ensureConnection() {
  if (!cachedConnection || cachedConnection.readyState !== 1) {
    console.log('Connection not ready, attempting to reconnect...');
    cachedConnection = await connectToDatabase();
  }
  return cachedConnection;
}

// Initialize connection immediately
connectToDatabase().catch(err => {
  console.error('Initial connection failed:', err);
});

// Initialize connection immediately
connectToDatabase().catch(err => {
  console.error('Initial connection failed:', err);
});

// Helper to ensure connection is ready
async function ensureConnection() {
  if (!cachedConnection || cachedConnection.readyState !== 1) {
    console.log('Connection not ready, attempting to reconnect...');
    cachedConnection = await connectToDatabase();
  }
  return cachedConnection;
}

// Helper function to safely get database connection with fallback
const getSafeConnection = () => {
  const conn = getConnection();
  if (!conn || conn.readyState !== 1) {
    console.log('Database not connected, returning null');
    return null;
  }
  return conn;
};

// Initialize connection immediately but don't wait
connectToDatabase().catch(err => {
  console.error('Initial connection failed:', err);
});

// Mock data (keep as fallback)
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
  subtitle: "Real-time updates on development milestones",
  timeline: [
    {
      title: "Land Acquisition & Site Clearance",
      status: "completed",
      label: "Completed",
      startDate: "Jan 15, 2023",
      endDate: "Feb 28, 2023",
      note: ""
    },
    {
      title: "Excavation & Foundation",
      status: "completed",
      label: "Completed",
      startDate: "Mar 1, 2023",
      endDate: "May 15, 2023",
      note: ""
    },
    {
      title: "Ground Floor Construction",
      status: "completed",
      label: "Completed",
      startDate: "May 16, 2023",
      endDate: "Aug 30, 2023",
      note: "Minor delay due to monsoon season"
    },
    {
      title: "1st & 2nd Floor Construction",
      status: "in-progress",
      label: "In Progress",
      startDate: "Sep 1, 2023",
      endDate: "Jan 31, 2024",
      note: "Currently at 65% completion"
    },
    {
      title: "3rd & 4th Floor Construction",
      status: "pending",
      label: "Pending",
      startDate: "Feb 1, 2024",
      endDate: "Jun 30, 2024",
      note: ""
    },
    {
      title: "Exterior Finishing",
      status: "pending",
      label: "Pending",
      startDate: "Jul 1, 2024",
      endDate: "Sep 30, 2024",
      note: ""
    },
    {
      title: "Interior Finishing & Handover",
      status: "pending",
      label: "Pending",
      startDate: "Oct 1, 2024",
      endDate: "Dec 31, 2024",
      note: "Estimated completion date"
    }
  ]
};

const customizationData = {
  title: "Unit Customization",
  subtitle: "Personalize your living space",
  customizationOptions: {
    title: "Available Customization Options",
    subtitle: "Select your preferred finishes and materials",
    notice: "The customization window is currently closed. Please contact your project manager if you need to make changes.",
    categories: [
      {
        name: "Flooring",
        window: "Jan 1, 2024 – Mar 31, 2024",
        windowStatus: "closed",
        options: [
          {
            name: "Premium Porcelain Tiles",
            brand: "RAK Ceramics",
            surface: "Matte Finish",
            image: "/images/floor1.jpg",
            upgradeCost: "৳15,000",
            selected: false
          },
          {
            name: "Italian Marble",
            brand: "Carrara",
            surface: "Polished",
            image: "/images/floor2.jpg",
            upgradeCost: "৳25,000",
            selected: false
          },
          {
            name: "Engineered Wood",
            brand: "Mohawk",
            surface: "Oak Texture",
            image: "/images/floor3.jpg",
            upgradeCost: "৳18,000",
            selected: false
          }
        ]
      },
      {
        name: "Kitchen Cabinets",
        window: "Feb 1, 2024 – Apr 30, 2024",
        windowStatus: "open",
        options: [
          {
            name: "Modular Plywood",
            brand: "Greenply",
            surface: "Laminated",
            image: "/images/kitchen1.jpg",
            upgradeCost: "৳12,000",
            selected: true
          },
          {
            name: "Premium PVC",
            brand: "Fenesta",
            surface: "Glossy Finish",
            image: "/images/kitchen2.jpg",
            upgradeCost: "৳8,000",
            selected: false
          },
          {
            name: "Stainless Steel",
            brand: "Blum",
            surface: "Metallic",
            image: "/images/kitchen3.jpg",
            upgradeCost: "৳20,000",
            selected: false
          }
        ]
      },
      {
        name: "Wall Color",
        window: "Mar 1, 2024 – May 31, 2024",
        windowStatus: "open",
        options: [
          {
            name: "Premium Emulsion",
            brand: "Berger",
            surface: "Matte",
            image: "/images/wall1.jpg",
            upgradeCost: "৳5,000",
            selected: false
          },
          {
            name: "Washable Paint",
            brand: "Asian Paints",
            surface: "Satin",
            image: "/images/wall2.jpg",
            upgradeCost: "৳7,000",
            selected: true
          },
          {
            name: "Eco-Friendly",
            brand: "Dulux",
            surface: "Zero VOC",
            image: "/images/wall3.jpg",
            upgradeCost: "৳9,000",
            selected: false
          }
        ]
      }
    ]
  },
  yourSelection: {
    title: "Your Current Selection",
    subtitle: "You can modify these until the customization window closes.",
    items: [
      {
        name: "Flooring",
        value: "Premium Porcelain Tiles",
        brand: "RAK Ceramics",
        upgradeCost: "৳15,000",
        image: "/images/floor1.jpg"
      },
      {
        name: "Kitchen Cabinets",
        value: "Modular Plywood",
        brand: "Greenply",
        upgradeCost: "৳12,000",
        image: "/images/kitchen1.jpg"
      },
      {
        name: "Wall Color",
        value: "Washable Paint",
        brand: "Asian Paints",
        upgradeCost: "৳7,000",
        image: "/images/wall2.jpg"
      }
    ]
  }
};

// Helper function for ordinal suffixes
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

async function generateFinancialData(shareholder, costDoc) {
  try {
    if (!shareholder) {
      console.log('No shareholder data found, using mock data');
      // Return mock data but ensure structure is correct
      return {
        ...financialData,
        paymentSchedule: { title: "", subtitle: "", items: [] }
      };
    }
    
    console.log('Processing shareholder data:', {
      name: shareholder.name,
      total_installments: shareholder.total_installments,
      installment_amount: shareholder.installment_amount,
      paymentsCount: shareholder.payments?.length
    });
    
    const { total_installments = 36, installment_amount = 0, payments = [] } = shareholder;
    
    // 1. Calculate outstanding balance
    const totalAmount = (total_installments || 36) * (installment_amount || 0);
    const paidAmount = payments
      .filter(p => p && p.status === 'Paid')
      .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    const outstandingBalance = totalAmount - paidAmount;
    
    // 2. Format outstanding balance with commas (Bangladeshi format)
    const formattedOutstandingBalance = outstandingBalance.toLocaleString('en-IN');
    
    // 3. Find next due date - find the first unpaid installment
    let nextDue = null;
    if (payments && payments.length > 0) {
      for (let payment of payments) {
        if (payment && payment.status === 'due' && (payment.amount_paid === 0 || payment.amount_paid === undefined)) {
          nextDue = payment;
          break;
        }
      }
    }
    
    const nextDueDate = nextDue?.last_date || "10-01-2026";
    const installmentNumber = nextDue?.installment_number || 6;
    
    // 4. Get completed payments
    let completedPayments = [];
    if (payments && payments.length > 0) {
      completedPayments = payments
        .filter(p => p && p.status === 'Paid')
        .sort((a, b) => (b.installment_number || 0) - (a.installment_number || 0))
        .map(p => {
          // Format date properly
          let paymentDate = p.payment_date || "N/A";
          // Convert "2026-02-05" to "05-02-2026" if needed
          if (paymentDate.includes('-') && paymentDate.length === 10) {
            const parts = paymentDate.split('-');
            paymentDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          
          return {
            name: `${p.installment_number || 1}${getOrdinalSuffix(p.installment_number || 1)} Construction Installment`,
            date: paymentDate,
            scheduledAmount: `৳${(installment_amount || 0).toLocaleString('en-IN')}`,
            paidAmount: `৳${(p.amount_paid || 0).toLocaleString('en-IN')}`,
            status: "completed"
          };
        });
    }
    
    // 5. Process voucher data from cost collection - FIXED
    let voucherItems = [];
    if (costDoc && costDoc.cost && Array.isArray(costDoc.cost)) {
      console.log('Processing REAL cost data:', costDoc.cost.length, 'items found');
      console.log('Cost document:', JSON.stringify(costDoc, null, 2));
      
      voucherItems = costDoc.cost.map(item => {
        // Generate a proper voucher number
        const datePart = (item.date || '').replace(/-/g, '').replace(/\//g, '');
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const voucherNo = datePart ? `VCH-${datePart}-${randomPart}` : `VCH-${randomPart}`;
        
        return {
          title: `${item.material || ''} - ${item.description || ''}`,
          vendor: item.brand || 'Unknown Vendor',
          voucherNo: voucherNo,
          date: item.date || 'N/A',
          amount: `৳${(item.amount || 0).toLocaleString('en-IN')}`,
          invoiceUrl: item.voucher_link || '#'
        };
      });
      
      console.log('Generated voucher items:', voucherItems);
    } else {
      console.log('No cost data found in database');
      // Use mock vouchers as fallback
      voucherItems = financialData.projectCostBreakdown.vouchers.items;
    }
    
    const result = {
      title: "Transparent Financial Breakdown",
      subtitle: "Clear, auditable records for your share",
      outstandingBalance: formattedOutstandingBalance || "0",
      nextDueDate: {
        date: nextDueDate,
        installment: `${installmentNumber}${getOrdinalSuffix(installmentNumber)} Construction Installment`
      },
      // Add empty paymentSchedule to avoid EJS errors
      paymentSchedule: {
        title: "",
        subtitle: "",
        items: []
      },
      rdcLog: {
        title: "Completed Payments",
        subtitle: "All payments made by you",
        items: completedPayments.length > 0 ? completedPayments : financialData.rdcLog.items
      },
      projectCostBreakdown: {
        title: "Project Cost Breakdown",
        subtitle: "Transparent view of construction expenditure",
        activeTab: "cost-overview",
        tabs: [
          { id: "cost-overview", name: "Cost Overview", active: true },
          { id: "voucher-verification", name: "Voucher Verification", active: false }
        ],
        costOverview: {
          totalProjectedCost: "৳33,60,000",
          actualExpenditure: "৳92,50,000",
          categories: financialData.projectCostBreakdown.costOverview.categories
        },
        vouchers: {
          title: "Voucher Verification",
          subtitle: "View scanned copies of vendor invoices for major purchases",
          items: voucherItems // Use the REAL voucher items
        }
      }
    };
    
    console.log('Generated financial data:', {
      outstandingBalance: result.outstandingBalance,
      completedPayments: result.rdcLog.items.length,
      voucherItems: result.projectCostBreakdown.vouchers.items.length
    });
    
    return result;
    
  } catch (error) {
    console.error('Error generating financial data:', error);
    console.error('Error stack:', error.stack);
    return {
      ...financialData,
      paymentSchedule: { title: "", subtitle: "", items: [] }
    };
  }
}

// Gallery route - fetch media data
app.get('/tabs/gallery', async (req, res) => {
  try {
    console.log('=== GALLERY TAB REQUEST ===');
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const project = req.session.user.project || 'aurora';
    console.log('Fetching gallery for project:', project);
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const projectDB = connection.useDb(project.toLowerCase());
    const collection = projectDB.collection('media');
    const mediaDoc = await collection.findOne({});

    let galleryItems = [];
    if (mediaDoc && mediaDoc.resource && Array.isArray(mediaDoc.resource)) {
      console.log(`Found ${mediaDoc.resource.length} gallery items`);
      galleryItems = mediaDoc.resource.map(item => ({
        name: item.name || 'Untitled',
        description: item.description || '',
        date: item.date || '',
        url: item.url || '',
        type: item.mediaType || (item.url.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video' : 'photo'),
        filename: item.filename || ''
      }));
    } else {
      console.log('No media found in database');
    }
    
    res.json({
      activeTab: 'gallery',
      gallery: {
        title: "Project Gallery",
        subtitle: "Browse through construction progress photos and videos",
        items: galleryItems
      }
    });
    
  } catch (error) {
    console.error('Error loading gallery tab:', error);
    res.json({
      activeTab: 'gallery',
      gallery: {
        title: "Project Gallery",
        subtitle: "Browse through construction progress photos and videos",
        items: []
      }
    });
  }
});

app.get('/dashboard', async (req, res) => {
  console.log('=== DASHBOARD ACCESS ===');
  console.log('Session ID:', req.sessionID);
  
  if (!req.session.user) {
    console.log('NO USER SESSION FOUND - Redirecting to login');
    return res.redirect('/login');
  }
  
  try {
    const userMobile = req.session.user?.mobile;
    const userName = req.session.user?.name;
    const projectName = req.session.user?.project || 'aurora';
    
    if (!userMobile) {
      console.log('No mobile in session');
      return res.redirect('/login');
    }
    
    console.log(`Fetching REAL data for mobile: ${userMobile} from project: ${projectName}`);
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      console.log('Database not connected, using mock data');
      // Fallback to mock data
      const projectDisplayName = formatProjectDisplayName(projectName);
      return res.render('index', {
        activeTab: 'financial-transparency',
        financialData: financialData,
        constructionProgress: constructionProgress,
        customizationData: customizationData,
        user: req.session.user,
        project: projectName,
        projectDisplayName: projectDisplayName,
        totalShares: 36
      });
    }
    
    const projectDB = connection.useDb(projectName);
    
    // ============== FETCH SHAREHOLDER DATA ==============
    const shareholderDoc = await projectDB.collection('shareholder').findOne({
      "shareholder.mobile": userMobile
    });
    
    let shareholder = null;
    if (shareholderDoc && shareholderDoc.shareholder) {
      shareholder = shareholderDoc.shareholder.find(sh => sh.mobile === userMobile);
      console.log('Found REAL shareholder:', shareholder?.name);
    } else {
      console.log('No shareholder found in database');
    }
    
    // ============== FETCH COST DATA ==============
    // Don't filter by project field - just get the document
    const costDoc = await projectDB.collection('cost').findOne({});
    console.log('Cost document found:', !!costDoc);
    
    // ============== FETCH MILESTONE DATA ==============
    // Don't filter by project field - just get the document
    const milestoneDoc = await projectDB.collection('milestone').findOne({});
    console.log('Milestone document found:', !!milestoneDoc);
    
    // ============== FETCH CUSTOMIZATION DATA ==============
    // Don't filter by project field - just get the document
    const customizationDoc = await projectDB.collection('customization').findOne({});
    console.log('Customization document found:', !!customizationDoc);
    if (customizationDoc) {
      console.log('Customization selection count:', customizationDoc.selection?.length || 0);
    }
    
    // ============== FETCH MEDIA DATA ==============
    // Don't filter by project field - just get the document
    const mediaDoc = await projectDB.collection('media').findOne({});
    console.log('Media document found:', !!mediaDoc);
    
    // ============== GENERATE FINANCIAL DATA ==============
    const dynamicFinancialData = await generateFinancialData(shareholder, costDoc);
    
    // ============== GENERATE CONSTRUCTION PROGRESS DATA ==============
    const dynamicConstructionProgress = generateConstructionProgressFromDB(milestoneDoc);
    
    // ============== GENERATE CUSTOMIZATION DATA ==============
    const dynamicCustomizationData = generateCustomizationFromDB(customizationDoc, userName);
    
    // ============== ADD MEDIA TO CONSTRUCTION PROGRESS ==============
    if (mediaDoc && mediaDoc.resource) {
      dynamicConstructionProgress.media = mediaDoc.resource;
    }
    
    // ============== PROJECT CONFIGURATION FOR DISPLAY ==============
    let projectDisplayName = "UniNest Aurora";
    let totalShares = 36; // Default for Aurora
    
    if (projectName === 'greenescape') {
      projectDisplayName = "UniNest Green Escape";
      totalShares = 24; // Adjust based on your project
    } else if (projectName === 'godhuli') {
      projectDisplayName = "UniNest Godhuli";
      totalShares = 18; // Adjust based on your project
    }
    
    console.log('Using REAL data for dashboard:', {
      project: projectName,
      projectDisplayName: projectDisplayName,
      financial: !!dynamicFinancialData,
      construction: !!dynamicConstructionProgress,
      customization: !!dynamicCustomizationData,
      media: !!mediaDoc,
      shareholderFound: !!shareholder
    });
    
    // ============== RENDER DASHBOARD ==============
    res.render('index', {
      activeTab: 'financial-transparency',
      financialData: dynamicFinancialData,
      constructionProgress: dynamicConstructionProgress,
      customizationData: dynamicCustomizationData,
      user: req.session.user,
      project: projectName,
      projectDisplayName: projectDisplayName,
      totalShares: totalShares
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback to mock data
    const projectName = req.session.user?.project || 'aurora';
    let projectDisplayName = "UniNest Aurora";
    
    if (projectName === 'greenescape') {
      projectDisplayName = "UniNest Green Escape";
    } else if (projectName === 'godhuli') {
      projectDisplayName = "UniNest Godhuli";
    }
    
    res.render('index', {
      activeTab: 'financial-transparency',
      financialData: financialData,
      constructionProgress: constructionProgress,
      customizationData: customizationData,
      user: req.session.user,
      project: projectName,
      projectDisplayName: projectDisplayName,
      totalShares: 36
    });
  }
});

// Helper function to generate construction progress from database
function generateConstructionProgressFromDB(milestoneDoc) {
  if (!milestoneDoc || !milestoneDoc.milestone || !Array.isArray(milestoneDoc.milestone)) {
    console.log('No milestone data found, using mock data');
    return constructionProgress; // Fallback to mock
  }
  
  const timeline = milestoneDoc.milestone.map(item => ({
    title: item.description || 'Milestone',
    status: (item.status || 'Planned').toLowerCase().replace(/\s+/g, '-'),
    label: item.status || 'Planned',
    startDate: item.planned_date || 'N/A',
    endDate: item.completion_date || 'In Progress',
    note: item.note || ''
  }));
  
  return {
    title: "Construction Progress",
    subtitle: "Real-time updates on development milestones",
    timeline: timeline
  };
}
// Helper function to generate customization from database
// Helper function to generate customization from database
function generateCustomizationFromDB(customizationDoc, userName = '') {
  try {
    // IMPROVED NULL CHECK WITH DETAILED LOGGING
    if (!customizationDoc) {
      console.log('❌ No customization document found in database - using mock data');
      return JSON.parse(JSON.stringify(customizationData)); // Deep copy mock data
    }
    
    console.log('✅ Customization document found in database');
    console.log('Document keys:', Object.keys(customizationDoc));
    
    if (!customizationDoc.selection) {
      console.log('❌ Customization document has no "selection" field');
      console.log('Available fields:', Object.keys(customizationDoc));
      return JSON.parse(JSON.stringify(customizationData));
    }
    
    if (!Array.isArray(customizationDoc.selection)) {
      console.log('❌ customizationDoc.selection is not an array, it is:', typeof customizationDoc.selection);
      return JSON.parse(JSON.stringify(customizationData));
    }
    
    if (customizationDoc.selection.length === 0) {
      console.log('❌ Customization selection array is empty');
      return JSON.parse(JSON.stringify(customizationData));
    }
    
    console.log(`✅ Processing customization data for user: ${userName}`);
    console.log(`✅ Customization selection items: ${customizationDoc.selection.length}`);
    
    // Transform database data to match frontend structure
    const categories = customizationDoc.selection.map((item, index) => {
      console.log(`Processing category ${index + 1}:`, item.name);
      
      // Check which option the current user has selected
      let selectedOptionIndex = -1;
      const options = [];
      
      // Create options array from option_1, option_2, option_3
      for (let i = 1; i <= 3; i++) {
        const optionKey = `option_${i}`;
        if (item[optionKey]) {
          const option = item[optionKey];
          const isSelected = option.voters && Array.isArray(option.voters) && option.voters.includes(userName);
          
          if (isSelected) {
            selectedOptionIndex = i - 1; // Zero-based index
          }
          
          // Create option names based on details
          let optionName = `Option ${i}`;
          if (option.details) {
            const details = option.details.split(' ');
            optionName = details[0] + ' ' + (details[1] || 'Tiles');
          }
          
          options.push({
            name: optionName,
            brand: option.details || '',
            surface: 'Premium',
            image: option.url || '',
            upgradeCost: i === 1 ? '৳15,000' : i === 2 ? '৳25,000' : '৳18,000',
            selected: isSelected
          });
          
          console.log(`  Option ${i}:`, { 
            selected: isSelected, 
            votersCount: option.voters?.length || 0 
          });
        }
      }
      
      // Determine window status based on dates
      let windowStatus = 'open';
      try {
        if (item.to) {
          const dateParts = item.to.split('-');
          if (dateParts.length === 3) {
            const windowEnd = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
            const now = new Date();
            windowStatus = windowEnd < now ? 'closed' : 'open';
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
        windowStatus = 'open';
      }
      
      return {
        name: item.name || 'Tiles Preference',
        window: `${item.from || 'N/A'} – ${item.to || 'N/A'}`,
        windowStatus: windowStatus,
        options: options
      };
    });
    
    // Get user's current selections
    const userSelections = [];
    customizationDoc.selection.forEach(item => {
      for (let i = 1; i <= 3; i++) {
        const optionKey = `option_${i}`;
        if (item[optionKey] && 
            item[optionKey].voters && 
            Array.isArray(item[optionKey].voters) && 
            item[optionKey].voters.includes(userName)) {
          const option = item[optionKey];
          userSelections.push({
            name: item.name || 'Tiles Preference',
            value: `Option ${i}`,
            brand: option.details || '',
            upgradeCost: i === 1 ? '৳15,000' : i === 2 ? '৳25,000' : '৳18,000',
            image: option.url || ''
          });
          console.log(`✅ User selected option ${i} for ${item.name}`);
          break; // User can only select one option per category
        }
      }
    });
    
    const result = {
      title: "Unit Customization",
      subtitle: "Personalize your living space",
      customizationOptions: {
        title: "Available Customization Options",
        subtitle: "Select your preferred finishes and materials",
        notice: userSelections.length > 0 
          ? "You can modify your selection until the customization window closes." 
          : "The customization window is currently open. Make your selection before it closes.",
        categories: categories
      },
      yourSelection: {
        title: "Your Current Selection",
        subtitle: "You can modify these until the customization window closes.",
        items: userSelections.length > 0 ? userSelections : [{
          name: "Tiles Preference",
          value: "No selection made yet",
          brand: "Please select an option below",
          upgradeCost: "৳0",
          image: ""
        }]
      }
    };
    
    console.log(`✅ Generated customization data:`, {
      categories: result.customizationOptions.categories.length,
      userSelections: result.yourSelection.items.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in generateCustomizationFromDB:', error);
    console.error('Error stack:', error.stack);
    return JSON.parse(JSON.stringify(customizationData)); // Return mock data on error
  }
}

// API to update customization selection (add user to voters array)
app.post('/api/customization/vote', async (req, res) => {
  try {
    console.log('=== CUSTOMIZATION VOTE REQUEST ===');
    
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    const { categoryIndex, optionNumber } = req.body;
    const userName = req.session.user.name;
    const projectName = req.session.user.project || 'aurora';
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    const projectDB = connection.useDb(projectName);    
    const collection = projectDB.collection('customization');
    const doc = await collection.findOne({ project: projectName });
    console.log('Found document:', !!doc);
    if (!doc || !doc.selection || !Array.isArray(doc.selection)) {
      console.log('Document structure issue:', {
        hasDoc: !!doc,
        hasSelection: doc?.selection ? 'Yes' : 'No',
        selectionIsArray: Array.isArray(doc?.selection)
      });
      return res.status(404).json({ 
        success: false, 
        message: 'Customization data not found' 
      });
    }
    console.log('Selection array length:', doc.selection.length);
    console.log('Category index requested:', categoryIndex);
    if (categoryIndex >= doc.selection.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category index' 
      });
    }
    const category = doc.selection[categoryIndex];
    const optionKey = `option_${optionNumber}`;
    console.log('Category:', category.name);
    console.log('Option key:', optionKey);
    console.log('Has option:', !!category[optionKey]);
    if (!category[optionKey]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid option number' 
      });
    }
    
    console.log('Current voters for option', optionNumber, ':', category[optionKey].voters);
    console.log('User name to add:', userName);
    // Remove user from all voters arrays in this category first
    const updateOperations = {};
    for (let i = 1; i <= 3; i++) {
      const optKey = `option_${i}`;
      if (category[optKey]) {
        const currentVoters = category[optKey].voters || [];
        const filteredVoters = currentVoters.filter(voter => voter !== userName && voter !== '');
        updateOperations[`selection.${categoryIndex}.${optKey}.voters`] = filteredVoters;
        console.log(`Option ${i} voters after filtering:`, filteredVoters);
      }
    }
    
    // Add user to the selected option's voters array
    const selectedOptionVoters = updateOperations[`selection.${categoryIndex}.${optionKey}.voters`] || [];
    if (!selectedOptionVoters.includes(userName)) {
      selectedOptionVoters.push(userName);
      updateOperations[`selection.${categoryIndex}.${optionKey}.voters`] = selectedOptionVoters;
      console.log(`Added ${userName} to option ${optionNumber} voters`);
    }
    console.log('Update operations:', updateOperations);
    // Update the document
    const result = await collection.updateOne(
      { _id: doc._id },
      { 
        $set: updateOperations,
        $currentDate: { updated_at: true }
      }
    );
    
    console.log('Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
    
    if (result.modifiedCount === 0) {
      console.log('No documents were modified');
    }
    
    const updatedDoc = await collection.findOne({ _id: doc._id });
    console.log('Updated document option voters:', {
      option1: updatedDoc.selection[categoryIndex].option_1?.voters,
      option2: updatedDoc.selection[categoryIndex].option_2?.voters,
      option3: updatedDoc.selection[categoryIndex].option_3?.voters
    });
    const updatedCustomizationData = generateCustomizationFromDB(updatedDoc, userName);
    res.json({
      success: true,
      message: 'Selection updated successfully',
      customizationData: updatedCustomizationData
    });
    
  } catch (error) {
    console.error('Error updating customization vote:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

app.get('/cost-tabs/:tabId', async (req, res) => {
  try {
    console.log('=== COST TAB REQUEST ===');
    
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userMobile = req.session.user.mobile; 
    const tabId = req.params.tabId;
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    
    const auroraDB = connection.useDb('aurora');
    const shareholderDoc = await auroraDB.collection('shareholder').findOne({
      "shareholder.mobile": userMobile 
    });
    let shareholder = null;
    if (shareholderDoc && shareholderDoc.shareholder) {
      shareholder = shareholderDoc.shareholder.find(sh => sh.mobile === userMobile);
    }
    // Fetch REAL cost data
    const costDoc = await auroraDB.collection('cost').findOne({ project: "aurora" });
    console.log('Cost document found:', !!costDoc);
    if (costDoc) {
      console.log('Cost items count:', costDoc.cost?.length || 0);
    }
    
    const dynamicFinancialData = await generateFinancialData(shareholder, costDoc);
    
    console.log('Sending response with tab:', tabId);
    console.log('Voucher items count:', dynamicFinancialData.projectCostBreakdown.vouchers.items.length);
    
    res.json({
      success: true,
      costBreakdown: {
        activeTab: tabId,
        costOverview: dynamicFinancialData.projectCostBreakdown.costOverview,
        vouchers: dynamicFinancialData.projectCostBreakdown.vouchers
      }
    });
    
  } catch (error) {
    console.error('Error in cost tab:', error);
    res.json({
      success: false,
      costBreakdown: {
        activeTab: req.params.tabId,
        costOverview: financialData.projectCostBreakdown.costOverview,
        vouchers: financialData.projectCostBreakdown.vouchers
      }
    });
  }
});

// Login route (simplified example)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database not connected" 
      });
    }
    
    // Find user in shareholder collection
    const shareholderDoc = await connection.db.collection('shareholder').findOne({
      "shareholder.email": email,
      "shareholder.password": password
    });
    
    if (shareholderDoc) {
      const shareholder = shareholderDoc.shareholder.find(sh => sh.email === email);
      
      // Set session
      req.session.user = {
        email: shareholder.email,
        name: shareholder.name,
        flat_number: shareholder.flat_number,
        role: shareholder.role
      };
      
      res.json({ 
        success: true, 
        message: "Login successful",
        user: req.session.user
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // For Vercel: Use memory storage
  console.log('Using memory storage for Vercel');
  storage = multer.memoryStorage();
} else {
  // For local development: Use disk storage
  console.log('Using disk storage for local development');
  const uploadDir = 'uploads/temp';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      cb(null, `${timestamp}-${randomSuffix}${fileExt}`);
    }
  });
}

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

class CPanelUploadService {
  constructor() {
    this.config = {
      cpanelUrl: 'https://uninest.com.bd:2083',
      username: process.env.CPANEL_USERNAME,
      password: process.env.CPANEL_PASSWORD,
      domain: 'uninest.com.bd'
    };
    
    // Create https agent with better timeout settings
    this.httpsAgent = new (require('https').Agent)({ 
      rejectUnauthorized: false,
      timeout: 60000 // 60 second timeout
    });
  }

  async uploadFile(filePathOrBuffer, fileName, subfolder = '') {
    try {
      console.log(`Uploading ${fileName} to cPanel...`);
      console.log(`Subfolder: ${subfolder}`);
      console.log(`Input type: ${Buffer.isBuffer(filePathOrBuffer) ? 'Buffer' : 'File path'}`);
      
      const formData = new FormData();
      let fileSize = 0;
      
      // Handle different input types
      if (Buffer.isBuffer(filePathOrBuffer)) {
        // Input is a buffer
        fileSize = filePathOrBuffer.length;
        console.log(`Buffer size: ${fileSize} bytes`);
        formData.append('file', filePathOrBuffer, {
          filename: fileName,
          contentType: this.getContentType(fileName),
          knownLength: fileSize
        });
      } else if (typeof filePathOrBuffer === 'string') {
        // Input is a file path
        if (!fs.existsSync(filePathOrBuffer)) {
          throw new Error(`File not found: ${filePathOrBuffer}`);
        }
        const stats = fs.statSync(filePathOrBuffer);
        fileSize = stats.size;
        console.log(`File size: ${fileSize} bytes`);
        console.log(`File path: ${filePathOrBuffer}`);
        formData.append('file', fs.createReadStream(filePathOrBuffer), {
          filename: fileName,
          contentType: this.getContentType(fileName),
          knownLength: fileSize
        });
      } else {
        throw new Error('Invalid input: Expected Buffer or file path string');
      }
      // Prepare directory path
      const cleanSubfolder = subfolder.endsWith('/') ? subfolder : `${subfolder}/`;
      const remoteDir = `/home/${this.config.username}/public_html/uploads/${cleanSubfolder}`;
      formData.append('dir', remoteDir);
      formData.append('overwrite', '1');
      console.log(`Uploading to directory: ${remoteDir}`);
      // Prepare authentication
      const authString = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      // Get form data headers
      const formHeaders = formData.getHeaders();
      const response = await axios.post(
        `${this.config.cpanelUrl}/execute/Fileman/upload_files`,
        formData,
        {
          headers: {
            ...formHeaders,
            'Authorization': `Basic ${authString}`,
            'Content-Length': formData.getLengthSync().toString(),
          },
          httpsAgent: this.httpsAgent,
          timeout: 60000, // 60 second timeout
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );
      console.log('cPanel upload response status:', response.status);
      console.log('cPanel upload response data:', JSON.stringify(response.data, null, 2));
      // Parse response to get actual uploaded filename
      let actualFileName = fileName;
      if (response.data && typeof response.data === 'object') {
        if (response.data.status === 1 && response.data.data && response.data.data.uploads) {
          const uploads = response.data.data.uploads;
          if (uploads.length > 0 && uploads[0].dest) {
            // Extract filename from dest path
            actualFileName = path.basename(uploads[0].dest);
            console.log('Actual uploaded filename from cPanel:', actualFileName);
          }
        }
        // Check for errors in response
        if (response.data.errors && response.data.errors.length > 0) {
          console.warn('cPanel reported errors:', response.data.errors);
        }
      }
      // Construct public URL
      const cleanActualFileName = encodeURIComponent(actualFileName);
      const publicUrl = `https://${this.config.domain}/uploads/${cleanSubfolder}${cleanActualFileName}`;
      console.log('Generated public URL:', publicUrl);
      // Verify URL is accessible (optional, can be disabled in production)
      if (process.env.NODE_ENV !== 'production') {
        await this.verifyUrlAccessible(publicUrl);
      }
      return publicUrl;
    } catch (error) {
      console.error('cPanel Upload Error Details:');
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        if (error.response.status === 401) {
          throw new Error('cPanel authentication failed. Check username and password.');
        } else if (error.response.status === 404) {
          throw new Error('cPanel API endpoint not found. Check cPanel URL.');
        } else if (error.response.status === 500) {
          throw new Error('cPanel server error. The cPanel may be experiencing issues.');
        }
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
        throw new Error('No response from cPanel server. Check network connection and cPanel URL.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Connection to cPanel timed out. Try reducing file size or check server load.');
      }
      throw new Error(`cPanel upload failed: ${error.message}`);
    }
  }

  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async verifyUrlAccessible(url) {
    try {
      console.log(`Verifying URL accessibility: ${url}`);
      
      const response = await axios.head(url, { 
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500 // Accept 4xx errors for verification
      });
      
      console.log(`✅ URL verified: ${url} (Status: ${response.status})`);
      return true;
      
    } catch (error) {
      // Try GET request if HEAD fails
      try {
        const getResponse = await axios.get(url, { 
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        });
        
        console.log(`⚠️  HEAD failed but GET succeeded for: ${url} (Status: ${getResponse.status})`);
        return true;
        
      } catch (getError) {
        console.warn(`❌ URL verification failed: ${url} - ${getError.message}`);
        // Don't throw - the URL might still work for others
        return false;
      }
    }
  }
}
const cpanelService = new CPanelUploadService();
// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};
const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};
// GET media endpoint

app.get('/api/media/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('media');
    // Find ALL media documents
    const docs = await collection.find({}).toArray();
    if (!docs || docs.length === 0) {
      return res.status(404).json({ message: 'No media found' });
    }
    // Return the first document
    const doc = docs[0];
    if (!doc.resource || !Array.isArray(doc.resource) || doc.resource.length === 0) {
      return res.status(404).json({ message: 'No media resources found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ 
      error: 'Failed to fetch media',
      details: error.message 
    });
  }
});

// Combined upload endpoint - VERCEL COMPATIBLE
app.post('/api/upload-media', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload media request received');
    
    // Ensure database connection - FIX: Use ensureConnection() and store the result
    const connection = await ensureConnection();
    if (!connection) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Get form data
    const { name, description, date, project = 'aurora' } = req.body;
    console.log('Form data:', { name, description, date, project });
    
    if (!name || !description || !date) {
      // Clean up if file was saved to disk (local dev only)
      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields (name, description, date)' 
      });
    }
    
    // Generate consistent filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const originalName = req.file.originalname;
    const fileExt = path.extname(originalName);
    const fileName = `${timestamp}-${randomSuffix}${fileExt}`;
    console.log('Generated filename:', fileName);
    console.log('Is Vercel environment?', !!process.env.VERCEL);
    
    let publicUrl;
    let tempFilePath;
    
    try {
      // Handle upload based on environment
      if (process.env.VERCEL) {
        // VERCEL: Use memory buffer and temporary file
        console.log('Processing file in Vercel environment');
        tempFilePath = `/tmp/${fileName}`;
        await fs.promises.writeFile(tempFilePath, req.file.buffer);
        console.log('File written to temp location:', tempFilePath);
        publicUrl = await cpanelService.uploadFile(tempFilePath, fileName, `${project}/`);
      } else if (req.file.buffer) {
        // LOCAL with memory storage
        console.log('Processing file from buffer in local environment');
        const tempDir = 'uploads/temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        tempFilePath = path.join(tempDir, fileName);
        await fs.promises.writeFile(tempFilePath, req.file.buffer);
        publicUrl = await cpanelService.uploadFile(tempFilePath, fileName, `${project}/`);
      } else {
        // LOCAL with disk storage
        console.log('Processing file from disk in local environment');
        console.log('File path:', req.file.path);
        publicUrl = await cpanelService.uploadFile(req.file.path, fileName, `${project}/`);
      }
      console.log('cPanel upload successful:', publicUrl);
      
    } catch (cpanelError) {
      console.error('cPanel upload failed:', cpanelError.message);
      
      // Fallback to local storage (only for local development)
      if (!process.env.VERCEL) {
        console.log('Attempting local fallback...');
        const localUploadsDir = path.join(__dirname, 'public', 'uploads', project);
        if (!fs.existsSync(localUploadsDir)) {
          fs.mkdirSync(localUploadsDir, { recursive: true });
        }
        const localFilePath = path.join(localUploadsDir, fileName);
        
        if (req.file.buffer) {
          await fs.promises.writeFile(localFilePath, req.file.buffer);
        } else if (req.file.path && fs.existsSync(req.file.path)) {
          await fs.promises.copyFile(req.file.path, localFilePath);
        } else if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fs.promises.copyFile(tempFilePath, localFilePath);
        } else {
          throw new Error('No file data available for fallback');
        }
        publicUrl = `/uploads/${project}/${fileName}`;
        console.log('Using local fallback URL:', publicUrl);
      } else {
        publicUrl = `https://${cpanelService.config.domain}/uploads/${project}/${fileName}`;
        console.log('Created placeholder URL for Vercel:', publicUrl);
      }
    }
    
    // Clean up temporary files
    const cleanupPromises = [];
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      cleanupPromises.push(fs.promises.unlink(tempFilePath).catch(e => console.log('Temp file cleanup error:', e.message)));
    }
    
    if (req.file.path && fs.existsSync(req.file.path) && !process.env.VERCEL) {
      cleanupPromises.push(fs.promises.unlink(req.file.path).catch(e => console.log('Upload file cleanup error:', e.message)));
    }
    
    await Promise.allSettled(cleanupPromises);
    
    // Format date
    const formatDateToDDMMYYYY = (dateString) => {
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (error) {
        console.error('Date formatting error:', error);
        return dateString;
      }
    };
    
    // FIX: Use the connection variable, not 'conn'
    const db = connection.useDb(project.toLowerCase());
    const collection = db.collection('media');
    
    const newResource = {
      name: name.trim(),
      description: description.trim(),
      date: formatDateToDDMMYYYY(date),
      url: publicUrl,
      filename: fileName,
      uploaded_at: new Date()
    };
    
    console.log('Saving to database:', newResource);
    
    // Save to database
    const existingDoc = await collection.findOne({});
    
    if (!existingDoc) {
      const result = await collection.insertOne({
        resource: [newResource],
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('Created new media document:', result.insertedId);
    } else {
      const result = await collection.updateOne(
        { _id: existingDoc._id },
        {
          $push: { resource: newResource },
          $set: { updated_at: new Date() }
        }
      );
      console.log('Updated existing media document, modified:', result.modifiedCount);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: newResource,
      fileInfo: {
        originalName: originalName,
        size: req.file.size || req.file.buffer?.length || 0,
        type: req.file.mimetype
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Cleanup any remaining temp files
    try {
      if (req.file?.path && fs.existsSync(req.file.path) && !process.env.VERCEL) {
        await fs.promises.unlink(req.file.path);
      }
    } catch (cleanupError) {
      console.error('Final cleanup error:', cleanupError);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed',
      details: error.message,
      env: process.env.VERCEL ? 'Vercel' : 'Local'
    });
  }
});

// POST media metadata endpoint (for direct URL submissions)
app.post('/api/media/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // Ensure database connection
    const connection = await ensureConnection();
    if (!connection) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('media');
    
    const {
      name,
      description,
      date,
      url,
      mediaType
    } = req.body;

    if (!name || !description || !date || !url) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    const newResource = {
      name,
      description,
      date,
      url,
      mediaType: mediaType || 'photo',
      created_at: new Date()
    };

    // Check if document exists
    const existingDoc = await collection.findOne({});
    
    if (!existingDoc) {
      // Create new document
      const result = await collection.insertOne({
        project,
        resource: [newResource],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('Created new media document for project:', project);
      
      return res.status(201).json({
        success: true,
        message: 'Media added successfully',
        insertedId: result.insertedId
      });
    } else {
      // Update existing document
      const result = await collection.updateOne(
        {},
        {
          $push: { resource: newResource },
          $set: { updated_at: new Date() }
        }
      );
      
      console.log('Added media to existing document:', newResource.name);
      
      return res.status(201).json({
        success: true,
        message: 'Media added successfully',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add media',
      details: error.message 
    });
  }
});
//

// GET shareholders for a specific project
app.get('/api/shareholder/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    console.log(`Fetching shareholders for project: ${project}`);
    
    // Ensure database connection
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    // Use the project name as the database name
    const db = connection.useDb(project);
    const collection = db.collection('shareholder');

    // Find the document (no need to filter by project field since we're already in the correct DB)
    const doc = await collection.findOne({});

    if (!doc || !doc.shareholder || doc.shareholder.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No shareholders found for this project' 
      });
    }

    // Optional: Filter shareholders by project field if it exists in each shareholder object
    // This ensures we only return shareholders with matching project
    const shareholders = doc.shareholder.filter(sh => 
      !sh.project || sh.project === project
    );

    res.json(shareholders);
    
  } catch (error) {
    console.error('Error fetching shareholders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
});

//

// POST new shareholder for a specific project
app.post('/api/shareholder/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    console.log(`Adding shareholder to project: ${project}`);
    
    // Ensure database connection
    const connection = await ensureConnection();
    if (!connection) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('shareholder');

    const {
      id,
      name,
      flat_number,
      email,
      mobile,
      password,
      role,
      total_installments,
      installment_amount
    } = req.body;

    // Validate required fields
    if (!id || !name || !mobile) {
      return res.status(400).json({ 
        success: false,
        message: 'ID, Name, and Mobile are required' 
      });
    }

    // For clients, flat_number is required
    if (role !== 'admin' && !flat_number) {
      return res.status(400).json({ 
        success: false,
        message: 'Flat Number is required for clients' 
      });
    }

    let payments = [];
    let totalInstallmentsNum = 0;
    let installmentAmountNum = 0;
    
    if (role === 'admin') {
      payments = [];
      totalInstallmentsNum = 0;
      installmentAmountNum = 0;
    } else {
      totalInstallmentsNum = Number(total_installments) || 0;
      installmentAmountNum = Number(installment_amount) || 0;
      
      payments = Array.from(
        { length: totalInstallmentsNum },
        (_, i) => ({
          installment_number: i + 1,
          amount_paid: 0,
          payment_date: "",
          status: "due"
        })
      );
    }

    const newShareholder = {
      id,
      project: project, // Store the project name
      name,
      flat_number: flat_number || '',
      email: email || '',
      mobile,
      password,
      role: role || 'client',
      total_installments: totalInstallmentsNum,
      installment_amount: installmentAmountNum,
      payments,
      created_at: new Date()
    };

    // Check if document exists
    const existingDoc = await collection.findOne({});
    
    if (!existingDoc) {
      // Create new document with shareholders array
      const result = await collection.insertOne({
        shareholder: [newShareholder],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      if (!result.insertedId) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to create document' 
        });
      }
      
      console.log('Created new document with shareholder:', newShareholder.id);
    } else {
      // Update existing document
      const result = await collection.updateOne(
        {}, 
        { 
          $push: { shareholder: newShareholder },
          $set: { updated_at: new Date() }
        }
      );
      
      if (result.modifiedCount === 0) {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to add shareholder' 
        });
      }
      
      console.log('Added shareholder to existing document:', newShareholder.id);
    }

    res.status(201).json({
      success: true,
      message: 'Shareholder added successfully',
      data: newShareholder
    });

  } catch (err) {
    console.error('Error adding shareholder:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
});

// DELETE shareholder by ID
app.delete('/api/shareholder/:project/:shareholderId', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const shareholderId = req.params.shareholderId;
    
    console.log(`Deleting shareholder ${shareholderId} from project: ${project}`);
    
    // Ensure database connection
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected' 
      });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('shareholder');
    
    // Find the document and remove the shareholder from the array
    const result = await collection.updateOne(
      {}, // Find the document (assuming one document per project)
      { 
        $pull: { shareholder: { id: shareholderId } },
        $set: { updated_at: new Date() }
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Shareholder not found' 
      });
    }
    
    console.log(`Shareholder ${shareholderId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Shareholder deleted successfully'
    });
    
  } catch (err) {
    console.error('Error deleting shareholder:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
});

//
app.post('/api/payment/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
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

    // For Vercel: Handle buffer instead of disk file
    let fileData;
    if (req.file.buffer) {
      // Process buffer for Vercel
      fileData = {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        uploadDate: new Date(),
        size: req.file.size,
        buffer: req.file.buffer, // Store buffer if needed
        metadata: req.file.metadata || {}
      };
    } else {
      // For local development
      fileData = {
        id: req.file.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.contentType,
        uploadDate: req.file.uploadDate || new Date(),
        size: req.file.size,
        metadata: req.file.metadata || {},
        url: `/api/files/${req.file.filename}`
      };
    }

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
// GET costs for a project
app.get('/api/costs/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
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
    
    // Ensure database connection
    const connection = await ensureConnection();
    if (!connection) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }
    
    const db = connection.useDb(project);
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
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    const newCost = {
      material,
      date,
      description,
      brand: brand || '',
      amount: Number(amount),
      voucher_link: voucher_link || '',
      created_at: new Date()
    };

    // Check if document exists
    const existingDoc = await collection.findOne({});
    
    if (!existingDoc) {
      // Create new document
      const result = await collection.insertOne({
        project,
        cost: [newCost],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('Created new cost document for project:', project);
      
      return res.status(201).json({
        success: true,
        message: 'Cost added successfully',
        insertedId: result.insertedId
      });
    } else {
      // Update existing document
      const result = await collection.updateOne(
        {},
        {
          $push: { cost: newCost },
          $set: { updated_at: new Date() }
        }
      );
      
      console.log('Added cost to existing document:', newCost.description);
      
      return res.status(201).json({
        success: true,
        message: 'Cost added successfully',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding cost:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add cost',
      details: error.message 
    });
  }
});
// milestone
app.get('/api/milestones/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('milestone');
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
    
    // Ensure database connection
    const connection = await ensureConnection();
    if (!connection) {
      return res.status(503).json({ 
        success: false,
        error: 'Database not connected' 
      });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('milestone');
    
    const {
      description,
      planned_date,
      completion_date,
      status,
      note
    } = req.body;

    if (!description || !planned_date) {
      return res.status(400).json({ 
        success: false,
        error: 'Description and planned date are required' 
      });
    }

    const newMilestone = {
      description: description.trim(),
      planned_date,
      completion_date: completion_date || '',
      status: status || 'Planned',
      note: note || '',
      created_at: new Date()
    };

    // Check if document exists
    const existingDoc = await collection.findOne({});
    
    if (!existingDoc) {
      // Create new document
      const result = await collection.insertOne({
        project,
        milestone: [newMilestone],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      console.log('Created new milestone document for project:', project);
      
      return res.status(201).json({
        success: true,
        message: 'Milestone added successfully',
        insertedId: result.insertedId
      });
    } else {
      // Update existing document
      const result = await collection.updateOne(
        {},
        {
          $push: { milestone: newMilestone },
          $set: { updated_at: new Date() }
        }
      );
      
      console.log('Added milestone to existing document:', newMilestone.description);
      
      return res.status(201).json({
        success: true,
        message: 'Milestone added successfully',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add milestone',
      details: error.message 
    });
  }
});
// PUT (update) a specific milestone
app.put('/api/milestones/:project/:index', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const index = parseInt(req.params.index);
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
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
// POST new media
app.post('/api/media/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('media');
    
    const {
      name,
      description,
      date,
      url,
      mediaType
    } = req.body;

    // Validate required fields
    if (!name || !description || !date || !url) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newResource = {
      name,
      description,
      date,
      url,
      mediaType: mediaType || 'photo',
      created_at: new Date()
    };

    // Check if project document exists
    const projectExists = await collection.findOne({ project });
    
    if (!projectExists) {
      // Create new project document with first resource
      const result = await collection.insertOne({
        project,
        resource: [newResource],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Media added to new project',
        insertedId: result.insertedId
      });
    } else {
      // Add to existing project's resource array
      const result = await collection.updateOne(
        { project },
        {
          $push: { resource: newResource },
          $set: { updated_at: new Date() }
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Media added to existing project',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({ error: 'Failed to add media' });
  }
});
// login
app.get('/login', (req, res) => {
  if (req.session.user) {
    // Redirect to appropriate dashboard if already logged in
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/dashboard');
  }
  res.render('login');
});

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/dashboard');
  }
  res.redirect('/login');
});

// Update the login endpoint (around line 1200+)

app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password, project } = req.body;
    
    if (!mobile || !password || !project) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile, password, and project are required' 
      });
    }
    
    console.log('Login attempt for mobile:', mobile, 'project:', project);
    
    // Get connection with retry logic
    let conn = getConnection();
    if (!conn || conn.readyState !== 1) {
      console.log('Connection not ready, attempting to connect...');
      try {
        conn = await connectToDatabase();
      } catch (connError) {
        console.error('Failed to connect to database:', connError);
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please try again.'
        });
      }
    }
    
    // Use the selected project as database name
    const db = conn.useDb(project.toLowerCase());
    const collection = db.collection('shareholder');
    
    // Add timeout to database query
    const doc = await Promise.race([
      collection.findOne({ "shareholder.mobile": mobile }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]);
    
    if (!doc || !doc.shareholder || doc.shareholder.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid mobile number' 
      });
    }
    
    const user = doc.shareholder.find(sh => sh.mobile === mobile);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid mobile number' 
      });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }
    
    console.log('Login successful for:', user.name, 'in project:', project);
    
    // Store project in session
    const userSession = {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      flat_number: user.flat_number,
      project: project.toLowerCase(),
      role: user.role,
      total_installments: user.total_installments,
      installment_amount: user.installment_amount,
      payments: user.payments
    };
    
    req.session.user = userSession;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Session error' 
        });
      }
      
      res.json({
        success: true,
        message: 'Login successful',
        user: userSession,
        redirect: user.role === 'admin' ? '/admin' : '/dashboard'
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle timeout errors
    if (error.message === 'Database query timeout') {
      return res.status(504).json({
        success: false,
        message: 'Database request timed out. Please try again.'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

// Session check endpoint (optional)
app.get('/api/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ 
      loggedIn: true, 
      user: req.session.user 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout endpoint
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  // res.json({ success: true, message: 'Logged out successfully' });
  return res.redirect('/login');
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/admin', (req, res) => {
  res.render('admin', { 
    user: req.session.user,
    project: req.session.user.project || 'aurora' 
  });
});

// Around line 2720 - Tabs route
app.get('/tabs/:tabName', async (req, res) => {
  try {
    console.log(`=== TAB REQUEST: ${req.params.tabName} ===`);
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { tabName } = req.params;
    const userMobile = req.session.user.mobile;
    const userName = req.session.user.name;
    const projectName = req.session.user.project || 'aurora';
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const projectDB = connection.useDb(projectName);
    
    // ... rest of the code
    
    let responseData = {
      activeTab: tabName,
      financialData: null,
      constructionProgress: null,
      customizationData: null,
      gallery: null
    };
    
    if (tabName === 'financial-transparency') {
      console.log('Fetching financial transparency data');
      const shareholderDoc = await projectDB.collection('shareholder').findOne({});
      let shareholder = null;
      if (shareholderDoc && shareholderDoc.shareholder) {
        shareholder = shareholderDoc.shareholder.find(sh => sh.mobile === userMobile);
      }
      const costDoc = await projectDB.collection('cost').findOne({ project: projectName });
      responseData.financialData = await generateFinancialData(shareholder, costDoc);
      
    } else if (tabName === 'construction-progress') {
      console.log('Fetching construction progress data');
      const milestoneDoc = await projectDB.collection('milestone').findOne({ project: projectName });
      responseData.constructionProgress = generateConstructionProgressFromDB(milestoneDoc);
      
    } 
    else if (tabName === 'customization') {
  console.log('Fetching customization data for user:', userName);
  const customizationDoc = await projectDB.collection('customization').findOne({});
  console.log('Customization document found:', !!customizationDoc);
  if (customizationDoc) {
    console.log('Has selection array:', !!customizationDoc.selection);
    console.log('Selection length:', customizationDoc.selection?.length);
  }
  responseData.customizationData = generateCustomizationFromDB(customizationDoc, userName);
}
 else if (tabName === 'gallery') {
      console.log('Fetching gallery data');
      const mediaDoc = await projectDB.collection('media').findOne({ project: projectName });
      let galleryItems = [];
      if (mediaDoc && mediaDoc.resource && Array.isArray(mediaDoc.resource)) {
        galleryItems = mediaDoc.resource.map(item => ({
          name: item.name || 'Untitled',
          description: item.description || '',
          date: item.date || '',
          url: item.url || '',
          type: item.mediaType || (item.url && item.url.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video' : 'photo'),
          filename: item.filename || ''
        }));
      }
      responseData.gallery = {
        title: "Project Gallery",
        subtitle: "Browse through construction progress photos and videos",
        items: galleryItems
      };
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error loading tab data:', error);
    console.error('Error stack:', error.stack);
    
    const { tabName } = req.params;
    const errorResponse = {
      activeTab: tabName,
      financialData: tabName === 'financial-transparency' ? {
        ...financialData,
        projectCostBreakdown: {
          ...financialData.projectCostBreakdown,
          vouchers: {
            ...financialData.projectCostBreakdown.vouchers,
            items: []
          }
        }
      } : null,
      constructionProgress: tabName === 'construction-progress' ? constructionProgress : null,
      customizationData: tabName === 'customization' ? customizationData : null,
      gallery: tabName === 'gallery' ? {
        title: "Project Gallery",
        subtitle: "Browse gallery",
        items: []
      } : null
    };
    
    res.json(errorResponse);
  }
});

// Around line 2870 - Customization tab
app.get('/tabs/customization', async (req, res) => {
  try {
    console.log('=== CUSTOMIZATION TAB REQUEST ===');
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userName = req.session.user.name;
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const auroraDB = connection.useDb('aurora');
    
    // ... rest of the code
    // Fetch REAL customization data - FIXED QUERY
    // Don't filter by project since your data doesn't have project field
    const customizationDoc = await auroraDB.collection('customization').findOne({});
    console.log('Customization document found:', !!customizationDoc);
    if (customizationDoc) {
      console.log('Customization document structure:', {
        hasSelection: !!customizationDoc.selection,
        selectionLength: customizationDoc.selection?.length || 0
      });
    }
    const dynamicCustomizationData = generateCustomizationFromDB(customizationDoc, userName);
    res.json({
      activeTab: 'customization',
      financialData: null,
      constructionProgress: null,
      customizationData: dynamicCustomizationData
    });
  } catch (error) {
    console.error('Error loading customization tab:', error);
    res.json({
      activeTab: 'customization',
      financialData: null,
      constructionProgress: null,
      customizationData: customizationData // Fallback to mock
    });
  }
});

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

// Update your server endpoint to use req.params.project instead of hardcoding "aurora"
app.get('/api/customization/:project', async (req, res) => {
  try {
    console.log('Customization API called for project:', req.params.project);
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('customization');

    const docs = await collection.find({}).toArray();  
    console.log('Found documents:', docs.length);
    if (!docs || docs.length === 0) {
      return res.status(404).json({ message: 'No customization found' });
    }
    const doc = docs[0];
    if (!doc.selection || !Array.isArray(doc.selection)) {
      return res.status(404).json({ message: 'No customization selections found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching customization:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customization',
      details: error.message 
    });
  }
});

// POST customization option
// Around line 3000 - POST customization
app.post('/api/customization/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }
    
    const db = connection.useDb(project);
    const collection = db.collection('customization');
    
    // ... rest of the code  
    const newSelection = req.body;
    // Validate required fields
    if (!newSelection.name || !newSelection.description || !newSelection.from || !newSelection.to) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Check if any document exists
    const existingDoc = await collection.findOne({});
    if (!existingDoc) {
      // Create first document
      const result = await collection.insertOne({
        selection: [newSelection],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Customization option added to new collection',
        insertedId: result.insertedId
      });
    } else {
      // Add to existing document
      const result = await collection.updateOne(
        { _id: existingDoc._id },
        {
          $push: { selection: newSelection },
          $set: { updated_at: new Date() }
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Customization option added to existing collection',
        modifiedCount: result.modifiedCount
      });
    }
  } catch (error) {
    console.error('Error adding customization:', error);
    res.status(500).json({ error: 'Failed to add customization option' });
  }
});

// Get all projects - Production-ready endpoint
app.get('/api/projects', async (req, res) => {
  console.log('=== FETCHING PROJECTS ===');
  
  // For production/Vercel, always return hardcoded projects immediately
  // This avoids any database connection issues
  const hardcodedProjects = ['aurora', 'greenescape', 'godhuli'];
  
  // Try to get from database, but don't wait more than 2 seconds
  try {
    const conn = getConnection();
    
    if (conn && conn.readyState === 1) {
      console.log('Database connected, attempting to fetch projects...');
      
      // Use Promise.race to timeout after 2 seconds
      const dbProjects = await Promise.race([
        (async () => {
          try {
            const adminDb = conn.db.admin();
            const result = await adminDb.listDatabases();
            
            const excludedDatabases = ['admin', 'data', 'default', 'local'];
            const projects = result.databases
              .filter(db => !excludedDatabases.includes(db.name))
              .map(db => db.name);
            
            return projects.length > 0 ? projects : hardcodedProjects;
          } catch (dbError) {
            console.error('Error listing databases:', dbError.message);
            return hardcodedProjects;
          }
        })(),
        new Promise(resolve => setTimeout(() => resolve(hardcodedProjects), 2000))
      ]);
      
      console.log('Returning projects from database:', dbProjects);
      return res.json({
        success: true,
        projects: dbProjects
      });
    }
  } catch (error) {
    console.error('Database error in projects endpoint:', error.message);
  }
  
  // Always return hardcoded projects as fallback
  console.log('Returning hardcoded projects');
  res.json({
    success: true,
    projects: hardcodedProjects
  });
});

// Create new project database with dummy data
// Around line 3190 - Create project endpoint
app.post('/api/projects/create', async (req, res) => {
  let tempClient = null;
  
  try {
    console.log('=== CREATE NEW PROJECT ===');
    const { projectName } = req.body;
    
    if (!projectName) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required'
      });
    }
    
    const sanitizedProjectName = projectName.toLowerCase().replace(/\s+/g, '');
    console.log('Creating project:', sanitizedProjectName);
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    // Check if project already exists
    const adminDb = connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    if (databases.some(db => db.name === sanitizedProjectName)) {
      return res.status(400).json({
        success: false,
        message: `Project "${sanitizedProjectName}" already exists`
      });
    }
    
    // Create a temporary connection to the new database
    // This will automatically create the database when we insert data
    const { MongoClient } = require('mongodb');
    const uri = process.env.URI;
    
    // Parse the URI and insert the new database name
    const uriParts = uri.split('/');
    const baseUri = uriParts.slice(0, -1).join('/'); // Remove last part (database name)
    const newUri = `${baseUri}/${sanitizedProjectName}`;
    
    tempClient = new MongoClient(newUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    await tempClient.connect();
    const db = tempClient.db();
    
    console.log(`Connected to new database: ${sanitizedProjectName}`);
    
    // 1. Create COST collection with dummy data
    await db.collection('cost').insertOne({
      project: sanitizedProjectName,
      cost: [
        {
          material: "Sand (test data)",
          date: "2026-02-01",
          description: "20 sacks for ground floor (test data)",
          brand: "Yousuf Traders",
          amount: 0,
          voucher_link: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/accounts-purchase-voucher-sample-design-template-28eb2b25d034784faf51550294e36397_screen.jpg?ts=1685555955"
        }
      ],
      updated_at: new Date()
    });
    console.log('✅ Cost collection created');
    
    // 2. Create CUSTOMIZATION collection with dummy data
    await db.collection('customization').insertOne({
      selection: [
        {
          name: "Tiles Preference",
          description: "Tiles for floors",
          from: "04-02-2026",
          to: "14-02-2026",
          option_1: {
            details: "Xian tiles from China",
            url: "https://www.shutterstock.com/image-photo/colorful-floral-iznik-ceramic-tile-260nw-2652486655.jpg",
            voters: []
          },
          option_2: {
            details: "Thai brand tiles",
            url: "https://media.istockphoto.com/id/482833002/photo/ancient-ceramic-tile-decorated-with-thai-art.jpg?s=612x612&w=0&k=20&c=W7APRWrzhUt6wU_Dl-411zyPC5hkzTKPbSS2yAxwx7U=",
            voters: []
          },
          option_3: {
            details: "Hua tiles of Hong Kong",
            url: "https://cdna.artstation.com/p/media_assets/images/images/000/508/786/large/ThaiTempleWallPattern_MainRef.jpg?1570417463",
            voters: []
          }
        }
      ],
      updated_at: new Date()
    });
    console.log('✅ Customization collection created');
    
    // 3. Create MEDIA collection with dummy data
    await db.collection('media').insertOne({
      resource: [
        {
          name: "Groundwork",
          description: "Initial Task Set",
          date: "02-02-2026",
          url: "https://www.eclcivils.co.uk/wp-content/uploads/2019/09/HR-resize.rpa-19-1024x683.jpg"
        }
      ],
      updated_at: new Date()
    });
    console.log('✅ Media collection created');
    
    // 4. Create MILESTONE collection with dummy data
    await db.collection('milestone').insertOne({
      project: sanitizedProjectName,
      milestone: [
        {
          description: "Main Gate",
          planned_date: "06-02-2026",
          completion_date: "",
          status: "Planned",
          note: "",
          updated_at: new Date()
        }
      ],
      updated_at: new Date()
    });
    console.log('✅ Milestone collection created');
    
    // 5. Create SHAREHOLDER collection with dummy data
    // Generate admin ID
    const adminId = `${sanitizedProjectName.substring(0, 2)}-admin-1`;
    
    await db.collection('shareholder').insertOne({
      shareholder: [
        {
          id: adminId,
          project: sanitizedProjectName,
          name: "Project Admin",
          flat_number: "Admin",
          email: `admin@${sanitizedProjectName}.com`,
          mobile: "01700000000",
          password: "Admin@123",
          total_installments: 0,
          installment_amount: 0,
          role: "admin",
          payments: []
        }
      ]
    });
    console.log('✅ Shareholder collection created with admin user');
    console.log(`✅ Project "${sanitizedProjectName}" created successfully!`);
    
    res.json({
      success: true,
      message: `Project "${sanitizedProjectName}" created successfully`,
      project: sanitizedProjectName,
      admin: {
        email: `admin@${sanitizedProjectName}.com`,
        password: "Admin@123",
        mobile: "01700000000"
      }
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  } finally {
    if (tempClient) {
      await tempClient.close();
      console.log('Temporary connection closed');
    }
  }
});

// Get project details from about collection
app.get('/api/project/:projectName/details', async (req, res) => {
  try {
    console.log('=== FETCHING PROJECT DETAILS ===');
    const projectName = req.params.projectName.toLowerCase();
    
    console.log('Fetching details for project:', projectName);
    
    // FIX: Use getConnection() instead of conn
    const connection = getConnection();
    if (!connection || connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    const projectDB = connection.useDb(projectName);
    const collection = projectDB.collection('about');
    
    // Find the about document (assuming there's only one)
    const aboutDoc = await collection.findOne({});
    
    if (!aboutDoc) {
      console.log('No about document found for project:', projectName);
      return res.status(404).json({
        success: false,
        message: 'Project details not found'
      });
    }
    
    console.log('About document found:', {
      hasData: !!aboutDoc.data,
      hasImage: !!aboutDoc.image
    });
    
    res.json({
      success: true,
      project: {
        name: projectName,
        displayName: formatProjectDisplayName(projectName),
        data: aboutDoc.data || '',
        image: aboutDoc.image || ''
      }
    });
    
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project details',
      error: error.message
    });
  }
});

// Helper function to format project name for display
function formatProjectDisplayName(projectName) {
  const displayNames = {
    'aurora': 'UniNest Aurora',
    'godhuli': 'UniNest Godhuli',
    'greenescape': 'UniNest Green Escape'
  };
  
  return displayNames[projectName] || 
    projectName.charAt(0).toUpperCase() + projectName.slice(1).replace(/([A-Z])/g, ' $1').trim();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});