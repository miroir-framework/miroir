# the Miroir main server implementation

Makes the webapp available to the browser as static artefacts.

Answers both HTTP (webapp) and REST queries.

Setting up with Docker is easier since we provide the full setup and less things can go wrong, once Docker is installed (which can be non-trivial).

## Prerequisites

have nodejs >= 20 installed on the local host.

## Install

unzip the file in a dedicated directory. We will refer to this directory as `$MIROIR_DIR` (or `%MIROIR_DIR` on Windows).

### Server Interface / Entry Points

**Starting Miroir requires providing 2 input directories:**

- a deployment directory, and
- a certificate directory.

**The deployment directory** must contain 2 filesystem deployments when the server is started:

- a deployment for the `admin` application, that contains information about all the deployments that are available to the starting process,
- a deployment for the `miroir` application, that describes the "shape" of any Miroir application.

A deployment is a sub-directory, that contains sub-directories with JSON files in them.

**The certificates directory** is needed to enable using `https` instead of insecure `http`. .

### Generating self-signed certificates

We describe here the creation of self-signed certificates, using your localhost Certification Authority (root CA).

First, **install mkcert**:
  - **Linux**:    `sudo apt install mkcert`   OR   `brew install mkcert`
  - **macOS**:    `brew install mkcert`
  - **Windows**:  `choco install mkcert`      OR   [https://github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases)

Then, **use the provided script to create them**, that can be found in the directory where you unzipped the file:

- `scripts/setup-https.sh` for shell (Linux, Cygwin, git bash...) or
- `scripts/setup-https.ps1` (Windows Powershell)

The resulting directory must contain the following files:

- `localhost-key.pem`
- `localhost.pem`
- `rootCA.pem`

### starting with the docker compose

```sh
docker compose ${MIROIR_DIR}
```




