// /api/vision.js - Bulletproof Vercel Serverless Function
export default async function handler(req, res) {
    console.log('=== VISION API CALL START ===');
    console.log('Method:', req.method);
    
    // CORS headers - must be set first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        console.log('OPTIONS request, returning 200');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check environment first
        const hasApiKey = !!process.env.OPENAI_API_KEY;
        const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
        
        console.log('Environment check:');
        console.log('- API Key exists:', hasApiKey);
        console.log('- API Key length:', apiKeyLength);

        if (!hasApiKey) {
            console.error('CRITICAL: No OpenAI API key found');
            return res.status(500).json({ 
                error: 'OpenAI API key not configured',
                details: 'Add OPENAI_API_KEY to Vercel environment variables and redeploy'
            });
        }

        const { image } = req.body;

        if (!image) {
            console.error('No image in request body');
            return res.status(400).json({ 
                error: 'No image provided',
                details: 'Request body must contain base64 image data'
            });
        }

        const imageSizeKB = Math.round(image.length * 0.75 / 1024);
        console.log('Received image size:', imageSizeKB, 'KB');

        // Validate base64 format
        if (!image.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
            console.error('Invalid base64 format');
            return res.status(400).json({ 
                error: 'Invalid image format',
                details: 'Image must be valid base64 data'
            });
        }

        console.log('Making OpenAI API call...');

        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Look at this blood pressure monitor display and tell me exactly what numbers and text you can see. Look for systolic (SYS), diastolic (DIA), and pulse values. Just describe what you see on the screen."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${image}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0
            })
        });

        console.log('API response status:', apiResponse.status);

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('OpenAI API error:', errorText);
            
            let userMessage = 'Vision API request failed';
            if (apiResponse.status === 401) {
                userMessage = 'Invalid API key - check your OpenAI API key';
            } else if (apiResponse.status === 429) {
                userMessage = 'Rate limit exceeded - please wait and try again';
            }
            
            return res.status(500).json({ 
                error: userMessage,
                details: `Status: ${apiResponse.status}`
            });
        }

        const result = await apiResponse.json();
        console.log('OpenAI response received successfully');

        if (!result.choices || result.choices.length === 0) {
            return res.status(500).json({ 
                error: 'Empty response from Vision API'
            });
        }

        const extractedText = result.choices[0].message?.content?.trim() || 'No text found.';
        console.log('Extracted text:', extractedText);

        return res.status(200).json({
            text: extractedText,
            success: true
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
