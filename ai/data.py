import functools
import random
import warnings
import torch
import librosa
import numpy as np
import lightning.pytorch as pl
from numpy.typing import NDArray
from scipy.signal import fftconvolve
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union
from torch import Tensor
from torch.utils.data import Dataset, DataLoader
from audiomentations import *
from audiomentations.core.audio_loading_utils import load_sound_file
from audiomentations.core.transforms_interface import BaseWaveformTransform
from audiomentations import Compose
from audiomentations.core.utils import (
    calculate_desired_noise_rms,
    calculate_rms,
    find_audio_files_in_paths,
)
from silero_vad import load_silero_vad, get_speech_timestamps

AddBackgroundNoise.__init__.__annotations__["noise_transform"] = Any


################################################################################


class AdjustDuration(BaseWaveformTransform):
    def __init__(self, duration_samples: int, p: float = 0.5):
        super().__init__(p)
        self.duration_samples = duration_samples

    def randomize_parameters(self, samples: NDArray[np.float32], sample_rate: int):
        super().randomize_parameters(samples, sample_rate)
        if self.parameters["should_apply"]:
            self.parameters["offset"] = np.random.randint(
                0, max(len(samples) - self.duration_samples, 1)
            )

    def apply(
        self, samples: NDArray[np.float32], sample_rate: int
    ) -> NDArray[np.float32]:
        sample_length = len(samples)
        if self.duration_samples > 0:
            if sample_length >= self.duration_samples:
                offset = self.parameters.get("offset", 0)
                return samples[offset : offset + self.duration_samples]
            else:
                # Pad to the end
                pad_width = self.duration_samples - sample_length
                return np.pad(samples, (0, pad_width), mode="constant")
        else:
            return samples


class JustNoise(BaseWaveformTransform):
    def __init__(
        self,
        sounds_path: Union[List[Path], List[str], Path, str],
        min_snr_db: Optional[float] = None,
        max_snr_db: Optional[float] = None,
        noise_transform: Optional[
            Callable[[NDArray[np.float32], int], NDArray[np.float32]]
        ] = None,
        p: float = 0.5,
        lru_cache_size: int = 2,
    ):
        super().__init__(p)
        self.sound_file_paths = find_audio_files_in_paths(sounds_path)
        self.sound_file_paths = [str(p) for p in self.sound_file_paths]

        assert len(self.sound_file_paths) > 0

        if min_snr_db is not None:
            self.min_snr_db = min_snr_db
        else:
            self.min_snr_db = 3.0  # the default

        if max_snr_db is not None:
            self.max_snr_db = max_snr_db
        else:
            self.max_snr_db = 30.0  # the default

        assert self.min_snr_db <= self.max_snr_db

        self._load_sound = functools.lru_cache(maxsize=lru_cache_size)(
            JustNoise._load_sound
        )
        self.noise_transform = noise_transform

    @staticmethod
    def _load_sound(file_path, sample_rate):
        return load_sound_file(file_path, sample_rate)

    def randomize_parameters(self, samples: NDArray[np.float32], sample_rate: int):
        super().randomize_parameters(samples, sample_rate)
        if self.parameters["should_apply"]:
            self.parameters["snr_db"] = random.uniform(self.min_snr_db, self.max_snr_db)
            self.parameters["noise_file_path"] = random.choice(self.sound_file_paths)

            num_samples = len(samples)
            noise_sound, _ = self._load_sound(
                self.parameters["noise_file_path"], sample_rate
            )

            num_noise_samples = len(noise_sound)
            min_noise_offset = 0
            max_noise_offset = max(0, num_noise_samples - num_samples - 1)
            self.parameters["noise_start_index"] = random.randint(
                min_noise_offset, max_noise_offset
            )
            self.parameters["noise_end_index"] = (
                self.parameters["noise_start_index"] + num_samples
            )

    def apply(self, samples: NDArray[np.float32], sample_rate: int):
        if self.are_parameters_frozen:
            return np.zeros_like(samples)

        noise_sound, _ = self._load_sound(
            self.parameters["noise_file_path"], sample_rate
        )
        noise_sound = noise_sound[
            self.parameters["noise_start_index"] : self.parameters["noise_end_index"]
        ]

        if self.noise_transform:
            noise_sound = self.noise_transform(noise_sound, sample_rate)

        noise_rms = calculate_rms(noise_sound)
        if noise_rms < 1e-9:
            warnings.warn(
                "The file {} is too silent to be added as noise. Returning the input"
                " unchanged.".format(self.parameters["noise_file_path"])
            )
            return samples

        clean_rms = calculate_rms(samples)

        desired_noise_rms = calculate_desired_noise_rms(
            clean_rms, self.parameters["snr_db"]
        )

        # Adjust the noise to match the desired noise RMS
        noise_sound = noise_sound * (desired_noise_rms / noise_rms)

        # Repeat the sound if it shorter than the input sound
        num_samples = len(samples)
        while len(noise_sound) < num_samples:
            noise_sound = np.concatenate((noise_sound, noise_sound))
        noise_sound = noise_sound[0:num_samples]

        # Return a mix of the input sound and the background noise sound
        return noise_sound

    def __getstate__(self):
        state = self.__dict__.copy()
        warnings.warn(
            "Warning: the LRU cache of AddBackgroundNoise gets discarded when pickling"
            " it. E.g. this means the cache will not be used when using"
            " AddBackgroundNoise together with multiprocessing on Windows"
        )
        del state["_load_sound"]
        return state


