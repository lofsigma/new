{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  buildInputs = [
    pkgs.rustc
    pkgs.nodejs-17_x
    pkgs.deno
  ];
  shellHook = ''
    # maybe set more env-vars
  '';
}