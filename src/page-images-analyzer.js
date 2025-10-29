/**
 * Page Images Analyzer for SEO Image Optimization Checker
 * 
 * @author MySmartDigital
 * @description Core image analysis engine that performs comprehensive website image analysis including
 * image extraction, alt text analysis, image size detection, file type analysis,
 * and image optimization recommendations using Cheerio for HTML parsing.
 */

const cheerio = require('cheerio');
const axios = require('axios');

class PageImagesAnalyzer {
    constructor() {
        this.cheerio = cheerio;
    }

    async analyzePage({ url, html, maxImagesPerPage = -1, includeImageSizeAnalysis = true, includeAltTextAnalysis = true, userAgent = 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)' }) {
        const $ = this.cheerio.load(html);
        
        // Basic page information
        const pageInfo = this.extractPageInfo($, url);
        
        // Images analysis
        const imagesAnalysis = await this.analyzeImages($, url, maxImagesPerPage, includeImageSizeAnalysis, includeAltTextAnalysis, userAgent);
        
        // Links analysis for crawling (not included in response)
        const linksAnalysis = this.analyzeLinks($, url);
        
        return {
            // Basic Page Information
            url: pageInfo.url,
            title: pageInfo.title,
            domain: pageInfo.domain,
            
            // Images Information (breakdown first, then counts)
            images: imagesAnalysis.images,
            imagesWithoutAlt: imagesAnalysis.imagesWithoutAlt,
            imagesWithoutAltCount: imagesAnalysis.imagesWithoutAltCount,
            imagesWithAltCount: imagesAnalysis.imagesWithAltCount,
            totalImagesFound: imagesAnalysis.totalImagesFound,
            imagesAnalyzed: imagesAnalysis.imagesAnalyzed,
            averageImageSize: imagesAnalysis.averageImageSize,
            totalImageSize: imagesAnalysis.totalImageSize,
            imageTypes: imagesAnalysis.imageTypes,
            
            // Metadata
            analysis_date: new Date().toISOString(),
            data_source: 'msd_page_images',
            
            // Internal links for crawling (not included in final response)
            _internalLinks: linksAnalysis.internalLinks
        };
    }

    extractPageInfo($, url) {
        const title = $('title').first().text().trim() || '';
        const domain = new URL(url).hostname;
        
        return {
            url,
            title,
            domain
        };
    }

    async analyzeImages($, baseUrl, maxImagesPerPage, includeImageSizeAnalysis, includeAltTextAnalysis, userAgent) {
        const imageElements = $('img[src]').toArray();
        const totalImagesFound = imageElements.length;
        const images = [];
        const imagesWithoutAlt = [];
        let totalImageSize = 0;
        const imageTypes = {};

        // If maxImagesPerPage is -1, analyze all images; otherwise use the limit
        const imagesToAnalyze = maxImagesPerPage === -1 ? imageElements.length : Math.min(imageElements.length, maxImagesPerPage);

        for (let i = 0; i < imagesToAnalyze; i++) {
            const el = imageElements[i];
            const $img = $(el);
            const src = $img.attr('src');

            if (!src) continue;

            try {
                let fullUrl;
                if (src.startsWith('http')) {
                    fullUrl = src;
                } else if (src.startsWith('/')) {
                    fullUrl = new URL(baseUrl).origin + src;
                } else {
                    fullUrl = new URL(src, baseUrl).href;
                }

                const alt = $img.attr('alt') || '';
                const title = $img.attr('title') || '';
                const width = $img.attr('width') || '';
                const height = $img.attr('height') || '';

                // Image analysis object
                const imageData = {
                    imageUrl: fullUrl,
                    imageIndex: i + 1,
                    alt: alt,
                    title: title,
                    width: width,
                    height: height,
                    hasAlt: !!alt && alt.trim() !== '',
                    hasTitle: !!title && title.trim() !== '',
                    contentType: 'unknown',
                    sizeInBytes: 0,
                    sizeInKb: 0,
                    statusCode: 200
                };

                // Get image size and type information if requested
                if (includeImageSizeAnalysis) {
                    try {
                        const imageInfo = await this.detectImageInfo(fullUrl, userAgent);
                        imageData.contentType = imageInfo.contentType;
                        imageData.sizeInBytes = imageInfo.sizeInBytes;
                        imageData.sizeInKb = imageInfo.sizeInKb;
                        imageData.statusCode = imageInfo.statusCode;
                        
                        totalImageSize += imageInfo.sizeInBytes;
                        
                        // Track image types
                        const type = imageInfo.contentType.split('/')[1] || 'unknown';
                        imageTypes[type] = (imageTypes[type] || 0) + 1;
                    } catch (error) {
                        imageData.statusCode = 500;
                        imageData.error = error.message;
                    }
                } else {
                    // Detect content type from file extension
                    const contentType = this.detectContentTypeFromUrl(fullUrl);
                    imageData.contentType = contentType;
                    
                    const type = contentType.split('/')[1] || 'unknown';
                    imageTypes[type] = (imageTypes[type] || 0) + 1;
                }

                images.push(imageData);

                // Track images without alt text
                if (includeAltTextAnalysis && (!alt || alt.trim() === '')) {
                    imagesWithoutAlt.push({
                        imageUrl: fullUrl,
                        imageIndex: i + 1
                    });
                }

            } catch (error) {
                // Skip invalid URLs
                continue;
            }
        }

        const imagesWithoutAltCount = imagesWithoutAlt.length;
        const imagesWithAltCount = images.length - imagesWithoutAltCount;
        const averageImageSize = images.length > 0 ? Math.round(totalImageSize / images.length) : 0;

        return {
            totalImagesFound,
            imagesAnalyzed: images.length,
            images,
            imagesWithoutAlt,
            imagesWithoutAltCount,
            imagesWithAltCount,
            averageImageSize,
            totalImageSize,
            imageTypes
        };
    }

