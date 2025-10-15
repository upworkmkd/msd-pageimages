const { PageImagesAnalyzer } = require('./src/page-images-analyzer');
const { URLNormalizer } = require('./src/url-normalizer');
const axios = require('axios');

async function testSimpleAnalysis() {
    console.log('Testing simple page images analysis...\n');
    
    try {
        // Test URL
        const testUrl = 'https://example.com';
        console.log(`Analyzing: ${testUrl}`);
        
        // Fetch page content
        const response = await axios.get(testUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)'
            },
            timeout: 10000
        });
        
        const html = response.data;
        console.log(`Page fetched successfully (Status: ${response.status})`);
        
        // Initialize analyzer
        const pageImagesAnalyzer = new PageImagesAnalyzer();
        const urlNormalizer = new URLNormalizer();
        
        // Normalize URL
        const normalizedUrl = urlNormalizer.normalize(testUrl);
        console.log(`Normalized URL: ${normalizedUrl}`);
        
        // Perform analysis
        const result = await pageImagesAnalyzer.analyzePage({
            url: normalizedUrl,
            html,
            maxImagesPerPage: 20,
            includeImageSizeAnalysis: true,
            includeAltTextAnalysis: true,
            userAgent: 'Mozilla/5.0 (compatible; SEO-Image-Optimization-Checker/1.0)'
        });
        
        // Display results
        console.log('\n=== ANALYSIS RESULTS ===');
        console.log(`URL: ${result.url}`);
        console.log(`Title: ${result.title}`);
        console.log(`Domain: ${result.domain}`);
        console.log(`Total images found: ${result.totalImagesFound}`);
        console.log(`Images analyzed: ${result.imagesAnalyzed}`);
        console.log(`Images without alt text: ${result.imagesWithoutAltCount}`);
        console.log(`Images with alt text: ${result.imagesWithAltCount}`);
        console.log(`Average image size: ${result.averageImageSize} bytes`);
        console.log(`Total image size: ${result.totalImageSize} bytes`);
        console.log(`Image types:`, result.imageTypes);
        
        if (result.images && result.images.length > 0) {
            console.log('\n=== IMAGE DETAILS ===');
            result.images.forEach((img, index) => {
                console.log(`\nImage ${index + 1}:`);
                console.log(`  URL: ${img.imageUrl}`);
                console.log(`  Alt: ${img.alt || 'No alt text'}`);
                console.log(`  Size: ${img.sizeInKb} KB`);
                console.log(`  Type: ${img.contentType}`);
                console.log(`  Status: ${img.statusCode}`);
            });
        }
        
        if (result.imagesWithoutAlt && result.imagesWithoutAlt.length > 0) {
            console.log('\n=== IMAGES WITHOUT ALT TEXT ===');
            result.imagesWithoutAlt.forEach((img, index) => {
                console.log(`${index + 1}. ${img.imageUrl}`);
            });
        }
        
        console.log('\n=== OPTIMIZATION RECOMMENDATIONS ===');
        if (result.imagesWithoutAltCount > 0) {
            console.log(`⚠️  ${result.imagesWithoutAltCount} images are missing alt text`);
        } else {
            console.log('✅ All images have alt text');
        }
        
        const avgSizeKb = Math.round((result.averageImageSize / 1000) * 100) / 100;
        if (avgSizeKb > 500) {
            console.log(`⚠️  Average image size is large: ${avgSizeKb} KB`);
        } else {
            console.log(`✅ Average image size is reasonable: ${avgSizeKb} KB`);
        }
        
        console.log('\nTest completed successfully! ✅');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testSimpleAnalysis();
}

module.exports = { testSimpleAnalysis };
