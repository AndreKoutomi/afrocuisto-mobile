import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from './SolarIcons';

export interface AdminSelectOption {
    value: string;
    label: string;
}

interface AdminSelectProps {
    ariaLabel: string;
    value: string;
    options: AdminSelectOption[];
    onChange: (value: string) => void;
    style?: React.CSSProperties;
    triggerStyle?: React.CSSProperties;
}

export function AdminSelect({ ariaLabel, value, options, onChange, style, triggerStyle }: AdminSelectProps) {
    const generatedId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex(option => option.value === value)));
    const [menuPosition, setMenuPosition] = useState<React.CSSProperties | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(option => option.value === value) || options[0] || { value: '', label: 'Sélectionner...' };

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setMenuPosition(null);
            return;
        }

        const updateMenuPosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const menuHeight = Math.min(260, options.length * 36 + 10);
            const spaceBelow = window.innerHeight - rect.bottom;
            const openAbove = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
            setMenuPosition({
                position: 'fixed',
                top: openAbove ? Math.max(8, rect.top - menuHeight - 6) : rect.bottom + 6,
                left: rect.left,
                width: rect.width,
                zIndex: 1000,
            });
        };

        updateMenuPosition();
        window.addEventListener('resize', updateMenuPosition);
        window.addEventListener('scroll', updateMenuPosition, true);
        return () => {
            window.removeEventListener('resize', updateMenuPosition);
            window.removeEventListener('scroll', updateMenuPosition, true);
        };
    }, [isOpen, options.length]);

    const chooseOption = (index: number) => {
        onChange(options[index].value);
        setActiveIndex(index);
        setIsOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) {
                setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
                setIsOpen(true);
                return;
            }
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex(index => (index + direction + options.length) % options.length);
        } else if (event.key === 'Home' && isOpen) {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End' && isOpen) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
        } else if ((event.key === 'Enter' || event.key === ' ') && isOpen) {
            event.preventDefault();
            chooseOption(activeIndex);
        } else if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <div ref={rootRef} className={`admin-select${isOpen ? ' is-open' : ''}`} style={style}>
            <button
                ref={triggerRef}
                type="button"
                className="admin-select-trigger"
                style={triggerStyle}
                role="combobox"
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${generatedId}-options`}
                aria-activedescendant={isOpen ? `${generatedId}-option-${activeIndex}` : undefined}
                onClick={() => {
                    if (!isOpen) setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
                    setIsOpen(open => !open);
                }}
                onKeyDown={handleKeyDown}
            >
                <span className={!value ? 'admin-select-placeholder' : undefined}>{selectedOption.label}</span>
                <ChevronDown size={16} className="admin-select-chevron" aria-hidden="true" />
            </button>
            {isOpen && menuPosition && createPortal(
                <div ref={menuRef} id={`${generatedId}-options`} className="admin-select-menu" style={menuPosition} role="listbox" aria-label={ariaLabel}>
                    {options.map((option, index) => (
                        <button
                            key={option.value || 'empty-option'}
                            id={`${generatedId}-option-${index}`}
                            type="button"
                            tabIndex={-1}
                            role="option"
                            aria-selected={value === option.value}
                            className={`admin-select-option${activeIndex === index ? ' is-active' : ''}${value === option.value ? ' is-selected' : ''}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => chooseOption(index)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>,
                document.body,
            )}
        </div>
    );
}
