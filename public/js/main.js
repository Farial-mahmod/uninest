// Global function for customization selection
window.selectOption = function(category, optionIndex) {
    // Show loading state
    const optionCard = document.querySelector(`[data-category="${category}"][data-option-index="${optionIndex}"]`);
    if (optionCard) {
        optionCard.classList.add('loading');
    }
    
    // Send selection to server
    fetch(`/customization/update?category=${category}&optionIndex=${optionIndex}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reload the customization tab to show updated selections
                const customizationButton = document.querySelector('.tab-button[data-tab="customization"]');
                if (customizationButton) {
                    customizationButton.click();
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (optionCard) {
                optionCard.classList.remove('loading');
            }
        });
};

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {

    // ===== CUSTOMIZATION STATE =====
    const customizationState = {
        flooring: null,
        kitchen: null,
        wallColor: null
    };

    // Main dashboard tabs (Financial, Construction, Customization)
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContent = document.getElementById('tab-content');
    
    // Cost breakdown tabs (Cost Overview, Voucher Verification)
    const costTabButtons = document.querySelectorAll('.cost-tab-button');
    
    // ===== MAIN TAB SWITCHING =====
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up
            
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show loading state
            tabContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
            
            // Fetch and display tab content via AJAX
            fetch(`/tabs/${tabName}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Update tab content based on active tab
                    let contentHtml = '';
                    
                    if (tabName === 'financial-transparency' && data.financialData) {
                        contentHtml = generateFinancialTransparencyHTML(data.financialData);
                    } else if (tabName === 'construction-progress' && data.constructionProgress) {
                        contentHtml = generateConstructionProgressHTML(data.constructionProgress);
                    } else if (tabName === 'customization' && data.customizationData) {
                        // Load customization data
                        contentHtml = generateCustomizationHTML(data.customizationData);
                    } else {
                        contentHtml = `<div class="tab-pane"><p>Error: Could not load data for this tab.</p></div>`;
                    }
                    
                    tabContent.innerHTML = contentHtml;

attachImagePreviewListeners();
attachCostTabListeners();



                })
                .catch(error => {
                    console.error('Error loading tab content:', error);
                    tabContent.innerHTML = `
                        <div class="tab-pane">
                            <div class="page-header">
                                <h1>Error</h1>
                                <p class="subtitle">Unable to load content</p>
                            </div>
                            <div class="coming-soon">
                                <i class="fas fa-exclamation-triangle fa-3x"></i>
                                <p>Error loading content. Please try again later.</p>
                            </div>
                        </div>
                    `;
                });
        });
    });
    
    // ===== COST BREAKDOWN TAB SWITCHING =====
    function attachCostTabListeners() {
        // Remove any existing listeners first
        document.querySelectorAll('.cost-tab-button').forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        // Get fresh references
        const freshCostButtons = document.querySelectorAll('.cost-tab-button');
        
        freshCostButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling
                
                const tabId = this.getAttribute('data-tab-id');
                
                // Update active tab button
                freshCostButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Fetch and update cost breakdown content
                fetch(`/cost-tabs/${tabId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            updateCostBreakdownContent(data.costBreakdown);
                        }
                    })
                    .catch(error => {
                        console.error('Error switching cost tabs:', error);
                        alert('Failed to switch tabs. Please try again.');
                    });
            });
        });
    }
    
    // Function to update cost breakdown content
    function updateCostBreakdownContent(costBreakdown) {
        const costTabContent = document.querySelector('.cost-tab-content');
        
        if (!costTabContent) return;
        
        if (costBreakdown.activeTab === 'cost-overview') {
            costTabContent.innerHTML = generateCostOverviewHTML(costBreakdown.costOverview);
        } else {
            costTabContent.innerHTML = generateVoucherVerificationHTML(costBreakdown.vouchers);
        }
    }
    
    // Function to generate financial transparency HTML
// Function to generate financial transparency HTML
function generateFinancialTransparencyHTML(data) {
    return `
        <div class="tab-pane">
            <div class="page-header">
                <h1>${data.title}</h1>
                <p class="subtitle">${data.subtitle}</p>
            </div>
            
            <div class="balance-card">
                <div class="balance-left">
                    <h3>Outstanding Balance (in BDT)</h3>
                    <div class="balance-amount">${data.outstandingBalance}</div>
                </div>
                
                <div class="balance-middle">
                    <div class="installment-label">Installment Number</div>
                    <div class="installment-number">6<sup>th</sup></div>
                </div>
                
                <div class="balance-right">
                    <div class="due-date-label">Next Due Date</div>
                    <div class="due-date">10-01-2026</div>
                    <div class="due-installment"></div>
                </div>
            </div>
            
            <div class="section-divider">
                <hr>
            </div>
            
            <div class="payment-sections">
                <div class="payment-section">
                    <div class="section-header">
                        <h2>${data.paymentSchedule.title}</h2>
                        <p class="section-subtitle">${data.paymentSchedule.subtitle}</p>
                    </div>
                    
                    <div class="payment-items">
                        ${data.paymentSchedule.items.map(item => `
                            <div class="payment-item ${item.status}">
                                <div class="payment-item-header">
                                    <div class="payment-status">
                                        ${item.status === 'pending' ? 
                                            '<i class="far fa-circle"></i>' : 
                                            '<i class="fas fa-check-circle"></i>'}
                                    </div>
                                    <div class="payment-info">
                                        <h4>${item.name}</h4>
                                        <p class="payment-date">@ ${item.date}</p>
                                    </div>
                                </div>
                                <div class="payment-amount">
                                    <span class="amount-badge">${item.amount}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="payment-section">
                    <div class="section-header">
                        <h2>${data.rdcLog.title}</h2>
                        <p class="section-subtitle">${data.rdcLog.subtitle}</p>
                    </div>
                    
                    <div class="payment-items">
                        ${data.rdcLog.items.map(item => `
                            <div class="payment-item ${item.status}">
                                <div class="payment-item-header">
                                    <div class="payment-status">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="payment-info">
                                        <h4>${item.name}</h4>
                                        <p class="payment-date">@ ${item.date}</p>
                                    </div>
                                </div>
                                <div class="payment-amounts">
                                    <span class="amount-badge paid">${item.paidAmount}</span>
                                </div>

                                <div class="payment-amounts">
    <a
        href="https://zenodo.org/records/18187513/files/The%20State%20of%20Quantum%20Computing%20-%20Farial%20Mahmod.pdf?download=1"
        class="amount-badge paid download-receipt"
        target="_blank"
        download
    >
        <i class="fas fa-receipt"></i>
        Download Receipt
    </a>
</div>


                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Project Cost Breakdown Section -->
            <div class="section-divider">
                <hr>
            </div>
            
            <div class="project-cost-breakdown">
                <div class="section-header">
                    <h2>${data.projectCostBreakdown.title}</h2>
                    <p class="section-subtitle">${data.projectCostBreakdown.subtitle}</p>
                </div>
                
                <!-- Cost Breakdown Tabs -->
                <div class="cost-tabs">
                    ${data.projectCostBreakdown.tabs.map(tab => `
                        <button class="cost-tab-button ${tab.active ? 'active' : ''}" 
                                data-tab-id="${tab.id}">
                            ${tab.name}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Cost Breakdown Content -->
                <div class="cost-tab-content">
                    ${data.projectCostBreakdown.activeTab === 'cost-overview'
                        ? generateCostOverviewHTML(data.projectCostBreakdown.costOverview)
                        : generateVoucherVerificationHTML(data.projectCostBreakdown.vouchers)
                    }
                </div>
            </div>
        </div>
    `;
}
    
    // Function to generate cost overview HTML
    function generateCostOverviewHTML(costOverview) {
        return `
            <div class="cost-overview">
                <div class="cost-summary-cards">
                    <div class="cost-card">
                        <h3>Total Projected Cost</h3>
                        <div class="cost-amount projected">
                            ${costOverview.totalProjectedCost}
                        </div>
                    </div>
                    
                    <div class="cost-card">
                        <h3>Actual Expenditure</h3>
                        <div class="cost-amount actual">
                            ${costOverview.actualExpenditure}
                        </div>
                        <div class="budget-utilization">
                            ${costOverview.budgetUtilization}% of budget utilized
                        </div>
                    </div>
                </div>
                
                <div class="expenditure-details">
                    <h3>Detailed Expenditure by Category</h3>
                    
                    <div class="category-list">
                        ${costOverview.categories.map(category => `
                            <div class="category-item">
                                <div class="category-header">
                                    <h4>${category.name}</h4>
                                    <div class="category-amounts">
                                        <span class="spent-amount">${category.spent}</span>
                                        <span class="amount-separator">/</span>
                                        <span class="budget-amount">${category.budget}</span>
                                    </div>
                                </div>
                                
                                <div class="progress-container">
                                    <div class="progress-bar" 
                                         style="width: ${category.percentage}%;
                                                background-color: ${category.color};">
                                    </div>
                                    <div class="progress-label">${category.percentage}%</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function generateVoucherVerificationHTML(vouchers) {
        return `
            <div class="voucher-verification">
                <div class="section-header">
                    <h2>${vouchers.title}</h2>
                    <p class="section-subtitle">${vouchers.subtitle}</p>
                </div>
                <div class="voucher-list">
                    ${vouchers.items.map(voucher => `
                        <div class="voucher-item">
                            <div class="voucher-left">
                                <div class="voucher-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <div class="voucher-info">
                                    <h4>${voucher.title}</h4>
                                    <p class="vendor-name">${voucher.vendor}</p>
                                    <p class="voucher-meta">
                                        ${voucher.voucherNo} • ${voucher.date}
                                    </p>
                                </div>
                            </div>
                            <div class="voucher-right">
                                <div class="voucher-amount">${voucher.amount}</div>
                                <a href="${voucher.invoiceUrl}" 
                                   target="_blank" 
                                   class="view-invoice-btn">
                                    <i class="fas fa-external-link-alt"></i>
                                    View Invoice
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateConstructionProgressHTML(data) {
        return `
            <div class="tab-pane">
                <div class="page-header">
                    <h1>${data.title}</h1>
                    <p class="subtitle">${data.subtitle}</p>
                </div>
                <!-- Project Timeline -->
                <div class="construction-timeline">
                    <h3 class="timeline-title">Project Timeline</h3>
                    <div class="timeline-list">
                        ${data.timeline.map(step => `
                            <div class="timeline-item ${step.status}">
                                <div class="timeline-left">
                                    <div class="timeline-dot"></div>
                                    <div class="timeline-line"></div>
                                </div>
                                <div class="timeline-content">
                                    <div class="timeline-header">
                                        <h4>${step.title}</h4>
<span class="status-badge ${step.status}">
    ${step.label}
</span>
<br>
<img
    src="https://images.stockcake.com/public/3/8/6/386aacf3-17a8-4057-b42c-b7e3e00eff6b_large/construction-workers-working-stockcake.jpg"
    class="status-image"
    alt="Construction status"
    data-full="https://images.stockcake.com/public/3/8/6/386aacf3-17a8-4057-b42c-b7e3e00eff6b_large/construction-workers-working-stockcake.jpg"
/>

                                    </div>
                                    
                                    <p class="timeline-date">
                                        ${step.startDate} – ${step.endDate}
                                    </p>
                                    ${step.note
                                        ? `<div class="timeline-alert">
                                            <i class="fas fa-exclamation-circle"></i>
                                            ${step.note}
                                           </div>`
                                        : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
// Function to generate customization HTML
function generateCustomizationHTML(data) {
    return `
        <div class="tab-pane">
            <!-- PAGE HEADER -->
            <div class="page-header">
                <h1>${data.title}</h1>
                <p class="subtitle">${data.subtitle}</p>
            </div>
            

            <!-- CUSTOMIZATION OPTIONS -->
            <div class="customization-section">
                <div class="section-header">
                    <h2>${data.customizationOptions.title}</h2>
                    <p class="section-subtitle">${data.customizationOptions.subtitle}</p>
                </div>
                
                ${data.customizationOptions.categories.map(category => `
                    <div class="category-section">
                        <h3>${category.name}</h3>
                        
                        <!-- Selection Window -->
                        <div class="selection-window ${category.windowStatus === 'closed' ? 'closed' : 'open'}">
                            <div class="window-label">
                                <i class="fas fa-calendar-alt"></i>
                                Customization Window:
                            </div>
                            <div class="window-dates">${category.window}</div>
                            <div class="window-status">
                                <span class="status-badge ${category.windowStatus}">
                                    <i class="fas fa-${category.windowStatus === 'closed' ? 'lock' : 'unlock'}"></i>
                                    Selection ${category.windowStatus === 'closed' ? 'Closed' : 'Open'}
                                </span>
                            </div>
                        </div>
                    
                        
                        <!-- Options List (Detailed view) -->
                        <div class="options-list">
                            ${category.options.map((option, index) => `
                                <div class="option-card ${option.selected ? 'selected' : ''} 
                                                      ${category.windowStatus === 'closed' ? 'disabled' : ''}"
                                     data-category="${category.name.toLowerCase().replace(/ /g, '-')}"
                                     data-option-index="${index}">
                                    
                                    ${option.image ? `
                                        <div class="option-image">
                                            <img src="${option.image}" alt="${option.name}" class="tile-preview">
                                        </div>
                                    ` : ''}
                                    
                                    <div class="option-header">
                                        <div class="option-radio">
                                            ${category.windowStatus === 'closed' ? 
                                                '<i class="fas fa-lock"></i>' : 
                                                option.selected ? 
                                                    '<i class="fas fa-check-circle"></i>' : 
                                                    '<i class="far fa-circle"></i>'}
                                        </div>
                                        <div class="option-name">
                                            <h4>${option.name}</h4>
                                        </div>
                                    </div>
                                    
                                    <div class="option-details">
                                        <div class="detail-row">
                                            <span class="label">Brand:</span>
                                            <span class="value">${option.brand}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="label">Surface:</span>
                                            <span class="value">${option.surface}</span>
                                        </div>
                                    </div>
                                    
                                    ${option.upgradeCost ? `
                                        <div class="option-cost">
                                            <span class="cost-label">Total Cost:</span>
                                            <span class="cost-amount upgrade">${option.upgradeCost}</span>
                                        </div>
                                    ` : `
                                        <div class="option-cost">
                                            <span class="cost-label">Total Cost:</span>
                                            <span class="cost-amount">৳11,000</span>
                                        </div>
                                    `}
                                    
                                    ${category.windowStatus !== 'closed' ? `
                                        <button class="select-button" 
                                                onclick="selectOption('${category.name.toLowerCase().replace(/ /g, '-')}', ${index})">
                                            ${option.selected ? 
                                                '<i class="fas fa-check"></i> Selected' : 
                                                'Select Option'}
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                
                <!-- Notice for closed window -->
                ${data.customizationOptions.categories[0] && data.customizationOptions.categories[0].windowStatus === 'closed' ? `
                    <div class="window-notice">
                        <div class="notice-icon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="notice-text">
                            ${data.customizationOptions.notice}
                        </div>
                    </div>
                ` : ''}

                            <!-- YOUR SELECTIONS -->
            <div class="customization-section">
                <div class="section-header">
                    <h2>${data.yourSelection.title}</h2>
                    <p class="section-subtitle"><strong>${data.yourSelection.subtitle}</strong></p>
                </div>
                
                <div class="selection-items">
                    ${data.yourSelection.items.map(item => `
                        <div class="selection-item">
                            <div class="selection-header">
                                <h4>${item.name}:</h4>
                                <span class="selection-value">${item.value}</span>
                            </div>
                            <div class="selection-details">
                                <div class="brand-info">
                                    <span class="label">Brand:</span>
                                    <span class="value">${item.brand}</span>
                                </div>
                                <div class="cost-info">
                                    <span class="label">Total Cost:</span>
                                    <span class="cost ${ 'cost' }">
                                        ${item.upgradeCost}
                                    </span>
                                </div>
                            </div>
                            ${item.image ? `
                                <div class="selected-tile-preview">
                                    <img src="${item.image}" alt="${item.value}" class="tile-image">
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            </div>
        </div>
    `;
}

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab') || 'financial-transparency';
        
        const correspondingButton = document.querySelector(`.tab-button[data-tab="${tabParam}"]`);
        if (correspondingButton) {
            correspondingButton.click();
        }
    });
    
    // Initialize the first tab on page load
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || 'financial-transparency';
    const initialButton = document.querySelector(`.tab-button[data-tab="${initialTab}"]`);
    if (initialButton) {
        initialButton.click();
    } else {
        // Fallback to first tab
        const firstTabButton = document.querySelector('.tab-button');
        if (firstTabButton) {
            firstTabButton.click();
        }
    }

function attachImagePreviewListeners() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-img');
    const closeBtn = document.querySelector('.image-modal-close');

    if (!modal || !modalImg || !closeBtn) return;

    document.querySelectorAll('.status-image').forEach(img => {
        img.style.cursor = 'zoom-in';

        img.onclick = function (e) {
            e.stopPropagation();
            modalImg.src = this.dataset.full || this.src;
            modal.classList.remove('hidden');
        };
    });

    closeBtn.onclick = function (e) {
        e.stopPropagation();
        modal.classList.add('hidden');
        modalImg.src = '';
    };

    modal.onclick = function () {
        modal.classList.add('hidden');
        modalImg.src = '';
    };
}
});