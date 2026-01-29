#!/bin/bash

echo "======================================"
echo "  VoiceClone Pro E2E测试套件"
echo "======================================"
echo ""

# 确保服务正在运行
echo "检查服务状态..."
./run_frontend_and_backend.sh status

if [ $? -ne 0 ]; then
    echo "启动服务..."
    ./run_frontend_and_backend.sh start
    sleep 5
fi

echo ""
echo "======================================"
echo "  运行E2E测试 (Tests 1-5)"
echo "======================================"
echo ""

# 运行主测试套件（包括Test 1-5）
# 注意：完整测试需要约5-10分钟
python3 tests/run_e2e_tests.py

TEST_EXIT_CODE=$?

echo ""
echo "======================================"
echo "  清理测试数据"
echo "======================================"
echo ""

# 使用API清理（更快更可靠）
python3 tests/cleanup_via_api.py

CLEANUP_EXIT_CODE=$?

echo ""
echo "======================================"
echo "  测试总结"
echo "======================================"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 所有测试通过"
else
    echo "❌ 部分测试失败"
fi

if [ $CLEANUP_EXIT_CODE -eq 0 ]; then
    echo "✅ 清理完成"
else
    echo "⚠️  清理可能不完整"
fi

echo ""
echo "测试日志: tests/final_test_results.log"
echo "清理完成后，所有测试产生的文件、音色和音频已被删除"
echo ""

exit $TEST_EXIT_CODE
