// Dante Global Logistics — Professional Enterprise Management & Tracking Platform
const API_BASE = '/api';

// Application State
let currentLang = 'ar';
let currentUser = null;
let currentToken = localStorage.getItem('dante_token') || null;
let exchangeRate = 1500;
let cachedContainers = [];
let cachedPackages = [];
let currentFilter = '';

// Comprehensive Bilingual Dictionaries
const i18n = {
  ar: {
    brandName: 'دانتي للشحن واللوجستك الدولي',
    brandTagline: 'منصة الشحن الجوي والبحري المباشر من الصين إلى محافظات العراق',
    systemStatus: 'النظام متصل • يغطي 18 محافظة عراقية',
    customerRole: 'بوابة العميل',
    staffRole: 'محطة موظف المستودع',
    managerRole: 'لوحة الإدارة والتحكم المالي',
    logout: 'تسجيل الخروج',
    switchRole: 'معاينة الحسابات:',
    customerDemo: 'حساب العميل (تجريبي)',
    staffDemo: 'موظف الصين',
    managerDemo: 'المدير العام',
    
    // Stats & KPI
    kpiActiveContainers: 'الحاويات النشطة',
    kpiPackagesTracked: 'إجمالي الطرود المسجلة',
    kpiExchangeRate: 'سعر الصرف المعتمد',
    kpiDeliveryCities: 'المحافظات المخدومة',

    // Customer View
    customerCodeTitle: 'رمز العميل الشخصي (صندوق الشحن)',
    customerCodeNotice: 'استخدم هذا الرمز مع كل طلب شراء لتوجيهه إلى صندوقك تلقائياً',
    warehouseAddressTitle: 'عنوان مستودعنا في الصين (الشحن الداخلي)',
    downloadPdfBtn: 'تحميل بطاقة العنوان والملاحظات للمورد (PDF)',
    preAlertTitle: 'تسجيل طرد مسبق (Pre-Alert)',
    preAlertDesc: 'سجّل رقم تتبع شحنتك من المورد الصيني لتتبعها قبل وصولها للمستودع',
    merchantTrackingLabel: 'رقم تتبع المورد / المتجر',
    shippingMethodLabel: 'طريقة الشحن المطلوبة',
    airFreight: 'شحن جوي سريع (بالكيلوغرام)',
    seaFreight: 'شحن بحري اقتصادي (بالمتر المكعب CBM)',
    goodsTypeLabel: 'نوع البضاعة / المحتويات',
    submitPreAlertBtn: 'تسجيل الشحنة الآن',
    myPackagesTitle: 'طـرودي وشحناتي الحالية',
    searchPackagesPlaceholder: 'بحث برقم التتبع أو الرمز...',
    trackingBtn: 'تتبع المسار',
    invoiceBtn: 'عرض الفاتورة',

    // Warehouse Staff View
    intakeTerminalTitle: 'محطة الفرز والقياس واستلام الطرود',
    intakeTrackingLabel: 'رقم تتبع الشحنة من المورد (باركود)',
    intakeCustomerCodeLabel: 'رمز العميل المستلم (IRQ-XXXX)',
    dimensionsLabel: 'الأبعاد: الطول × العرض × الارتفاع (سم)',
    weightLabel: 'الوزن الفعلي القائم (كغم)',
    liveCbmCalc: 'الحجم بالمتر المكعب CBM',
    liveVolCalc: 'الوزن الحجمي المعتمد (Air)',
    selectContainerOptional: 'توجيه لحاوية شحن (اختياري)',
    saveIntakeBtn: 'حفظ الشحنة وتوليد الفاتورة التلقائية',
    scannedPackagesLogTitle: 'سجل الطرود المستلمة بالمستودع',

    // Manager View
    managerCommandTitle: 'إدارة الحاويات والشحن المجمع',
    newContainerBtn: '+ إنشاء حاوية أو رحلة جديدة',
    containerNumber: 'رقم الحاوية / الرحلة',
    containerType: 'النوع',
    containerLoad: 'حمولة الطرود والحجم CBM',
    containerFinancials: 'البيانات المالية والضريبية',
    containerSchedule: 'الجدول الزمني (الإبحار / الوصول)',
    containerStatus: 'حالة الحاوية',
    actions: 'الإجراءات',
    editContainerBtn: '✏️ تعديل تفاصيل الحاوية والتكاليف',
    
    // Container Edit Modal
    editModalTitle: 'تعديل بيانات الحاوية والتكاليف والجمارك',
    transitCostLabel: 'تكلفة شحن الحاوية الإجمالية ($ USD)',
    customsTaxLabel: 'ضريبة ورسوم الجمارك للحاوية ($ USD)',
    ratePerCbmLabel: 'سعر البيع للزبون لكل متر مكعب CBM ($ USD)',
    ratePerKgLabel: 'سعر البيع للزبون لكل كغم جوي ($ USD)',
    maxCbmLabel: 'السعة القصوى للحاوية (CBM)',
    maxWeightLabel: 'الوزن الأقصى للحاوية (كغم)',
    etdLabel: 'تاريخ المغادرة المتوقع (ETD)',
    etaLabel: 'تاريخ الوصول المتوقع للمنفذ (ETA)',
    voyageNotesLabel: 'ملاحظات الرحلة والباخرة / الناقل',
    enclosedPackagesTitle: 'الطرود المحملة داخل هذه الحاوية حالياً',
    saveContainerChangesBtn: 'حفظ التعديلات وتحديث الطرود',

    // Delivery & Manifest
    manifestTitle: 'منافست التوصيل لشركات النقل المحلية في العراق',
    manifestDesc: 'قوائم تسليم الطرود مقسمة تلقائياً حسب المحافظات مع المبالغ المطلوب تحصيلها',
    recipientName: 'المستلم',
    phone: 'الهاتف',
    deliveryAddress: 'العنوان وأقرب نقطة دالة',
    codAmount: 'المبلغ المطلوب تحصيله (دينار)',
    markOutForDelivery: 'مع المندوب للتسليم',
    markDelivered: 'تم التسليم بنجاح',

    // Invoices & Exchange
    exchangeRateModalTitle: 'سعر صرف الدولار مقابل الدينار',
    updateRateBtn: 'تحديث سعر الصرف',
  },
  en: {
    brandName: 'Dante Global Logistics',
    brandTagline: 'Air & Sea Freight Cargo Consolidation from China to Iraq',
    systemStatus: 'System Online • Serving all 18 Iraqi Governorates',
    customerRole: 'Customer Portal',
    staffRole: 'Warehouse Terminal',
    managerRole: 'Management & Financial Command Center',
    logout: 'Sign Out',
    switchRole: 'Quick Role Switch:',
    customerDemo: 'Customer (Demo)',
    staffDemo: 'China Staff',
    managerDemo: 'General Manager',
    
    // Stats & KPI
    kpiActiveContainers: 'Active Containers',
    kpiPackagesTracked: 'Total Tracked Packages',
    kpiExchangeRate: 'Base USD/IQD Rate',
    kpiDeliveryCities: 'Iraqi Cities Served',

    // Customer View
    customerCodeTitle: 'Personal Mailbox Code',
    customerCodeNotice: 'Use this code on every merchant order to route parcels automatically to your suite',
    warehouseAddressTitle: 'Overseas Hub Address (Guangzhou, China)',
    downloadPdfBtn: 'Download Supplier Address Card (PDF)',
    preAlertTitle: 'Register Pre-Alert',
    preAlertDesc: 'Enter supplier tracking number before the box arrives to speed up processing',
    merchantTrackingLabel: 'Merchant Tracking #',
    shippingMethodLabel: 'Preferred Freight Mode',
    airFreight: 'Air Express Freight (by KG)',
    seaFreight: 'Sea Ocean Freight (by CBM)',
    goodsTypeLabel: 'Commodity Type',
    submitPreAlertBtn: 'Register Pre-Alert',
    myPackagesTitle: 'My Active Packages & Shipments',
    searchPackagesPlaceholder: 'Search tracking # or code...',
    trackingBtn: 'Live Tracking',
    invoiceBtn: 'View Invoice',

    // Warehouse Staff View
    intakeTerminalTitle: 'Inbound Intake & Dimension Terminal',
    intakeTrackingLabel: 'Supplier Tracking # (Scan / Enter)',
    intakeCustomerCodeLabel: 'Recipient Customer Code (IRQ-XXXX)',
    dimensionsLabel: 'Dimensions: L × W × H (cm)',
    weightLabel: 'Gross Actual Weight (kg)',
    liveCbmCalc: 'Volume CBM',
    liveVolCalc: 'Volumetric Wt (Air)',
    selectContainerOptional: 'Assign to Container (Optional)',
    saveIntakeBtn: 'Save Intake & Generate Auto Invoice',
    scannedPackagesLogTitle: 'Recent Warehouse Intake Feed',

    // Manager View
    managerCommandTitle: 'Container & Fleet Management',
    newContainerBtn: '+ New Shipping Container / Flight',
    containerNumber: 'Container #',
    containerType: 'Type',
    containerLoad: 'Package Count & Capacity',
    containerFinancials: 'Costs & Customs Tax',
    containerSchedule: 'Schedule (ETD / ETA)',
    containerStatus: 'Lifecycle Status',
    actions: 'Actions',
    editContainerBtn: '✏️ Edit Costs, Tax & Details',

    // Container Edit Modal
    editModalTitle: 'Edit Container Costs, Taxes & Specifications',
    transitCostLabel: 'Container Total Transit Cost ($ USD)',
    customsTaxLabel: 'Port & Customs Tax Fee ($ USD)',
    ratePerCbmLabel: 'Customer Selling Rate per CBM ($ USD)',
    ratePerKgLabel: 'Customer Selling Rate per Air KG ($ USD)',
    maxCbmLabel: 'Max CBM Volume Capacity',
    maxWeightLabel: 'Max Gross Weight Capacity (KG)',
    etdLabel: 'Estimated Time of Departure (ETD)',
    etaLabel: 'Estimated Time of Arrival (ETA)',
    voyageNotesLabel: 'Vessel / Carrier & Voyage Notes',
    enclosedPackagesTitle: 'Packages Currently Enclosed in this Container',
    saveContainerChangesBtn: 'Save Updates & Cascade Milestones',

    // Delivery & Manifest
    manifestTitle: 'Iraqi 3rd-Party Local Delivery Manifest',
    manifestDesc: 'Shipments grouped automatically by destination governorates with cash collection totals',
    recipientName: 'Recipient',
    phone: 'Phone',
    deliveryAddress: 'Delivery Address & Landmark',
    codAmount: 'COD Amount (IQD)',
    markOutForDelivery: 'Out for Delivery',
    markDelivered: 'Delivered',

    // Invoices & Exchange
    exchangeRateModalTitle: 'Global USD to IQD Rate Controller',
    updateRateBtn: 'Save Exchange Rate',
  },
};

