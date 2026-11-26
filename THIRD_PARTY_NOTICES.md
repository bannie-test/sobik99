# Sources and third-party notices

- CFOP algorithms: commonly used speedcubing algorithms (labeled "Hiện đại"); Luke Jackson, [Cube Coach](https://github.com/lukejacksonn/cube), `src/algorithms.ts` (README declares MIT); and the SOBIK Android algorithm library. Algorithm move sequences are facts; every one is verified by the SOBIK99 cube engine and filed under the case it actually solves. Vietnamese explanations, diagrams and the solver are authored for SOBIK99.
- Cubing.js 0.66.1: https://github.com/cubing/cubing.js, MPL-2.0. Used unchanged for random-state scrambles, the two-phase short solver, and interactive 3D playback. License: https://github.com/cubing/cubing.js/blob/main/LICENSE.md.
- [MediaPipe Tasks Vision 1.2.3](https://github.com/google-ai-edge/mediapipe) and the [Hand Landmarker Full float16 v1 model](https://huggingface.co/litert-community/MediaPipe-HandLandmarker-Full) by Google run hand tracking on the device. Both are distributed unchanged under [Apache License 2.0](public/licenses/mediapipe-apache-2.0.txt). The [model bundle from Google](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task) has SHA-256 `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`.
- Vite: MIT, https://github.com/vitejs/vite.
- Catalog: model names are public product information. Brand logos are grey placeholders until logo images are added under `public/` (set `logo` in `src/data/brands.js`). Product images, when added, belong to their owners and are credited per product (`imageCredit` in each `info.json`, listed on the Sources page). No prices, orders or review scores are shown.
- History: https://rubiks.com/history and https://www.moma.org/collection/works/2908.
- The orbital interaction was adapted from the HTML supplied by the user.

Trademarks remain the property of their owners. This personal educational site does not process orders, payments, or shipments.

- Xưởng Rubik hand and arm geometry and skin weights are adapted from the [MakeHuman 1.3.0 base mesh](https://github.com/makehumancommunity/makehuman/blob/v1.3.0/makehuman/data/3dobjs/base.obj) and [default rig](https://github.com/makehumancommunity/makehuman/tree/v1.3.0/makehuman/data/rigs), released under CC0 1.0 by Data Collection AB, Joel Palmius and Jonas Hauquier. SOBIK99 crops the mesh to both arms and combines the twist-bone weights with the corresponding limb bones.
