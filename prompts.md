我现在正在实现一个AI语音克隆提供网站，其中:
- `voiceclone-pro-console`是前端代码库，负责用户界面和交互。
- `backend`是后端代码库，处理API请求和数据管理。
- `tests`包含当前的自动化测试脚本。
- `run_frontend_and_backend.sh`是一个脚本，用于同时启动前端和后端服务。
你需要忽略`.gitignore`文件中列出的文件和目录。
测试从前端是否可以成功获取音色创建最新状态，并更新对应音色块? 尝试上传`/home/xiaowu/voice_web_app/data/audio/1229.MP3`来测试整个语音克隆流程，看看前端的界面是否能实时反应语音克隆的状态。首先我确定从文件上传到OSS，到后端下载文件，调用fish-audio API进行音色克隆的功能是正常的，但是前端的界面没有正确更新音色创建的状态。
你需要选择合适的skills和工具来实现这个测试。

# 同时，`repomix-output.xml`是对当前代码库的总结，你需要尽可能优先参考它来理解代码库的结构和内容，而不是直接读取代码文件（除非你觉得非常有必要）。

1. 当前创建音色列表的"<div class="min-w-0 flex-1"><div class="flex items-center gap-2 mb-0.5"><p class="text-sm font-black truncate text-[#1c0d14]">季冠霖语音包</p></div><div class="flex items-center justify-between"><p class="text-[10px] font-bold text-gray-400">Invalid Date 创建</p></div></div>"显示的是"Invalid Date 创建"，说明前端没有正确获取到音色创建的时间戳。你需要检查前端代码中获取音色列表的API调用，确保它正确处理了后端返回的数据格式，并正确解析和显示创建时间。
2. 用户创建的音色可以在声音库中正确体现。
3. 用户可以选择自己创建的音色，输入文本/上传文本文件，然后生成语音。我需要你确认从前端的发送到后端调用fish-audio TTS API进行语音合成的功能是正常的，并且前端界面能正确显示生成状态和下载链接。

你可以使用`run_frontend_and_backend.sh start`来启动前端和后端服务。
使用`run_frontend_and_backend.sh stop`来停止它们。
