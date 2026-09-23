# Blockchain Decision

Role: canonical Web3/blockchain architecture decision  
Authority scope: what may or may not be stored or executed on a blockchain  
Superseded by: later Owner-approved decision after necessity, DPIA, legal and cryptographic review  
Do not use for: legal advice or claiming that a future proof has legal effect  
Status: NO BLOCKCHAIN IN CORE MVP — LOCKED  
Last updated: 2026-08-04

## Decision

The core MVP will not use Web3 or blockchain. Plans, matters, contacts, intent, invitation state, claims, documents, encrypted payloads, identifiers, account hints, hashes tied to a user and cryptographic keys all remain off-chain in a mutable system that supports correction, revocation, deletion, retention and regional control.

This is not an anti-blockchain position. It is a necessity decision: the product's hardest problems are identity, lawful authority, false claims, recovery, privacy, deletion and long-term service continuity. A blockchain does not determine whether a person has died, whether a claimant is legally authorised or what a third-party platform will accept.

## Why Core On-chain Storage Fails This Product

| Need | Public-chain effect | Product consequence |
| --- | --- | --- |
| Confidentiality | public chains are readable and transaction metadata persists | contact and matter relationships can leak even when payloads are encrypted |
| Correction/deletion | records are designed to be tamper-evident and difficult to remove | conflicts with correction, erasure, retention and a planner changing their mind |
| Recovery | wallet/key loss is a separate catastrophic failure | pushes the hardest recovery problem onto a less familiar user flow |
| Death/authority verification | requires an off-chain person, document or oracle | blockchain cannot replace courts, executors, providers or manual review |
| Appeals and cooling-off | smart-contract execution favours deterministic finality | unsafe for disputed, reversible and jurisdiction-specific life events |
| Global privacy | nodes and metadata may cross many regions | increases controller, transfer and data-residency complexity |
| Maintenance | deployed contracts and data are harder to change | slows security fixes and policy/version updates |
| User value | most users need a clear map and trusted workflow | wallet setup, gas and signing add friction before they add validated value |

The EDPB's final 2026 guidelines say controllers should first justify why blockchain is necessary, generally advise against putting personal data in transactions, and note that hashes can themselves remain personal data. They recommend other tools when strong blockchain integrity is not needed and data-subject rights would be difficult to satisfy. NIST likewise highlights the privacy conflict caused by data that cannot be deleted. Ethereum's own documentation states that there are no secrets directly on-chain and that confidential designs still rely on an off-chain key component.

## Explicitly Prohibited For MVP

- no plan, will text, contact or recipient data on-chain;
- no encrypted document or ciphertext on-chain;
- no per-user document hash, wallet address or stable pseudonymous identifier on-chain;
- no token/NFT representing a plan, will, inheritance or beneficiary right;
- no smart contract that decides death, incapacity, absence, entitlement or release;
- no custody of seed phrases or private keys;
- no wallet requirement for planners, contacts, executors or recipients;
- no marketing claim that blockchain makes an instruction legally valid.

## Allowed Future Research Boundary

A future enterprise customer may ask for external proof that a signed export existed at a point in time. The first solution should still be a conventional signed transparency log or Merkle tree with independent backups.

Only if that fails a documented requirement may the project evaluate anchoring one batched, perfectly hiding and non-linkable commitment. The batch must not reveal a user, tenant, event time, document digest or relationship. Before implementation it requires:

1. a written necessity and alternatives analysis;
2. a DPIA and target-jurisdiction legal review;
3. cryptographic design and independent review;
4. proof that deletion of off-chain material prevents reasonable re-identification;
5. key compromise, algorithm migration, chain failure and vendor-exit plans;
6. no dependency of claim, appeal, recovery or release on chain availability.

This possible proof layer is `PROVISIONAL` research only. It is not part of the current architecture or roadmap commitment.

## Primary Sources

- [EDPB final Guidelines 02/2025 on blockchain and personal data](https://www.edpb.europa.eu/documents/guideline/guidelines-on-processing-of-personal-data-through-blockchain-technologies_en)
- [NIST privacy-enhancing distributed ledger research](https://csrc.nist.gov/projects/privacy-enhancing-lw-distributed-ledger-technology)
- [NISTIR 8202 Blockchain Technology Overview](https://www.nist.gov/publications/blockchain-technology-overview)
- [Ethereum blockchain data storage strategies](https://ethereum.org/developers/docs/data-availability/blockchain-data-storage-strategies/)
- [Ethereum technical introduction to dapps](https://ethereum.org/developers/docs/dapps/)
