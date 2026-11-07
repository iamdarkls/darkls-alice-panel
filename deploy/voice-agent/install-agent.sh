#!/bin/sh
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run using sudo'; exit 1; }
command -v python3 >/dev/null
command -v systemctl >/dev/null
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
install -d -m 755 /opt/darkls-voice-agent
install -m 644 "$HERE/voice_agent.py" /opt/darkls-voice-agent/voice_agent.py
python3 - <<'PY'
import json,os,secrets
from pathlib import Path
p=Path('/etc/darkls-voice-agent.json')
if not p.exists():
    fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as f:
        json.dump(dict(bind='127.0.0.1',port=8781,unit='alisa-voice.service',token=secrets.token_urlsafe(32),compatibility_confirmed=False),f,indent=2)
print('Agent configuration: /etc/darkls-voice-agent.json (token is private)')
PY
cat > /etc/systemd/system/darkls-voice-agent.service <<'EOF'
[Unit]
Description=DARKLS Voice control agent
After=network.target
[Service]
ExecStart=/usr/bin/python3 /opt/darkls-voice-agent/voice_agent.py
Restart=on-failure
RestartSec=3
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now darkls-voice-agent
printf '%s\n' 'Agent installed on 127.0.0.1:8781. No voice service has been installed or started.'
