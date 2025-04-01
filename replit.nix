{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.jq
    pkgs.glibcLocales
    pkgs.libxcrypt
    pkgs.remind
    pkgs.vim
  ];
}
