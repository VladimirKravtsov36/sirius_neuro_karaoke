Using:

```python
from KaraokeProcessor.KaraokeProcessor import *

kp = KaraokeProcessor(
    AudioLoader("path_to_mp3"),
    None,
    ASRService("small", "cpu"),
    Aligner("cpu")
)

print(kp.process())
```