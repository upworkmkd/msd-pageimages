/**
 * URL Normalizer for SEO Image Optimization Checker
 * 
 * @author MySmartDigital
 * @description Utility class for normalizing URLs by removing UTM parameters,
 * normalizing hostnames, cleaning paths, and ensuring consistent URL formatting
 * for image analysis and comparison purposes.
 */

class URLNormalizer {
    normalize(rawUrl) {
        if (!rawUrl) return '';
        
        try {
            const url = new URL(String(rawUrl).trim());
            
            // Remove hash
            url.hash = '';
            
            // Remove UTM parameters
            const params = Array.from(url.searchParams.entries())
                .filter(([key]) => !/^utm_/i.test(key));
            
            url.search = params.length ? new URLSearchParams(params).toString() : '';
            
            // Normalize hostname
            url.hostname = url.hostname.toLowerCase();
            
            // Normalize pathname
            url.pathname = url.pathname.replace(/\/+/g, '/');
            if (url.pathname !== '/' && url.pathname.endsWith('/')) {
                url.pathname = url.pathname.slice(0, -1);
            }
            
            return url.toString();
        } catch (error) {
            // If URL parsing fails, return cleaned string
            const cleaned = String(rawUrl || '').trim().replace(/\/+$/, '');
            return cleaned === '' ? '' : cleaned.toLowerCase();
        }
    }

    normalizeForComparison(rawUrl) {
        if (!rawUrl) return null;
        
        try {
            const s = String(rawUrl).trim();
            const u = s.match(/^https?:\/\//i) ? s : `http://${s}`;
            const url = new URL(u);
            
            const protocol = url.protocol.toLowerCase();
            const host = url.hostname.toLowerCase();
            let path = url.pathname.replace(/\/+$/, '');
            if (path === '') path = '/';
            const search = url.search || '';
            
            return `${protocol}//${host}${path}${search}`;
        } catch (error) {
            const s = String(rawUrl || '').trim().replace(/\/+$/, '');
            return s === '' ? null : s.toLowerCase();
        }
    }
}

module.exports = { URLNormalizer };
