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
// Update CORS configuration - make sure this is before other middleware
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
  store: new (require('express-session').MemoryStore)(), // Add memory store
  cookie: {
    secure: false, // Set to FALSE for local development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Changed from strict
    path: '/', // Explicitly set path
  }
}));

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

//
// Gallery route - fetch media data
app.get('/tabs/gallery', async (req, res) => {
  try {
    console.log('=== GALLERY TAB REQUEST ===');
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const project = req.session.user.project || 'aurora';
    console.log('Fetching gallery for project:', project);
    
    // Use the correct database
    const projectDB = conn.useDb(project.toLowerCase());
    const collection = projectDB.collection('media');
    
    // Find the media document
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
    
    if (!userMobile) {
      console.log('No mobile in session');
      return res.redirect('/login');
    }
    
    console.log('Fetching REAL data for mobile:', userMobile);
    
    // CORRECTED: Use aurora database instead of default connection
    const auroraDB = conn.useDb('aurora');
    
    // 1. Fetch shareholder data from aurora database
    const shareholderDoc = await auroraDB.collection('shareholder').findOne({
      "shareholder.mobile": userMobile
    });
    
    let shareholder = null;
    if (shareholderDoc && shareholderDoc.shareholder) {
      shareholder = shareholderDoc.shareholder.find(sh => sh.mobile === userMobile);
      console.log('Found REAL shareholder:', shareholder?.name);
    } else {
      console.log('No shareholder found in database');
    }
    
    // 2. Fetch cost data from aurora database
    const costDoc = await auroraDB.collection('cost').findOne({ project: "aurora" });
    
    // 3. Fetch construction progress from aurora database
    const milestoneDoc = await auroraDB.collection('milestone').findOne({ project: "aurora" });
    
    // 4. Fetch customization data from aurora database
    const customizationDoc = await auroraDB.collection('customization').findOne({ project: "aurora" });
    
    // 5. Fetch media data from aurora database
    const mediaDoc = await auroraDB.collection('media').findOne({ project: "aurora" });
    
    // Generate REAL financial data
    const dynamicFinancialData = await generateFinancialData(shareholder, costDoc);
    
    // Generate REAL construction progress data
    const dynamicConstructionProgress = generateConstructionProgressFromDB(milestoneDoc);
    
    // Generate REAL customization data
    const dynamicCustomizationData = generateCustomizationFromDB(customizationDoc);
    
    // Add media to construction progress
    if (mediaDoc && mediaDoc.resource) {
      dynamicConstructionProgress.media = mediaDoc.resource;
    }
    
    console.log('Using REAL data for dashboard:', {
      financial: !!dynamicFinancialData,
      construction: !!dynamicConstructionProgress,
      customization: !!dynamicCustomizationData,
      shareholderFound: !!shareholder
    });
    
    res.render('index', {
      activeTab: 'financial-transparency',
      financialData: dynamicFinancialData,
      constructionProgress: dynamicConstructionProgress,
      customizationData: dynamicCustomizationData,
      user: req.session.user
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.render('index', {
      activeTab: 'financial-transparency',
      financialData,
      constructionProgress,
      customizationData,
      user: req.session.user
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
function generateCustomizationFromDB(customizationDoc, userName = '') {
  if (!customizationDoc || !customizationDoc.selection || !Array.isArray(customizationDoc.selection)) {
    console.log('No customization data found, using mock data');
    return customizationData; // Fallback to mock
  }
  
  console.log('Processing customization data for user:', userName);
  console.log('Customization selection items:', customizationDoc.selection.length);
  
  // Transform database data to match frontend structure
  const categories = customizationDoc.selection.map(item => {
    console.log('Processing item:', item.name);
    
    // Check which option the current user has selected
    let selectedOptionIndex = -1;
    const options = [];
    
    // Create options array from option_1, option_2, option_3
    for (let i = 1; i <= 3; i++) {
      const optionKey = `option_${i}`;
      if (item[optionKey]) {
        const option = item[optionKey];
        const isSelected = option.voters && option.voters.includes(userName);
        if (isSelected) {
          selectedOptionIndex = i - 1; // Zero-based index
        }
        
        // Create option names based on details
        let optionName = `Option ${i}`;
        if (option.details) {
          optionName = option.details.split(' ')[0] + ' Tiles'; // Extract brand name
        }
        
        options.push({
          name: optionName,
          brand: option.details || '',
          surface: 'Premium',
          image: option.url || '',
          upgradeCost: i === 1 ? '৳15,000' : i === 2 ? '৳25,000' : '৳18,000',
          selected: isSelected
        });
        
        console.log(`Option ${i}:`, { 
          selected: isSelected, 
          voters: option.voters 
        });
      }
    }
    
    // Determine window status based on dates
    const windowEnd = new Date(item.to.split('-').reverse().join('-'));
    const now = new Date();
    const windowStatus = windowEnd < now ? 'closed' : 'open';
    
    return {
      name: item.name || 'Tiles Preference',
      window: `${item.from} – ${item.to}`,
      windowStatus: windowStatus,
      options: options
    };
  });
  
  // Get user's current selections
  const userSelections = [];
  customizationDoc.selection.forEach(item => {
    for (let i = 1; i <= 3; i++) {
      const optionKey = `option_${i}`;
      if (item[optionKey] && item[optionKey].voters && item[optionKey].voters.includes(userName)) {
        const option = item[optionKey];
        userSelections.push({
          name: item.name || 'Tiles Preference',
          value: `Option ${i}`,
          brand: option.details || '',
          upgradeCost: i === 1 ? '৳15,000' : i === 2 ? '৳25,000' : '৳18,000',
          image: option.url || ''
        });
        console.log(`User selected option ${i} for ${item.name}`);
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
  
  console.log('Generated customization data:', {
    categories: result.customizationOptions.categories.length,
    userSelections: result.yourSelection.items.length
  });
  
  return result;
}

app.get('/api/debug/customization', async (req, res) => {
  try {
    const auroraDB = conn.useDb('aurora');
    const collection = auroraDB.collection('customization');
    
    // Get all documents
    const docs = await collection.find({}).toArray();
    
    console.log('Debug: Found customization documents:', docs.length);
    docs.forEach((doc, index) => {
      console.log(`Document ${index}:`, {
        id: doc._id,
        hasProjectField: 'project' in doc,
        projectValue: doc.project,
        selectionCount: doc.selection?.length || 0
      });
    });
    
    res.json({
      count: docs.length,
      documents: docs
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API to update customization selection (add user to voters array)
app.post('/api/customization/vote', async (req, res) => {
  try {
    console.log('=== CUSTOMIZATION VOTE REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Session user:', req.session.user);
    
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    const { categoryIndex, optionNumber } = req.body;
    const userName = req.session.user.name;
    const userMobile = req.session.user.mobile;
    
    console.log('User:', userName, 'selecting option:', optionNumber, 'in category:', categoryIndex);
    
    if (categoryIndex === undefined || optionNumber === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    // Use the correct database
    const auroraDB = conn.useDb('aurora');
    const collection = auroraDB.collection('customization');
    
    // Find the customization document - FIXED: Remove project filter
    const doc = await collection.findOne({});
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
    
    // Get updated document to verify
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

// Test route to check current customization data
app.get('/api/test/customization', async (req, res) => {
  try {
    const auroraDB = conn.useDb('aurora');
    const collection = auroraDB.collection('customization');
    
    const doc = await collection.findOne({});
    
    if (!doc) {
      return res.json({ message: 'No customization document found' });
    }
    
    res.json({
      message: 'Current customization data',
      data: doc
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/cost-tabs/:tabId', async (req, res) => {
  try {
    console.log('=== COST TAB REQUEST ===');
    console.log('Tab ID requested:', req.params.tabId);
    console.log('User mobile from session:', req.session.user?.mobile);
    
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userMobile = req.session.user.mobile; 
    const tabId = req.params.tabId;
    
    // Use the correct database
    const auroraDB = conn.useDb('aurora');
    
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
    
    // Find user in shareholder collection
    const shareholderDoc = await conn.db.collection('shareholder').findOne({
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
      
      // Make the request
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
    const db = conn.useDb(project);
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
        
        // Create temp file in /tmp directory (allowed on Vercel)
        tempFilePath = `/tmp/${fileName}`;
        
        // Write buffer to temp file
        await fs.promises.writeFile(tempFilePath, req.file.buffer);
        console.log('File written to temp location:', tempFilePath);
        
        // Upload from temp file
        publicUrl = await cpanelService.uploadFile(tempFilePath, fileName, `${project}/`);
        
      } else if (req.file.buffer) {
        // LOCAL with memory storage: Save buffer to local file first
        console.log('Processing file from buffer in local environment');
        
        const tempDir = 'uploads/temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        tempFilePath = path.join(tempDir, fileName);
        await fs.promises.writeFile(tempFilePath, req.file.buffer);
        
        // Upload from temp file
        publicUrl = await cpanelService.uploadFile(tempFilePath, fileName, `${project}/`);
        
      } else {
        // LOCAL with disk storage: Use existing file path
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
          // Copy from buffer
          await fs.promises.writeFile(localFilePath, req.file.buffer);
        } else if (req.file.path && fs.existsSync(req.file.path)) {
          // Copy from temp file
          await fs.promises.copyFile(req.file.path, localFilePath);
        } else if (tempFilePath && fs.existsSync(tempFilePath)) {
          // Copy from temp file created earlier
          await fs.promises.copyFile(tempFilePath, localFilePath);
        } else {
          throw new Error('No file data available for fallback');
        }
        
        publicUrl = `/uploads/${project}/${fileName}`;
        console.log('Using local fallback URL:', publicUrl);
      } else {
        // On Vercel, we can't save locally - create a placeholder URL
        publicUrl = `https://${cpanelService.config.domain}/uploads/${project}/${fileName}`;
        console.log('Created placeholder URL for Vercel:', publicUrl);
      }
    }
    
    // Clean up temporary files
    const cleanupPromises = [];
    
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      cleanupPromises.push(fs.promises.unlink(tempFilePath));
    }
    
    if (req.file.path && fs.existsSync(req.file.path) && !process.env.VERCEL) {
      cleanupPromises.push(fs.promises.unlink(req.file.path));
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
    
    const db = conn.useDb(project.toLowerCase());
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
    let result;
    
    if (!existingDoc) {
      result = await collection.insertOne({
        resource: [newResource],
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      result = await collection.updateOne(
        { _id: existingDoc._id },
        {
          $push: { resource: newResource },
          $set: { updated_at: new Date() }
        }
      );
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
    const cleanupPromises = [];
    
    if (req.file?.path && fs.existsSync(req.file.path) && !process.env.VERCEL) {
      cleanupPromises.push(fs.promises.unlink(req.file.path));
    }
    
    if (req.file?.buffer && req.file.originalname) {
      // Try to cleanup temp file if it was created
      const tempFileName = `/tmp/${Date.now()}-${req.file.originalname}`;
      if (fs.existsSync(tempFileName)) {
        cleanupPromises.push(fs.promises.unlink(tempFileName));
      }
    }
    
    await Promise.allSettled(cleanupPromises);
    
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
    const db = conn.useDb(project);
    const collection = db.collection('media');
    const { name, description, date, url } = req.body;
    if (!name || !description || !date || !url) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newResource = {
      name,
      description,
      date,
      url,
      created_at: new Date()
    };
    // Check if any document exists
    const existingDoc = await collection.findOne({});
    if (!existingDoc) {
      // Create first document
      const result = await collection.insertOne({
        resource: [newResource],
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Media added to new collection',
        insertedId: result.insertedId
      });
    } else {
      // Add to existing document
      const result = await collection.updateOne(
        { _id: existingDoc._id },
        {
          $push: { resource: newResource },
          $set: { updated_at: new Date() }
        }
      );
      
      return res.status(201).json({
        success: true,
        message: 'Media added to existing collection',
        modifiedCount: result.modifiedCount
      });
    }

  } catch (error) {
    console.error('Error adding media:', error);
    res.status(500).json({ error: 'Failed to add media' });
  }
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

// POST new media
app.post('/api/media/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
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

app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile and password are required' 
      });
    }
    
    console.log('Login attempt for mobile:', mobile);
    
    const db = conn.useDb('aurora');
    const collection = db.collection('shareholder');
    
    const doc = await collection.findOne({ "shareholder.mobile": mobile });
    
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
    
    console.log('Login successful for:', user.name);
    
    // Create user session
    const userSession = {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      flat_number: user.flat_number,
      project: user.project,
      role: user.role,
      total_installments: user.total_installments,
      installment_amount: user.installment_amount,
      payments: user.payments
    };

    // Set session
    req.session.user = userSession;
    
    // Save session and set cookie headers
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Session error' 
        });
      }
      
      console.log('Session saved, ID:', req.sessionID);
      console.log('Setting cookie for session:', req.session.cookie);
      
      // Send success response with explicit cookie header
      res.json({
        success: true,
        message: 'Login successful',
        user: userSession,
        sessionID: req.sessionID,
        redirect: user.role === 'admin' ? '/admin' : '/dashboard'
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
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
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Routes

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/admin', (req, res) => {
  res.render('admin', { user: req.session.user });
});

// Dashboard page
// FIXED: Tab endpoint - return COMPLETE data structure
app.get('/tabs/:tabName', async (req, res) => {
  try {
    console.log(`=== TAB REQUEST: ${req.params.tabName} ===`);
    console.log('Session user:', req.session.user?.name);
    
    const { tabName } = req.params;
    
    if (!req.session.user) {
      console.log('No session user found');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userMobile = req.session.user.mobile;
    const userName = req.session.user.name;
    
    // ALWAYS use aurora database
    const auroraDB = conn.useDb('aurora');
    
    // Initialize response with null values
    let responseData = {
      activeTab: tabName,
      financialData: null,
      constructionProgress: null,
      customizationData: null,
      gallery: null
    };
    
    // Fetch data based on requested tab
    if (tabName === 'financial-transparency') {
      console.log('Fetching financial transparency data');
      
      // Fetch shareholder
      const shareholderDoc = await auroraDB.collection('shareholder').findOne({});
      let shareholder = null;
      if (shareholderDoc && shareholderDoc.shareholder) {
        shareholder = shareholderDoc.shareholder.find(sh => sh.mobile === userMobile);
      }
      
      // Fetch cost data
      const costDoc = await auroraDB.collection('cost').findOne({});
      
      // Generate financial data
      responseData.financialData = await generateFinancialData(shareholder, costDoc);
      
    } else if (tabName === 'construction-progress') {
      console.log('Fetching construction progress data');
      
      // Fetch milestone data
      const milestoneDoc = await auroraDB.collection('milestone').findOne({});
      
      // Generate construction progress
      responseData.constructionProgress = generateConstructionProgressFromDB(milestoneDoc);
      
    } else if (tabName === 'customization') {
      console.log('Fetching customization data for user:', userName);
      
      // Fetch customization data
      const customizationDoc = await auroraDB.collection('customization').findOne({});
      
      // Generate customization data
      responseData.customizationData = generateCustomizationFromDB(customizationDoc, userName);
      
    } else if (tabName === 'gallery') {
      console.log('Fetching gallery data');
      
      // Fetch media data
      const mediaDoc = await auroraDB.collection('media').findOne({});
      
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
    
    console.log(`Sending response for ${tabName} tab with data:`, {
      hasFinancialData: !!responseData.financialData,
      hasConstructionProgress: !!responseData.constructionProgress,
      hasCustomizationData: !!responseData.customizationData,
      hasGallery: !!responseData.gallery
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error loading tab data:', error);
    console.error('Error stack:', error.stack);
    
    const { tabName } = req.params;
    
    // Return mock data with COMPLETE structure
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

app.get('/tabs/customization', async (req, res) => {
  try {
    console.log('=== CUSTOMIZATION TAB REQUEST ===');
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userName = req.session.user.name;
    console.log('Fetching customization for user:', userName);
    
    // Use the correct database
    const auroraDB = conn.useDb('aurora');
    
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
    console.log('Using database:', project);
    
    const db = conn.useDb(project);
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
app.post('/api/customization/:project', async (req, res) => {
  try {
    const project = req.params.project.toLowerCase();
    const db = conn.useDb(project);
    const collection = db.collection('customization');
    
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});