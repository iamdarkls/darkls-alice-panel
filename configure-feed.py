import json
from pathlib import Path
import sys
from native_updates import Updater
feed=Path(sys.argv[1]).read_text().strip()
print(json.dumps(Updater('/data/darkls-alice').configure(dict(feed=feed,auto=False))))
print('FEED_CONFIGURED')
