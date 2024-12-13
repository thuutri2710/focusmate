# FocusMate: Website Time Management Chrome Extension

<div align="center">
  <img src="icons/icon128.png" alt="FocusMate Logo" width="128" height="128">
</div>

## Overview

FocusMate is a powerful Chrome extension designed to help you manage your time effectively by monitoring and controlling your website usage. It allows you to set time limits, block distracting websites, and maintain focus on your important tasks.

## Features

- 🕒 **Time Tracking**: Monitor how much time you spend on different websites
- 🚫 **Website Blocking**: Set up rules to block distracting websites
- ⏰ **Time Limits**: Define daily time limits for specific websites
- 📊 **Usage Statistics**: View your website usage patterns
- 🎯 **Custom Rules**: Create flexible rules with wildcards support
- 🔄 **Real-time Monitoring**: Automatic time tracking and rule enforcement
- 📱 **Responsive Design**: Clean and intuitive user interface

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/thuutri2710/focusmate.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Usage

1. **Setting Up Rules**
   - Click the FocusMate icon in your Chrome toolbar
   - Click "Add New Rule"
   - Enter the website URL and desired restrictions
   - Save your rule

2. **Time Limits**
   - Set daily time limits for specific websites
   - The extension will automatically block access when limits are reached

3. **Website Blocking**
   - Block websites during specific time ranges
   - Use wildcards (e.g., "*.facebook.com") to block entire domains

4. **Monitoring Usage**
   - View time spent on different websites
   - Track your daily usage patterns

## Development

### Project Structure
```
focusmate/
├── src/
│   ├── background/     # Background scripts
│   ├── popup/         # Popup UI components
│   ├── services/      # Core services
│   └── utils/         # Utility functions
├── icons/            # Extension icons
├── public/           # Static assets
└── manifest.json     # Extension manifest
```

### Building
```bash
# Development build with hot reload
npm run dev

# Production build
npm run build
```

### Testing
```bash
npm run test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Icons designed with modern minimalist style
- Built with Vite and TailwindCSS
- Chrome Extension APIs

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/thuutri2710/focusmate/issues).
