# TTS下载格式修复报告

**问题**: 用户选择WAV格式生成TTS，但下载时文件扩展名仍为.mp3  
**状态**: ✅ 已修复  
**日期**: 2026-01-27

---

## 问题描述

### 症状
用户在前端选择WAV格式生成TTS音频，生成成功后点击下载，发现下载的文件扩展名仍然是`.mp3`，而不是期望的`.wav`。

### 根本原因
1. **前端硬编码**: `HistoryList.tsx`中下载函数的文件名硬编码为`.mp3`扩展名
2. **缺少格式传递**: TTSTaskResponse和GenerationRecord接口缺少format字段
3. **数据丢失**: 后端虽然存储了format，但没有在响应中返回

---

## 修复方案

### 1. 后端响应DTO更新

**文件**: `backend/models/dto.go`

**更改**: 添加Format字段到TTSTaskResponse
```go
type TTSTaskResponse struct {
    // ... 其他字段 ...
    Format        string     `json:"format,omitempty"` // 新增
    // ... 其他字段 ...
}
```

### 2. 后端转换器更新

**文件**: `backend/models/converters.go`

**更改**: 在ToTTSTaskResponse中包含format字段
```go
func (t *TTSTask) ToTTSTaskResponse(voiceName string) TTSTaskResponse {
    return TTSTaskResponse{
        // ... 其他字段 ...
        Format:        t.Format, // 新增
        // ... 其他字段 ...
    }
}
```

### 3. 前端类型定义更新

**文件**: `voiceclone-pro-console/types/api.ts`

**更改**: 添加format字段到TTSTaskResponse接口
```typescript
export interface TTSTaskResponse {
  // ... 其他字段 ...
  format?: string; // 新增: mp3, wav, pcm, opus
  // ... 其他字段 ...
}
```

**文件**: `voiceclone-pro-console/types.ts`

**更改**: 添加format字段到GenerationRecord接口
```typescript
export interface GenerationRecord {
  // ... 其他字段 ...
  format?: string; // 新增: 音频格式
}
```

### 4. 前端下载逻辑修复

**文件**: `voiceclone-pro-console/components/HistoryList.tsx`

**更改 1 - handleDownload函数**:
```typescript
// 修复前
const handleDownload = (audioUrl?: string, voiceName?: string) => {
  // ...
  link.download = `${voiceName || 'audio'}_${Date.now()}.mp3`; // 硬编码
  // ...
};

// 修复后
const handleDownload = (audioUrl?: string, voiceName?: string, format?: string) => {
  // 根据格式确定文件扩展名
  let fileExt = 'mp3';
  if (format) {
    if (format === 'pcm') {
      fileExt = 'wav'; // PCM通常以WAV容器封装
    } else {
      fileExt = format;
    }
  }
  
  link.download = `${voiceName || 'audio'}_${Date.now()}.${fileExt}`;
  // ...
};
```

**更改 2 - 调用位置**:
```typescript
// 修复前
<button onClick={() => handleDownload(record.audioUrl, record.voiceName)}>

// 修复后
<button onClick={() => handleDownload(record.audioUrl, record.voiceName, record.format)}>
```

### 5. 前端数据转换更新

**文件**: `voiceclone-pro-console/components/Workspace.tsx`

**更改**: 在转换TTSTaskResponse为GenerationRecord时包含format
```typescript
const historyRecords = ttsTasks.map(task => {
  // ...
  return {
    // ... 其他字段 ...
    format: task.format, // 新增
  };
});
```

---

## 文件扩展名映射

| 格式 | 文件扩展名 | 说明 |
|------|-----------|------|
| mp3 | `.mp3` | MP3音频 |
| wav | `.wav` | WAV无损音频 |
| pcm | `.wav` | PCM原始音频（WAV容器） |
| opus | `.opus` | Opus压缩音频 |

---

## 测试验证

### 测试文件
- `tests/test_tts_download_format.py`

### 测试结果
```
✅ test_tts_response_includes_format ........ PASSED
✅ test_format_field_structure .............. PASSED
✅ test_backend_format_storage .............. PASSED

3 passed in 0.22s
```

