# Focus Tracking System Architecture

## Overview

The focus tracking system has been completely refactored for clean separation of concerns, eliminating race conditions and stale closure bugs.

## Architecture Layers

### 1. **Timing Engine** (`useFocusTimer.ts`)
**Purpose**: Single source of truth for time increments

- Runs a single centralized 1-second interval timer
- Tracks current mode (active/idle/away/research)
- Calls `onTick(1, mode)` every second
- No state management - pure timing logic

**Key Features**:
- Uses `useRef` to prevent stale closures
- Only one timer runs at a time
- Mode changes don't restart timer
- Clean start/stop behavior

### 2. **State Management** (`useFocusSession.ts`)
**Purpose**: Business logic and state management

- Manages all focus-related state (segments, gaps, progress)
- Integrates with `useFocusTimer` for time tracking
- Provides clean API for state transitions
- Calculates progress and milestones

**Key Features**:
- Centralized time state (activeSeconds, idleSeconds, awaySeconds, researchSeconds)
- Manages focus segments and gap segments
- Handles transitions (goIdle, goActive, goAway, startBreak, etc.)
- No database concerns - pure state management

### 3. **Data Persistence** (`useActivitySession.ts`)
**Purpose**: Database sync ONLY

- Creates/ends database sessions
- Syncs session data to database every 5 seconds
- Uses `useRef` to prevent stale closures
- Handles crash recovery

**Critical Fix**:
```typescript
// OLD (BROKEN): Had stale closure issue
const syncSession = useCallback(() => {
  // Used sessionData from closure - often stale!
}, [sessionData]); // Dependency caused constant recreation

// NEW (FIXED): Uses ref for always-fresh data
const sessionDataRef = useRef(sessionData);
const syncSession = useCallback(() => {
  const current = sessionDataRef.current; // Always fresh!
}, []); // No dependencies - stable reference
```

**Key Features**:
- Single 5-second sync interval
- Ref-based data access (no stale closures)
- Transaction-safe updates
- Browser crash recovery via localStorage

### 4. **UI Layer** (`FocusJourneyBar.tsx`)
**Purpose**: Rendering and user interaction ONLY

- Orchestrates hooks (useActivitySession, useFocusSession, useIdleDetection, etc.)
- Handles user interactions (buttons, clicks)
- Manages duck animations and visual feedback
- Syncs local state to database

**Key Features**:
- Watches `times` from useFocusSession
- Diffs and syncs to database via useActivitySession
- Visual feedback (duck, progress bar, toasts)
- Learning window broadcast integration

## Data Flow

```
User Activity
    ↓
useIdleDetection / useWindowVisibility
    ↓
FocusJourneyBar (handlers)
    ↓
useFocusSession (state changes)
    ↓
useFocusTimer (tick every second)
    ↓
useFocusSession (update times)
    ↓
FocusJourneyBar (watch times change)
    ↓
useActivitySession (sync to DB)
    ↓
Database
```

## Benefits

### Before Refactor:
- ❌ 4 separate timers fighting each other
- ❌ Stale closures causing lost data
- ❌ UI logic mixed with business logic
- ❌ Race conditions on sync
- ❌ Research time never saved (always 0)
- ❌ 900+ line component

### After Refactor:
- ✅ Single centralized timer
- ✅ No stale closures (refs used properly)
- ✅ Clean separation of concerns
- ✅ Predictable sync behavior
- ✅ Research time properly tracked
- ✅ ~400 line component, 3 focused hooks

## Testing Research Tracking

1. Start a focus session
2. Click "Start Focused Research" button
3. Wait 30 seconds
4. Check database:
```sql
SELECT total_research_seconds FROM learning_sessions 
WHERE id = '<session_id>';
```
5. Should see increasing `total_research_seconds`

## Common Issues & Solutions

### Issue: Research time still showing 0
**Cause**: Old session still active
**Solution**: End current session, start new one

### Issue: Timer not running
**Cause**: Session not created
**Solution**: Check `sessionId` is not null

### Issue: Sync not happening
**Cause**: Interval not running
**Solution**: Check console for "⏰ Periodic sync triggered" every 5s

## Future Improvements

1. **Persistent timer across tabs**: Broadcast channel for timer sync
2. **Offline support**: Queue syncs when offline
3. **Analytics**: Track patterns in focus/idle/away times
4. **Gamification**: XP rewards for focus milestones
5. **AI insights**: Suggest optimal focus times based on data
