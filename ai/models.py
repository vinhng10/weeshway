import importlib
from lightning.pytorch.cli import instantiate_class
from lightning.pytorch.utilities import grad_norm
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import librosa.util as librosa_util
import lightning.pytorch as pl
from torch import Tensor
from torchvision.ops.misc import Conv2dNormActivation
from torchvision.models._utils import _make_divisible
from torchmetrics.functional import f1_score
from typing import Any, Dict, Optional, Union, Tuple, List, Callable
from scipy.signal import get_window


class MelSpectrogram(nn.Module):
    """
    Pure PyTorch implementation of Mel Spectrogram.
    Combines STFT computation with mel filterbank conversion.
    """

    def __init__(
        self,
        sample_rate: int = 22050,
        n_fft: int = 2048,
        hop_length: Optional[int] = None,
        win_length: Optional[int] = None,
        window: str = "hann",
        n_mels: int = 128,
        f_min: float = 0.0,
        f_max: Optional[float] = None,
        power: float = 2.0,
        normalized: bool = False,
        center: bool = True,
        pad_mode: str = "reflect",
    ):
        super().__init__()

        self.sample_rate = sample_rate
        self.n_fft = n_fft
        self.hop_length = hop_length if hop_length is not None else n_fft // 4
        self.win_length = win_length if win_length is not None else n_fft
        self.window = window
        self.n_mels = n_mels
        self.f_min = f_min
        self.f_max = f_max if f_max is not None else sample_rate / 2.0
        self.power = power
        self.normalized = normalized
        self.center = center
        self.pad_mode = pad_mode

        # STFT parameters
        self.pad_amount = n_fft // 2 if center else 0
        self.cutoff = (self.n_fft // 2) + 1

        # Create STFT basis
        self._create_stft_basis()

        # Create mel filterbank
        self._create_mel_filterbank()

    def _create_stft_basis(self):
        """Create the STFT transformation basis similar to the provided STFT class."""
        # Create fourier basis
        fourier_basis = np.fft.fft(np.eye(self.n_fft))
        fourier_basis = np.vstack(
            [
                np.real(fourier_basis[: self.cutoff, :]),
                np.imag(fourier_basis[: self.cutoff, :]),
            ]
        )

        forward_basis = torch.FloatTensor(fourier_basis[:, None, :]).detach()

        # Apply window if specified
        if self.window is not None:
            assert self.n_fft >= self.win_length
            fft_window = get_window(self.window, self.win_length, fftbins=True)
            fft_window = librosa_util.pad_center(fft_window, size=self.n_fft)
            fft_window = torch.from_numpy(fft_window).float()
            forward_basis *= fft_window

        self.register_buffer("forward_basis", forward_basis)

    def _create_mel_filterbank(self):
        """Create mel filterbank matrix."""
        # Convert frequency limits to mel scale
        mel_min = self._hz_to_mel(self.f_min)
        mel_max = self._hz_to_mel(self.f_max)

        # Create linearly spaced mel frequencies
        mel_points = np.linspace(mel_min, mel_max, self.n_mels + 2)
        hz_points = self._mel_to_hz(mel_points)

        # Convert to FFT bin numbers
        bin_points = np.floor((self.n_fft + 1) * hz_points / self.sample_rate).astype(
            int
        )

        # Create filterbank
        filterbank = np.zeros((self.n_mels, self.cutoff))

        for i in range(self.n_mels):
            left = bin_points[i]
            center = bin_points[i + 1]
            right = bin_points[i + 2]

            # Left slope
            for j in range(left, center):
                if center != left:
                    filterbank[i, j] = (j - left) / (center - left)

            # Right slope
            for j in range(center, right):
                if right != center:
                    filterbank[i, j] = (right - j) / (right - center)

        # Normalize filters (optional)
        if self.normalized:
            # Slaney-style mel filterbank normalization
            enorm = 2.0 / (hz_points[2 : self.n_mels + 2] - hz_points[: self.n_mels])
            filterbank *= enorm[:, np.newaxis]

        self.register_buffer("mel_filterbank", torch.FloatTensor(filterbank))

    @staticmethod
    def _hz_to_mel(hz):
        """Convert frequency in Hz to mel scale."""
        return 2595.0 * np.log10(1.0 + hz / 700.0)

    @staticmethod
    def _mel_to_hz(mel):
        """Convert mel scale to frequency in Hz."""
        return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

    def _stft(self, waveform):
        """Compute STFT using convolution."""
        if self.center:
            waveform = F.pad(
                waveform.squeeze(-1) if waveform.dim() > 2 else waveform,
                (self.pad_amount, self.pad_amount),
                mode=self.pad_mode,
            )

        # Ensure waveform is 2D (batch_size, time)
        if waveform.dim() == 1:
            waveform = waveform.unsqueeze(0)

        # Apply STFT via convolution
        forward_transform = F.conv1d(
            waveform.unsqueeze(1) if waveform.dim() == 2 else waveform,
            self.forward_basis,
            stride=self.hop_length,
            padding=0,
        )

        # Split real and imaginary parts
        real = forward_transform[:, : self.cutoff, :]
        imag = forward_transform[:, self.cutoff :, :]

        return real, imag

    def forward(self, waveform):
        """
        Compute mel spectrogram from waveform.

        Args:
            waveform (torch.Tensor): Input waveform of shape (batch_size, time) or (time,)

        Returns:
            torch.Tensor: Mel spectrogram of shape (batch_size, n_mels, time_frames)
        """
        # Compute STFT
        real, imag = self._stft(waveform)

        # Compute magnitude spectrogram
        magnitude = torch.sqrt(real**2 + imag**2)

        # Apply power
        spectrogram = magnitude**self.power

        # Apply mel filterbank
        mel_spectrogram = torch.matmul(self.mel_filterbank, spectrogram)

        # Add small epsilon to avoid log(0)
        mel_spectrogram = torch.clamp(mel_spectrogram, min=1e-3)

        # Add channel dimension
        mel_spectrogram = mel_spectrogram.unsqueeze(1)

        return mel_spectrogram

    def forward_log(self, waveform):
        """
        Compute log mel spectrogram from waveform.

        Args:
            waveform (torch.Tensor): Input waveform of shape (batch_size, time) or (time,)

        Returns:
            torch.Tensor: Log mel spectrogram of shape (batch_size, n_mels, time_frames)
        """
        mel_spec = self.forward(waveform)
        return mel_spec.sub(1).log1p()

    def forward_db(self, waveform, ref=1.0, amin=1e-10, top_db=80.0):
        """
        Compute mel spectrogram in decibels.

        Args:
            waveform (torch.Tensor): Input waveform
            ref (float): Reference value for dB calculation
            amin (float): Minimum value to clamp spectrogram
            top_db (float): Threshold for maximum dB value

        Returns:
            torch.Tensor: Mel spectrogram in dB
        """
        mel_spec = self.forward(waveform)
        mel_spec_db = 20.0 * torch.log10(torch.clamp(mel_spec / ref, min=amin))

        if top_db is not None:
            mel_spec_db = torch.clamp(mel_spec_db, min=mel_spec_db.max() - top_db)

        return mel_spec_db


class InvertedResidual(nn.Module):
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: Union[int, Tuple[int, int]],
        stride: Union[int, Tuple[int, int]],
        expand_ratio: int,
        norm_layer: Optional[Callable[..., nn.Module]] = None,
    ) -> None:
        super().__init__()

        if norm_layer is None:
            norm_layer = nn.BatchNorm2d

        hidden_dim = int(round(in_channels * expand_ratio))
        self.use_res_connect = stride[-1] == 1 and in_channels == out_channels

        layers: List[nn.Module] = []
        if expand_ratio != 1:
            # pw
            layers.append(
                Conv2dNormActivation(
                    in_channels,
                    hidden_dim,
                    kernel_size=1,
                    norm_layer=norm_layer,
                    activation_layer=nn.ReLU6,
                )
            )
        layers.extend(
            [
                # dw
                Conv2dNormActivation(
                    hidden_dim,
                    hidden_dim,
                    kernel_size=kernel_size,
                    stride=stride,
                    groups=hidden_dim,
                    norm_layer=norm_layer,
                    activation_layer=nn.ReLU6,
                ),
                # pw-linear
                nn.Conv2d(hidden_dim, out_channels, 1, 1, 0, bias=False),
                norm_layer(out_channels),
            ]
        )
        self.conv = nn.Sequential(*layers)

    def forward(self, x: Tensor) -> Tensor:
        if self.use_res_connect:
            return x + self.conv(x)
        else:
            return self.conv(x)


