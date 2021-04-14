Useful imagemagick command to create the transparent version.

```
convert logo-basic-large-non-trans.png alpha-all-in.png -compose copy-opacity -composite logo-basic-rgba-2048.png
```