(function (root) {
  'use strict';
  function distance(a, b) {
    const rad = Math.PI / 180;
    const dlat = (b.lat - a.lat) * rad;
    const dlon = (b.lng - a.lng) * rad;
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - Math.min(1, h)));
  }
  function nearest(position, nodes) {
    if (!Number.isFinite(position.lat) || !Number.isFinite(position.lng) || Math.abs(position.lat) > 90 || Math.abs(position.lng) > 180) throw new Error('Coordenadas inválidas.');
    if (!nodes.length) throw new Error('Não existem panoramas com coordenadas.');
    return nodes.reduce((best, node) => {
      const meters = distance(position, node);
      return !best || meters < best.meters ? { node, meters } : best;
    }, null);
  }
  function createTracker(nodes, start) {
    let current = start, initialized = false, pending = null, count = 0;
    return function (position, accuracy = 0) {
      const best = nearest(position, nodes);
      if (!Number.isFinite(accuracy) || accuracy > 20) {
        pending = null; count = 0;
        return { id: current, best, waiting: 'Precisão insuficiente (mais de 20 m). A aguardar uma posição melhor.', accepted: false };
      }
      const target = best.meters > 100 ? start : best.node.id;
      const currentNode = nodes.find(n => n.id === current);
      if (!initialized) { current = target; initialized = true; }
      else if (target !== current) {
        if (best.meters <= 100 && currentNode && distance(position, currentNode) - best.meters < 2) {
          pending = null; count = 0;
          return { id: current, best, waiting: 'Perto da fronteira entre pontos. A manter o panorama para evitar oscilações.', accepted: true };
        }
        if (pending === target) count++; else { pending = target; count = 1; }
        if (count >= 2) { current = target; pending = null; count = 0; }
        else return { id: current, best, waiting: 'A confirmar o próximo ponto com outra atualização de localização.', accepted: true };
      } else { pending = null; count = 0; }
      return { id: current, best, waiting: '', accepted: true };
    };
  }
  function bearing(a, b) {
    const rad = Math.PI / 180, lat1 = a.lat * rad, lat2 = b.lat * rad, dlon = (b.lng-a.lng)*rad;
    return Math.atan2(Math.sin(dlon)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dlon))/rad;
  }
  function destination(origin, meters, heading) {
    const rad=Math.PI/180, lat=origin.lat*rad, lng=origin.lng*rad, angle=meters/6371000, direction=heading*rad;
    const nextLat=Math.asin(Math.sin(lat)*Math.cos(angle)+Math.cos(lat)*Math.sin(angle)*Math.cos(direction));
    const nextLng=lng+Math.atan2(Math.sin(direction)*Math.sin(angle)*Math.cos(lat),Math.cos(angle)-Math.sin(lat)*Math.sin(nextLat));
    return {lat:nextLat/rad,lng:((nextLng/rad+540)%360)-180};
  }
  function relativePosition(origin, position, virtualOrigin, rotation=0) {
    return destination(virtualOrigin,distance(origin,position),bearing(origin,position)+rotation);
  }
  function routePosition(position,nodes) {
    const cumulative=[0];for(let i=1;i<nodes.length;i++)cumulative.push(cumulative[i-1]+distance(nodes[i-1],nodes[i]));
    let best={meters:Infinity,along:0};
    const scale=Math.cos(position.lat*Math.PI/180);
    for(let i=1;i<nodes.length;i++){
      const a=nodes[i-1],b=nodes[i],dx=(b.lng-a.lng)*scale,dy=b.lat-a.lat;
      const px=(position.lng-a.lng)*scale,py=position.lat-a.lat;
      const t=Math.max(0,Math.min(1,(px*dx+py*dy)/(dx*dx+dy*dy||1)));
      const projected={lat:a.lat+dy*t,lng:a.lng+(b.lng-a.lng)*t};
      const meters=distance(position,projected);
      if(meters<best.meters)best={meters,along:cumulative[i-1]+(cumulative[i]-cumulative[i-1])*t};
    }
    return {...best,total:cumulative.at(-1),cumulative};
  }
  const api = { distance, nearest, createTracker, bearing, destination, relativePosition, routePosition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TourGeo = api;
})(typeof window === 'undefined' ? globalThis : window);