class KWS(nn.Module):
    def __init__(
        self,
        layer_config: Optional[List[List[Union[int, Tuple[int, ...]]]]] = None,
        width_mult: float = 1.0,
        round_nearest: int = 8,
        norm_layer: Optional[Callable[..., nn.Module]] = None,
        sample_rate: int = 16000,
        n_fft: int = 2048,
        hop_length: Optional[int] = None,
        win_length: Optional[int] = None,
        n_mels: int = 128,
        rms: float = 0.3,
    ):
        super().__init__()
        self.rms = rms

        self.mel = MelSpectrogram(
            sample_rate=sample_rate,
            n_fft=n_fft,
            hop_length=hop_length,
            win_length=win_length,
            n_mels=n_mels,
        )

        if norm_layer is None:
            norm_layer = nn.BatchNorm2d

        if layer_config is None:
            self.layer_config = [
                # t, c, n, k, s
                [1, 32, 1, [3, 3], [2, 2]],
                [1, 16, 1, [3, 3], [1, 1]],
                [6, 24, 2, [3, 3], [2, 2]],
                [6, 32, 3, [3, 3], [2, 2]],
                [6, 64, 4, [3, 3], [2, 2]],
                [6, 96, 3, [3, 3], [1, 1]],
                [6, 160, 3, [3, 3], [2, 2]],
                [6, 320, 1, [3, 3], [1, 1]],
            ]
        else:
            self.layer_config = layer_config

        # building first layer
        _, in_channels, _, k, s = self.layer_config.pop(0)
        in_channels = _make_divisible(in_channels * width_mult, round_nearest)

        layers = [
            Conv2dNormActivation(
                in_channels=1,
                out_channels=in_channels,
                kernel_size=k,
                stride=s,
                norm_layer=norm_layer,
                activation_layer=nn.ReLU6,
            )
        ]

        # building inverted residual blocks
        for t, c, n, k, s in self.layer_config:
            out_channels = _make_divisible(c * width_mult, round_nearest)
            for i in range(n):
                stride = s if i == 0 else [1, 1]
                layers.append(
                    InvertedResidual(
                        in_channels=in_channels,
                        out_channels=out_channels,
                        kernel_size=k,
                        stride=stride,
                        expand_ratio=t,
                        norm_layer=norm_layer,
                    )
                )
                in_channels = out_channels

        # output layer
        layers += [
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(out_channels, 1),
        ]

        self.model = nn.Sequential(*layers)

    def forward(self, x):
        x = self.scale_waveform(x)
        x = self.mel.forward_log(x)
        x = self.scale_mel_spectrogram(x)
        x = self.model(x)
        return x

    def scale_waveform(self, x):
        current_rms = torch.sqrt(torch.mean(x**2, dim=(1, 2), keepdim=True))
        x = (x * self.rms / (current_rms.clamp(min=2e-2))).clamp(-1, 1)
        return x

    def scale_mel_spectrogram(self, x):
        x_min = x.amin(dim=(1, 2, 3), keepdim=True)
        x_max = x.amax(dim=(1, 2, 3), keepdim=True)
        return 2 * (x - x_min) / (x_max - x_min + 1e-8) - 1

    def forward_train(self, x):
        x = self.scale_waveform(x)
        x = self.mel.forward(x).log()
        x = self.scale_mel_spectrogram(x)
        x = self.model(x)
        return x