    async detectImageInfo(imageUrl, userAgent) {
        // Handle data URIs
        if (imageUrl.startsWith('data:')) {
            const [header, data] = imageUrl.split(',');
            const mimeMatch = header.match(/data:([^;]+)/);
            const contentType = mimeMatch ? mimeMatch[1] : 'image/unknown';
            
            // Calculate size from base64 data
            const sizeInBytes = Math.round((data.length * 3) / 4);
            const sizeInKb = Math.round((sizeInBytes / 1000) * 100) / 100;
            
            return { 
                contentType, 
                sizeInBytes, 
                sizeInKb, 
                statusCode: 200 
            };
        }
        
        try {
            // Make a HEAD request to get image information
            const response = await axios.head(imageUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'image/*'
                },
                timeout: 10000,
                maxRedirects: 3,
                validateStatus: function (status) {
                    return status < 500; // Accept all status codes below 500
                }
            });

            const contentType = response.headers['content-type'] || this.detectContentTypeFromUrl(imageUrl);
            const contentLength = parseInt(response.headers['content-length']) || 0;
            const sizeInKb = contentLength > 0 ? Math.round((contentLength / 1000) * 100) / 100 : 0;

            return {
                contentType,
                sizeInBytes: contentLength,
                sizeInKb,
                statusCode: response.status
            };

        } catch (error) {
            // Fallback to URL-based detection
            const contentType = this.detectContentTypeFromUrl(imageUrl);
            
            return {
                contentType,
                sizeInBytes: 0,
                sizeInKb: 0,
                statusCode: error.response?.status || 500
            };
        }
    }

    detectContentTypeFromUrl(imageUrl) {
        const url = new URL(imageUrl);
        const pathname = url.pathname.toLowerCase();
        
        if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
            return 'image/jpeg';
        } else if (pathname.endsWith('.png')) {
            return 'image/png';
        } else if (pathname.endsWith('.gif')) {
            return 'image/gif';
        } else if (pathname.endsWith('.webp')) {
            return 'image/webp';
        } else if (pathname.endsWith('.svg')) {
            return 'image/svg+xml';
        } else if (pathname.endsWith('.bmp')) {
            return 'image/bmp';
        } else if (pathname.endsWith('.ico')) {
            return 'image/x-icon';
        } else if (pathname.endsWith('.tiff') || pathname.endsWith('.tif')) {
            return 'image/tiff';
        } else {
            return 'image/unknown';
        }
    }

    analyzeLinks($, baseUrl) {
        const internalLinks = [];
        const baseDomain = new URL(baseUrl).origin;

        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            
            if (!href) return;

            try {
                let fullUrl;
                if (href.startsWith('http')) {
                    fullUrl = href;
                } else if (href.startsWith('/')) {
                    fullUrl = baseDomain + href;
                } else {
                    fullUrl = new URL(href, baseUrl).href;
                }

                // Only include internal links
                if (fullUrl.startsWith(baseDomain)) {
                    internalLinks.push({
                        url: fullUrl,
                        text: $(el).text().trim()
                    });
                }
            } catch (e) {
                // Skip invalid URLs
            }
        });

        return {
            internalLinks,
            internalLinksCount: internalLinks.length
        };
    }
}

module.exports = { PageImagesAnalyzer };
