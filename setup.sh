#!/bin/bash

# AEGIS Automated Setup Script

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}🛡️  AEGIS - Agentic Immune System Setup${NC}"
echo -e "${BLUE}==============================================${NC}\n"

# 1. Check for Ollama
echo -e "${YELLOW}[1/5] Checking Ollama installation...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama could not be found. Installing Ollama...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh
    echo -e "${GREEN}Ollama installed successfully!${NC}"
else
    echo -e "${GREEN}Ollama is already installed!${NC}"
fi

# Ensure ollama server is running in the background before pulling models
echo -e "${YELLOW}Starting Ollama server...${NC}"
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!
sleep 3

# 2. Pull local models
echo -e "\n${YELLOW}[2/5] Pulling required AI models (this might take a while)...${NC}"
echo -e "Pulling phi3:mini..."
ollama pull phi3:mini
echo -e "Pulling mistral:7b..."
ollama pull mistral:7b
echo -e "Pulling llama3.1:8b..."
ollama pull llama3.1:8b
echo -e "${GREEN}All models pulled successfully!${NC}"

# Stop the background Ollama server (we will run it properly later if needed, or assume the user has it running)
# Actually, let's keep it running for the backend, or kill it and let the user manage it. We'll leave it running for ease.

# 3. Install Backend Dependencies
echo -e "\n${YELLOW}[3/5] Installing Backend dependencies...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo -e "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env 2>/dev/null || :
cd ..
echo -e "${GREEN}Backend dependencies installed!${NC}"

# 4. Install Frontend & Mobile Dependencies
echo -e "\n${YELLOW}[4/5] Installing Frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}Frontend dependencies installed!${NC}"

echo -e "\n${YELLOW}Installing Mobile dependencies...${NC}"
if [ -d "mobile" ]; then
    cd mobile
    npm install
    cd ..
    echo -e "${GREEN}Mobile dependencies installed!${NC}"
else
    echo -e "${RED}Mobile directory not found. Skipping.${NC}"
fi

# 5. Start servers
echo -e "\n${YELLOW}[5/5] Booting up Aegis System...${NC}"

# Start Backend
echo -e "Starting FastAPI Backend on port 8001..."
cd backend
source venv/bin/activate
# Run uvicorn in the background
nohup uvicorn main:app --reload --port 8001 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo -e "Starting Vite Frontend on port 5173..."
cd frontend
# Run vite in the background
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${BLUE}==============================================${NC}"
echo -e "${GREEN}✅ Aegis is running!${NC}"
echo -e "   Frontend Web:  ${YELLOW}http://localhost:5173${NC}"
echo -e "   Backend API:   ${YELLOW}http://localhost:8001${NC}"
echo -e "${BLUE}==============================================${NC}\n"

echo -e "To stop the servers later, you can run:"
echo -e "kill $BACKEND_PID $FRONTEND_PID"

# Wait to keep the script running if needed, or just exit.
# Exiting keeps the background processes running.
exit 0
