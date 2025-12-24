import os
from source_separator import SourceSeparator

os.environ["CUDA_VISIBLE_DEVICES"] = "2"

source_separator = SourceSeparator()
source_separator.separate("/home/garifulinpa/sirius_neuro_karaoke/data/178529_Linkin Park - Numb.mp3")