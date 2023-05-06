"""Convert rowdata (json in rg-grid) to docx table(side by side)."""
# pylint: disable=invalid-name, no-member
import os
import sys
from pathlib import Path
from typing import Optional, Union

from docx import Document
from loguru import logger
from set_loglevel import set_loglevel

# if LOGURU_LEVEL is set use it
# otherwise set according to set_loglevel, default loglevel "INFO"/20
if os.environ.get("LOGURU_LEVEL") is None:
    logger.remove()
    logger.add(sys.stderr, level=set_loglevel())
pdir = Path(__file__).parent


def rowdata2docx_t(rowdata: dict, infilepath: Optional[Union[str, Path]]) -> str:
    """Convert rowdata (json in rg-grid) to docx table (side by side).

    Arguments:
        rowdata: [{"text1": ..., "text2": ...},  {"text1": ..., "text2": ...}, ]
        infilepath: input filepath, outfilepath = Path(infilepath).with_suffix('docx')

    Returns:
        save a doxc table (side by side)
        message f"saved to {outfilepath}"
    """
    # outfilepath = Path(infilepath).with_suffix(".docx")
    infilepath = Path(infilepath)
    stem = infilepath.stem
    outfilepath = infilepath.with_name(f"{stem}-t.docx")

    _ = Path(pdir, "templ_dual.docx")
    if _.exists():
        document = Document(_)
        logger.info(f"Using template {_}")
    else:
        logger.info(" no template found ")
        logger.info("(A template file dictates fonts, line spacing, margins, etc.)")
        document = Document()

    rows = len(rowdata)
    if not rows:
        logger.warning("No data in rowdata...")
        return "No data..."

    cols = len(rowdata[0])
    keys = [*rowdata[0]]  # ['text1', 'text2', 'text3']

    # chatgpt python code to generate docx table
    table = document.add_table(rows=rows, cols=cols)
    for i in range(rows):
        row_cells = table.rows[i].cells
        for j in range(cols):
            # row_cells[0].text = f'Row {i}, Cell 1'
            # row_cells[1].text = rowdata[i].get(keys[j], "")
            row_cells[j].text = rowdata[i][keys[j]]

    try:
        document.save(outfilepath)
        _ = f"\n\t Saved to {outfilepath}"
        logger.info(_)

        print(_)  # for python-shell process

        # write-permission problem: would this help?
        # del document
    except Exception as exc:
        _ = f" Failed to save {outfilepath}, exc: {exc}"
        logger.error(_)
        print(_)

    return _
