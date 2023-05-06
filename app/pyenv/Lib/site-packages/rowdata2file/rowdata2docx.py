"""Convert rowdata (json in rg-grid) to docx."""
# pylint: disable=invalid-name, no-member
import os
import sys
from pathlib import Path
from typing import Optional, Union

from docx import Document
from docx.enum.text import WD_COLOR_INDEX
from docx.shared import RGBColor
from loguru import logger
from set_loglevel import set_loglevel

# if LOGURU_LEVEL is set use it
# otherwise set according to set_loglevel, default loglevel "INFO"/20
if os.environ.get("LOGURU_LEVEL") is None:
    logger.remove()
    logger.add(sys.stderr, level=set_loglevel())
pdir = Path(__file__).parent


def rowdata2docx(rowdata: dict, infilepath: Optional[Union[str, Path]]) -> str:
    """Convert rowdata (json in rg-grid) to docx.

    Arguments:
        rowdata: [{"text1": ..., "text2": ...},  {"text1": ..., "text2": ...}, ]
        infilepath: input filepath, outfilepath = Path(infilepath).with_suffix('docx')

    Returns:
        message f"saved to {outfilepath}"

    """
    outfilepath = Path(infilepath).with_suffix(".docx")

    _ = Path(pdir, "templ_dual.docx")
    if _.exists():
        document = Document(_)
        logger.info(f"Using template {_}")
    else:
        logger.info(" no template found ")
        logger.info("(A template file dictates fonts, line spacing, margins, etc.)")
        document = Document()

    # def add_para(document, elm: str, color: bool = False, highlight: bool = True):
    def add_para(document, elm: str, color: bool = False, highlight_color=None):
        paragraph = document.add_paragraph()

        # remove leading and trailing spaces
        try:
            elm = elm.strip()
        except Exception as exc:
            logger.error(exc)

        run = paragraph.add_run(elm)
        font = run.font
        if highlight_color:
            # font.highlight_color = WD_COLOR_INDEX.GRAY_25  # pylint: disable=E1101
            # font.highlight_color = WD_COLOR_INDEX.WHITE  # pylint: disable=E1101  8
            font.highlight_color = highlight_color  # pylint: disable=E1101  8

            # https://www.rapidtables.com/web/color/Yellow_Color.html
            # lightyellow	#FFFFE0	rgb(255,255,224)
            # yellow	#FFFF00	rgb(255,255,0)
            # font.highlight_color = RGBColor(0xFF, 0xFF, 0xE0)  # does no work pylint: disable=E1101
        if color:
            font.color.rgb = RGBColor(0xFF, 0xFF, 0xE0)  # noqa

    for elm in rowdata:
        add_para(document, elm["text1"], False, WD_COLOR_INDEX.YELLOW)
        add_para(document, elm["text2"], False, False)

        if elm.get("text3"):  # WD_COLOR_INDEX.GRAY_25
            add_para(document, elm["text1"], False, WD_COLOR_INDEX.GRAY_25)

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
