<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📸 BP Monitor Reader</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            opacity: 0.9;
            font-size: 16px;
        }

        .upload-area {
            padding: 40px;
            text-align: center;
        }

        .drop-zone {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 50px 20px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .drop-zone:hover, .drop-zone.dragover {
            border-color: #4facfe;
            background: rgba(79, 172, 254, 0.05);
        }

        .drop-zone input {
            position: absolute;
            inset: 0;
            opacity: 0;
            cursor: pointer;
        }

        .upload-icon {
            font-size: 48px;
            margin-bottom: 20px;
            color: #4facfe;
        }

        .upload-text {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
        }

        .upload-hint {
            font-size: 14px;
            color: #999;
        }

        .preview-area {
            margin-top: 30px;
            display: none;
        }

        .preview-image {
            max-width: 100%;
            max-height: 300px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .results-area {
            margin-top: 30px;
            display: none;
        }

        .result-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
        }

        .result-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }

        .metric {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #4facfe;
            margin-bottom: 5px;
        }

        .metric-label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 30px;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4facfe;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            color: #c53030;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }

        .success {
            background: #f0fff4;
            border: 1px solid #9ae6b4;
            color: #2f855a;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }

        .analyze-btn {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            margin-top: 20px;
            display: none;
        }

        .analyze-btn:hover {
            transform: translateY(-2px);
        }

        .analyze-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .raw-text {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📸 BP Monitor Reader</h1>
            <p>Upload a photo of your blood pressure monitor display</p>
        </div>

        <div class="upload-area">
            <div class="drop-zone" id="dropZone">
                <input type="file" id="fileInput" accept="image/*">
                <div class="upload-icon">📷</div>
                <div class="upload-text">Click to upload or drag & drop</div>
                <div class="upload-hint">PNG, JPG, JPEG - Crop to show just the display for best results</div>
            </div>

            <button class="analyze-btn" id="analyzeBtn">🔍 Analyze Reading</button>

            <div class="preview-area" id="previewArea">
                <h3>Image Preview:</h3>
                <img id="previewImage" class="preview-image" alt="Preview">
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Analyzing blood pressure reading...</p>
            </div>

            <div class="error" id="error"></div>

            <div class="results-area" id="results">
                <div class="result-card">
                    <h3>📊 Blood Pressure Reading</h3>
                    <div class="result-grid">
                        <div class="metric">
                            <div class="metric-value" id="sysValue">--</div>
                            <div class="metric-label">Systolic</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" id="diaValue">--</div>
                            <div class="metric-label">Diastolic</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value" id="pulseValue">--</div>
                            <div class="metric-label">Pulse</div>
                        </div>
                    </div>
                    <div class="success" id="successMessage" style="display: none;">
                        ✅ Reading extracted successfully!
                    </div>
                    <details>
                        <summary>Raw Text Detected</summary>
                        <div class="raw-text" id="rawText"></div>
                    </details>
                </div>
            </div>
        </div>
    </div>

    <script>
        let selectedFile = null;

        // DOM elements
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const previewArea = document.getElementById('previewArea');
        const previewImage = document.getElementById('previewImage');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const results = document.getElementById('results');
        const sysValue = document.getElementById('sysValue');
        const diaValue = document.getElementById('diaValue');
        const pulseValue = document.getElementById('pulseValue');
        const rawText = document.getElementById('rawText');
        const successMessage = document.getElementById('successMessage');

        // File handling
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
        analyzeBtn.addEventListener('click', analyzeImage);

        function handleDragOver(e) {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        }

        function handleFileSelect(e) {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        }

        function handleFile(file) {
            if (!file.type.startsWith('image/')) {
                showError('Please select an image file (PNG, JPG, JPEG)');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showError('File size must be less than 10MB');
                return;
            }

            selectedFile = file;
            console.log('Original file size:', Math.round(file.size / 1024), 'KB');
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewArea.style.display = 'block';
                analyzeBtn.style.display = 'inline-block';
                hideError();
                hideResults();
            };
            reader.readAsDataURL(file);
        }

        async function analyzeImage() {
            if (!selectedFile) {
                showError('Please select an image first');
                return;
            }

            try {
                showLoading();
                hideError();
                hideResults();

                // Preprocess and compress image aggressively
                const processedImageData = await preprocessImage(selectedFile);
                const base64Data = processedImageData.split(',')[1];
                
                const finalSizeKB = Math.round(base64Data.length * 0.75 / 1024);
                console.log('Final payload size:', finalSizeKB, 'KB');
                
                // Strict size check for Vercel limits (under 1MB to be safe)
                if (base64Data.length > 1024 * 1024) { // 1MB in base64
                    throw new Error(`Image too large (${finalSizeKB}KB). Please crop the image to show only the BP monitor display, or use a smaller image.`);
                }

                console.log('Sending to Vision API, payload size OK');

                const response = await fetch('/api/vision', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: base64Data
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Vision response:', data);

                if (data.error) {
                    throw new Error(data.error);
                }

                if (response.status === 500) {
                    throw new Error(data.details || data.error || 'Server error occurred');
                }

                if (!data.text || data.text === 'No text found.') {
                    throw new Error('No text detected in image. Please ensure the BP monitor display is clearly visible and well-lit.');
                }

                // Extract BP values from text
                const extracted = extractBPValues(data.text);
                
                if (!extracted.sys && !extracted.dia && !extracted.pulse) {
                    throw new Error('Could not extract BP values. Please ensure the image shows a clear BP monitor display with numerical readings.');
                }

                // Display results
                displayResults(extracted, data.text);

            } catch (err) {
                console.error('Analysis error:', err);
                showError(err.message);
            } finally {
                hideLoading();
            }
        }

        async function preprocessImage(file) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    // Calculate optimal size (max 800px width, maintain aspect ratio)
                    let { width, height } = img;
                    const maxWidth = 800;
                    const maxHeight = 800;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw resized image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Get image data for preprocessing
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    // Enhance contrast and brightness for better text detection
                    for (let i = 0; i < data.length; i += 4) {
                        // Increase contrast
                        const factor = 1.4;
                        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // Red
                        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // Green
                        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // Blue
                        
                        // Increase brightness slightly
                        data[i] = Math.min(255, data[i] + 15);
                        data[i + 1] = Math.min(255, data[i + 1] + 15);
                        data[i + 2] = Math.min(255, data[i + 2] + 15);
                    }
                    
                    // Put processed image data back
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Return as compressed JPEG with quality setting to reduce size
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    console.log('Compressed image size:', Math.round(dataURL.length / 1024), 'KB');
                    resolve(dataURL);
                };
                
                img.src = URL.createObjectURL(file);
            });
        }

        function extractBPValues(text) {
            console.log('Extracting from text:', text);
            
            const result = {
                sys: null,
                dia: null,
                pulse: null
            };

            // Clean the text
            const cleanText = text.replace(/[^\d\s\/\-]/g, ' ').trim();
            
            // Multiple patterns to match different BP monitor formats
            const patterns = [
                // Standard XXX/XX format
                /(\d{2,3})\s*[\/\-]\s*(\d{2,3})/,
                // SYS DIA format
                /SYS[\s:]*(\d{2,3})[\s\D]*DIA[\s:]*(\d{2,3})/i,
                // Separate numbers pattern
                /(\d{2,3})[\s\D]+(\d{2,3})[\s\D]+(\d{2,3})/
            ];

            // Try each pattern
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    result.sys = parseInt(match[1]);
                    result.dia = parseInt(match[2]);
                    
                    // Look for pulse separately
                    const pulsePattern = /(?:PULSE|PR|HR)[\s:]*(\d{2,3})/i;
                    const pulseMatch = text.match(pulsePattern);
                    if (pulseMatch) {
                        result.pulse = parseInt(pulseMatch[1]);
                    } else {
                        // If we found 3 numbers and no specific pulse marker, assume third is pulse
                        if (match[3]) {
                            result.pulse = parseInt(match[3]);
                        }
                    }
                    break;
                }
            }

            // Fallback: look for any 2-3 digit numbers
            if (!result.sys && !result.dia) {
                const numbers = text.match(/\d{2,3}/g);
                if (numbers && numbers.length >= 2) {
                    result.sys = parseInt(numbers[0]);
                    result.dia = parseInt(numbers[1]);
                    if (numbers.length >= 3) {
                        result.pulse = parseInt(numbers[2]);
                    }
                }
            }

            // Validate ranges
            if (result.sys && (result.sys < 50 || result.sys > 300)) result.sys = null;
            if (result.dia && (result.dia < 30 || result.dia > 200)) result.dia = null;
            if (result.pulse && (result.pulse < 30 || result.pulse > 200)) result.pulse = null;

            console.log('Extracted values:', result);
            return result;
        }

        function displayResults(data, rawTextContent) {
            sysValue.textContent = data.sys || '--';
            diaValue.textContent = data.dia || '--';
            pulseValue.textContent = data.pulse || '--';
            rawText.textContent = rawTextContent;
            
            successMessage.style.display = 'block';
            results.style.display = 'block';
        }

        function showLoading() {
            loading.style.display = 'block';
            analyzeBtn.disabled = true;
        }

        function hideLoading() {
            loading.style.display = 'none';
            analyzeBtn.disabled = false;
        }

        function showError(message) {
            error.textContent = message;
            error.style.display = 'block';
        }

        function hideError() {
            error.style.display = 'none';
        }

        function hideResults() {
            results.style.display = 'none';
            successMessage.style.display = 'none';
        }

        // Remove dragover class when dragging leaves the drop zone
        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('dragover');
            }
        });
    </script>
</body>
</html>
