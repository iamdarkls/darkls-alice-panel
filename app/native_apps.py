"""Authenticated web bridge to the local application host."""
import threading
from urllib.parse import urlsplit,parse_qs
from yam_host import Client

def install(module,manager,base):
    client=Client(base,manager.root);manager.app_host=client
    # Starts without a browser after the native panel's boot hook launches it.
    def ensure():
        try:client.ensure()
        except Exception as e:print('Application host:',str(e),flush=True)
    threading.Thread(target=ensure,daemon=True).start()
    old_get,old_post=module.Handler.do_GET,module.Handler.do_POST
    def get(self):
        url=urlsplit(self.path);path=url.path
        if path not in ('/api/apps','/api/apps/log','/api/apps/recovery'):return old_get(self)
        if self._guard(path):return
        def call():
            status=client.ensure()
            if path=='/api/apps':return status
            if path=='/api/apps/recovery':return dict(pending=status['recovery_pending'],report=status['recovery'])
            return client.request(dict(op='log',service=parse_qs(url.query).get('service',[''])[0]))
        return self._handle(call)
    def post(self):
        path=urlsplit(self.path).path
        if path!='/api/apps/action':return old_post(self)
        if self._guard(path):return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<=size<=16384:return self._send(413,dict(error='Запрос слишком большой'))
            data=self._json()
            if not isinstance(data,dict) or data.get('action') not in ('start','stop','restart','enable','disable','metadata','recheck','discover'):raise ValueError('Неизвестное действие')
        except ValueError as e:return self._send(400,dict(error=str(e)))
        def call():client.ensure();return client.request(dict(data,op='action'))
        return self._handle(call)
    module.Handler.do_GET,module.Handler.do_POST=get,post
