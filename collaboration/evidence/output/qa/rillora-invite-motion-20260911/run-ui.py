from pathlib import Path
import os,sys
root=Path(__file__).resolve().parents[3]
env=os.environ.copy()
env['DOTENV_CONFIG_PATH']='/dev/null'
if sys.argv[1]=='api':
    env.update(NODE_ENV='development',HOST='127.0.0.1',PORT='4220',DATABASE_URL='postgresql:///continuity_invite_motion',ALLOW_DEV_AUTH='true',ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL='false',ALLOW_FAMILY_MAINTENANCE_PREVIEW='true',ALLOW_STRIPE_TEST_INTEGRATION='false',ALLOW_APPLE_SANDBOX_INTEGRATION='false',CORS_ORIGINS='http://127.0.0.1:4221,http://127.0.0.1:4222,http://127.0.0.1:4223,http://127.0.0.1:4224')
    os.chdir(root/'apps/api');os.execvpe('node',['node','--import','tsx','src/server.ts'],env)
else:
    port={'a':'4221','b':'4222','guest':'4223','empty':'4224'}[sys.argv[1]]
    actor={'a':'11111111-1111-4111-8111-111111111111','b':'22222222-2222-4222-8222-222222222222','guest':'','empty':'44444444-4444-4444-8444-444444444444'}[sys.argv[1]]
    env.update(VITE_API_BASE_URL='http://127.0.0.1:4220/v1',VITE_DEV_PLANNER_ID=actor)
    os.chdir(root/'apps/web');os.execvpe('npm',['npm','run','dev','--','--host','127.0.0.1','--port',port,'--strictPort'],env)
