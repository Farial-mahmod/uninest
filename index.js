const express = require('express');
const path = require('path');
const app = express();

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));

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
    activeTab: "cost-overview", // or "voucher-verification"
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


// Dashboard page (changed from home to dashboard)
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

// NEW: Route to handle cost breakdown tab switching
app.get('/cost-tabs/:tabId', (req, res) => {
  const { tabId } = req.params;
  
  // Update active tab in the data
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

// Update the /customization/update route to properly handle selections
app.get('/customization/update', (req, res) => {
  const { category, optionIndex } = req.query;
  
  // Find the category
  const categoryIndex = customizationData.customizationOptions.categories
    .findIndex(cat => cat.name.toLowerCase().replace(/ /g, '-') === category);
  
  if (categoryIndex >= 0 && optionIndex >= 0) {
    const cat = customizationData.customizationOptions.categories[categoryIndex];
    
    // Reset all options to not selected
    cat.options.forEach(opt => {
      opt.selected = false;
    });
    
    // Select the chosen option
    if (optionIndex >= 0 && optionIndex < cat.options.length) {
      const selectedOption = cat.options[optionIndex];
      selectedOption.selected = true;
      
      // Update your selection based on chosen option
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

// Add API route for customization
app.get('/customization/update', (req, res) => {
  const { category, optionIndex } = req.query;
  
  // In a real app, you would update the database here
  // For now, we'll just update the mock data
  if (customizationData.customizationOptions.categories[0]) {
    // Reset all options to not selected
    customizationData.customizationOptions.categories[0].options.forEach(opt => {
      opt.selected = false;
    });
    
    // Select the chosen option
    if (optionIndex >= 0 && optionIndex < customizationData.customizationOptions.categories[0].options.length) {
      customizationData.customizationOptions.categories[0].options[optionIndex].selected = true;
      
      // Update your selection based on chosen option
      const selectedOption = customizationData.customizationOptions.categories[0].options[optionIndex];
      customizationData.yourSelection.items[0] = {
        name: "Room Tile",
        value: selectedOption.name,
        brand: selectedOption.brand,
        upgradeCost: selectedOption.upgradeCost
      };
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