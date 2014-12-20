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

WORKDIR /work

## Dependencies
RUN apt-get -qy install python-cheetah wget git autoconf automake build-essential libass-dev libfreetype6-dev
RUN	apt-get -qy install libgpac-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev
RUN	apt-get -qy install libx11-dev libxext-dev libxfixes-dev pkg-config texi2html zlib1g-dev yasm libx264-dev
Run apt-get -qy install libmp3lame-dev libopus-dev unzip

# Install FFMPEG
## Dep. libfdk-aac
RUN	git clone git://github.com/mstorsjo/fdk-aac.git fdk-aac

WORKDIR /work/fdk-aac
RUN autoreconf -fiv
RUN	./configure --prefix="$HOME/ffmpeg_build" --disable-shared
RUN	make
RUN	make install
RUN	make distclean

## FFMPEG Source
WORKDIR /work
RUN git clone https://github.com/FFmpeg/FFmpeg ffmpeg-source

WORKDIR /work/ffmpeg-source
RUN PATH="$PATH:$HOME/bin" PKG_CONFIG_PATH="$HOME/ffmpeg_build/lib/pkgconfig" ./configure \
	  --prefix="$HOME/ffmpeg_build" \
	  --extra-cflags="-I$HOME/ffmpeg_build/include" \
	  --extra-ldflags="-L$HOME/ffmpeg_build/lib" \
	  --bindir="$HOME/bin" \
	  --enable-gpl \
	  --enable-libass \
	  --enable-libfdk-aac \
	  --enable-libfreetype \
	  --enable-libmp3lame \
	  --enable-libopus \
	  --enable-libtheora \
	  --enable-libvorbis \
	  --enable-libx264 \
	  --enable-nonfree
RUN PATH="$PATH:$HOME/bin" make
RUN	make install
RUN	make distclean
RUN	hash -r
env PATH $HOME/bin:$PATH


VOLUME ['/config', '/data']

# App Logic
COPY . $HOME/app
WORKDIR /home/app

# Remove any modules
EXPOSE 3000
CMD ["npm", "start"]