export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageDataUri } = req.body;
  if (!imageDataUri) {
    return res.status(400).json({ error: "Missing image data" });
  }

  const base64 = imageDataUri.split(',')[1];

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GCV_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
            }
          ]
        })
      }
    );

    const result = await response.json();
    const text =
  result?.responses?.[0]?.fullTextAnnotation?.text ||
  result?.responses?.[0]?.textAnnotations?.[0]?.description ||
  "No text found.";
    res.status(200).json({ text });
  } catch (error) {
    console.error("Vision API error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
  const result = await response.json();
  console.log("Full Vision response:", JSON.stringify(result, null, 2));
}
