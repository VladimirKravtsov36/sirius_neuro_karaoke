Using:

```python
from KaraokeProcessor.KaraokeProcessor import *

kp = KaraokeProcessor(
    AudioLoader("path_to_mp3"),
    LyricsProvider("path_to_txt"), # or None
    LLMTextEditor(),
    ASRService("small", "cpu"),
    Aligner("cpu")
)

print(kp.process())

print(kp.create_image_prompts(10))
```