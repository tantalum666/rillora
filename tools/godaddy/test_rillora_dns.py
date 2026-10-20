import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
import rillora_dns as dns


class Guards(unittest.TestCase):
    def test_add_can_keep_a_same_data_record_with_another_priority(self):
        old = {'type': 'MX', 'name': '_fixture', 'data': 'mail.example.', 'ttl': 600, 'priority': 20}
        added = {**old, 'priority': 10}
        with tempfile.TemporaryDirectory() as temporary, patch.object(dns, 'ROOT', Path(temporary)), \
             patch.object(dns, 'read_records', side_effect=[[old], [old], [old, added]]), \
             patch.object(dns, 'invoke', return_value={}), patch('builtins.print'):
            dns.main(['add', '--type', 'MX', '--name', '_fixture', '--data', 'mail.example', '--priority', '10', '--apply'])

    def test_provider_readback_must_confirm_priority_and_caa_attributes(self):
        cases = [
            (['--type', 'MX', '--priority', '10'], {'priority': 20}),
            (['--type', 'MX', '--priority', '10'], {}),
            (['--type', 'CAA', '--flag', '0', '--tag', 'issue'], {'flag': 128, 'tag': 'issue'}),
            (['--type', 'CAA', '--flag', '0', '--tag', 'issue'], {'flag': 0, 'tag': 'iodef'}),
        ]
        for options, attributes in cases:
            with self.subTest(options=options, attributes=attributes), tempfile.TemporaryDirectory() as temporary:
                after = [{'type': options[1], 'name': '_fixture', 'data': 'mail.example', 'ttl': 600, **attributes}]
                with patch.object(dns, 'ROOT', Path(temporary)), patch.object(dns, 'read_records', side_effect=[[], [], after]), \
                     patch.object(dns, 'invoke', return_value={}), patch('builtins.print'):
                    with self.assertRaisesRegex(RuntimeError, 'requested'):
                        dns.main(['add', '--name', '_fixture', '--data', 'mail.example', '--apply', *options])

    def test_already_matching_cname_is_not_deleted_and_recreated(self):
        old = {'type': 'CNAME', 'name': 'www', 'data': 'new.example.', 'ttl': 600}
        with patch.object(dns, 'read_records', return_value=[old]), patch.object(dns, 'invoke') as invoke, patch('builtins.print'):
            dns.main(['set', '--type', 'CNAME', '--name', 'www', '--data', 'new.example', '--ttl', '600', '--apply'])
        invoke.assert_not_called()

    def test_cname_replacement_removes_conflict_then_adds_only_the_requested_target(self):
        before = [{'type': 'CNAME', 'name': 'www', 'data': 'old.example.', 'ttl': 3600},
                  {'type': 'MX', 'name': '@', 'data': 'mail.example.', 'ttl': 3600}]
        args = dns.parser().parse_args(['set', '--type', 'CNAME', '--name', 'www', '--data', 'new.example', '--ttl', '600'])
        with patch.object(dns, 'invoke') as invoke, patch.object(dns, 'read_records', return_value=before[1:]):
            result = dns.replace_single_cname(args, before)
        self.assertEqual(result['replaced'], 1)
        self.assertEqual([call.args[0][0] for call in invoke.call_args_list], ['delete', 'add'])
        self.assertIn('--name=www', invoke.call_args_list[0].args[0])
        self.assertIn('--data=new.example', invoke.call_args_list[1].args[0])

    def test_cname_failed_add_restores_prior_value_and_ttl(self):
        old = {'type': 'CNAME', 'name': 'www', 'data': 'old.example.', 'ttl': 3600}
        args = dns.parser().parse_args(['set', '--type', 'CNAME', '--name', 'www', '--data', 'new.example'])
        with patch.object(dns, 'invoke', side_effect=[{}, RuntimeError('provider failed'), {}]) as invoke, \
                patch.object(dns, 'read_records', side_effect=[[], [], [old]]):
            with self.assertRaisesRegex(RuntimeError, 'prior value and TTL'):
                dns.replace_single_cname(args, [old])
        self.assertIn('--data=old.example.', invoke.call_args_list[-1].args[0])
        self.assertIn('--ttl=3600', invoke.call_args_list[-1].args[0])

    def test_cname_concurrent_writer_is_never_overwritten(self):
        old = {'type': 'CNAME', 'name': 'www', 'data': 'old.example.', 'ttl': 3600}
        concurrent = {**old, 'data': 'another.example.'}
        args = dns.parser().parse_args(['set', '--type', 'CNAME', '--name', 'www', '--data', 'new.example'])
        with patch.object(dns, 'invoke') as invoke, patch.object(dns, 'read_records', return_value=[concurrent]):
            with self.assertRaisesRegex(RuntimeError, 'do not overwrite'):
                dns.replace_single_cname(args, [old])
        self.assertEqual(invoke.call_count, 1)

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
