import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("ufs.websocket")

class ConnectionManager:
    """
    Manages active WebSocket connections for real-time progress,
    job lifecycle events, engine updates, and developer streams.
    """
    def __init__(self):
        self._lock = asyncio.Lock()
        self.active_connections: Set[WebSocket] = set()
        # Map job_id -> Set[WebSocket] for targeted streaming
        self.job_subscriptions: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: Optional[str] = None):
        """Accept a websocket connection and optionally subscribe to a specific job."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
            if job_id:
                if job_id not in self.job_subscriptions:
                    self.job_subscriptions[job_id] = set()
                self.job_subscriptions[job_id].add(websocket)
        logger.info(f"[WS] Client connected (total: {len(self.active_connections)}) job_id={job_id}")

    async def disconnect(self, websocket: WebSocket, job_id: Optional[str] = None):
        """Remove a websocket connection cleanly."""
        async with self._lock:
            self.active_connections.discard(websocket)
            if job_id and job_id in self.job_subscriptions:
                self.job_subscriptions[job_id].discard(websocket)
                if not self.job_subscriptions[job_id]:
                    del self.job_subscriptions[job_id]
            # Also clean up from any other job subscriptions
            for j_id, subscribers in list(self.job_subscriptions.items()):
                subscribers.discard(websocket)
                if not subscribers:
                    del self.job_subscriptions[j_id]
        logger.info(f"[WS] Client disconnected (remaining: {len(self.active_connections)})")

    async def subscribe_job(self, websocket: WebSocket, job_id: str):
        """Subscribe an existing websocket connection to a specific job."""
        async with self._lock:
            if job_id not in self.job_subscriptions:
                self.job_subscriptions[job_id] = set()
            self.job_subscriptions[job_id].add(websocket)

    async def broadcast(self, event: str, payload: Dict[str, Any]):
        """Broadcast an event to all connected clients."""
        message = json.dumps({"event": event, "payload": payload, **payload})
        async with self._lock:
            connections = list(self.active_connections)
        
        dead_connections = []
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                dead_connections.append(connection)

        if dead_connections:
            async with self._lock:
                for dead in dead_connections:
                    self.active_connections.discard(dead)

    async def send_to_job(self, job_id: str, event: str, payload: Dict[str, Any]):
        """Send event to subscribers of a specific job and also broadcast globally."""
        # Always broadcast so global monitoring / job list views receive updates
        await self.broadcast(event, payload)

    # Standard Specification Event Helpers (Section 12)
    async def emit_job_progress(
        self,
        job_id: str,
        percent: float,
        current_file: str = "",
        speed: str = "N/A",
        eta_seconds: int = 0
    ):
        """Emit job:progress event."""
        payload = {
            "job_id": job_id,
            "percent": round(percent, 1),
            "current_file": current_file,
            "speed": speed,
            "eta_seconds": eta_seconds,
        }
        await self.send_to_job(job_id, "job:progress", payload)

    async def emit_job_completed(
        self,
        job_id: str,
        output_path: str,
        duration: float,
        input_size: int = 0,
        output_size: int = 0
    ):
        """Emit job:completed event."""
        payload = {
            "job_id": job_id,
            "output_path": output_path,
            "duration": duration,
            "input_size": input_size,
            "output_size": output_size,
        }
        await self.send_to_job(job_id, "job:completed", payload)

    async def emit_job_failed(
        self,
        job_id: str,
        error: str,
        detail: str = ""
    ):
        """Emit job:failed event."""
        payload = {
            "job_id": job_id,
            "error": error,
            "detail": detail,
        }
        await self.send_to_job(job_id, "job:failed", payload)

    async def emit_job_cancelled(self, job_id: str):
        """Emit job:cancelled event."""
        payload = {"job_id": job_id}
        await self.send_to_job(job_id, "job:cancelled", payload)

    async def emit_engine_status(self, engine_name: str, status: str):
        """Emit engine:status event."""
        payload = {
            "engine_name": engine_name,
            "status": status,
        }
        await self.broadcast("engine:status", payload)


# Global singleton
ws_manager = ConnectionManager()
