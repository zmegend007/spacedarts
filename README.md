# DartMaster AI 🎯

An AI-powered dart companion app featuring automatic scoring, voice commands, smart checkout suggestions, and camera-based dart detection using Gemini AI.

![DartMaster AI](https://img.shields.io/badge/Gemini-AI%20Powered-blue)
![React](https://img.shields.io/badge/React-19.2-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff)

## ✨ Features

### 🎯 **Individual Dart Tracking**
- Track every throw with multipliers (Single/Double/Triple)
- Visual scoreboard showing T20, D16, S5, etc.
- Color-coded round history (Red=Triple, Green=Double, Gray=Single)
- Undo functionality and manual round completion

### 📷 **Camera Integration** (NEW!)
- Connect IP camera for automatic dart detection
- Gemini Vision AI analyzes dartboard images
- Detects dart positions with confidence scores
- Accept/reject AI suggestions or enter manually

### 🎙️ **Voice Commands**
- Hands-free scoring via voice input
- Say "Triple 20", "Double 16", "Bullseye"
- Automatic score recognition and entry

### 💡 **Smart Checkout Suggestions**
- AI-powered optimal dart path calculations
- Shows best route to finish (e.g., "T20 → T20 → D20")
- Displays for scores ≤170 in 501/301 modes

### 🧠 **Context-Aware AI Chat**
- DartBot Pro knows your game state
- Personalized advice based on current score
- Expert rules knowledge for all game modes

### 🏆 **Achievement System**
- 12 unlockable achievements
- AI voice celebrations
- Animated notifications
- Persistent tracking

### 🎮 **Game Modes**
- 501 Double Out
- 301 Double In/Out
- Cricket
- Around the Clock
- Killer
- Shanghai

## 🚀 Quick Start

### Prerequisites
- Node.js (v20+)
- Gemini API key ([Get one here](https://ai.google.dev/))
- Optional: IP camera for automatic detection

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/dartmaster-ai.git
cd dartmaster-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up your Gemini API key**
```bash
# Create .env.local file
echo "API_KEY=your_gemini_api_key_here" > .env.local
```

4. **Run the app**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

### 🌐 Local Network Play (Multi-Device)

To play with friends on the same WiFi (e.g., using a tablet as a scoreboard):

1. **Find your computer's local IP address:**
   - Mac: `ipconfig getifaddr en0` (usually 192.168.x.x)
   - Windows: `ipconfig`

2. **Open on mobile/tablet:**
   - Enter `http://YOUR_IP_ADDRESS:3000` in the browser
   - Example: `http://192.168.1.15:3000`

> **Note:** For the IP Camera feature to work, you must use `http://` (not https) on your local network to avoid "Mixed Content" security blocks, as most IP cameras stream over HTTP.

## 📷 Camera Setup (Optional)

### Supported Cameras
- Any IP camera with HTTP snapshot endpoint
- Common formats: `/snapshot.jpg`, `/cgi-bin/snapshot.cgi`
- RTSP streams (with snapshot capability)

### Configuration
1. Click ⚙️ Settings in game header
2. Enable camera toggle
3. Enter camera details:
   - IP Address (e.g., `192.168.1.100`)
   - Port (e.g., `8080`)
   - Snapshot path (e.g., `/snapshot.jpg`)
   - Username/Password (if required)
4. Test connection
5. Save settings

### Usage
1. Throw darts at board
2. Click "Capture & Analyze"
3. Review AI-detected throws
4. Accept or reject suggestions

## 🎯 How to Play

1. **Enter your name** → AI generates avatar & alias
2. **Select game mode** (501, Cricket, etc.)
3. **Choose input method:**
   - 📷 Camera: Click "Capture & Analyze"
   - 🎙️ Voice: Click mic button and speak
   - 👆 Manual: Select multiplier + click number
4. **Track your game** with AI commentary
5. **Get checkout suggestions** when in range
6. **Ask DartBot** for rules or strategy tips

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **AI:** Google Gemini API
  - Vision: Dart detection
  - Text: Chat & commentary
  - TTS: Voice announcements
- **Icons:** Lucide React
- **Storage:** localStorage (Firebase-ready)

## 📁 Project Structure

```
dartmaster-ai/
├── components/
│   ├── SetupScreen.tsx       # Player creation
│   ├── GameSelection.tsx     # Game mode picker
│   ├── GameScreen.tsx        # Main gameplay
│   ├── ChatAssistant.tsx     # AI chatbot
│   └── CameraSettings.tsx    # Camera config
├── services/
│   ├── gemini.ts             # Gemini API integration
│   ├── dartScoring.ts        # Throw calculations
│   ├── voiceRecognition.ts   # Voice commands
│   ├── checkoutCalculator.ts # Optimal paths
│   ├── achievements.ts       # Achievement system
│   ├── cameraService.ts      # IP camera integration
│   ├── visionAnalysis.ts     # Gemini Vision
│   └── audioUtils.ts         # TTS playback
├── types.ts                  # TypeScript definitions
└── App.tsx                   # Main app
```

## 🎮 Game Features

### Dart Input Methods
- **Camera Detection** - Automatic via Gemini Vision
- **Voice Commands** - "Triple 20", "Double 16"
- **Quick Targets** - T20, T19, T18, D20, D16, Bull
- **Number Grid** - Click multiplier + number
- **Manual Entry** - Full control

### Scoring Features
- Individual throw tracking
- Round history with color coding
- Bust detection (501/301 modes)
- Checkout suggestions
- Average score calculation

### AI Features
- Avatar generation
- Witty alias creation
- Game commentary
- Voice announcements
- Chat assistance
- Dart detection
- Achievement celebrations

## 🚀 Roadmap

### v2.0 (Planned)
- [ ] Firebase backend integration
- [ ] Online multiplayer
- [ ] Global leaderboards
- [ ] Tournament system
- [ ] Advanced analytics dashboard
- [ ] Form analysis & coaching
- [ ] Continuous camera monitoring
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions welcome! This is a collaborative project.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Acknowledgments

- **Google Gemini AI** - Vision, text generation, and TTS
- **React Team** - Amazing framework
- **Vite** - Lightning-fast build tool
- **Dart Community** - Inspiration and feedback

## 📧 Contact

Have questions or suggestions? Open an issue or reach out!

---

**Built with ❤️ and 🎯 by dart enthusiasts**

*Ready to revolutionize your dart game? Let's throw! 🎯*
