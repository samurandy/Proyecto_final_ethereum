import { networkInterfaces } from "os";

export function getLocalIPAddress(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  throw new Error("Unable to determine local IP address");
}

const localIP = getLocalIPAddress();
console.log(`Local IP Address: ${localIP}`);
