# Frontend Testing Guide

## Overview
Frontend UI tests using Playwright to verify the voice cloning web application interface.

## Test Files Created

### 1. `test_frontend_standalone.py` (Recommended)
**Purpose**: Standalone frontend UI tests that check if servers are running first.

**Features**:
- ✅ Automatic server health check
- ✅ Homepage load verification
- ✅ UI element discovery
- ✅ Console error detection
- ✅ Full-page screenshots

**Prerequisites**:
```bash
# Install Playwright (already done)
pip install playwright
python -m playwright install chromium

# Start backend server
cd backend && go run main.go

# Start frontend server (in another terminal)
cd voiceclone-pro-console && npm run dev
```

**Usage**:
```bash
cd tests
python test_frontend_standalone.py
```

### 2. `test_frontend.py` (Original)
**Purpose**: Basic Playwright tests (requires manual server management).

## Test Coverage

### Current Tests
1. **Homepage Load Test**
   - Verifies homepage loads without errors
   - Captures full-page screenshot
   - Checks page title
   - Counts UI elements (buttons, inputs)

2. **Navigation & UI Elements Test**
   - Discovers navigation elements
   - Finds file upload inputs
   - Locates text areas
   - Captures UI screenshot

3. **Console Errors Test**
   - Monitors browser console
   - Reports errors and warnings
   - Helps identify JavaScript issues

## Screenshots Generated

All screenshots are saved to `/tmp/`:
- `frontend_homepage.png` - Full homepage
- `frontend_ui_elements.png` - UI elements view
- `before_register.png` - Pre-authentication state
- `register_modal.png` - Registration modal (if found)
- `voice_interface.png` - Voice cloning interface

## Environment Variables

```bash
# Optional: Override default URLs
export FRONTEND_URL="http://localhost:3000"
export BACKEND_URL="http://localhost:8080"
```

## Next Steps

### Expand Test Coverage
Consider adding tests for:
- User registration flow (fill forms, submit)
- Login flow (authentication)
- Voice cloning workflow (upload audio, create voice)
- TTS generation (select voice, enter text, generate)
- Error handling (invalid inputs, network errors)

### Integration with Backend Tests
Combine frontend and backend tests for full E2E coverage:
```bash
# Run backend tests
pytest test_smoke.py -v

# Run frontend tests
python test_frontend_standalone.py
```

## Troubleshooting

**Issue**: `ERR_CONNECTION_REFUSED`
- **Solution**: Ensure both servers are running

**Issue**: `ModuleNotFoundError: No module named 'playwright'`
- **Solution**: `pip install playwright && python -m playwright install chromium`

**Issue**: Frontend on different port
- **Solution**: Set `FRONTEND_URL` environment variable

## Summary

✅ **Completed**:
- Playwright test infrastructure
- 3 basic UI tests
- Screenshot capture
- Console error monitoring
- Standalone test script with server checks

📋 **Test Results**: Run tests to see current status
