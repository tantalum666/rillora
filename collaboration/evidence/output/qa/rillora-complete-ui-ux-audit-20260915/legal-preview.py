from pathlib import Path
import os,sys,subprocess,http.server
q=Path(__file__).resolve().parent
root=q.parents[2]
if sys.argv[1]=='build':
 env=os.environ.copy();env.update(VITE_LEGAL_OPERATOR_NAME='Synthetic QA operator',VITE_LEGAL_OPERATOR_COUNTRY='QA region',VITE_LEGAL_SERVICE_ADDRESS='Synthetic QA service address',VITE_LEGAL_SUPPORT_EMAIL='support@example.test',VITE_LEGAL_PRIVACY_EMAIL='privacy@example.test',VITE_LEGAL_SECURITY_EMAIL='security@example.test')
 result=subprocess.run(['node','node_modules/vite/bin/vite.js','build','--mode','legal','--outDir',str(q/'legal-preview-dist')],cwd=root/'apps/web',env=env,capture_output=True,text=True)
 (q/'legal-local-build.log').write_text(result.stdout+result.stderr)
 print({'exit':result.returncode,'output':str(q/'legal-preview-dist')});sys.exit(result.returncode)
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(q/'legal-preview-dist'),**kw)
 def do_GET(self):
  if not self.path.startswith('/assets/'):self.path='/legal.html'
  super().do_GET()
 def log_message(self,*a):pass
http.server.ThreadingHTTPServer(('127.0.0.1',4256),Handler).serve_forever()
