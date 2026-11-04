#!/usr/bin/env python3
"""Small control plane for ONE preconfigured systemd voice service; no audio or login handling."""
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import re
import subprocess
import time
from pathlib import Path

CONFIG = Path(os.environ.get('DARKLS_VOICE_CONFIG', '/etc/darkls-voice-agent.json'))

def service(cfg, action):
    unit = cfg['unit']
    if not re.fullmatch(r'[A-Za-z0-9_@.-]+\.service', unit) or unit.startswith('-'):
        raise ValueError('Invalid unit name')
    props = subprocess.run(['systemctl', 'show', unit, '--property=LoadState,ActiveState,SubState'],
                           capture_output=True, text=True, timeout=5, check=True)
    state = dict(line.split('=',1) for line in props.stdout.splitlines() if '=' in line)
    if action != 'status':
        if state.get('LoadState') != 'loaded':
            raise ValueError('Voice service is not installed')
        if action in ('start','restart') and cfg.get('compatibility_confirmed') is not True:
            raise ValueError('Mini 3 Pro compatibility must be verified on hardware first')
        subprocess.run(['systemctl', action, '--no-block', unit], capture_output=True, timeout=5, check=True)
    return dict(agent='darkls-voice-agent', schema=1, unit=unit, state=state, requested=action,
                time=time.time(), compatibility_confirmed=cfg.get('compatibility_confirmed') is True,
                note='systemd state only; microphone, audio stream and ChatGPT login are not tested')

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def respond(self, code, value):
        raw=json.dumps(value).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(raw)
    def handle_request(self):
        cfg=json.loads(CONFIG.read_text())
        supplied=self.headers.get('Authorization','')
        if not hmac.compare_digest(supplied.encode(),('Bearer '+cfg['token']).encode()):
            return self.respond(401,dict(error='Unauthorized'))
        action=self.path.removeprefix('/v1/')
        if self.path != '/v1/'+action or action not in ('status','start','stop','restart'):
            return self.respond(404,dict(error='Not found'))
        if (action=='status') != (self.command=='GET'):
            return self.respond(405,dict(error='Method not allowed'))
        try:
            if self.command=='POST':
                size=int(self.headers.get('Content-Length','0'))
                if not 0<=size<=1024: return self.respond(413,dict(error='Too large'))
                self.rfile.read(size)
            self.respond(200,service(cfg,action))
        except (ValueError,subprocess.SubprocessError,OSError):
            self.respond(409,dict(error='Action unavailable; check unit and compatibility configuration'))
    do_GET=handle_request
    do_POST=handle_request

if __name__=='__main__':
    cfg=json.loads(CONFIG.read_text())
    if not isinstance(cfg.get('token'),str) or len(cfg['token'])<24: raise SystemExit('Invalid agent token')
    ThreadingHTTPServer((cfg.get('bind','127.0.0.1'),int(cfg.get('port',8781))),Handler).serve_forever()
