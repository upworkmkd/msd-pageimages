/**
 * SEO Image Optimization Checker - Main Entry Point
 * 
 * @author MySmartDigital
 * @description Page images analysis actor that extracts and analyzes images from websites,
 * providing detailed information about image usage, optimization, and accessibility.
 */

const { Actor } = require('apify');
const axios = require('axios');
const { PageImagesAnalyzer } = require('./page-images-analyzer');
const { URLNormalizer } = require('./url-normalizer');

Actor.main(async () => {
    const input = await Actor.getInput();
    const {
        startUrl,
        crawlUrls = false,
        maxPages = 5,
        maxImagesPerPage = -1,
        includeImageSizeAnalysis = true,
        includeAltTextAnalysis = true,
        userAgent = 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)',
        waitForPageLoad = 3000
    } = input;

    console.log('Starting SEO Image Optimization Analysis...');
    console.log('Input:', JSON.stringify(input, null, 2));

    // Validate input
    if (!startUrl) {
        throw new Error('startUrl is required');
    }

    // Initialize components
    const pageImagesAnalyzer = new PageImagesAnalyzer();
    const urlNormalizer = new URLNormalizer();

    try {
        // Extract domain from start URL
        const domain = new URL(startUrl).hostname;
        console.log(`Analyzing images for domain: ${domain}`);

        const results = [];
        const visitedUrls = new Set();
        // Normalize start URL before adding to processing queue
        const normalizedStartUrl = urlNormalizer.normalize(startUrl);
        const urlsToProcess = [normalizedStartUrl];
        let processedCount = 0;
        let pagesAnalyzedCount = 0; // Track billable events for monetization
        
        // Determine the maximum pages to process
        const effectiveMaxPages = crawlUrls ? maxPages : 1;
        
        console.log(`Crawl mode: ${crawlUrls ? 'Multi-page crawling enabled' : 'Single page analysis only'}`);
        console.log(`Maximum pages to process: ${effectiveMaxPages}`);
        
        while (urlsToProcess.length > 0 && processedCount < effectiveMaxPages) {
            const currentUrl = urlsToProcess.shift();
            
            // Check if already visited (currentUrl is already normalized)
            if (visitedUrls.has(currentUrl)) {
                console.log(`Skipping already processed URL: ${currentUrl}`);
                continue;
            }
            visitedUrls.add(currentUrl);
            
            console.log(`Processing: ${currentUrl} (${processedCount + 1}/${effectiveMaxPages})`);
            
            try {
                // Fetch page content using axios
                const response = await axios.get(currentUrl, {
                    headers: {
                        'User-Agent': userAgent,
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    },
                    timeout: 30000,
                    maxRedirects: 5,
                    validateStatus: function (status) {
                        return status < 500; // Accept all status codes below 500
                    }
                });

                const html = response.data;
                const statusCode = response.status;
                
                // Use normalized URL (currentUrl is already normalized)
                const normalizedUrl = currentUrl;
                
                // Perform comprehensive image analysis
                const imageData = await pageImagesAnalyzer.analyzePage({
                    url: normalizedUrl,
                    html,
                    maxImagesPerPage,
                    includeImageSizeAnalysis,
                    includeAltTextAnalysis,
                    userAgent
                });
                
                // Add status code to result
                const result = {
                    ...imageData,
                    statusCode: statusCode,
                    analysis_date: new Date().toISOString(),
                    data_source: 'msd_page_images'
                };

                results.push(result);
                
                // Track this page analysis as a billable event for monetization
                pagesAnalyzedCount++;
                
                console.log(`Completed analysis for: ${normalizedUrl} (Status: ${statusCode})`);
                console.log(`Images found: ${imageData.totalImagesFound}, Analyzed: ${imageData.imagesAnalyzed}`);
                console.log(`Images without alt: ${imageData.imagesWithoutAltCount}`);
                
                // If crawling is enabled, extract internal links for further processing
                if (crawlUrls && imageData._internalLinks && imageData._internalLinks.length > 0) {
                    const baseDomain = new URL(normalizedUrl).origin;
                    
                    for (const linkObj of imageData._internalLinks) {
                        try {
                            const link = linkObj.url || linkObj; // Handle both object and string formats
                            let fullUrl;
                            if (link.startsWith('http')) {
                                fullUrl = link;
                            } else if (link.startsWith('/')) {
                                fullUrl = baseDomain + link;
                            } else {
                                fullUrl = new URL(link, normalizedUrl).href;
                            }
                            
                            const normalizedLink = urlNormalizer.normalize(fullUrl);
                            
                            // Only add if it's from the same domain and not already visited
                            if (normalizedLink.startsWith(baseDomain) && 
                                !visitedUrls.has(normalizedLink) && 
                                !urlsToProcess.includes(normalizedLink)) {
                                urlsToProcess.push(normalizedLink);
                                console.log(`Added to crawl queue: ${normalizedLink}`);
                            }
                        } catch (e) {
                            // Skip invalid URLs
                            continue;
                        }
                    }
                }
                
                processedCount++;
                
            } catch (error) {
                console.error(`Error analyzing ${currentUrl}:`, error.message);

                // Determine status code based on error type
                let statusCode = 500; // Default to server error
                if (error.response) {
                    statusCode = error.response.status;
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    statusCode = 404; // DNS resolution failed or connection refused
                } else if (error.code === 'ETIMEDOUT') {
                    statusCode = 408; // Request timeout
                } else if (error.code === 'ECONNRESET') {
                    statusCode = 503; // Connection reset
                }

                // Add error result
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

        // Create comprehensive result structure
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

        // Set the comprehensive result as the main output
        await Actor.setValue('OUTPUT', finalOutput);
        
        // Also push to dataset for compatibility
        await Actor.pushData(finalOutput);

        // Report usage for event-based billing
        await Actor.setValue('PAGE_ANALYZED', pagesAnalyzedCount);

        console.log(`Page Images Analysis completed! Processed ${results.length} pages.`);
        console.log(`Total images found: ${domainAnalysis.total_images_found}`);
        console.log(`Images without alt text: ${domainAnalysis.total_images_without_alt}`);
        console.log(`Average images per page: ${domainAnalysis.average_images_per_page}`);
        console.log(`Billable events (pages analyzed): ${pagesAnalyzedCount}`);

    } catch (error) {
        console.error('General error:', error);
        throw error;
    }
});

// Domain-level analysis calculation
function calculateDomainAnalysis(results) {
    console.log('Calculating domain-level analysis...');

    // Extract domain from first result
    const firstUrl = results[0]?.url || '';
    const domain = firstUrl ? new URL(firstUrl).hostname : '';

    // Calculate domain-level metrics
    const totalPages = results.length;
    const successfulPages = results.filter(r => !r.error && r.statusCode >= 200 && r.statusCode < 300).length;
    const errorPages = results.filter(r => r.error || r.statusCode >= 400).length;

    // Image statistics
    const totalImagesFound = results.reduce((sum, r) => sum + (r.totalImagesFound || 0), 0);
    const totalImagesAnalyzed = results.reduce((sum, r) => sum + (r.imagesAnalyzed || 0), 0);
    const totalImagesWithoutAlt = results.reduce((sum, r) => sum + (r.imagesWithoutAltCount || 0), 0);
    const totalImageSize = results.reduce((sum, r) => sum + (r.totalImageSize || 0), 0);

    // Image type aggregation
    const imageTypes = {};
    results.forEach(r => {
        if (r.imageTypes) {
            Object.entries(r.imageTypes).forEach(([type, count]) => {
                imageTypes[type] = (imageTypes[type] || 0) + count;
            });
        }
    });

    // Calculate averages
    const averageImagesPerPage = totalPages > 0 ? Math.round((totalImagesFound / totalPages) * 100) / 100 : 0;
    const averageImageSize = totalImagesAnalyzed > 0 ? Math.round(totalImageSize / totalImagesAnalyzed) : 0;
    const imagesWithoutAltPercentage = totalImagesAnalyzed > 0 ? Math.round((totalImagesWithoutAlt / totalImagesAnalyzed) * 100) : 0;

    // Compile domain analysis
    const domainAnalysis = {
        domain_name: domain,
        total_pages_analyzed: totalPages,
        pages_with_successful_status: successfulPages,
        pages_with_successful_status_percentage: Math.round((successfulPages / totalPages) * 100),
        pages_with_error_status: errorPages,
        pages_with_error_status_percentage: Math.round((errorPages / totalPages) * 100),

        // Image statistics
        total_images_found: totalImagesFound,
        total_images_analyzed: totalImagesAnalyzed,
        total_images_without_alt: totalImagesWithoutAlt,
        total_images_without_alt_percentage: imagesWithoutAltPercentage,
        total_image_size_bytes: totalImageSize,
        total_image_size_kb: Math.round((totalImageSize / 1000) * 100) / 100,
        average_images_per_page: averageImagesPerPage,
        average_image_size_bytes: averageImageSize,
        average_image_size_kb: Math.round((averageImageSize / 1000) * 100) / 100,

        // Image types breakdown
        image_types: imageTypes,
        most_common_image_type: Object.keys(imageTypes).reduce((a, b) => imageTypes[a] > imageTypes[b] ? a : b, 'unknown'),

        // Optimization recommendations
        optimization_recommendations: {
            images_without_alt: totalImagesWithoutAlt,
            images_without_alt_percentage: imagesWithoutAltPercentage,
            needs_alt_text_optimization: totalImagesWithoutAlt > 0,
            total_size_kb: Math.round((totalImageSize / 1000) * 100) / 100,
            average_size_kb: Math.round((averageImageSize / 1000) * 100) / 100
        }
    };

    console.log(`Domain Analysis Summary:`);
    console.log(`- Domain: ${domain}`);
    console.log(`- Total Images Found: ${totalImagesFound}`);
    console.log(`- Images Without Alt: ${totalImagesWithoutAlt} (${imagesWithoutAltPercentage}%)`);
    console.log(`- Average Images per Page: ${averageImagesPerPage}`);
    console.log(`- Total Image Size: ${Math.round((totalImageSize / 1000) * 100) / 100} KB`);

    return domainAnalysis;
}
