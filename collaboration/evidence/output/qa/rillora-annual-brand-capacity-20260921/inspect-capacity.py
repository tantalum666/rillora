"""Read only the existing Rillora staging resources and recent capacity metrics."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
import json
import subprocess

QA = Path(__file__).resolve().parent
REGION = "eu-central-1"


def aws(profile, service, operation, *args):
    process = subprocess.run(
        ["aws", "--profile", profile, "--region", REGION, service, operation,
         *args, "--output", "json"], capture_output=True, text=True, timeout=45,
    )
    if process.returncode:
        # No environment, secret values or command parameters are returned.
        message = process.stderr.strip().splitlines()
        return {"unavailable": True, "error": message[-1][:400] if message else "CLI failed"}
    return json.loads(process.stdout)


resources = aws("rillora-cdk-deploy", "cloudformation", "describe-stack-resources", "--stack-name", "RilloraStaging")
stack = aws("rillora-cdk-deploy", "cloudformation", "describe-stacks", "--stack-name", "RilloraStaging")
if resources.get("unavailable") or stack.get("unavailable"):
    result = {"checkedAt": datetime.now(timezone.utc).isoformat(), "resources": resources, "stack": stack}
else:
    rows = resources["StackResources"]
    outputs = {item["OutputKey"]: item["OutputValue"] for item in stack["Stacks"][0]["Outputs"]}
    service = next(item["PhysicalResourceId"] for item in rows if item["ResourceType"] == "AWS::ECS::Service")
    database = next(item["PhysicalResourceId"] for item in rows if item["ResourceType"] == "AWS::RDS::DBInstance")
    cluster = outputs["ClusterName"]
    with ThreadPoolExecutor(max_workers=2) as pool:
        ecs_future = pool.submit(aws, "rillora-staging-operator", "ecs", "describe-services", "--cluster", cluster, "--services", service)
        rds_future = pool.submit(aws, "rillora-staging-operator", "rds", "describe-db-instances", "--db-instance-identifier", database)
        ecs = ecs_future.result()
        rds = rds_future.result()
    result = {"checkedAt": datetime.now(timezone.utc).isoformat(), "environment": "existing synthetic staging", "region": REGION,
              "service": ecs, "database": rds, "metrics": []}
    if not ecs.get("unavailable"):
        source = ecs["services"][0]
        result["service"] = {key: source[key] for key in ["serviceName", "desiredCount", "runningCount", "pendingCount", "taskDefinition"]}
        task = aws("rillora-staging-operator", "ecs", "describe-task-definition", "--task-definition", source["taskDefinition"])
        if not task.get("unavailable"):
            definition = task["taskDefinition"]
            result["task"] = {"cpu": definition["cpu"], "memoryMiB": definition["memory"],
                              "containers": [{"name": container["name"], "capacityEnvironment": {
                                  row["name"]: row["value"] for row in container.get("environment", [])
                                  if row["name"] in ["DATABASE_POOL_MAX", "DATABASE_CONNECTION_TIMEOUT_MS", "NODE_ENV"]
                              }} for container in definition["containerDefinitions"]]}
        else:
            result["task"] = task
    if not rds.get("unavailable"):
        source = rds["DBInstances"][0]
        result["database"] = {key: source.get(key) for key in ["DBInstanceIdentifier", "DBInstanceClass", "DBInstanceStatus", "Engine", "EngineVersion", "AllocatedStorage", "MaxAllocatedStorage", "StorageType", "MultiAZ", "BackupRetentionPeriod", "StorageEncrypted"]}
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=24)
    specifications = [("AWS/ECS", name, [f"Name=ClusterName,Value={cluster}", f"Name=ServiceName,Value={service.split('/')[-1]}"])
                      for name in ["CPUUtilization", "MemoryUtilization"]]
    specifications += [("AWS/RDS", name, [f"Name=DBInstanceIdentifier,Value={database}"])
                       for name in ["CPUUtilization", "FreeableMemory", "DatabaseConnections", "FreeStorageSpace", "CPUCreditBalance"]]

    def metric(spec):
        namespace, name, dimensions = spec
        data = aws("rillora-staging-operator", "cloudwatch", "get-metric-statistics",
                   "--namespace", namespace, "--metric-name", name, "--dimensions", *dimensions,
                   "--start-time", start.isoformat(), "--end-time", end.isoformat(),
                   "--period", "3600", "--statistics", "Average", "Maximum")
        return {"namespace": namespace, "metric": name, "periodSeconds": 3600, "data": data}

    with ThreadPoolExecutor(max_workers=4) as pool:
        result["metrics"] = list(pool.map(metric, specifications))
    result["observationWindow"] = {"from": start.isoformat(), "to": end.isoformat()}

(QA / "capacity-live.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({"saved": "capacity-live.json", "checkedAt": result["checkedAt"],
                  "resourceReadSucceeded": "environment" in result,
                  "metricResponses": len(result.get("metrics", []))}))
