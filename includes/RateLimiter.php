<?php
/**
 * Rate Limiter
 * Simple in-memory rate limiting implementation
 * For production, consider using Redis or Memcached
 */

class RateLimiter {
    
    private static $limits = [];
    private static $cacheFile = null;
    
    /**
     * Initialize rate limiter
     */
    public static function init($cacheFile = null) {
        if ($cacheFile === null) {
            $cacheFile = LOG_PATH . '.ratelimit_cache.json';
        }
        self::$cacheFile = $cacheFile;
        self::loadCache();
    }
    
    /**
     * Load rate limit cache from file
     */
    private static function loadCache() {
        if (self::$cacheFile && file_exists(self::$cacheFile)) {
            $content = @file_get_contents(self::$cacheFile);
            if ($content !== false) {
                $data = @json_decode($content, true);
                if (is_array($data)) {
                    // Remove expired entries
                    $now = time();
                    foreach ($data as $key => $info) {
                        if (isset($info['reset']) && $info['reset'] < $now) {
                            unset($data[$key]);
                        }
                    }
                    self::$limits = $data;
                }
            }
        }
    }
    
    /**
     * Save rate limit cache to file
     */
    private static function saveCache() {
        if (self::$cacheFile) {
            @file_put_contents(self::$cacheFile, json_encode(self::$limits));
        }
    }
    
    /**
     * Check if request is within rate limit
     * @param string $identifier Unique identifier (e.g., IP address, user ID)
     * @param int $maxRequests Maximum number of requests
     * @param int $windowSeconds Time window in seconds
     * @return array ['allowed' => bool, 'remaining' => int, 'reset' => int]
     */
    public static function check($identifier, $maxRequests = 100, $windowSeconds = 60) {
        $now = time();
        $key = md5($identifier);
        
        // Initialize if not exists or expired
        if (!isset(self::$limits[$key]) || self::$limits[$key]['reset'] < $now) {
            self::$limits[$key] = [
                'count' => 0,
                'reset' => $now + $windowSeconds,
                'window' => $windowSeconds
            ];
        }
        
        // Check limit
        self::$limits[$key]['count']++;
        $allowed = self::$limits[$key]['count'] <= $maxRequests;
        $remaining = max(0, $maxRequests - self::$limits[$key]['count']);
        
        // Save cache periodically (every 10th request to reduce I/O)
        if (self::$limits[$key]['count'] % 10 === 0) {
            self::saveCache();
        }
        
        return [
            'allowed' => $allowed,
            'remaining' => $remaining,
            'reset' => self::$limits[$key]['reset']
        ];
    }
    
    /**
     * Get client identifier
     * @return string
     */
    public static function getClientId() {
        // Try to get user ID from session first
        if (isset($_SESSION['user_id'])) {
            return 'user_' . $_SESSION['user_id'];
        }
        
        // Fall back to IP address
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Handle multiple IPs in X-Forwarded-For
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }
        
        return 'ip_' . $ip;
    }
    
    /**
     * Clean up old entries (call periodically via cron or after many requests)
     */
    public static function cleanup() {
        $now = time();
        foreach (self::$limits as $key => $info) {
            if (isset($info['reset']) && $info['reset'] < $now) {
                unset(self::$limits[$key]);
            }
        }
        self::saveCache();
    }
}

