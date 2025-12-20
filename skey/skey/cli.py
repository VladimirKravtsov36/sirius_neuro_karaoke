# skey/cli.py

import argparse

from skey.key_detection import detect_key


def main():
    parser = argparse.ArgumentParser(description="Key detection from audio")
    parser.add_argument("audio_dir", help="Path to directory with audio files or a single audio file")
    parser.add_argument(
        "--checkpoint",
        default=None,
        help="Path to model checkpoint (.pt). Loads default if not provided.",
    )
    parser.add_argument("--ext", default="wav", help="Audio file extension (default: wav) if audio_dir is a directory")
    parser.add_argument("--device", default="cpu", help="Computation device (e.g., 'cpu', 'cuda', 'mps')")
    args = parser.parse_args()

    ckpt_path = args.checkpoint

    detect_key(audio_path=args.audio_dir, extension=args.ext, device=args.device, ckpt_path=ckpt_path, cli=True)
