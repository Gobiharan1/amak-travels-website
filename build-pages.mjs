import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { renderRouteMap } from './route-map.mjs';

const path = name => new URL(name, import.meta.url);
const read = name => readFileSync(path(name), 'utf8');
const home = read('content/home.html');
const content = JSON.parse(read('content/pages.json'));
const itineraries = JSON.parse(read('content/itineraries.json'));
const expanded = JSON.parse(read('content/ramayana-details.json'));
const coastline = JSON.parse(read('content/coastline.json'));
const routeData = JSON.parse(read('content/route-stops.json'));
const routes = new Map(routeData.routes.map(([slug, ...route]) => [slug, route]));
const place = key => {
  const [name, lat, lon, photo] = routeData.places[key];
  return { key, name, lat, lon, photo };
};
const tours = runInNewContext(read('dist/tours.js') + '\ntours');
const e = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const url = slug => '/' + slug + '/';
const image = name => '/assets/' + name + '.webp';
const official = 'https://amaktravels.com';
const trip = '/tailor-made-tours-2/';
const siteOrigin = (process.env.AMAK_SITE_ORIGIN || 'https://amak-travels-sri-lanka.gobiharan.chatgpt.site').replace(/\/$/, '');
const publishedPages = [];
const org = {
  '@type': 'TravelAgency', '@id': siteOrigin + '/#amak', name: 'AMAK Travels',
  url: siteOrigin + '/', email: 'info@amaktravels.com', telephone: '+94710857333',
  address: {'@type':'PostalAddress', streetAddress:'77/2 Sirimalwatta, Lewellagama', addressLocality:'Gunnepana', addressCountry:'LK'},
  sameAs: [official + '/', 'https://www.instagram.com/amaktravels/'],
};
function metadataFor(slug, title, summary, photo = 'hero', structured = []) {
  const pageUrl = siteOrigin + (slug ? url(slug) : '/');
  const schema = JSON.stringify({'@context':'https://schema.org', '@graph':[org, ...structured]}).replaceAll('<', '\\u003c');
  return head.replace('</head>', `<link rel="canonical" href="${e(pageUrl)}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(summary)}">
<meta property="og:image" content="${e(siteOrigin + image(photo))}">
<meta property="og:url" content="${e(pageUrl)}">
<script type="application/ld+json">${schema}</script>
</head>`);
}
const categories = {
  'round-tours': ['round-tours', 'Round tours', 'Multi-day routes across Sri Lanka, from the Cultural Triangle to the coast.', 'hero'],
  'day-tours': ['day-tour', 'Day tours', 'Discover Kandy and the central highlands on a day trip.', 'falls'],
  ramayana: ['ramayana-tours-sri-lanka', 'Ramayana tours', 'Private pilgrimages through Sri Lanka’s temples, hills and coast.', 'heritage'],
  perahera: ['perahera-tour-pakages', 'Kandy Esala Perahera', 'Explore festival seating options and ask about current dates and availability.', 'festival'],
};
const navigation = [
  ['tour-packages', 'Tour packages'],
  ['about-us', 'About us'],
  ['gallery', 'Gallery'],
  ['discover', 'Discover'],
  ['tailor-made-tours-2', 'Itinerary Planner'],
  ['contact-us', 'Contact Us'],
];

const head = home.slice(0, home.indexOf('</head>') + 7)
  .replace('href="assets/', 'href="/assets/')
  .replace('href="style.css"', 'href="/style.css"')
  .replace('</head>', '<link rel="stylesheet" href="/design.css">\n</head>')
  .replace('<script src="app.js" defer>', '<script src="/tours.js" defer></script>\n<script src="/app.js" defer>');
