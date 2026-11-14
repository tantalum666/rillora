import { CfnParameter, CfnRule, Fn, Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/** The API gets only a one-way verifier; the raw origin proof stays at CloudFront. */
export function userSessionEnvironment(scope: Construct, identityServicesEnabled: boolean): Record<string, string> {
  scope = Stack.of(scope);
  const verifier = new CfnParameter(scope, 'SessionEdgeProofSha256', {
    type: 'String', default: '', allowedPattern: '^$|^[a-f0-9]{64}$',
    description: 'SHA256 of this environment CloudFront origin proof; never the proof itself',
  });
  const enabled = new CfnParameter(scope, 'TrustedUserSessionsEnabled', {
    type: 'String', default: 'false', allowedValues: ['false', 'true'],
    description: 'Enable new 30-day/7-day-idle user sessions only after migration110 and context-aware API rollout',
  });
  new CfnRule(scope, 'TrustedSessionPrerequisites', {
    ruleCondition: Fn.conditionEquals(enabled.valueAsString, 'true'),
    assertions: [{ assert: Fn.conditionNot(Fn.conditionEquals(verifier.valueAsString, '')),
      assertDescription: 'Long sessions require a trusted-edge SHA256 verifier' },
    { assert: Fn.conditionEquals(String(identityServicesEnabled), 'true'),
      assertDescription: 'Long sessions require existing read-only identity status verification' }],
  });
  return { SESSION_EDGE_PROOF_SHA256: verifier.valueAsString, TRUSTED_USER_SESSIONS_ENABLED: enabled.valueAsString };
}

export function userSessionOriginHeaders(scope: Construct): Record<string, string> {
  scope = Stack.of(scope);
  const proof = new CfnParameter(scope, 'SessionEdgeProof', {
    type: 'String', noEcho: true, default: 'disabled', allowedPattern: '^disabled$|^[A-Za-z0-9_-]{43}$',
    description: 'Random 256-bit origin proof. Supply privately, retain with UsePreviousValue, never output or log it.',
  });
  if (scope.node.tryFindChild('TrustedUserSessionsEnabled')) new CfnRule(scope, 'TrustedSessionOriginRequired', {
    ruleCondition: Fn.conditionEquals(Fn.ref('TrustedUserSessionsEnabled'), 'true'),
    assertions: [{ assert: Fn.conditionNot(Fn.conditionEquals(proof.valueAsString, 'disabled')),
      assertDescription: 'Long sessions require the private origin proof at the edge' }],
  });
  return { 'x-rillora-session-edge-proof': proof.valueAsString };
}
