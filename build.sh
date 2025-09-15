#!/bin/bash

# Build script for Gong MCP Server

echo "Building Gong MCP Server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Make executable
echo "Making executable..."
chmod +x dist/*.js

echo "Build complete! Server is ready in dist/ directory."
echo ""
echo "To use with Claude Desktop:"
echo "1. Set your Gong API credentials in environment variables"
echo "2. Add the server to your claude_desktop_config.json"
echo "3. Restart Claude Desktop"
