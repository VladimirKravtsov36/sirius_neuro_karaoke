from typing import List, Tuple

import torch
from torch import Tensor

from skey.chromanet import ChromaNet, OctavePool
from skey.hcqt import VQT, CropCQT


class Stone(torch.nn.Module):
    def __init__(
        self,
        hcqt: VQT,
        out_channels: List[int],
        kernels: List[int],
        temperature: float,
        n_bins: int,
        device: str,
    ) -> None:
        super().__init__()
        self.hcqt = hcqt
        self.device = device
        self.n_harmonics = len(self.hcqt.harmonics)
        self.n_bins = n_bins
        self.bins_before_crop = hcqt.n_bins
        self.out_channels = out_channels
        self.kernels = kernels
        self.chromanet = ChromaNet(self.n_bins, self.n_harmonics, self.out_channels, self.kernels, temperature)
        self.octave_pool = OctavePool(12)

    def forward(self, x: dict) -> Tuple[Tensor, Tensor, Tensor]:
        """
        Return the output for both vocal and accompaniment
        """
        audio = x["audio"]
        assert audio.shape[2] == 1 or audio.shape[2] == 2

        s1 = audio[:, :, 0]  # batch, channel, n_bins, time
        s2 = audio[:, :, 1]
        batch = audio.shape[0]
        stack_hcqt = self.hcqt(torch.cat((s1, s2), dim=0))

        # calculate parameters for cropping CQT
        to_transpose = torch.randint(1, 12, (len(s1),))
        original = torch.randint(1, 13, (len(s1),))
        transpose = (to_transpose + original) % 12
        difference = transpose - original
        crop_fn = CropCQT(self.n_bins)

        # crop CQT
        stack_original = crop_fn(stack_hcqt, torch.cat((original, original), dim=0))
        mean_hcqt = self.octave_pool(torch.mean(stack_original, dim=3).unsqueeze(axis=3)).squeeze()
        mean_hcqt = (mean_hcqt[:batch] + mean_hcqt[batch:]) / 2

        source_transpose = crop_fn(stack_hcqt[:batch, ...], transpose)
        stack_input = torch.cat((stack_original, source_transpose), dim=0)  # torch.Size([384, 1, 84, 646])
        y = self.chromanet(stack_input)  # (384, 1, 12)

        return (y, difference, mean_hcqt)
