import { aws_ec2 as ec2 } from 'aws-cdk-lib';

/** Apple-signed OCSP replies are checked by the official verifier before trust. */
export function allowAppleCertificateStatusChecks(network: ec2.SecurityGroup): void {
  network.addEgressRule(ec2.Peer.ipv4('17.0.0.0/8'), ec2.Port.tcp(80),
    'Apple certificate OCSP only; signature and online revocation checks remain required');
}
