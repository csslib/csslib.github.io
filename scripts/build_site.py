#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (C) 2026 Abhishek Sengar

import html
import json
import shutil
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SITE_SOURCE = REPO_ROOT / "site-src"
PAGES_SOURCE = SITE_SOURCE / "pages"
STATIC_SOURCE = SITE_SOURCE / "static"
OUTPUT_DIRECTORY = REPO_ROOT
PAGES_DIRECTORY_NAME = "site"
PAGES_DIRECTORY = OUTPUT_DIRECTORY / PAGES_DIRECTORY_NAME
ROOT_PAGES = {""}

SITE_URL = "https://csslib.github.io"
NAVIGATION_SECTIONS = ["atelier", "vektor", "learn", "about"]
CURRENT_PAGE_ATTRIBUTE = ' aria-current="page"'


def build_site():
    manifest = json.loads((SITE_SOURCE / "pages.json").read_text())
    layout = (SITE_SOURCE / "layout.html").read_text()
    pages = manifest["pages"]
    refuse_pages_outside_site_directory(pages)
    reset_pages_directory()
    for page in pages:
        write_page(page["path"], render_page(layout, page, read_page_body(page)))
    write_sitemap(pages + manifest.get("static_pages", []))
    write_robots()
    print(f"built {len(pages)} pages: index.html at the root, the rest in {PAGES_DIRECTORY_NAME}/")


def refuse_pages_outside_site_directory(pages):
    misplaced = [page["path"] for page in pages
                 if page["path"] not in ROOT_PAGES and not page["path"].startswith(f"{PAGES_DIRECTORY_NAME}/")]
    if misplaced:
        raise SystemExit(f"pages must live under {PAGES_DIRECTORY_NAME}/: {', '.join(misplaced)}")


def reset_pages_directory():
    if PAGES_DIRECTORY.exists():
        shutil.rmtree(PAGES_DIRECTORY)
    shutil.copytree(STATIC_SOURCE, PAGES_DIRECTORY, ignore=shutil.ignore_patterns(".DS_Store"))
    (OUTPUT_DIRECTORY / ".nojekyll").write_text("")


def read_page_body(page):
    return (PAGES_SOURCE / f"{page['source']}.html").read_text()


def render_page(layout, page, body):
    replacements = {
        "title": html.escape(page["title"]),
        "description": html.escape(page["description"]),
        "canonical": absolute_url(page["path"]),
        "og_type": page.get("og_type", "website"),
        "stylesheets": render_stylesheets(page.get("stylesheets", [])),
        "structured_data": render_structured_data(page.get("structured_data")),
        "main_class": render_main_class(page.get("main_class")),
        "content": body,
        "body_scripts": render_body_scripts(page.get("body_scripts", [])),
        "year": str(date.today().year),
    }
    replacements.update(render_navigation_state(page.get("section")))
    rendered = layout
    for key, value in replacements.items():
        rendered = rendered.replace("{{" + key + "}}", value)
    return rendered


def absolute_url(path):
    return f"{SITE_URL}/{path}"


def render_stylesheets(stylesheets):
    return "\n".join(f'  <link rel="stylesheet" href="{html.escape(href)}" />' for href in stylesheets)


def render_structured_data(structured_data):
    if not structured_data:
        return ""
    payload = json.dumps(structured_data, indent=2, ensure_ascii=False).replace("</", "<\\/")
    return f'<script type="application/ld+json">\n{payload}\n  </script>'


def render_main_class(main_class):
    return f' class="{html.escape(main_class)}"' if main_class else ""


def render_body_scripts(scripts):
    return "".join(f'\n  <script src="{html.escape(src)}" defer></script>' for src in scripts)


def render_navigation_state(current_section):
    return {
        f"current_{section}": CURRENT_PAGE_ATTRIBUTE if section == current_section else ""
        for section in NAVIGATION_SECTIONS
    }


def write_page(path, rendered):
    target = OUTPUT_DIRECTORY / path / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(rendered)


def write_sitemap(pages):
    entries = "".join(f"  <url><loc>{absolute_url(page['path'])}</loc></url>\n" for page in pages)
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries + "</urlset>\n")
    (PAGES_DIRECTORY / "sitemap.xml").write_text(sitemap)


def write_robots():
    (OUTPUT_DIRECTORY / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/{PAGES_DIRECTORY_NAME}/sitemap.xml\n"
    )


if __name__ == "__main__":
    build_site()
