'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { JourneyMode, MapSelection, MapStyleMode, TrekMapLocation, TrekMapModel } from '@/types/trek-map';
import { adaptTrekGeography, dayLabelForSelection } from '@/lib/trek-map/adapt-model';
import {
  applyGlobeIfZoomedOut,
  cameraTargetForSelection,
  centerForModel,
  flyToTarget,
  resetCamera,
} from '@/lib/trek-map/camera';
import { setTrackerPosition, clearTracker, syncTrekLayers, clearRouteTrim, LAYER, locationFromFeatureProps } from '@/lib/trek-map/layers';
import { progressFocusCoordinate } from '@/lib/trek-map/route-progress';
import {
  getMapAccessToken,
  mapboxStyleFallbacks,
  mapboxStyleUrl,
  TREK_MAP_CONFIG,
} from '@/lib/trek-map/mapbox';
import { ensureTerrain, refreshPointLayerOrder } from '@/lib/trek-map/terrain';
import { coordinateAtDistanceKm, polylineLengthKm } from '@/lib/trek-map/geo-utils';
import { buildJourneyPath } from '@/lib/trek-map/journey-path';
import {
  TrekJourneyController,
  type JourneyUiSnapshot,
} from '@/lib/trek-map/journey-controller';
import type { RouteProfile } from '@/lib/treks/route-profile-types';
import type { TrekGeography } from '@/lib/treks/geography/types';
import { useBodyScrollLock } from '@/lib/dom/use-body-scroll-lock';
import TrekMapControls from './TrekMapControls';
import CinematicControls from './CinematicControls';
import LocationCard from './LocationCard';
import LocationSheet from './LocationSheet';
import ElevationProfile from './ElevationProfile';
import MapFallback from './MapFallback';
import './trek-map.css';

type MapFeatureProps = { properties?: Record<string, unknown> };

type Props = {
  geography: TrekGeography;
  profile: RouteProfile;
  trekTitle: string;
  selection: MapSelection;
  onSelectionChange?: (selection: MapSelection) => void;
  profileFocusKm?: number | null;
  onProfileFocusChange?: (km: number | null) => void;
};

const IDLE_JOURNEY: JourneyUiSnapshot = {
  progress: 0,
  playing: false,
  interrupted: false,
  speed: 1,
  distanceKm: 0,
  day: null,
  dayLabel: '',
  cue: null,
  phase: 'idle',
  mode: 'complete',
};