class ImpulseResponse(BaseWaveformTransform):
    def __init__(
        self,
        sounds_path: Union[List[Path], List[str], Path, str],
        p: float = 0.5,
    ):
        super().__init__(p)
        self.sound_file_paths = find_audio_files_in_paths(sounds_path)
        self.sound_file_paths = [str(p) for p in self.sound_file_paths]
        assert len(self.sound_file_paths) > 0

    def randomize_parameters(self, samples: NDArray[np.float32], sample_rate: int):
        super().randomize_parameters(samples, sample_rate)
        if self.parameters["should_apply"]:
            self.parameters["ir_file_path"] = random.choice(self.sound_file_paths)

    def apply(
        self, samples: NDArray[np.float32], sample_rate: int
    ) -> NDArray[np.float32]:
        # Convolve the input signal with the impulse response
        ir, _ = load_sound_file(self.parameters["ir_file_path"], sample_rate)
        reverb_samples = fftconvolve(samples, ir, mode="full")
        reverb_samples = reverb_samples[: len(samples)]

        # Compute RMS of input and output signals
        input_rms = np.sqrt(np.mean(samples**2))
        output_rms = np.sqrt(np.mean(reverb_samples**2))

        # Avoid division by zero in case output_rms is zero
        if output_rms > 0:
            scaling_factor = input_rms / output_rms
        else:
            scaling_factor = 1.0  # No scaling if the output RMS is zero

        # Scale the output signal to match input RMS
        reverb_samples = reverb_samples * scaling_factor

        # Clip to ensure values remain in the [-1.0, 1.0] range
        reverb_samples = reverb_samples.clip(-1.0, 1.0)
        return reverb_samples


class ToTensor(BaseWaveformTransform):
    def __init__(self, p: float = 1.0):
        super().__init__(p)

    def apply(self, samples: NDArray[np.float32], sample_rate: int) -> Tensor:
        return torch.FloatTensor(samples).unsqueeze(0)


class KWSDataset(Dataset):
    def __init__(
        self,
        sounds_path: Union[List[Path], List[str], Path, str],
        sampling_rate: int,
        transforms: Compose,
    ):
        super().__init__()
        self.sounds_path = find_audio_files_in_paths(sounds_path)
        self.sampling_rate = sampling_rate
        self.transforms = transforms
        self._vad_model = load_silero_vad()

    def _get_target(self, waveform: Tensor, original_waveform: Tensor) -> Tensor:
        def get_first_duration(timestamps):
            if timestamps:
                ts = timestamps[0]
                return ts["end"] - ts["start"]
            return None

        speech_duration = get_first_duration(
            get_speech_timestamps(waveform, self._vad_model)
        )
        original_duration = get_first_duration(
            get_speech_timestamps(original_waveform, self._vad_model)
        )

        if speech_duration is not None and original_duration and original_duration > 0:
            target = speech_duration / original_duration
            target = target if target >= 0.7 else 0.0
        else:
            target = 0.0

        return torch.FloatTensor([target]).clamp(0.0, 1.0)

    def __len__(self) -> int:
        return len(self.sounds_path)

    def __getitem__(self, index: int) -> Dict[str, Tensor]:
        path = self.sounds_path[index]
        waveform, _ = librosa.load(path, sr=self.sampling_rate)

        input = self.transforms(samples=waveform, sample_rate=self.sampling_rate)

        self.transforms.freeze_parameters()
        for t in self.transforms.transforms:
            if t.__class__.__name__ not in [
                "TimeStretch",
                "AdjustDuration",
                "ToTensor",
            ]:
                t.parameters["should_apply"] = False
        target_waveform = self.transforms(
            samples=waveform, sample_rate=self.sampling_rate
        )
        original_waveform = self.transforms.transforms[0](waveform, self.sampling_rate)
        target = self._get_target(target_waveform, original_waveform)
        self.transforms.unfreeze_parameters()

        return input, target


class DataModule(pl.LightningDataModule):
    def __init__(
        self,
        train_dataset: Optional[KWSDataset] = None,
        val_dataset: Optional[KWSDataset] = None,
        batch_size: int = 8,
        val_batch_size: int = 8,
        num_workers: int = 4,
        prefetch_factor: int = 2,
    ):
        super().__init__()
        self.save_hyperparameters()
        self.train_dataset = train_dataset
        self.val_dataset = val_dataset

    def prepare_data(self):
        pass

    def setup(self, stage: str):
        pass

    def train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=True,
            num_workers=self.hparams.num_workers,
            # pin_memory=True,
            # persistent_workers=True,
            # prefetch_factor=self.hparams.prefetch_factor,
        )

    def val_dataloader(self):
        return DataLoader(
            self.val_dataset,
            batch_size=self.hparams.val_batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
            # pin_memory=True,
            # persistent_workers=True,
            # prefetch_factor=self.hparams.prefetch_factor,
        )
