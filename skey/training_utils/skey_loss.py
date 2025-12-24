from typing import Callable, Dict, List, Tuple, Union

import torch
import torch.nn as nn

log_clap: Callable[[torch.Tensor], torch.Tensor] = lambda x: torch.clamp(torch.log(x), min=-100)


class Z_transformation(torch.nn.Module):
    def __init__(self, circle_type: int, device: str) -> None:
        super().__init__()
        self.omega = circle_type / 12
        self.alpha = torch.exp(1j * 2 * torch.pi * self.omega * torch.arange(12))
        self.device = device

    def forward(self, y: torch.Tensor) -> torch.Tensor:
        """
        Complex Z tranformation for loss calculation, project the 12 probability bins to a single point on a disk of r=1.
        """
        z = torch.matmul(torch.complex(y, 0 * y), self.alpha.cuda(self.device))
        return z


class CrossPowerSpectralDensityLoss(nn.Module):
    """
    Differentialble distance on the circle of fifths.
    """

    def __init__(
        self,
        circle_type: int,
        device: str,
        weights: List = [1, 1, 1],
    ) -> None:
        super(CrossPowerSpectralDensityLoss, self).__init__()
        self.z_transformation = Z_transformation(circle_type, device)
        self.weights = weights

    def forward(self, y: torch.Tensor) -> Dict[str, Union[int, float, Dict]]:
        y, difference, mean_hcqt = y
        batch_size = int(y.shape[0] / 3)

        # calculate m, value for mode, vertical summation
        channel_1, channel_2 = torch.split(y, 12, dim=1)  # [n_views*batch+equivariant, 12]
        m1 = torch.sum(channel_1, dim=1)  # sum of mode per data point in the batch

        # for 3 views
        m1_source1 = m1[:batch_size]
        m1_source2 = m1[batch_size : 2 * batch_size]
        m1_equivariant = m1[2 * batch_size :]

        # horizontal summation
        y = torch.add(channel_1, channel_2)

        # z transformation, for 3 views
        z = self.z_transformation(y)
        z1 = z[:batch_size, ...]
        z2 = z[batch_size : batch_size * 2, ...]
        z3 = z[batch_size * 2 :, ...]

        # distribution loss: balance distribution of major and minor modes predictions
        sum_1 = torch.sum(channel_1[: 2 * batch_size])
        sum_2 = torch.sum(channel_2[: 2 * batch_size])
        loss_distribution = (sum_1 / (2 * batch_size) - 0.5) * (0.5 - sum_2 / (2 * batch_size))  # maximum is 0.25
        # loss_distribution = 0

        # label the data by the cqt bin energy comparaison
        with torch.no_grad():
            key_signature = ((y[:batch_size] + y[batch_size : 2 * batch_size]) / 2).argmax(axis=1)
            root_bin = (key_signature + 3) % 12
            majorminor = torch.gather(mean_hcqt, 1, key_signature.unsqueeze(axis=1)) > torch.gather(
                mean_hcqt, 1, root_bin.unsqueeze(axis=1)
            )
            feat_eng_mode = majorminor.int().squeeze()

        # loss calculation
        loss_pos = (1 - z1 * z2.conj()).abs().pow(2).mean()
        loss_equivariant_1 = (
            (
                torch.exp(1j * 2 * torch.pi * self.z_transformation.omega * difference.to(self.z_transformation.device))
                - z1 * z3.conj()
            )
            .abs()
            .pow(2)
            .mean()
        )
        loss_equivariant_2 = (
            (
                torch.exp(1j * 2 * torch.pi * self.z_transformation.omega * difference.to(self.z_transformation.device))
                - z2 * z3.conj()
            )
            .abs()
            .pow(2)
            .mean()
        )
        loss_key = loss_pos + loss_equivariant_1 + loss_equivariant_2

        loss_mode = (
            (-feat_eng_mode * log_clap(m1_equivariant) - (1 - feat_eng_mode) * log_clap(1 - m1_equivariant)).mean()
            + (-feat_eng_mode * log_clap(m1_source2) - (1 - feat_eng_mode) * log_clap(1 - m1_source2)).mean()
            + (-feat_eng_mode * log_clap(m1_source1) - (1 - feat_eng_mode) * log_clap(1 - m1_source1)).mean()
        )

        w_key, w_mode, w_distribution = self.weights

        loss = w_key * loss_key + w_mode * 1.5 * loss_mode + w_distribution * 20 * loss_distribution

        return {
            "loss": loss,
            "loss_to_print": {
                "loss_pos": loss_pos,
                "loss_equi": loss_equivariant_1 + loss_equivariant_2,
                "loss_mode": loss_mode,
                "loss_distribution": loss_distribution,
                "loss_total": loss,
            },
        }


class CrossEntropyLoss(nn.Module):
    """
    Differentialble distance on the circle of fifths.
    """

    def __init__(
        self,
    ) -> None:
        super(CrossEntropyLoss, self).__init__()

    def forward(self, y: Tuple[torch.Tensor, torch.Tensor]) -> torch.Tensor:
        y1, y2 = y
        loss = torch.cat(
            [
                torch.sum(-y1 * torch.log(y2), dim=-1),
                torch.sum(-y2 * torch.log(y1), dim=-1),
            ],
            0,
        ).mean()
        return loss
