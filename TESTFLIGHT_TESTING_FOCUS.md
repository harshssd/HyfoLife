# What to Test - HyfoLife Beta Build

## Primary Testing Focus

### Core App Flow
- User Registration: Create account with email/password
- Habit Selection: Choose from starter habits (Coffee, Water, Pushups, Focus, Gym)
- Daily Logging: Test all input modes (Counter, Timer, Check-in, Quantity)
- Dashboard: Verify habit cards, progress bars, and streak displays
- Recent Activities: Check filtering, pagination, and entry management

### Key Features to Test
- Quick Logging: One-tap habit entries from dashboard
- Goal Setting: Set targets and verify progress tracking
- Undo Functionality: Test undo for accidental entries
- Navigation: Move between all screens smoothly
- Data Persistence: Ensure entries save and load correctly

### UI/UX Testing
- Animations: Streak flames, progress bars, toast notifications
- Responsiveness: App performance on different screen sizes
- Modal Interactions: Quick log modal, goal setting modal
- Visual Feedback: Haptic responses and visual confirmations

## Specific Areas to Watch

### Authentication
- Sign up process works correctly
- Sign in/logout functions properly
- Session persistence across app restarts

### Habit Management
- Habit creation from starter templates
- Habit logging with different input modes
- Progress calculations and streak tracking
- Goal completion detection

### Data Sync
- Entries save to cloud database
- Recent activities load correctly
- Progress bars update in real-time
- Streak calculations are accurate

### Edge Cases
- App behavior with no internet connection
- Backgrounding and foregrounding app
- Rapid tapping on buttons
- Large numbers in counter inputs

## Testing Scenarios

### Daily Usage
1. Open app and check dashboard
2. Log 2-3 different habits
3. Set a goal for one habit
4. Check progress visualization
5. View recent activities

### Weekly Usage
1. Log habits consistently for 3-4 days
2. Verify streak calculations
3. Test goal completion scenarios
4. Explore all navigation paths

## Report These Issues

- Crashes: Any app crashes or freezes
- Data Loss: Entries not saving or disappearing
- UI Bugs: Elements not displaying correctly
- Performance: Slow loading or laggy animations
- Navigation: Getting stuck or unable to proceed

## Success Criteria

- All core features work as expected
- No crashes during normal usage
- Data persists correctly across sessions
- UI is responsive and visually appealing
- User can complete full habit tracking workflow

---

Focus on the core habit tracking experience and report any issues that prevent normal usage!
