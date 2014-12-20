FROM ubuntu
MAINTAINER Mike Balmer <mike@trecto.com>

ENV HOME /home
ENV NODE_VERSION 0.10

RUN mkdir -p $HOME

RUN apt-get update -yq
RUN apt-get install -yq python-software-properties curl man build-essential libssl-dev wget git

# Install NVM
RUN curl --location https://raw.github.com/creationix/nvm/master/install.sh | sh
RUN echo "[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh" >> /etc/profile.d/npm.sh
RUN echo "[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh" >> $HOME/.bashrc

ENV PATH $HOME/.nvm/bin:$PATH

# Install Node
RUN /bin/bash -l -c "nvm install $NODE_VERSION && nvm use $NODE_VERSION && rm -rf $HOME/.nvm/bin && ln -s \$NVM_BIN $HOME/.nvm/bin"

# App Logic
COPY . $HOME/app
WORKDIR /home/app

# Remove any modules
EXPOSE 3000
CMD ["npm", "start"]