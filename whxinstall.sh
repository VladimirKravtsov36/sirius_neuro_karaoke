uv venv --python 3.11 
source .venv/bin/activate

uv pip install -r requirements.txt
uv pip install --no-deps ./whisperx-3.4.3-py3-none-any.whl

unset LD_LIBRARY_PATH
export LD_LIBRARY_PATH="/home/andreeveg/cudnn897/lib:$LD_LIBRARY_PATH"