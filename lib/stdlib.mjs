import readline from "readline";
import { DateTime } from "luxon";
import { generateKeyPair, marshalPrivateKey } from "@libp2p/crypto/keys";

function print(...a) {
  if (Array.isArray(a)) {
    console.log(a.join(""));
  } else {
    console.log(a);
  }
}

function input(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question || "", (name) => {
      rl.close();
      resolve(name);
    });
  });
}

function log(data) {
  console.log(`[${DateTime.now().toISOTime()}] ${data}`);
}

async function generatePrivateKey() {
  const privateKey = await generateKeyPair("ed25519");

  return Buffer.from(marshalPrivateKey(privateKey, "ed25519")).toString(
    "base64"
  );
}

export { print, input, log, generatePrivateKey };