const brand = '<a class="brand" href="/" aria-label="AMAK Travels home"><img src="/assets/logo.webp" alt=""><span>AMAK<small>TRAVELS</small></span></a>';
const footer = `<footer class="footer"><div class="wrap footer-inner">${brand}
  <p class="footer-title">Explore Sri Lanka.<br>Make it your own.</p>
  <p>© <span id="year">2026</span> AMAK Travels</p>
  <nav aria-label="Footer"><a href="/tailor-made-tours-2/">Itinerary Planner</a><a href="/contact-us/">Contact Us</a><a href="https://www.instagram.com/amaktravels/">Instagram</a><a href="/privacy-policy-amak-travel/">Privacy</a><a href="/terms-conditions-amak-travels/">Terms</a><a href="/refund-cancellation-policy-amak-travels/">Cancellation policy</a></nav>
</div><p class="wrap photo-credit">Sigiriya aerial photograph by dronepicr, resized. <a href="https://commons.wikimedia.org/wiki/File:Sigiriya_rock_aerial_(29448588523).jpg">Source</a> · <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a></p></footer>`;
const galleryDialog = `<dialog id="gallery-dialog" aria-label="Guest photo"><button class="close" aria-label="Close photo" type="button">×</button><img id="gallery-photo" alt=""><div class="gallery-controls"><button type="button" data-gallery-step="-1" aria-label="Previous photo">←</button><span aria-live="polite" id="gallery-position"></span><button type="button" data-gallery-step="1" aria-label="Next photo">→</button></div></dialog>`;
const form = home.match(/<form id="enquiry"[\s\S]+?<\/form>/)[0];
const galleryButton = (src, alt) => `<button type="button" data-photo="${src}" aria-label="Enlarge ${e(alt)}"><img src="${src}" loading="lazy" alt="${e(alt)}"></button>`;
const enquiry = (slug, label = 'Enquire about this tour') => `<a class="button" href="${trip}${slug ? '?tour=' + encodeURIComponent(slug) : ''}#plan">${e(label)} <span aria-hidden="true">↗</span></a>`;

