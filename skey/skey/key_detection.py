import glob
import logging
import os
import csv
from pathlib import Path
from typing import Any, Dict, Iterator, List, Tuple

import numpy as np
import torch
import torchaudio
from tqdm import tqdm

from .chromanet import ChromaNet
from .hcqt import VQT, CropCQT

logging.basicConfig(level=logging.INFO)

DEFAULT_CHECKPOINT_PATH = Path(__file__).parent / "models/skey.pt"

def yield_audio_paths(paths: List[str]) -> Iterator[Dict[str, Any]]:
    """
    Yields audio file paths in a randomized order.

    Args:
        paths (List[str]): List of audio file paths.

    Returns:
        Iterator[Dict[str, Any]]: An iterator that yields dictionaries containing
        the index and the corresponding audio file path.
    """
    for idx in np.random.permutation(len(paths)):
        yield {"idx": idx, "song_path": paths[idx]}


def load_audio(song_path: str, sr: float, mono: bool = True, normalize: bool = True) -> torch.Tensor:
    """
    Loads an audio file and returns its waveform as a PyTorch tensor.

    Args:
        song_path (str): Path to the audio file.
        sr (float): Sampling rate for the audio file.
        mono (bool, optional): Whether to convert the audio to mono. Defaults to True.
        normalize (bool, optional): Whether to normalize the waveform. Defaults to True.

    Returns:
        torch.Tensor: A tensor containing the audio waveform. If loading fails,
                      returns a tensor of zeros with shape (1, 1).
    """
    if not Path(song_path).exists():
        raise FileNotFoundError(f"File {song_path} not found.")

    try:
        waveform, waveform_sr = torchaudio.load(song_path, backend="soundfile")
    except Exception as e:
        logging.error(f"Failed to load {song_path}: {e}")
        raise ValueError(f"Could not load audio file {song_path}: {e}")

    # Resample if necessary
    if waveform_sr != sr:
        waveform = torchaudio.transforms.Resample(orig_freq=waveform_sr, new_freq=sr)(waveform)

    # Convert to mono if specified
    if mono == True and waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    if normalize:
        max_val = torch.max(torch.abs(waveform))
        if max_val > 0:
            waveform = waveform / max_val

    # logging.info(f"Waveform shape: {waveform.shape}")
    return waveform


class AudioDataset(torch.utils.data.IterableDataset):
    """
    A PyTorch IterableDataset for loading audio files.

    Args:
        paths (List[str]): List of paths to audio files.
        sr (int): Sampling rate for loading audio files.
        device (torch.device): Device to load the audio tensors onto.

    Yields:
        Tuple[torch.Tensor, str]: A tuple containing the audio tensor and the file path.
    """

    def __init__(self, paths: List[str], sr: int, device: torch.device):
        self.paths = paths
        self.sr = sr
        self.device = device

    def __iter__(self) -> Iterator[Tuple[torch.Tensor, str]]:
        for data in yield_audio_paths(self.paths):
            audio = load_audio(data["song_path"], self.sr).to(self.device)
            if torch.max(torch.abs(audio)) > 0:
                yield audio, data["song_path"]


def load_model_components(ckpt: Dict[str, Any], device: torch.device) -> Tuple[VQT, ChromaNet, CropCQT]:
    """
    Loads model components (VQT, ChromaNet, and CropCQT) and initializes them with checkpoint data.

    Args:
        ckpt (Dict[str, Any]): Checkpoint dictionary containing model weights.
        device (torch.device): Device to load the models onto.

    Returns:
        Tuple[VQT, ChromaNet, CropCQT]: Initialized VQT, ChromaNet, and CropCQT components.
    """
    hcqt = VQT(
        harmonics=[1],
        fmin=27.5,
        n_bins=99,
    ).to(device)

    chromanet = ChromaNet(
        n_bins=84,
        n_harmonics=1,
        out_channels=[2, 3, 40, 40, 30, 10, 3],
        kernels=[7, 7, 7, 7, 7, 5, 5],
        temperature=1,
    ).to(device)

    hcqt.load_state_dict({k.replace("hcqt.", ""): v for k, v in ckpt["stone"].items() if "hcqt" in k})

    chromanet.load_state_dict({k.replace("chromanet.", ""): v for k, v in ckpt["stone"].items() if "chromanet" in k})

    hcqt.eval()
    chromanet.eval()
    crop_fn = CropCQT(84)
    return hcqt, chromanet, crop_fn


