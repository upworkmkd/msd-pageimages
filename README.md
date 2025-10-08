# MSD Page Images Actor

Extract and analyze all images from websites with comprehensive reports on image usage, accessibility, and optimization opportunities.

## What does MSD Page Images Actor do?

This Apify Actor crawls websites and performs detailed image analysis including:

- **🖼️ Image Discovery**: Finds all images on web pages including img tags with various URL formats
- **♿ Accessibility Analysis**: Identifies images missing alt text for WCAG compliance
- **📊 Size & Performance**: Analyzes image file sizes and content types
- **🔍 Multi-page Crawling**: Automatically discovers and analyzes internal pages
- **📈 Domain Statistics**: Provides aggregated insights across entire domains
- **💡 Optimization Tips**: Generates recommendations for better image performance

Perfect for SEO audits, accessibility compliance checks, website optimization, and content quality analysis.

## Input

The actor accepts the following input parameters:

```json
{
    "startUrl": "https://example.com/",
    "maxPages": 10,
    "maxImagesPerPage": 50,
    "includeImageSizeAnalysis": true,
    "includeAltTextAnalysis": true,
    "crawlInternalLinks": true
}
```

### Input Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startUrl` | String | Yes | The starting URL to begin crawling |
| `maxPages` | Integer | No | Maximum pages to crawl (default: 5, max: 100) |
| `maxImagesPerPage` | Integer | No | Maximum images to analyze per page (default: 20, max: 100) |
| `includeImageSizeAnalysis` | Boolean | No | Fetch image sizes and content types (default: true) |
| `includeAltTextAnalysis` | Boolean | No | Check for missing alt text (default: true) |
| `crawlInternalLinks` | Boolean | No | Follow internal links to discover more pages (default: true) |
| `userAgent` | String | No | Custom user agent string for requests |
| `waitForPageLoad` | Integer | No | Page load wait time in ms (default: 3000) |

## Output

The actor returns structured JSON data with both **domain-level** and **page-level** analysis:

```json
{
    "domain": {
        "domain_name": "example.com",
        "total_pages_analyzed": 10,
        "total_images_found": 87,
        "total_images_without_alt": 12,
        "total_images_without_alt_percentage": 14,
        "average_images_per_page": 8.7,
        "total_image_size_kb": 1245.6,
        "image_types": {
            "jpeg": 45,
            "png": 28,
            "webp": 14
        },
        "most_common_image_type": "jpeg",
        "optimization_recommendations": {
            "images_without_alt": 12,
            "needs_alt_text_optimization": true,
            "total_size_kb": 1245.6,
            "average_size_kb": 14.3
        }
    },
    "pages": [
        {
            "url": "https://example.com/",
            "title": "Homepage",
            "totalImagesFound": 15,
            "imagesAnalyzed": 15,
            "imagesWithoutAltCount": 2,
            "images": [
                {
                    "imageUrl": "https://example.com/hero.jpg",
                    "imageIndex": 1,
                    "alt": "Hero banner",
                    "contentType": "image/jpeg",
                    "sizeInBytes": 125430,
                    "sizeInKb": 125.43,
                    "statusCode": 200,
                    "hasAlt": true
                }
            ]
        }
    ]
}
```

### Domain Analysis Fields

- **total_pages_analyzed**: Number of pages successfully crawled
- **total_images_found**: Total images discovered across all pages
- **total_images_without_alt**: Count of images missing alt attributes
- **total_images_without_alt_percentage**: Percentage of images without alt text
- **average_images_per_page**: Mean number of images per page
- **total_image_size_kb**: Combined size of all analyzed images
- **image_types**: Breakdown of image formats (jpeg, png, webp, svg, etc.)
- **optimization_recommendations**: Actionable insights for improvement

### Page Analysis Fields

Each page object contains:
- **url**: Page URL
- **title**: Page title
- **totalImagesFound**: Number of images on the page
- **imagesAnalyzed**: Number of images actually analyzed (may be limited by maxImagesPerPage)
- **imagesWithoutAltCount**: Images missing alt text
- **images**: Array of detailed image objects with URL, alt text, size, content type, and status

## Use Cases

### ♿ **Accessibility Compliance**
Identify images missing alt text to meet WCAG standards and improve screen reader experience.

### 🚀 **Website Performance Optimization**
Discover large images that slow down your site and analyze image format distribution.

### 🔍 **SEO Audits**
Ensure all images have proper alt text for better search engine optimization and image search rankings.

### 📊 **Content Quality Analysis**
Get comprehensive statistics on image usage across your website or client sites.

### 🔧 **Website Migration**
Audit images before and after site migrations to ensure nothing is broken or missing.

## Supported Image Formats

- JPEG/JPG
- PNG  
- GIF
- WebP
- SVG
- BMP
- ICO
- TIFF

## Integration

This actor can be used with:

- **Apify API**: Integrate into your workflows programmatically
- **Apify Webhooks**: Trigger actions when crawls complete
- **Apify Schedules**: Run automated periodic audits
- **Apify Storage**: Export data to datasets, key-value stores, or request queues

## Resources

- **Apify Platform**: [https://apify.com](https://apify.com)
- **Actor Documentation**: Learn more about [Apify Actors](https://docs.apify.com/actors)
- **API Reference**: [Apify API Documentation](https://docs.apify.com/api/v2)

## Need Help?

For questions or issues with this actor, please reach out to MySmartDigital support.