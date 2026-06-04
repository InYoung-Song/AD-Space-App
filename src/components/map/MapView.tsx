import { useEffect, useMemo, useRef } from 'react';
import { View, type NativeSyntheticEvent } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { DEFAULT_CENTER, MAP_MIN_ZOOM, MAP_STYLE_URL, US_MAX_BOUNDS, type MapMarker, type MapViewProps } from './types';

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
    'var map=new maplibregl.Map({container:"map",style:"' + MAP_STYLE_URL + '",center:[CENTER.lng,CENTER.lat],zoom:CENTER.zoom||3.4,maxBounds:' + JSON.stringify(US_MAX_BOUNDS) + ',minZoom:' + MAP_MIN_ZOOM + '});' +
    'map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");' +
    'map.on("click",function(e){post({type:"mappress",lat:e.lngLat.lat,lng:e.lngLat.lng});});' +
    'var objs={};var originMarker=null;' +
    'window.setOrigin=function(lat,lng){if(originMarker){originMarker.remove();originMarker=null;}if(lat!==null&&lat!==undefined){var oe=document.createElement("div");oe.style.cssText="width:18px;height:18px;border-radius:50%;background:#6D5DF6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(109,93,246,0.25),0 2px 6px rgba(0,0,0,0.4);";originMarker=new maplibregl.Marker({element:oe}).setLngLat([lng,lat]).addTo(map);}};' +
    'MARKERS.forEach(function(m){var el=document.createElement("div");el.style.cssText=markerCss(m.color,false);el.addEventListener("click",function(e){e.stopPropagation();post({type:"select",id:m.id});});objs[m.id]=new maplibregl.Marker({element:el}).setLngLat([m.lng,m.lat]).addTo(map);});' +
    'window.setSelected=function(id){Object.keys(objs).forEach(function(k){var m=null;MARKERS.forEach(function(x){if(x.id===k)m=x;});if(m)objs[k].getElement().style.cssText=markerCss(m.color,k===id);});};' +
    'window.flyTo=function(lng,lat,zoom){map.flyTo({center:[lng,lat],zoom:zoom||11});};' +
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

  useEffect(() => {
    ref.current?.injectJavaScript(
      `window.setOrigin && window.setOrigin(${origin ? `${origin.lat},${origin.lng}` : 'null,null'});true;`,
    );
  }, [origin?.lat, origin?.lng, html]);

  const handleMessage = (e: WebViewMessageEvent | NativeSyntheticEvent<{ data: string }>) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'select' && msg.id) onSelect?.(msg.id);
      else if (msg.type === 'mappress') onMapPress?.(msg.lat, msg.lng);
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
