const express = require('express');
const cors = require('cors');
const { PageImagesAnalyzer } = require('./src/page-images-analyzer.js');
const { URLNormalizer } = require('./src/url-normalizer.js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize analyzers
const pageImagesAnalyzer = new PageImagesAnalyzer();
const urlNormalizer = new URLNormalizer();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'SEO Image Optimization Checker API is running',
        timestamp: new Date().toISOString()
    });
});

// Single page analysis endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { 
            url, 
            maxImagesPerPage = 20,
            includeImageSizeAnalysis = true,
            includeAltTextAnalysis = true,
            userAgent = 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)'
        } = req.body;

        if (!url) {
            return res.status(400).json({ 
                error: 'URL is required',
                message: 'Please provide a valid URL in the request body'
            });
        }

        console.log(`Analyzing images for URL: ${url}`);

        // Fetch page content
        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status < 500;
            }
        });

        const html = response.data;
        const statusCode = response.status;

        // Normalize URL
        const normalizedUrl = urlNormalizer.normalize(url);

        // Perform image analysis
        const imageData = await pageImagesAnalyzer.analyzePage({
            url: normalizedUrl,
            html,
            maxImagesPerPage,
            includeImageSizeAnalysis,
            includeAltTextAnalysis,
            userAgent
        });

        const result = {
            ...imageData,
            statusCode: statusCode,
            analysis_date: new Date().toISOString(),
            data_source: 'msd_page_images'
        };

        res.json(result);

    } catch (error) {
        console.error('Error in /analyze endpoint:', error);
        
        let statusCode = 500;
        if (error.response) {
            statusCode = error.response.status;
        }

        res.status(statusCode).json({
            error: error.message,
            url: req.body.url,
            statusCode: statusCode,
            analysis_date: new Date().toISOString(),
            data_source: 'msd_page_images'
        });
    }
});

