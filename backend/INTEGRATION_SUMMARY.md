# Backend Adaptation Summary

## Overview
Successfully adapted the backend to work with the new frontend (`voiceclone-pro-console`) without modifying the frontend code. All API responses now use camelCase field names, "credits" has been renamed to "points", and new endpoints have been added to support frontend features.

## Database Changes

### New Fields Added:
1. **voices table**:
   - `is_pinned` (BOOLEAN, default: false) - For pinning favorite voices

2. **tts_tasks table**:
   - `emotion` (VARCHAR(50)) - For emotion tags like [happy], [sad]

### Migration:
- GORM AutoMigrate will automatically add these fields when the server starts
- Manual SQL migration file created at: `/backend/migrations/add_frontend_fields.sql`

## API Response Format Changes

### Field Naming Convention:
- **Before**: snake_case (e.g., `audio_file_url`, `created_at`)
- **After**: camelCase (e.g., `audioFileUrl`, `createdAt`)

### Terminology Changes:
- **Before**: "credits"
- **After**: "points"

### Error Response Format:
- **Before**: `{"error": "message"}`
- **After**: `{"message": "message"}`

## New Files Created

1. **models/dto.go** - Response DTOs with camelCase fields
2. **models/converters.go** - Model-to-DTO conversion functions
3. **handlers/vip.go** - VIP management handlers
4. **migrations/add_frontend_fields.sql** - Database migration SQL

## New API Endpoints

### Authentication:
- `POST /api/v1/auth/login/sms` - SMS verification code login
  - Request: `{"phone": "13800138000", "smsCode": "123456"}`
  - Response: `{"message": "登录成功", "token": "...", "user": {...}}`

- `PATCH /api/v1/profile/password` - Change password
  - Request: `{"oldPassword": "...", "newPassword": "..."}`
  - Response: `{"message": "密码修改成功"}`

### Voice Management:
- `PATCH /api/v1/voices/:id` - Pin/unpin voice
  - Request: `{"isPinned": true}`
  - Response: `{"message": "更新成功", "data": {...}}`

### VIP System:
- `GET /api/v1/vip/status` - Get VIP status
  - Response: `{"isVip": true, "vipLevel": 1, "vipExpiresAt": "...", "benefits": [...]}`

- `POST /api/v1/vip/upgrade` - Upgrade to VIP
  - Request: `{"level": 1, "months": 3, "paymentType": "wechat"}`
  - Response: `{"message": "VIP升级成功", "data": {...}}`

### History:
- `GET /api/v1/history` - Get generation history (alias to TTS tasks)
  - Response: `{"data": [...], "total": 10}`

## Modified API Endpoints

### Voice Endpoints:
- `POST /api/v1/voices` - Now accepts camelCase fields and returns DTO
- `GET /api/v1/voices` - Returns all data when pagination not specified, sorted by isPinned
- `GET /api/v1/voices/:id` - Returns DTO with camelCase
- `GET /api/v1/voices/:id/status` - Returns DTO with progress field (0-100%)
- `DELETE /api/v1/voices/:id` - Returns standardized success response

### TTS Endpoints:
- `POST /api/v1/tts` - Now accepts `emotion` parameter and camelCase fields
- `GET /api/v1/tts` - Returns all data when pagination not specified
- `GET /api/v1/tts/:id` - Returns DTO with camelCase
- `GET /api/v1/tts/:id/status` - Returns DTO with camelCase
- `DELETE /api/v1/tts/:id` - Returns standardized success response

### Credits/Points Endpoints:
- `GET /api/v1/credits/balance` - Returns `{"points": 100}` instead of `{"credits": 100}`
- `GET /api/v1/credits/transactions` - Returns camelCase DTOs
- `POST /api/v1/credits/recharge` - Accepts `points` instead of `credits`
- `GET /api/v1/credits/orders/:order_no` - Returns camelCase DTO

### User Endpoints:
- `GET /api/v1/profile` - Returns camelCase DTO with `points` field

## Key Features Implemented

### 1. Voice Status Mapping:
- Database `processing` → Frontend `training`
- Database `completed` → Frontend `ready`
- Added simulated `progress` field (10-99% for training, 100% for ready)

### 2. Pagination Behavior:
- When `page=0` or not provided: Returns ALL data
- When `page>0`: Returns paginated data (max 100 per page)
- Query parameter changed from `page_size` to `pageSize`

### 3. Voice Sorting:
- Pinned voices appear first
- Then sorted by creation date (newest first)

### 4. System Voices:
- Currently returns empty array (to be implemented later)
- Frontend will show "暂无系统声音"

