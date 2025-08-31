// /api/vision.js - Minimal version for testing
export default async function handler(req, res) {
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

    console.log('=== VISION API DEBUG START ===');
    console.log('Environment check:');
    console.log('- API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('- API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    
    try {
        const { image } = req.body;
        console.log('- Request body has image:', !!image);
        console.log('- Image length:', image?.length || 0);

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured',
                details: 'Set OPENAI_API_KEY in Vercel environment variables'
            });
        }

        // Simple test first - just try to call the API
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
                                text: "Look at this image and tell me what text or numbers you can see. Focus on any digital display or numerical values."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/png;base64,${image}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        console.log('OpenAI API response status:', apiResponse.status);

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('OpenAI API error response:', errorText);
            
            return res.status(500).json({ 
                error: 'OpenAI API failed',
                details: `Status: ${apiResponse.status}, Error: ${errorText.substring(0, 500)}`
            });
        }

        const result = await apiResponse.json();
        console.log('OpenAI API success, response:', result);

        const extractedText = result.choices?.[0]?.message?.content?.trim() || 'No text found.';
        
        console.log('Final extracted text:', extractedText);
        console.log('=== VISION API DEBUG END ===');

        return res.status(200).json({
            text: extractedText,
            success: true,
            debug: {
                model: result.model,
                usage: result.usage
            }
        });

    } catch (error) {
        console.error('=== VISION API ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== ERROR END ===');
        
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            type: error.name
        });
    }
}
