const fetch = require('node-fetch'); // Vercel includes this by default

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { base64Image } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, body: 'API key not configured' };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extract the systolic (SYS), diastolic (DIA), and pulse (PULSE) values from this blood pressure monitor image. Return only in JSON format: {"sys": "value", "dia": "value", "pulse": "value"}'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);

        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
        };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: 'Error processing image' };
    }
};