export default function TrekMap({
  geography,
  profile,
  trekTitle,
  selection,
  onSelectionChange,
  profileFocusKm = null,
  onProfileFocusChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const modelRef = useRef<TrekMapModel | null>(null);
  const journeyRef = useRef<TrekJourneyController | null>(null);
  const styleModeRef = useRef<MapStyleMode>('standard');
  const appliedStyleRef = useRef<MapStyleMode>('standard');
  const is3DRef = useRef(false);
  const selectionRef = useRef(selection);
  const readyRef = useRef(false);
  const cinematicRef = useRef(false);
  const onSelectionChangeRef = useRef(onSelectionChange);

  const [mapReady, setMapReady] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [styleMode, setStyleMode] = useState<MapStyleMode>('standard');
  const [is3D, setIs3D] = useState(false);
  const [showElevation, setShowElevation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const [journeyMode, setJourneyMode] = useState<JourneyMode>('complete');
  const [journeySnap, setJourneySnap] = useState<JourneyUiSnapshot>(IDLE_JOURNEY);
  const [selectedLocation, setSelectedLocation] = useState<TrekMapLocation | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const model = useMemo(
    () => adaptTrekGeography(geography, profile, trekTitle),
    [geography, profile, trekTitle],
  );

  const effectiveMode: JourneyMode =
    journeyMode === 'complete' && !model.journey.supportsCompleteJourney
      ? 'trek-only'
      : journeyMode;

  const journeyMeta = useMemo(
    () => buildJourneyPath(model, effectiveMode),
    [model, effectiveMode],
  );

  const journeyModeRef = useRef(effectiveMode);

  useLayoutEffect(() => {
    journeyModeRef.current = effectiveMode;
    modelRef.current = model;
    styleModeRef.current = styleMode;
    is3DRef.current = is3D;
    selectionRef.current = selection;
    cinematicRef.current = cinematic;
    onSelectionChangeRef.current = onSelectionChange;
  }, [effectiveMode, model, styleMode, is3D, selection, cinematic, onSelectionChange]);

  const trekCoords = useMemo(
    () => model.segments.filter((s) => s.category === 'trek').flatMap((s) => s.coordinates),
    [model.segments],
  );
  const trekTotalKm = useMemo(() => polylineLengthKm(trekCoords), [trekCoords]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const id = window.setTimeout(() => {
      try {
        map.resize();
      } catch {
        // ignore
      }
    }, 80);
    return () => window.clearTimeout(id);
  }, [isFullscreen, mapReady, cinematic]);

  useBodyScrollLock(isFullscreen);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const restoreLayers = useCallback((map: mapboxgl.Map) => {
    const m = modelRef.current;
    if (!m || !map.isStyleLoaded()) return;
    try {
      syncTrekLayers(map, m, selectionRef.current, journeyModeRef.current);
      ensureTerrain(map, is3DRef.current || cinematicRef.current);
      refreshPointLayerOrder(map);
      applyGlobeIfZoomedOut(map);
      if (!cinematicRef.current) clearRouteTrim(map);
    } catch {
      // Style may still be settling.
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    let map: mapboxgl.Map | null = null;

    const start = async () => {
      let accessToken = getMapAccessToken();
      if (!accessToken.startsWith('pk.')) {
        try {
          const res = await fetch('/api/mapbox-token', { cache: 'no-store' });
          const data = (await res.json()) as { token?: string | null };
          if (data.token?.startsWith('pk.')) accessToken = data.token;
        } catch {
          // ignore — fall through to missing-token UI
        }
      }
      if (cancelled) return;
      if (!accessToken.startsWith('pk.')) {
        setFatalError(
          'Add a Mapbox public token (pk.…) to NEXT_PUBLIC_MAPBOX_TOKEN in .env.local, then restart the dev server.',
        );
        return;
      }
      if (!containerRef.current) return;

      mapboxgl.accessToken = accessToken;
      const center = centerForModel(model);
      const initialFallbacks = mapboxStyleFallbacks('standard', accessToken);
      let styleAttempt = 0;

      map = new mapboxgl.Map({
        container: containerRef.current,
        accessToken,
        style: initialFallbacks[0] ?? mapboxStyleUrl('standard', accessToken),
        center,
        zoom: TREK_MAP_CONFIG.fitMinZoom + 1,
        pitch: 0,
        bearing: TREK_MAP_CONFIG.defaultBearing,
        minZoom: TREK_MAP_CONFIG.mapMinZoom,
        maxZoom: TREK_MAP_CONFIG.mapMaxZoom,
        projection: 'globe',
        antialias: true,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false,
        transformRequest: (url) => {
          if (!url.includes('api.mapbox.com') && !url.includes('tiles.mapbox.com')) {
            return { url };
          }
          if (url.includes('access_token=')) return { url };
          const joiner = url.includes('?') ? '&' : '?';
          return { url: `${url}${joiner}access_token=${encodeURIComponent(accessToken)}` };
        },
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

      const onStyleReady = () => {
        if (cancelled || !map) return;
        readyRef.current = true;
        restoreLayers(map);
        const m = modelRef.current;
        if (m && !cinematicRef.current) {
          flyToTarget(map, cameraTargetForSelection(m, selectionRef.current, is3DRef.current), {
            animate: false,
          });
        }
        setMapReady(true);
        setFatalError(null);
      };

      map.on('style.load', onStyleReady);
      const syncGlobeProjection = () => {
        if (!map || cinematicRef.current) return;
        try {
          applyGlobeIfZoomedOut(map);
        } catch {
          // ignore
        }
      };
      map.on('zoom', syncGlobeProjection);
      map.on('zoomend', syncGlobeProjection);

      const pickLocation = (e: mapboxgl.MapLayerMouseEvent) => {
        if (cinematicRef.current && journeyRef.current?.getSnapshot().playing) {
          journeyRef.current.interrupt();
        }
        const props = (e.features?.[0] as MapFeatureProps | undefined)?.properties;
        if (!props || !modelRef.current) return;
        const loc = locationFromFeatureProps(modelRef.current, props as Record<string, unknown>);
        if (!loc) return;
        setSelectedLocation(loc);
        if (loc.kind === 'summit' && modelRef.current.hasSummit) {
          onSelectionChangeRef.current?.('summit');
        } else if (loc.days.length === 1) {
          onSelectionChangeRef.current?.(loc.days[0]);
        }
      };

      map.on('click', LAYER.markers, pickLocation);
      map.on('click', LAYER.summit, pickLocation);
      map.on('click', LAYER.itineraryStops, pickLocation);
      for (const layerId of [LAYER.markers, LAYER.summit, LAYER.itineraryStops]) {
        map.on('mouseenter', layerId, () => {
          map!.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map!.getCanvas().style.cursor = '';
        });
      }

      map.on('error', () => {
        // Tile/style/auth noise is common during style.load. Never blank the map.
        if (
          map &&
          !cancelled &&
          !readyRef.current &&
          styleAttempt < initialFallbacks.length - 1
        ) {
          styleAttempt += 1;
          const next = initialFallbacks[styleAttempt];
          if (next) {
            try {
              map.setStyle(next);
            } catch {
              // keep waiting for style.load
            }
          }
        }
      });

      mapRef.current = map;
      appliedStyleRef.current = 'standard';
    };

    void start();

    return () => {
      cancelled = true;
      journeyRef.current?.destroy();
      journeyRef.current = null;
      map?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const m = modelRef.current;
    if (!map || !mapReady || !m || cinematic) return;
    syncTrekLayers(map, m, selection, effectiveMode);
    flyToTarget(map, cameraTargetForSelection(m, selection, is3D));
    const focus = progressFocusCoordinate(m, selection, effectiveMode);
    if (focus && selection !== 'overview') {
      setTrackerPosition(map, focus[0], focus[1]);
    } else {
      clearTracker(map);
    }
  }, [selection, model, mapReady, is3D, cinematic, effectiveMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || cinematic) return;
    ensureTerrain(map, is3D);
    refreshPointLayerOrder(map);
    const m = modelRef.current;
    if (m) flyToTarget(map, cameraTargetForSelection(m, selectionRef.current, is3D));
  }, [is3D, mapReady, cinematic]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (appliedStyleRef.current === styleMode) return;
    appliedStyleRef.current = styleMode;
    readyRef.current = false;
    map.setStyle(mapboxStyleUrl(styleMode, getMapAccessToken()));
  }, [styleMode, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || cinematic || profileFocusKm == null || trekCoords.length < 2) {
      if (mapRef.current && !cinematic) clearTracker(mapRef.current);
      return;
    }
    const coord = coordinateAtDistanceKm(trekCoords, trekTotalKm, profileFocusKm);
    if (coord) setTrackerPosition(map, coord[0], coord[1]);
  }, [profileFocusKm, trekCoords, trekTotalKm, mapReady, cinematic]);

  const ensureJourney = useCallback(() => {
    const map = mapRef.current;
    const m = modelRef.current;
    if (!map || !m) return null;
    if (journeyRef.current) {
      journeyRef.current.destroy();
    }
    const controller = new TrekJourneyController({
      map,
      model: m,
      mode: journeyModeRef.current,
      isMobile,
      onUpdate: (snap) => setJourneySnap(snap),
      onDayChange: (sel) => onSelectionChangeRef.current?.(sel),
      onComplete: () => setJourneySnap((s) => ({ ...s, playing: false, phase: 'outro' })),
    });
    journeyRef.current = controller;
    return controller;
  }, [isMobile]);

  const startCinematic = useCallback(() => {
    const map = mapRef.current;
    if (!map || !journeyMeta.canPlay) return;

    setCinematic(true);
    setSelectedLocation(null);
    setStyleMode('satellite');
    setIs3D(true);
    is3DRef.current = true;
    cinematicRef.current = true;
    ensureTerrain(map, true);

    // Wait a tick for style/terrain if satellite already applied
    const boot = () => {
      const controller = ensureJourney();
      if (!controller?.canPlay()) return;
      controller.restart();
    };

    if (appliedStyleRef.current !== 'satellite') {
      appliedStyleRef.current = 'satellite';
      map.once('style.load', () => {
        restoreLayers(map);
        boot();
      });
      map.setStyle(mapboxStyleUrl('satellite', getMapAccessToken()));
    } else {
      boot();
    }
  }, [ensureJourney, journeyMeta.canPlay, restoreLayers]);

  const exitCinematic = useCallback(() => {
    journeyRef.current?.destroy();
    journeyRef.current = null;
    setCinematic(false);
    cinematicRef.current = false;
    setJourneySnap(IDLE_JOURNEY);
    const map = mapRef.current;
    const m = modelRef.current;
    if (map) {
      clearRouteTrim(map);
      clearTracker(map);
      ensureTerrain(map, is3DRef.current);
      if (m) {
        syncTrekLayers(map, m, selectionRef.current, journeyModeRef.current);
        flyToTarget(map, cameraTargetForSelection(m, 'overview', is3DRef.current));
      }
    }
    onSelectionChangeRef.current?.('overview');
  }, []);

  const handleFitTrek = useCallback(() => {
    if (cinematicRef.current) return;
    const map = mapRef.current;
    const m = modelRef.current;
    if (!map || !m) return;
    flyToTarget(map, cameraTargetForSelection(m, selectionRef.current, is3DRef.current));
  }, []);

  const handleReset = useCallback(() => {
    if (cinematicRef.current) {
      exitCinematic();
      return;
    }
    const map = mapRef.current;
    const m = modelRef.current;
    if (!map || !m) return;
    setSelectedLocation(null);
    onSelectionChangeRef.current?.('overview');
    resetCamera(map, m, is3DRef.current);
  }, [exitCinematic]);

  const exploreDayFromCard = useCallback(() => {
    if (!selectedLocation) return;
    const day = selectedLocation.days[0];
    if (day != null) onSelectionChangeRef.current?.(day);
    setSelectedLocation(null);
    handleFitTrek();
  }, [selectedLocation, handleFitTrek]);

  const dayLabel = selectedLocation
    ? selectedLocation.days.length === 1
      ? `Day ${selectedLocation.days[0]}`
      : `Days ${selectedLocation.days.join(', ')}`
    : dayLabelForSelection(model, selection);

  if (!model.segments.length && !model.locations.length) {
    return (
      <MapFallback
        message="Verified route coordinates are not yet available for this trek."
        detail="Itinerary and altitude chart remain available below."
      />
    );
  }

  return (
    <div
      className={`tm-shell${cinematic ? ' is-cinematic' : ''}${isMobile && cinematic ? ' is-mobile-cinematic' : ''}${isFullscreen ? ' is-fullscreen' : ''}`}
    >
      <div className="tm-map-wrap">
        <div
          ref={containerRef}
          className="tm-map-canvas"
          aria-label={`${trekTitle} 3D trek map`}
          role="application"
        />

        {!mapReady && !fatalError && (
          <div className="tm-loading" aria-live="polite">
            <span className="tm-loading-pulse" aria-hidden />
            Loading map…
          </div>
        )}

        {fatalError && (
          <div className="tm-fatal" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden />
            <strong>Map unavailable</strong>
            <p>{fatalError}</p>
          </div>
        )}

        {!cinematic && (
          <TrekMapControls
            styleMode={styleMode}
            is3D={is3D}
            showElevation={showElevation}
            isFullscreen={isFullscreen}
            cinematicAvailable={journeyMeta.canPlay}
            journeyMode={effectiveMode}
            supportsCompleteJourney={model.journey.supportsCompleteJourney}
            onStyleModeChange={setStyleMode}
            onToggle3D={() => setIs3D((v) => !v)}
            onToggleElevation={() => setShowElevation((v) => !v)}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            onFitTrek={handleFitTrek}
            onReset={handleReset}
            onExplore3D={startCinematic}
            onJourneyModeChange={setJourneyMode}
          />
        )}

        {!cinematic && (
          <div className="tm-legend" aria-label="Map legend">
            <span>
              <i className="tm-legend-swatch tm-legend-swatch--green" aria-hidden />
              Completed route
            </span>
            <span>
              <i className="tm-legend-swatch tm-legend-swatch--muted" aria-hidden />
              Upcoming
            </span>
            {effectiveMode === 'complete' && (
              <span>
                <i className="tm-legend-swatch tm-legend-swatch--transfer" aria-hidden />
                Transfer
              </span>
            )}
            <span>
              <i className="tm-legend-dot" aria-hidden />
              Stop
            </span>
            {model.hasSummit && (
              <span>
                <i className="tm-legend-summit" aria-hidden />
                Summit
              </span>
            )}
          </div>
        )}

        {cinematic && (
          <CinematicControls
            snapshot={journeySnap}
            disabledReason={journeyMeta.canPlay ? undefined : journeyMeta.reasonDisabled}
            onPlay={() => journeyRef.current?.play()}
            onPause={() => journeyRef.current?.pause()}
            onResume={() => journeyRef.current?.resume()}
            onRestart={() => journeyRef.current?.restart()}
            onSeek={(p) => journeyRef.current?.seek(p)}
            onSpeed={(s) => journeyRef.current?.setSpeed(s)}
            onExit={exitCinematic}
          />
        )}

        {!cinematic && model.stats.distanceKm != null && (
          <div className="tm-stats-hud" aria-label="Route statistics">
            <span>
              {model.stats.distanceKm.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km
            </span>
            {model.stats.gainFt != null && (
              <span>{Math.round(model.stats.gainFt).toLocaleString('en-IN')} ft gain</span>
            )}
          </div>
        )}

        {selectedLocation && !isMobile && !cinematic && (
          <LocationCard
            location={selectedLocation}
            dayLabel={dayLabel}
            onClose={() => setSelectedLocation(null)}
            onExploreDay={exploreDayFromCard}
          />
        )}
      </div>

      {!cinematic && showElevation && (
        <ElevationProfile
          samples={model.elevationSamples}
          totalDistanceKm={model.stats.distanceKm}
          focusKm={profileFocusKm}
          onFocusChange={onProfileFocusChange}
        />
      )}

      {selectedLocation && isMobile && !cinematic && (
        <LocationSheet
          location={selectedLocation}
          dayLabel={dayLabel}
          onClose={() => setSelectedLocation(null)}
          onExploreDay={exploreDayFromCard}
        />
      )}
    </div>
  );
}
