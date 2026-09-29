# Folio cutout for both appearances

September29 UI audit found the original dark-background illustration produced an opaque rectangle on light product pages. Built-in ImageGen edited the existing `RilloraFolio` illustration to true alpha; source retained at the generated-image location and the prior JPEG remains in history/assets. This is a background adaptation, not a new brand or feature. Native/Web share this selected derivative. No third-party logo or new dependency. Both theme composites were inspected in Web and native. The first native fill crop was corrected to fit the whole image.


- Source: existing native `RilloraFolio.imageset/rillora-folio.jpg`.
- Edit brief: remove the solid dark background, preserving folio material, colors,
  geometry and the three card pictograms; output real alpha.
- Master: `folio-cutout.png`,1254×1254RGBA. Both shipped exports are768×768RGBA.
- ImageGen output is a derivative of this project’s existing generated artwork;
  no third-party platform marks, personal information or credential content.
- Current visual evidence: `output/qa/rillora-ui-ux-audit-20260929/screens/`.
