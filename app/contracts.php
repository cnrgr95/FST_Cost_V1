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
    <title><?php echo $t_sidebar['contract'] ?? 'Contract'; ?> - <?php echo $all_translations['app']['name'] ?? 'FST Cost Management'; ?></title>
    
    <!-- Google Fonts for Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/sidebar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/topbar.css">
    <link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
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
                    <h1><?php echo $t_sidebar['contract'] ?? 'Contract'; ?></h1>
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
                    <div class="contracts-table-wrapper">
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
    </div>
    
    <!-- Contract Modal -->
    <div id="contractModal" class="modal">
        <div class="modal-content" style="max-width: 1000px;">
            <div class="modal-header">
                <h2 id="modalTitle"><?php echo $t_common['add'] ?? 'Add'; ?> <?php echo $t_sidebar['contract'] ?? 'Contract'; ?></h2>
                <button class="modal-close" id="closeModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="contractForm">
                <input type="hidden" id="contractId">
                
                <!-- Contract Form Tabs -->
                <div class="contract-form-tabs">
                    <button type="button" class="contract-form-tab active" data-tab="basic">
                        <span class="material-symbols-rounded">info</span>
                        <?php echo $t_contracts['basic_info'] ?? 'Basic Info'; ?>
                    </button>
                    <button type="button" class="contract-form-tab" data-tab="pricing">
                        <span class="material-symbols-rounded">attach_money</span>
                        <?php echo $t_contracts['pricing'] ?? 'Pricing'; ?>
                    </button>
                </div>
                
                <!-- Tab Content: Basic Info -->
                <div class="contract-form-content active" id="basic-tab">
                <!-- Contract Code Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['contract_info'] ?? 'Contract Information'; ?></h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="contract_code"><?php echo $t_contracts['contract_code'] ?? 'Contract Code'; ?></label>
                            <input type="text" id="contract_code" name="contract_code" readonly style="background-color: #f3f4f6; cursor: not-allowed;">
                            <small style="color: #6b7280; font-size: 12px;"><?php echo $t_contracts['auto_generated'] ?? 'This code is automatically generated'; ?></small>
                        </div>
                    </div>
                </div>
                
                <!-- Basic Information Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['basic_info'] ?? 'Basic Information'; ?></h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="sub_region_id"><?php echo $t_contracts['sub_region'] ?? 'Sub Region'; ?> *</label>
                            <select id="sub_region_id" name="sub_region_id" required>
                                <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="merchant_id"><?php echo $t_contracts['merchant'] ?? 'Merchant'; ?> *</label>
                            <select id="merchant_id" name="merchant_id" required>
                                <option value=""><?php echo $t_common['select_sub_region_first'] ?? 'Please select sub region first'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_contracts['merchant_official_title'] ?? 'Official Title'; ?></label>
                            <input type="text" id="merchant_official_title" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label><?php echo $t_contracts['authorized_person'] ?? 'Authorized Person'; ?></label>
                            <input type="text" id="authorized_person" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?php echo $t_contracts['authorized_email'] ?? 'Authorized Email'; ?></label>
                            <input type="email" id="authorized_email" readonly>
                        </div>
                        
                        <div class="form-group">
                            <label for="tour_id"><?php echo $t_contracts['tour'] ?? 'Tour'; ?> *</label>
                            <select id="tour_id" name="tour_id" required>
                                <option value=""><?php echo $t_common['select_merchant_first'] ?? 'Please select merchant first'; ?></option>
                            </select>
                        </div>
                    </div>
                    
                </div>
                
                <!-- Contract Dates & VAT Section -->
                <div class="form-section">
                    <h3 class="section-title"><?php echo $t_contracts['contract_dates_vat'] ?? 'Contract Dates & VAT'; ?></h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="start_date"><?php echo $t_contracts['start_date'] ?? 'Start Date'; ?> *</label>
                            <input type="date" id="start_date" name="start_date" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="end_date"><?php echo $t_contracts['end_date'] ?? 'End Date'; ?> *</label>
                            <input type="date" id="end_date" name="end_date" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="vat_included"><?php echo $t_contracts['vat_included'] ?? 'VAT Status'; ?> *</label>
                            <select id="vat_included" name="vat_included" required>
                                <option value="included"><?php echo $t_contracts['vat_included_included'] ?? 'VAT Included'; ?></option>
                                <option value="excluded"><?php echo $t_contracts['vat_included_excluded'] ?? 'VAT Excluded'; ?></option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="vat_rate" id="vat_rate_label" style="opacity: 0.5;"><?php echo $t_contracts['vat_rate'] ?? 'VAT Rate (%)'; ?></label>
                            <input type="number" id="vat_rate" name="vat_rate" step="0.01" min="0" max="100" placeholder="0.00" disabled style="opacity: 0.5;">
                        </div>
                    </div>
                </div>
                
                     <!-- Included Content Section -->
                <div class="form-section">
                         <h3 class="section-title"><?php echo $t_contracts['included_content'] ?? 'Included Content'; ?></h3>
                         <div class="form-group full-width">
                             <textarea id="included_content" name="included_content" rows="4" placeholder="<?php echo $t_contracts['included_content_placeholder'] ?? 'Enter included content here...'; ?>"></textarea>
                         </div>
                     </div>
                 </div>
                 
                <!-- Tab Content: Pricing -->
                <div class="contract-form-content" id="pricing-tab">
                    <!-- Price Periods Section -->
                    <div class="form-section" id="price_periods_section" style="display: none;">
                        <h3 class="section-title"><?php echo $t_contracts['price_periods'] ?? 'Price Periods'; ?></h3>
                        <div class="form-group full-width">
                            <button type="button" class="btn btn-secondary" id="addPricePeriodBtn" style="margin-bottom: 16px;">
                                <span class="material-symbols-rounded">add</span>
                                <?php echo $t_contracts['add_price_period'] ?? 'Add Price Period'; ?>
                            </button>
                            <div id="price_periods_list" class="price-periods-list">
                                <!-- Price periods will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Kickback Periods Section -->
                    <div class="form-section" id="kickback_periods_section" style="display: none;">
                        <h3 class="section-title"><?php echo $t_contracts['kickback_periods'] ?? 'Kickback Periods'; ?></h3>
                        <div class="form-group full-width">
                            <button type="button" class="btn btn-secondary" id="addKickbackPeriodBtn" style="margin-bottom: 16px;">
                                <span class="material-symbols-rounded">add</span>
                                <?php echo $t_contracts['add_kickback_period'] ?? 'Add Kickback Period'; ?>
                            </button>
                            <div id="kickback_periods_list" class="kickback-periods-list">
                                <!-- Kickback periods will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Transfer Periods Section -->
                    <div class="form-section" id="transfer_periods_section" style="display: none;">
                        <h3 class="section-title"><?php echo $t_contracts['transfer_periods'] ?? 'Transfer Periods'; ?></h3>
                        <div class="form-group full-width">
                            <button type="button" class="btn btn-secondary" id="addTransferPeriodBtn" style="margin-bottom: 16px;">
                                <span class="material-symbols-rounded">add</span>
                                <?php echo $t_contracts['add_transfer_period'] ?? 'Add Transfer Period'; ?>
                            </button>
                            <div id="transfer_periods_list" class="transfer-periods-list">
                                <!-- Transfer periods will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions Section -->
                    <div class="form-section" id="actions_section" style="display: none;">
                        <h3 class="section-title"><?php echo $t_contracts['actions'] ?? 'Actions'; ?></h3>
                        <div class="form-group full-width">
                            <button type="button" class="btn btn-secondary" id="addActionBtn" style="margin-bottom: 16px;">
                                <span class="material-symbols-rounded">add</span>
                                <?php echo $t_contracts['add_action'] ?? 'Add Action'; ?>
                            </button>
                            <div id="actions_list" class="actions-list">
                                <!-- Actions will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Action Modal -->
    <div id="actionModal" class="modal">
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2 id="actionModalTitle"><?php echo $t_contracts['add_action'] ?? 'Add Action'; ?></h2>
                <button class="modal-close" id="closeActionModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="actionForm">
                <input type="hidden" id="actionId">
                <input type="hidden" id="actionContractId">
                
                <div class="form-group">
                    <label for="action_name"><?php echo $t_contracts['action_name'] ?? 'Action Name'; ?> *</label>
                    <input type="text" id="action_name" name="action_name" required>
                </div>
                
                <div class="form-group">
                    <label for="action_description"><?php echo $t_contracts['action_description'] ?? 'Action Description'; ?></label>
                    <textarea id="action_description" name="action_description" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="action_start_date"><?php echo $t_contracts['action_start_date'] ?? 'Start Date'; ?> *</label>
                        <input type="date" id="action_start_date" name="action_start_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="action_end_date"><?php echo $t_contracts['action_end_date'] ?? 'End Date'; ?> *</label>
                        <input type="date" id="action_end_date" name="action_end_date" required>
                    </div>
                </div>
                
                <!-- Pricing Method -->
                <div class="form-group full-width">
                    <label><?php echo $t_contracts['pricing_method'] ?? 'Pricing Method'; ?></label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="action_price_type" value="fixed" id="action_price_type_fixed">
                            <span><?php echo $t_contracts['fixed_price'] ?? 'Tüm Bölgelerde Sabit Fiyat'; ?></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="action_price_type" value="regional" id="action_price_type_regional">
                            <span><?php echo $t_contracts['regional_price'] ?? 'Bölge Bazlı Fiyat'; ?></span>
                        </label>
                    </div>
                </div>
                
                <!-- Fixed Price -->
                <div id="action_fixed_price_container" style="display: none;">
                    <!-- Age Ranges -->
                    <div class="form-group full-width">
                        <label class="subsection-label"><?php echo $t_contracts['age_ranges'] ?? 'Age Ranges'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label for="action_adult_age"><?php echo $t_contracts['adult_age'] ?? 'Adult Age'; ?></label>
                                <input type="text" id="action_adult_age" name="adult_age" placeholder="13+">
                            </div>
                            <div class="form-group">
                                <label for="action_child_age_range"><?php echo $t_contracts['child_age'] ?? 'Child Age'; ?></label>
                                <input type="text" id="action_child_age_range" name="child_age_range" placeholder="3-12">
                            </div>
                            <div class="form-group">
                                <label for="action_infant_age_range"><?php echo $t_contracts['infant_age'] ?? 'Infant Age'; ?></label>
                                <input type="text" id="action_infant_age_range" name="infant_age_range" placeholder="0-2">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Fixed Prices -->
                    <div class="form-group full-width">
                        <label class="subsection-label"><?php echo $t_contracts['fixed_price'] ?? 'Fixed Price'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label><?php echo $t_contracts['adult_price'] ?? 'Adult Price'; ?></label>
                                <input type="number" id="action_adult_price" name="adult_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label><?php echo $t_contracts['child_price'] ?? 'Child Price'; ?></label>
                                <input type="number" id="action_child_price" name="child_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label><?php echo $t_contracts['infant_price'] ?? 'Infant Price'; ?></label>
                                <input type="number" id="action_infant_price" name="infant_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="action_currency"><?php echo $t_contracts['currency'] ?? 'Currency'; ?></label>
                                <select id="action_currency" name="action_currency">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="TL">TL</option>
                                    <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Regional Prices -->
                <div id="action_regional_price_container" style="display: none;">
                    <!-- Age Ranges -->
                    <div class="form-group full-width">
                        <label class="subsection-label"><?php echo $t_contracts['age_ranges'] ?? 'Age Ranges'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                <label for="action_regional_adult_age"><?php echo $t_contracts['adult_age'] ?? 'Adult Age'; ?></label>
                                <input type="text" id="action_regional_adult_age" name="regional_adult_age" placeholder="13+">
                            </div>
                            <div class="form-group">
                                <label for="action_regional_child_age"><?php echo $t_contracts['child_age'] ?? 'Child Age'; ?></label>
                                <input type="text" id="action_regional_child_age" name="regional_child_age" placeholder="3-12">
                            </div>
                            <div class="form-group">
                                <label for="action_regional_infant_age"><?php echo $t_contracts['infant_age'] ?? 'Infant Age'; ?></label>
                                <input type="text" id="action_regional_infant_age" name="regional_infant_age" placeholder="0-2">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Regional Prices -->
                    <div class="form-group full-width">
                        <label class="subsection-label"><?php echo $t_contracts['regional_prices'] ?? 'Regional Prices'; ?></label>
                        <div id="action_regional_prices_container" class="regional-prices-container">
                            <!-- Regional prices will be loaded here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelActionBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Kickback Period Modal -->
    <div id="kickbackPeriodModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2 id="kickbackPeriodModalTitle"><?php echo $t_contracts['add_kickback_period'] ?? 'Add Kickback Period'; ?></h2>
                <button class="modal-close" id="closeKickbackPeriodModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="kickbackPeriodForm">
                <input type="hidden" id="kickbackPeriodId">
                <input type="hidden" id="kickbackPeriodContractId">
                
                <div class="form-group">
                    <label for="kickback_period_name"><?php echo $t_contracts['period_name'] ?? 'Period Name'; ?> *</label>
                    <input type="text" id="kickback_period_name" name="period_name" placeholder="örn: Yüksek Sezon, Düşük Sezon" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="kickback_period_start_date"><?php echo $t_contracts['start_date'] ?? 'Start Date'; ?> *</label>
                        <input type="date" id="kickback_period_start_date" name="start_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="kickback_period_end_date"><?php echo $t_contracts['end_date'] ?? 'End Date'; ?> *</label>
                        <input type="date" id="kickback_period_end_date" name="end_date" required>
                    </div>
                </div>
                
                <!-- Kickback Calculation (ÖNCE) -->
                <div class="form-row">
                    <div class="form-group">
                        <label><?php echo $t_contracts['kickback_calculation'] ?? 'Kickback Calculation'; ?></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="kickback_per_person" value="0" id="kickback_per_person_0">
                                <span><?php echo $t_contracts['over_revenue'] ?? 'Over Revenue'; ?></span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="kickback_per_person" value="1" id="kickback_per_person_1" checked>
                                <span><?php echo $t_contracts['per_person'] ?? 'Per Person'; ?></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="kickback_period_min_persons"><?php echo $t_contracts['min_persons'] ?? 'Minimum Persons'; ?></label>
                        <input type="number" id="kickback_period_min_persons" name="kickback_min_persons" min="1" placeholder="0">
                    </div>
                </div>
                
                <!-- Kickback Type and Values (SONRA) -->
                <div class="form-row three-columns">
                    <div class="form-group">
                        <label for="kickback_period_type"><?php echo $t_contracts['kickback_type'] ?? 'Kickback Type'; ?></label>
                        <select id="kickback_period_type" name="kickback_type">
                            <option value=""><?php echo $t_common['select'] ?? 'Select...'; ?></option>
                            <option value="fixed"><?php echo $t_contracts['fixed_amount'] ?? 'Sabit Tutar'; ?></option>
                            <option value="percentage"><?php echo $t_contracts['percentage'] ?? 'Yüzde'; ?></option>
                        </select>
                    </div>
                    
                    <!-- Fixed Amount Fields (shown when type=fixed) -->
                    <div class="form-group" id="kickback_fixed_value_field" style="display: none;">
                        <label for="kickback_period_value"><?php echo $t_contracts['kickback_amount'] ?? 'Amount'; ?></label>
                        <input type="number" id="kickback_period_value" name="kickback_value" step="0.01" min="0" placeholder="0.00">
                    </div>
                    
                    <div class="form-group" id="kickback_fixed_currency_field" style="display: none;">
                        <label for="kickback_period_currency"><?php echo $t_contracts['currency'] ?? 'Currency'; ?></label>
                        <select id="kickback_period_currency" name="kickback_currency">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="TL">TL</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                    
                    <!-- Percentage Field (shown when type=percentage) -->
                    <div class="form-group" id="kickback_percentage_field" style="display: none;">
                        <label for="kickback_period_percentage"><?php echo $t_contracts['percentage_rate'] ?? 'Percentage (%)'; ?></label>
                        <input type="number" id="kickback_period_percentage" name="kickback_percentage" step="0.01" min="0" max="100" placeholder="0.00">
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelKickbackPeriodBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Transfer Period Modal -->
    <div id="transferPeriodModal" class="modal">
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2 id="transferPeriodModalTitle"><?php echo $t_contracts['add_transfer_period'] ?? 'Add Transfer Period'; ?></h2>
                <button class="modal-close" id="closeTransferPeriodModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="transferPeriodForm">
                <input type="hidden" id="transferPeriodId">
                <input type="hidden" id="transferPeriodContractId">
                
                <!-- Date Range -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="transfer_period_start_date"><?php echo $t_contracts['start_date'] ?? 'Start Date'; ?> *</label>
                        <input type="date" id="transfer_period_start_date" name="start_date" required>
                    </div>
                    <div class="form-group">
                        <label for="transfer_period_end_date"><?php echo $t_contracts['end_date'] ?? 'End Date'; ?> *</label>
                        <input type="date" id="transfer_period_end_date" name="end_date" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="transfer_period_name"><?php echo $t_contracts['period_name'] ?? 'Period Name'; ?> *</label>
                    <input type="text" id="transfer_period_name" name="period_name" placeholder="örn: Yüksek Sezon, Düşük Sezon" required>
                </div>
                
                <!-- Transfer Owner Selection -->
                        <div class="form-group full-width">
                    <label><?php echo $t_contracts['transfer_owner'] ?? 'Transfer Kimde'; ?> *</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                            <input type="checkbox" id="transfer_period_owner_agency" value="agency">
                            <span><?php echo $t_contracts['agency'] ?? 'Acente'; ?></span>
                                </label>
                                <label class="checkbox-label">
                            <input type="checkbox" id="transfer_period_owner_supplier" value="supplier">
                            <span><?php echo $t_contracts['supplier'] ?? 'Tedarikçi'; ?></span>
                                </label>
                            </div>
                </div>
                
                <!-- Pricing Method Selection -->
                <div class="form-group full-width" id="transfer_pricing_method_group" style="display: none;">
                    <label><?php echo $t_contracts['pricing_method'] ?? 'Pricing Method'; ?> *</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="pricing_method" value="fixed_price" id="transfer_pricing_fixed">
                            <span><?php echo $t_contracts['fixed_price'] ?? 'Fixed Price'; ?></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="pricing_method" value="regional_price" id="transfer_pricing_regional">
                            <span><?php echo $t_contracts['regional_price'] ?? 'Regional Price'; ?></span>
                        </label>
                        </div>
                    </div>
                    
                <!-- Fixed Price Options (Tüm Bölgelerde Sabit Fiyat) -->
                <div id="transfer_fixed_price_container" style="display: none;">
                    <!-- Fixed Price Type Selection -->
                    <div class="form-group full-width">
                        <label><?php echo $t_contracts['fixed_price_type'] ?? 'Fixed Price Type'; ?></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="fixed_price_type" value="per_person" id="transfer_fixed_per_person">
                                <span><?php echo $t_contracts['per_person'] ?? 'Per Person'; ?></span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="fixed_price_type" value="group" id="transfer_fixed_group">
                                <span><?php echo $t_contracts['group_total'] ?? 'Group Total'; ?></span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Per Person with Age Groups -->
                    <div id="transfer_fixed_per_person_container" style="display: none;">
                        <div class="form-group full-width">
                            <label class="subsection-label"><?php echo $t_contracts['age_ranges'] ?? 'Age Ranges'; ?></label>
                            <div class="form-row three-columns">
                                <div class="form-group">
                                    <label for="transfer_adult_age"><?php echo $t_contracts['adult_age'] ?? 'Adult Age'; ?></label>
                                    <input type="text" id="transfer_adult_age" name="adult_age" placeholder="13+">
                                </div>
                        <div class="form-group">
                                    <label for="transfer_child_age_range"><?php echo $t_contracts['child_age'] ?? 'Child Age'; ?></label>
                                    <input type="text" id="transfer_child_age_range" name="child_age_range" placeholder="3-12">
                        </div>
                        <div class="form-group">
                                    <label for="transfer_infant_age_range"><?php echo $t_contracts['infant_age'] ?? 'Infant Age'; ?></label>
                                    <input type="text" id="transfer_infant_age_range" name="infant_age_range" placeholder="0-2">
                                </div>
                        </div>
                    </div>
                    
                        <div class="form-group full-width">
                            <label class="subsection-label"><?php echo $t_contracts['age_prices'] ?? 'Prices by Age'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                                    <label><?php echo $t_contracts['adult_price'] ?? 'Adult'; ?></label>
                                    <input type="number" id="transfer_adult_price" name="adult_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            <div class="form-group">
                                    <label><?php echo $t_contracts['child_price'] ?? 'Child'; ?></label>
                                    <input type="number" id="transfer_child_price" name="child_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            <div class="form-group">
                                    <label><?php echo $t_contracts['infant_price'] ?? 'Infant'; ?></label>
                                    <input type="number" id="transfer_infant_price" name="infant_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                    <label for="transfer_fixed_currency"><?php echo $t_contracts['currency'] ?? 'Currency'; ?></label>
                                    <select id="transfer_fixed_currency" name="fixed_currency">
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="TL">TL</option>
                                        <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                    <!-- Group Total Price with Ranges -->
                    <div id="transfer_fixed_group_container" style="display: none;">
                        <div class="form-group full-width">
                            <label class="subsection-label">
                                <?php echo $t_contracts['group_ranges'] ?? 'Group Ranges'; ?>
                                <button type="button" class="btn btn-sm btn-secondary" id="addTransferFixedGroupRange" style="margin-left: 12px;">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">add</span>
                                    <?php echo $t_contracts['add_range'] ?? 'Add Range'; ?>
                                </button>
                            </label>
                            <div id="transfer_fixed_group_ranges_list">
                                <!-- Group ranges will be added here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Regional Price Options (Bölge Bazlı Fiyat) -->
                <div id="transfer_regional_price_container" style="display: none;">
                    <!-- Regional Price Type Selection -->
                    <div class="form-group full-width">
                        <label><?php echo $t_contracts['regional_price_type'] ?? 'Regional Price Type'; ?></label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="regional_price_type" value="per_person" id="transfer_regional_per_person">
                                <span><?php echo $t_contracts['per_person'] ?? 'Per Person'; ?></span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="regional_price_type" value="group" id="transfer_regional_group">
                                <span><?php echo $t_contracts['group_ranges'] ?? 'Group Ranges'; ?></span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Regional Per Person -->
                    <div id="transfer_regional_per_person_container" style="display: none;">
                        <div class="form-group full-width">
                            <label class="subsection-label"><?php echo $t_contracts['age_ranges'] ?? 'Age Ranges'; ?></label>
                            <div class="form-row three-columns">
                                <div class="form-group">
                                    <label for="transfer_regional_adult_age"><?php echo $t_contracts['adult_age'] ?? 'Adult Age'; ?></label>
                                    <input type="text" id="transfer_regional_adult_age" name="regional_adult_age" placeholder="13+">
                                </div>
                                <div class="form-group">
                                    <label for="transfer_regional_child_age"><?php echo $t_contracts['child_age'] ?? 'Child Age'; ?></label>
                                    <input type="text" id="transfer_regional_child_age" name="regional_child_age" placeholder="3-12">
                                </div>
                                <div class="form-group">
                                    <label for="transfer_regional_infant_age"><?php echo $t_contracts['infant_age'] ?? 'Infant Age'; ?></label>
                                    <input type="text" id="transfer_regional_infant_age" name="regional_infant_age" placeholder="0-2">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label class="subsection-label"><?php echo $t_contracts['regional_prices'] ?? 'Regional Prices'; ?></label>
                            <div id="transfer_regional_prices_container" class="regional-prices-container">
                                <!-- Regional prices (per person) will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Regional Group-Based -->
                    <div id="transfer_regional_group_container" style="display: none;">
                        <div class="form-group full-width">
                            <label class="subsection-label">
                                <?php echo $t_contracts['regional_group_ranges'] ?? 'Regional Group Ranges'; ?>
                            </label>
                            <div id="transfer_regional_group_container_list">
                                <!-- Regional group ranges will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelTransferPeriodBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Price Period Modal -->
    <div id="pricePeriodModal" class="modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2 id="pricePeriodModalTitle"><?php echo $t_contracts['add_price_period'] ?? 'Add Price Period'; ?></h2>
                <button class="modal-close" id="closePricePeriodModal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            
            <form id="pricePeriodForm">
                <input type="hidden" id="pricePeriodId">
                <input type="hidden" id="pricePeriodContractId">
                
                <div class="form-group">
                    <label for="period_name"><?php echo $t_contracts['price_period_name'] ?? 'Period Name'; ?> *</label>
                    <input type="text" id="period_name" name="period_name" placeholder="örn: Yüksek Sezon, Düşük Sezon" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="period_start_date"><?php echo $t_contracts['action_start_date'] ?? 'Start Date'; ?> *</label>
                        <input type="date" id="period_start_date" name="start_date" required>
                </div>
                
                    <div class="form-group">
                        <label for="period_end_date"><?php echo $t_contracts['action_end_date'] ?? 'End Date'; ?> *</label>
                        <input type="date" id="period_end_date" name="end_date" required>
                    </div>
                </div>
                
                <!-- Tour Departure Days -->
                <div class="form-group">
                    <label><?php echo $t_contracts['tour_departure_days'] ?? 'Tour Departure Days'; ?></label>
                    <div class="checkbox-group" style="flex-wrap: wrap;">
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="monday">
                            <span><?php echo $t_contracts['monday'] ?? 'Monday'; ?></span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="tuesday">
                            <span><?php echo $t_contracts['tuesday'] ?? 'Tuesday'; ?></span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="wednesday">
                            <span><?php echo $t_contracts['wednesday'] ?? 'Wednesday'; ?></span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="thursday">
                            <span><?php echo $t_contracts['thursday'] ?? 'Thursday'; ?></span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="friday">
                            <span><?php echo $t_contracts['friday'] ?? 'Friday'; ?></span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="saturday">
                            <span><?php echo $t_contracts['saturday'] ?? 'Saturday'; ?></span>
                            </label>
                        <label class="checkbox-label">
                            <input type="checkbox" class="period-departure-day" value="sunday">
                            <span><?php echo $t_contracts['sunday'] ?? 'Sunday'; ?></span>
                            </label>
                        </div>
                    <input type="hidden" id="period_days_of_week" name="days_of_week" value="">
                    </div>
                    
                <!-- Age Groups and Currency -->
                <div class="form-group full-width">
                        <label class="subsection-label"><?php echo $t_contracts['age_currency'] ?? 'Age Information & Currency'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                            <label for="period_adult_age"><?php echo $t_contracts['adult_age'] ?? 'Adult Age'; ?></label>
                            <input type="text" id="period_adult_age" name="adult_age" placeholder="+12">
                            </div>
                            
                            <div class="form-group">
                            <label for="period_child_age_range"><?php echo $t_contracts['child_age'] ?? 'Child Age Range'; ?></label>
                            <input type="text" id="period_child_age_range" name="child_age_range" placeholder="6-11">
                            </div>
                            
                            <div class="form-group">
                            <label for="period_infant_age_range"><?php echo $t_contracts['infant_age'] ?? 'Infant Age Range'; ?></label>
                            <input type="text" id="period_infant_age_range" name="infant_age_range" placeholder="0-5">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                            <label for="period_currency"><?php echo $t_contracts['currency'] ?? 'Currency'; ?></label>
                            <select id="period_currency" name="currency">
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="TL">TL</option>
                                <option value="GBP">GBP</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                <!-- Price Type Selection -->
                <div class="form-group full-width">
                    <label class="price-type-label"><?php echo $t_contracts['price_type'] ?? 'Price Type'; ?></label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="price_type" value="regional" id="period_price_type_regional" checked>
                            <span><?php echo $t_contracts['regional_price'] ?? 'Regional Price'; ?></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="price_type" value="fixed" id="period_price_type_fixed">
                            <span><?php echo $t_contracts['fixed_price'] ?? 'Fixed Price for All Regions'; ?></span>
                        </label>
                    </div>
                </div>
                
                <!-- Fixed Price Section -->
                <div class="form-group full-width" id="period_fixed_price_section" style="display: none;">
                        <label class="subsection-label"><?php echo $t_contracts['fixed_price'] ?? 'Fixed Price for All Regions'; ?></label>
                        <div class="form-row three-columns">
                            <div class="form-group">
                            <label for="period_adult_price"><?php echo $t_contracts['adult_price'] ?? 'Adult Price'; ?></label>
                            <input type="number" id="period_adult_price" name="adult_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                            <label for="period_child_price"><?php echo $t_contracts['child_price'] ?? 'Child Price'; ?></label>
                            <input type="number" id="period_child_price" name="child_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                            
                            <div class="form-group">
                            <label for="period_infant_price"><?php echo $t_contracts['infant_price'] ?? 'Infant Price'; ?></label>
                            <input type="number" id="period_infant_price" name="infant_price" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Regional Prices Section -->
                <div class="form-group full-width" id="period_regional_prices_section">
                        <label class="subsection-label"><?php echo $t_contracts['regional_prices'] ?? 'Regional Prices'; ?></label>
                    <div id="period_regional_prices_container" class="regional-prices-container">
                            <!-- Regional prices will be loaded here dynamically -->
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="price_period_notes"><?php echo $t_contracts['price_period_notes'] ?? 'Notes'; ?></label>
                    <textarea id="price_period_notes" name="notes" rows="2" placeholder="Notlar..."></textarea>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelPricePeriodBtn"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
                    <button type="submit" class="btn btn-primary"><?php echo $t_common['save'] ?? 'Save'; ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Contract Summary Modal -->
    <div id="contractSummaryModal" class="modal">
        <div class="modal-content" style="max-width: 1200px; max-height: 90vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center;">
                <h2><?php echo $t_contracts['contract_summary'] ?? 'Contract Summary'; ?></h2>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon btn-info" onclick="printContractSummary()" title="<?php echo $t_common['print'] ?? 'Print'; ?>" style="background: #e0f2fe; color: #0369a1;">
                        <span class="material-symbols-rounded">print</span>
                    </button>
                    <button class="modal-close" onclick="closeContractSummary()">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            </div>
            <div class="modal-body" id="contractSummaryContent" style="padding: 24px 30px; overflow-y: auto; flex: 1; max-height: calc(90vh - 100px); text-align: center;">
                <!-- Summary content will be loaded here -->
            </div>
        </div>
    </div>
    
    <style>
        /* Main Content Styles */
        .main-content {
            margin-left: var(--sidebar-width);
            transition: margin-left 0.4s ease;
        }
        
        .sidebar.collapsed ~ .main-content {
            margin-left: var(--sidebar-collapsed-width);
        }
        
        .content-wrapper {
            margin-top: 70px;
            padding: 30px;
        }
        
        /* Contract Form Tabs - Similar to locations.php style */
        .contract-form-tabs {
            display: flex;
            gap: 10px;
            border-bottom: 2px solid #e5e7eb;
            padding: 0 30px;
            background: #f9fafb;
            margin-bottom: 20px;
        }
        
        .contract-form-tab {
            padding: 12px 24px;
            background: none;
            border: none;
            color: #6b7280;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .contract-form-tab:hover {
            color: #151A2D;
        }
        
        .contract-form-tab.active {
            color: #151A2D;
            border-bottom-color: #151A2D;
        }
        
        .contract-form-content {
            display: none;
        }
        
        .contract-form-content.active {
            display: block;
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