### 5. Emotion Tags:
- Stored in database but not yet passed to Fish Audio API
- Frontend can add tags like [happy], [sad] to text

## Request/Response Examples

### Voice Creation (Before):
```json
POST /api/v1/voices
{
  "name": "My Voice",
  "audio_file_url": "https://...",
  "with_transcript": true
}
```

### Voice Creation (After):
```json
POST /api/v1/voices
{
  "name": "My Voice",
  "audioFileUrl": "https://...",
  "withTranscript": true
}

Response:
{
  "message": "音色创建任务已提交",
  "data": {
    "id": 1,
    "name": "My Voice",
    "type": "user",
    "status": "training",
    "progress": 45,
    "createdDate": "2024-01-13T10:30:00Z",
    "isPinned": false
  }
}
```

### TTS Generation (Before):
```json
POST /api/v1/tts
{
  "voice_id": 1,
  "text": "Hello world",
  "speed": 1.0
}
```

### TTS Generation (After):
```json
POST /api/v1/tts
{
  "voiceId": 1,
  "text": "Hello [happy] world",
  "emotion": "happy",
  "speed": 1.0
}

Response:
{
  "message": "TTS任务已提交",
  "data": {
    "id": 1,
    "voiceId": 1,
    "voiceName": "My Voice",
    "text": "Hello [happy] world",
    "emotion": "happy",
    "status": "pending",
    "date": "2024-01-13T10:30:00Z"
  }
}
```

## Testing Checklist

### Before Starting Backend:
1. ✅ Database models updated with new fields
2. ✅ DTOs created for all responses
3. ✅ All handlers updated to use DTOs
4. ✅ Routes configured for new endpoints

### After Starting Backend:
1. ⏳ Verify database migration adds new columns
2. ⏳ Test SMS login endpoint
3. ⏳ Test password change endpoint
4. ⏳ Test voice pin/unpin functionality
5. ⏳ Test VIP status and upgrade endpoints
6. ⏳ Test TTS with emotion parameter
7. ⏳ Verify all responses use camelCase
8. ⏳ Verify "credits" renamed to "points"

## Frontend Integration Notes

### API Base URL:
- Backend uses `/api/v1/` prefix
- Frontend should configure: `const API_BASE_URL = "http://localhost:8080/api/v1"`

### Authentication:
- Frontend should store JWT token from login response
- Include in all requests: `Authorization: Bearer <token>`

### Data Mapping:
- Frontend TypeScript interfaces should match DTO structures
- All dates are ISO 8601 format
- All numeric IDs are integers

### Not Implemented (Future):
1. Smart text generation (Gemini AI integration)
2. System voices (returns empty array)
3. Real progress tracking from Fish Audio API
4. Actual emotion parameter passing to Fish Audio

## Files Modified

### Models:
- `models/voice.go` - Added IsPinned, Emotion fields
- `models/dto.go` - NEW: Response DTOs
- `models/converters.go` - NEW: Model-to-DTO converters

### Handlers:
- `handlers/voice.go` - Updated all functions, added UpdateVoice
- `handlers/tts.go` - Updated all functions, added emotion support
- `handlers/credit.go` - Updated to use points terminology
- `handlers/auth.go` - Added LoginWithSMS, ChangePassword
- `handlers/vip.go` - NEW: VIP management

### Routes:
- `routes/routes.go` - Added new endpoints

### Database:
- `migrations/add_frontend_fields.sql` - NEW: Migration SQL

## Running the Backend

```bash
cd /home/xiaowu/voice_web_app/backend
go run main.go
```

The server will:
1. Load configuration
2. Connect to database
3. **Automatically migrate new fields** (is_pinned, emotion)
4. Initialize Redis, OSS, Fish Audio
5. Start on configured port (default: 8080)

## Environment Variables

Make sure `.env` file has:
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=voice_clone

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OSS (Alibaba Cloud)
OSS_ENDPOINT=...
OSS_ACCESS_KEY_ID=...
OSS_ACCESS_KEY_SECRET=...
OSS_BUCKET_NAME=...

# Fish Audio
FISH_AUDIO_API_KEY=...
FISH_AUDIO_BASE_URL=https://api.fish.audio

# JWT
JWT_SECRET=your_secret_key

# Server
SERVER_PORT=8080
```

## Next Steps

1. Start the backend server
2. Verify database migration completed
3. Test new endpoints with Postman/curl
4. Connect frontend to backend
5. Test full integration
6. Implement remaining features (Gemini AI, system voices)