// ==========================================================================
// Authentication & Initialization
// ==========================================================================

async function initApp() {
  if (currentToken) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
      } else {
        currentToken = null;
        localStorage.removeItem('dante_token');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Fetch exchange rate
  try {
    const rRes = await fetch(`${API_BASE}/finance/exchange-rate`);
    const rData = await rRes.json();
    if (rData.usd_iqd_rate) exchangeRate = rData.usd_iqd_rate;
  } catch (e) {}

  if (!currentUser) {
    // Default demo login as Manager for full review
    await demoLogin('manager@dante.com', 'Admin@2026!');
  } else {
    render();
  }
}

async function demoLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('dante_token', currentToken);
      render();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    console.error(err);
  }
}

async function demoLoginCustomer() {
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Ahmed Al-Iraqi',
        phone: '07709998877',
        email: 'ahmed.demo@dante.com',
        password: 'Password123!',
        city: 'Baghdad',
        local_address: 'Al-Mansour, 14th Ramadan St',
        nearest_point: 'Near Mansour Mall',
      }),
    });
    if (regRes.ok) {
      const data = await regRes.json();
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('dante_token', currentToken);
      render();
      return;
    }
  } catch (e) {}

  await demoLogin('ahmed.demo@dante.com', 'Password123!');
}

function logout() {
  localStorage.removeItem('dante_token');
  currentToken = null;
  currentUser = null;
  render();
}

function setLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  render();
}

// ==========================================================================
// Main Application Renderer
// ==========================================================================

