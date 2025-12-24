from pathlib import Path

import pytest
import torch

from skey.key_detection import (
    DEFAULT_CHECKPOINT_PATH,
    detect_key,
    infer_key,
    key_map,
    load_audio,
    load_checkpoint,
    load_model_components,
)

# Ensure the test audio file is in the tests/ directory
TEST_AUDIO_FILENAME = "nocturne_n02_in_e-flat_major.mp3"
EXPECTED_KEY_FOR_TEST_AUDIO = "D# Major"  # E-flat Major is D# Major in key_map


@pytest.fixture(scope="module")
def audio_path() -> str:
    """Provides the path to the test audio file."""
    # Assumes test_detect_key.py is in tests/ and audio file is also in tests/
    path = Path(__file__).parent / TEST_AUDIO_FILENAME
    if not path.exists():
        pytest.skip(f"Test audio file not found: {path}")
    return str(path)


@pytest.fixture(scope="module")
def model_components():
    """Loads the model components and sampling rate using the default checkpoint."""
    if not DEFAULT_CHECKPOINT_PATH.exists():
        pytest.skip(f"Default checkpoint not found: {DEFAULT_CHECKPOINT_PATH}")

    device = torch.device("cpu")
    ckpt = load_checkpoint(DEFAULT_CHECKPOINT_PATH)
    hcqt, chromanet, crop_fn = load_model_components(ckpt, device)
    sr = ckpt["audio"]["sr"]
    return hcqt, chromanet, crop_fn, device, sr


def test_load_audio(audio_path: str, model_components):
    """Tests the load_audio function."""
    _, _, _, _, sr = model_components  # Get sr from fixture

    waveform = load_audio(audio_path, sr=sr, mono=True, normalize=True)

    assert isinstance(waveform, torch.Tensor), "Waveform should be a torch.Tensor."
    assert waveform.ndim == 2, "Waveform should have 2 dimensions (channels, samples)."
    assert waveform.shape[0] == 1, "Waveform should be mono (1 channel)."
    assert waveform.shape[1] > 0, "Waveform should have more than 0 samples."

    # Check normalization (max absolute value should be <= 1.0)
    if torch.max(torch.abs(waveform)) > 1e-9:  # Avoid issues with pure silence
        assert torch.max(torch.abs(waveform)) <= 1.0 + 1e-6, "Waveform should be normalized."


def test_infer_key_specific_song(audio_path: str, model_components):
    """Tests the infer_key function with a specific song and expects a specific key."""
    hcqt, chromanet, crop_fn, device, sr = model_components

    waveform = load_audio(audio_path, sr=sr, mono=True, normalize=True).to(device)
    assert waveform.nelement() > 0, "Loaded waveform is empty."
    if waveform.nelement() > 0:  # Proceed only if waveform is not empty
        assert torch.max(torch.abs(waveform)) > 1e-9, "Loaded waveform is silent."

    predicted_key = infer_key(hcqt, chromanet, crop_fn, waveform, device)

    assert isinstance(predicted_key, str), "Predicted key should be a string."
    assert predicted_key in key_map.values(), f"Predicted key '{predicted_key}' not in known key_map."
    assert predicted_key == EXPECTED_KEY_FOR_TEST_AUDIO, (
        f"Expected key '{EXPECTED_KEY_FOR_TEST_AUDIO}' but got '{predicted_key}' for {TEST_AUDIO_FILENAME}."
    )


def test_detect_key_single_file_output(audio_path: str, capsys):
    """
    Tests the detect_key function for a single file, checking its console output.
    This test uses the default checkpoint.
    """
    if not DEFAULT_CHECKPOINT_PATH.exists():
        pytest.skip(f"Default checkpoint not found: {DEFAULT_CHECKPOINT_PATH}")

    detect_key(audio_path=audio_path, device="cpu", ckpt_path=DEFAULT_CHECKPOINT_PATH, cli=True)
    captured = capsys.readouterr()

    # Example output: "Predicted key for /path/to/audio.mp3: C Major"
    expected_output_fragment = f"{EXPECTED_KEY_FOR_TEST_AUDIO}"

    assert expected_output_fragment in captured.out, (
        f"Expected output containing '{expected_output_fragment}' not found in stdout. Got: {captured.out}"
    )
    assert "error" not in captured.out.lower(), f"Error message found in stdout: {captured.out}"
    assert "failed" not in captured.out.lower(), f"Failure message found in stdout: {captured.out}"


def test_load_audio_file_not_found():
    """Tests that load_audio raises FileNotFoundError for a non-existent file."""
    with pytest.raises(FileNotFoundError):
        load_audio("non_existent_file.wav", sr=22050)


def test_load_invalid_audio_file(tmp_path):
    """Tests that load_audio raises ValueError for a non-audio file."""
    invalid_file = tmp_path / "invalid.txt"
    invalid_file.write_text("This is not an audio file.")
    with pytest.raises(ValueError):  # torchaudio.load will fail, leading to ValueError in load_audio
        load_audio(str(invalid_file), sr=22050)


def test_infer_key_short_audio(model_components):
    """Tests infer_key with very short audio, expecting 'error' or graceful handling."""
    hcqt, chromanet, crop_fn, device, sr = model_components

    # Create a very short audio tensor (e.g., 100 samples)
    # The exact length that causes issues depends on the CQT processing window
    short_waveform = torch.randn(1, 100).to(device) / 100.0  # Small amplitude random noise

    predicted_key = infer_key(hcqt, chromanet, crop_fn, short_waveform, device)
    assert predicted_key == "error"  # "Expected 'error' for very short audio due to processing
