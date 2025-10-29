#!/bin/bash

# Get admin token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/trpc/admin.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"username":"admin-global","password":"106307qw"}}' | jq -r '.result.data.json.token')

echo "Token: $TOKEN"

# List all pathways
echo -e "\n=== Current Pathways ==="
curl -s -X GET "http://localhost:3000/api/trpc/pathways.list" \
  -H "Authorization: Bearer $TOKEN" | jq '.result.data.json'

# Try to delete a pathway (we'll use pathway ID from the list)
echo -e "\n=== Attempting to delete pathway ===" 
# We'll need to see the pathways first to choose one to delete

