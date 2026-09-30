from pathlib import Path
import os,sys
root=Path(__file__).resolve().parents[3]
env=os.environ.copy()
env['DOTENV_CONFIG_PATH']='/dev/null'
if sys.argv[1]=='api':
    env.update(NODE_ENV='development',HOST='127.0.0.1',PORT='4250',DATABASE_URL='postgresql:///continuity_ux_audit_20260915',ALLOW_DEV_AUTH='true',ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL='false',ALLOW_FAMILY_MAINTENANCE_PREVIEW='true',ALLOW_STRIPE_TEST_INTEGRATION='false',ALLOW_APPLE_SANDBOX_INTEGRATION='false',CORS_ORIGINS='http://127.0.0.1:4251,http://127.0.0.1:4252,http://127.0.0.1:4253,http://127.0.0.1:4254')
    os.chdir(root/'apps/api');os.execvpe('node',['node','--import','tsx','src/server.ts'],env)
else:
    port={'a':'4251','b':'4252','guest':'4253','empty':'4254'}[sys.argv[1]]
    actor={'a':'11111111-1111-4111-8111-111111111111','b':'22222222-2222-4222-8222-222222222222','guest':'','empty':'44444444-4444-4444-8444-444444444444'}[sys.argv[1]]
    env.update(VITE_API_BASE_URL='http://127.0.0.1:4250/v1',VITE_DEV_PLANNER_ID=actor,VITE_LEGAL_OPERATOR_NAME='Synthetic QA operator',VITE_LEGAL_OPERATOR_COUNTRY='QA region',VITE_LEGAL_SERVICE_ADDRESS='Synthetic QA service address',VITE_LEGAL_SUPPORT_EMAIL='support@example.test',VITE_LEGAL_PRIVACY_EMAIL='privacy@example.test',VITE_LEGAL_SECURITY_EMAIL='security@example.test')
    os.chdir(root/'apps/web');os.execvpe('npm',['npm','run','dev','--','--host','127.0.0.1','--port',port,'--strictPort'],env)
