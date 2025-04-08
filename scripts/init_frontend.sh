#!/bin/bash

echo "📦 Creating frontend app with Vite + React + TypeScript..."

cd frontend || mkdir frontend && cd frontend

# Initialize Vite project
npm create vite@latest . -- --template react-ts

echo "📁 Installing Tailwind CSS and dependencies..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Tailwind base config
cat <<EOF > tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Tailwind base styles
cat <<EOF > src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "✅ Frontend setup complete!"
echo "To start dev server:"
echo "   cd frontend && npm install && npm run dev"
