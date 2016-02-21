# Phantomized

An automated build to tar up dynamic ELFs required by PhantomJS using Dockerized. This makes dockerizing PhantomJS with base images like Alpine Linux easy.

This build does not include the phantomjs binary itself so make it easier for application that install PhantomJS through other sources like [npm](https://github.com/Medium/phantomjs). This is based off the work of [docker-phantomjs2](https://github.com/fgrehm/docker-phantomjs2).

Everything can be found in releases.

## How To

Adding this line to your Dockerfile applies all files to your docker image. You can find a production example [here](https://github.com/Gravebot/Gravebot/blob/master/Dockerfile).

```bash
curl -Ls "https://github.com/dustinblackman/phantomized/releases/download/2.1.1/dockerized-phantomjs.tar.gz" | tar xz -C /
```
