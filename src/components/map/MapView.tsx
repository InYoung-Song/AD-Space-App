import { useEffect, useMemo, useRef } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { DEFAULT_CENTER, MAP_STYLE_URL, type MapMarker, type MapViewProps } from './types';

function buildHtml(markers: MapMarker[], center: { lat: number; lng: number; zoom?: number }): string {
  const data = JSON.stringify(markers);
  const c = JSON.stringify(center);
  return (
    '<!DOCTYPE html><html><head>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />' +
    '<link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />' +
    '<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>' +
    '<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>' +
    '</head><body><div id="map"></div><script>' +
    'var MARKERS=' + data + ';var CENTER=' + c + ';' +
    'function post(o){if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(o));}}' +
    'function markerCss(col,sel){var s=sel?22:16;return "width:"+s+"px;height:"+s+"px;border-radius:50%;background:"+col+";border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"+(sel?(",0 0 0 4px "+col+"55"):"")+";transition:all .12s ease;";}' +
    'var map=new maplibregl.Map({container:"map",style:"' + MAP_STYLE_URL + '",center:[CENTER.lng,CENTER.lat],zoom:CENTER.zoom||3.2});' +
    'map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");' +
    'map.on("click",function(){post({type:"background"});});' +
    'var objs={};' +
    'MARKERS.forEach(function(m){var el=document.createElement("div");el.style.cssText=markerCss(m.color,false);el.addEventListener("click",function(e){e.stopPropagation();post({type:"select",id:m.id});});objs[m.id]=new maplibregl.Marker({element:el}).setLngLat([m.lng,m.lat]).addTo(map);});' +
    'if(MARKERS.length>1){var b=new maplibregl.LngLatBounds();MARKERS.forEach(function(m){b.extend([m.lng,m.lat]);});map.fitBounds(b,{padding:60,maxZoom:12,duration:0});}else if(MARKERS.length===1){map.jumpTo({center:[MARKERS[0].lng,MARKERS[0].lat],zoom:12});}' +
    'window.setSelected=function(id){Object.keys(objs).forEach(function(k){var m=null;MARKERS.forEach(function(x){if(x.id===k)m=x;});if(m)objs[k].getElement().style.cssText=markerCss(m.color,k===id);});};' +
    'window.flyTo=function(lng,lat,zoom){map.flyTo({center:[lng,lat],zoom:zoom||11});};' +
    '</script></body></html>'
  );
}

export default function MapView({
  markers,
  selectedId,
  center,
  onSelect,
  onBackgroundPress,
  style,
}: MapViewProps) {
  const ref = useRef<WebView>(null);
  const initialCenter = useRef(center ?? DEFAULT_CENTER);

  const html = useMemo(() => buildHtml(markers, initialCenter.current), [markers]);

  useEffect(() => {
    ref.current?.injectJavaScript(`window.setSelected && window.setSelected(${JSON.stringify(selectedId ?? null)});true;`);
  }, [selectedId, html]);

  useEffect(() => {
    if (center) {
      ref.current?.injectJavaScript(
        `window.flyTo && window.flyTo(${center.lng},${center.lat},${center.zoom ?? 11});true;`,
      );
    }
  }, [center?.lat, center?.lng, center?.zoom]);

  const handleMessage = (e: WebViewMessageEvent | NativeSyntheticEvent<{ data: string }>) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'select' && msg.id) onSelect?.(msg.id);
      else if (msg.type === 'background') onBackgroundPress?.();
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
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
    </View>
  );
}
