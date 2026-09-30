import getpass
import json
import subprocess
from pathlib import Path
from urllib.parse import urlparse, parse_qs

base = Path(__file__).resolve().parent
outputs = json.loads((base / 'live-operations-stack.json').read_text())['Outputs']
topic = next(x['OutputValue'] for x in outputs if x['OutputKey'] == 'AlertTopicArn')
url = urlparse(getpass.getpass('SNS confirmation URL (hidden): '))
query = parse_qs(url.query)
assert url.scheme == 'https' and url.hostname == 'sns.eu-central-1.amazonaws.com'
assert query.get('Action') == ['ConfirmSubscription'] or url.path == '/confirmation.html'
assert query.get('TopicArn') == [topic]
if 'Endpoint' in query:
    assert query['Endpoint'] == [Path('.local-secrets/release-readiness/alert-recipient.txt').read_text().strip()]
token = query['Token'][0]
assert token and len(token) < 4096
private = Path('.local-secrets/release-readiness/sns-confirm.json')
private.write_text(json.dumps({'TopicArn': topic, 'Token': token}))
private.chmod(0o600)
try:
    result = subprocess.run(['aws', '--no-sign-request', '--region', 'eu-central-1',
        'sns', 'confirm-subscription', '--cli-input-json', 'file://' + str(private.resolve()),
        '--output', 'json', '--no-cli-pager'], text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError('SNS confirmation failed; secret response withheld')
    data = json.loads(result.stdout)
    assert data['SubscriptionArn'].startswith(topic + ':')
    (base / 'sns-confirmed.json').write_text(json.dumps({
        'confirmed': True, 'subscriptionArn': data['SubscriptionArn'],
        'initialDeliveryPlacement': 'SPAM', 'confirmationMovedToInbox': True,
        'evidence': 'Actual AWS confirmation email and token confirmation; no credentials logged'
    }, indent=2) + '\n')
    print('SNS subscription confirmed for the exact Operations topic.')
finally:
    private.unlink(missing_ok=True)
