FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Hanya sertakan variabel public yang dibutuhkan client
ENV NEXT_PUBLIC_SUPABASE_URL="https://lgirsfcgaasawsmruqrm.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_88z9G3AdSiRhXJuiFUKAow_8vnw4GyD"

EXPOSE 3000

CMD ["npm", "run", "dev"]