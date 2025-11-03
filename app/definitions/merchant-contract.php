<?php
/**
 * Merchant Contract Management Page
 * Adds contracts for merchants
 */

session_start();

// Define base path
$basePath = '../../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Get merchant ID
$merchantId = isset($_GET['merchant_id']) ? (int)$_GET['merchant_id'] : 0;
if ($merchantId <= 0) {
    header('Location: ' . $basePath . 'app/definitions/merchants.php');
    exit;
}

// Load translation helper
require_once $basePath . 'includes/translations.php';

// Load security helper for CSRF token
require_once $basePath . 'includes/security.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_merchants = $all_translations['merchants'] ?? [];
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
    <title><?php echo $t_merchants['add_contract'] ?? 'Add Contract'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/toast.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/select-search.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/date-range-picker.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/merchant-contract.css">
    
    <link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
    <?php include $basePath . 'includes/sidebar.php'; ?>
    
    <div class="main-content">
        <?php include $basePath . 'includes/topbar.php'; ?>
        
        <!-- Main Content Area -->
        <div class="content-wrapper">
            <div class="merchant-contract-container">
                <!-- Page Header -->
                <div class="merchant-contract-header">
                    <h1><?php echo $t_merchants['add_contract'] ?? 'Add Contract'; ?></h1>
                    <a class="btn-add" href="<?php echo $basePath; ?>app/definitions/merchants.php">
                        <span class="material-symbols-rounded">arrow_back</span>
                        <?php echo $t_common['back'] ?? 'Back'; ?>
                    </a>
                </div>
                
                <!-- Merchant Info Section -->
                <div class="merchant-info-section" id="merchantInfoSection">
                    <h2><?php echo $t_merchants['merchant_info'] ?? 'Merchant Information'; ?></h2>
                    <div class="merchant-info-content">
                        <div class="info-row">
                            <strong><?php echo $t_merchants['merchant_name'] ?? 'Merchant Name'; ?>:</strong>
                            <span id="merchantName">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['official_title'] ?? 'Official Title'; ?>:</strong>
                            <span id="merchantOfficialTitle">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['region'] ?? 'Region'; ?>:</strong>
                            <span id="merchantRegion">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['authorized_person'] ?? 'Authorized Person'; ?>:</strong>
                            <span id="merchantAuthorizedPerson">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['authorized_email'] ?? 'Authorized Email'; ?>:</strong>
                            <span id="merchantAuthorizedEmail">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['authorized_phone'] ?? 'Authorized Phone'; ?>:</strong>
                            <span id="merchantAuthorizedPhone">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['operasyon_name'] ?? 'Operasyon Name'; ?>:</strong>
                            <span id="merchantOperasyonName">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['operasyon_email'] ?? 'Operasyon Email'; ?>:</strong>
                            <span id="merchantOperasyonEmail">-</span>
                        </div>
                        <div class="info-row">
                            <strong><?php echo $t_merchants['operasyon_phone'] ?? 'Operasyon Phone'; ?>:</strong>
                            <span id="merchantOperasyonPhone">-</span>
                        </div>
                    </div>
                </div>
                
                <!-- Existing Contracts Section -->
                <div class="existing-contracts-section" id="existingContractsSection">
                    <div class="section-header">
                        <h2><?php echo $t_merchants['existing_contracts'] ?? 'Existing Contracts'; ?></h2>
                        <div class="section-header-actions">
                            <button type="button" class="btn-refresh" id="refreshContractsBtn" title="<?php echo $t_common['refresh'] ?? 'Refresh'; ?>">
                                <span class="material-symbols-rounded">refresh</span>
                            </button>
                            <button type="button" class="btn-add" id="openAddContractModalBtn">
                                <span class="material-symbols-rounded">add</span>
                                <?php echo $t_merchants['add_new_contract'] ?? 'Add New Contract'; ?>
                            </button>
                        </div>
                    </div>
                    <div id="contractsListContainer">
                        <div class="loading">
                            <span class="material-symbols-rounded">sync</span>
                            <p><?php echo $t_common['loading'] ?? 'Loading...'; ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Add Contract Modal -->
    <div class="modal" id="addContractModal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2><?php echo $t_merchants['add_new_contract'] ?? 'Add New Contract'; ?></h2>
                <button class="btn-close" id="closeAddContractModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form id="contractForm">
                <input type="hidden" name="merchant_id" id="merchantId" value="<?php echo $merchantId; ?>">
                
                <div class="modal-body modal-body-scrollable">
                    <!-- Step 1: Basic Info -->
                    <div class="form-section">
                        <h3 class="form-section-title"><?php echo $t_merchants['basic_info'] ?? 'Basic Information'; ?></h3>
                        <div class="form-row-three">
                            <div class="form-group">
                                <label><?php echo $t_merchants['contract_code'] ?? 'Contract Code'; ?> *</label>
                                <input type="text" name="contract_code" id="contractCode" required readonly class="input-readonly">
                                <small class="input-hint"><?php echo $t_merchants['contract_code_auto'] ?? 'Auto generated'; ?></small>
                                <span class="input-error-message"></span>
                            </div>
                            
                            <div class="form-group">
                                <label><?php echo $t_merchants['tour_name'] ?? 'Tur Adı'; ?> *</label>
                                <select name="tour_id" id="tourId" required>
                                    <option value=""><?php echo $t_common['select'] ?? 'Select Tour...'; ?></option>
                                </select>
                                <small class="input-hint"><?php echo $t_merchants['tour_hint'] ?? 'City tours only'; ?></small>
                                <span class="input-error-message"></span>
                            </div>
                            
                            <div class="form-group">
                                <label><?php echo $t_merchants['date_range'] ?? 'Tarih'; ?> *</label>
                                <div class="date-range-wrapper">
                                    <input type="text" id="contract_date_range" placeholder="<?php echo $t_common['date_range_placeholder'] ?? 'GG/AA/YYYY - GG/AA/YYYY'; ?>" required class="date-range-input" />
                                    <input type="date" id="contract_start_date" name="start_date" class="hidden" />
                                    <input type="date" id="contract_end_date" name="end_date" class="hidden" />
                                    <div id="contractRangePicker" class="range-picker hidden"></div>
                                    <span class="input-error-message"></span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="vatSection" style="display: none;">
                            <div class="form-group">
                                <label><?php echo $t_merchants['has_vat'] ?? 'KDV var mı?'; ?> *</label>
                                <select name="has_vat" id="hasVat" required>
                                    <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                                    <option value="yes"><?php echo $t_merchants['yes'] ?? 'Evet'; ?></option>
                                    <option value="no"><?php echo $t_merchants['no'] ?? 'Hayır'; ?></option>
                                </select>
                                <span class="input-error-message"></span>
                            </div>
                            
                            <!-- VAT Fields Container (shown when has_vat = yes) -->
                            <div id="vatFieldsContainer" class="hidden">
                                <div class="vat-header">
                                    <h4><?php echo $t_merchants['vat_rates'] ?? 'KDV Oranları'; ?></h4>
                                    <button type="button" class="btn-add-small" id="addVatBtn">
                                        <span class="material-symbols-rounded">add</span>
                                        <?php echo $t_merchants['add_vat'] ?? 'KDV Ekle'; ?>
                                    </button>
                                </div>
                                <div id="vatRatesList" class="vat-rates-list">
                                    <p class="no-vat-message"><?php echo $t_merchants['no_vat_rates'] ?? 'Henüz KDV oranı eklenmedi'; ?></p>
                                </div>
                                <div id="vatTotalPercentage" class="vat-total-info hidden">
                                    <span><?php echo $t_merchants['total_percentage'] ?? 'Toplam Yüzde'; ?>: <strong id="vatTotalPercentValue">0</strong>%</span>
                                    <span class="vat-error" id="vatTotalError" style="display: none; color: #ef4444; margin-left: 16px;">
                                        <?php echo $t_merchants['total_must_be_100'] ?? 'Toplam %100 olmalıdır'; ?>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2: Pricing Type -->
                    <div class="form-section" id="pricingSection" style="display: none;">
                        <h3 class="form-section-title"><?php echo $t_merchants['pricing_type'] ?? 'Pricing Type'; ?></h3>
                        <div class="form-group">
                            <label><?php echo $t_merchants['price_type'] ?? 'Fiyat Kişi bazlı mı Grup bazlı mı?'; ?> *</label>
                            <select name="price_type" id="priceType" required>
                                <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                                <option value="person_based"><?php echo $t_merchants['person_based'] ?? 'Kişi Bazlı'; ?></option>
                                <option value="group_based"><?php echo $t_merchants['group_based'] ?? 'Grup Bazlı'; ?></option>
                            </select>
                            <span class="input-error-message"></span>
                        </div>
                        
                        <!-- Dynamic Pricing Fields -->
                        <div id="pricingFieldsContainer"></div>
                    </div>
                    
                    <!-- Step 3: Kickback Section -->
                    <div class="form-section" id="kickbackSection" style="display: none;">
                        <h3 class="form-section-title"><?php echo $t_merchants['kickback_catalog'] ?? 'KICKBACK - KATALOG'; ?></h3>
                        <div class="form-group">
                            <label><?php echo $t_merchants['kickback_type'] ?? 'Genel mı Kişi Bazlı mı?'; ?> *</label>
                            <select name="kickback_type" id="kickbackType" required>
                                <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                                <option value="general"><?php echo $t_merchants['general'] ?? 'Genel'; ?></option>
                                <option value="person_based"><?php echo $t_merchants['person_based'] ?? 'Kişi Bazlı'; ?></option>
                            </select>
                            <span class="input-error-message"></span>
                        </div>
                        
                        <!-- Dynamic Kickback Fields -->
                        <div id="kickbackFieldsContainer"></div>
                    </div>
                    
                    <!-- Step 4: Included in Price -->
                    <div class="form-section" id="includedPriceSection" style="display: none;">
                        <h3 class="form-section-title"><?php echo $t_merchants['extra_cost'] ?? 'Ek maliyet'; ?></h3>
                        <div class="form-group">
                            <label><?php echo $t_merchants['cost_items'] ?? 'Maliyet Listesi'; ?></label>
                            <button type="button" class="btn-select-costs" id="openCostItemsModalBtn">
                                <span class="material-symbols-rounded">list</span>
                                <?php echo $t_merchants['select_cost_items'] ?? 'Maliyet Seç'; ?>
                            </button>
                            <div id="selectedCostItemsContainer" class="selected-cost-items">
                                <p class="no-selection"><?php echo $t_merchants['no_cost_items_selected'] ?? 'Henüz maliyet seçilmedi'; ?></p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label><?php echo $t_merchants['food'] ?? 'Yiyecek'; ?></label>
                            <textarea name="food" id="food" rows="4" placeholder="<?php echo $t_merchants['food_placeholder'] ?? 'Yiyecek bilgisi...'; ?>"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label><?php echo $t_merchants['drink'] ?? 'İçecek'; ?></label>
                            <textarea name="drink" id="drink" rows="4" placeholder="<?php echo $t_merchants['drink_placeholder'] ?? 'İçecek bilgisi...'; ?>"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label><?php echo $t_merchants['description'] ?? 'Açıklama'; ?></label>
                            <textarea name="description" id="description" rows="4" placeholder="<?php echo $t_merchants['description_placeholder'] ?? 'Açıklama...'; ?>"></textarea>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" id="cancelContractBtn">
                        <span class="material-symbols-rounded">close</span>
                        <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                    </button>
                    <button type="submit" class="btn-primary" id="submitContractBtn">
                        <span class="material-symbols-rounded">save</span>
                        <?php echo $t_common['save'] ?? 'Save'; ?>
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Cost Items Selection Modal -->
    <div class="modal" id="costItemsModal">
        <div class="modal-content modal-content-large">
            <div class="modal-header">
                <h2><?php echo $t_merchants['select_cost_items'] ?? 'Maliyet Seç'; ?></h2>
                <button class="btn-close" id="closeCostItemsModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="modal-body modal-body-scrollable">
                <div id="costItemsContainer">
                    <!-- Cost items will be loaded dynamically -->
                    <div class="loading-small">
                        <span class="material-symbols-rounded">sync</span>
                        <span><?php echo $t_common['loading'] ?? 'Loading...'; ?></span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="cancelCostItemsBtn">
                    <span class="material-symbols-rounded">close</span>
                    <?php echo $t_common['cancel'] ?? 'Cancel'; ?>
                </button>
                <button type="button" class="btn-primary" id="saveCostItemsBtn">
                    <span class="material-symbols-rounded">check</span>
                    <?php echo $t_common['save'] ?? 'Save'; ?>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Page configuration for JavaScript -->
    <script type="application/json" id="page-config">
    <?php
    echo json_encode([
        'basePath' => $basePath,
        'apiBase' => $basePath . 'api/definitions/merchant-contracts.php',
        'merchantsApiBase' => $basePath . 'api/definitions/merchants.php',
        'toursApiBase' => $basePath . 'api/definitions/tours.php',
        'currenciesApiBase' => $basePath . 'api/definitions/currencies.php',
        'locationsApiBase' => $basePath . 'api/definitions/locations.php',
        'costsApiBase' => $basePath . 'api/definitions/costs.php',
        'merchantId' => $merchantId,
        'csrfToken' => csrfToken(),
        'translations' => [
            'merchants' => $t_merchants,
            'common' => $t_common,
            'sidebar' => $t_sidebar
        ]
    ], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT);
    ?>
    </script>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast-container"></div>
    
    <script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/common.js"></script>
    <!-- Modal, Form Validation & Handler Utilities -->
    <script src="<?php echo $basePath; ?>assets/js/modal-manager.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/form-validator.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/form-handler.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/date-range-picker.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
    <script src="<?php echo $basePath; ?>assets/js/app/definitions/merchant-contract.js"></script>
</body>
</html>

