import { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Crop } from './SolarIcons';

interface ImageCropModalProps {
    imageSrc: string;
    onCancel: () => void;
    onConfirm: (croppedBlob: Blob) => void;
}

interface AspectOption {
    id: string;
    label: string;
    ratio: number; // width / height
}

const ASPECT_OPTIONS: AspectOption[] = [
    { id: '4:3', label: '4:3 (App Standard)', ratio: 4 / 3 },
    { id: '3:4', label: '3:4 (Carrousel Portrait)', ratio: 3 / 4 },
    { id: '1:1', label: '1:1 (Carré)', ratio: 1 },
    { id: '16:9', label: '16:9 (Bannière)', ratio: 16 / 9 },
];

const FRAME_MAX_WIDTH = 440;
const FRAME_MAX_HEIGHT = 340;

export function ImageCropModal({ imageSrc, onCancel, onConfirm }: ImageCropModalProps) {
    const [aspect, setAspect] = useState<AspectOption>(ASPECT_OPTIONS[0]);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const [exporting, setExporting] = useState(false);

    const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    // Dimensions du cadre de recadrage selon le ratio sélectionné
    const frameWidth =
        aspect.ratio >= FRAME_MAX_WIDTH / FRAME_MAX_HEIGHT
            ? FRAME_MAX_WIDTH
            : Math.round(FRAME_MAX_HEIGHT * aspect.ratio);
    const frameHeight = Math.round(frameWidth / aspect.ratio);

    useEffect(() => {
        setOffset({ x: 0, y: 0 });
        setZoom(1);
    }, [aspect.id, imageSrc]);

    // Calcule la taille affichée de l'image pour qu'elle couvre toujours le cadre ("cover")
    const baseScale = imgSize
        ? Math.max(frameWidth / imgSize.w, frameHeight / imgSize.h)
        : 1;
    const effectiveScale = baseScale * zoom;
    const renderedW = (imgSize?.w || frameWidth) * effectiveScale;
    const renderedH = (imgSize?.h || frameHeight) * effectiveScale;

    const clampOffset = (nx: number, ny: number) => {
        const maxX = Math.max(0, (renderedW - frameWidth) / 2);
        const maxY = Math.max(0, (renderedH - frameHeight) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, nx)),
            y: Math.max(-maxY, Math.min(maxY, ny)),
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            origX: offset.x,
            origY: offset.y,
        };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !dragStartRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setOffset(clampOffset(dragStartRef.current.origX + dx, dragStartRef.current.origY + dy));
    };

    const handlePointerUp = () => {
        setDragging(false);
        dragStartRef.current = null;
    };

    const handleZoomChange = (nextZoom: number) => {
        const z = Math.max(1, Math.min(3, nextZoom));
        setZoom(z);
        const nextScale = baseScale * z;
        const nextW = (imgSize?.w || frameWidth) * nextScale;
        const nextH = (imgSize?.h || frameHeight) * nextScale;
        const maxX = Math.max(0, (nextW - frameWidth) / 2);
        const maxY = Math.max(0, (nextH - frameHeight) / 2);
        setOffset(prev => ({
            x: Math.max(-maxX, Math.min(maxX, prev.x)),
            y: Math.max(-maxY, Math.min(maxY, prev.y)),
        }));
    };

    const handleConfirm = () => {
        const img = imgRef.current;
        if (!img || !imgSize) return;
        setExporting(true);

        const targetWidth = 1200;
        const targetHeight = Math.round(targetWidth / aspect.ratio);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setExporting(false);
            return;
        }

        // Coordonnées source dans l'image originale correspondant au cadre visible
        const imgLeftInFrame = (frameWidth - renderedW) / 2 + offset.x;
        const imgTopInFrame = (frameHeight - renderedH) / 2 + offset.y;

        const sx = Math.max(0, -imgLeftInFrame / effectiveScale);
        const sy = Math.max(0, -imgTopInFrame / effectiveScale);
        const sWidth = Math.min(imgSize.w - sx, frameWidth / effectiveScale);
        const sHeight = Math.min(imgSize.h - sy, frameHeight / effectiveScale);

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
            (blob) => {
                setExporting(false);
                if (blob) onConfirm(blob);
            },
            'image/jpeg',
            0.9
        );
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal-content"
                style={{ width: '100%', maxWidth: '540px', padding: '24px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Crop size={17} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                                Recadrer l’image
                            </h3>
                            <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                Glissez l’image pour ajuster le cadrage
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onCancel} className="btn-icon" aria-label="Fermer">
                        <X size={18} />
                    </button>
                </div>

                {/* Choix du ratio */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {ASPECT_OPTIONS.map((opt) => {
                        const active = opt.id === aspect.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setAspect(opt)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                    background: active ? 'var(--primary-light)' : 'var(--surface)',
                                    color: active ? 'var(--primary)' : 'var(--text-secondary)',
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* Zone de recadrage interactive */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        style={{
                            width: `${frameWidth}px`,
                            height: `${frameHeight}px`,
                            maxWidth: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '14px',
                            border: '2px solid var(--primary)',
                            background: '#121110',
                            cursor: dragging ? 'grabbing' : 'grab',
                            touchAction: 'none',
                            userSelect: 'none',
                        }}
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            crossOrigin={imageSrc.startsWith('data:') ? undefined : 'anonymous'}
                            alt="Aperçu recadrage"
                            draggable={false}
                            onLoad={(e) => {
                                const target = e.currentTarget;
                                setImgSize({ w: target.naturalWidth, h: target.naturalHeight });
                            }}
                            style={{
                                position: 'absolute',
                                left: `${(frameWidth - renderedW) / 2 + offset.x}px`,
                                top: `${(frameHeight - renderedH) / 2 + offset.y}px`,
                                width: `${renderedW}px`,
                                height: `${renderedH}px`,
                                pointerEvents: 'none',
                                maxWidth: 'none',
                            }}
                        />

                        {/* Grille des tiers */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}>
                            {Array.from({ length: 9 }).map((_, idx) => (
                                <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.16)' }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contrôle de zoom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleZoomChange(zoom - 0.15)}
                        title="Dézoomer"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => handleZoomChange(Number(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--primary)' }}
                    />
                    <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleZoomChange(zoom + 0.15)}
                        title="Zoomer"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        type="button"
                        className="btn-icon"
                        onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                        title="Réinitialiser"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={onCancel} className="btn btn-secondary">
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={exporting || !imgSize}
                        className="btn btn-primary"
                    >
                        <Check size={15} />
                        {exporting ? 'Export...' : 'Valider et uploader'}
                    </button>
                </div>
            </div>
        </div>
    );
}
