// Global function for customization selection
window.selectOption = function(category, optionIndex) {
    console.log('selectOption called:', category, optionIndex);
    const tileElement = document.querySelector(`.tile-gallery-item[data-option-index="${optionIndex}"]`);
    if (tileElement) {
        tileElement.classList.add('loading');
    }
    
    fetch('/api/customization/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            categoryIndex: 0, 
            optionNumber: optionIndex + 1
        }),
        credentials: 'include'
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Vote response:', data);
        if (data.success) {
            // Update the Your Selection section
            updateYourSelection(data.customizationData.yourSelection);
            // Update selected states in the UI
            updateSelectedStates(category, optionIndex);
            // Show success message
            showSuccessMessage('Selection updated successfully!');
            // Update the entire customization section with new data
            setTimeout(() => {
                updateCustomizationView(data.customizationData);
            }, 500);
        } else {
            throw new Error(data.message || 'Failed to update selection');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Remove loading state
        if (tileElement) {
            tileElement.classList.remove('loading');
        }
        // Show error message
        showErrorMessage('Failed to update selection: ' + error.message);
    });
};

// Function to update the entire customization view
function updateCustomizationView(customizationData) {
    console.log('Updating customization view with new data');
    const newHTML = generateCustomizationHTML(customizationData);
    const tabContent = document.getElementById('tab-content');
    if (tabContent) {
        tabContent.innerHTML = newHTML;
        setTimeout(() => {
            attachCustomizationEventListeners();
        }, 100);
    }
}

// Function to attach event listeners to customization elements
function attachCustomizationEventListeners() {
    console.log('Attaching customization event listeners');
    document.querySelectorAll('.tile-gallery-item:not(.disabled)').forEach(item => {
        const category = item.getAttribute('data-category');
        const optionIndex = parseInt(item.getAttribute('data-option-index'));
        item.onclick = function(e) {
            e.stopPropagation();
            selectOption(category, optionIndex);
        };
    });
}

