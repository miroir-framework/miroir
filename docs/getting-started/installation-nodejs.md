
### Configuration

edit the `miroirConfig.server.json` file, setting the `filesystemDeploymentRootDirectory` pointing to the directory where the `admin` and `miroir` applications deployments can be found, which is also the location where user-level application deployments will be stored.

Finally, the server must be running in production mode, with `NODE_ENV=production`


## Starting the server Manually

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
