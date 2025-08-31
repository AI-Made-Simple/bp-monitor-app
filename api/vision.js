// /api/vision.js - Vercel Serverless Function
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not found');
            return res.status(500).json({ error: 'API configuration error' });
        }

        console.log('Processing image, length:', image.length);

        // Enhanced prompt for blood pressure monitor reading
        const prompt = `You are an expert at reading blood pressure monitor displays. 

Carefully examine this image of a blood pressure monitor and extract the following numerical values:
- Systolic pressure (SYS) - usually the higher number (typically 90-200)
- Diastolic pressure (DIA) - usually the lower number (typically 60-120) 
- Pulse rate (PULSE/PR/HR) - heart rate (typically 50-150)

Look for:
- Digital display numbers
- Labels like "SYS", "DIA", "PULSE", "PR", "HR"
- Format like "120/80" or separate numbers
- Any numerical readings on the screen

Return ONLY the detected text exactly as you see it, including all numbers and labels. If you cannot clearly read any text, respond with "No clear text detected."`;

        // Call OpenAI Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o", // Using the latest vision model
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/png;base64,${image}`,
                                    detail: "high" // High detail for better text recognition
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.1 // Low temperature for more consistent results
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenAI API error:', response.status, errorData);
            
            if (response.status === 401) {
                return res.status(500).json({ error: 'API authentication failed' });
            } else if (response.status === 429) {
                return res.status(429).json({ error: 'Rate limit exceeded, please try again later' });
            } else {
                return res.status(500).json({ error: 'Vision API request failed' });
            }
        }

        const data = await response.json();
        console.log('OpenAI response:', data);

        if (!data.choices || data.choices.length === 0) {
            return res.status(500).json({ error: 'No response from Vision API' });
        }

        const extractedText = data.choices[0].message.content.trim();
        
        if (extractedText === 'No clear text detected.' || extractedText.toLowerCase().includes('no text') || extractedText.toLowerCase().includes('cannot')) {
            return res.status(200).json({ 
                text: 'No text found.',
                error: 'Could not detect clear text in the image. Please ensure the BP monitor display is well-lit and clearly visible.'
            });
        }

        console.log('Extracted text:', extractedText);

        return res.status(200).json({
            text: extractedText,
            success: true
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// Alternative using Google Cloud Vision API (if you prefer better OCR)
// Uncomment and use this if OpenAI Vision isn't working well for your use case

/*
import { ImageAnnotatorClient } from '@google-cloud/vision';

export default async function handler(req, res) {
    // ... CORS headers same as above ...

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Initialize Google Cloud Vision client
        const client = new ImageAnnotatorClient({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
                private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
            }
        });

        // Detect text in the image
        const [result] = await client.textDetection({
            image: {
                content: image
            }
        });

        const detections = result.textAnnotations;
        const extractedText = detections && detections.length > 0 
            ? detections[0].description 
            : 'No text found.';

        console.log('Google Vision extracted text:', extractedText);

        return res.status(200).json({
            text: extractedText,
            success: true
        });

    } catch (error) {
        console.error('Google Vision error:', error);
        return res.status(500).json({ 
            error: 'Vision processing failed',
            details: error.message 
        });
    }
}
*/