// Function to update Your Selection section
function updateYourSelection(yourSelection) {
    console.log('Updating your selection:', yourSelection);
    const selectionItems = document.querySelector('.selection-items');
    if (!selectionItems) return;
    
    selectionItems.innerHTML = yourSelection.items.map(item => `
        <div class="selection-item compact">
            <div class="selection-header-compact">
                <div class="selection-title">
                    <h4>${item.name}:</h4>
                    <span class="selection-value">${item.value}</span>
                </div>
                <div class="selection-meta">
                    <div class="brand-info-inline">
                        <span class="label">Brand: </span>
                        <span class="value">${item.brand}</span>
                    </div>
                    <div class="cost-info-inline">
                        <span class="label">Upgrade: </span>
                        <span class="cost">${item.upgradeCost}</span>
                    </div>
                </div>
            </div>
            ${item.image ? `
                <div class="selected-tile-preview-compact">
                    <img src="${item.image}" alt="${item.value}" class="tile-image-compact">
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateSelectedStates(category, selectedIndex) {
    console.log('Updating selected states for category:', category, 'index:', selectedIndex);
    
    const allTileItems = document.querySelectorAll('.tile-gallery-item');
    allTileItems.forEach((item, index) => {
        const itemIndex = parseInt(item.getAttribute('data-option-index'));
        item.classList.remove('selected');
        if (itemIndex === selectedIndex) {
            item.classList.add('selected');
        }
        item.classList.remove('loading');
    });
}

function showSuccessMessage(message) {
    console.log('Showing success message:', message);
    const existingMsg = document.querySelector('.success-message, .error-message');
    if (existingMsg) existingMsg.remove();
    
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    const customizationSection = document.querySelector('.customization-section');
    if (customizationSection) {
        customizationSection.prepend(successMsg);
    } else {
        document.body.appendChild(successMsg);
    }
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

// Show temporary error message
function showErrorMessage(message) {
    console.log('Showing error message:', message);
    const existingMsg = document.querySelector('.success-message, .error-message');
    if (existingMsg) existingMsg.remove();
    
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    const customizationSection = document.querySelector('.customization-section');
    if (customizationSection) {
        customizationSection.prepend(errorMsg);
    } else {
        document.body.appendChild(errorMsg);
    }
    setTimeout(() => {
        errorMsg.remove();
    }, 5000);
}

function updateYourSelection(yourSelection) {
    const selectionItems = document.querySelector('.selection-items');
    if (!selectionItems) return;
    selectionItems.innerHTML = yourSelection.items.map(item => `
        <div class="selection-item compact">
            <div class="selection-header-compact">
                <div class="selection-title">
                    <h4>${item.name}:</h4>
                    <span class="selection-value">${item.value}</span>
                </div>
                <div class="selection-meta">
                    <div class="brand-info-inline">
                        <span class="label">Brand: </span>
                        <span class="value">${item.brand}</span>
                    </div>
                    <div class="cost-info-inline">
                        <span class="label">Upgrade: </span>
                        <span class="cost ${item.upgradeCost}">
                            ${item.upgradeCost}
                        </span>
                    </div>
                </div>
            </div>
            ${item.image ? `
                <div class="selected-tile-preview-compact">
                    <img src="${item.image}" alt="${item.value}" class="tile-image-compact">
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Function to update selected states in the UI
function updateSelectedStates(category, selectedIndex) {
    // Update tile gallery items
    const allTileItems = document.querySelectorAll('.tile-gallery-item');
    allTileItems.forEach((item, index) => {
        item.classList.remove('selected');
        if (index == selectedIndex) {
            item.classList.add('selected');
        }
    });
    
    // Update option cards if they exist
    const allOptionCards = document.querySelectorAll('.option-card');
    allOptionCards.forEach((item, index) => {
        item.classList.remove('selected');
        if (index == selectedIndex) {
            item.classList.add('selected');
        }
    });
}

// Show temporary success message
function showSuccessMessage(message) {
    // Remove any existing messages
    const existingMsg = document.querySelector('.success-message, .error-message');
    if (existingMsg) existingMsg.remove();
    
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    const customizationSection = document.querySelector('.customization-section');
    if (customizationSection) {
        customizationSection.prepend(successMsg);
    }
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

function showErrorMessage(message) {
    // Remove any existing messages
    const existingMsg = document.querySelector('.success-message, .error-message');
    if (existingMsg) existingMsg.remove();
    
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    const customizationSection = document.querySelector('.customization-section');
    if (customizationSection) {
        customizationSection.prepend(errorMsg);
    }
    setTimeout(() => {
        errorMsg.remove();
    }, 5000);
}

window.switchProject = function (projectName) {
    const popupText = document.getElementById('success-popup-text');
    if (popupText) {
        popupText.textContent = `"${projectName}" selected successfully!`;
    }
    showSuccessPopup();
    // Optional: send to server
    fetch(`/project/switch?name=${encodeURIComponent(projectName)}`).catch(err => console.warn('Switch project request failed', err));
    // Reload after popup
    setTimeout(() => {
        window.location.reload();
    }, 1200);
};

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing tabs...');
    const userMenu = document.getElementById('userMenu');
    const userDropdown = document.getElementById('userDropdown');
    const switchBtn = document.getElementById('switchProjectBtn');
    const switchMenu = document.getElementById('switchProjectMenu');
    
    if (switchBtn && switchMenu) {
        switchBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            switchMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', function () {
            switchMenu.classList.add('hidden');
        });
    }
    
    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        // Close dropdown when clicking outside
        document.addEventListener('click', function () {
            userDropdown.classList.add('hidden');
        });
    }
    
    // Initialize main tab switching
    initializeTabSwitching();
    
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
        console.log(`Setting initial tab to: ${initialTab}`);
        initialButton.click();
    } else {
        // Fallback to first tab
        const firstTabButton = document.querySelector('.tab-button');
        if (firstTabButton) {
            console.log('No initial tab found, using first tab');
            firstTabButton.click();
        }
    }
});

