// In-memory test wrapping key. This module is never part of the production build.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { ContentKeyContext, ContentKeyProvider } from "../src/private-content.js";

export class TestContentKeys implements ContentKeyProvider {
  fail = false;
  generated = 0;
  unwrapped = 0;
  constructor(readonly root = randomBytes(32)) {}
  async check() { if(this.fail)throw Error("Test key service unavailable"); }
  async generate(context:ContentKeyContext) {
    if(this.fail)throw Error("Test key service unavailable");
    this.generated++;
    const plaintext=randomBytes(32),nonce=randomBytes(12);
    const cipher=createCipheriv("aes-256-gcm",this.root,nonce);
    cipher.setAAD(Buffer.from(JSON.stringify(context)));
    const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final()]);
    return {plaintext,wrapped:Buffer.concat([nonce,cipher.getAuthTag(),encrypted]),wrappingKeyRef:"test-only-wrapping-key"};
  }
  async unwrap(wrapped:Buffer,ref:string,context:ContentKeyContext) {
    if(this.fail || ref!=="test-only-wrapping-key")throw Error("Test key service unavailable");
    this.unwrapped++;
    const decipher=createDecipheriv("aes-256-gcm",this.root,wrapped.subarray(0,12));
    decipher.setAAD(Buffer.from(JSON.stringify({namespace:context.namespace,owner:context.owner,id:context.id})));
    decipher.setAuthTag(wrapped.subarray(12,28));
    return Buffer.concat([decipher.update(wrapped.subarray(28)),decipher.final()]);
  }
}
