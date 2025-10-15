const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
    try {
        console.log('Testing health check...');
        const response = await axios.get(`${API_BASE_URL}/health`);
        console.log('Health check response:', response.data);
        return true;
    } catch (error) {
        console.error('Health check failed:', error.message);
        return false;
    }
}

async function testSinglePageAnalysis() {
    try {
        console.log('\nTesting single page analysis...');
        const response = await axios.post(`${API_BASE_URL}/analyze`, {
            url: 'https://example.com',
            maxImagesPerPage: 10,
            includeImageSizeAnalysis: true,
            includeAltTextAnalysis: true
        });
        
        console.log('Single page analysis response:');
        console.log(`URL: ${response.data.url}`);
        console.log(`Total images found: ${response.data.totalImagesFound}`);
        console.log(`Images analyzed: ${response.data.imagesAnalyzed}`);
        console.log(`Images without alt: ${response.data.imagesWithoutAltCount}`);
        console.log(`Average image size: ${response.data.averageImageSize} bytes`);
        console.log(`Image types:`, response.data.imageTypes);
        
        return true;
    } catch (error) {
        console.error('Single page analysis failed:', error.response?.data || error.message);
        return false;
    }
}

async function testMultiPageAnalysis() {
    try {
        console.log('\nTesting multi-page analysis...');
        const response = await axios.post(`${API_BASE_URL}/analyze-multi`, {
            startUrl: 'https://example.com',
            maxPages: 2,
            maxImagesPerPage: 10,
            includeImageSizeAnalysis: true,
            includeAltTextAnalysis: true,
            crawlInternalLinks: true
        });
        
        console.log('Multi-page analysis response:');
        console.log(`Domain: ${response.data.domain.domain_name}`);
        console.log(`Pages processed: ${response.data.analysis.total_pages_processed}`);
        console.log(`Total images found: ${response.data.domain.total_images_found}`);
        console.log(`Total images without alt: ${response.data.domain.total_images_without_alt}`);
        console.log(`Average images per page: ${response.data.domain.average_images_per_page}`);
        console.log(`Most common image type: ${response.data.domain.most_common_image_type}`);
        
        return true;
    } catch (error) {
        console.error('Multi-page analysis failed:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('Starting SEO Image Optimization Checker API tests...\n');
    
    const healthCheck = await testHealthCheck();
    if (!healthCheck) {
        console.log('Health check failed. Make sure the API server is running on port 3000.');
        return;
    }
    
    const singlePageTest = await testSinglePageAnalysis();
    const multiPageTest = await testMultiPageAnalysis();
    
    console.log('\nTest Summary:');
    console.log(`Health Check: ${healthCheck ? 'PASS' : 'FAIL'}`);
    console.log(`Single Page Analysis: ${singlePageTest ? 'PASS' : 'FAIL'}`);
    console.log(`Multi-Page Analysis: ${multiPageTest ? 'PASS' : 'FAIL'}`);
    
    if (healthCheck && singlePageTest && multiPageTest) {
        console.log('\nAll tests passed! ✅');
    } else {
        console.log('\nSome tests failed! ❌');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testHealthCheck, testSinglePageAnalysis, testMultiPageAnalysis, runTests };
