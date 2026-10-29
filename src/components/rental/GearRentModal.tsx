'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GearCartLine, GearItem } from '@/lib/gear-rental';
import { GEAR_FALLBACK_IMAGE, getGearById, gearSave } from '@/lib/gear-rental';
import { useBodyScrollLock } from '@/lib/dom/use-body-scroll-lock';
import './gear-rental.css';

type TrekGroup = {
  label: string;
  items: { id: string; title: string }[];
};

type Props = {
  item: GearItem | null;
  trekId?: string;
  trekGroups?: TrekGroup[];
  trekTitle?: string;
  initial?: Pick<GearCartLine, 'qty' | 'size'>;
  onClose: () => void;
  onTrekChange?: (trekId: string) => void;
  onConfirm: (payload: { qty: number; size?: string }) => void;
  onRemove?: () => void;
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function GearRentModal({
  item,
  trekId,
  trekGroups,
  trekTitle,
  initial,
  onClose,
  onTrekChange,
  onConfirm,
  onRemove,
}: Props) {
  const titleId = useId();
  const trekSelectId = useId();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!item) return;
    setQty(initial?.qty ?? 1);
    setSize(initial?.size ?? item.sizes?.[0] ?? '');
    setImgSrc(item.img);
  }, [item, initial?.qty, initial?.size]);

  useBodyScrollLock(Boolean(item));

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  if (!item || !mounted) return null;

  const live = getGearById(item.id) ?? item;
  const needsSize = Boolean(live.sizes?.length);
  const showTrekPicker = Boolean(trekGroups?.length && onTrekChange);
  const hasTrek = showTrekPicker ? Boolean(trekId) : Boolean(trekId || trekTitle);
  const canSave = hasTrek && (!needsSize || Boolean(size));

  return createPortal(
    <div className="it-gear-modal" role="presentation" onClick={onClose}>
      <div
        className="it-gear-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="it-gear-modal__close" aria-label="Close" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>

        <div className="it-gear-modal__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc || live.img}
            alt={live.name}
            onError={() => setImgSrc(GEAR_FALLBACK_IMAGE)}
          />
        </div>

        <div className="it-gear-modal__body">
          <div className="it-gear-modal__scroll">
            <p className="it-gear-modal__kicker">Rent for this departure</p>
            <h3 id={titleId}>{live.name}</h3>
            <p className="it-gear-modal__tag">{live.tagline}</p>

            <div className={`it-gear-modal__field${showTrekPicker && !hasTrek ? ' is-required' : ''}`}>
              {showTrekPicker ? (
                <>
                  <label htmlFor={trekSelectId} className="it-gear-modal__label">
                    Your departure
                  </label>
                  <select
                    id={trekSelectId}
                    className="it-gear-modal__select"
                    value={trekId ?? ''}
                    onChange={(e) => onTrekChange?.(e.target.value)}
                  >
                    <option value="">Select trek, yatra, or trip</option>
                    {trekGroups!.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.items.map((trek) => (
                          <option key={trek.id} value={trek.id}>
                            {trek.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {!hasTrek ? (
                    <p className="it-gear-modal__warn" role="status">
                      Pick your departure so we hold this gear at the right base camp.
                    </p>
                  ) : trekTitle ? (
                    <p className="it-gear-modal__trek">Pickup on day 1 of {trekTitle}</p>
                  ) : null}
                </>
              ) : trekTitle ? (
                <p className="it-gear-modal__trek it-gear-modal__trek--locked">
                  Pickup on day 1 of <strong>{trekTitle}</strong>
                </p>
              ) : null}
            </div>

            <div className="it-gear-modal__price">
              <strong>{inr(live.price)}</strong>
              <span>/trek</span>
              <em>Save {inr(gearSave(live))} vs buying</em>
            </div>

            {needsSize ? (
              <fieldset className="it-gear-modal__field">
                <legend>Size</legend>
                <div className="it-gear-modal__sizes">
                  {live.sizes!.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={option === size ? 'is-on' : ''}
                      onClick={() => setSize(option)}
                      aria-pressed={option === size}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="it-gear-modal__field">
              <span className="it-gear-modal__label">Quantity</span>
              <div className="it-gear-modal__qty">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((v) => Math.min(8, v + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <p className="it-gear-modal__note">
              Collect at base camp. Refundable cash deposit {inr(live.deposit)} per item, returned
              when the kit comes back.
            </p>
          </div>

          <div className="it-gear-modal__actions">
            <button
              type="button"
              className="it-gear-modal__add"
              disabled={!canSave}
              onClick={() => onConfirm({ qty, size: needsSize ? size : undefined })}
            >
              {hasTrek
                ? `Add ${inr(live.price * qty)} to booking`
                : 'Select departure to continue'}
            </button>
            {onRemove ? (
              <button type="button" className="it-gear-modal__remove" onClick={onRemove}>
                Remove from booking
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
