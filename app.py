from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import cv2
import numpy as np
from PIL import Image
from pyzbar import pyzbar
import base64
import io
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def decode_qr_from_image(image_data):
    """Decode QR code from image data."""
    try:
        # Convert base64 to image
        if isinstance(image_data, str) and image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to grayscale for better QR detection
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Decode QR codes
        qr_codes = pyzbar.decode(gray)
        
        results = []
        for qr in qr_codes:
            qr_data = qr.data.decode('utf-8')
            qr_type = qr.type
            results.append({
                'data': qr_data,
                'type': qr_type,
                'rect': qr.rect
            })
        
        return results
    
    except Exception as e:
        print(f"Error decoding QR code: {str(e)}")
        return []

@app.route('/')
def index():
    """Main application page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and QR code scanning."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            
            # Save file
            file.save(filepath)
            
            # Read and process image
            image = Image.open(filepath)
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Decode QR codes
            qr_codes = pyzbar.decode(gray)
            
            results = []
            for qr in qr_codes:
                qr_data = qr.data.decode('utf-8')
                qr_type = qr.type
                results.append({
                    'data': qr_data,
                    'type': qr_type,
                    'rect': {
                        'left': qr.rect.left,
                        'top': qr.rect.top,
                        'width': qr.rect.width,
                        'height': qr.rect.height
                    }
                })
            
            # Clean up uploaded file
            os.remove(filepath)
            
            if results:
                return jsonify({
                    'success': True,
                    'results': results,
                    'message': f'Found {len(results)} QR code(s)'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'No QR codes found in the image'
                })
        
        else:
            return jsonify({'error': 'Invalid file type'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/scan_frame', methods=['POST'])
def scan_frame():
    """Handle video frame scanning for real-time camera scanning."""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        results = decode_qr_from_image(image_data)
        
        if results:
            return jsonify({
                'success': True,
                'results': results,
                'message': f'Found {len(results)} QR code(s)'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No QR codes detected'
            })
    
    except Exception as e:
        return jsonify({'error': f'Error scanning frame: {str(e)}'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'QR Scanner is running'})

if __name__ == '__main__':
    # For development, use debug mode
    app.run(debug=True, host='0.0.0.0', port=5000) 