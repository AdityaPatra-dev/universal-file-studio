import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

logger = logging.getLogger("ufs.api.websocket")

router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
@router.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    General WebSocket endpoint for real-time progress, events, and telemetry.
    Supports ping/pong keepalive and job subscription commands.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial connection acknowledgment
        await websocket.send_text(json.dumps({
            "event": "connected",
            "message": "Connected to Universal File Studio WebSocket stream",
            "protocol": "ufs-events-v1"
        }))

        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
                action = data.get("action", "")
                
                if action == "ping":
                    await websocket.send_text(json.dumps({
                        "event": "pong",
                        "timestamp": data.get("timestamp")
                    }))
                elif action == "subscribe" and "job_id" in data:
                    job_id = data["job_id"]
                    await ws_manager.subscribe_job(websocket, job_id)
                    await websocket.send_text(json.dumps({
                        "event": "subscribed",
                        "job_id": job_id
                    }))
                elif action == "echo":
                    await websocket.send_text(json.dumps({
                        "event": "echo",
                        "data": data.get("data")
                    }))
                else:
                    await websocket.send_text(json.dumps({
                        "event": "ack",
                        "received": data
                    }))
            except json.JSONDecodeError:
                if raw_text.strip().lower() == "ping":
                    await websocket.send_text("pong")
                else:
                    await websocket.send_text(json.dumps({
                        "event": "ack",
                        "raw": raw_text
                    }))

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"[WS] WebSocket error: {e}")
        await ws_manager.disconnect(websocket)


@router.websocket("/ws/jobs/{job_id}")
@router.websocket("/api/v1/ws/jobs/{job_id}")
async def websocket_job_endpoint(websocket: WebSocket, job_id: str):
    """
    Targeted WebSocket endpoint automatically scoped to a specific job ID.
    """
    await ws_manager.connect(websocket, job_id=job_id)
    try:
        await websocket.send_text(json.dumps({
            "event": "subscribed",
            "job_id": job_id,
            "message": f"Subscribed to real-time events for job {job_id}"
        }))

        while True:
            raw_text = await websocket.receive_text()
            if raw_text.strip().lower() == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    data = json.loads(raw_text)
                    if data.get("action") == "ping":
                        await websocket.send_text(json.dumps({"event": "pong"}))
                except Exception:
                    pass

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, job_id=job_id)
    except Exception as e:
        logger.warning(f"[WS] Job WebSocket error ({job_id}): {e}")
        await ws_manager.disconnect(websocket, job_id=job_id)
