# MSD Page Images Actor

A comprehensive page images analysis actor for MySmartDigital that extracts and analyzes images from websites, providing detailed information about image usage, optimization, and accessibility.

## Features

- **Image Extraction**: Automatically finds and extracts all images from web pages
- **Alt Text Analysis**: Identifies images missing alt text for accessibility compliance
- **Image Size Analysis**: Detects image file sizes and types
- **Multi-page Crawling**: Analyzes multiple pages from the same domain
- **Domain-level Statistics**: Provides comprehensive domain-wide image analysis
- **Optimization Recommendations**: Identifies areas for image optimization

## Input Format

The actor accepts the following input format:

```json
{
    "startUrl": "https://rouvres77.fr/",
    "maxPages": 5
}
```

### Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startUrl` | string | required | The URL to start crawling from |
| `maxPages` | integer | 5 | Maximum number of pages to crawl and analyze |
| `maxImagesPerPage` | integer | 20 | Maximum number of images to analyze per page |
| `includeImageSizeAnalysis` | boolean | true | Whether to analyze image sizes and file types |
| `includeAltTextAnalysis` | boolean | true | Whether to analyze alt text for images |
| `crawlInternalLinks` | boolean | true | Whether to crawl internal links to find more pages |
| `userAgent` | string | "Mozilla/5.0 (compatible; MSD-PageImages/1.0)" | User agent string for requests |
| `waitForPageLoad` | integer | 3000 | Time to wait for page load (milliseconds) |

## Output Format

The actor returns comprehensive image analysis data including:

### Domain-level Analysis
- Total images found across all pages
- Images without alt text statistics
- Average images per page
- Image size analysis
- Image type breakdown
- Optimization recommendations

### Page-level Analysis
- Individual page image data
- Detailed image information (URL, alt text, size, type)
- Status codes and error handling

### Example Output

```json
{
    "domain": {
        "domain_name": "example.com",
        "total_pages_analyzed": 3,
        "total_images_found": 15,
        "total_images_without_alt": 2,
        "total_images_without_alt_percentage": 13,
        "average_images_per_page": 5,
        "total_image_size_kb": 245.6,
        "image_types": {
            "jpeg": 8,
            "png": 5,
            "webp": 2
        },
        "most_common_image_type": "jpeg",
        "optimization_recommendations": {
            "images_without_alt": 2,
            "needs_alt_text_optimization": true,
            "total_size_kb": 245.6,
            "average_size_kb": 16.4
        }
    },
    "pages": [
        {
            "url": "https://example.com/",
            "title": "Example Domain",
            "totalImagesFound": 5,
            "imagesAnalyzed": 5,
            "imagesWithoutAltCount": 1,
            "images": [
                {
                    "imageUrl": "https://example.com/image.jpg",
                    "imageIndex": 1,
                    "alt": "Example image",
                    "contentType": "image/jpeg",
                    "sizeInBytes": 45632,
                    "sizeInKb": 45.63,
                    "statusCode": 200,
                    "hasAlt": true
                }
            ]
        }
    ],
    "analysis": {
        "total_pages_processed": 3,
        "analysis_completed_at": "2024-01-15T10:30:00.000Z",
        "images_engine_version": "1.0.0",
        "data_format_version": "1.0"
    }
}
```

## Image Analysis Features

### Supported Image Types
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG
- BMP
- ICO
- TIFF

### Analysis Capabilities
- **Alt Text Detection**: Identifies missing alt text for accessibility
- **Image Size Analysis**: Measures file sizes and calculates averages
- **Content Type Detection**: Identifies image formats
- **URL Normalization**: Handles relative and absolute image URLs
- **Error Handling**: Gracefully handles broken or inaccessible images

### Optimization Recommendations
- Images without alt text
- Large image file sizes
- Image type distribution
- Total image payload size

## Error Handling

The actor includes comprehensive error handling:
- Network timeouts and connection errors
- Invalid URLs and malformed HTML
- Missing or inaccessible images
- HTTP status code handling
- Graceful degradation for failed requests

## Performance Considerations

- Configurable limits on pages and images per page
- Efficient HTML parsing with Cheerio
- Minimal memory footprint for large-scale analysis
- Optimized image size detection with HEAD requests


## Support

For support and questions, please contact the MySmartDigital team.