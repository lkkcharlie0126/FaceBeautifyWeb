import os
import sys

import httpx
import pytz

sys.path.append("..")

import boto3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

description = """
    <html>
        <head>
            <title> remote controller </title>
        </head>
        <body>
            This is <strong>  remote controller </strong>. Check <a href="/docs">the link</a> for more details. <br>
        </body>
    </html>
    """


AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
INSTANCE_ID = os.getenv("INSTANCE_ID")
REGION_NAME = os.getenv("REGION_NAME")
taiwan_timezone = pytz.timezone("Asia/Taipei")

session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=REGION_NAME,
)


def get_instance_ip():
    ec2_client = session.client("ec2")
    response = ec2_client.describe_instances(InstanceIds=[INSTANCE_ID])

    # Extract the IP address from the response
    try:
        ip_address = response["Reservations"][0]["Instances"][0]["PublicIpAddress"]
    except KeyError:
        ip_address = None
    return ip_address


def start_ec2_instance():
    ec2_client = session.client("ec2")
    ec2_client.start_instances(InstanceIds=[INSTANCE_ID])
    print("EC2 instance started.")

    waiter = ec2_client.get_waiter("instance_running")
    waiter.wait(InstanceIds=[INSTANCE_ID])

    ip_address = get_instance_ip()
    print("Instance IP:", ip_address)
    return ip_address


def stop_ec2_instance():
    ec2_client = session.client("ec2")
    ec2_client.stop_instances(InstanceIds=[INSTANCE_ID])
    # waiter = ec2_client.get_waiter('instance_stopped')
    # waiter.wait(InstanceIds=[INSTANCE_ID])
    print("EC2 instance stopped.")


app = FastAPI(
    title="Face Beautify Remote Controller",
    description=description,
    version="0.0.1",
    # max_concurrency=5,
)


origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
def read_root():
    return HTMLResponse(description)


@app.post("/api/start_ec2")
async def start_ec2():
    print("Starting EC2 instance...")
    ip_address = start_ec2_instance()
    return {"status": "success", "ip_address": ip_address}


@app.get("/api/check_ec2_status")
async def check_ec2_status():
    ec2_client = session.client("ec2")
    response = ec2_client.describe_instances(InstanceIds=[INSTANCE_ID])
    state = response["Reservations"][0]["Instances"][0]["State"]["Name"]
    try:
        ip_address = response["Reservations"][0]["Instances"][0]["PublicIpAddress"]
    except KeyError:
        ip_address = None
    return {"status": state, "ip_address": ip_address}


@app.post("/api/face_beautify")
async def face_beautify(payload: dict):
    ip_address = payload["ip_address"]
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://{ip_address}:8648/api/face_beautify/", json=payload, timeout=150
        )
    return response.json()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=3001, reload=True, limit_concurrency=10)