async function render() {
  const t = i18n[currentLang];
  const appEl = document.getElementById('app');
  if (!appEl) return;

  appEl.innerHTML = `
    <!-- Top Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="brand-group">
          <div class="brand-icon-box">📦</div>
          <div class="brand-text">
            <h1>${t.brandName}</h1>
            <p>${t.brandTagline}</p>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap: 0.85rem;">
          <button class="btn btn-outline btn-sm" onclick="setLanguage('${currentLang === 'ar' ? 'en' : 'ar'}')">
            🌐 ${currentLang === 'ar' ? 'English' : 'عربي'}
          </button>
          ${
            currentUser
              ? `
            <div class="user-badge">
              <div class="user-avatar">${currentUser.full_name.charAt(0)}</div>
              <div class="user-details">
                <div class="user-name">${currentUser.full_name}</div>
                <div class="user-code">${currentUser.personal_code} • ${currentUser.role.toUpperCase()}</div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="logout()" title="${t.logout}">🚪</button>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </header>

    <!-- Role Switcher Bar for Seamless Review -->
    <div class="demo-role-bar">
      <div class="demo-role-inner">
        <span>${t.switchRole}</span>
        <div class="role-chip-group">
          <button class="role-chip ${currentUser?.role === 'customer' ? 'active' : ''}" onclick="demoLoginCustomer()">
            👤 ${t.customerDemo}
          </button>
          <button class="role-chip ${currentUser?.role === 'staff' ? 'active' : ''}" onclick="demoLogin('staff@dante.com', 'Staff@2026!')">
            👷 ${t.staffDemo}
          </button>
          <button class="role-chip ${currentUser?.role === 'manager' ? 'active' : ''}" onclick="demoLogin('manager@dante.com', 'Admin@2026!')">
            👑 ${t.managerDemo}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <main>
      ${
        currentUser?.role === 'customer'
          ? await renderCustomerView(t)
          : currentUser?.role === 'staff'
          ? await renderStaffView(t)
          : await renderManagerView(t)
      }
    </main>

    <!-- Modal Dialog Host (Native HTML5 Dialog) -->
    <dialog id="appDialog" closedby="any"></dialog>
  `;

  // Attach backdrop light dismiss to dialog
  setupDialogDismiss();
}

function setupDialogDismiss() {
  const dialog = document.getElementById('appDialog');
  if (!dialog) return;
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      dialog.close();
    }
  });
}

// ==========================================================================
// Customer Portal View
// ==========================================================================

async function renderCustomerView(t) {
  let packages = [];
  try {
    const res = await fetch(`${API_BASE}/packages/my`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      packages = data.packages;
    }
  } catch (e) {}

  return `
    <!-- Top Stats -->
    <div class="grid grid-cols-4" style="margin-bottom: 1.5rem;">
      <div class="stat-card brand">
        <div>
          <div class="stat-label">${t.myPackagesTitle}</div>
          <div class="stat-value">${packages.length}</div>
          <div class="stat-sub">Active shipments in transit</div>
        </div>
        <div class="stat-icon">📦</div>
      </div>
      <div class="stat-card amber">
        <div>
          <div class="stat-label">${t.kpiExchangeRate}</div>
          <div class="stat-value">${exchangeRate.toLocaleString()} IQD</div>
          <div class="stat-sub">1 USD Exchange Benchmark</div>
        </div>
        <div class="stat-icon">💵</div>
      </div>
      <div class="stat-card emerald">
        <div>
          <div class="stat-label">Doorstep Delivery City</div>
          <div class="stat-value">${currentUser.city}</div>
          <div class="stat-sub">${currentUser.local_address}</div>
        </div>
        <div class="stat-icon">📍</div>
      </div>
      <div class="stat-card sky">
        <div>
          <div class="stat-label">Shipping Suite</div>
          <div class="stat-value">${currentUser.personal_code}</div>
          <div class="stat-sub">Dedicated Chinese Hub Code</div>
        </div>
        <div class="stat-icon">🏷️</div>
      </div>
    </div>

    <div class="grid grid-cols-3">
      <!-- Left Column: Official Supplier Address Card & Pre-Alert Form -->
      <div class="card" style="grid-column: span 1;">
        <div class="official-address-box">
          <div class="code-highlight-banner">
            <div class="title">${t.customerCodeTitle}</div>
            <div class="code">${currentUser.personal_code}</div>
            <div style="font-size: 0.75rem; opacity: 0.9;">${currentUser.full_name} • ${currentUser.phone}</div>
          </div>

          <div class="chinese-supplier-notice">
            <h5>重要提示 (Supplier Instructions):</h5>
            <p>请务必在包裹外包装和快递面单上用大字明显注明客户识别码: <strong>${currentUser.personal_code}</strong></p>
          </div>

          <div style="font-size: 0.825rem; color: var(--slate-700); line-height: 1.45; margin-bottom: 1rem;">
            <div><strong>Warehouse:</strong> Dante Global Cargo Hub (Baiyun)</div>
            <div><strong>English Address:</strong> Building 4, Logistics Park, Baiyun District, Guangzhou, China</div>
            <div style="color: #b91c1c; margin-top: 0.25rem;"><strong>中文地址:</strong> 中国广东省广州市白云区物流园4栋</div>
            <div><strong>Phone:</strong> +86 138 0013 8000</div>
          </div>

          <button class="btn btn-primary" style="width: 100%;" onclick="downloadAddressPDF()">
            📥 ${t.downloadPdfBtn}
          </button>
        </div>

        <hr style="border:0; border-top: 1px solid var(--border-color); margin: 1.5rem 0;" />

        <!-- Pre-Alert Form -->
        <div class="card-title" style="margin-bottom: 0.25rem;">📝 ${t.preAlertTitle}</div>
        <p style="font-size: 0.775rem; color: var(--slate-500); margin-bottom: 1rem;">${t.preAlertDesc}</p>

        <form onsubmit="handlePreAlert(event)">
          <div class="form-group">
            <label>${t.merchantTrackingLabel}</label>
            <input type="text" id="preAlertTracking" required placeholder="e.g. SF1402948214, YT2049182" />
          </div>
          <div class="form-group">
            <label>${t.shippingMethodLabel}</label>
            <select id="preAlertShipping">
              <option value="air">✈️ ${t.airFreight}</option>
              <option value="sea">🚢 ${t.seaFreight}</option>
            </select>
          </div>
          <div class="form-group">
            <label>${t.goodsTypeLabel}</label>
            <input type="text" id="preAlertGoods" placeholder="e.g. Smart Watch, Men Shoes, Machinery" />
          </div>
          <button type="submit" class="btn btn-amber" style="width: 100%;">
            🚀 ${t.submitPreAlertBtn}
          </button>
        </form>
      </div>

      <!-- Right Column: Active Shipments Table -->
      <div class="card" style="grid-column: span 2;">
        <div class="card-header">
          <div class="card-title">📦 ${t.myPackagesTitle} (${packages.length})</div>
          <input
            type="search"
            class="filter-input"
            placeholder="${t.searchPackagesPlaceholder}"
            oninput="filterPackagesTable(this.value)"
          />
        </div>

        ${
          packages.length === 0
            ? `<div style="text-align: center; padding: 3rem 1rem; color: var(--slate-400);">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">📦</div>
                <h4>No packages registered yet</h4>
                <p style="font-size: 0.85rem; margin-top: 0.25rem;">Submit a pre-alert or ship parcels to your suite code <strong>${currentUser.personal_code}</strong></p>
               </div>`
            : `
          <div class="table-wrapper">
            <table id="customerPackagesTable">
              <thead>
                <tr>
                  <th>Tracking Codes</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Weight / Volume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${packages
                  .map(
                    (p) => `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: var(--slate-900);">${p.internal_tracking_code}</div>
                      <div style="font-size: 0.75rem; color: var(--slate-500);">Merchant: ${p.merchant_tracking_number}</div>
                    </td>
                    <td>
                      <span class="badge ${p.shipping_type === 'air' ? 'badge-air' : 'badge-sea'}">
                        ${p.shipping_type === 'air' ? '✈️ Air' : '🚢 Sea'}
                      </span>
                    </td>
                    <td>
                      <span class="badge badge-pending">${formatStatus(p.status)}</span>
                    </td>
                    <td>
                      <div><strong>${p.weight_kg > 0 ? p.weight_kg + ' kg' : 'Measuring...'}</strong></div>
                      <div style="font-size: 0.75rem; color: var(--slate-500);">${p.cbm > 0 ? p.cbm + ' CBM' : ''}</div>
                    </td>
                    <td>
                      <div style="display:flex; gap: 0.4rem;">
                        <button class="btn btn-outline btn-sm" onclick="showTrackingModal('${p.id}')">🔍 ${t.trackingBtn}</button>
                        <button class="btn btn-outline btn-sm" onclick="showInvoiceModal('${p.id}')">🧾 ${t.invoiceBtn}</button>
                      </div>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
        }
      </div>
    </div>
  `;
}

function filterPackagesTable(query) {
  const q = query.trim().toLowerCase();
  const rows = document.querySelectorAll('#customerPackagesTable tbody tr');
  rows.forEach((r) => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}

function downloadAddressPDF() {
  window.open(`${API_BASE}/auth/address-pdf`, '_blank');
}

async function handlePreAlert(e) {
  e.preventDefault();
  const tracking = document.getElementById('preAlertTracking').value;
  const shipping = document.getElementById('preAlertShipping').value;
  const goods = document.getElementById('preAlertGoods').value;

  try {
    const res = await fetch(`${API_BASE}/packages/pre-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify({
        merchant_tracking_number: tracking,
        shipping_type: shipping,
        package_type: goods,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert('Pre-alert registered successfully!');
      render();
    } else {
      alert(data.error || 'Failed to register');
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================================================
// Warehouse Staff View (Intake Terminal)
// ==========================================================================

async function renderStaffView(t) {
  let containers = [];
  let packages = [];

  try {
    const [cRes, pRes] = await Promise.all([
      fetch(`${API_BASE}/containers`, { headers: { Authorization: `Bearer ${currentToken}` } }),
      fetch(`${API_BASE}/packages/all`, { headers: { Authorization: `Bearer ${currentToken}` } }),
    ]);
    if (cRes.ok) containers = (await cRes.json()).containers;
    if (pRes.ok) packages = (await pRes.json()).packages;
  } catch (e) {}

  return `
    <div class="grid grid-cols-3">
      <!-- Intake Station Form -->
      <div class="card" style="grid-column: span 1;">
        <div class="card-title" style="margin-bottom: 0.25rem;">📥 ${t.intakeTerminalTitle}</div>
        <p style="font-size: 0.775rem; color: var(--slate-500); margin-bottom: 1.25rem;">Measure dimensions & link carton to customer code</p>

        <form onsubmit="handleWarehouseIntake(event)">
          <div class="form-group">
            <label>${t.intakeTrackingLabel}</label>
            <input type="text" id="intakeTracking" required placeholder="Scan barcode or enter SF/YT tracking" />
          </div>

          <div class="form-group">
            <label>${t.intakeCustomerCodeLabel}</label>
            <input type="text" id="intakeCustomerCode" required placeholder="e.g. IRQ-1001" style="font-weight: 700; color: var(--brand-700);" />
          </div>

          <div class="form-group">
            <label>${t.shippingMethodLabel}</label>
            <select id="intakeShipping">
              <option value="air">✈️ Air Cargo</option>
              <option value="sea">🚢 Ocean Sea Freight</option>
            </select>
          </div>

          <div class="form-group">
            <label>${t.dimensionsLabel}</label>
            <div class="grid grid-cols-3" style="gap: 0.5rem;">
              <input type="number" id="dimL" required placeholder="L" value="40" oninput="calcIntakeCBM()" />
              <input type="number" id="dimW" required placeholder="W" value="30" oninput="calcIntakeCBM()" />
              <input type="number" id="dimH" required placeholder="H" value="25" oninput="calcIntakeCBM()" />
            </div>
          </div>

          <div class="form-group">
            <label>${t.weightLabel}</label>
            <input type="number" step="0.1" id="intakeWeight" required value="4.2" />
          </div>

          <!-- Realtime CBM & Volumetric Weight Widget -->
          <div style="background: var(--slate-100); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1rem;">
            <div style="display:flex; justify-content:space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
              <span>${t.liveCbmCalc}:</span>
              <strong id="liveCbm" style="color: var(--amber-600);">0.0300 CBM</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size: 0.8rem;">
              <span>${t.liveVolCalc}:</span>
              <strong id="liveVol" style="color: var(--sky-600);">6.00 kg</strong>
            </div>
          </div>

          <div class="form-group">
            <label>${t.goodsTypeLabel}</label>
            <input type="text" id="intakeType" value="Electronics & Accessories" />
          </div>

          <div class="form-group">
            <label>${t.selectContainerOptional}</label>
            <select id="intakeContainer">
              <option value="">-- Leave In Origin Warehouse Floor --</option>
              ${containers
                .filter((c) => c.status === 'loading')
                .map((c) => `<option value="${c.id}">${c.container_number} (${c.shipping_type.toUpperCase()} • ${c.cbm_utilization_percent}% full)</option>`)
                .join('')}
            </select>
          </div>

          <button type="submit" class="btn btn-emerald" style="width: 100%;">
            💾 ${t.saveIntakeBtn}
          </button>
        </form>
      </div>

      <!-- Scanned Intake Table -->
      <div class="card" style="grid-column: span 2;">
        <div class="card-header">
          <div class="card-title">📋 ${t.scannedPackagesLogTitle} (${packages.length})</div>
          <input type="search" class="filter-input" placeholder="Search intake feed..." oninput="filterStaffTable(this.value)" />
        </div>

        <div class="table-wrapper">
          <table id="staffPackagesTable">
            <thead>
              <tr>
                <th>Package Code</th>
                <th>Customer</th>
                <th>Mode</th>
                <th>Dimensions</th>
                <th>Weight / CBM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${packages
                .map(
                  (p) => `
                <tr>
                  <td>
                    <strong>${p.internal_tracking_code}</strong>
                    <div style="font-size: 0.725rem; color: var(--slate-400);">${p.merchant_tracking_number}</div>
                  </td>
                  <td>
                    <div><strong>${p.customer_name}</strong></div>
                    <span class="badge badge-neutral">${p.customer_code}</span>
                  </td>
                  <td>
                    <span class="badge ${p.shipping_type === 'air' ? 'badge-air' : 'badge-sea'}">
                      ${p.shipping_type.toUpperCase()}
                    </span>
                  </td>
                  <td>${p.length_cm} × ${p.width_cm} × ${p.height_cm} cm</td>
                  <td>${p.weight_kg} kg • ${p.cbm} CBM</td>
                  <td><span class="badge badge-info">${formatStatus(p.status)}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function calcIntakeCBM() {
  const l = parseFloat(document.getElementById('dimL')?.value || '0');
  const w = parseFloat(document.getElementById('dimW')?.value || '0');
  const h = parseFloat(document.getElementById('dimH')?.value || '0');
  const cbm = (l * w * h) / 1000000;
  const vol = (l * w * h) / 5000;
  if (document.getElementById('liveCbm')) document.getElementById('liveCbm').innerText = cbm.toFixed(4) + ' CBM';
  if (document.getElementById('liveVol')) document.getElementById('liveVol').innerText = vol.toFixed(2) + ' kg';
}

function filterStaffTable(query) {
  const q = query.trim().toLowerCase();
  const rows = document.querySelectorAll('#staffPackagesTable tbody tr');
  rows.forEach((r) => {
    r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}

async function handleWarehouseIntake(e) {
  e.preventDefault();
  const payload = {
    merchant_tracking_number: document.getElementById('intakeTracking').value,
    customer_code: document.getElementById('intakeCustomerCode').value,
    shipping_type: document.getElementById('intakeShipping').value,
    length_cm: parseFloat(document.getElementById('dimL').value),
    width_cm: parseFloat(document.getElementById('dimW').value),
    height_cm: parseFloat(document.getElementById('dimH').value),
    weight_kg: parseFloat(document.getElementById('intakeWeight').value),
    package_type: document.getElementById('intakeType').value,
    container_id: document.getElementById('intakeContainer').value || null,
  };

  try {
    const res = await fetch(`${API_BASE}/packages/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Package ${data.package.internal_tracking_code} recorded and Invoice generated!`);
      render();
    } else {
      alert(data.error || 'Failed to record package');
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================================================
// Manager Command Center View (With Container Details & Financial Editing)
// ==========================================================================

async function renderManagerView(t) {
  let containers = [];
  let manifest = {};

  try {
    const [cRes, mRes] = await Promise.all([
      fetch(`${API_BASE}/containers`, { headers: { Authorization: `Bearer ${currentToken}` } }),
      fetch(`${API_BASE}/delivery/manifest`, { headers: { Authorization: `Bearer ${currentToken}` } }),
    ]);
    if (cRes.ok) containers = (await cRes.json()).containers;
    if (mRes.ok) manifest = (await mRes.json()).manifest;
  } catch (e) {}

  cachedContainers = containers;

  const totalLoadedPkgs = containers.reduce((acc, c) => acc + (c.package_count || 0), 0);

  return `
    <!-- Top Executive Metrics -->
    <div class="grid grid-cols-4" style="margin-bottom: 1.5rem;">
      <div class="stat-card brand">
        <div>
          <div class="stat-label">${t.kpiActiveContainers}</div>
          <div class="stat-value">${containers.length}</div>
          <div class="stat-sub">Air & Sea Consolidation</div>
        </div>
        <div class="stat-icon">🚢</div>
      </div>
      <div class="stat-card amber">
        <div>
          <div class="stat-label">${t.kpiPackagesTracked}</div>
          <div class="stat-value">${totalLoadedPkgs}</div>
          <div class="stat-sub">In Active Containers</div>
        </div>
        <div class="stat-icon">📦</div>
      </div>
      <div class="stat-card emerald">
        <div>
          <div class="stat-label">${t.kpiExchangeRate}</div>
          <div class="stat-value">${exchangeRate.toLocaleString()} IQD</div>
          <div class="stat-sub">
            <button class="btn btn-outline btn-sm" style="padding: 0.1rem 0.4rem; font-size: 0.7rem; margin-top: 0.2rem;" onclick="showExchangeRateModal()">✏️ Edit Rate</button>
          </div>
        </div>
        <div class="stat-icon">💰</div>
      </div>
      <div class="stat-card sky">
        <div>
          <div class="stat-label">${t.kpiDeliveryCities}</div>
          <div class="stat-value">${Object.keys(manifest).length}</div>
          <div class="stat-sub">Dispatch Hubs in Iraq</div>
        </div>
        <div class="stat-icon">🚚</div>
      </div>
    </div>

    <!-- Container Management Panel -->
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title">🚢 ${t.managerCommandTitle}</div>
          <p style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.2rem;">
            Configure container costs, customs tax, pricing per CBM/KG, schedules, and batch statuses.
          </p>
        </div>
        <button class="btn btn-primary" onclick="showNewContainerModal()">
          ${t.newContainerBtn}
        </button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>${t.containerNumber}</th>
              <th>${t.containerType}</th>
              <th>${t.containerLoad}</th>
              <th>${t.containerFinancials}</th>
              <th>${t.containerSchedule}</th>
              <th>${t.containerStatus}</th>
              <th>${t.actions}</th>
            </tr>
          </thead>
          <tbody>
            ${containers
              .map(
                (c) => `
              <tr>
                <td>
                  <strong>${c.container_number}</strong>
                  ${c.notes ? `<div style="font-size: 0.725rem; color: var(--slate-500);">${c.notes}</div>` : ''}
                </td>
                <td>
                  <span class="badge ${c.shipping_type === 'air' ? 'badge-air' : 'badge-sea'}">
                    ${c.shipping_type.toUpperCase()}
                  </span>
                </td>
                <td style="min-width: 170px;">
                  <div style="display:flex; justify-content:space-between; font-size: 0.775rem;">
                    <span><strong>${c.package_count}</strong> pkgs</span>
                    <span><strong>${c.total_cbm_used}</strong> / ${c.max_cbm} CBM</span>
                  </div>
                  <div class="progress-container">
                    <div
                      class="progress-bar ${c.cbm_utilization_percent > 85 ? 'high' : c.cbm_utilization_percent > 50 ? 'medium' : 'low'}"
                      style="width: ${Math.min(100, c.cbm_utilization_percent)}%;"
                    ></div>
                  </div>
                  <div style="font-size: 0.7rem; color: var(--slate-400); text-align: right; margin-top: 2px;">
                    ${c.cbm_utilization_percent}% volume used
                  </div>
                </td>
                <td>
                  <div>Transit Cost: <strong>$${c.cost_per_container_usd.toLocaleString()}</strong></div>
                  <div style="font-size: 0.75rem; color: var(--slate-500);">
                    Tax: <strong>$${c.customs_tax_usd.toLocaleString()}</strong> • 
                    ${c.shipping_type === 'sea' ? `Rate: $${c.cost_per_cbm_usd}/CBM` : `Rate: $${c.cost_per_kg_usd}/kg`}
                  </div>
                </td>
                <td>
                  <div>ETD: ${c.etd || 'Not set'}</div>
                  <div style="font-size: 0.75rem; color: var(--slate-500);">ETA: ${c.eta || 'Not set'}</div>
                </td>
                <td>
                  <span class="badge ${c.status === 'in_transit' ? 'badge-air' : c.status === 'arrived_unpacked' ? 'badge-success' : 'badge-pending'}">
                    ${formatStatus(c.status)}
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="openEditContainerModal('${c.id}')">
                    ${t.editContainerBtn}
                  </button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Iraqi 3rd-Party Local Delivery Manifest -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">🚚 ${t.manifestTitle}</div>
          <p style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.2rem;">${t.manifestDesc}</p>
        </div>
      </div>

      ${
        Object.keys(manifest).length === 0
          ? `<div style="text-align: center; padding: 2.5rem; color: var(--slate-400);">No shipments currently awaiting dispatch.</div>`
          : Object.entries(manifest)
              .map(
                ([cityName, items]) => `
          <div style="margin-bottom: 2rem;">
            <div style="background: var(--slate-100); border-left: 4px solid var(--brand-600); padding: 0.5rem 1rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem; display:flex; justify-content:space-between; align-items:center;">
              <strong style="color: var(--slate-900);">📍 ${cityName} Hub (${items.length} Shipments)</strong>
              <span style="font-size: 0.8rem; color: var(--slate-600);">Total Collectible COD: <strong>${items.reduce((sum, i) => sum + (i.cod_amount_iqd || 0), 0).toLocaleString()} IQD</strong></span>
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>${t.recipientName}</th>
                    <th>${t.phone}</th>
                    <th>${t.deliveryAddress}</th>
                    <th>${t.codAmount}</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${items
                    .map(
                      (item) => `
                    <tr>
                      <td><strong>${item.tracking_code}</strong></td>
                      <td>${item.customer_name}</td>
                      <td>${item.customer_phone}</td>
                      <td>
                        <div>${item.local_address}</div>
                        <div style="font-size: 0.75rem; color: var(--slate-500);">Landmark: ${item.nearest_point}</div>
                      </td>
                      <td>
                        <strong style="color: var(--emerald-600);">${item.cod_amount_iqd.toLocaleString()} IQD</strong>
                        <div style="font-size: 0.7rem; color: var(--slate-400);">($${item.cod_amount_usd.toFixed(2)} USD)</div>
                      </td>
                      <td><span class="badge badge-pending">${formatStatus(item.package_status)}</span></td>
                      <td>
                        <div style="display:flex; gap: 0.35rem;">
                          <button class="btn btn-outline btn-sm" onclick="markDeliveryStatus('${item.package_id}', 'out_for_delivery')">${t.markOutForDelivery}</button>
                          <button class="btn btn-emerald btn-sm" onclick="markDeliveryStatus('${item.package_id}', 'delivered')">${t.markDelivered}</button>
                        </div>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        `
              )
              .join('')
      }
    </div>
  `;
}

// ==========================================================================
// Comprehensive Container Edit Modal (Requirement 2)
// ==========================================================================

async function openEditContainerModal(containerId) {
  const dialog = document.getElementById('appDialog');
  const t = i18n[currentLang];
  
  dialog.innerHTML = `<div class="dialog-body"><p>Loading container specifications...</p></div>`;
  dialog.showModal();

  try {
    const res = await fetch(`${API_BASE}/containers/${containerId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const { container } = await res.json();

    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>${t.editModalTitle} — ${container.container_number}</h3>
        <button class="btn-close" onclick="document.getElementById('appDialog').close()">✕</button>
      </div>

      <div class="dialog-body">
        <form id="editContainerForm" onsubmit="handleSaveContainerEdit(event, '${container.id}')">
          <div class="grid grid-cols-2" style="gap: 1rem; margin-bottom: 1rem;">
            <!-- Status -->
            <div class="form-group">
              <label>Lifecycle Status (Cascades to all packages)</label>
              <select id="editStatus">
                <option value="loading" ${container.status === 'loading' ? 'selected' : ''}>📦 Loading (Origin Warehouse)</option>
                <option value="sealed" ${container.status === 'sealed' ? 'selected' : ''}>🔒 Sealed & Finalized</option>
                <option value="in_transit" ${container.status === 'in_transit' ? 'selected' : ''}>🚀 In Transit (On Vessel / Flight)</option>
                <option value="customs" ${container.status === 'customs' ? 'selected' : ''}>🏛️ At Customs Clearance Border</option>
                <option value="arrived_unpacked" ${container.status === 'arrived_unpacked' ? 'selected' : ''}>✅ Arrived & Unpacked in Iraq</option>
              </select>
            </div>

            <!-- Shipping Type -->
            <div class="form-group">
              <label>Shipping Method</label>
              <select id="editShippingType">
                <option value="sea" ${container.shipping_type === 'sea' ? 'selected' : ''}>🚢 Ocean Sea Freight</option>
                <option value="air" ${container.shipping_type === 'air' ? 'selected' : ''}>✈️ Air Cargo</option>
              </select>
            </div>
          </div>

          <!-- Financial Details Group -->
          <div style="background: var(--slate-50); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
            <h4 style="font-size: 0.85rem; color: var(--slate-800); margin-bottom: 0.75rem;">💰 Financials, Rates & Taxes</h4>
            <div class="grid grid-cols-2" style="gap: 1rem;">
              <div class="form-group">
                <label>${t.transitCostLabel}</label>
                <input type="number" step="0.01" id="editTransitCost" value="${container.cost_per_container_usd}" />
              </div>
              <div class="form-group">
                <label>${t.customsTaxLabel}</label>
                <input type="number" step="0.01" id="editCustomsTax" value="${container.customs_tax_usd}" />
              </div>
              <div class="form-group">
                <label>${t.ratePerCbmLabel}</label>
                <input type="number" step="0.01" id="editRateCbm" value="${container.cost_per_cbm_usd}" />
              </div>
              <div class="form-group">
                <label>${t.ratePerKgLabel}</label>
                <input type="number" step="0.01" id="editRateKg" value="${container.cost_per_kg_usd}" />
              </div>
            </div>
          </div>

          <!-- Capacity & Schedule Group -->
          <div class="grid grid-cols-2" style="gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label>${t.maxCbmLabel}</label>
              <input type="number" step="0.1" id="editMaxCbm" value="${container.max_cbm}" />
            </div>
            <div class="form-group">
              <label>${t.maxWeightLabel}</label>
              <input type="number" step="1" id="editMaxWeight" value="${container.max_weight_kg}" />
            </div>
            <div class="form-group">
              <label>${t.etdLabel}</label>
              <input type="date" id="editETD" value="${container.etd || ''}" />
            </div>
            <div class="form-group">
              <label>${t.etaLabel}</label>
              <input type="date" id="editETA" value="${container.eta || ''}" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label>${t.voyageNotesLabel}</label>
            <input type="text" id="editNotes" value="${container.notes || ''}" placeholder="e.g. Evergreen Marine Voyage 402, Flight QR-891" />
          </div>

          <!-- Enclosed Packages Table Preview -->
          <div style="margin-bottom: 1rem;">
            <h4 style="font-size: 0.85rem; color: var(--slate-800); margin-bottom: 0.5rem;">
              📦 ${t.enclosedPackagesTitle} (${container.packages ? container.packages.length : 0})
            </h4>
            <div class="table-wrapper" style="max-height: 180px; overflow-y: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Customer</th>
                    <th>Weight</th>
                    <th>CBM</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    container.packages && container.packages.length > 0
                      ? container.packages
                          .map(
                            (p) => `
                        <tr>
                          <td><strong>${p.tracking_code}</strong></td>
                          <td>${p.customer_name} (${p.customer_code})</td>
                          <td>${p.weight_kg} kg</td>
                          <td>${p.cbm} CBM</td>
                          <td><span class="badge badge-info">${formatStatus(p.status)}</span></td>
                        </tr>
                      `
                          )
                          .join('')
                      : `<tr><td colspan="5" style="text-align: center; color: var(--slate-400);">No packages assigned to this container yet.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('appDialog').close()">Cancel</button>
            <button type="submit" class="btn btn-primary">${t.saveContainerChangesBtn}</button>
          </div>
        </form>
      </div>
    `;
  } catch (err) {
    dialog.innerHTML = `<div class="dialog-body"><p style="color:red;">Error loading container.</p></div>`;
  }
}

async function handleSaveContainerEdit(e, containerId) {
  e.preventDefault();
  const payload = {
    status: document.getElementById('editStatus').value,
    shipping_type: document.getElementById('editShippingType').value,
    cost_per_container_usd: parseFloat(document.getElementById('editTransitCost').value) || 0,
    customs_tax_usd: parseFloat(document.getElementById('editCustomsTax').value) || 0,
    cost_per_cbm_usd: parseFloat(document.getElementById('editRateCbm').value) || 0,
    cost_per_kg_usd: parseFloat(document.getElementById('editRateKg').value) || 0,
    max_cbm: parseFloat(document.getElementById('editMaxCbm').value) || 68,
    max_weight_kg: parseFloat(document.getElementById('editMaxWeight').value) || 25000,
    etd: document.getElementById('editETD').value || null,
    eta: document.getElementById('editETA').value || null,
    notes: document.getElementById('editNotes').value || null,
  };

  try {
    const res = await fetch(`${API_BASE}/containers/${containerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      document.getElementById('appDialog').close();
      alert('Container specifications and financials updated successfully!');
      render();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to update container');
    }
  } catch (err) {
    console.error(err);
  }
}

// Manager Create Container Modal
function showNewContainerModal() {
  const dialog = document.getElementById('appDialog');
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>🚢 Create New Shipping Container / Air Batch</h3>
      <button class="btn-close" onclick="document.getElementById('appDialog').close()">✕</button>
    </div>
    <div class="dialog-body">
      <form onsubmit="handleCreateContainer(event)">
        <div class="form-group">
          <label>Shipping Method</label>
          <select id="newContainerType">
            <option value="sea">🚢 Ocean Sea Freight Container (40ft HQ / 68 CBM)</option>
            <option value="air">✈️ Air Express Cargo Pallet (15 CBM)</option>
          </select>
        </div>
        <div class="grid grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label>Estimated Transit Cost ($ USD)</label>
            <input type="number" id="newTransitCost" value="4500" />
          </div>
          <div class="form-group">
            <label>Customs & Port Tax ($ USD)</label>
            <input type="number" id="newTax" value="700" />
          </div>
          <div class="form-group">
            <label>Departure Date (ETD)</label>
            <input type="date" id="newContainerETD" required />
          </div>
          <div class="form-group">
            <label>Arrival Date (ETA)</label>
            <input type="date" id="newContainerETA" required />
          </div>
        </div>
        <div class="form-group">
          <label>Vessel / Carrier & Voyage Notes</label>
          <input type="text" id="newContainerNotes" placeholder="e.g. Cosco Shipping Voyage 402, Guangzhou to Umm Qasr" />
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('appDialog').close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Container</button>
        </div>
      </form>
    </div>
  `;
  dialog.showModal();
}

async function handleCreateContainer(e) {
  e.preventDefault();
  const payload = {
    shipping_type: document.getElementById('newContainerType').value,
    cost_per_container_usd: parseFloat(document.getElementById('newTransitCost').value) || 0,
    customs_tax_usd: parseFloat(document.getElementById('newTax').value) || 0,
    etd: document.getElementById('newContainerETD').value,
    eta: document.getElementById('newContainerETA').value,
    notes: document.getElementById('newContainerNotes').value,
  };

  try {
    const res = await fetch(`${API_BASE}/containers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      document.getElementById('appDialog').close();
      render();
    }
  } catch (err) {
    console.error(err);
  }
}

// Manager update delivery status
async function markDeliveryStatus(packageId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/delivery/${packageId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      render();
    }
  } catch (e) {
    console.error(e);
  }
}

// Exchange rate modal
function showExchangeRateModal() {
  const dialog = document.getElementById('appDialog');
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>💵 Update Base Exchange Rate</h3>
      <button class="btn-close" onclick="document.getElementById('appDialog').close()">✕</button>
    </div>
    <div class="dialog-body">
      <form onsubmit="handleUpdateRate(event)">
        <div class="form-group">
          <label>1 USD to Iraqi Dinar (IQD)</label>
          <input type="number" id="inputNewRate" required value="${exchangeRate}" step="5" />
          <p class="input-hint">Used for automated dual-currency invoice calculations and COD collection.</p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn btn-outline" onclick="document.getElementById('appDialog').close()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Rate</button>
        </div>
      </form>
    </div>
  `;
  dialog.showModal();
}

async function handleUpdateRate(e) {
  e.preventDefault();
  const rate = parseFloat(document.getElementById('inputNewRate').value);
  try {
    const res = await fetch(`${API_BASE}/finance/exchange-rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
      body: JSON.stringify({ exchange_rate_iqd: rate }),
    });
    if (res.ok) {
      exchangeRate = rate;
      document.getElementById('appDialog').close();
      render();
    }
  } catch (err) {
    console.error(err);
  }
}

// ==========================================================================
// Tracking & Invoice Details Modals
// ==========================================================================

async function showTrackingModal(packageId) {
  const dialog = document.getElementById('appDialog');
  dialog.innerHTML = `<div class="dialog-body"><p>Loading tracking history...</p></div>`;
  dialog.showModal();

  try {
    const res = await fetch(`${API_BASE}/tracking/${packageId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const data = await res.json();

    dialog.innerHTML = `
      <div class="dialog-header">
        <div>
          <h3>Tracking: ${data.package_code}</h3>
          <div style="font-size: 0.775rem; color: var(--slate-500); margin-top: 2px;">
            Supplier Tracking: <strong>${data.merchant_tracking_number}</strong> • Mode: <strong>${data.shipping_type.toUpperCase()}</strong>
          </div>
        </div>
        <button class="btn-close" onclick="document.getElementById('appDialog').close()">✕</button>
      </div>

      <div class="dialog-body">
        <div class="timeline">
          ${data.events
            .map(
              (ev, idx) => `
            <div class="timeline-step">
              <div class="timeline-marker ${idx === data.events.length - 1 ? 'active' : ''}"></div>
              <div class="timeline-title">${currentLang === 'ar' ? ev.title_ar : ev.title_en}</div>
              <div class="timeline-desc">Location: ${ev.location}</div>
              <div class="timeline-meta">${new Date(ev.timestamp).toLocaleString()}</div>
            </div>
          `
            )
            .join('')}
        </div>

        ${
          data.external_origin_milestones
            ? `
          <div style="margin-top: 1.5rem; padding: 1rem; background: var(--slate-50); border: 1px dashed var(--slate-300); border-radius: var(--radius-md);">
            <h5 style="color: var(--slate-700); font-size: 0.825rem; margin-bottom: 0.5rem;">
              Origin Domestic Transit (China Carrier Checkpoints):
            </h5>
            ${data.external_origin_milestones
              .map(
                (m) => `
              <div style="font-size: 0.775rem; margin-bottom: 0.4rem; color: var(--slate-600);">
                • <strong>${m.location}:</strong> ${currentLang === 'ar' ? m.status_description_ar : m.status_description_en}
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <div class="dialog-footer">
        <button class="btn btn-outline" onclick="document.getElementById('appDialog').close()">Close</button>
      </div>
    `;
  } catch (e) {
    dialog.innerHTML = `<div class="dialog-body"><p style="color:red;">Failed to load tracking.</p></div>`;
  }
}

async function showInvoiceModal(packageId) {
  const dialog = document.getElementById('appDialog');
  dialog.innerHTML = `<div class="dialog-body"><p>Loading invoice...</p></div>`;
  dialog.showModal();

  try {
    const res = await fetch(`${API_BASE}/invoices/package/${packageId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const { invoice } = await res.json();

    dialog.innerHTML = `
      <div class="dialog-header">
        <div>
          <h3>🧾 Official Shipment Invoice</h3>
          <div style="font-size: 0.75rem; color: var(--slate-500);">Invoice Ref: #${invoice.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <button class="btn-close" onclick="document.getElementById('appDialog').close()">✕</button>
      </div>

      <div class="dialog-body">
        <div style="background: var(--slate-50); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
            <span>International Freight Cost (USD):</span>
            <strong>$${invoice.shipping_cost_usd.toFixed(2)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
            <span>Customs & Tariff Share (USD):</span>
            <strong>$${invoice.customs_tax_usd.toFixed(2)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
            <span>Handling / Local Dispatch (USD):</span>
            <strong>$${invoice.extra_fees_usd.toFixed(2)}</strong>
          </div>
          <hr style="border:0; border-top: 1px solid var(--slate-200); margin: 0.75rem 0;" />
          <div style="display:flex; justify-content:space-between; font-size: 1.15rem; color: var(--brand-700); font-weight: 800;">
            <span>Total Amount ($ USD):</span>
            <span>$${invoice.total_usd.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size: 1.25rem; color: var(--amber-600); font-weight: 800; margin-top: 0.35rem;">
            <span>Total Payable (IQD):</span>
            <span>${invoice.total_iqd.toLocaleString()} IQD</span>
          </div>
        </div>

        <div style="font-size: 0.825rem; color: var(--slate-600); line-height: 1.6;">
          <div>Payment Status: <span class="badge ${invoice.payment_status === 'paid' ? 'badge-success' : 'badge-pending'}">${invoice.payment_status.toUpperCase()}</span></div>
          <div>Collection Method: <strong>${invoice.payment_method.replace(/_/g, ' ').toUpperCase()}</strong></div>
          <div>Exchange Rate Applied: 1 USD = <strong>${invoice.exchange_rate_iqd} IQD</strong></div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="btn btn-outline" onclick="document.getElementById('appDialog').close()">Close</button>
      </div>
    `;
  } catch (e) {
    dialog.innerHTML = `<div class="dialog-body"><p style="color:red;">Error loading invoice.</p></div>`;
  }
}

function formatStatus(status) {
  return status ? status.replace(/_/g, ' ') : '';
}

// Auto-boot on load
document.addEventListener('DOMContentLoaded', initApp);
