import unittest
from unittest.mock import patch
import rillora_dns as dns


class Guards(unittest.TestCase):
    def test_other_domain_and_billing_commands_are_not_exposed(self):
        with patch('sys.stderr'):
            for arguments in [['list', 'fanpass.fun'], ['list', '--domain', 'fanpass.fun'], ['purchase']]:
                with self.assertRaises(SystemExit):
                    dns.parser().parse_args(arguments)

    def test_values_cannot_inject_global_cli_flags(self):
        args = dns.parser().parse_args(['add', '--type', 'TXT', '--name', '_test', '--data=--env=ote'])
        dns.validate(args)
        command = dns.mutation_command(args, True)
        self.assertEqual(command[1], 'rillora.xyz')
        self.assertIn('--data=--env=ote', command)
        self.assertNotIn('--env=ote', command)
        self.assertIn('--dry-run', command)

    def test_unrelated_record_change_is_rejected(self):
        before = [{'type': 'MX', 'name': '@', 'data': 'mail.example', 'ttl': 3600}]
        after = [{'type': 'MX', 'name': '@', 'data': 'wrong.example', 'ttl': 3600}]
        with self.assertRaises(RuntimeError):
            dns.check_unchanged(before, after, ('TXT', '_test'))
        dns.check_unchanged(before, before + [{'type': 'TXT', 'name': '_test', 'data': 'fixture'}], ('TXT', '_test'))

    def test_only_relative_names_and_supported_record_types(self):
        dns.validate(dns.parser().parse_args(['list', '--type', 'CAA']))
        for name in ['https://evil.example', '--env=ote', 'www.rillora.xyz']:
            args = dns.parser().parse_args(['add', '--type', 'TXT', '--name=' + name, '--data', 'fixture'])
            with self.assertRaises(ValueError):
                dns.validate(args)


if __name__ == '__main__':
    unittest.main()
