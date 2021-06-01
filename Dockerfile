FROM node:15-alpine

WORKDIR /dashboard
COPY package.json /app/
RUN npm install --only=prod
COPY app.js /dashboard/
COPY app /dashboard/app/

ENV DB_SERVER localhost
ENV DB_DATABASE SIPS
ENV DB_USER user
ENV DB_PASSWORD pwd

EXPOSE 3000
CMD ["node", "app.js"]

