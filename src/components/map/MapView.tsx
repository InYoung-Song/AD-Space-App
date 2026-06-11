import { useEffect, useMemo, useRef } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { DEFAULT_CENTER, MAP_MIN_ZOOM, MAP_STYLE_URL, US_MAX_BOUNDS, type MapViewProps } from './types';

/**
 * Builds the map shell once. Markers/selection/origin are updated afterwards via
 * injected `window.set*` calls so panning never reloads the whole WebView.
 */
function buildHtml(center: { lat: number; lng: number; zoom?: number }): string {
  const c = JSON.stringify(center);
  return (
    '<!DOCTYPE html><html><head>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />' +
    '<link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />' +
    '<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>' +
    '<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>' +
    '</head><body><div id="map"></div><script>' +
    'var CENTER=' + c + ';' +
    'function post(o){if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(o));}}' +
    'function markerCss(col,sel){var s=sel?22:16;return "width:"+s+"px;height:"+s+"px;border-radius:50%;background:"+col+";border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"+(sel?(",0 0 0 4px "+col+"55"):"")+";transition:all .12s ease;";}' +
    'var map;try{map=new maplibregl.Map({container:"map",style:"' + MAP_STYLE_URL + '",center:[CENTER.lng,CENTER.lat],zoom:CENTER.zoom||3.4,maxBounds:' + JSON.stringify(US_MAX_BOUNDS) + ',minZoom:' + MAP_MIN_ZOOM + '});}catch(err){post({type:"error"});}' +
    'if(map){' +
    'map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");' +
    'map.on("click",function(e){post({type:"mappress",lat:e.lngLat.lat,lng:e.lngLat.lng});});' +
    'function emitRegion(){var b=map.getBounds();post({type:"region",west:b.getWest(),south:b.getSouth(),east:b.getEast(),north:b.getNorth()});}' +
    'map.on("moveend",emitRegion);map.on("load",function(){post({type:"ready"});emitRegion();});' +
    'var objs={};var current=[];var selectedId=null;var originMarker=null;' +
    'window.setMarkers=function(list){current=list;var next={};list.forEach(function(m){next[m.id]=1;});' +
    'Object.keys(objs).forEach(function(id){if(!next[id]){objs[id].remove();delete objs[id];}});' +
    'list.forEach(function(m){if(objs[m.id]){objs[m.id].setLngLat([m.lng,m.lat]);}else{var el=document.createElement("div");el.style.cssText=markerCss(m.color,m.id===selectedId);el.addEventListener("click",function(e){e.stopPropagation();post({type:"select",id:m.id});});objs[m.id]=new maplibregl.Marker({element:el}).setLngLat([m.lng,m.lat]).addTo(map);}});};' +
    'window.setSelected=function(id){selectedId=id;current.forEach(function(m){if(objs[m.id])objs[m.id].getElement().style.cssText=markerCss(m.color,m.id===id);});};' +
    'window.setOrigin=function(lat,lng){if(originMarker){originMarker.remove();originMarker=null;}if(lat!==null&&lat!==undefined){var oe=document.createElement("div");oe.style.cssText="width:18px;height:18px;border-radius:50%;background:#6D5DF6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(109,93,246,0.25),0 2px 6px rgba(0,0,0,0.4);";originMarker=new maplibregl.Marker({element:oe}).setLngLat([lng,lat]).addTo(map);}};' +
    'window.flyTo=function(lng,lat,zoom){map.flyTo({center:[lng,lat],zoom:zoom||11});};' +
    '}' +
    '</script></body></html>'
  );
}

export default function MapView({
  markers,
  selectedId,
  center,
  origin,
  onSelect,
  onMapPress,
  onRegionChange,
  style,
}: MapViewProps) {
  const ref = useRef<WebView>(null);
  const initialCenter = useRef(center ?? DEFAULT_CENTER);
  const markersRef = useRef(markers);
  const selectedRef = useRef(selectedId);
  const originRef = useRef(origin);
  markersRef.current = markers;
  selectedRef.current = selectedId;
  originRef.current = origin;

  // Built once — markers are pushed in afterwards so the map never reloads.
  const html = useMemo(() => buildHtml(initialCenter.current), []);

  const inject = (js: string) => ref.current?.injectJavaScript(js + 'true;');

  useEffect(() => {
    inject(`window.setMarkers && window.setMarkers(${JSON.stringify(markers)});`);
  }, [markers]);

  useEffect(() => {
    inject(`window.setSelected && window.setSelected(${JSON.stringify(selectedId ?? null)});`);
  }, [selectedId]);

  useEffect(() => {
    inject(`window.setOrigin && window.setOrigin(${origin ? `${origin.lat},${origin.lng}` : 'null,null'});`);
  }, [origin?.lat, origin?.lng]);

  useEffect(() => {
    if (center) inject(`window.flyTo && window.flyTo(${center.lng},${center.lat},${center.zoom ?? 11});`);
  }, [center?.lat, center?.lng, center?.zoom]);

  // Re-apply current state once the WebView's JS context is ready (avoids a race
  // where the first injects fire before window.set* are defined).
  const handleLoadEnd = () => {
    inject(`window.setMarkers && window.setMarkers(${JSON.stringify(markersRef.current)});`);
    inject(`window.setSelected && window.setSelected(${JSON.stringify(selectedRef.current ?? null)});`);
    inject(
      `window.setOrigin && window.setOrigin(${originRef.current ? `${originRef.current.lat},${originRef.current.lng}` : 'null,null'});`,
    );
  };

  const handleMessage = (e: WebViewMessageEvent | NativeSyntheticEvent<{ data: string }>) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'select' && msg.id) onSelect?.(msg.id);
      else if (msg.type === 'mappress') onMapPress?.(msg.lat, msg.lng);
      else if (msg.type === 'region')
        onRegionChange?.({ west: msg.west, south: msg.south, east: msg.east, north: msg.north });
    } catch {
      // ignore malformed messages
    }
  };

  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
