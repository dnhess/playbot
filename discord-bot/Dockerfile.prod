# Docker file to run code from ./discord-bot
# This code is in node.js and ran with yarn

FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the code
RUN npm run build

# Deploy Commands
RUN npm run deploy-commands

# Run the bot

CMD [ "node", "build/index.js" ]