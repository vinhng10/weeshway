import torch
from lightning.pytorch.cli import LightningCLI

from models import Model
from data import DataModule


def cli_main():
    cli = LightningCLI(
        Model,
        DataModule,
        save_config_kwargs={"overwrite": True},
        parser_kwargs={"parser_mode": "yaml"},
    )


if __name__ == "__main__":
    torch.set_float32_matmul_precision("high")
    cli_main()
