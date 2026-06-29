#!/bin/bash
# RAPTOR Unified Build Script

echo "======================================"
echo "    RAPTOR Unified Build Pipeline     "
echo "======================================"

# 1. Build the React Frontend
echo "--> Building React Frontend..."
cd frontend || exit 1
npm install
npm run build
cd ..

# 2. Prepare the Backend
echo "--> Preparing Backend..."
cd backend || exit 1

# Remove old dist if exists
rm -rf dist

# Copy the built React app into the backend folder
cp -r ../frontend/dist ./dist
echo "--> Successfully copied frontend build to backend/dist"

# 3. Train the model if not trained (optional, but good for deployment)
if [ ! -f "data/raptor_model.joblib" ]; then
    echo "--> Initializing ML Model..."
    python -m app.ml.train
fi

echo "======================================"
echo "   Build Complete! Ready to Deploy.   "
echo "======================================"
