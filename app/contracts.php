<?php
/**
 * Contracts Management Page
 * Manages contracts between merchants and tours
 */

session_start();

// Define base path
$basePath = '../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Load translation helper
require_once $basePath . 'includes/translations.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_contracts = $all_translations['contracts'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $t_sidebar['contracts'] ?? 'Contracts'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/contracts.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/contracts-regional.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="contracts-container">
                <!-- Page Header -->
                <div class="contracts-header">
                    <h1><?php echo $t_sidebar['contracts'] ?? 'Contracts'; ?></h1>
                    <button class="btn btn-primary" id="addContractBtn">
                        <span class="material-symbols-rounded">add</span>
                        <?php echo $t_common['add'] ?? 'Add'; ?>
                    </button>
                </div>
                
                <!-- Search/Filter Section -->
                <div class="contracts-search-section">
                    <div class="search-box">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="text" id="searchInput" placeholder="<?php echo $t_contracts['search_placeholder'] ?? 'Search...'; ?>" autocomplete="off">
                        <button id="clearSearch" class="clear-btn" style="display: none;">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                </div>
                
                <!-- Contracts Table -->
                <div class="contracts-table-container">
                    <table class="contracts-table" id="contractsTable">
                        <thead>
                            <tr>
                                <th><?php echo $t_contracts['sub_region'] ?? 'Sub Region'; ?></th>
                                <th><?php echo $t_contracts['merchant'] ?? 'Merchant'; ?></th>
                                <th><?php echo $t_contracts['tour'] ?? 'Tour'; ?></th>
                                <th><?php echo $t_contracts['price'] ?? 'Price'; ?></th>
                                <th><?php echo $t_contracts['start_date'] ?? 'Start Date'; ?></th>
                                <th><?php echo $t_contracts['end_date'] ?? 'End Date'; ?></th>
                                <th><?php echo $t_common['actions'] ?? 'Actions'; ?></th>
                            </tr>
                        </thead>
                        <tbody id="contractsTableBody">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contract Modal -->
    <div id="contractModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle"><?php echo $t_common['add'] ?? 'Add'; ?> <?php echo $t_sidebar['contracts'] ?? 'Contract'; ?></h2>
                <button class="modal-close" id="closeModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="contractForm">
                <input type="hidden" id="contractId">
                
                <!-- Basic Information Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['basic_info'] ?? 'Temel Bilgiler'; ?></h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="sub_region_id"><?php echo $t_contracts['sub_region'] ?? 'Bölge'; ?> *</label>
                            <select id="sub_region_id" name="sub_region_id" required>
                                <option value=""><?php echo $t_common['select'] ?? 'Seçiniz...'; ?></option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="merchant_id"><?php echo $t_contracts['merchant'] ?? 'Firma'; ?> *</label>
                            <select id="merchant_id" name="merchant_id" required>
                                <option value=""><?php echo $t_common['select_sub_region_first'] ?? 'Önce bölge seçiniz'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_contracts['merchant_official_title'] ?? 'Resmi Ünvan'; ?></label>
                            <input type="text" id="merchant_official_title" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label><?php echo $t_contracts['authorized_person'] ?? 'Yetkili Kişi'; ?></label>
                            <input type="text" id="authorized_person" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_contracts['authorized_email'] ?? 'Yetkili E-Posta'; ?></label>
                            <input type="email" id="authorized_email" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="tour_id"><?php echo $t_contracts['tour'] ?? 'Tur'; ?> *</label>
                            <select id="tour_id" name="tour_id" required>
                                <option value=""><?php echo $t_common['select_merchant_first'] ?? 'Önce firma seçiniz'; ?></option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Contract Dates & VAT Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['contract_dates_vat'] ?? 'Kontrat Tarihleri ve KDV'; ?></h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="start_date"><?php echo $t_contracts['start_date'] ?? 'Başlangıç Tarihi'; ?> *</label>
                            <input type="date" id="start_date" name="start_date" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="end_date"><?php echo $t_contracts['end_date'] ?? 'Bitiş Tarihi'; ?> *</label>
                            <input type="date" id="end_date" name="end_date" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vat_included"><?php echo $t_contracts['vat_included'] ?? 'KDV Durumu'; ?> *</label>
                            <select id="vat_included" name="vat_included" required>
                                <option value="included"><?php echo $t_contracts['vat_included_included'] ?? 'KDV Dahil'; ?></option>
                                <option value="excluded"><?php echo $t_contracts['vat_included_excluded'] ?? 'KDV Hariç'; ?></option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="vat_rate" id="vat_rate_label" style="opacity: 0.5;"><?php echo $t_contracts['vat_rate'] ?? 'KDV Oranı (%)'; ?></label>
                            <input type="number" id="vat_rate" name="vat_rate" step="0.01" min="0" max="100" placeholder="0.00" disabled style="opacity: 0.5;">
                        </div>
                    </div>
                </div>
                
                <!-- Kickback Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['kickback'] ?? 'Kickback Bilgileri'; ?></h3>
                    <div class="form-row three-columns">
                        <div class="form-group">
                            <label for="kickback_type"><?php echo $t_contracts['kickback_type'] ?? 'Kickback Tipi'; ?></label>
                            <select id="kickback_type" name="kickback_type">
                                <option value=""><?php echo $t_common['select'] ?? 'Seçiniz...'; ?></option>
                                <option value="fixed"><?php echo $t_contracts['fixed_amount'] ?? 'Sabit Tutar'; ?></option>
                                <option value="percentage"><?php echo $t_contracts['percentage'] ?? 'Yüzde'; ?></option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="kickback_value"><?php echo $t_contracts['kickback_value'] ?? 'Kickback Değeri'; ?></label>
                            <input type="number" id="kickback_value" name="kickback_value" step="0.01" min="0" placeholder="0.00">
                        </div>
                        
                        <div class="form-group">
                            <label for="kickback_currency" id="kickback_currency_label" style="opacity: 0.5;"><?php echo $t_contracts['currency'] ?? 'Döviz'; ?></label>
                            <select id="kickback_currency" name="kickback_currency" disabled style="opacity: 0.5;">
                                <option value=""><?php echo $t_common['loading'] ?? 'Yükleniyor...'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_contracts['kickback_calculation'] ?? 'Kickback Hesaplama'; ?></label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="kickback_per_person" value="0" id="kickback_per_person_0" checked>
                                    <span><?php echo $t_contracts['over_revenue'] ?? 'Ciro Üzerinden'; ?></span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="kickback_per_person" value="1" id="kickback_per_person_1">
                                    <span><?php echo $t_contracts['per_person'] ?? 'Kişi Başı'; ?></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="kickback_min_persons"><?php echo $t_contracts['min_persons'] ?? 'Minimum Kişi Sayısı'; ?></label>
                            <input type="number" id="kickback_min_persons" name="kickback_min_persons" min="1" placeholder="0">
                        </div>
                    </div>
                </div>
                
                <!-- Transfer Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['transfer'] ?? 'Transfer Bilgileri'; ?></h3>
                    <div class="form-row">
                        <div class="form-group full-width">
                            <label><?php echo $t_contracts['transfer_owner'] ?? 'Transfer Kimde'; ?> *</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="transfer_owner_agency" name="transfer_owner[]" value="agency">
                                    <span><?php echo $t_contracts['agency'] ?? 'Acente'; ?></span>
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="transfer_owner_supplier" name="transfer_owner[]" value="supplier">
                                    <span><?php echo $t_contracts['supplier'] ?? 'Supplier'; ?></span>
                                </label>
                            </div>
                            <input type="hidden" id="transfer_owner" name="transfer_owner" value="">
                        </div>
                    </div>
                    
                    <div class="form-row" id="transfer_price_type_group" style="display: none;">
                        <div class="form-group">
                            <label for="transfer_price_type"><?php echo $t_contracts['transfer_price_type'] ?? 'Transfer Fiyat Tipi'; ?></label>
                            <select id="transfer_price_type" name="transfer_price_type" class="form-select">
                                <option value=""><?php echo $t_common['select'] ?? 'Seçiniz...'; ?></option>
                                <option value="per_person"><?php echo $t_contracts['per_person'] ?? 'Kişi Başı'; ?></option>
                                <option value="fixed"><?php echo $t_contracts['fixed_amount'] ?? 'Sabit Fiyat'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Per Person Price -->
                    <div class="form-row" id="transfer_per_person_price_group" style="display: none;">
                        <div class="form-group">
                            <label for="transfer_price"><?php echo $t_contracts['transfer_price'] ?? 'Transfer Fiyatı'; ?></label>
                            <input type="number" id="transfer_price" name="transfer_price" step="0.01" min="0" placeholder="0.00">
                        </div>
                        
                        <div class="form-group">
                            <label for="transfer_currency"><?php echo $t_contracts['transfer_currency'] ?? 'Transfer Dövizi'; ?></label>
                            <select id="transfer_currency" name="transfer_currency">
                                <option value=""><?php echo $t_common['loading'] ?? 'Yükleniyor...'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Fixed Price by Vehicle Type -->
                    <div class="form-group full-width" id="transfer_fixed_prices_group" style="display: none;">
                        <label class="subsection-label"><?php echo $t_contracts['transfer_by_vehicle'] ?? 'Araç Tipine Göre Transfer Fiyatları'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label for="transfer_price_mini"><?php echo $t_contracts['mini'] ?? 'Mini'; ?></label>
                                <input type="number" id="transfer_price_mini" name="transfer_price_mini" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label for="transfer_price_midi"><?php echo $t_contracts['midi'] ?? 'Midi'; ?></label>
                                <input type="number" id="transfer_price_midi" name="transfer_price_midi" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label for="transfer_price_bus"><?php echo $t_contracts['bus'] ?? 'Bus'; ?></label>
                                <input type="number" id="transfer_price_bus" name="transfer_price_bus" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="transfer_currency_fixed"><?php echo $t_contracts['transfer_currency'] ?? 'Transfer Dövizi'; ?></label>
                                <select id="transfer_currency_fixed" name="transfer_currency_fixed">
                                    <option value=""><?php echo $t_common['loading'] ?? 'Yükleniyor...'; ?></option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Pricing Section -->
                <div class="form-section" id="pricing_section" style="display: none;">
                    <h3 class="section-title"><?php echo $t_contracts['pricing'] ?? 'Fiyatlandırma'; ?></h3>
                    
                    <!-- Price Type Selection -->
                    <div class="form-group full-width" id="price_type_section" style="display: none;">
                        <label class="price-type-label"><?php echo $t_contracts['price_type'] ?? 'Fiyat Tipi'; ?></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="price_type" value="regional" id="price_type_regional" checked>
                                <span><?php echo $t_contracts['regional_price'] ?? 'Bölge Bazlı Fiyat'; ?></span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="price_type" value="fixed" id="price_type_fixed">
                                <span><?php echo $t_contracts['fixed_price'] ?? 'Tüm Bölgelerde Sabit Fiyat'; ?></span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Age Groups and Currency Section -->
                    <div class="form-group full-width" id="age_currency_section" style="display: none;">
                        <label class="subsection-label"><?php echo $t_contracts['age_currency'] ?? 'Yaş Bilgileri ve Döviz'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label for="adult_age"><?php echo $t_contracts['adult_age'] ?? 'Yetişkin Yaş'; ?></label>
                                <input type="text" id="adult_age" name="adult_age" placeholder="+12">
                            </div>
                            
                            <div class="form-group">
                                <label for="child_age_range"><?php echo $t_contracts['child_age'] ?? 'Çocuk Yaş Aralığı'; ?></label>
                                <input type="text" id="child_age_range" name="child_age_range" placeholder="6-11">
                            </div>
                            
                            <div class="form-group">
                                <label for="infant_age_range"><?php echo $t_contracts['infant_age'] ?? 'Bebek Yaş Aralığı'; ?></label>
                                <input type="text" id="infant_age_range" name="infant_age_range" placeholder="0-5">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="contract_currency"><?php echo $t_contracts['currency'] ?? 'Döviz'; ?></label>
                                <select id="contract_currency" name="contract_currency">
                                    <option value=""><?php echo $t_common['loading'] ?? 'Yükleniyor...'; ?></option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Fixed Price Section (for all regions) -->
                    <div class="form-group full-width" id="fixed_price_section" style="display: none;">
                        <label class="subsection-label"><?php echo $t_contracts['fixed_price'] ?? 'Tüm Bölgelerde Sabit Fiyat'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label><?php echo $t_contracts['adult_price'] ?? 'Yetişkin Fiyat'; ?></label>
                                <input type="number" id="fixed_adult_price" name="fixed_adult_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label><?php echo $t_contracts['child_price'] ?? 'Çocuk Fiyat'; ?></label>
                                <input type="number" id="fixed_child_price" name="fixed_child_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                                <label><?php echo $t_contracts['infant_price'] ?? 'Bebek Fiyat'; ?></label>
                                <input type="number" id="fixed_infant_price" name="fixed_infant_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Regional Prices Section -->
                    <div class="form-group full-width" id="regional_prices_section" style="display: none;">
                        <label class="subsection-label"><?php echo $t_contracts['regional_prices'] ?? 'Bölge Bazlı Fiyatlar'; ?></label>
                        <div id="regional_prices_container" class="regional-prices-container">
                            <!-- Regional prices will be loaded here dynamically -->
                        </div>
                    </div>
                </div>
                
                <!-- Included Content Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['included_content'] ?? 'Fiyata Dahil İçerikler'; ?></h3>
                    <div class="form-group full-width">
                        <textarea id="included_content" name="included_content" rows="4" placeholder="<?php echo $t_contracts['included_content_placeholder'] ?? 'Fiyata dahil içerikleri buraya yazın...'; ?>"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Contract Summary Modal -->
    <div id="contractSummaryModal" class="modal">
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;">
                <h2><?php echo $t_contracts['contract_summary'] ?? 'Kontrat Özeti'; ?></h2>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon btn-info" onclick="printContractSummary()" title="<?php echo $t_common['print'] ?? 'Yazdır'; ?>" style="background: #e0f2fe; color: #0369a1;">
                        <span class="material-symbols-rounded">print</span>
                    </button>
                    <button class="modal-close" onclick="closeContractSummary()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            </div>
            <div class="modal-body" id="contractSummaryContent" style="padding: 24px 30px; overflow-y: auto; flex: 1; max-height: calc(90vh - 100px);">
                <!-- Summary content will be loaded here -->
            </div>
        </div>
    </div>
    
    <style>
        /* Main Content Styles */
        .main-content {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            transition: margin-left 0.4s ease;
        }
        
        .sidebar.collapsed ~ .main-content {
            margin-left: var(--sidebar-collapsed-width);
        }
        
        .content-wrapper {
            margin-top: 70px;
            padding: 30px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .main-content {
                margin-left: 0 !important;
            }
            
            .sidebar.collapsed ~ .main-content {
                margin-left: 0 !important;
            }
            
            .sidebar.active ~ .main-content {
                margin-left: 0 !important;
            }
            
            .content-wrapper {
                padding: 20px;
            }
        }
    </style>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <!-- Define API base path and translations for JavaScript -->
    <script>
        const BASE_PATH = '<?php echo $basePath; ?>';
        window.API_BASE = BASE_PATH + 'api/contracts.php';
        window.Translations = {
            contracts: <?php echo json_encode($t_contracts); ?>,
            common: <?php echo json_encode($t_common); ?>,
            sidebar: <?php echo json_encode($t_sidebar); ?>
        };
    </script>
    
    <script src="<?php echo $basePath; ?>assets/js/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/contracts.js"></script>
</body>
</html>

