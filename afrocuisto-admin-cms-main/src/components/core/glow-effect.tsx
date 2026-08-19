import React from 'react';

export interface GlowEffectProps {
  colors?: string[];
  mode?: 'rotate' | 'colorShift' | 'flowHorizontal' | 'static';
  blur?: 'soft' | 'medium' | 'strong' | number;
  duration?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
  mode = 'colorShift',
  blur = 'soft',
  duration = 3,
  scale = 0.9,
  className = '',
  style = {},
}) => {
  const getBlurValue = () => {
    if (typeof blur === 'number') return `${blur}px`;
    switch (blur) {
      case 'soft':
        return '18px';
      case 'medium':
        return '30px';
      case 'strong':
        return '45px';
      default:
        return '18px';
    }
  };

  const gradientString = `linear-gradient(135deg, ${colors.join(', ')})`;

  return (
    <div
      className={`absolute inset-0 -z-10 rounded-[inherit] pointer-events-none transition-all ${className}`}
      style={{
        background: gradientString,
        filter: `blur(${getBlurValue()})`,
        transform: `scale(${scale})`,
        animation: `glowShift ${duration}s ease-in-out infinite alternate`,
        opacity: 0.85,
        ...style,
      }}
    />
  );
};