function header(active, overlay = false) {
  return `<header class="header${overlay ? ' header-overlay' : ''}" id="top"><div class="wrap utility"><a href="mailto:info@amaktravels.com">info@amaktravels.com</a><a href="tel:+94710857333">Call us</a><a href="https://wa.me/94710857333">WhatsApp</a></div><div class="wrap header-inner">${brand}
    <button class="menu" aria-expanded="false" aria-controls="navigation" type="button">Menu <span aria-hidden="true">☰</span></button>
    <nav id="navigation" aria-label="Main navigation"><a href="/">Home</a>${navigation.map(([slug, label]) => `<a href="${url(slug)}"${active === slug ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <a class="button header-cta" href="${trip}"${active === 'tailor-made-tours-2' ? ' aria-current="page"' : ''}>Start planning <span aria-hidden="true">↗</span></a>
  </div></header>`;
}

function write(slug, html) {
  const target = path('dist/' + (slug ? slug + '/' : ''));
  mkdirSync(target, { recursive: true });
  writeFileSync(new URL('index.html', target), html);
}

function page(slug, title, summary, body, { photo, parent, label, active = slug, gallery = false, structured = [] } = {}) {
  publishedPages.push(slug);
  const breadcrumbs = [['Home', '/'], ...(parent ? [[parent[1], url(parent[0])]] : []), [title, url(slug)]];
  const breadcrumbSchema = {'@type':'BreadcrumbList', itemListElement: breadcrumbs.map(([name, href], i) => ({
    '@type':'ListItem', position:i+1, name, item:siteOrigin + href,
  }))};
  const metadata = metadataFor(slug, title, summary, photo, [breadcrumbSchema, ...structured]).replace(/<title>.*?<\/title>/, `<title>${e(title)} | AMAK Travels</title>`)
    .replace(/(<meta name="description" content=")[^"]+/, (_, start) => start + e(summary));
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a>${parent ? `<span aria-hidden="true">/</span><a href="${url(parent[0])}">${e(parent[1])}</a>` : ''}<span aria-hidden="true">/</span><span aria-current="page">${e(title)}</span></nav>`;
  const intro = `<section class="page-hero${photo ? ' scenic' : ' compact'}">${photo ? `<img src="${image(photo)}" alt="" fetchpriority="high">` : ''}
    <div class="wrap">${crumbs}${label ? `<p class="eyebrow"><span></span>${e(label)}</p>` : ''}
      <h1>${e(title)}</h1><p class="intro">${e(summary)}</p></div></section>`;
  write(slug, `${metadata}
<body><a class="skip" href="#main">Skip to content</a>${header(active, Boolean(photo))}
<main id="main">${intro}${body}</main>
${footer}${gallery ? galleryDialog : ''}</body></html>\n`);
}

function cards(items, category = '') {
  return `<div class="cards">${items.map(([title, kind, photo, summary, slug]) => `
    <article class="card" data-duration="${parseInt(kind,10) || (kind.startsWith('Evening') ? 1 : 0)}" data-experience="${e(category)}"><img src="${image(photo)}" alt="" loading="lazy"><div class="card-body">
    <p class="eyebrow accent">${e(kind.toUpperCase())}</p><h3>${e(title)}</h3><p>${e(summary)}</p>
    <a class="text-link" href="${url(slug)}" aria-label="View tour: ${e(title)}">View tour <span aria-hidden="true">↗</span></a></div></article>`).join('')}</div>`;
}

function catalogLinks(active) {
  return `<nav class="catalog-links" aria-label="Tour categories">${Object.values(categories).map(([slug, title]) =>
    `<a href="${url(slug)}"${slug === active ? ' aria-current="page"' : ''}>${e(title)}</a>`).join('')}</nav>`;
}

function contactDetails() {
  return `<address><a href="https://wa.me/94710857333">WhatsApp AMAK Travels ↗</a>
    <a href="tel:+94778711641">+94 77 871 1641</a><a href="tel:+94710857333">+94 71 085 7333</a>
    <a href="mailto:info@amaktravels.com">info@amaktravels.com</a>
    <p>No. 77/2 Sirimalwatta, Lewellagama,<br>Gunnepana, Sri Lanka</p></address>`;
}

const homeGallery = home.match(/<section class="section wrap" id="gallery">[\s\S]+?<\/section>/)[0]
  .replace('https://amaktravels.com/gallery/', '/gallery/');
const homeBody = `
  <section class="hero cinematic torn-after">
    <img class="hero-photo" src="/assets/hero.webp" alt="" fetchpriority="high">
    <div class="wrap cinematic-inner"><div class="cinematic-caption">
      <p class="eyebrow">PRIVATE &amp; TAILOR-MADE SRI LANKA TOURS</p>
      <h1>Discover Sri Lanka<br><em>your own way.</em></h1>
    </div><div class="cinematic-side"><p>From hill-country trails to the southern coast, build a holiday around the places and experiences you came for.</p>
      <a class="button paper-button" href="/tour-packages/">Explore tours <span aria-hidden="true">↗</span></a></div>
    <div class="hero-bottom"><p>Sigiriya, Sri Lanka</p></div></div>
  </section>
  <section class="welcome paper-intro" id="about">
    <div class="wrap"><div class="intro-title"><h2>Find your<br><em>perfect trip.</em></h2>
    <div><p>AMAK Travels is based in Sri Lanka’s Central Province. Explore Kandy with us for a day or ask our team to design an island-wide itinerary.</p>
    <a class="text-link" href="/about-us/">About AMAK Travels ↗</a></div></div>
    <figure><img src="/assets/postcard.webp" loading="lazy" alt="Sunlit hills in Sri Lanka’s Central Highlands"><figcaption>Central Highlands, Sri Lanka</figcaption></figure></div>
    <div class="paper-trail"><div class="wrap"><a href="/discover/">Culture</a><a href="/day-tour/">Highland adventures</a><a href="/round-tours/">Round tours</a><a href="${trip}">Tailor-made trips</a></div></div>
  </section>
  <section class="paper-packages torn-before torn-after" id="tours"><div class="section wrap">
    <div class="section-head"><div><p class="eyebrow">TOUR PACKAGES</p><h2>Adventure across<br>the island</h2></div><a class="button paper-button" href="/tour-packages/">View all tours ↗</a></div>
    <div class="filters" role="group" aria-label="Tour categories">${Object.entries(categories).map(([key,[,label]],i)=>`<button type="button" data-category="${key}" aria-pressed="${i===0}">${e(label)}</button>`).join('')}</div>
    <div id="tour-grid" class="cards"></div><noscript><p><a href="/tour-packages/">Browse the tour catalogue</a></p></noscript>
  </div></section>
  <section class="experience-section"><div class="wrap interior">
    <div class="center-heading"><h2>Outdoors, on the coast,<br><em>or in the city.</em></h2></div>
    <div class="experience-grid">${Object.values(categories).map(([slug,title,summary,photo]) => `<a href="${url(slug)}"><img src="${image(photo)}" alt="" loading="lazy"><span>${e(title)} <b aria-hidden="true">↗</b></span></a>`).join('')}</div>
  </div></section>
  <section class="destination-strip"><div class="wrap interior"><div class="section-head"><div><p class="eyebrow"><span></span> DISCOVER SRI LANKA</p><h2>Explore Kandy</h2></div><a class="text-link" href="/discover/">Discover more ↗</a></div>
  <div class="experience-grid destinations">${content.discover.map(([title,photo,,,],i)=>`<a href="/discover/#place-${i+1}"><img src="${image(photo)}" alt="" loading="lazy"><span>${e(title)} <b aria-hidden="true">↗</b></span></a>`).join('')}</div></div></section>
  ${homeGallery}
  <section class="trip-banner"><div class="wrap"><div><p class="eyebrow">TAILOR-MADE TOURS</p><h2>Let’s plan your Sri Lanka</h2></div><a class="button gold" href="${trip}">Plan my trip ↗</a></div></section>`;
write('', `${metadataFor('', 'Sri Lanka Tours | AMAK Travels', 'Private Sri Lanka tours, day trips from Kandy and tailor-made itineraries.') }<body><a class="skip" href="#main">Skip to content</a>${header(undefined, true)}
<main id="main">${homeBody}</main>${footer}${galleryDialog}</body></html>\n`);

function tourFilter(active = '') {
  const choices = Object.entries(categories).filter(([key]) => !active || active === key).map(([key,[, title]]) => `<option value="${key}"${key===active ? ' selected' : ''}>${e(title)}</option>`).join('');
  const durations = [1, 2, 7, 8, 9, 11, 15].map(days => `<option value="${days}">${days} ${days === 1 ? 'day' : 'days'}</option>`).join('');
  return `<div class="catalog-filter" data-tour-filter>
    <label>Tour experience<select name="experience">${active ? choices : '<option value="">All experiences</option>'+choices}</select></label>
    <label>Duration<select name="duration"><option value="">Any duration</option>${durations}<option value="0">Seasonal</option></select></label>
    <label>Search tours<input name="search" type="search" placeholder="Tour name or destination"></label>
    <button class="text-link" type="button" data-reset>Clear filters</button>
  </div><p class="results" data-results aria-live="polite"></p>`;
}

page('tour-packages', 'Find Your Journey', 'Round tours, day trips, pilgrimages and festival experiences across Sri Lanka.',
  `<div class="wrap interior catalog-layout">${catalogLinks()}<div class="center-heading"><p class="eyebrow accent">AMAK TRAVELS TOUR PACKAGES</p><h2>Explore Sri Lanka your way</h2></div>
  ${tourFilter()}${Object.entries(categories).map(([key, [slug, title]]) => `
  <section class="catalog-section" data-tour-group><div class="section-head"><h2>${e(title)}</h2><a class="text-link" href="${url(slug)}">View category ↗</a></div>
  ${cards(key === 'perahera' ? tours[key].slice(1) : tours[key], key)}</section>`).join('')}
  <p data-empty hidden>No tours match those filters.</p></div>`, { photo: 'hero', active: 'tour-packages' });

for (const [key, [slug, title, summary, photo]] of Object.entries(categories)) {
  const festival = key === 'perahera' ? `<section class="reading"><h2>Watching the procession</h2>
  <p>The Kandy Esala Perahera brings processions, Kandyan dance and drumming to the streets around the Temple of the Tooth. Ask AMAK about current dates, reserved seating, transport and accommodation.</p></section>` : '';
  page(slug, title, summary, `<div class="wrap interior catalog-layout">${catalogLinks(slug)}${festival}
    ${tourFilter(key)}<section class="catalog-section" data-tour-group>${cards(key === 'perahera' ? tours[key].slice(1) : tours[key], key)}</section><p data-empty hidden>No tours match those filters.</p></div>`,
  { photo, parent: ['tour-packages', 'Tour packages'], active: 'tour-packages' });
}

const festivalNotes = {
  'premium-package-final-randoli-perahera': 'This package focuses on the final Randoli procession. Ask for the current viewing location, seating arrangements and transport options.',
  'medium-package-randoli-perahera': 'AMAK’s previous medium package featured front-row seating at Kings Kandy. Confirm the current venue, procession and inclusions with the team.',
  'standard-package-final-randoli-perahera': 'Ask about standard seating and which procession dates are available for your stay in Kandy.',
};
const details = {
  'knuckles-1-day-waterfall-tour': ['Hotel pickup and return in Kandy', 'Waterfalls, short walks and a picnic lunch'],
  'pekoe-trail-experience-stage-1-hanthana-to-galaha': ['Approximately 13 km', 'Trail from Hanthana to Galaha'],
  'pekoe-trail-stage-2-galaha-to-loolkandura-hike': ['Approximately 14.8 km', 'Trail from Galaha to Loolkandura'],
  'two-day-hiking-camping-kandy': ['Kandy pickup and return', 'Guide, permits and camping equipment'],
  'sacred-7-ramayana-tour-sri-lanka': ['Seven nights, with airport transfers', 'Ask about guide language, hotel category and dietary needs'],
  'classic-ramayana-odyssey-sri-lanka': ['Ten nights, with airport transfers', 'Ask about guide language, hotel category and optional stops'],
  'ultimate-ramayana-expedition-sri-lanka': ['Fourteen nights across Sri Lanka', 'Specialist access and permits depend on confirmation'],
};

const photoCaptions = {
  colombo:'The Lotus Tower in Colombo', coast:'Sri Lankan coast (illustrative)', mirissa:'Southern coast (illustrative)',
  galoya:'Wildlife in Sri Lanka (illustrative)', gartmore:'Sri Lanka’s hill country (illustrative)', about:'Central Highlands scenery',
  'kandy-day':'Kandy Lake and the surrounding hills', pinnawala:'Elephants in Pinnawala',
  'ella-day':'Train passing through Sri Lanka’s hill country', galle:'Colonial architecture in Sri Lanka (illustrative)',
  puna:'Hill-country waterfall (illustrative)', waterfall:'Waterfall in Sri Lanka (illustrative)',
  sigiriya:'Aerial view near Sigiriya', upper:'A Sri Lankan leopard (illustrative)',
  heritage:'Temple architecture in Kandy (illustrative)', trail:'Tea country walking trail (illustrative)',
  tower:'Sri Lankan hill-country waterfall (illustrative)', trek:'Hiking in the Central Highlands (illustrative)',
  falls:'Alakola Ella waterfall (illustrative for stops elsewhere)', night:'Temple of the Tooth at night',
  festival:'Perahera illustration'
};
const packageInclusions = {
  'knuckles-1-day-waterfall-tour':['Private vehicle and English-speaking guide','Picnic lunch and bottled water','Listed entrance fees and permits'],
  'kandy-heritage-temple-day-tour':['Private transport and Kandy hotel pickup and drop-off','English-speaking guide','Listed entrance fees, permits and bottled water'],
  'budget-tuk-tuk-kandy-tour':['Full-day tuk-tuk and English-speaking guide','Lunch at Helabojun and tea tasting at Hanthana','Listed garden and Temple of the Tooth entries'],
  'ambuluwawa-ramboda-falls-day-tour-from-kandy':['Kandy-area transfers and English-speaking driver or guide','Ambuluwawa entry','Lunch at a local restaurant'],
  'one-day-hiking-camping-kandy-knuckles-adventures':['English-speaking guide and hotel transfers','Water and a snack','Entry tickets where applicable'],
  'one-day-hiking-camping-kandy-knuckles-adventures-five-peaks':['English-speaking guide and hotel transfers','Water and a snack','Entry tickets where applicable'],
  'pekoe-trail-experience-stage-1-hanthana-to-galaha':['Naturalist guide and transfers from Kandy','Listed permits and entry fees','Water and light refreshments'],
  'pekoe-trail-stage-2-galaha-to-loolkandura-hike':['Naturalist guide and transfers from Kandy','Listed permits and entry fees','Water and light refreshments'],
  'temple-of-the-tooth-pinnawala-elephant-day-tour':['Temple of the Tooth entry','Kandy transfers, driver or guide, and refreshments'],
  'kandy-night-tour-experience':['Kandy pickup and drop-off and an English-speaking guide','Listed boat outing, dance show and Temple of the Tooth tickets'],
  'classic-ramayana-odyssey-sri-lanka':['Private transport and airport transfers','Ten nights of bed-and-breakfast accommodation','Confirmed temple and site entries'],
  'ultimate-ramayana-expedition-sri-lanka':['Private transport and airport transfers','Fourteen nights of selected accommodation','Site entry and specialist access where confirmed'],
  'two-day-hiking-camping-kandy':['Guide and camping equipment','Round-trip transport from Kandy','Permits, water and snacks'],
  'sacred-7-ramayana-tour-sri-lanka':['Private vehicle with a guide or chauffeur-guide','Seven nights of bed-and-breakfast accommodation','Airport transfers and temple entry fees as listed in the confirmed quote'],
  'amak-travels-budget-round-tour-sri-lanka-2':['Six nights with breakfast','Private vehicle with driver','Airport pickup and drop-off'],
};

const packageExclusions = {
  'knuckles-1-day-waterfall-tour':['Alcoholic drinks, tips and personal expenses'],
  'two-day-hiking-camping-kandy':['Meals unless arranged as an add-on'],
  'kandy-heritage-temple-day-tour':['Lunch, tips and personal expenses'],
  'budget-tuk-tuk-kandy-tour':['Drinks, snacks, tips and optional donations'],
  'pekoe-trail-stage-2-galaha-to-loolkandura-hike':['Lunch'],
  'kandy-night-tour-experience':['Dinner, tips and personal expenses'],
  'sacred-7-ramayana-tour-sri-lanka':['International flights, visa fees, travel insurance and personal expenses','Lunch and dinner unless specified'],
  'classic-ramayana-odyssey-sri-lanka':['Flights, visa fees, insurance and personal expenses','Meals and optional activities unless included in the quote'],
  'ultimate-ramayana-expedition-sri-lanka':['Flights, visa fees, insurance and personal expenses','Unconfirmed boat trips, ceremonies and extensions'],
};

for (const [key, items] of Object.entries(tours)) {
  const [parent, parentTitle] = categories[key];
  for (const [title, kind, photo, summary, slug] of items) {
    if (slug === parent) continue;
    const [stages, start = [], finish = []] = routes.get(slug);
    const steps = itineraries[slug] ?? content.fallback[slug]?.map((name, i) => [name, expanded[slug][i]]) ??
      [['Perahera viewing in Kandy', festivalNotes[slug]]];
    if (steps.length !== stages.length) throw new Error('Route stage mismatch: ' + slug);
    const multiDay = key === 'ramayana' || (key === 'round-tours' && steps.length > 1);
    const alternatives = ['one-day-hiking-camping-kandy-knuckles-adventures','two-day-hiking-camping-kandy'].includes(slug);
    const mapStops = [...start, ...stages.flat(), ...finish]
      .filter((stop, i, all) => stop !== all[i-1]).map(place);
    const stops = steps.map(([name, description], i) => {
      const destination = place([stages[i]].flat()[0]);
      const stepLabel = multiDay ? 'Day ' + (i+1) : alternatives ? 'Route ' + (i+1) : 'Stop ' + (i+1);
      const heading = name.replace(/^Day \d+ · /, '');
      return `<li><details${i === 0 ? ' open' : ''}><summary><span>${stepLabel}</span><strong>${e(heading)}</strong></summary>
      <div class="day-story"><figure><img src="${image(destination.photo)}" loading="lazy" alt="${e(photoCaptions[destination.photo] || 'Sri Lanka destination scenery')}" width="640" height="420"><figcaption>${e(photoCaptions[destination.photo] || 'Sri Lanka destination scenery')}</figcaption></figure>
      <div><p>${e(description)}</p><a class="text-link" href="#route-map" data-map-jump="${e(destination.key)}">Find this stop on the map ↗</a></div></div></details></li>`;
    }).join('');
    const siblings = items.filter(item => item[4] !== slug && item[4] !== parent).slice(0, 3);
    const extras = details[slug] ?? [];
    const includes = packageInclusions[slug] ?? [];
    const exclusions = packageExclusions[slug] ?? [];
    const logistics = key === 'perahera' ? 'Ask AMAK to confirm the procession, venue, meeting point and transport.' :
      key === 'day-tours' ? 'Confirm the pickup location and start time with AMAK before you travel.' :
      'Confirm airport or hotel pickup and drop-off with AMAK when you share your flight details.';
    const questions = [
      ['How long is this tour?', key === 'perahera' ? 'This is a seasonal viewing package. Ask AMAK which processions and dates are available.' : kind.split(' · ')[0] + '. The outline below shows the planned stops.'],
      ['What does the quote cover?', includes.length ? 'The trip details below list published inclusions. Ask AMAK to itemise your quote and confirm any extras.' : 'Ask for an itemised quote covering transport, meals, tickets and any accommodation or add-ons that apply to your itinerary.'],
      ['Where does the tour start?', logistics],
      ['Can AMAK adjust the itinerary?', key === 'perahera' ? 'Ask AMAK about seating, transfers and combining your booking with a Kandy tour.' : 'Share your dates, group size, pace and mobility needs. AMAK can advise which stops or activities can be adjusted.'],
    ];
    const tripSchema = {'@type':'TouristTrip', name:title, description:summary, url:siteOrigin+url(slug),
      image:siteOrigin+image(photo), provider:{'@id':org['@id']},
      ...(alternatives ? {} : {itinerary:{'@type':'ItemList',itemListElement:mapStops.map((stop,i)=>({
        '@type':'ListItem',position:i+1,item:{'@type':'Place',name:stop.name},
      }))}}),
    };
    page(slug, title, summary, `<div class="wrap interior tour-layout">
      <nav class="catalog-links tour-jumps" aria-label="On this page"><a href="#overview">Overview</a><a href="#route-map">Route map</a><a href="#itinerary">Itinerary</a><a href="#trip-details">Trip details</a><a href="#tour-faq">FAQs</a></nav>
      <div class="detail-grid"><article class="reading tour-reading">
        <section id="overview"><p class="eyebrow accent">BY AMAK TRAVELS</p><h2>Tour overview</h2><p>${e(summary)}</p>
        <dl class="tour-facts"><div><dt>Duration</dt><dd>${e(kind.split(' · ')[0])}</dd></div><div><dt>${alternatives ? 'Base' : 'First planned stop'}</dt><dd>${e(mapStops[0].name)}</dd></div><div><dt>Booking</dt><dd>Quote on request</dd></div></dl>
        <h3>${alternatives ? 'Route options' : 'Main stops'}</h3><p>${e([...new Set(stages.flat().map(id=>place(id).name))].join(' · '))}</p></section>
        <section id="route-map"><h2>${key === 'perahera' ? 'Festival location' : 'Route map'}</h2>${renderRouteMap(mapStops, coastline, e, {alternatives})}</section>
        <section id="itinerary"><h2>${multiDay ? 'Day-by-day itinerary' : 'Tour itinerary'}</h2><ol class="itinerary">${stops}</ol></section>
        <section id="trip-details"><h2>Trip details</h2>${extras.length ? `<ul>${extras.map(item => `<li>${e(item)}</li>`).join('')}</ul>` : ''}
        <h3>${includes.length ? 'Published inclusions' : 'Inclusions to confirm'}</h3>${includes.length ? `<ul>${includes.map(item=>`<li>${e(item)}</li>`).join('')}</ul>` : '<p>Ask AMAK to confirm transport, guide services, tickets, meals and accommodation that apply to this package.</p>'}
        <h3>Exclusions and optional costs</h3>${exclusions.length ? `<ul>${exclusions.map(item=>`<li>${e(item)}</li>`).join('')}</ul>` : '<p>Confirm which optional stops, tickets or other costs are separate before you book.</p>'}
        <h3>Pickup, access and booking terms</h3><p>${e(logistics)} Share any mobility, dietary or accessibility needs before booking. See the <a href="/refund-cancellation-policy-amak-travels/">cancellation policy</a> and confirm package-specific terms in your quote.</p></section>
        <section id="tour-faq"><h2>Frequently asked questions</h2><div class="tour-faq">${questions.map(([question,answer])=>`<details><summary>${e(question)}</summary><p>${e(answer)}</p></details>`).join('')}</div></section>
        <p class="page-end">Operated by <a href="/about-us/">AMAK Travels</a> in Sri Lanka’s Central Province. <a href="/contact-us/">Contact the team</a> for current tour details.</p>
      </article><aside class="booking"><p class="eyebrow accent">${e(kind.toUpperCase())}</p><h2>Plan this tour</h2>
      <p>Share your dates and group size with AMAK Travels for a quote and availability.</p>${enquiry(slug)}</aside></div>
      ${siblings.length ? `<section class="catalog-section page-end"><h2>More ${key === 'perahera' ? 'Perahera packages' : 'tours'}</h2>${cards(siblings)}</section>` : ''}</div>`,
      { photo, parent: [parent, parentTitle], active: 'tour-packages', label: kind.toUpperCase(), structured: [tripSchema] });
  }
}
write('two-day-hiking-camping-kandy-knuckles-adventures', '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/two-day-hiking-camping-kandy/"><title>Two-Day Hiking &amp; Camping | AMAK Travels</title><a href="/two-day-hiking-camping-kandy/">View Two-Day Hiking &amp; Camping in Knuckles</a></html>');

page('about-us', 'About AMAK Travels', 'Meet the Sri Lankan team behind the tours.', `
  <div class="wrap interior detail-grid"><article class="reading">${content.about.map(([title, body]) => `<section><h2>${e(title)}</h2><p>${e(body)}</p></section>`).join('')}
  <p class="page-end"><a class="button" href="/tour-packages/">Browse tours ↗</a></p></article>
  <aside class="booking"><h2>Talk to a local</h2><p>Tell us where you’d like to go and what you’d like to do.</p>${enquiry('', 'Plan my trip')}</aside></div>`, { photo: 'about' });

page('discover', 'Discover Sri Lanka', 'Start with three places to explore in and around Kandy.', `
  <div class="wrap interior"><div class="cards">${content.discover.map(([title, photo, summary, slug], i) => `<article class="card" id="place-${i+1}">
  <img src="${image(photo)}" alt="" loading="lazy"><div class="card-body"><h3>${e(title)}</h3><p>${e(summary)}</p>
  <a class="text-link" href="${url(slug)}">See the tour ↗</a></div></article>`).join('')}</div></div>`, { photo: 'night' });

const photos = readdirSync(path('dist/assets/gallery')).filter(file => file.endsWith('.webp')).sort();
const albums = [
  ['outdoors','Highlands & waterfalls','Tea-country trails, mountain viewpoints and waterfalls.',[4,5,8,12,18,19,20,22,27,28,29,31,36]],
  ['culture','Culture & coast','Temples, gardens and days by the ocean.',[3,6,13,15,16,21,24,25,26,30,34,37]],
  ['guests','Guest moments','Snapshots from journeys with AMAK Travels.',[]],
];
const assigned = new Set(albums.flatMap(([, , , ids]) => ids));
page('gallery', 'Through Our Guests’ Eyes', 'Explore photos from AMAK Travels journeys across Sri Lanka.', `
  <div class="wrap interior gallery-layout"><div class="catalog-filter gallery-filter"><label>Gallery category<select data-album-filter><option value="">All albums</option>
  ${albums.map(([key,title])=>`<option value="${key}">${e(title)}</option>`).join('')}</select></label></div>
  ${albums.map(([key,title,description,ids])=>`<section class="album" data-album="${key}"><div class="center-heading"><h2>${e(title)}</h2><p>${e(description)}</p></div>
  <div class="gallery gallery-full">${photos.filter(file=>{
    const n=Number(file.match(/\d+/)[0]);
    return key === 'guests' ? !assigned.has(n) : ids.includes(n);
  }).map((file,i)=>galleryButton('/assets/gallery/'+file,title+' photo '+(i+1))).join('')}</div></section>`).join('')}</div>`,
  { photo: 'guest-1', gallery: true });

const interests = [
  ['Culture & temples','heritage'], ['Highlands & tea','trail'], ['Wildlife & nature','unique'],
  ['Waterfalls & hiking','falls'], ['Coastal stays','honeymoon'], ['Pilgrimage','sigiriya'],
];
const plannerPlaces = ['sigiriya','tooth','ella','galoya','galle','mirissa','trinco','anuradhapura','nuwara','knuckles'].map(place);
const routePlanner = `<section class="planner-board" aria-labelledby="planner-board-title">
  <h2 id="planner-board-title">Build your draft itinerary</h2>
  <p>Add destinations in the order you’d like to visit. AMAK can advise on timings and travel between stops.</p>
  <div class="planner-add"><label>Destination <select id="planner-place">${plannerPlaces.map(stop => `<option value="${e(stop.name)}">${e(stop.name)}</option>`).join('')}</select></label>
  <button class="button" type="button" id="planner-add">Add stop</button></div>
  <p id="planner-status" aria-live="polite">Your route is empty.</p><ol id="planner-stops"></ol>
  <input type="hidden" name="Draft itinerary" id="planner-order">
  </section>`;
const planner = `${routePlanner}<fieldset class="interests"><legend>What would you like to experience?</legend><div>${interests.map(([title,photo])=>`
  <label><input type="checkbox" name="Experience" value="${e(title)}"><img src="${image(photo)}" alt="" loading="lazy"><span>${e(title)}</span></label>`).join('')}</div></fieldset>`;

for (const [slug, title, summary] of [
  ['contact-us', 'Contact AMAK Travels', 'Get in touch about a package, an upcoming trip or a custom itinerary.'],
  ['tailor-made-tours-2', 'Itinerary Planner', 'Share your dates and interests and let AMAK help plan a Sri Lanka itinerary around them.'],
]) {
  page(slug, title, summary, `<div class="wrap interior contact-grid" id="plan">
    <section class="reading"><h2>Speak with the team</h2>${contactDetails()}</section>${slug === 'tailor-made-tours-2' ? form.replace('<div class="fields">', planner + '<div class="fields">') : form}</div>`, { photo: slug === 'tailor-made-tours-2' ? 'about' : undefined });
}

for (const [slug, [title, sections]] of Object.entries(content.policies)) {
  page(slug, title, 'AMAK Travels booking and customer information.', `
    <div class="wrap interior"><article class="reading">${sections.map(([heading, paragraph]) => `<section><h2>${e(heading)}</h2><p>${e(paragraph)}</p></section>`).join('')}
    <section><h2>Contact</h2>${contactDetails()}<p><a href="${official}${url(slug)}">Read the original published policy ↗</a></p></section></article></div>`);
}

writeFileSync(path('dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...publishedPages.map(url)].map(href=>`<url><loc>${e(siteOrigin+href)}</loc></url>`).join('')}</urlset>
`);