class Model(pl.LightningModule):
    def __init__(
        self,
        model: Any,
        optimizer: Dict[str, Any] = {
            "class_path": "torch.optim.AdamW",
            "init": {"lr": 1e-3},
        },
        lr_scheduler: Optional[Dict[str, Any]] = None,
    ):
        super().__init__()
        self.save_hyperparameters()
        self.model = model

    def _shared_step(self, batch, stage):
        waveform, target = batch
        predict = self.model.forward_train(waveform)
        loss = F.binary_cross_entropy_with_logits(predict, target)
        f1 = f1_score(predict.sigmoid(), target > 0.5, task="binary")
        self.log_dict(
            {
                f"{stage}_loss": loss,
                f"{stage}_f1": f1,
            },
            on_step=False,
            on_epoch=True,
            prog_bar=True,
            logger=True,
            sync_dist=True,
        )
        return loss

    def training_step(self, batch, batch_idx) -> torch.Tensor:
        """Training step."""
        return self._shared_step(batch, "train")

    def validation_step(self, batch, batch_idx) -> torch.Tensor:
        """Validation step."""
        return self._shared_step(batch, "val")

    def configure_optimizers(self):
        self.hparams.optimizer["init_args"] = self.hparams.optimizer.pop("init")
        optimizer = instantiate_class(self.parameters(), self.hparams.optimizer)
        if not self.hparams.lr_scheduler:
            return [optimizer]
        self.hparams.lr_scheduler["init_args"] = self.hparams.lr_scheduler.pop("init")
        lr_scheduler = instantiate_class(optimizer, self.hparams.lr_scheduler)
        scheduler_config = {
            "scheduler": lr_scheduler,
            "interval": "step",
            "frequency": 1,
        }
        return [optimizer], [scheduler_config]

    def on_before_optimizer_step(self, optimizer):
        # Compute the 2-norm for each layer
        # If using mixed precision, the gradients are already unscaled here
        norms = grad_norm(self.model, norm_type=2)
        self.log_dict(norms)

    def optimizer_zero_grad(self, epoch, batch_idx, optimizer):
        optimizer.zero_grad(set_to_none=True)