function initializeTabSwitching() {
    console.log('Initializing tab switching...');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContent = document.getElementById('tab-content');
    
    if (!tabButtons.length) {
        console.error('No tab buttons found!');
        return;
    }
    
    console.log(`Found ${tabButtons.length} tab buttons`);
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tabName = this.getAttribute('data-tab');
            console.log(`Tab clicked: ${tabName}`);
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);
            tabContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading ${tabName.replace('-', ' ')}...</p>
                </div>
            `;
            // MODIFIED: Direct endpoint for gallery
            let fetchUrl = `/tabs/${tabName}`;

            if (tabName === 'gallery') {
                fetchUrl = '/tabs/gallery';
            }
            
            fetch(fetchUrl, {
                credentials: 'include'
            })
                .then(response => {
                    console.log(`Response for ${tabName}:`, response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Data received for ${tabName}:`, data);
                    let contentHtml = '';
                    if (tabName === 'financial-transparency' && data.financialData) {
                        contentHtml = generateFinancialTransparencyHTML(data.financialData);
                        setTimeout(() => {
                            initializeCostTabSwitching();
                        }, 100);
                    } else if (tabName === 'construction-progress' && data.constructionProgress) {
                        contentHtml = generateConstructionProgressHTML(data.constructionProgress);
                    } else if (tabName === 'customization' && data.customizationData) {
                        contentHtml = generateCustomizationHTML(data.customizationData);
                    } else if (tabName === 'gallery' && data.gallery) {
                            contentHtml = generateGalleryHTML(data.gallery);
                    } else {
                        contentHtml = `
                            <div class="tab-pane">
                                <div class="page-header">
                                    <h1>Content Not Available</h1>
                                    <p class="subtitle">Unable to load ${tabName.replace('-', ' ')} data</p>
                                </div>
                            </div>
                        `;
                    }
                    tabContent.innerHTML = contentHtml;
                    attachImagePreviewListeners();
                    console.log(`Tab ${tabName} loaded successfully`);
                })
                .catch(error => {
                    console.error(`Error loading tab ${tabName}:`, error);
                    tabContent.innerHTML = `
                        <div class="tab-pane">
                            <div class="page-header">
                                <h1>Error</h1>
                                <p class="subtitle">Unable to load content</p>
                            </div>
                        </div>
                    `;
                });
        });
    });
    console.log('Tab switching initialized');
}

// Load initial cost tab content
function loadInitialCostTabContent() {
    const activeTabButton = document.querySelector('.cost-tab-button.active');
    if (activeTabButton) {
        const tabId = activeTabButton.getAttribute('data-tab-id');
        loadCostTabContent(tabId);
    }
}

// FIXED: loadCostTabContent function
function loadCostTabContent(tabId) {
    const costTabContent = document.getElementById('cost-tab-content');
    if (!costTabContent) return;
    
    // Show loading state
    costTabContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading cost breakdown...</p>
        </div>
    `;
    
    fetch(`/cost-tabs/${tabId}`, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        console.log('Cost tab data received:', data);
        if (data.success && data.costBreakdown) {
            updateCostTabContent(data.costBreakdown);
        } else {
            throw new Error('Invalid response format');
        }
    })
    .catch(error => {
        console.error('Error loading cost tab:', error);
        costTabContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p>Error loading content. Please try again.</p>
            </div>
        `;
    });
}

