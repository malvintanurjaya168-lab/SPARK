# Pilih base image Node.js yang ringan
FROM node:20-alpine

# Tentukan folder kerja di dalam container
WORKDIR /app

# Salin file konfigurasi dependensi terlebih dahulu
COPY package*.json ./

# Install semua dependensi
RUN npm install

# Salin seluruh sisa file proyek ke dalam container
COPY . .

# Beri tahu Docker bahwa aplikasi berjalan di port 3000
EXPOSE 3000

# Perintah untuk memulai aplikasi
CMD ["npm", "run", "dev"]