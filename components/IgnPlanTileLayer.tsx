"use client";

import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

/**
 * Fond « Plan IGN » (Géoplateforme).
 * TILEMATRIXSET=PM : TILEROW aligné sur l’axe Y Web Mercator / Leaflet (pas d’inversion TMS).
 * @see https://geoservices.ign.fr/services-web-de-visualisation-plan-ign
 */
const PLAN_IGN_LAYER = "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2";

export default function IgnPlanTileLayer() {
  const map = useMap();

  useEffect(() => {
    const IgnPlan = L.TileLayer.extend({
      getTileUrl(this: L.TileLayer, coords: L.Coords) {
        const z = coords.z;
        return (
          "https://data.geopf.fr/wmts?" +
          "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0" +
          `&LAYER=${PLAN_IGN_LAYER}` +
          "&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM" +
          `&TILEMATRIX=${z}&TILEROW=${coords.y}&TILECOL=${coords.x}`
        );
      },
    }) as unknown as new (url: string, options: L.TileLayerOptions) => L.TileLayer;

    const layer = new IgnPlan("", {
      minZoom: 0,
      maxZoom: 18,
      maxNativeZoom: 18,
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.ign.fr/">IGN</a> · ' +
        '<a href="https://geoservices.ign.fr/">Géoplateforme</a> · ' +
        '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
