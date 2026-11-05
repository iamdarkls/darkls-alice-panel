"""Read-only station information and kernel sensors; no package daemon or network API."""
import math
import os
from pathlib import Path
import profiles

def read(path,default=''):
    try:return Path(path).read_text(errors='replace').strip()
    except OSError:return default

def device(model='mini3pro'):
    p=profiles.PROFILES.get(model,profiles.PROFILES['mini3pro'])
    return dict(model=p['name'],platform=p['platform'],architecture=os.uname().machine,kernel=os.uname().release,
                firmware=read('/system/vendor/quasar/version_full'),transport='local')

def sensors(sysroot='/sys'):
    root=Path(sysroot);result=[];seen=set()
    def add(path,label,unit,divisor=1,kind='temperature'):
        try:
            key=str(path.resolve())
            if key in seen:return
            value=float(path.read_text().strip())/divisor
            if not math.isfinite(value):return
            if kind=='temperature' and not -80<=value<=200:return
            if kind=='humidity' and not 0<=value<=100:return
            seen.add(key);result.append(dict(id=label,kind=kind,value=value,unit=unit,source=str(path)))
        except (OSError,ValueError):pass
    for zone in sorted((root/'class/thermal').glob('thermal_zone*')):
        add(zone/'temp',read(zone/'type',zone.name),'°C',1000)
    for hw in sorted((root/'class/hwmon').glob('hwmon*')):
        for kind,unit,divisor,tag in [('temp','°C',1000,'temperature'),('humidity','%',1000,'humidity'),('fan','об/мин',1,'fan')]:
            for path in sorted(hw.glob(kind+'*_input')):
                label=read(path.with_name(path.name.replace('_input','_label')),read(hw/'name',hw.name)+' '+path.stem)
                add(path,label,unit,divisor,tag)
    # IIO illuminance raw is meaningful only with a published scale and optional offset.
    for sensor in sorted((root/'bus/iio/devices').glob('iio:device*')):
        raw=sensor/'in_illuminance_raw';scale=sensor/'in_illuminance_scale'
        if not raw.is_file() or not scale.is_file():continue
        try:
            value=(float(read(raw))+float(read(sensor/'in_illuminance_offset','0')))*float(read(scale))
            if math.isfinite(value) and value>=0:result.append(dict(id=read(sensor/'name',sensor.name)+' освещённость',kind='illuminance',value=value,unit='лк',source=str(raw)))
        except ValueError:pass
    return result
