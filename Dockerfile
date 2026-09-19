FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Empty by default (falsy in authConfig.js's `|| DEFAULT_CLIENT_ID`), so PR
# preview builds keep using the non-prod client ID unless overridden.
ARG VITE_MSAL_CLIENT_ID=""
ENV VITE_MSAL_CLIENT_ID=$VITE_MSAL_CLIENT_ID
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
