'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapSelection } from '@/types/trek-map';
import type { RouteProfile } from '@/lib/treks/route-profile-types';
import { getTrekGeography } from '@/lib/treks/geography/get-trek-geography';
import {
  activityIcon,
  activityLabel,
  formatAltitude,
  formatDistance,
} from '@/lib/treks/route-profile-utils';
import MapFallback from '@/components/trek-map/MapFallback';

const TrekMap = dynamic(() => import('@/components/trek-map/TrekMap'), {
  ssr: false,
  loading: () => (
    <div className="tm-loading" aria-live="polite" style={{ minHeight: 280, position: 'relative' }}>
      <span className="tm-loading-pulse" aria-hidden />
      Loading route map…
    </div>
  ),
});

type Props = {
  trekId: string;
  profile: RouteProfile;
  selection: MapSelection;
  onSelectionChange: (selection: MapSelection) => void;
  kindLabel: string;
  trekTitle: string;
  profileFocusKm?: number | null;
  onProfileFocusChange?: (km: number | null) => void;
};

function selectionToDay(selection: MapSelection): number | null {
  if (typeof selection === 'number') return selection;
  return null;
}

function activePointForSelection(profile: RouteProfile, selection: MapSelection) {
  if (selection === 'overview') return profile.points[0];
  if (selection === 'summit') {
    return profile.points.find((p) => p.activity === 'summit') ?? profile.points.at(-1);
  }
  return profile.points.find((p) => p.day === selection) ?? profile.points[0];
}

