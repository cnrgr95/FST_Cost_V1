<?php
/**
 * Currency Country Management Page
 * Manages currencies and exchange rates for a specific country
 */

session_start();

// Define base path
$basePath = '../../';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . $basePath . 'login.php');
    exit;
}

// Load translation helper
require_once $basePath . 'includes/translations.php';

// Load security helper for CSRF token
require_once $basePath . 'includes/security.php';

// Get translations
$t_sidebar = $all_translations['sidebar'] ?? [];
$t_common = $all_translations['common'] ?? [];
$t_currencies = $all_translations['currencies'] ?? [];

// Get country ID from URL
$countryId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title><?php echo ($t_currencies['manage_country'] ?? 'Manage Country') . ' - ' . ($all_translations['app']['name'] ?? 'FST Cost Management'); ?></title>
	
	<!-- Google Fonts for Icons -->
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />
	
	<!-- Font Awesome -->
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
	
	<!-- CSS Files -->
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/sidebar.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/includes/topbar.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/common.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/confirm-dialog.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/select-search.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/currencies.css">
	<link rel="stylesheet" href="<?php echo $basePath; ?>assets/css/app/definitions/currency-country.css">
	
	<link rel="icon" type="image/svg+xml" href="<?php echo $basePath; ?>assets/images/logo.svg">
