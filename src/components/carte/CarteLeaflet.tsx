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
import { apparenceDe, STYLE_COMMUNE, STYLE_SECTION, styleSegment, stylesSelection, STYLES_TRACE, type ApparenceVoirie, type ModeCouleur } from "@/components/carte/styles-carte";
import { attributionSegments, ficheDuSegment } from "@/lib/geo/sections";
import { cleEtat, type FiltreEtat } from "@/lib/donnees/etat";
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
  /** Ce que représente la couleur : score de priorité ou note d'état. */
  modeCouleur: ModeCouleur;
  /** Notes d'état affichées (toutes si la liste contient les 6 valeurs). */
  etatsVisibles: ReadonlySet<FiltreEtat>;
  /** Voirie à mettre en évidence (pour une section : sa voirie mère). */
  selection: string | null;
  onSelection: (roadId: string) => void;
  /** Mode « choisir les morceaux d'une partie de rue » (null = carte normale). */
  trace: ModeTrace | null;
}

export interface ModeTrace {
  /** Rue mère dont on choisit des morceaux. */
  parentId: string;
  choisis: ReadonlySet<string>;
  /** Morceaux déjà pris par une autre partie de la même rue (non cliquables). */
  pris: ReadonlySet<string>;
  onBasculer: (segmentId: string) => void;
}

/** Couche des voies : un tracé par segment, mais couleur et sélection par voirie logique. */
function CoucheVoies({ voies, categoriesVisibles, gestionnaireVisible, fiches, parametres, modeCouleur, etatsVisibles, selection, onSelection, trace }: Omit<Props, "limite">) {
  const carte = useMap();
  // La première sélection (venue de l'adresse) recentre toujours la carte.
  const premiereSelection = useRef(selection !== null);
  const onSelectionRef = useRef(onSelection);
  useEffect(() => {
    onSelectionRef.current = onSelection;
  }, [onSelection]);

  // Rendu canvas avec une marge de clic confortable (doigt sur téléphone).
  const rendu = useMemo(() => L.canvas({ tolerance: 8 }), []);

  // Un morceau choisi pour une partie de rue prend la fiche (et la couleur) de cette partie.
  const attribution = useMemo(() => attributionSegments(fiches), [fiches]);
  const proprietaire = useCallback((p: SegmentProps) => ficheDuSegment(p, attribution), [attribution]);
  const traceActif = trace !== null;
  const parentTrace = trace?.parentId ?? null;

  // Apparence calculée UNE fois par voirie (même couleur pour tous ses segments).
  const apparences = useMemo(() => {
    const m = new Map<string, ApparenceVoirie>();
    for (const f of voies.features) {
      const id = ficheDuSegment(f.properties, attribution);
      const cle = `${id}|${f.properties.spw}`;
      if (!m.has(cle)) m.set(cle, apparenceDe(fiches[id], f.properties.spw, parametres, modeCouleur));
    }
    return m;
  }, [voies, fiches, parametres, modeCouleur, attribution]);
  const apparence = useCallback((p: SegmentProps) => apparences.get(`${proprietaire(p)}|${p.spw}`)!, [apparences, proprietaire]);

  // (Re)création de la couche quand les filtres, les fiches ou les paramètres changent
  // (après un enregistrement, tous les segments de la voirie changent ensemble).
  useEffect(() => {
    const couche = L.geoJSON(voies, {
      renderer: rendu,
      filter: (f) => {
        const p = f.properties as SegmentProps;
        if (parentTrace) return p.rid !== parentTrace; // la rue en cours de découpage est dessinée à part
        const fiche = fiches[proprietaire(p)];
        return (
          categoriesVisibles[p.cat] &&
          (!gestionnaireVisible || (fiche?.gestionnaire ?? "inconnu") === gestionnaireVisible) &&
          etatsVisibles.has(cleEtat(fiche?.evaluation?.etat_note))
        );
      },
      style: (f) => {
        const st = styleSegment(f!.properties as SegmentProps, apparence(f!.properties as SegmentProps));
        // Pendant le choix des morceaux, le reste de la carte est estompé et ne réagit pas.
        return parentTrace ? { ...st, opacity: 0.25 } : st;
      },
      interactive: !parentTrace,
      onEachFeature: (f, layer) => {
        if (parentTrace) return;
        const p = f.properties as SegmentProps;
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectionRef.current(proprietaire(p));
        });
      },
    } as L.GeoJSONOptions);
    couche.addTo(carte);
    return () => {
      couche.remove();
    };
  }, [carte, voies, categoriesVisibles, gestionnaireVisible, etatsVisibles, fiches, apparence, rendu, proprietaire, parentTrace]);

  // Mode « choisir les morceaux » : la rue mère, morceau par morceau, cliquable.
  const traceRef = useRef(trace);
  useEffect(() => {
    traceRef.current = trace;
  }, [trace]);
  useEffect(() => {
    if (!parentTrace) return;
    const morceaux = voies.features.filter((f) => f.properties.rid === parentTrace);
    if (morceaux.length) carte.fitBounds(L.geoJSON({ type: "FeatureCollection", features: morceaux } as VoiesGeo).getBounds(), { padding: [70, 70], maxZoom: 18 });
  }, [carte, voies, parentTrace]);
  useEffect(() => {
    if (!trace) return;
    const morceaux = voies.features.filter((f) => f.properties.rid === trace.parentId);
    const couche = L.geoJSON({ type: "FeatureCollection", features: morceaux } as VoiesGeo, {
      renderer: rendu,
      style: (f) => {
        const sid = (f!.properties as SegmentProps).sid;
        return trace.choisis.has(sid) ? STYLES_TRACE.choisi : trace.pris.has(sid) ? STYLES_TRACE.pris : STYLES_TRACE.libre;
      },
      onEachFeature: (f, layer) => {
        const sid = (f.properties as SegmentProps).sid;
        if (trace.pris.has(sid)) return;
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          traceRef.current?.onBasculer(sid);
        });
      },
    } as L.GeoJSONOptions).addTo(carte);
    return () => {
      couche.remove();
    };
  }, [carte, voies, trace, rendu]);

  // Mise en évidence de TOUS les segments de la voirie sélectionnée, par-dessus :
  // un contour sombre, puis la couleur de priorité de la voirie.
  useEffect(() => {
    if (!selection || traceActif) return;
    // Une rue : tous ses morceaux ; une partie de rue : ses morceaux choisis.
    const traits = voies.features.filter((f) => f.properties.rid === selection || attribution.get(f.properties.sid) === selection);
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
  }, [selection, voies, apparence, carte, rendu, categoriesVisibles, gestionnaireVisible, etatsVisibles, attribution, traceActif]);

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
        modeCouleur={props.modeCouleur}
        etatsVisibles={props.etatsVisibles}
        selection={props.selection}
        onSelection={props.onSelection}
        trace={props.trace}
      />
      <Cadrage limite={props.limite} actif={!selectionInitiale} />
      <ScaleControl imperial={false} position="bottomleft" />
    </MapContainer>
  );
}