// Multi-page analysis endpoint
app.post('/analyze-multi', async (req, res) => {
    try {
        const { 
            startUrl,
            maxPages = 5,
            maxImagesPerPage = 20,
            includeImageSizeAnalysis = true,
            includeAltTextAnalysis = true,
            crawlInternalLinks = true,
            userAgent = 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)'
        } = req.body;

        if (!startUrl) {
            return res.status(400).json({ 
                error: 'startUrl is required',
                message: 'Please provide a valid startUrl in the request body'
            });
        }

        console.log(`Starting multi-page analysis from: ${startUrl}`);

        // Extract domain from start URL
        const domain = new URL(startUrl).hostname;

        const results = [];
        const visitedUrls = new Set();
        const urlsToProcess = [startUrl];
        let processedCount = 0;
        
        while (urlsToProcess.length > 0 && processedCount < maxPages) {
            const currentUrl = urlsToProcess.shift();
            
            if (visitedUrls.has(currentUrl)) continue;
            visitedUrls.add(currentUrl);
            
            console.log(`Processing: ${currentUrl} (${processedCount + 1}/${maxPages})`);
            
            try {
                // Fetch page content
                const response = await axios.get(currentUrl, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    },
                    timeout: 30000,
                    maxRedirects: 5,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });

                const html = response.data;
                const statusCode = response.status;
                
                // Normalize URL
                const normalizedUrl = urlNormalizer.normalize(currentUrl);
                
                // Perform image analysis
                const imageData = await pageImagesAnalyzer.analyzePage({
                    url: normalizedUrl,
                    html,
                    maxImagesPerPage,
                    includeImageSizeAnalysis,
                    includeAltTextAnalysis,
                    userAgent
                });
                
                const result = {
                    ...imageData,
                    statusCode: statusCode,
                    analysis_date: new Date().toISOString(),
                    data_source: 'msd_page_images'
                };

                results.push(result);
                
                console.log(`Completed: ${normalizedUrl} - Images: ${imageData.totalImagesFound}, Without alt: ${imageData.imagesWithoutAltCount}`);
                
                // If crawling is enabled, extract internal links
                if (crawlInternalLinks && imageData._internalLinks && imageData._internalLinks.length > 0) {
                    const baseDomain = new URL(normalizedUrl).origin;
                    
                    for (const linkObj of imageData._internalLinks) {
                        try {
                            const link = linkObj.url || linkObj;
                            let fullUrl;
                            if (link.startsWith('http')) {
                                fullUrl = link;
                            } else if (link.startsWith('/')) {
                                fullUrl = baseDomain + link;
                            } else {
                                fullUrl = new URL(link, normalizedUrl).href;
                            }
                            
                            const normalizedLink = urlNormalizer.normalize(fullUrl);
                            
                            if (normalizedLink.startsWith(baseDomain) && 
                                !visitedUrls.has(normalizedLink) && 
                                !urlsToProcess.includes(normalizedLink)) {
                                urlsToProcess.push(normalizedLink);
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                processedCount++;
                
            } catch (error) {
                console.error(`Error analyzing ${currentUrl}:`, error.message);

                let statusCode = 500;
                if (error.response) {
                    statusCode = error.response.status;
                }

                results.push({
                    url: currentUrl,
                    error: error.message,
                    statusCode: statusCode,
                    analysis_date: new Date().toISOString(),
                    data_source: 'msd_page_images'
                });
            }
        }
        
        // Calculate domain-level analysis
        const domainAnalysis = calculateDomainAnalysis(results);

        const finalOutput = {
            domain: domainAnalysis,
            pages: results,
            analysis: {
                total_pages_processed: results.length,
                analysis_completed_at: new Date().toISOString(),
                images_engine_version: '1.0.0',
                data_format_version: '1.0'
            }
        };

        res.json(finalOutput);

    } catch (error) {
        console.error('Error in /analyze-multi endpoint:', error);
        
        res.status(500).json({
            error: error.message,
            analysis_date: new Date().toISOString(),
            data_source: 'msd_page_images'
        });
    }
});

// Domain analysis calculation function
function calculateDomainAnalysis(results) {
    const firstUrl = results[0]?.url || '';
    const domain = firstUrl ? new URL(firstUrl).hostname : '';

    const totalPages = results.length;
    const successfulPages = results.filter(r => !r.error && r.statusCode >= 200 && r.statusCode < 300).length;
    const errorPages = results.filter(r => r.error || r.statusCode >= 400).length;

    const totalImagesFound = results.reduce((sum, r) => sum + (r.totalImagesFound || 0), 0);
    const totalImagesAnalyzed = results.reduce((sum, r) => sum + (r.imagesAnalyzed || 0), 0);
    const totalImagesWithoutAlt = results.reduce((sum, r) => sum + (r.imagesWithoutAltCount || 0), 0);
    const totalImageSize = results.reduce((sum, r) => sum + (r.totalImageSize || 0), 0);

    const imageTypes = {};
    results.forEach(r => {
        if (r.imageTypes) {
            Object.entries(r.imageTypes).forEach(([type, count]) => {
                imageTypes[type] = (imageTypes[type] || 0) + count;
            });
        }
    });

    const averageImagesPerPage = totalPages > 0 ? Math.round((totalImagesFound / totalPages) * 100) / 100 : 0;
    const averageImageSize = totalImagesAnalyzed > 0 ? Math.round(totalImageSize / totalImagesAnalyzed) : 0;
    const imagesWithoutAltPercentage = totalImagesAnalyzed > 0 ? Math.round((totalImagesWithoutAlt / totalImagesAnalyzed) * 100) : 0;

    return {
        domain_name: domain,
        total_pages_analyzed: totalPages,
        pages_with_successful_status: successfulPages,
        pages_with_successful_status_percentage: Math.round((successfulPages / totalPages) * 100),
        pages_with_error_status: errorPages,
        pages_with_error_status_percentage: Math.round((errorPages / totalPages) * 100),
        total_images_found: totalImagesFound,
        total_images_analyzed: totalImagesAnalyzed,
        total_images_without_alt: totalImagesWithoutAlt,
        total_images_without_alt_percentage: imagesWithoutAltPercentage,
        total_image_size_bytes: totalImageSize,
        total_image_size_kb: Math.round((totalImageSize / 1000) * 100) / 100,
        average_images_per_page: averageImagesPerPage,
        average_image_size_bytes: averageImageSize,
        average_image_size_kb: Math.round((averageImageSize / 1000) * 100) / 100,
        image_types: imageTypes,
        most_common_image_type: Object.keys(imageTypes).reduce((a, b) => imageTypes[a] > imageTypes[b] ? a : b, 'unknown'),
        optimization_recommendations: {
            images_without_alt: totalImagesWithoutAlt,
            images_without_alt_percentage: imagesWithoutAltPercentage,
            needs_alt_text_optimization: totalImagesWithoutAlt > 0,
            total_size_kb: Math.round((totalImageSize / 1000) * 100) / 100,
            average_size_kb: Math.round((averageImageSize / 1000) * 100) / 100
        }
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`SEO Image Optimization Checker API server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Single page analysis: POST http://localhost:${PORT}/analyze`);
    console.log(`Multi-page analysis: POST http://localhost:${PORT}/analyze-multi`);
});