function initializeCostTabSwitching() {
    console.log('Initializing cost tab switching...');
    const costTabButtons = document.querySelectorAll('.cost-tab-button');
    const costTabContent = document.querySelector('.cost-tab-content');
    
    if (!costTabButtons.length) {
        console.log('No cost tab buttons found');
        return;
    }
    
    console.log(`Found ${costTabButtons.length} cost tab buttons`);
    
    costTabButtons.forEach(button => {
        // Remove any existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Get fresh references
    const freshButtons = document.querySelectorAll('.cost-tab-button');
    
    freshButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const tabId = this.getAttribute('data-tab-id');
            console.log('Cost tab clicked:', tabId);
            
            // Update active tab button
            freshButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            const costTabContent = document.querySelector('.cost-tab-content');
            if (!costTabContent) {
                console.error('No cost tab content element found');
                return;
            }
            
            // Show loading state
            costTabContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
            
            // Fetch and update cost breakdown content
            fetch(`/cost-tabs/${tabId}`, {
                credentials: 'include'
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('Cost tab data received:', data);
                    if (data.success && data.costBreakdown) {
                        updateCostBreakdownContent(data.costBreakdown);
                    } else {
                        throw new Error('Invalid response format');
                    }
                })
                .catch(error => {
                    console.error('Error switching cost tabs:', error);
                    costTabContent.innerHTML = `
                        <div class="error">
                            <i class="fas fa-exclamation-circle fa-2x"></i>
                            <p>Failed to load tab content</p>
                        </div>
                    `;
                });
        });
    });
    
    // Click the first active button to load initial content
    const activeButton = Array.from(freshButtons).find(btn => btn.classList.contains('active'));
    if (activeButton) {
        console.log('Found active cost tab button, triggering click');
        activeButton.click();
    } else if (freshButtons.length > 0) {
        console.log('No active cost tab, clicking first button');
        freshButtons[0].click();
    }
}

function updateCostBreakdownContent(costBreakdown) {
    const costTabContent = document.querySelector('.cost-tab-content');
    if (!costTabContent) return;
    
    if (costBreakdown.activeTab === 'cost-overview') {
        costTabContent.innerHTML = generateCostOverviewHTML(costBreakdown.costOverview);
    } else {
        costTabContent.innerHTML = generateVoucherVerificationHTML(costBreakdown.vouchers);
    }
}

function showSuccessPopup() {
    const popup = document.getElementById('success-popup');
    if (!popup) return;

    popup.classList.remove('hidden');

    setTimeout(() => {
        popup.classList.add('hidden');
    }, 2500);
}

