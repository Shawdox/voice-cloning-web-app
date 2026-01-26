我现在正在实现一个AI语音克隆提供网站，其中:
- `voiceclone-pro-console`是前端代码库，负责用户界面和交互。
- `backend`是后端代码库，处理API请求和数据管理。
- `tests`包含当前的自动化测试脚本和当前测试状态。
- `run_frontend_and_backend.sh`是一个脚本，你可以使用`run_frontend_and_backend.sh start`来启动前端和后端服务。使用`run_frontend_and_backend.sh stop`来停止它们。
你需要忽略`.gitignore`文件中列出的文件和目录。你需要选择合适的skills和工具来实现这个测试。

完成下面的任务:
<task>
1. 参考fish audio doc(`https://docs.fish.audio/api-reference/`)中`emotion-reference`的格式(`https://docs.fish.audio/api-reference/emotion-reference`)，确保前端发送的请求体格式正确。前端的用户是中文用户，因此你需要将前端发送的文本中的对应标志转换为doc中对应的英文标签后再发送给后端。例如, 将`(愤怒)`转换为`(Angry)`。
2. 使用E2E测试这个功能，你可以使用`xiaowu.417@qq.com`,密码`1234qwer`来进行测试。确保发送的格式是正确的。
</task>

# 同时，`repomix-output.xml`是对当前代码库的总结，你需要尽可能优先参考它来理解代码库的结构和内容，而不是直接读取代码文件（除非你觉得非常有必要）

1. 当前创建音色列表的"<div class="min-w-0 flex-1"><div class="flex items-center gap-2 mb-0.5"><p class="text-sm font-black truncate text-[#1c0d14]">季冠霖语音包</p></div><div class="flex items-center justify-between"><p class="text-[10px] font-bold text-gray-400">Invalid Date 创建</p></div></div>"显示的是"Invalid Date 创建"，说明前端没有正确获取到音色创建的时间戳。你需要检查前端代码中获取音色列表的API调用，确保它正确处理了后端返回的数据格式，并正确解析和显示创建时间。
2. 用户创建的音色可以在声音库中正确体现。
3. 用户可以选择自己创建的音色，输入文本/上传文本文件，然后生成语音。我需要你确认从前端的发送到后端调用fish-audio TTS API进行语音合成的功能是正常的，并且前端界面能正确显示生成状态和下载链接。
