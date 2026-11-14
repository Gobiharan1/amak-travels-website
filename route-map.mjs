export function renderRouteMap(stops, coastline, escape, { alternatives = false } = {}) {
  const width = 650;
  const height = 410;
  const longitudes = stops.map(stop => stop.lon);
  const latitudes = stops.map(stop => stop.lat);
  const midpoint = (values) => (Math.min(...values) + Math.max(...values)) / 2;
  const range = (values) => Math.max(...values) - Math.min(...values);
  const lon = midpoint(longitudes);
  const lat = midpoint(latitudes);
  const scale = Math.min((width - 160) / Math.max(range(longitudes), .09), (height - 110) / Math.max(range(latitudes), .09));
  const point = (x, y) => [Math.round(width / 2 + (x - lon) * scale), Math.round(height / 2 - (y - lat) * scale)];
  const marks = new Map();
  for (const [index, stop] of stops.entries()) {
    if (!marks.has(stop.key)) marks.set(stop.key, { stop, indexes: [] });
    marks.get(stop.key).indexes.push(index + 1);
  }
  const outline = coastline.map(ring => 'M' + ring.map(([x,y]) => point(x,y).join(',')).join('L') + 'Z').join('');
  const line = stops.map(stop => point(stop.lon,stop.lat).join(',')).join(' ');
  const markerPositions = [];
  function markerPoint(x, y) {
    const offsets = [[0,0], [19,-18], [-19,-18], [19,18], [-19,18], [0,-33], [0,33], [35,0], [-35,0], [34,-27], [-34,-27], [34,27], [-34,27]];
    const [dx,dy] = offsets.find(([dx,dy]) => markerPositions.every(([a,b]) => Math.hypot(a-x-dx,b-y-dy) > 24)) ?? [0,0];
    const marker = [x + dx,y + dy];
    markerPositions.push(marker);
    return marker;
  }
  const placeLink = stop => 'https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(stop.name + ', Sri Lanka');
  return `<div class="route-map"><div class="map-illustration"><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="route-svg-title">
    <title id="route-svg-title">${alternatives ? 'Areas covered by the alternative routes' : 'Map of the main itinerary stops'}</title>
    <path d="${outline}" class="map-land"/><text x="22" y="34" class="map-north">↑ N</text>${alternatives ? '' : `<polyline points="${line}" class="map-line"/>`}
    ${[...marks.values()].map(({stop,indexes}) => {
      const [sourceX,sourceY] = point(stop.lon,stop.lat);
      const [x,y] = markerPoint(sourceX,sourceY);
      return `<g class="map-pin" data-map-pin="${escape(stop.key)}"><title>${escape(stop.name)} · ${indexes.join(', ')}</title>${x !== sourceX || y !== sourceY ? `<line class="map-leader" x1="${sourceX}" y1="${sourceY}" x2="${x}" y2="${y}"/>` : ''}<circle cx="${x}" cy="${y}" r="12"/><text x="${x}" y="${y+4}">${indexes[0]}</text></g>`;
    }).join('')}</svg></div>
    <ol class="map-stops" aria-label="Map stops">${stops.map((stop,index) => `<li><button type="button" data-map-select="${escape(stop.key)}" aria-pressed="false"><span>${index+1}</span>${escape(stop.name)}</button><a href="${placeLink(stop)}" aria-label="Find ${escape(stop.name)} on Google Maps">↗</a></li>`).join('')}</ol></div>
    <p class="map-credit">${alternatives ? 'Pins show alternative hiking areas and the Kandy base.' : 'The list shows the stop order. Repeat visits share a pin. Dashed lines show an approximate route, not roads or trails.'} <a href="https://www.naturalearthdata.com/">Coastline by Natural Earth</a>.</p>`;
}