function generateFinancialTransparencyHTML(data) {
    console.log('Generating financial transparency HTML with data:', {
        title: data.title,
        outstandingBalance: data.outstandingBalance,
        rdcLogItems: data.rdcLog?.items?.length || 0,
        voucherItems: data.projectCostBreakdown?.vouchers?.items?.length || 0
    });
    
    return `
        <div class="tab-pane">
            <div class="page-header">
                <h1>${data.title || 'Financial Transparency'}</h1>
                <p class="subtitle">${data.subtitle || 'Clear, auditable records for your share'}</p>
            </div>
            
            <div class="balance-card">
                <div class="balance-left">
                    <h3>Outstanding Balance (in BDT)</h3>
                    <div class="balance-amount">${data.outstandingBalance || '0'}</div>
                </div>
                <div class="balance-right">
                    <div class="due-date-label">Due Date</div>
                    <div class="due-date">${data.nextDueDate?.date || 'N/A'}</div>
                    <div class="due-installment">${data.nextDueDate?.installment || 'N/A'}</div>
                </div>
            </div>
            
            <div class="section-divider">
                <hr>
            </div>
            
            <div class="payment-sections">
                <div class="payment-section">
                    <div class="section-header">
                        <h2>${data.rdcLog?.title || 'Completed Payments'}</h2>
                        <p class="section-subtitle">${data.rdcLog?.subtitle || 'All payments made by you'}</p>
                    </div>
                    <div class="payment-items">
                        ${(data.rdcLog?.items || []).map(item => `
                            <div class="payment-item ${item.status || 'completed'}">
                                <div class="payment-item-header">
                                    <div class="payment-status">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="payment-info">
                                        <h4>${item.name || 'Payment'}</h4>
                                        <p class="payment-date">${item.date || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="payment-amounts">
                                    <span class="amount-badge paid">${item.paidAmount || '৳0'}</span>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${(!data.rdcLog?.items || data.rdcLog.items.length === 0) ? `
                            <div class="no-payments">
                                <i class="fas fa-info-circle"></i>
                                <p>No completed payments found</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Project Cost Breakdown Section -->
            <div class="section-divider">
                <hr>
            </div>
            
            <div class="project-cost-breakdown">
                <div class="section-header">
                    <h2>${data.projectCostBreakdown?.title || 'Project Cost Breakdown'}</h2>
                    <p class="section-subtitle">${data.projectCostBreakdown?.subtitle || 'Transparent view of construction expenditure'}</p>
                </div>
                
                <!-- Cost Breakdown Tabs -->
                <div class="cost-tabs">
                    ${(data.projectCostBreakdown?.tabs || [
                        { id: "cost-overview", name: "Cost Overview", active: true },
                        { id: "voucher-verification", name: "Voucher Verification", active: false }
                    ]).map(tab => `
                        <button class="cost-tab-button ${tab.active ? 'active' : ''}" 
                                data-tab-id="${tab.id}">
                            ${tab.name}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Cost Breakdown Content (Will be loaded via AJAX) -->
                <div id="cost-tab-content" class="cost-tab-content">
                    <!-- Content will be loaded here via JavaScript -->
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading cost breakdown...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

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
    console.log('Generating construction progress HTML with data:', {
        title: data.title,
        timelineItems: data.timeline?.length || 0
    });
    
    return `
        <div class="tab-pane">
            <div class="page-header">
                <h1>${data.title || 'Construction Progress'}</h1>
                <p class="subtitle">${data.subtitle || 'Real-time updates on development milestones'}</p>
            </div>
            
            <!-- Project Timeline -->
            <div class="construction-timeline">
                <h3 class="timeline-title">Project Timeline</h3>
                <div class="timeline-list">
                    ${(data.timeline || []).map(step => `
                        <div class="timeline-item ${step.status || 'pending'}">
                            <div class="timeline-left">
                                <div class="timeline-dot"></div>
                                <div class="timeline-line"></div>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-header">
                                    <h4>${step.title || 'Milestone'}</h4>
                                    <span class="status-badge ${step.status || 'pending'}">
                                        ${step.label || 'Pending'}
                                    </span>
                                </div>
                                
                                <p class="timeline-date">
                                    ${step.startDate || 'N/A'} – ${step.endDate || 'N/A'}
                                </p>
                                ${step.note ? `
                                    <div class="timeline-alert">
                                        <i class="fas fa-exclamation-circle"></i>
                                        ${step.note}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    
                    ${(!data.timeline || data.timeline.length === 0) ? `
                        <div class="no-timeline">
                            <i class="fas fa-info-circle"></i>
                            <p>No timeline data available</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function generateCustomizationHTML(data) {
    console.log('Generating customization HTML with data:', {
        title: data.title,
        categories: data.customizationOptions?.categories?.length || 0,
        selections: data.yourSelection?.items?.length || 0
    });
    
    return `
        <div class="tab-pane">
            <!-- PAGE HEADER -->
            <div class="page-header">
                <h1>${data.title || 'Unit Customization'}</h1>
                <p class="subtitle">${data.subtitle || 'Personalize your living space'}</p>
            </div>
            
            <div class="customization-section">
                <div class="section-header">
                    <h2>${data.customizationOptions?.title || 'Available Customization Options'}</h2>
                    <p class="section-subtitle">${data.customizationOptions?.subtitle || 'Select your preferred finishes and materials'}</p>
                </div>
                
                ${(data.customizationOptions?.categories || []).map(category => `
                    <div class="category-section">
                        <h3>${category.name || 'Category'}</h3>
                        <div class="selection-window ${category.windowStatus === 'closed' ? 'closed' : 'open'}">
                            <div class="window-label">
                                <i class="fas fa-calendar-alt"></i>
                                Customization Window:
                            </div>
                            <div class="window-dates">${category.window || 'N/A'}</div>
                            <div class="window-status">
                                <span class="status-badge ${category.windowStatus || 'closed'}">
                                    <i class="fas fa-${category.windowStatus === 'closed' ? 'lock' : 'unlock'}"></i>
                                    Selection ${category.windowStatus === 'closed' ? 'Closed' : 'Open'}
                                </span>
                            </div>
                        </div>
                        <div class="options-list">
                            ${(category.options || []).map((option, index) => `
                                <div class="option-card ${option.selected ? 'selected' : ''} 
                                                      ${category.windowStatus === 'closed' ? 'disabled' : ''}"
                                     data-category="${(category.name || 'category').toLowerCase().replace(/ /g, '-')}"
                                     data-option-index="${index}">
                                    ${option.image ? `
                                        <div class="option-image">
                                            <img src="${option.image}" alt="${option.name || 'Option'}" class="tile-preview">
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
                                            <h4>${option.name || 'Option'}</h4>
                                        </div>
                                    </div>
                                    <div class="option-details">
                                        <div class="detail-row">
                                            <span class="label">Brand:</span>
                                            <span class="value">${option.brand || 'N/A'}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="label">Surface:</span>
                                            <span class="value">${option.surface || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div class="option-cost">
                                        <span class="cost-label">Total Cost:</span>
                                        <span class="cost-amount ${option.upgradeCost ? 'upgrade' : ''}">
                                            ${option.upgradeCost || '৳0'}
                                        </span>
                                    </div>
                                    
                                    ${category.windowStatus !== 'closed' ? `
                                        <button class="select-button" 
                                                onclick="selectOption('${(category.name || 'category').toLowerCase().replace(/ /g, '-')}', ${index})">
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
                
                ${(!data.customizationOptions?.categories || data.customizationOptions.categories.length === 0) ? `
                    <div class="no-customization">
                        <i class="fas fa-info-circle"></i>
                        <p>No customization options available</p>
                    </div>
                ` : ''}
                
                <div class="customization-section">
                    <div class="section-header">
                        <h2>${data.yourSelection?.title || 'Your Current Selection'}</h2>
                        <p class="section-subtitle"><strong>${data.yourSelection?.subtitle || 'You can modify these until the customization window closes.'}</strong></p>
                    </div>
                    <div class="selection-items">
                        ${(data.yourSelection?.items || []).map(item => `
                            <div class="selection-item">
                                <div class="selection-header">
                                    <h4>${item.name || 'Item'}:</h4>
                                    <span class="selection-value">${item.value || 'Not selected'}</span>
                                </div>
                                <div class="selection-details">
                                    <div class="brand-info">
                                        <span class="label">Brand:</span>
                                        <span class="value">${item.brand || 'N/A'}</span>
                                    </div>
                                    <div class="cost-info">
                                        <span class="label">Total Cost:</span>
                                        <span class="cost">
                                            ${item.upgradeCost || '৳0'}
                                        </span>
                                    </div>
                                </div>
                                ${item.image ? `
                                    <div class="selected-tile-preview">
                                        <img src="${item.image}" alt="${item.value || 'Selection'}" class="tile-image">
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                        
                        ${(!data.yourSelection?.items || data.yourSelection.items.length === 0) ? `
                            <div class="no-selections">
                                <i class="fas fa-info-circle"></i>
                                <p>No selections made yet</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachImagePreviewListeners() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-img');
    const closeBtn = document.querySelector('.image-modal-close');
    
    if (!modal || !modalImg) return;
    
    document.querySelectorAll('.status-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = function (e) {
            e.stopPropagation();
            modalImg.src = this.dataset.full || this.src;
            modal.classList.remove('hidden');
        };
    });
    
    if (closeBtn) {
        closeBtn.onclick = function (e) {
            e.stopPropagation();
            modal.classList.add('hidden');
            modalImg.src = '';
        };
    }
    
    modal.onclick = function () {
        modal.classList.add('hidden');
        modalImg.src = '';
    };
}

function initializeGalleryModal() {
    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.innerHTML = `
        <div class="gallery-modal-content">
            <span class="gallery-modal-close">&times;</span>
            <button class="gallery-modal-prev">&#10094;</button>
            <button class="gallery-modal-next">&#10095;</button>
            <div class="gallery-modal-loading" style="display: none;">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
            <img class="gallery-modal-media" src="" alt="" style="display: none;">
            <video class="gallery-modal-media" controls style="display: none;"></video>
            <div class="gallery-modal-caption"></div>
            <div class="gallery-modal-counter"></div>
        </div>
    `;
    document.body.appendChild(modal);
    
    let currentIndex = 0;
    let galleryItems = [];
    
    // Open modal function
    window.openGalleryModal = function(items, index) {
        galleryItems = items;
        currentIndex = index;
        
        const modal = document.querySelector('.gallery-modal');
        const imgEl = modal.querySelector('img');
        const videoEl = modal.querySelector('video');
        const captionEl = modal.querySelector('.gallery-modal-caption');
        const counterEl = modal.querySelector('.gallery-modal-counter');
        const loadingEl = modal.querySelector('.gallery-modal-loading');
        
        // Show loading
        loadingEl.style.display = 'flex';
        imgEl.style.display = 'none';
        videoEl.style.display = 'none';
        
        // Load media
        const item = galleryItems[currentIndex];
        
        if (item.type === 'video') {
            videoEl.src = item.url;
            videoEl.style.display = 'block';
            imgEl.style.display = 'none';
        } else {
            imgEl.src = item.url;
            imgEl.alt = item.name || 'Gallery image';
            imgEl.style.display = 'block';
            videoEl.style.display = 'none';
        }
        
        // Hide loading
        setTimeout(() => {
            loadingEl.style.display = 'none';
        }, 300);
        
        // Update caption and counter
        captionEl.innerHTML = `
            <h3>${item.name || 'Untitled'}</h3>
            <p>${item.description || ''}</p>
            <span class="gallery-date">${item.date || ''}</span>
        `;
        
        counterEl.textContent = `${currentIndex + 1} of ${galleryItems.length}`;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Close modal
    modal.querySelector('.gallery-modal-close').addEventListener('click', function() {
        closeGalleryModal();
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGalleryModal();
        }
    });
    
    // Previous button
    modal.querySelector('.gallery-modal-prev').addEventListener('click', function() {
        if (galleryItems.length > 0) {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            openGalleryModal(galleryItems, currentIndex);
        }
    });
    
    // Next button
    modal.querySelector('.gallery-modal-next').addEventListener('click', function() {
        if (galleryItems.length > 0) {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            openGalleryModal(galleryItems, currentIndex);
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const modal = document.querySelector('.gallery-modal');
        if (!modal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeGalleryModal();
        } else if (e.key === 'ArrowLeft') {
            modal.querySelector('.gallery-modal-prev').click();
        } else if (e.key === 'ArrowRight') {
            modal.querySelector('.gallery-modal-next').click();
        }
    });
}

function closeGalleryModal() {
    const modal = document.querySelector('.gallery-modal');
    const videoEl = modal.querySelector('video');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (videoEl) {
        videoEl.pause();
        videoEl.src = '';
    }
}

function generateGalleryHTML(gallery) {
    const items = gallery.items || [];
    // Store gallery items for modal
    window.currentGalleryItems = items;
    return `
        <div class="tab-pane">
            <div class="page-header">
                <h1>${gallery.title || 'Project Gallery'}</h1>
                <p class="subtitle">${gallery.subtitle || 'Browse through construction progress photos and videos'}</p>
            </div>
            ${items.length === 0 ? `
                <div class="empty-gallery">
                    <i class="fas fa-images"></i>
                    <p>No gallery items available</p>
                </div>
            ` : `
                <div class="gallery-grid">
                    ${items.map((item, index) => `
                        <div class="gallery-item" onclick="openGalleryModal(window.currentGalleryItems, ${index})">
                            ${item.type === 'video' ? `
                                <video src="${item.url}" preload="metadata" muted></video>
                            ` : `
                                <img src="${item.url}" alt="${item.name || 'Gallery image'}" loading="lazy">
                            `}
                            <div class="gallery-item-info">
                                <h4>${item.name || 'Untitled'}</h4>
                                <p>${item.description || ''}</p>
                                <span class="gallery-date">${item.date || ''}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}
// Initialize modal when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeGalleryModal();
});