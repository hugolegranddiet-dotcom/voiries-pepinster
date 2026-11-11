"use client";

// Carte Leaflet. Ce composant n'est chargé QUE dans le navigateur
// (import dynamique avec ssr: false dans CarteVoiries).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { GeoJSON, MapContainer, ScaleControl, TileLayer, useMap } from "react-leaflet";
import type { FeatureCollection, LineString, MultiPolygon } from "geojson";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { SegmentProps } from "@/lib/geo/types";
import { STYLE_COMMUNE, STYLE_SECTION, styleSegment } from "@/components/carte/styles-carte";

export type LimiteGeo = FeatureCollection<MultiPolygon, { type: "commune" | "section"; nom: string }>;
export type VoiesGeo = FeatureCollection<LineString, SegmentProps>;

interface Props {
  limite: LimiteGeo;
  voies: VoiesGeo;
  categoriesVisibles: Record<CategorieVoie, boolean>;
  selection: string | null;
  onSelection: (roadId: string) => void;
}

/** Couche des voies : un tracé par segment, mais sélection et style par voirie logique. */
function CoucheVoies({ voies, categoriesVisibles, selection, onSelection }: Omit<Props, "limite">) {
  const carte = useMap();
  const parVoirie = useRef(new Map<string, L.Path[]>());
  const selectionRef = useRef(selection);
  const onSelectionRef = useRef(onSelection);
  useEffect(() => {
    onSelectionRef.current = onSelection;
  }, [onSelection]);

  // Rendu canvas avec une marge de clic confortable (doigt sur téléphone).
  const rendu = useMemo(() => L.canvas({ tolerance: 8 }), []);

  // (Re)création de la couche quand les filtres changent.
  useEffect(() => {
    const index = new Map<string, L.Path[]>();
    const couche = L.geoJSON(voies, {
      renderer: rendu,
      filter: (f) => categoriesVisibles[(f.properties as SegmentProps).cat],
      style: (f) => styleSegment(f!.properties as SegmentProps, (f!.properties as SegmentProps).rid === selectionRef.current),
      onEachFeature: (f, layer) => {
        const p = f.properties as SegmentProps;
        const liste = index.get(p.rid);
        if (liste) liste.push(layer as L.Path);
        else index.set(p.rid, [layer as L.Path]);
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectionRef.current(p.rid);
        });
      },
    } as L.GeoJSONOptions);
    couche.addTo(carte);
    parVoirie.current = index;
    return () => {
      couche.remove();
    };
  }, [carte, voies, categoriesVisibles, rendu]);

  // Mise en évidence : TOUS les segments de la voirie sélectionnée.
  useEffect(() => {
    const precedente = selectionRef.current;
    selectionRef.current = selection;
    if (precedente && precedente !== selection) {
      for (const l of parVoirie.current.get(precedente) ?? []) {
        l.setStyle(styleSegment((l as L.Polyline & { feature: { properties: SegmentProps } }).feature.properties, false));
      }
    }
    if (selection) {
      const couches = parVoirie.current.get(selection) ?? [];
      for (const l of couches) {
        l.setStyle(styleSegment((l as L.Polyline & { feature: { properties: SegmentProps } }).feature.properties, true));
        l.bringToFront();
      }
      if (couches.length) {
        const limites = L.latLngBounds([]);
        couches.forEach((l) => limites.extend((l as L.Polyline).getBounds()));
        if (!carte.getBounds().contains(limites)) {
          carte.fitBounds(limites, { padding: [60, 60], maxZoom: 17 });
        }
      }
    }
  }, [selection, carte]);

  return null;
}

function Cadrage({ limite }: { limite: LimiteGeo }) {
  const carte = useMap();
  useEffect(() => {
    const commune = limite.features.find((f) => f.properties.type === "commune");
    if (commune) carte.fitBounds(L.geoJSON(commune).getBounds(), { padding: [16, 16] });
  }, [carte, limite]);
  return null;
}

export default function CarteLeaflet(props: Props) {
  const commune = useMemo(
    () => ({ ...props.limite, features: props.limite.features.filter((f) => f.properties.type === "commune") }),
    [props.limite],
  );
  const sections = useMemo(
    () => ({ ...props.limite, features: props.limite.features.filter((f) => f.properties.type === "section") }),
    [props.limite],
  );

  return (
    <MapContainer
      center={[50.57, 5.8]}
      zoom={13}
      minZoom={11}
      maxZoom={19}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='Fond et données © <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a> · indice régional : SPW'
      />
      <GeoJSON data={sections} style={() => STYLE_SECTION} />
      <GeoJSON data={commune} style={() => STYLE_COMMUNE} />
      <CoucheVoies
        voies={props.voies}
        categoriesVisibles={props.categoriesVisibles}
        selection={props.selection}
        onSelection={props.onSelection}
      />
      <Cadrage limite={props.limite} />
      <ScaleControl imperial={false} position="bottomleft" />
    </MapContainer>
  );
}
