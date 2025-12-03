{ pkgs, lib, config, ... }:

{
  languages = {
    javascript = {
      enable = true;
      npm.enable = true;
    };
    python = {
      enable = true;
      package = pkgs.python313;
      uv = {
        enable = true;
      };
    };
  };

  packages = with pkgs; [
    openssl
  ];

  enterShell = ''
    echo "Python version: $(python --version)"
    echo "uv version: $(uv --version)"
  '';
}

