import React from 'react';
import { Icon, addCollection } from '@iconify/react';
import solarData from './solarIconsData.json';

addCollection(solarData as any);

export interface SolarIconProps {
    size?: number | string;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
    fill?: string;
    strokeWidth?: number;
}

export function SolarIcon({
    name,
    size = 18,
    color,
    className,
    style,
}: SolarIconProps & { name: string }) {
    return (
        <Icon
            icon={`solar:${name}`}
            width={size}
            height={size}
            color={color}
            className={className}
            style={{ flexShrink: 0, ...style }}
        />
    );
}

function createSolarIcon(solarName: string): React.FC<SolarIconProps> {
    const Component: React.FC<SolarIconProps> = ({ size = 18, color, className, style }) => (
        <SolarIcon name={solarName} size={size} color={color} className={className} style={style} />
    );
    Component.displayName = `Solar(${solarName})`;
    return Component;
}

export const Activity = createSolarIcon('pulse-2-linear');
export const AlertCircle = createSolarIcon('danger-circle-linear');
export const AlignJustify = createSolarIcon('list-linear');
export const ArrowDown = createSolarIcon('arrow-down-linear');
export const ArrowLeft = createSolarIcon('arrow-left-linear');
export const ArrowRight = createSolarIcon('arrow-right-linear');
export const ArrowUp = createSolarIcon('arrow-up-linear');
export const ArrowUpRight = createSolarIcon('arrow-right-up-linear');
export const Award = createSolarIcon('medal-ribbons-star-linear');
export const Bell = createSolarIcon('bell-linear');
export const BookOpen = createSolarIcon('book-2-linear');
export const BookText = createSolarIcon('book-bookmark-linear');
export const Bug = createSolarIcon('bug-linear');
export const Calendar = createSolarIcon('calendar-linear');
export const CalendarDays = createSolarIcon('calendar-date-linear');
export const Check = createSolarIcon('check-read-linear');
export const CheckCircle2 = createSolarIcon('check-circle-linear');
export const ChefHat = createSolarIcon('chef-hat-linear');
export const ChevronDown = createSolarIcon('alt-arrow-down-linear');
export const ChevronLeft = createSolarIcon('alt-arrow-left-linear');
export const ChevronRight = createSolarIcon('alt-arrow-right-linear');
export const Clock = createSolarIcon('clock-circle-linear');
export const Copy = createSolarIcon('copy-linear');
export const CreditCard = createSolarIcon('card-linear');
export const Crop = createSolarIcon('crop-linear');
export const Database = createSolarIcon('database-linear');
export const Edit = createSolarIcon('pen-new-square-linear');
export const Edit2 = createSolarIcon('pen-linear');
export const ExternalLink = createSolarIcon('square-top-down-linear');
export const Eye = createSolarIcon('eye-linear');
export const EyeOff = createSolarIcon('eye-closed-linear');
export const Filter = createSolarIcon('filter-linear');
export const Flame = createSolarIcon('fire-linear');
export const GalleryHorizontal = createSolarIcon('gallery-wide-linear');
export const Globe = createSolarIcon('globe-linear');
export const Heart = createSolarIcon('heart-linear');
export const History = createSolarIcon('history-linear');
export const Image = createSolarIcon('gallery-linear');
export const ImagePlus = createSolarIcon('gallery-add-linear');
export const Info = createSolarIcon('info-circle-linear');
export const KeyRound = createSolarIcon('key-linear');
export const Layers = createSolarIcon('layers-linear');
export const LayoutDashboard = createSolarIcon('widget-4-linear');
export const LayoutGrid = createSolarIcon('widget-2-linear');
export const Leaf = createSolarIcon('leaf-linear');
export const ListOrdered = createSolarIcon('list-check-linear');
export const Loader2 = createSolarIcon('refresh-circle-linear');
export const Lock = createSolarIcon('lock-password-linear');
export const LogIn = createSolarIcon('login-2-linear');
export const LogOut = createSolarIcon('logout-2-linear');
export const Mail = createSolarIcon('letter-linear');
export const MapPin = createSolarIcon('map-point-linear');
export const Menu = createSolarIcon('hamburger-menu-linear');
export const MessageSquare = createSolarIcon('chat-round-dots-linear');
export const Moon = createSolarIcon('moon-linear');
export const MoreHorizontal = createSolarIcon('menu-dots-linear');
export const MoreVertical = createSolarIcon('menu-dots-bold');
export const Plus = createSolarIcon('add-circle-linear');
export const PlusCircle = createSolarIcon('add-circle-linear');
export const Quote = createSolarIcon('quote-linear');
export const RefreshCw = createSolarIcon('restart-linear');
export const RotateCcw = createSolarIcon('undo-left-round-linear');
export const Save = createSolarIcon('diskette-linear');
export const Search = createSolarIcon('magnifier-linear');
export const Send = createSolarIcon('plain-linear');
export const Settings = createSolarIcon('settings-linear');
export const Share2 = createSolarIcon('share-linear');
export const ShieldAlert = createSolarIcon('shield-warning-linear');
export const ShieldCheck = createSolarIcon('shield-check-linear');
export const ShoppingBasket = createSolarIcon('bag-4-linear');
export const Smartphone = createSolarIcon('smartphone-linear');
export const Sparkles = createSolarIcon('stars-minimalistic-linear');
export const Star = createSolarIcon('star-linear');
export const Sun = createSolarIcon('sun-2-linear');
export const Tag = createSolarIcon('tag-linear');
export const Trash2 = createSolarIcon('trash-bin-trash-linear');
export const TrendingUp = createSolarIcon('graph-up-linear');
export const Trophy = createSolarIcon('cup-star-linear');
export const User = createSolarIcon('user-linear');
export const UserCheck = createSolarIcon('user-check-linear');
export const UserPlus = createSolarIcon('user-plus-linear');
export const Users = createSolarIcon('users-group-rounded-linear');
export const Utensils = createSolarIcon('fork-knife-linear');
export const Wand2 = createSolarIcon('magic-stick-linear');
export const X = createSolarIcon('close-circle-linear');
export const XCircle = createSolarIcon('close-circle-linear');
export const Youtube = createSolarIcon('video-frame-play-horizontal-linear');
export const Zap = createSolarIcon('bolt-linear');
export const ZoomIn = createSolarIcon('magnifier-zoom-in-linear');
export const ZoomOut = createSolarIcon('magnifier-zoom-out-linear');
