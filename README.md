# Discord Quest Autoclaimer

A powerful automation tool for claiming Discord Quests automatically. This project includes a quest completion script and a DevTools enabler for Discord.

## Features

✨ **Automatic Quest Claiming**
- Supports multiple quest types: Video, Gaming, Streaming, and Activity tasks
- One-by-one quest execution for safety and control
- Real-time progress tracking with visual feedback
- Collapsible UI overlay for minimal screen intrusion

🎮 **Quest Type Support**
- `WATCH_VIDEO` / `WATCH_VIDEO_ON_MOBILE` - Spoof video watching
- `PLAY_ON_DESKTOP` - Spoof running a game
- `STREAM_ON_DESKTOP` - Spoof streaming gameplay
- `PLAY_ACTIVITY` - Participate in Discord Activities

📊 **Visual Progress Tracking**
- Live progress bars for each quest
- Real-time status updates
- Color-coded quest status (Running, Done, Error)

## Installation

### Enable Developer Tools

#### Option 1: PowerShell Script (Recommended)
```powershell
irm https://raw.githubusercontent.com/quickyyy/DiscordQuestAutoClaimer/refs/heads/master/Enable-DiscordDevTools.ps1 | iex
```

#### Option 2: Manual
Navigate to your Discord settings file:
- **Windows:** `%APPDATA%\discord\settings.json`
- **macOS:** `~/Library/Application Support/discord/settings.json`
- **Linux:** `~/.config/discord/settings.json`

Add this line:
```json
{
  "DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING": true
}
```

Then restart Discord completely.

## Usage

1. **Open Discord** and press `Ctrl+Shift+I` (or `Cmd+Shift+I` on Mac) to open DevTools
2. **Go to the Console tab**
3. **Paste the entire `main.js` script** into the console and press Enter
4. **A menu will appear** in the top-right corner showing all active quests
5. **Click "Start"** on any quest to begin completion
6. **Watch the progress bar** - quests complete automatically

### UI Controls
- **Start Button** - Begin completion for that specific quest
- **Collapse Button (−)** - Minimize the overlay
- **Close Button (×)** - Dismiss the overlay entirely

### Status Indicators
- 🔵 **Blue (Running)** - Quest is active
- 🟢 **Green (Done)** - Quest completed successfully
- 🔴 **Red (Error)** - Quest encountered an error

## Configuration

Edit the `CONFIG` object in `main.js` to customize behavior:

```javascript
const CONFIG = {
    IGNORED_QUEST_ID: "1412491570820812933",  // Skip this quest
    PID_RANGE: 30000,                          // Random PID range for spoofing
    PID_OFFSET: 1000,                          // PID offset base
    VIDEO_SPEED: 7,                            // Seconds per video update
    VIDEO_INTERVAL: 1,                         // Seconds between updates
    HEARTBEAT_INTERVAL: 20,                    // Seconds between heartbeats
    MAX_FUTURE_SECONDS: 10                     // Max future timestamp allowed
};
```

## How It Works

### Video Tasks
- Updates video progress every `VIDEO_INTERVAL` seconds
- Increments by `VIDEO_SPEED` seconds per update
- Respects Discord's `MAX_FUTURE_SECONDS` limit to avoid detection

### Game/Stream Tasks
- Spoofs fake game/stream metadata into Discord's internal stores
- Listens for heartbeat events from Discord
- Visually interpolates progress every second for smooth UI
- Syncs with real server updates every ~30 seconds

### Activity Tasks
- Finds available voice channels
- Sends heartbeat signals to simulate activity
- Updates progress every 20 seconds

## Architecture

```
OverlayUI              - Renders the control panel
  ↓
QuestManager           - Orchestrates quest execution
  ↓
DiscordInternals       - Extracts Discord's Webpack modules
  ↓
TaskStrategy (Abstract)
  ├── VideoTaskStrategy
  ├── PlayOnDesktopStrategy
  ├── StreamOnDesktopStrategy
  └── ActivityStrategy
```

## Limitations

⚠️ **Important Notes**
- This script violates Discord's ToS (TOS). Use at your own risk.
- Only works with Discord Desktop App for game/stream spoofing
- Requires DevTools to be enabled
- Progress updates from Discord occur every ~30 seconds
- Some quests may require specific setup (e.g., streaming requires a friend in VC)

## Troubleshooting

### "Discord Webpack global not found"
- DevTools not enabled. Run the PowerShell script or manually enable it.
- Make sure you're in the Discord Console, not a website console.

### Progress bar stuck at 0%
- For game/stream tasks: This is normal. Wait 30-60 seconds for the first heartbeat.
- The status will show "Waiting for heartbeat..." during this time.
- Look at the console (F12) for any error messages.

### "Desktop App required for this quest"
- You're using Discord in a browser, which doesn't support game spoofing.
- Use the Discord Desktop App instead.

### "No voice channel found"
- Activity quests require at least one voice channel to exist in your servers.
- Create a private server with a voice channel if needed.

### "Can't paste in console"
- Enter "allow pasting", then use script

## Performance

- **Video Tasks:** ~30-60 seconds depending on required duration
- **Game/Stream Tasks:** Requires active heartbeat (Discord throttled to ~30s intervals)
- **Activity Tasks:** Depends on quest duration and Discord's update frequency
- **Memory Usage:** Minimal (<10MB for script execution)

## Security Considerations

🔐 **For Your Safety**
- Script runs locally in your browser console only
- No data is transmitted to third-party servers
- Your Discord credentials remain untouched
- Always review scripts before pasting into console

## Files

- `main.js` - Main quest autoclaimer script
- `Enable-DiscordDevTools.ps1` - PowerShell script to enable DevTools
- `README.md` - This file (English)
- `README-RU.md` - Russian documentation

## Basis and authorship

This script is based on the original work by [aamiaa](https://github.com/aamiaa). The original repository can be found [here](https://gist.github.com/aamiaa/204cd9d42013ded9faf646fae7f89fbb).

## License

GPL-3.0

## Support

For issues, questions, or contributions, please open an issue on GitHub.
