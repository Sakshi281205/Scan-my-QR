# QR Code Scanner Application

A modern web-based QR Code scanner application built with Python Flask and JavaScript that allows users to scan QR codes using their device camera or by uploading images.

## Features

- **Real-time Camera Scanning**: Scan QR codes directly from your device's camera
- **Image Upload**: Upload images containing QR codes for scanning
- **Cross-platform**: Works on desktop and mobile devices
- **Modern UI**: Clean, responsive interface built with HTML5, CSS3, and JavaScript
- **Instant Results**: Real-time QR code detection and display

## Architecture

### Backend (Python Flask)
- **Framework**: Flask (Python web framework)
- **QR Processing**: `pyzbar` for QR code decoding
- **Image Processing**: `Pillow` (PIL) for image handling
- **File Handling**: Secure file upload and processing

### Frontend (HTML5/JavaScript)
- **Camera Access**: HTML5 `getUserMedia` API
- **Canvas Processing**: Real-time video frame capture
- **AJAX**: Asynchronous communication with backend
- **Responsive Design**: Mobile-first approach

### Libraries and Dependencies

#### Python Dependencies
```
Flask==2.3.3
Pillow==10.0.1
pyzbar==0.1.9
opencv-python==4.8.1.78
numpy==1.24.3
```

#### Frontend Libraries
- HTML5 Canvas API
- JavaScript ES6+
- CSS3 with Flexbox/Grid

## Project Structure

```
Scan-my-QR/
├── app.py                 # Main Flask application
├── static/
│   ├── css/
│   │   └── style.css      # Application styles
│   ├── js/
│   │   └── scanner.js     # Camera and scanning logic
│   └── uploads/           # Temporary upload directory
├── templates/
│   └── index.html         # Main application page
├── requirements.txt       # Python dependencies
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Modern web browser with camera access

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Scan-my-QR.git
   cd Scan-my-QR
   ```

2. **Create virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`
   - Allow camera access when prompted

## Usage

### Camera Scanning
1. Click "Start Camera" to enable your device camera
2. Point the camera at a QR code
3. The application will automatically detect and decode the QR code
4. Results will be displayed on the screen

### Image Upload
1. Click "Upload Image" to select an image file
2. Choose an image containing a QR code
3. The application will process the image and display the decoded result

## API Endpoints

- `GET /`: Main application page
- `POST /upload`: Upload and process image files
- `POST /scan_frame`: Process video frame for QR detection

## Browser Compatibility

- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 79+

## Security Features

- File type validation for uploads
- Secure file handling
- Input sanitization
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Deployment

### Local Development
- Run `python app.py` and access at `http://localhost:5000`

### Production Deployment
- Deploy to platforms like Heroku, PythonAnywhere, or AWS
- Set environment variables for production settings
- Use WSGI server like Gunicorn for production

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS is used (required for camera access)
   - Check browser permissions
   - Try refreshing the page

2. **QR codes not detected**
   - Ensure good lighting
   - Keep QR code steady and in focus
   - Check if QR code is damaged or low quality

3. **Upload not working**
   - Check file format (JPG, PNG supported)
   - Ensure file size is under 10MB
   - Verify image contains a visible QR code

## Future Enhancements

- Support for multiple QR codes in single image
- QR code generation feature
- History of scanned codes
- Export functionality
- Dark mode theme
- Mobile app version

## Contact

For questions or support, please open an issue on GitHub.