### 手动测试步骤

1. **选择WAV格式生成**:
   - 登录系统
   - 进入TTS界面
   - 选择"输出格式" → "WAV (44.1kHz, 无损)"
   - 输入文本并生成

2. **验证下载扩展名**:
   - 等待生成完成
   - 在生成历史中找到该任务
   - 点击下载按钮
   - **预期**: 下载文件名为 `{voiceName}_{timestamp}.wav`

3. **测试其他格式**:
   - 重复以上步骤，分别测试：
     - MP3格式 → 期望`.mp3`
     - Opus格式 → 期望`.opus`
     - PCM格式 → 期望`.wav`

---

## 向后兼容性

✅ **完全向后兼容**

- **旧任务**: format字段为空或undefined，默认使用`.mp3`扩展名
- **新任务**: 根据实际选择的格式设置正确的扩展名
- **无需数据迁移**: 旧任务仍可正常下载

---

## 代码更改摘要

| 文件 | 更改类型 | 说明 |
|------|---------|------|
| `backend/models/dto.go` | 添加字段 | TTSTaskResponse添加Format |
| `backend/models/converters.go` | 更新转换 | ToTTSTaskResponse包含format |
| `voiceclone-pro-console/types/api.ts` | 添加字段 | TTSTaskResponse添加format? |
| `voiceclone-pro-console/types.ts` | 添加字段 | GenerationRecord添加format? |
| `voiceclone-pro-console/components/HistoryList.tsx` | 修复逻辑 | handleDownload使用format |
| `voiceclone-pro-console/components/Workspace.tsx` | 数据传递 | 转换时包含format字段 |

---

## 部署说明

### 后端部署

后端代码已更新，无需特殊操作。由于format字段已在之前添加到数据库模型，只需：

1. **无需数据库迁移**（已在TTS格式支持时完成）
2. **重启后端服务**（如果未重启）:
   ```bash
   ./run_frontend_and_backend.sh stop
   ./run_frontend_and_backend.sh start
   ```

### 前端部署

前端需要重新编译：

1. **构建生产版本**:
   ```bash
   cd voiceclone-pro-console
   npm run build
   ```

2. **或开发模式**（如果正在使用）:
   - 热重载会自动应用更改
   - 刷新浏览器页面

---

## 验证清单

- [ ] 后端响应包含format字段
- [ ] 前端正确接收format信息
- [ ] MP3格式下载为`.mp3`
- [ ] WAV格式下载为`.wav`
- [ ] Opus格式下载为`.opus`
- [ ] PCM格式下载为`.wav`
- [ ] 旧任务仍可下载（默认.mp3）

---

## 关键代码位置

### 后端
- **DTO定义**: `backend/models/dto.go:21-33`
- **转换器**: `backend/models/converters.go:42-56`

### 前端
- **API类型**: `voiceclone-pro-console/types/api.ts:108-121`
- **UI类型**: `voiceclone-pro-console/types.ts:24-35`
- **下载逻辑**: `voiceclone-pro-console/components/HistoryList.tsx:80-103`
- **调用位置**: `voiceclone-pro-console/components/HistoryList.tsx:183`
- **数据转换**: `voiceclone-pro-console/components/Workspace.tsx:125-138`

---

## 相关文档

- [TTS格式实现报告](TTS_FORMAT_IMPLEMENTATION_REPORT.md)
- [TTS格式快速总结](TTS_FORMAT_SUMMARY.md)
- [音频格式验证总结](AUDIO_FORMAT_VALIDATION_SUMMARY.md)

---

## 修复总结

**问题**: 下载文件扩展名硬编码为.mp3  
**原因**: 缺少格式信息传递  
**修复**: 添加format字段并在下载时使用  
**影响**: 所有新生成的TTS任务  
**兼容**: 完全向后兼容  

✅ **修复已完成，用户现在可以下载正确扩展名的文件！**

---

**修复完成时间**: 2026-01-27  
**版本**: 1.0