export default function TrekRouteMapSection({
  trekId,
  profile,
  selection,
  onSelectionChange,
  kindLabel,
  trekTitle,
  profileFocusKm = null,
  onProfileFocusChange,
}: Props) {
  const geography = useMemo(() => getTrekGeography(trekId, profile), [trekId, profile]);
  const hasSummit = useMemo(
    () => profile.points.some((p) => p.activity === 'summit'),
    [profile.points],
  );

  const activePoint = useMemo(
    () => activePointForSelection(profile, selection),
    [profile, selection],
  );

  const activeDayNum = selectionToDay(selection);
  const mapMountRef = useRef<HTMLDivElement | null>(null);
  const [mapVisible, setMapVisible] = useState(false);

  useEffect(() => {
    const el = mapMountRef.current;
    if (!el || mapVisible) return;

    if (typeof IntersectionObserver === 'undefined') {
      setMapVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMapVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapVisible]);

  return (
    <div className="kg-route-card">
      <div className="kg-route-head">
        <span className="kg-route-kicker">
          <i className="fa-solid fa-map-location-dot" aria-hidden /> Route Map
        </span>
        <h2>Itinerary route map</h2>
        <p id="kg-route-map-desc">
          {geography?.caption ??
            profile.mapCaption ??
            `Explore ${trekTitle} as one continuous journey — Complete journey or a day to highlight the route.`}
        </p>
      </div>

      <div className="kg-route-stats">
        <div className="kg-route-stat">
          <strong>{profile.points.length}</strong>
          <span>Day stops</span>
        </div>
        <div className="kg-route-stat">
          <strong>{formatAltitude(profile.maxAltitudeFt)}</strong>
          <span>Max altitude</span>
        </div>
        <div className="kg-route-stat">
          <strong>
            {profile.totalDistanceKm != null
              ? `${profile.totalDistanceKm.toLocaleString('en-IN')} km`
              : '—'}
          </strong>
          <span>Trail distance</span>
        </div>
        <div className="kg-route-stat">
          <strong>{formatAltitude(profile.totalGainFt)}</strong>
          <span>Elevation gain</span>
        </div>
      </div>

      <div className="kg-route-daybar" role="tablist" aria-label="Select map view">
        <button
          type="button"
          role="tab"
          aria-selected={selection === 'overview'}
          className={`kg-route-daypill${selection === 'overview' ? ' is-active' : ''}`}
          onClick={() => onSelectionChange('overview')}
        >
          <span className="kg-route-daypill-num">All</span>
          <span className="kg-route-daypill-label">Complete journey</span>
        </button>
        {profile.points.map((point) => (
          <button
            key={point.day}
            type="button"
            role="tab"
            aria-selected={selection === point.day}
            className={`kg-route-daypill${selection === point.day ? ' is-active' : ''}`}
            onClick={() => onSelectionChange(point.day)}
          >
            <span className="kg-route-daypill-num">D{point.day}</span>
            <span className="kg-route-daypill-label">{point.label}</span>
          </button>
        ))}
        {hasSummit && (
          <button
            type="button"
            role="tab"
            aria-selected={selection === 'summit'}
            className={`kg-route-daypill kg-route-daypill--summit${selection === 'summit' ? ' is-active' : ''}`}
            onClick={() => onSelectionChange('summit')}
          >
            <span className="kg-route-daypill-num">
              <i className="fa-solid fa-mountain" aria-hidden />
            </span>
            <span className="kg-route-daypill-label">Summit</span>
          </button>
        )}
      </div>

      <div className="kg-route-legend" aria-label="Map route key">
        <span className="kg-route-legend-item">
          <span className="kg-route-legend-line kg-route-legend-line--drive" aria-hidden /> Road transfer
        </span>
        <span className="kg-route-legend-item">
          <span className="kg-route-legend-line kg-route-legend-line--trek" aria-hidden /> Full trek route
        </span>
        <span className="kg-route-legend-item">
          <span className="kg-route-legend-line kg-route-legend-line--trek-active" aria-hidden /> Itinerary progress (green)
        </span>
      </div>

      <div className="kg-route-body">
        <div ref={mapMountRef}>
          {geography ? (
            mapVisible ? (
              <TrekMap
                geography={geography}
                profile={profile}
                trekTitle={trekTitle}
                selection={selection}
                onSelectionChange={onSelectionChange}
                profileFocusKm={profileFocusKm}
                onProfileFocusChange={onProfileFocusChange}
              />
            ) : (
              <div
                className="tm-loading"
                aria-live="polite"
                style={{ minHeight: 280, position: 'relative' }}
              >
                <span className="tm-loading-pulse" aria-hidden />
                Map loads when you scroll here…
              </div>
            )
          ) : (
            <MapFallback
              message={`Verified coordinates for this ${kindLabel.toLowerCase()} are not yet mapped.`}
              detail="Itinerary and altitude chart remain available below."
            />
          )}
        </div>

        {activePoint && (
          <aside className="kg-route-detail" aria-live="polite">
            <div className="kg-route-detail-head">
              <span className="kg-route-detail-day">
                {selection === 'overview'
                  ? 'Overview'
                  : selection === 'summit'
                    ? 'Summit'
                    : `Day ${activePoint.day}`}
              </span>
              <h3>{activePoint.label}</h3>
              <p className="kg-route-detail-title">{activePoint.title}</p>
            </div>

            <div className="kg-route-detail-grid">
              <div className="kg-route-detail-item">
                <i className={activityIcon(activePoint.activity)} aria-hidden />
                <div>
                  <strong>Activity</strong>
                  <span>{activityLabel(activePoint.activity)}</span>
                </div>
              </div>
              <div className="kg-route-detail-item">
                <i className="fa-solid fa-mountain" aria-hidden />
                <div>
                  <strong>Altitude</strong>
                  <span>{activePoint.altitudeLabel ?? formatAltitude(activePoint.altitudeFt)}</span>
                </div>
              </div>
              <div className="kg-route-detail-item">
                <i className="fa-solid fa-route" aria-hidden />
                <div>
                  <strong>Distance</strong>
                  <span>{formatDistance(activePoint.distanceKm, activePoint.distanceLabel)}</span>
                </div>
              </div>
              <div className="kg-route-detail-item">
                <i className="fa-solid fa-clock" aria-hidden />
                <div>
                  <strong>Duration</strong>
                  <span>{activePoint.duration ?? '—'}</span>
                </div>
              </div>
              <div className="kg-route-detail-item">
                <i className="fa-solid fa-utensils" aria-hidden />
                <div>
                  <strong>Meals</strong>
                  <span>{activePoint.meals ?? '—'}</span>
                </div>
              </div>
              <div className="kg-route-detail-item">
                <i className="fa-solid fa-map-pin" aria-hidden />
                <div>
                  <strong>{kindLabel} segment</strong>
                  <span>
                    {activeDayNum != null
                      ? `${activeDayNum} of ${profile.points.length}`
                      : `${profile.points.length} days`}
                  </span>
                </div>
              </div>
            </div>

            {activePoint.description && selection !== 'overview' && (
              <div className="kg-route-detail-copy">
                {activePoint.description.split(/\n{2,}/).slice(0, 2).map((part) => (
                  <p key={part.slice(0, 48)}>{part}</p>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      <details className="kg-route-a11y">
        <summary>Text route list (accessible alternative to the map)</summary>
        <ol className="kg-route-a11y-list">
          <li className={selection === 'overview' ? 'is-active' : undefined}>
            <button type="button" onClick={() => onSelectionChange('overview')}>
              <span>Complete journey</span> — pickup to drop-off
            </button>
          </li>
          {profile.points.map((point) => (
            <li key={point.day} className={selection === point.day ? 'is-active' : undefined}>
              <button type="button" onClick={() => onSelectionChange(point.day)}>
                <span>Day {point.day}</span> — {point.label}
                <span className="kg-route-a11y-meta">
                  {activityLabel(point.activity)}
                  {point.altitudeLabel ? ` · ${point.altitudeLabel}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