</head>
<body>
	<?php include $basePath . 'includes/sidebar.php'; ?>
	<div class="main-content">
		<?php include $basePath . 'includes/topbar.php'; ?>
		<div class="content-wrapper">
			<div class="currencies-container">
				<div class="currencies-header">
					<h1 id="ccCountryTitle"><?php echo $t_currencies['manage_country'] ?? 'Manage Country'; ?></h1>
					<a class="btn-add" href="<?php echo $basePath; ?>app/definitions/currencies.php">
						<span class="material-symbols-rounded">arrow_back</span>
						<?php echo $t_common['back'] ?? 'Back'; ?>
					</a>
				</div>
				<!-- Action Buttons -->
				<div class="currency-country-button-group">
					<button class="btn-primary" id="ccOpenBase">
						<span class="material-symbols-rounded">settings</span>
						<?php echo $t_currencies['base_currency'] ?? 'Base currency of country'; ?>
					</button>
					<button class="btn-secondary" id="ccOpenAdd">
						<span class="material-symbols-rounded">add</span>
						<?php echo $t_currencies['add_country_currency'] ?? 'Add currency to country'; ?>
					</button>
					<button class="btn-secondary" id="ccOpenCurrencies">
						<span class="material-symbols-rounded">list</span>
						<?php echo $t_currencies['manage'] ?? 'Manage'; ?>
					</button>
				</div>
				<div class="form-group currency-country-form-group-hidden">
					<div id="ccCurrenciesListInline" class="table-wrapper"></div>
				</div>
				
				<!-- Exchange Rates Section -->
				<div class="currency-country-section">
					<h2 class="currency-country-section-title"><?php echo $t_currencies['exchange_rates'] ?? 'Exchange Rates'; ?></h2>
					<div class="currency-country-form-row">
						<div>
							<label><?php echo $t_currencies['currency'] ?? 'Currency'; ?></label>
							<select id="ccRateCurrency" class="currency-country-select"></select>
						</div>
						<div class="currency-country-date-wrapper">
							<label><?php echo ($t_currencies['start_date'] ?? 'Start Date') . ' - ' . ($t_currencies['end_date'] ?? 'End Date'); ?></label>
							<input type="text" id="ccRateRange" placeholder="<?php echo $t_currencies['date_range_placeholder'] ?? 'YYYY-MM-DD veya YYYY-MM-DD - YYYY-MM-DD'; ?>" class="currency-country-input" />
							<!-- hidden native date inputs to use single-calendar flow -->
							<input type="date" id="ccRateStart" class="currency-country-date-input" />
							<input type="date" id="ccRateEnd" class="currency-country-date-input" />
							<!-- inline two-month range picker -->
							<div id="ccRangePicker" class="currency-country-range-picker"></div>
						</div>
						<div>
							<label><?php echo $t_currencies['rate'] ?? 'Rate'; ?></label>
							<input type="number" step="0.000001" id="ccRateValue" placeholder="<?php echo $t_currencies['rate_placeholder'] ?? '1.000000'; ?>" />
						</div>
						<button class="btn-primary" id="ccAddRateRange">
							<span class="material-symbols-rounded">add</span>
							<?php echo $t_currencies['add_rate_range'] ?? 'Add Range'; ?>
						</button>
                        <button class="btn-secondary" id="ccFetchCbrt">
							<span class="material-symbols-rounded">cloud_download</span>
							<?php echo $t_currencies['fetch_cbrt'] ?? 'Fetch CBRT'; ?>
						</button>
                        <button class="btn-secondary" id="ccFetchCbrtBulk">
                            <span class="material-symbols-rounded">cloud_sync</span>
                            <?php echo $t_currencies['fetch_cbrt_bulk'] ?? 'Fetch CBRT (Bulk)'; ?>
                        </button>
					</div>
				</div>
				<div class="currency-country-table-wrapper">
					<div id="ccRatesList" class="table-wrapper"></div>
				</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Single Edit Modal for Rate -->
	<div class="modal currency-country-modal" id="ccRateEditModal">
		<div class="modal-content">
			<div class="modal-header">
                <h2 id="ccRateEditTitle"><?php echo $t_currencies['edit_rate'] ?? 'Edit Rate'; ?></h2>
				<button class="btn-close" id="ccRateEditClose">
					<span class="material-symbols-rounded">close</span>
				</button>
			</div>
			<div class="form-group">
				<label><?php echo $t_currencies['currency'] ?? 'Currency'; ?></label>
				<input type="text" id="ccRateEditCurrency" readonly class="input-readonly" />
			</div>
			<div class="form-group">
				<label><?php echo $t_currencies['date'] ?? 'Date'; ?></label>
				<input type="text" id="ccRateEditDate" readonly class="input-readonly" />
			</div>
			<div class="form-group">
				<label><?php echo $t_currencies['rate'] ?? 'Rate'; ?></label>
				<input type="number" step="0.000001" id="ccRateEditValue" />
				<input type="hidden" id="ccRateEditId" />
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" id="ccRateEditCancel"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
				<button type="button" class="btn-primary" id="ccRateEditSave"><?php echo $t_common['save'] ?? 'Save'; ?></button>
			</div>
		</div>
	</div>

	<!-- Base Currency Modal -->
	<div class="modal currency-country-modal" id="ccBaseModal">
		<div class="modal-content">
			<div class="modal-header">
				<h2><?php echo $t_currencies['base_currency'] ?? 'Base currency of country'; ?></h2>
				<button class="btn-close" id="ccBaseClose"><span class="material-symbols-rounded">close</span></button>
			</div>
			<div class="form-group">
				<label><?php echo $t_currencies['currency'] ?? 'Currency'; ?></label>
				<select id="ccBaseCurrency" class="currency-country-select"></select>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" id="ccBaseCancel"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
				<button type="button" class="btn-primary" id="ccSaveBase"><?php echo $t_common['save'] ?? 'Save'; ?></button>
			</div>
		</div>
	</div>

	<!-- Add Country Currency Modal -->
	<div class="modal currency-country-modal" id="ccAddCurModal">
		<div class="modal-content">
			<div class="modal-header">
				<h2><?php echo $t_currencies['add_country_currency'] ?? 'Add currency to country'; ?></h2>
				<button class="btn-close" id="ccAddClose"><span class="material-symbols-rounded">close</span></button>
			</div>
			<div class="form-group form-group-flex">
				<select id="ccAddCurrency" class="currency-country-select"></select>
				<input id="ccUnitName" type="text" placeholder="<?php echo ($t_currencies['unit_name_placeholder'] ?? $t_currencies['unit_name'] ?? 'Unit name (optional)'); ?>" class="currency-country-input-small" />
				<label class="currency-country-checkbox-label">
					<input id="ccIsActive" type="checkbox" checked />
					<?php echo $t_currencies['active'] ?? 'Active'; ?>
				</label>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" id="ccAddCancel"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
				<button type="button" class="btn-primary" id="ccAddBtn"><?php echo $t_currencies['add'] ?? 'Add'; ?></button>
			</div>
		</div>
	</div>

	<!-- Manage Country Currencies Modal -->
	<div class="modal currency-country-modal" id="ccCurrenciesModal">
		<div class="modal-content currency-country-modal-large">
			<div class="modal-header">
				<h2><?php echo $t_currencies['manage_country'] ?? 'Manage Country'; ?></h2>
				<button class="btn-close" id="ccCurrenciesClose"><span class="material-symbols-rounded">close</span></button>
			</div>
			<div class="form-group">
				<div id="ccCurrenciesList" class="table-wrapper"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" id="ccCurrenciesCancel"><?php echo $t_common['close'] ?? 'Close'; ?></button>
			</div>
		</div>
	</div>

	<!-- Per-Date Edit Modal -->
	<div class="modal currency-country-modal" id="ccDateEditModal">
		<div class="modal-content">
			<div class="modal-header">
                <h2 id="ccDateEditTitle"><?php echo $t_currencies['edit_rates'] ?? 'Edit Rates'; ?></h2>
				<button class="btn-close" id="ccDateEditClose">
					<span class="material-symbols-rounded">close</span>
				</button>
			</div>
			<div class="form-group">
				<label><?php echo $t_currencies['date'] ?? 'Date'; ?></label>
				<input type="text" id="ccDateEditDate" readonly class="input-readonly" />
			</div>
			<div class="form-group">
				<div id="ccDateEditList"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" id="ccDateEditCancel"><?php echo $t_common['cancel'] ?? 'Cancel'; ?></button>
				<button type="button" class="btn-primary" id="ccDateEditSave"><?php echo $t_common['save'] ?? 'Save'; ?></button>
			</div>
		</div>
	</div>

	<script type="application/json" id="page-config">
	<?php echo json_encode([
		'basePath' => $basePath,
		'apiBase' => $basePath . 'api/definitions/currencies.php',
		'countryId' => $countryId,
		'csrfToken' => csrfToken(),
		'translations' => [
			'currencies' => $t_currencies,
			'common' => $t_common,
			'sidebar' => $t_sidebar
		]
	], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_PRETTY_PRINT); ?>
	</script>
	
	<!-- Toast Notification Container -->
	<div id="toastContainer" class="toast-container"></div>
	
	<script src="<?php echo $basePath; ?>assets/js/includes/sidebar.js"></script>
	<script src="<?php echo $basePath; ?>assets/js/toast.js"></script>
	<script src="<?php echo $basePath; ?>assets/js/common.js"></script>
	<script src="<?php echo $basePath; ?>assets/js/date-range-picker.js"></script>
	<script src="<?php echo $basePath; ?>assets/js/select-search.js"></script>
	<script src="<?php echo $basePath; ?>assets/js/app/definitions/currency-country.js"></script>
</body>
</html>


