import "dotenv/config";
import { pipe } from "it-pipe";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { privateLibp2pNode } from "./lib/libp2p-node.mjs";
import { input, log } from "./lib/stdlib.mjs";
import { peerIdFromString } from "@libp2p/peer-id";
import { Multiaddr } from "@multiformats/multiaddr";
import { unmarshalPrivateKey } from "@libp2p/crypto/keys";
import { createFromPrivKey } from "@libp2p/peer-id-factory";

const swarmKey = Buffer.from(process.env.SWARM_KEY, "base64");
const privateKey = await unmarshalPrivateKey(
  Buffer.from(process.env.PRIVATE_KEY, "base64")
);

const node = await privateLibp2pNode(
  await createFromPrivKey(privateKey),
  process.env.PORT,
  swarmKey
);
await node.start().then(() => {
  log(`Node started -> ${node.peerId.toString()}`);
  log("Addresses:");
  node.getMultiaddrs().map((addr) => log(addr.toString()));
});

node.connectionManager.addEventListener("peer:connect", (event) => {
  log("peer:connect", event);
});
node.connectionManager.addEventListener("peer:disconnect", (event) => {
  log("peer:disconnect", event);
});

node.handle("/private/chat", ({ stream, connection }) => {
  pipe(stream, async function (source) {
    for await (const msg of source) {
      log(`${connection.remotePeer.toCID()}: ${uint8ArrayToString(msg)}`);
    }
  });
});

if ((await input("Would you like to connect to someone? (y/n) ")) === "y") {
  const peerId = peerIdFromString(await input("Enter peer id: "));
  const multiaddr = new Multiaddr(await input("Enter multiaddr: "));

  await node.peerStore.addressBook.set(peerId, [multiaddr]);
  const connection = await node.dial(peerId);
  log(`Connected to ${connection.remotePeer.toString()}`);

  const stream = await node.dialProtocol(peerId, "/private");

  await pipe(
    [uint8ArrayFromString("This message is sent on a private network")],
    stream
  );
}
