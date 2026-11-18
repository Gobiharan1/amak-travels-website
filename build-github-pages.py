from pathlib import Path
import re
import shutil

source = Path(__file__).resolve().parent / 'dist'
target = Path(__file__).resolve().parent / 'pages-build'
prefix = '/amak-travels-website'
origin = 'https://gobiharan1.github.io' + prefix
if target.exists():
    shutil.rmtree(target)
shutil.copytree(source, target)
for page in target.rglob('*.html'):
    text = page.read_text().replace('https://amak-travels-sri-lanka.gobiharan.chatgpt.site', origin)
    text = re.sub(r'((?:href|src|data-photo)="|url=)/(?!/)', lambda match: match[1] + prefix + '/', text)
    page.write_text(text)
for stylesheet in target.glob('*.css'):
    stylesheet.write_text(stylesheet.read_text().replace("url('/assets/", "url('" + prefix + "/assets/"))
script = target / 'app.js'
script.write_text(script.read_text().replace("'/assets/", "'" + prefix + "/assets/").replace("details.href = '/'", "details.href = '" + prefix + "/'"))
sitemap = target / 'sitemap.xml'
sitemap.write_text(sitemap.read_text().replace('https://amak-travels-sri-lanka.gobiharan.chatgpt.site', origin))
(target / '.nojekyll').touch()
print('Prepared GitHub Pages at', target)
