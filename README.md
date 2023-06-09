# deeplx-tr-electron
[![DeepScan grade](https://deepscan.io/api/teams/19673/projects/23765/branches/725180/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=19673&pid=23765&bid=725180) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

deepl translate using deeplx-tr-node, electron, svelte and ag-grid

## WIP

## Features
  * Translate between various languages pairs (select a target language from Options)
  * Built-in editor
  * (new) Save translated text only (menu/Save(trtxt))
  * Save .csv and .docx (topdown and side-by-side)
    * topdown format: source text highlighted, ready for one-click-hide

    * side-by-side format: a two-column table
![docx](https://raw.githubusercontent.com/ffreemt/deepl-tr-electron/main/data/docx.png)
 ![docxtable](https://raw.githubusercontent.com/ffreemt/deepl-tr-electron/main/data/docx-t.png)

## Installation (currently Windows only)
Download from [https://github.com/ffreemt/deeplx-tr-electron/releases](https://github.com/ffreemt/deeplx-tr-electron/releases) and click through.

## Usuage

* Execute the app as usual
* Click a cell or press Enter to edit; Click some other cell or press Enter to exit editing.
* ctrl-T to translate or click menu File/DeeplTr

## For Developers

* Clone the repo `git clone https://github.com/ffreemt/deeplx-tr-electron-svelte && cd deeplx-tr-electron-svelte`
* Run `npm install`
* [python runtime in pyenv (`pip install rowdata2file`) already in place.]
* `npm run electron:dev`

Note: for those who prefer `yarn`, `yarn` does not seem to quite work.