def infer_key(
    hcqt: VQT,
    chromanet: ChromaNet,
    crop_fn: CropCQT,
    batch: torch.Tensor,
    device: torch.device,
) -> str:
    """
    Infers the musical key of an audio batch using the provided model components.

    Args:
        hcqt (VQT): VQT model component for harmonic constant-Q transform.
        chromanet (ChromaNet): ChromaNet model component for key prediction.
        crop_fn (CropCQT): CropCQT function for cropping the CQT output.
        batch (torch.Tensor): Audio batch tensor.
        device (torch.device): Device to perform inference on.

    Returns:
        str: Predicted musical key as a string. Returns "error" if inference fails.
    """
    new_batch = batch.unsqueeze(0).to(device)
    try:
        with torch.no_grad():
            cropped = crop_fn(hcqt(new_batch), torch.zeros(1).to(device))
            logits = chromanet(cropped)
            return int(torch.mean(logits, dim=0).argmax())
    except Exception as e:
        logging.warning(f"Inference failed (likely short audio): {e}")
        return "error"


def load_checkpoint(checkpoint_path: str | Path | None = DEFAULT_CHECKPOINT_PATH) -> Dict[str, Any]:
    """
    Loads a checkpoint file from the specified checkpoint_path.

    Args:
        checkpoint_path (str): Path to the checkpoint file.

    Returns:
        Dict[str, Any]: Loaded checkpoint dictionary.
    """

    if checkpoint_path is None:
        checkpoint_path = DEFAULT_CHECKPOINT_PATH

    logging.info(f"Loading checkpoint from {checkpoint_path}")
    if not os.path.exists(str(checkpoint_path)):
        raise FileNotFoundError(f"Checkpoint file {checkpoint_path} does not exist.")
    return torch.load(checkpoint_path, map_location="cpu", weights_only=False)


def detect_key(
    audio: np.ndarray,
    extension: str = "mp3",
    device: str = "cpu",
    ckpt_path: str | Path = DEFAULT_CHECKPOINT_PATH,
    cli: bool = False,
) -> list[str] | None:
    """
    Detects the musical key of audio files using a pre-trained model.

    Args:
        ckpt_path (str): Path to the model checkpoint file.
        audio_path (str): Path to the audio file or directory containing audio files.
        extension (str, optional): File extension of audio files to process. No need to pass this argument when audio_path is a single audio file. Defaults to "wav".
        device (str, optional): Device to perform inference on ("cpu", "cuda", or "mps"). Defaults to "cpu".
        cli (bool, optional): If True, prints results to console. If False, returns results. Defaults to False.

    Returns:
        list[str] | None: List of predicted keys for the audio files. Returns None if no audio files are found.
    """
    if device != "cpu" and not torch.cuda.is_available() and not torch.backends.mps.is_available():
        device = "cpu"
    d = torch.device(device)

    ckpt = load_checkpoint(ckpt_path)
    sr = ckpt["audio"]["sr"]

    hcqt, chromanet, crop_fn = load_model_components(ckpt, d)

    audio_tensor = torch.from_numpy(audio)
    if len(audio_tensor.shape) == 1:
        audio_tensor = audio_tensor.unsqueeze(0)

    results = infer_key(hcqt, chromanet, crop_fn, audio_tensor.to(d), d)

    print(f"\n✅\n")

    if not cli:
        return results
