# ============================================================
#  Stage 1 – Build Angular Frontend
# ============================================================
FROM node:22-alpine AS client-build
WORKDIR /client

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . ./
RUN npm run build -- --configuration production

# ============================================================
#  Stage 2 – Serve with Nginx
# ============================================================
FROM nginx:alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Angular build output
COPY --from=client-build /client/dist/client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
