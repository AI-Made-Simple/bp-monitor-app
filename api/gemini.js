export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType } = req.body;

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Missing image or MIME type" });
  }

  const promptText = "This is a photo of a digital blood pressure monitor. Please extract the readings shown on the screen and format them as:\nSystolic: ___ mmHg\nDiastolic: ___ mmHg\nPulse: ___ bpm";

  // Debug logs
  console.log("Sending to Gemini with prompt and image:");
  console.log("Prompt:", promptText);
  console.log("Image size (base64):", imageBase64.length);
  console.log("MIME type:", mimeType);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: mimeType, data: imageBase64 } }
          ]
        }]
      })
    });

    const result = await response.json();
    console.log("Raw Gemini response:", JSON.stringify(result, null, 2));

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No data found.";
    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
