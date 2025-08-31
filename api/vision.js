// /api/vision.js - Google Cloud Vision API for Vercel
export default async function handler(req, res) {
    console.log('=== GOOGLE VISION API CALL START ===');
    console.log('Method:', req.method);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check environment variables
        const hasApiKey = !!process.env.GOOGLE_API_KEY;
        console.log('Environment check:');
        console.log('- Google API Key exists:', hasApiKey);
        console.log('- API Key length:', process.env.GOOGLE_API_KEY?.length || 0);

        if (!hasApiKey) {
            return res.status(500).json({ 
                error: 'Google API key not configured',
                details: 'Add GOOGLE_API_KEY to Vercel environment variables'
            });
        }

        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ 
                error: 'No image provided'
            });
        }

        const imageSizeKB = Math.round(image.length * 0.75 / 1024);
        console.log('Received image size:', imageSizeKB, 'KB');

        // Validate base64 format
        if (!image.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
            return res.status(400).json({ 
                error: 'Invalid image format'
            });
        }

        console.log('Making Google Vision API call...');

        // Google Cloud Vision API REST call
        const apiResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        image: {
                            content: image
                        },
                        features: [
                            {
                                type: 'TEXT_DETECTION',
                                maxResults: 10
                            }
                        ]
                    }
                ]
            })
        });

        console.log('Google API response status:', apiResponse.status);

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Google Vision API error:', errorText);
            
            let userMessage = 'Google Vision API failed';
            if (apiResponse.status === 400) {
                userMessage = 'Invalid request - check image format';
            } else if (apiResponse.status === 403) {
                userMessage = 'API key invalid or Vision API not enabled';
            } else if (apiResponse.status === 429) {
                userMessage = 'Rate limit exceeded';
            }
            
            return res.status(500).json({ 
                error: userMessage,
                details: `Status: ${apiResponse.status}, Error: ${errorText.substring(0, 200)}`
            });
        }

        const result = await apiResponse.json();
        console.log('Google Vision API response structure:', {
            hasResponses: !!result.responses,
            responsesLength: result.responses?.length || 0
        });

        if (!result.responses || result.responses.length === 0) {
            return res.status(500).json({ 
                error: 'Empty response from Google Vision API'
            });
        }

        const response = result.responses[0];
        
        // Check for API errors
        if (response.error) {
            console.error('Google Vision API error in response:', response.error);
            return res.status(500).json({ 
                error: 'Google Vision API error',
                details: response.error.message
            });
        }

        // Extract text from annotations
        const textAnnotations = response.textAnnotations || [];
        console.log('Text annotations found:', textAnnotations.length);

        if (textAnnotations.length === 0) {
            return res.status(200).json({ 
                text: 'No text found.',
                error: 'No text detected in image'
            });
        }

        // The first annotation contains all detected text
        const extractedText = textAnnotations[0].description || 'No text found.';
        console.log('Extracted text:', extractedText);

        return res.status(200).json({
            text: extractedText,
            success: true,
            debug: {
                annotationsCount: textAnnotations.length,
                imageSizeKB: imageSizeKB
            }
        });

    } catch (error) {
        console.error('=== CRITICAL ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
}
