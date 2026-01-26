#!/bin/bash
# Test script for audio upload format validation
# Tests MP3 and WAV format support in frontend and backend

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Audio Upload Format Testing${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo -e "${RED}Error: Virtual environment not found${NC}"
    echo "Please create a virtual environment first:"
    echo "  python3 -m venv .venv"
    exit 1
fi

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source ../.venv/bin/activate

# Install/update test dependencies
echo -e "${GREEN}Installing test dependencies...${NC}"
pip install -q -r requirements.txt

# Check if backend is running
echo -e "${GREEN}Checking if backend is running...${NC}"
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Backend does not appear to be running${NC}"
    echo "Please start the backend with: ./run_frontend_and_backend.sh start"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run the tests
echo -e "${GREEN}Running audio upload format tests...${NC}"
echo ""

pytest test_audio_upload_formats.py -v -s \
    --tb=short \
    --color=yes \
    --html=reports/audio_format_test_report.html \
    --self-contained-html

TEST_EXIT_CODE=$?

echo ""
echo -e "${YELLOW}========================================${NC}"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
else
    echo -e "${RED}Some tests failed${NC}"
fi
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "Test report saved to: ${GREEN}reports/audio_format_test_report.html${NC}"

exit $TEST_EXIT_CODE
