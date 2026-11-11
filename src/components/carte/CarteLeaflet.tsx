"use client";

// Carte Leaflet. Ce composant n'est chargé QUE dans le navigateur
// (import dynamique avec ssr: false dans CarteVoiries).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, MapContainer, ScaleControl, TileLayer, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, LineString, MultiPolygon } from "geojson";
import type { CategorieVoie } from "@/lib/geo/voiries";
import type { SegmentProps } from "@/lib/geo/types";
import type { FicheVoirie } from "@/lib/donnees/types";
import type { Gestionnaire } from "@/lib/domaine";
import { apparenceDe, STYLE_COMMUNE, STYLE_SECTION, styleSegment, stylesSelection, type ApparenceVoirie } from "@/components/carte/styles-carte";
import type { ParametresScore } from "@/lib/priority/defaults";

export type LimiteGeo = FeatureCollection<MultiPolygon, { type: "commune" | "section"; nom: string }>;
export type VoiesGeo = FeatureCollection<LineString, SegmentProps>;

interface Props {
  limite: LimiteGeo;
  voies: VoiesGeo;
  categoriesVisibles: Record<CategorieVoie, boolean>;
  /** null = tous les gestionnaires. */
  gestionnaireVisible: Gestionnaire | null;
  fiches: Record<string, FicheVoirie>;
  parametres: ParametresScore;
  /** Voirie à mettre en évidence (pour une section : sa voirie mère). */
  selection: string | null;
  onSelection: (roadId: string) => void;
}

/** Couche des voies : un tracé par segment, mais couleur et sélection par voirie logique. */
function CoucheVoies({ voies, categoriesVisibles, gestionnaireVisible, fiches, parametres, selection, onSelection }: Omit<Props, "limite">) {
  const carte = useMap();
  // La première sélection (venue de l'adresse) recentre toujours la carte.
  const premiereSelection = useRef(selection !== null);
  const onSelectionRef = useRef(onSelection);
  useEffect(() => {
    onSelectionRef.current = onSelection;
  }, [onSelection]);

  // Rendu canvas avec une marge de clic confortable (doigt sur téléphone).
  const rendu = useMemo(() => L.canvas({ tolerance: 8 }), []);

  // Apparence calculée UNE fois par voirie (même couleur pour tous ses segments).
  const apparences = useMemo(() => {
    const m = new Map<string, ApparenceVoirie>();
    for (const f of voies.features) {
      const cle = `${f.properties.rid}|${f.properties.spw}`;
      if (!m.has(cle)) m.set(cle, apparenceDe(fiches[f.properties.rid], f.properties.spw, parametres));
    }
    return m;
  }, [voies, fiches, parametres]);
  const apparence = useCallback((p: SegmentProps) => apparences.get(`${p.rid}|${p.spw}`)!, [apparences]);

  // (Re)création de la couche quand les filtres, les fiches ou les paramètres changent
  // (après un enregistrement, tous les segments de la voirie changent ensemble).
  useEffect(() => {
    const couche = L.geoJSON(voies, {
      renderer: rendu,
      filter: (f) => {
        const p = f.properties as SegmentProps;
        return categoriesVisibles[p.cat] && (!gestionnaireVisible || (fiches[p.rid]?.gestionnaire ?? "inconnu") === gestionnaireVisible);
      },
      style: (f) => styleSegment(f!.properties as SegmentProps, apparence(f!.properties as SegmentProps)),
      onEachFeature: (f, layer) => {
        const p = f.properties as SegmentProps;
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectionRef.current(p.rid);
        });
      },
    } as L.GeoJSONOptions);
    couche.addTo(carte);
    return () => {
      couche.remove();
    };
  }, [carte, voies, categoriesVisibles, gestionnaireVisible, fiches, apparence, rendu]);

  // Mise en évidence de TOUS les segments de la voirie sélectionnée, par-dessus :
  // un contour sombre, puis la couleur de priorité de la voirie.
  useEffect(() => {
    if (!selection) return;
    const traits = voies.features.filter((f) => f.properties.rid === selection);
    if (!traits.length) return;
    const collection = { type: "FeatureCollection" as const, features: traits };
    const style = (f?: Feature) => stylesSelection(f!.properties as SegmentProps, apparence(f!.properties as SegmentProps));
    const contour = L.geoJSON(collection, { renderer: rendu, interactive: false, style: (f) => style(f).contour } as L.GeoJSONOptions);
    const trait = L.geoJSON(collection, { renderer: rendu, interactive: false, style: (f) => style(f).trait } as L.GeoJSONOptions);
    const groupe = L.featureGroup([contour, trait]).addTo(carte);
    const limites = contour.getBounds();
    if (premiereSelection.current || !carte.getBounds().contains(limites)) {
      premiereSelection.current = false;
      carte.fitBounds(limites, { padding: [60, 60], maxZoom: 17 });
    }
    return () => {
      groupe.remove();
    };
  }, [selection, voies, apparence, carte, rendu, categoriesVisibles, gestionnaireVisible]);

  return null;
}

function Cadrage({ limite, actif }: { limite: LimiteGeo; actif: boolean }) {
  const carte = useMap();
  useEffect(() => {
    if (!actif) return;
    const commune = limite.features.find((f) => f.properties.type === "commune");
    if (commune) carte.fitBounds(L.geoJSON(commune).getBounds(), { padding: [16, 16] });
  }, [carte, limite, actif]);
  return null;
}

export default function CarteLeaflet(props: Props) {
  // Voirie demandée à l'ouverture : on cadre sur elle plutôt que sur la commune.
  const [selectionInitiale] = useState(props.selection);
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
        gestionnaireVisible={props.gestionnaireVisible}
        fiches={props.fiches}
        parametres={props.parametres}
        selection={props.selection}
        onSelection={props.onSelection}
      />
      <Cadrage limite={props.limite} actif={!selectionInitiale} />
      <ScaleControl imperial={false} position="bottomleft" />
    </MapContainer>
  );
}
