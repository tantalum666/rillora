import copy
import unittest
import native_https_callbacks as callbacks

class NativeHTTPSCallbacks(unittest.TestCase):
    def current(self):
        return {'client_id':callbacks.CLIENTS['production'],'name':'Rillora Production iOS','app_type':'native',
                'callbacks':[sorted(callbacks.LEGACY)[0]],'allowed_logout_urls':[sorted(callbacks.LEGACY)[0]],
                'mobile':{'android':{'app_package_name':'preserved.example'}}}

    def test_plan_does_not_write_and_apply_changes_only_exact_existing_native_fields(self):
        state=self.current();writes=[]
        def provider(method,path,body=None):
            self.assertIn(callbacks.CLIENTS['production'],path)
            if method=='patch': writes.append(copy.deepcopy(body));state.update(body);return {}
            self.assertEqual(method,'get');self.assertIn('fields=',path);return copy.deepcopy(state)
        self.assertFalse(callbacks.configure('production',False,provider)['applied']);self.assertEqual(writes,[])
        self.assertTrue(callbacks.configure('production',True,provider)['applied'])
        self.assertEqual(set(writes[0]),{'callbacks','allowed_logout_urls','mobile'})
        self.assertEqual(state['callbacks'],[callbacks.CALLBACK]);self.assertEqual(state['mobile']['android'],{'app_package_name':'preserved.example'})
        self.assertFalse(callbacks.configure('production',True,provider)['applied']);self.assertEqual(len(writes),1)

    def test_wrong_client_type_or_unknown_callback_is_not_silently_overwritten(self):
        for change in [{'client_id':'fanpass'},{'app_type':'regular_web'},
                       {'callbacks':['https://attacker.example/callback']},{'allowed_logout_urls':[]}]:
            with self.subTest(change=change),self.assertRaises(ValueError):
                callbacks.desired({**self.current(),**change},callbacks.CLIENTS['production'])

if __name__=='__main__':unittest.main()
