import type { EmailIdentity, EmailIdentityVerifying } from '../src/email-verification.js';

/** Explicit synthetic provider inventory; no persisted global email proof. */
export class EmailIdentityFixture implements EmailIdentityVerifying {
  private profiles = new Map<string,string>();
  register(issuer:string,subject:string,email:string|null):void {
    const key=JSON.stringify([issuer,subject]);
    if(email===null)this.profiles.delete(key);else this.profiles.set(key,email);
  }
  async verifiedEmail(identity:EmailIdentity):Promise<string|null>{
    return this.profiles.get(JSON.stringify([identity.issuer,identity.subject]))??null;
  }
}
