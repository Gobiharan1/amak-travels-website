const galleryDialog = document.querySelector('#gallery-dialog');
const packageSelect = document.querySelector('#package');
const grid = document.querySelector('#tour-grid');

if (packageSelect) {
  const selected = new URLSearchParams(location.search).get('tour');
  for (const [title, , , , slug] of Object.values(tours).flat()) {
    packageSelect.add(new Option(title));
    if (slug === selected) packageSelect.value = title;
  }
}

function renderTours(category) {
  document.querySelectorAll('.filters button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  });
  grid.replaceChildren(...tours[category].map(tour => {
    const [title, kind, photo, summary, slug] = tour;
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = '<img loading="lazy" alt=""><div class="card-body"><p class="eyebrow accent"></p><h3></h3><p></p><a class="text-link">View tour <span aria-hidden="true">↗</span></a></div>';
    card.querySelector('img').src = '/amak-travels-website/assets/' + photo + '.webp';
    card.querySelector('.eyebrow').textContent = kind.toUpperCase();
    card.querySelector('h3').textContent = title;
    card.querySelector('.eyebrow + h3 + p').textContent = summary;
    const details = card.querySelector('a');
    details.href = '/amak-travels-website/' + slug + '/';
    details.setAttribute('aria-label', 'View tour: ' + title);
    return card;
  }));
}

function syncCategory() {
  const category = location.hash.slice(1);
  if (grid && Object.hasOwn(tours, category)) {
    renderTours(category);
    document.querySelector('#tours').scrollIntoView();
  }
}

document.querySelectorAll('.filters button').forEach(button => {
  button.addEventListener('click', () => renderTours(button.dataset.category));
});
document.querySelectorAll('.tour-nav [data-category]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    history.pushState(null, '', link.hash);
    syncCategory();
  });
});
if (grid) renderTours('round-tours');
syncCategory();
window.addEventListener('hashchange', syncCategory);

const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function toggleMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
}
menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') === 'false'));
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) toggleMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    toggleMenu(false);
    menu.focus();
  }
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
}
const photoButtons = [...document.querySelectorAll('[data-photo]')];
let activePhoto;
function showPhoto(button) {
  activePhoto = button;
  const photo = document.querySelector('#gallery-photo');
  photo.src = button.dataset.photo;
  photo.alt = button.querySelector('img').alt;
  const visible = photoButtons.filter(item => !item.closest('[hidden]'));
  document.querySelector('#gallery-position').textContent =
    (visible.indexOf(button) + 1) + ' / ' + visible.length;
}
function stepPhoto(direction) {
  const visible = photoButtons.filter(item => !item.closest('[hidden]'));
  const next = (visible.indexOf(activePhoto) + direction + visible.length) % visible.length;
  showPhoto(visible[next]);
}
photoButtons.forEach(button => {
  button.addEventListener('click', () => {
    showPhoto(button);
    galleryDialog.showModal();
  });
});
galleryDialog?.querySelectorAll('[data-gallery-step]').forEach(button => {
  button.addEventListener('click', () => stepPhoto(Number(button.dataset.galleryStep)));
});
galleryDialog?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});

document.querySelector('[data-album-filter]')?.addEventListener('change', event => {
  document.querySelectorAll('[data-album]').forEach(album => {
    album.hidden = Boolean(event.target.value && album.dataset.album !== event.target.value);
  });
});

const tourFilter = document.querySelector('[data-tour-filter]');
if (tourFilter) {
  const experience = tourFilter.querySelector('[name=experience]');
  const duration = tourFilter.querySelector('[name=duration]');
  const search = tourFilter.querySelector('[name=search]');
  const initialExperience = experience.value;
  const groups = [...document.querySelectorAll('[data-tour-group]')];
  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    for (const group of groups) {
      const cards = [...group.querySelectorAll('.card')];
      for (const card of cards) {
        card.hidden = Boolean(
          (experience.value && card.dataset.experience !== experience.value) ||
          (duration.value && card.dataset.duration !== duration.value) ||
          (query && !card.textContent.toLowerCase().includes(query))
        );
        if (!card.hidden) count += 1;
      }
      group.hidden = cards.every(card => card.hidden);
    }
    document.querySelector('[data-results]').textContent = count + (count === 1 ? ' tour' : ' tours');
    document.querySelector('[data-empty]').hidden = count > 0;
  }
  tourFilter.addEventListener('input', applyFilters);
  tourFilter.querySelector('[data-reset]').addEventListener('click', () => {
    experience.value = initialExperience;
    duration.value = '';
    search.value = '';
    applyFilters();
  });
  applyFilters();
}

