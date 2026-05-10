# the Miroir docker Installation Process

The Miroir docker image facilitates deployment using Docker.

Running the image within a container exposes a browser-accessible HTTPS port (webapp).

## Prerequisites

have Docker >= 20 installed on the local host. See [https://docs.docker.com/get-started/](https://docs.docker.com/get-started/)

## Install Miroir On Docker

unzip the [release](https://github.com/miroir-framework/miroir/releases) file (for example `miroir-server-nodejs-linux-0.5.0-rc.1.zip`) in a dedicated directory.

### Server Interface / Entry Points

**Starting Miroir requires providing 2 input directories:**

- a deployment directory, and
- a certificate directory.

**The deployment directory** must contain 2 filesystem deployments when the server is started:

- a deployment for the `admin` application, that contains information about all the deployments that are available to the starting process,
- a deployment for the `miroir` application, that describes the "shape" of any Miroir application.

A deployment is a sub-directory, that contains sub-directories with JSON files in them.

**The certificates directory** is needed to enable using `https` instead of insecure `http`. .

Finally, the server must be running in production mode, with `NODE_ENV=production`

### Generating self-signed certificates

If you do not have certificates already, use the script to create them, using the command line:

- install mkcert
  - Linux:    sudo apt install mkcert   OR   brew install mkcert
  - macOS:    brew install mkcert
  - Windows:  choco install mkcert      OR   https://github.com/FiloSottile/mkcert/releases
- run from the unzippe file directory:
  - `scripts/setup-https.sh` (Linux, shell) or
  - `scripts/setup-https.ps1` (Windows Powershell)

The resulting directory must contain the following files:

- `localhost-key.pem`
- `localhost.pem`
- `rootCA.pem`

<!-- ### Optional Configuration

edit the `miroirConfig.server.json` file, setting the `filesystemDeploymentRootDirectory` pointing to the directory where the `admin` and `miroir` applications deployments can be found, which is also the location where user-level application deployments will be stored. -->


### starting the server with the provided script



### Starting the server Manually

For manual startup, the directory where the certificates are must be passed to the server in an env variable named `NODE_EXTRA_CA_CERTS`.

For manual startup, the directory where the certificates are must be passed to the server in an env variable named `NODE_EXTRA_CA_CERTS`.
Certificate paths are resolved from environment variables
// (MIROIR_TLS_CERT / MIROIR_TLS_KEY) or default to <repo-root>/certs/ relative to this file.

`cd` to the unzip directory and run, in the (dos / poweshell) command line:

```dos
set NODE_ENV=production
node release/index.js
```

alternatively, in a (e.g. cygwin) shell:

```sh
NODE_ENV=production node release/index.js
```
