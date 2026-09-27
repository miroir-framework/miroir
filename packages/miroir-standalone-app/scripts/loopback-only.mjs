/**
 * Preloaded (`node --import`) into the server the coverage tour starts with authentication off
 * (#326): every TCP listener of the process binds to 127.0.0.1 instead of all interfaces, so that
 * server cannot be reached from another host. Unix sockets and inherited handles are left alone.
 *
 * The server has no host option; the listen calls it makes are `listen(port, callback)`.
 */
import net from "node:net";

const LOOPBACK = "127.0.0.1";
const listen = net.Server.prototype.listen;

net.Server.prototype.listen = function (...args) {
  const [first] = args;
  const callback = typeof args.at(-1) === "function" ? [args.at(-1)] : [];
  // listen([port[, host[, backlog]]][, callback]); a numeric string is a port, as in node:net.
  if (first == null || typeof first === "function" || typeof first === "number" || (typeof first === "string" && Number(first) >= 0)) {
    const port = typeof first === "function" ? 0 : Number(first ?? 0);
    const backlog = args.slice(1).find((arg) => typeof arg === "number");
    return listen.call(this, { port, host: LOOPBACK, backlog }, ...callback);
  }
  // listen(options[, callback]) on a TCP port, as opposed to a path or a handle.
  if (typeof first === "object" && first.path === undefined && first.fd === undefined && first._handle === undefined && first.handle === undefined) {
    return listen.call(this, { ...first, host: LOOPBACK }, ...callback);
  }
  return listen.apply(this, args);
};