const arrival = document.querySelector('#arrival');
const departure = document.querySelector('#departure');
arrival?.addEventListener('change', () => {
  departure.min = arrival.value;
});

document.querySelector('#enquiry')?.addEventListener('submit', event => {
  event.preventDefault();
  const details = [...new FormData(event.currentTarget)]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => label + ': ' + value.trim());
  const message = encodeURIComponent(['Hello AMAK Travels, I’d like to enquire about a Sri Lanka trip.', '', ...details].join('\n'));
  if (event.submitter?.value === 'email') {
    location.href = 'mailto:info@amaktravels.com?subject=Sri%20Lanka%20tour%20enquiry&body=' + message;
  } else {
    window.open('https://wa.me/94710857333?text=' + message, '_blank', 'noopener,noreferrer');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

const routeSection = document.querySelector('#route-map');
if (routeSection) {
  const selectStop = key => {
    for (const button of routeSection.querySelectorAll('[data-map-select]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mapSelect === key));
    }
    for (const pin of routeSection.querySelectorAll('[data-map-pin]')) {
      pin.classList.toggle('selected', pin.dataset.mapPin === key);
    }
  };
  routeSection.addEventListener('click', event => {
    const button = event.target.closest('[data-map-select]');
    if (button) selectStop(button.dataset.mapSelect);
  });
  document.querySelectorAll('[data-map-jump]').forEach(link => {
    link.addEventListener('click', () => selectStop(link.dataset.mapJump));
  });
}

const plannerStops = document.querySelector('#planner-stops');
if (plannerStops) {
  const add = document.querySelector('#planner-add');
  const picker = document.querySelector('#planner-place');
  const status = document.querySelector('#planner-status');
  const hiddenOrder = document.querySelector('#planner-order');
  const allowedStops = new Set([...picker.options].map(option => option.value));
  const storageKey = 'amak-itinerary-draft-v1';
  const limit = 20;
  let draft = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved)) draft = saved.filter(stop => allowedStops.has(stop)).slice(0, limit);
  } catch {
    // The planner also works when browser storage is unavailable.
  }

  function renderDraft(message) {
    plannerStops.replaceChildren(...draft.map((stop, index) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = (index + 1) + '. ' + stop;
      const controls = document.createElement('div');
      for (const [action, label, symbol, disabled] of [
        ['up', 'Move up', '↑', index === 0],
        ['down', 'Move down', '↓', index === draft.length - 1],
        ['remove', 'Remove', '×', false],
      ]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.index = index;
        button.setAttribute('aria-label', label + ' ' + stop);
        button.textContent = symbol;
        button.disabled = disabled;
        controls.append(button);
      }
      item.append(name, controls);
      return item;
    }));
    hiddenOrder.value = draft.map((stop, index) => (index + 1) + '. ' + stop).join('\n');
    status.textContent = message ?? (draft.length ? draft.length + ' stops in your draft.' : 'Your route is empty.');
    add.disabled = draft.length >= limit;
  }
  function saveDraft(message) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // Keep the draft in the current page when browser storage is unavailable.
    }
    renderDraft(message);
  }
  add.addEventListener('click', () => {
    if (draft.length >= limit) return;
    draft.push(picker.value);
    saveDraft(picker.value + ' added.' + (draft.length === limit ? ' Your draft has reached 20 stops.' : ''));
  });
  plannerStops.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    const { action } = button.dataset;
    const stop = draft[index];
    const next = action === 'up' ? index - 1 : action === 'down' ? index + 1 : index;
    if (action === 'remove') {
      draft.splice(index, 1);
      saveDraft(stop + ' removed.');
    } else {
      [draft[index], draft[next]] = [draft[next], draft[index]];
      saveDraft(stop + ' moved to stop ' + (next + 1) + '.');
    }
    const row = plannerStops.children[Math.min(next, draft.length - 1)];
    const control = row?.querySelector('[data-action="' + action + '"]:not(:disabled)') ??
      row?.querySelector('button:not(:disabled)') ?? add;
    control.focus();
  });
  renderDraft();
}
