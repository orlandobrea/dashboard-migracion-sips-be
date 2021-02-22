FROM node:15-alpine

WORKDIR /app
COPY package.json /app/
RUN npm install --only=prod
COPY app.js /app/

ENV DB_SERVER localhost
ENV DB_DATABASE SIPS
ENV DB_USER user
ENV DB_PASSWORD pwd

EXPOSE 3000
CMD ["node", "app.js"]

