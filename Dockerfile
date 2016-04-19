FROM ubuntu:14.04
MAINTAINER Gravebot

# Setup system deps
RUN apt-get update
RUN apt-get -y install build-essential curl rsync tar python python-pip git libfontconfig1

# Setup Node
ENV NODE_VERSION 4.4.2
ENV NPM_VERSION 3.8.5

RUN git clone https://github.com/creationix/nvm.git /.nvm
RUN echo "source /.nvm/nvm.sh" >> /etc/bash.bashrc
RUN /bin/bash -c 'source /.nvm/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION && nvm alias default $NODE_VERSION && ln -s /.nvm/versions/node/v$NODE_VERSION/bin/node /usr/local/bin/node && ln -s /.nvm/versions/node/v$NODE_VERSION/bin/npm /usr/local/bin/npm'
RUN npm install -g npm@$NPM_VERSION

# Setup dockerize
RUN pip install dockerize

# Copy package.json
COPY ./package.json /app/
WORKDIR /app/

# Install node deps
RUN npm install --production

# Copy script
COPY ./index.js /app/


CMD ["npm", "run", "create"]
