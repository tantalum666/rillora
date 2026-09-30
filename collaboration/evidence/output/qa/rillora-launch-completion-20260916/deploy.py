from pathlib import Path
import subprocess,json,sys
root=Path(__file__).resolve().parents[3];q=Path(__file__).resolve().parent
mode=sys.argv[1];count=sys.argv[2] if len(sys.argv)>2 else "1"
if mode not in ["diff","deploy"] or count not in ["0","1"]:raise SystemExit("Use diff/deploy and 0/1")
args=["npx","cdk",mode,"RilloraStaging","--exclusively","-c","serviceDesiredCount="+count,"-c","stripeTestIntegrationEnabled=true","-c","familyMaintenancePreviewEnabled=true","-c","appleStoreKitSandboxEnabled=false","-c","accountDeletionEnabled=true","--profile","rillora-operator"]
if mode=="diff":args += ["--no-change-set"]
if mode=="deploy":
 args += ["--previous-parameters","true","--require-approval","never"]
 for parameter in json.loads((root/".local-secrets/launch-completion-20260916/staging-before.json").read_text())["Parameters"]:
  if parameter["ParameterValue"]!="****" and parameter["ParameterKey"]!="BootstrapVersion":args += ["--parameters",parameter["ParameterKey"]+"="+parameter["ParameterValue"]]
with (q/("aws-"+mode+"-"+count+".log")).open("w") as log:r=subprocess.run(args,cwd=root/"infra/aws",stdout=log,stderr=subprocess.STDOUT)
print("AWS",mode,"desired",count,"exit",r.returncode)
sys.exit(r.returncode)
